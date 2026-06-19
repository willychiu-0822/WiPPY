import type { Firestore } from 'firebase-admin/firestore';
import type { AgentIntent } from '../../types';
import type { ContextEnvelope } from '../../services/contextBuilder';
import type { BatchCommitInfo } from '../../services/persistenceAdapter';

// ─── Parsed shapes ──────────────────────────────────────────────────────────

export interface GeneratedMessageDraft {
  content: string;
  targetGroups: string[];
  triggerValue: string;
  sequenceOrder: number;
}

export interface ParsedKnowledgeItem {
  knowledgeType: string;
  title: string;
  content: string;
}

// ─── Handler contract ───────────────────────────────────────────────────────

export interface ValidationOutcome {
  valid: boolean;
  feedback: string;
}

export interface IntentPersistResult {
  savedCount: number;
  ids: string[];
  batchCount: number;
}

/** Everything a handler needs to write its side effects, minus the parsed payload. */
export interface PersistMeta {
  activityId: string;
  userId: string;
  runId: string;
  agentSessionId: string;
  activityTargetGroups: string[];
  onBatchCommitted?: (info: BatchCommitInfo) => void;
}

/**
 * One intent = one handler. Adding a feature means adding a handler file and
 * registering it — the orchestrator stays a pure pipeline.
 */
export interface IntentHandler<TParsed = unknown> {
  readonly name: AgentIntent;
  /** Parse this intent from the raw LLM reply; return null if it does not apply. */
  detect(rawReply: string): TParsed | null;
  /** Validate parsed output; `feedback` feeds the repair loop. */
  validate(parsed: TParsed, ctx: ContextEnvelope): ValidationOutcome;
  /** Write side effects. */
  persist(db: Firestore, parsed: TParsed, meta: PersistMeta): Promise<IntentPersistResult>;
  /** Build the user-facing reply. */
  finalize(rawReply: string, parsed: TParsed, result: IntentPersistResult): string;
  /** Optional format reminder injected into the repair prompt. */
  repairHint?(): string;
}

/** Type-erased handler for the registry array (each handler is concretely typed). */
export type AnyIntentHandler = IntentHandler<any>;
