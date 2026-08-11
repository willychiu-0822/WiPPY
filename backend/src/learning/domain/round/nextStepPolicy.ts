import type { AttemptRecord, Facet, MemoryTarget, RoundUnit } from '../model';

export type NextStepDecision =
  | { kind: 'complete_unit' }
  | { kind: 'next_challenge'; facet: Facet; target: MemoryTarget };

export interface ChooseNextStepInput {
  unit: RoundUnit;
  attempt: AttemptRecord;
  validPriorAttempts: AttemptRecord[];
  invalidatedAttemptIds: Set<string>;
  totalStepCount: number;
}

function hasValidNovelEvidence(input: ChooseNextStepInput): boolean {
  return input.validPriorAttempts.some(
    (attempt) =>
      !input.invalidatedAttemptIds.has(attempt.id) &&
      attempt.itemId === input.attempt.itemId &&
      attempt.facet === input.attempt.facet &&
      attempt.target === 'novel_context_recognition' &&
      attempt.supportLevel === 'none' &&
      attempt.correct,
  );
}

export function chooseNextStep(input: ChooseNextStepInput): NextStepDecision {
  if (input.attempt.skipped || input.unit.role === 'additional') {
    return { kind: 'complete_unit' };
  }
  if (input.unit.stepCount >= input.unit.maxSteps || input.totalStepCount >= 5) {
    return { kind: 'complete_unit' };
  }
  if (
    input.attempt.correct &&
    input.attempt.supportLevel === 'none' &&
    (input.attempt.target === 'novel_context_recognition' || hasValidNovelEvidence(input))
  ) {
    return { kind: 'complete_unit' };
  }
  if (input.attempt.correct && input.attempt.supportLevel === 'none') {
    return { kind: 'next_challenge', facet: input.attempt.facet, target: 'novel_context_recognition' };
  }
  return { kind: 'next_challenge', facet: input.attempt.facet, target: 'novel_context_recognition' };
}
