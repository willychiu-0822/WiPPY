import { computeRetrievability } from '../memory/retrievability';
import type { PriorityResult, SelectionCandidate } from './types';
import { clamp01 } from './types';
import { selectionValueScore } from './eligibility';

function learningGain(retrievability: number): number {
  if (retrievability < 0.35) {
    return 0.4;
  }
  if (retrievability <= 0.8) {
    return 1;
  }
  if (retrievability <= 0.9) {
    return 0.5;
  }
  return 0.1;
}

export function computePriority(candidate: SelectionCandidate, now: Date): PriorityResult {
  const retrievability = clamp01(computeRetrievability(candidate.memory, now));
  const valueScore = selectionValueScore(candidate);
  const gain = learningGain(retrievability);
  const uncertaintyContribution = Math.min(0.1, clamp01(candidate.memory.uncertainty) * 0.1);
  const transferContribution = 0.1 * clamp01(candidate.transferGap);
  const sourceContribution = 0.05 * candidate.currentSourceFit;
  const penalties =
    0.12 * clamp01(candidate.recentExposurePenalty) +
    0.08 * clamp01(candidate.redundancyPenalty) +
    0.15 * clamp01(candidate.ambiguityRisk);
  const score = valueScore * 0.55 + gain * 0.25 + uncertaintyContribution + transferContribution + sourceContribution - penalties;

  return {
    score,
    reasons: [
      `value:${valueScore.toFixed(3)}`,
      `retrievability:${retrievability.toFixed(3)}`,
      `gain:${gain.toFixed(3)}`,
    ],
    recommendedSupport: retrievability < 0.35 ? 'hint_1' : 'none',
  };
}
