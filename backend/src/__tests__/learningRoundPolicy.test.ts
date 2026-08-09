import { chooseNextStep } from '../learning/domain/round/nextStepPolicy';
import type { AttemptRecord, RoundUnit } from '../learning/domain/model';

function attempt(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  return {
    id: 'attempt-1',
    challengeId: 'challenge-1',
    sessionId: 'round-1',
    unitId: 'unit-1',
    itemId: 'item-1',
    facet: 'meaning',
    target: 'source_recognition',
    stage: 'immediate_source',
    contextProvenance: 'source',
    contextNovelty: 0.4,
    contextFingerprint: 'source-fp',
    firstAnswerId: 'a',
    finalAnswerId: 'a',
    supportLevel: 'none',
    answerRevealed: false,
    skipped: false,
    responseMs: 10_000,
    correct: true,
    occurredAt: '2026-08-10T00:00:00.000Z',
    answerHash: 'hash',
    ...overrides,
  };
}

function unit(overrides: Partial<RoundUnit> = {}): RoundUnit {
  return {
    id: 'unit-1',
    sessionId: 'round-1',
    itemId: 'item-1',
    role: 'main',
    nextStepPolicy: 'adaptive_minimum',
    status: 'active',
    attemptedFacets: [],
    stepCount: 1,
    maxSteps: 3,
    initialPlan: {
      facet: 'meaning',
      target: 'source_recognition',
      stage: 'immediate_source',
      taskMode: 'meaning_choice',
      promptZh: '意思？',
      options: [{ id: 'a', text: '徵詢意見' }],
      correctOptionId: 'a',
      hints: [],
      recommendedSupport: 'none',
      explanationZh: 'explain',
      decisiveCluesZh: [],
      optionExplanations: [],
      ambiguityNoteZh: null,
      evidence: [],
      contextNovelty: 0.4,
      contextProvenance: 'source',
      segmentId: 'segment-1',
      startOffset: 0,
      endOffset: 10,
      contextFingerprint: 'source-fp',
      contextQuality: 1,
    },
    ...overrides,
  };
}

describe('round next-step policy', () => {
  it('asks for one unseen novel comparison after unaided source recognition without prior novel evidence', () => {
    expect(
      chooseNextStep({
        unit: unit(),
        attempt: attempt(),
        validPriorAttempts: [],
        invalidatedAttemptIds: new Set(),
        totalStepCount: 1,
      }),
    ).toMatchObject({ kind: 'next_challenge', target: 'novel_context_recognition', facet: 'meaning' });
  });

  it('completes after unaided novel recognition or valid prior same-facet novel evidence', () => {
    expect(
      chooseNextStep({
        unit: unit(),
        attempt: attempt({ target: 'novel_context_recognition', stage: 'immediate_novel', contextFingerprint: 'novel-fp' }),
        validPriorAttempts: [],
        invalidatedAttemptIds: new Set(),
        totalStepCount: 2,
      }),
    ).toEqual({ kind: 'complete_unit' });

    expect(
      chooseNextStep({
        unit: unit(),
        attempt: attempt(),
        validPriorAttempts: [attempt({ id: 'prior', target: 'novel_context_recognition', stage: 'delayed_novel', contextFingerprint: 'prior-fp' })],
        invalidatedAttemptIds: new Set(),
        totalStepCount: 1,
      }),
    ).toEqual({ kind: 'complete_unit' });
  });

  it('does not let another facet or invalidated novel evidence trigger early completion', () => {
    const prior = attempt({ id: 'prior', facet: 'syntax', target: 'novel_context_recognition', stage: 'delayed_novel' });
    expect(
      chooseNextStep({
        unit: unit(),
        attempt: attempt(),
        validPriorAttempts: [prior],
        invalidatedAttemptIds: new Set(),
        totalStepCount: 1,
      }),
    ).toMatchObject({ kind: 'next_challenge' });

    expect(
      chooseNextStep({
        unit: unit(),
        attempt: attempt(),
        validPriorAttempts: [attempt({ id: 'invalid', target: 'novel_context_recognition', stage: 'delayed_novel' })],
        invalidatedAttemptIds: new Set(['invalid']),
        totalStepCount: 1,
      }),
    ).toMatchObject({ kind: 'next_challenge' });
  });

  it('completes on skip, additional units, and hard caps', () => {
    expect(chooseNextStep({ unit: unit(), attempt: attempt({ skipped: true, supportLevel: 'skip', firstAnswerId: null, finalAnswerId: null, correct: false }), validPriorAttempts: [], invalidatedAttemptIds: new Set(), totalStepCount: 1 })).toEqual({ kind: 'complete_unit' });
    expect(chooseNextStep({ unit: unit({ role: 'additional', nextStepPolicy: 'single_step', maxSteps: 1 }), attempt: attempt(), validPriorAttempts: [], invalidatedAttemptIds: new Set(), totalStepCount: 1 })).toEqual({ kind: 'complete_unit' });
    expect(chooseNextStep({ unit: unit({ stepCount: 3 }), attempt: attempt({ correct: false }), validPriorAttempts: [], invalidatedAttemptIds: new Set(), totalStepCount: 3 })).toEqual({ kind: 'complete_unit' });
    expect(chooseNextStep({ unit: unit(), attempt: attempt({ correct: false }), validPriorAttempts: [], invalidatedAttemptIds: new Set(), totalStepCount: 5 })).toEqual({ kind: 'complete_unit' });
  });
});
