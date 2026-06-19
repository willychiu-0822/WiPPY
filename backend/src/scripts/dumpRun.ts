import 'dotenv/config';
import { getDb } from '../firebase';
import type { HarnessRun, TraceEvent } from '../types';

// CLI: dump one harness run's full trace as a markdown "crime scene" that can be
// pasted straight into Claude Code / Codex for debugging.
//
//   npm run dump:run -- <runId>
//   npx ts-node src/scripts/dumpRun.ts <runId>

interface LLMInputMessage {
  role: string;
  content: string;
}

function fence(content: string): string {
  // Pick a fence longer than any backtick run inside the content so it never breaks.
  const longest = (content.match(/`+/g) ?? ['']).reduce((a, b) => (b.length > a.length ? b : a), '');
  const fenceStr = '`'.repeat(Math.max(3, longest.length + 1));
  return `${fenceStr}\n${content}\n${fenceStr}`;
}

export function renderRunDump(runId: string, run: HarnessRun, events: TraceEvent[]): string {
  const t0 = events.length > 0 ? events[0].timestampMs : 0;
  const tEnd = events.length > 0 ? events[events.length - 1].timestampMs : 0;
  const rel = (ms: number) => `+${ms - t0}ms`;

  const llmCalls = events.filter((e) => e.type === 'llm_call');
  const errorEvent = events.find((e) => e.type === 'error');

  const lines: string[] = [];

  // ── Header ──
  lines.push(`# Run ${runId}  [${run.status}]  intent=${run.intentType}`);
  lines.push(
    `activity=${run.activityId} user=${run.userId} session=${run.sessionId || '-'}  ` +
      `llmCalls=${llmCalls.length}  duration=${tEnd - t0}ms  events=${events.length}`,
  );
  lines.push('');

  // ── Timeline ──
  lines.push('## Timeline');
  let llmIdx = 0;
  for (const ev of events) {
    const p = ev.payload as Record<string, unknown>;
    const at = `- [${rel(ev.timestampMs).padStart(8)}] ${ev.stage}`;
    switch (ev.type) {
      case 'stage_enter':
        lines.push(`${at} ▶ enter`);
        break;
      case 'stage_exit':
        lines.push(`${at} ■ exit${ev.durationMs !== undefined ? ` (${ev.durationMs}ms)` : ''}`);
        break;
      case 'llm_call':
        llmIdx += 1;
        lines.push(`${at} → LLM call #${llmIdx} (${ev.durationMs ?? '?'}ms, out ${p.outputLength ?? '?'} chars)`);
        break;
      case 'validation':
        lines.push(`${at} validate: ${p.valid ? 'OK' : `FAILED — ${p.feedback as string}`}`);
        break;
      case 'repair':
        lines.push(`${at} repair`);
        break;
      case 'persist': {
        const msgs = (p.messageIds as string[] | undefined) ?? [];
        const know = (p.knowledgeIds as string[] | undefined) ?? [];
        lines.push(`${at} persist batch#${p.batchIndex ?? '?'} messages=[${msgs.join(', ')}] knowledge=[${know.join(', ')}]`);
        break;
      }
      case 'error':
        lines.push(`${at} ✖ ERROR: ${p.message as string}`);
        break;
    }
  }
  lines.push('');

  // ── Full LLM I/O ──
  llmIdx = 0;
  for (const ev of llmCalls) {
    llmIdx += 1;
    const p = ev.payload as Record<string, unknown>;
    const input = (p.input as LLMInputMessage[] | undefined) ?? [];
    const isRepair = llmIdx > 1; // call #1 is the planner; later calls are repairs
    lines.push(`## LLM Call #${llmIdx}${isRepair ? ' (repair)' : ''}  —  ${ev.stage} (${ev.durationMs ?? '?'}ms)`);
    lines.push('### Input (system + history + user)');
    for (const m of input) {
      lines.push(`**[${m.role}]**`);
      lines.push(fence(m.content));
    }
    lines.push('### Raw Output');
    lines.push(fence((p.output as string | undefined) ?? ''));
    lines.push('');
  }

  // ── Error ──
  if (errorEvent) {
    const p = errorEvent.payload as Record<string, unknown>;
    lines.push('## Error');
    lines.push(`**stage:** ${errorEvent.stage}`);
    lines.push(`**message:** ${p.message as string}`);
    if (p.stack) lines.push(fence(p.stack as string));
    lines.push('');
  }

  return lines.join('\n');
}

export async function dumpRun(runId: string): Promise<string> {
  const db = getDb();
  const runRef = db.collection('harnessRuns').doc(runId);
  const runSnap = await runRef.get();
  if (!runSnap.exists) return `Run ${runId} not found.`;
  const run = runSnap.data() as HarnessRun;

  const eventsSnap = await runRef.collection('events').orderBy('seq', 'asc').get();
  const events = eventsSnap.docs.map((d) => d.data() as TraceEvent);

  return renderRunDump(runId, run, events);
}

async function main(): Promise<void> {
  const runId = process.argv[2];
  if (!runId) {
    console.error('Usage: npm run dump:run -- <runId>');
    process.exit(1);
  }
  const markdown = await dumpRun(runId);
  console.log(markdown);
}

// Only run when invoked directly (not when imported by a test).
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
