export type Facet = 'meaning' | 'chunk' | 'syntax' | 'pragmatics';
export type MemoryTarget = 'source_recognition' | 'novel_context_recognition';
export type EvidenceStage =
  | 'explained'
  | 'immediate_source'
  | 'immediate_novel'
  | 'delayed_source'
  | 'delayed_novel'
  | 'organic_reencounter';
export type SupportLevel = 'none' | 'hint_1' | 'hint_2' | 'answer' | 'skip';
export type ContextProvenance = 'source' | 'scheduled_authentic' | 'synthetic';
export type KnowledgeKind = 'word' | 'collocation' | 'syntax' | 'pragmatics';
export type SenseStatus = 'resolved' | 'unresolved';
export type QualityStatus = 'verified' | 'unresolved' | 'suspended';
export type ChallengeStatus = 'active' | 'answered' | 'suspended';
export type ChallengeIssue = 'ambiguous' | 'wrong_evidence' | 'other';
export type RoundUnitRole = 'main' | 'additional';
export type NextStepPolicy = 'adaptive_minimum' | 'single_step';
export type RecognitionTaskMode =
  | 'meaning_choice'
  | 'chunk_choice'
  | 'syntax_choice'
  | 'pragmatics_choice';

export interface ValueSignals {
  personal: number;
  transfer: number;
  comprehension: number;
  recurrence: number;
  productiveIntent: 0;
}

export interface LanguageEvidence {
  sourceType: 'source_span' | 'dictionary' | 'corpus' | 'syntax' | 'synthetic';
  sourceName: string;
  locator: string;
  excerpt?: string;
}

export interface KnowledgeItem {
  id: string;
  expression: string;
  normalizedForm: string;
  senseKey: string;
  senseStatus: SenseStatus;
  qualityStatus: QualityStatus;
  kind: KnowledgeKind;
  facets: Facet[];
  value: ValueSignals;
  evidence: LanguageEvidence[];
  explicitRecognitionGoal: boolean;
  excludedByUser: boolean;
  createdAt: string;
}

export interface Occurrence {
  id: string;
  segmentId: string;
  surfaceForm: string;
  startOffset: number;
  endOffset: number;
  provenance: 'source';
}

export interface OccurrenceLink {
  occurrenceId: string;
  itemId: string;
}

export interface FacetMemory {
  itemId: string;
  facet: Facet;
  target: MemoryTarget;
  halfLifeHours: number;
  uncertainty: number;
  lastEvidenceAt: string | null;
  cooldownUntil: string | null;
  immediateUnaidedSuccesses: number;
  delayedUnaidedSuccesses: number;
}

export interface SourceContextRef {
  provenance: 'source' | 'scheduled_authentic';
  sourceId: string;
  sourceVersionId: string;
  segmentId: string;
  startOffset: number;
  endOffset: number;
  contextFingerprint: string;
  contextQuality: number;
  contextNovelty: number;
}

interface ChallengeBase {
  facet: Facet;
  target: MemoryTarget;
  stage: EvidenceStage;
  taskMode: RecognitionTaskMode;
  promptZh: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  hints: string[];
  recommendedSupport: 'none' | 'hint_1';
  explanationZh: string;
  decisiveCluesZh: string[];
  optionExplanations: Array<{ optionId: string; explanationZh: string }>;
  ambiguityNoteZh: string | null;
  evidence: LanguageEvidence[];
  contextNovelty: number;
}

export type ChallengeBlueprint = ChallengeBase &
  (
    | {
        contextProvenance: 'synthetic';
        templateId: string;
        excerptEn: string;
        contextFingerprint: string;
        contextQuality: number;
      }
    | {
        contextProvenance: 'source' | 'scheduled_authentic';
        segmentId: string;
        startOffset: number;
        endOffset: number;
        contextFingerprint: string;
        contextQuality: number;
      }
  );

export interface RoundUnit {
  id: string;
  sessionId: string;
  itemId: string;
  role: RoundUnitRole;
  nextStepPolicy: NextStepPolicy;
  status: 'pending' | 'active' | 'complete';
  attemptedFacets: Facet[];
  stepCount: number;
  maxSteps: 1 | 3;
  initialPlan: ChallengeBlueprint;
}

export type InternalChallenge = ChallengeBlueprint & {
  id: string;
  sessionId: string;
  unitId: string;
  itemId: string;
  status: ChallengeStatus;
  isOldItem: boolean;
};

export interface PublicChallenge {
  id: string;
  facet: Facet;
  taskMode: RecognitionTaskMode;
  excerptEn: string;
  promptZh: string;
  options: Array<{ id: string; text: string }>;
  hints: string[];
  contextProvenance: ContextProvenance;
  recommendedSupport: 'none' | 'hint_1';
}

export interface AttemptInput {
  challengeId: string;
  firstAnswerId: string | null;
  finalAnswerId: string | null;
  supportLevel: SupportLevel;
  answerRevealed: boolean;
  skipped: boolean;
  responseMs: number | null;
}

export interface AttemptRecord extends AttemptInput {
  id: string;
  sessionId: string;
  unitId: string;
  itemId: string;
  facet: Facet;
  target: MemoryTarget;
  stage: EvidenceStage;
  contextProvenance: ContextProvenance;
  contextNovelty: number;
  contextFingerprint: string;
  correct: boolean;
  occurredAt: string;
  answerHash: string;
}
