import type { AttemptRecord, Facet, FacetMemory, MemoryTarget } from '../model';
import { updateMemory } from './updateMemory';

export interface RebuildMemoryInput {
  base: FacetMemory;
  attempts: AttemptRecord[];
  invalidatedAttemptIds: Set<string>;
  itemId: string;
  facet: Facet;
  target: MemoryTarget;
  now: Date;
}

export function rebuildMemory(input: RebuildMemoryInput): FacetMemory {
  const attempts = input.attempts
    .filter((attempt) => !input.invalidatedAttemptIds.has(attempt.id))
    .filter(
      (attempt) =>
        attempt.itemId === input.itemId &&
        attempt.facet === input.facet &&
        attempt.target === input.target,
    )
    .sort((left, right) => {
      const timeDiff = new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime();
      return timeDiff === 0 ? left.id.localeCompare(right.id) : timeDiff;
    });

  return attempts.reduce(
    (current, attempt) => updateMemory(current, attempt, input.now),
    input.base,
  );
}
