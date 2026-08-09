import type { SelectionCandidate, EligibilityResult } from './types';
import { clamp01 } from './types';

function valueScore(candidate: SelectionCandidate): number {
  const { item } = candidate;
  return (
    0.3 * clamp01(item.value.personal) +
    0.25 * clamp01(item.value.transfer) +
    0.25 * clamp01(item.value.comprehension) +
    0.2 * clamp01(item.value.recurrence)
  );
}

export function isEligible(candidate: SelectionCandidate, now: Date): EligibilityResult {
  if (candidate.item.senseStatus !== 'resolved') {
    return { eligible: false, reason: 'unresolved_sense' };
  }
  if (candidate.item.qualityStatus !== 'verified') {
    return { eligible: false, reason: 'unverified_quality' };
  }
  if (candidate.item.excludedByUser) {
    return { eligible: false, reason: 'excluded' };
  }
  if (clamp01(candidate.contextQuality) < 0.7) {
    return { eligible: false, reason: 'low_context_quality' };
  }
  if (
    candidate.memory.cooldownUntil !== null &&
    new Date(candidate.memory.cooldownUntil).getTime() > now.getTime()
  ) {
    return { eligible: false, reason: 'cooldown' };
  }
  if (!candidate.item.facets.includes(candidate.facet)) {
    return { eligible: false, reason: 'missing_applicable_facet' };
  }

  const score = valueScore(candidate);
  const passesValueGate =
    score >= 0.45 ||
    clamp01(candidate.item.value.comprehension) >= 0.8 ||
    clamp01(candidate.item.value.recurrence) >= 0.8 ||
    candidate.item.explicitRecognitionGoal;

  if (!passesValueGate) {
    return { eligible: false, reason: 'low_value' };
  }

  return { eligible: true, reason: 'eligible' };
}

export const selectionValueScore = valueScore;
