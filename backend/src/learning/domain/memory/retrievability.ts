import type { FacetMemory } from '../model';

export function computeRetrievability(memory: FacetMemory, now: Date): number {
  if (memory.lastEvidenceAt === null) {
    return 1;
  }

  const last = new Date(memory.lastEvidenceAt);
  const elapsedHours = Math.max(0, (now.getTime() - last.getTime()) / 3_600_000);
  return Math.pow(2, -elapsedHours / memory.halfLifeHours);
}
