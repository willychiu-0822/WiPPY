import type { Firestore, Timestamp } from 'firebase-admin/firestore';
import type { HarnessStage, TraceEvent, TraceEventType } from '../types';
import type { LLMMessage } from './llmProvider';

export type TraceStage = HarnessStage | 'orchestrator';

/**
 * Accumulates a structured, replayable trace of one harness run.
 *
 * Events are buffered in memory and flushed to the
 * `harnessRuns/{runId}/events/{seq}` subcollection in batches — typically at
 * each stage boundary. This keeps cost low (no per-event round-trip) while
 * still surviving a mid-run crash: everything up to the last flushed stage is
 * preserved. The `catch` path in the orchestrator must always `await flush()`
 * before rethrowing.
 *
 * LLM input/output is stored verbatim (never truncated) — reproducing the exact
 * prompt and raw reply is the whole point of the trace.
 */
export class RunTracer {
  private seq = 0;
  private buffer: TraceEvent[] = [];
  private readonly stageStart = new Map<string, number>();

  constructor(
    private readonly db: Firestore,
    private readonly runId: string,
    private readonly ttlExpiry: Timestamp,
  ) {}

  private push(
    stage: TraceStage,
    type: TraceEventType,
    payload: Record<string, unknown>,
    opts?: { durationMs?: number; now?: number },
  ): void {
    this.buffer.push({
      seq: this.seq++,
      stage,
      type,
      timestampMs: opts?.now ?? Date.now(),
      ...(opts?.durationMs !== undefined ? { durationMs: opts.durationMs } : {}),
      payload,
      ttlExpiry: this.ttlExpiry,
    });
  }

  stageEnter(stage: TraceStage): void {
    const now = Date.now();
    this.stageStart.set(stage, now);
    this.push(stage, 'stage_enter', {}, { now });
  }

  stageExit(stage: TraceStage): void {
    const now = Date.now();
    const start = this.stageStart.get(stage);
    const durationMs = start !== undefined ? now - start : undefined;
    this.stageStart.delete(stage);
    this.push(stage, 'stage_exit', {}, { durationMs, now });
  }

  /** Full LLM I/O — input messages and raw output are stored without truncation. */
  llmCall(stage: TraceStage, input: LLMMessage[], output: string, durationMs: number): void {
    this.push(
      stage,
      'llm_call',
      {
        input: input.map((m) => ({ role: m.role, content: m.content })),
        output,
        inputMessageCount: input.length,
        outputLength: output.length,
      },
      { durationMs },
    );
  }

  validation(stage: TraceStage, valid: boolean, feedback: string): void {
    this.push(stage, 'validation', { valid, feedback });
  }

  repair(stage: TraceStage, prompt: string, output: string): void {
    this.push(stage, 'repair', { prompt, output });
  }

  persist(stage: TraceStage, messageIds: string[], knowledgeIds: string[], batchIndex?: number): void {
    this.push(stage, 'persist', {
      messageIds,
      knowledgeIds,
      ...(batchIndex !== undefined ? { batchIndex } : {}),
    });
  }

  error(stage: TraceStage, err: unknown): void {
    const e = err as { message?: string; stack?: string } | undefined;
    this.push(stage, 'error', {
      message: e?.message ?? String(err),
      stack: e?.stack ?? null,
    });
  }

  /** Persist all buffered events in a single batch and clear the buffer. */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const pending = this.buffer;
    this.buffer = [];
    const eventsCol = this.db.collection('harnessRuns').doc(this.runId).collection('events');
    const batch = this.db.batch();
    for (const ev of pending) {
      batch.set(eventsCol.doc(String(ev.seq).padStart(6, '0')), ev);
    }
    await batch.commit();
  }
}
