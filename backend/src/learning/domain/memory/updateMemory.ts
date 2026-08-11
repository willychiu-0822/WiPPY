import type { AttemptRecord, FacetMemory } from '../model';

function clampUncertainty(value: number): number {
  return Math.min(1, Math.max(0.05, value));
}

function addHours(now: Date, hours: number): string {
  return new Date(now.getTime() + hours * 3_600_000).toISOString();
}

function withEvidenceTime(memory: FacetMemory, attempt: AttemptRecord): FacetMemory {
  return { ...memory, lastEvidenceAt: attempt.occurredAt };
}

export function updateMemory(memory: FacetMemory, attempt: AttemptRecord, now: Date): FacetMemory {
  if (
    memory.itemId !== attempt.itemId ||
    memory.facet !== attempt.facet ||
    memory.target !== attempt.target
  ) {
    return memory;
  }

  if (attempt.skipped || attempt.supportLevel === 'skip') {
    return { ...memory, cooldownUntil: addHours(now, 6) };
  }

  if (attempt.answerRevealed || attempt.supportLevel === 'answer') {
    return { ...memory, cooldownUntil: addHours(now, 24) };
  }

  if (!attempt.correct) {
    return withEvidenceTime(
      {
        ...memory,
        halfLifeHours: Math.max(6, memory.halfLifeHours * 0.75),
        cooldownUntil: addHours(now, 6),
      },
      attempt,
    );
  }

  if (attempt.supportLevel === 'hint_1' || attempt.supportLevel === 'hint_2') {
    return withEvidenceTime(
      {
        ...memory,
        halfLifeHours: memory.halfLifeHours * 1.05,
        cooldownUntil: null,
      },
      attempt,
    );
  }

  const isDelayed = attempt.stage === 'delayed_novel' || attempt.stage === 'organic_reencounter';
  const multiplier = attempt.stage === 'organic_reencounter' ? 2.2 : isDelayed ? 2 : 1.2;
  const uncertaintyDrop = isDelayed ? 0.15 : 0.05;

  return withEvidenceTime(
    {
      ...memory,
      halfLifeHours: memory.halfLifeHours * multiplier,
      uncertainty: clampUncertainty(memory.uncertainty - uncertaintyDrop),
      cooldownUntil: null,
      immediateUnaidedSuccesses: isDelayed
        ? memory.immediateUnaidedSuccesses
        : memory.immediateUnaidedSuccesses + 1,
      delayedUnaidedSuccesses: isDelayed
        ? memory.delayedUnaidedSuccesses + 1
        : memory.delayedUnaidedSuccesses,
    },
    attempt,
  );
}
