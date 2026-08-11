import { computeRetrievability } from '../learning/domain/memory/retrievability';
import { rebuildMemory } from '../learning/domain/memory/rebuildMemory';
import { updateMemory } from '../learning/domain/memory/updateMemory';
import type { AttemptRecord, FacetMemory } from '../learning/domain/model';

function memory(overrides: Partial<FacetMemory> = {}): FacetMemory {
  return {
    itemId: 'item-1',
    facet: 'meaning',
    target: 'novel_context_recognition',
    halfLifeHours: 24,
    uncertainty: 1,
    lastEvidenceAt: '2026-08-01T00:00:00.000Z',
    cooldownUntil: null,
    immediateUnaidedSuccesses: 0,
    delayedUnaidedSuccesses: 0,
    ...overrides,
  };
}

function attempt(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  return {
    id: 'attempt-1',
    challengeId: 'challenge-1',
    sessionId: 'session-1',
    unitId: 'unit-1',
    itemId: 'item-1',
    facet: 'meaning',
    target: 'novel_context_recognition',
    stage: 'immediate_novel',
    contextProvenance: 'synthetic',
    contextNovelty: 0.9,
    contextFingerprint: 'sha256:context-1',
    firstAnswerId: 'a',
    finalAnswerId: 'a',
    supportLevel: 'none',
    answerRevealed: false,
    skipped: false,
    responseMs: 10_000,
    correct: true,
    occurredAt: '2026-08-03T00:00:00.000Z',
    answerHash: 'hash-1',
    ...overrides,
  };
}

describe('learning memory', () => {
  it('computes exponential retrievability from the latest evidence time', () => {
    expect(
      computeRetrievability(
        memory({ halfLifeHours: 48 }),
        new Date('2026-08-03T00:00:00.000Z'),
      ),
    ).toBeCloseTo(0.5, 6);
  });

  it('starts at full retrievability before any evidence exists', () => {
    expect(computeRetrievability(memory({ lastEvidenceAt: null }), new Date('2026-08-03T00:00:00.000Z'))).toBe(1);
  });

  it('updates unaided same-session novel success without claiming delayed evidence', () => {
    const updated = updateMemory(memory(), attempt({ stage: 'immediate_novel' }), new Date('2026-08-03T00:00:00.000Z'));

    expect(updated.halfLifeHours).toBeCloseTo(28.8, 6);
    expect(updated.immediateUnaidedSuccesses).toBe(1);
    expect(updated.delayedUnaidedSuccesses).toBe(0);
    expect(updated.uncertainty).toBeCloseTo(0.95, 6);
  });

  it('gives delayed and organic unaided evidence stronger memory updates', () => {
    const delayed = updateMemory(memory(), attempt({ stage: 'delayed_novel' }), new Date('2026-08-03T00:00:00.000Z'));
    const organic = updateMemory(memory(), attempt({ stage: 'organic_reencounter' }), new Date('2026-08-03T00:00:00.000Z'));

    expect(delayed.halfLifeHours).toBe(48);
    expect(delayed.delayedUnaidedSuccesses).toBe(1);
    expect(delayed.uncertainty).toBeCloseTo(0.85, 6);
    expect(organic.halfLifeHours).toBeCloseTo(52.8, 6);
    expect(organic.delayedUnaidedSuccesses).toBe(1);
  });

  it('keeps hinted success separate from unaided evidence', () => {
    const updated = updateMemory(memory(), attempt({ supportLevel: 'hint_1' }), new Date('2026-08-03T00:00:00.000Z'));

    expect(updated.halfLifeHours).toBeCloseTo(25.2, 6);
    expect(updated.immediateUnaidedSuccesses).toBe(0);
    expect(updated.delayedUnaidedSuccesses).toBe(0);
    expect(updated.uncertainty).toBe(1);
  });

  it('sets cooldowns for direct answer and skip without increasing memory strength', () => {
    const answer = updateMemory(memory(), attempt({ supportLevel: 'answer', answerRevealed: true, finalAnswerId: null }), new Date('2026-08-03T00:00:00.000Z'));
    const skipped = updateMemory(memory(), attempt({ supportLevel: 'skip', skipped: true, firstAnswerId: null, finalAnswerId: null, correct: false }), new Date('2026-08-03T00:00:00.000Z'));

    expect(answer.halfLifeHours).toBe(24);
    expect(answer.cooldownUntil).toBe('2026-08-04T00:00:00.000Z');
    expect(skipped.halfLifeHours).toBe(24);
    expect(skipped.uncertainty).toBe(1);
    expect(skipped.cooldownUntil).toBe('2026-08-03T06:00:00.000Z');
  });

  it('weakens only the challenged target after an incorrect attempt', () => {
    const updated = updateMemory(memory(), attempt({ correct: false }), new Date('2026-08-03T00:00:00.000Z'));
    const floor = updateMemory(memory({ halfLifeHours: 7 }), attempt({ correct: false }), new Date('2026-08-03T00:00:00.000Z'));
    const sourceRecognitionMemory = memory({ target: 'source_recognition' });
    const otherTarget = updateMemory(
      sourceRecognitionMemory,
      attempt({ correct: false }),
      new Date('2026-08-03T00:00:00.000Z'),
    );

    expect(updated.halfLifeHours).toBe(18);
    expect(floor.halfLifeHours).toBe(6);
    expect(otherTarget).toEqual(sourceRecognitionMemory);
  });

  it('does not let a meaning attempt update syntax memory', () => {
    const updated = updateMemory(
      memory({ facet: 'syntax' }),
      attempt({ facet: 'meaning' }),
      new Date('2026-08-03T00:00:00.000Z'),
    );

    expect(updated).toEqual(memory({ facet: 'syntax' }));
  });

  it('rebuilds from non-invalidated attempts for the exact facet target only', () => {
    const rebuilt = rebuildMemory({
      base: memory({ lastEvidenceAt: null, halfLifeHours: 24, uncertainty: 1 }),
      attempts: [
        attempt({ id: 'b', occurredAt: '2026-08-03T00:00:00.000Z', stage: 'delayed_novel' }),
        attempt({ id: 'a', occurredAt: '2026-08-02T00:00:00.000Z', stage: 'immediate_novel' }),
        attempt({ id: 'invalid', occurredAt: '2026-08-04T00:00:00.000Z', stage: 'organic_reencounter' }),
        attempt({ id: 'syntax', facet: 'syntax', occurredAt: '2026-08-05T00:00:00.000Z', stage: 'delayed_novel' }),
      ],
      invalidatedAttemptIds: new Set(['invalid']),
      itemId: 'item-1',
      facet: 'meaning',
      target: 'novel_context_recognition',
      now: new Date('2026-08-06T00:00:00.000Z'),
    });

    expect(rebuilt.halfLifeHours).toBeCloseTo(57.6, 6);
    expect(rebuilt.immediateUnaidedSuccesses).toBe(1);
    expect(rebuilt.delayedUnaidedSuccesses).toBe(1);
    expect(rebuilt.lastEvidenceAt).toBe('2026-08-03T00:00:00.000Z');
  });
});
