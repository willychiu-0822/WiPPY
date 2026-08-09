import type { AttemptResultView, EvidenceSummaryView, PublicLearningChallenge } from '../api/types';

export interface ChallengeDraft {
  firstAnswerId: string | null;
  finalAnswerId: string | null;
  shownHints: 0 | 1 | 2;
  answerRevealed: boolean;
  skipped: boolean;
  activeElapsedMs: number;
  visibleSinceMs: number | null;
}

export type RoundUiState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'answering'; challenge: PublicLearningChallenge; draft: ChallengeDraft; evidence: EvidenceSummaryView[] }
  | { kind: 'submitting'; challenge: PublicLearningChallenge; draft: ChallengeDraft; evidence: EvidenceSummaryView[] }
  | { kind: 'feedback'; challenge: PublicLearningChallenge; result: AttemptResultView; evidence: EvidenceSummaryView[] }
  | { kind: 'reporting'; challenge: PublicLearningChallenge; afterAttempt: boolean; evidence: EvidenceSummaryView[] }
  | { kind: 'complete'; evidence: EvidenceSummaryView[] }
  | { kind: 'error'; message: string; recoverable: boolean };

export function emptyDraft(nowMs: number): ChallengeDraft {
  return {
    firstAnswerId: null,
    finalAnswerId: null,
    shownHints: 0,
    answerRevealed: false,
    skipped: false,
    activeElapsedMs: 0,
    visibleSinceMs: nowMs,
  };
}

export function updateAnswer(draft: ChallengeDraft, optionId: string): ChallengeDraft {
  return {
    ...draft,
    firstAnswerId: draft.firstAnswerId ?? optionId,
    finalAnswerId: optionId,
  };
}

export function showNextHint(draft: ChallengeDraft, hintCount: number): ChallengeDraft {
  return {
    ...draft,
    shownHints: Math.min(2, Math.min(hintCount, draft.shownHints + 1)) as 0 | 1 | 2,
  };
}

export function cappedElapsedMs(draft: ChallengeDraft, nowMs: number): number | null {
  if (draft.visibleSinceMs === null) return null;
  return Math.min(1_800_000, Math.max(0, draft.activeElapsedMs + nowMs - draft.visibleSinceMs));
}
