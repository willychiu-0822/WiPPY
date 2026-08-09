export type LearningFacet = 'meaning' | 'chunk' | 'syntax' | 'pragmatics';
export type LearningSupportLevel = 'none' | 'hint_1' | 'hint_2' | 'answer' | 'skip';
export type LearningEvidenceStage =
  | 'explained'
  | 'immediate_source'
  | 'immediate_novel'
  | 'delayed_source'
  | 'delayed_novel'
  | 'organic_reencounter';
export type LearningRunStatus = 'pending_enqueue' | 'queued' | 'running' | 'publishing' | 'retryable' | 'completed' | 'failed';

export interface CreateLearningSourceRequest {
  requestId: string;
  title: string;
  author?: string;
  url?: string;
  learningObjective?: string;
  body: string;
}

export interface LearningSourceView {
  id: string;
  title: string;
  author: string | null;
  url: string | null;
  learningObjective: string | null;
  paragraphs: Array<{ id: string; order: number; text: string }>;
  verifiedItemCount: number;
}

export interface LearningRunView {
  id: string;
  sourceId: string;
  status: LearningRunStatus;
  counts: { segments: number; items: number; occurrences: number; verifiedItems: number } | null;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicLearningChallenge {
  id: string;
  facet: LearningFacet;
  taskMode: 'meaning_choice' | 'chunk_choice' | 'syntax_choice' | 'pragmatics_choice';
  promptZh: string;
  excerptEn: string;
  options: Array<{ id: string; text: string }>;
  hints: string[];
  contextProvenance: 'source' | 'scheduled_authentic' | 'synthetic';
  recommendedSupport: 'none' | 'hint_1';
}

export interface SubmitLearningAttemptRequest {
  challengeId: string;
  firstAnswerId: string | null;
  finalAnswerId: string | null;
  supportLevel: LearningSupportLevel;
  answerRevealed: boolean;
  skipped: boolean;
  responseMs: number | null;
}

export interface EvidenceSummaryView {
  headline: string;
  details: string[];
  strongestStage: LearningEvidenceStage;
}

export interface ChallengeFeedbackView {
  correctOptionId: string;
  explanationZh: string;
  decisiveCluesZh: string[];
  optionExplanations: Array<{ optionId: string; explanationZh: string }>;
  evidence: Array<{ sourceType: string; sourceName: string; locator: string }>;
  ambiguityNoteZh: string | null;
}

export interface AttemptResultView {
  feedback: ChallengeFeedbackView;
  evidence: EvidenceSummaryView;
  replayed: boolean;
  nextChallenge: PublicLearningChallenge | null;
  roundComplete: boolean;
}

export interface ChallengeReportRequest {
  issue: 'ambiguous' | 'wrong_evidence' | 'other';
  detail?: string | null;
}

export interface ChallengeReportResultView {
  suspended: true;
  evidenceInvalidated: boolean;
  nextChallenge: PublicLearningChallenge | null;
  roundComplete: boolean;
}

export interface LearningRoundView {
  roundId: string;
  challenge: PublicLearningChallenge | null;
  roundComplete: boolean;
}

export interface KnowledgePageView {
  items: Array<{
    id: string;
    expression: string;
    senseKey: string;
    senseStatus: string;
    qualityStatus: string;
    occurrenceCount?: number;
    sourceTitles?: string[];
    excludedByUser?: boolean;
    challengeabilityLabel?: string;
    facets: Array<{ facet: LearningFacet; label: string; evidence: EvidenceSummaryView | null }>;
  }>;
  nextCursor: string | null;
}

export interface LearningApi {
  getAccess(): Promise<{ enabled: boolean }>;
  createSource(input: CreateLearningSourceRequest): Promise<{ sourceId: string; runId: string; status: LearningRunStatus }>;
  getSource(sourceId: string): Promise<LearningSourceView>;
  getRun(runId: string): Promise<LearningRunView>;
  retryRun(runId: string): Promise<LearningRunView>;
  createRound(input: { sourceId?: string }): Promise<LearningRoundView>;
  submitAttempt(input: SubmitLearningAttemptRequest): Promise<AttemptResultView>;
  reportChallenge(challengeId: string, input: ChallengeReportRequest): Promise<ChallengeReportResultView>;
  listKnowledge(input: { limit: number; cursor?: string }): Promise<KnowledgePageView>;
  setKnowledgeExcluded(itemId: string, excludedByUser: boolean): Promise<{ excludedByUser: boolean }>;
}
