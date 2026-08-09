import type {
  AttemptRecord,
  ChallengeBlueprint,
  ChallengeIssue,
  Facet,
  FacetMemory,
  InternalChallenge,
  KnowledgeItem,
  MemoryTarget,
  Occurrence,
  OccurrenceLink,
  RoundUnit,
  SourceContextRef,
} from '../domain/model';
import type { SelectionCandidate } from '../domain/selection/types';

export interface ExtractedUnit {
  item: KnowledgeItem;
  occurrence: Occurrence;
  link: OccurrenceLink;
}

export interface CreateSourceInput {
  userId: string;
  requestId: string;
  title: string;
  author: string | null;
  url: string | null;
  objective: string | null;
  createdAt: string;
  segments: Array<{ ordinal: number; text: string }>;
}

export interface LearningSourceView {
  id: string;
  userId: string;
  title: string;
  author: string | null;
  url: string | null;
  objective: string | null;
  status: 'processing' | 'completed' | 'failed';
  verifiedItemCount: number;
  segments: Array<{ id: string; ordinal: number; text: string }>;
  createdAt: string;
}

export interface LearningRunView {
  id: string;
  sourceId: string;
  status:
    | 'pending_enqueue'
    | 'queued'
    | 'running'
    | 'publishing'
    | 'retryable'
    | 'completed'
    | 'failed'
    | 'queue_unavailable';
  capturedItemCount: number;
  verifiedItemCount: number;
  safeErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SourceSegmentView {
  id: string;
  ordinal: number;
  text: string;
}

export interface CaptureBatchInput {
  userId: string;
  runId: string;
  sourceId: string;
  sourceVersionId: string;
  batchId: string;
  capturedAt: string;
  units: ExtractedUnit[];
  facetStates: FacetMemory[];
}

export interface CompleteRunInput {
  userId: string;
  runId: string;
  sourceId: string;
  sourceVersionId: string;
  completedAt: string;
  capturedItemCount: number;
  verifiedItemCount: number;
}

export interface FailRunInput {
  userId: string;
  runId: string;
  failedAt: string;
  safeErrorCode: string;
}

export interface ClaimRunEnqueueInput {
  userId: string;
  runId: string;
  workerId: string;
  claimedAt: string;
  leaseUntil: string;
}

export interface FinishRunEnqueueInput {
  userId: string;
  runId: string;
  workerId: string;
  finishedAt: string;
  accepted: boolean;
}

export interface ClaimRunInput {
  userId: string;
  runId: string;
  workerId: string;
  claimedAt: string;
  leaseUntil: string;
}

export interface ClaimedLearningRun {
  userId: string;
  runId: string;
  sourceId: string;
  sourceVersionId: string;
}

export interface SaveRoundInput {
  userId: string;
  roundId: string;
  createdAt: string;
  units: RoundUnit[];
  firstChallenge: InternalChallenge | null;
}

export interface RoundStateView {
  id: string;
  userId: string;
  status: 'active' | 'completed';
  currentChallengeId: string | null;
}

export interface AttemptTransitionInput {
  userId: string;
  roundId: string;
  challenge: InternalChallenge;
  attempt: AttemptRecord;
  updatedMemory: FacetMemory;
  nextChallenge: InternalChallenge | null;
  roundComplete: boolean;
  occurredAt: string;
}

export interface ReportTransitionInput {
  userId: string;
  roundId: string;
  challenge: InternalChallenge;
  issue: ChallengeIssue;
  detail: string | null;
  invalidatedAttemptId: string | null;
  nextChallenge: InternalChallenge | null;
  roundComplete: boolean;
  occurredAt: string;
}

export interface RoundTransitionResult {
  replayed: boolean;
  nextChallengeId: string | null;
  roundComplete: boolean;
}

export interface KnowledgeRecordPage {
  items: KnowledgeItem[];
  nextCursor: string | null;
}

export interface LearningRepository {
  hasLearningAccess(userId: string): Promise<boolean>;
  createSourceAndRun(input: CreateSourceInput): Promise<{
    sourceId: string;
    sourceVersionId: string;
    runId: string;
  }>;
  getSource(userId: string, sourceId: string): Promise<LearningSourceView | null>;
  getSourceSpan(userId: string, input: { segmentId: string; startOffset: number; endOffset: number }): Promise<string | null>;
  findChallengeContext(userId: string, input: {
    itemId: string;
    sourceId: string | null;
    provenance: 'source' | 'scheduled_authentic';
    excludedFingerprints: string[];
  }): Promise<SourceContextRef | null>;
  getRun(userId: string, runId: string): Promise<LearningRunView | null>;
  listRunsNeedingEnqueue(nowIso: string, limit: number): Promise<Array<{ userId: string; runId: string }>>;
  claimRunEnqueue(input: ClaimRunEnqueueInput): Promise<'claimed' | 'already_active' | 'completed'>;
  finishRunEnqueue(input: FinishRunEnqueueInput): Promise<void>;
  claimRun(input: ClaimRunInput): Promise<ClaimedLearningRun | null>;
  listSourceSegments(userId: string, sourceVersionId: string): Promise<SourceSegmentView[]>;
  saveCaptureBatch(input: CaptureBatchInput): Promise<void>;
  completeRun(input: CompleteRunInput): Promise<void>;
  failRun(input: FailRunInput): Promise<void>;
  listSelectionCandidates(userId: string, input: { nowIso: string; limit: number; currentSourceId: string | null }): Promise<SelectionCandidate[]>;
  getKnowledgeItem(userId: string, itemId: string): Promise<KnowledgeItem | null>;
  saveRound(input: SaveRoundInput): Promise<{ roundId: string; firstChallengeId: string | null }>;
  getRoundState(userId: string, roundId: string): Promise<RoundStateView | null>;
  getInternalChallenge(userId: string, challengeId: string): Promise<InternalChallenge | null>;
  listAttemptEvidenceContext(userId: string, itemId: string, facet: Facet): Promise<{
    attempts: AttemptRecord[];
    invalidatedAttemptIds: string[];
  }>;
  recordAttemptAndAdvance(input: AttemptTransitionInput): Promise<RoundTransitionResult>;
  suspendChallengeReportAndAdvance(input: ReportTransitionInput): Promise<RoundTransitionResult>;
  listKnowledgeRecords(userId: string, input: { limit: number; cursor: string | null }): Promise<KnowledgeRecordPage>;
  setExcludedByUser(userId: string, itemId: string, excluded: boolean): Promise<boolean>;
}

export interface LanguageExtractor {
  extract(input: { userId: string; sourceId: string; sourceVersionId: string; segmentId: string; text: string }): Promise<ExtractedUnit[]>;
}

export interface ChallengeBuilder {
  build(input: {
    item: KnowledgeItem;
    facet: Facet;
    target: MemoryTarget;
    stage: import('../domain/model').EvidenceStage;
    recommendedSupport: 'none' | 'hint_1';
    excludedContextFingerprints: string[];
    sourceContext: SourceContextRef | null;
  }): Promise<ChallengeBlueprint | null>;
}

export interface LearningQueue {
  enqueue(input: { userId: string; runId: string }): Promise<void>;
}
