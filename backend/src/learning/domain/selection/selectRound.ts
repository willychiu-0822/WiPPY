import { isEligible } from './eligibility';
import { computePriority } from './priority';
import type { SelectRoundInput, SelectedRoundUnit, SelectionCandidate } from './types';

function compareCandidates(now: Date) {
  return (left: SelectionCandidate, right: SelectionCandidate): number => {
    const priorityDiff = computePriority(right, now).score - computePriority(left, now).score;
    if (Math.abs(priorityDiff) > 0.000_001) {
      return priorityDiff;
    }
    return left.item.id.localeCompare(right.item.id);
  };
}

function bestCandidatePerItem(candidates: SelectionCandidate[], now: Date): SelectionCandidate[] {
  const grouped = new Map<string, SelectionCandidate[]>();
  for (const candidate of candidates) {
    const existing = grouped.get(candidate.item.id) ?? [];
    existing.push(candidate);
    grouped.set(candidate.item.id, existing);
  }

  return Array.from(grouped.values())
    .map((itemCandidates) => [...itemCandidates].sort(compareCandidates(now))[0])
    .sort(compareCandidates(now));
}

function unit(
  candidate: SelectionCandidate,
  role: 'main' | 'additional',
): SelectedRoundUnit {
  return {
    itemId: candidate.item.id,
    initialCandidate: candidate,
    role,
    nextStepPolicy: role === 'main' ? 'adaptive_minimum' : 'single_step',
    maxSteps: role === 'main' ? 3 : 1,
  };
}

export function selectRoundUnits(
  candidates: SelectionCandidate[],
  input: SelectRoundInput,
  now: Date,
): SelectedRoundUnit[] {
  const eligible = candidates.filter((candidate) => isEligible(candidate, now).eligible);
  const byItem = bestCandidatePerItem(eligible, now);
  const mainPool =
    input.currentSourceId === null
      ? byItem
      : byItem.filter((candidate) => candidate.currentSourceFit === 1);

  if (mainPool.length === 0) {
    return [];
  }

  const newMain = mainPool.find((candidate) => candidate.attemptCount === 0);
  const main = newMain ?? mainPool[0];
  const additions = byItem
    .filter((candidate) => candidate.item.id !== main.item.id)
    .filter((candidate) => candidate.attemptCount > 0)
    .slice(0, 2);

  return [unit(main, 'main'), ...additions.map((candidate) => unit(candidate, 'additional'))];
}
