import { isEligible } from '../learning/domain/selection/eligibility';
import { computePriority } from '../learning/domain/selection/priority';
import { selectRoundUnits } from '../learning/domain/selection/selectRound';
import type { SelectionCandidate } from '../learning/domain/selection/types';
import type { FacetMemory, KnowledgeItem, ValueSignals } from '../learning/domain/model';

const now = new Date('2026-08-10T00:00:00.000Z');

function value(overrides: Partial<ValueSignals> = {}): ValueSignals {
  return {
    personal: 0.8,
    transfer: 0.7,
    comprehension: 0.8,
    recurrence: 0.6,
    productiveIntent: 0,
    ...overrides,
  };
}

function item(overrides: Partial<KnowledgeItem> = {}): KnowledgeItem {
  return {
    id: 'item-1',
    expression: 'run something by someone',
    normalizedForm: 'run something by someone',
    senseKey: 'seek-feedback',
    senseStatus: 'resolved',
    qualityStatus: 'verified',
    kind: 'collocation',
    facets: ['meaning', 'chunk'],
    value: value(),
    evidence: [
      {
        sourceType: 'dictionary',
        sourceName: 'Cambridge Dictionary',
        locator: 'https://dictionary.cambridge.org/us/dictionary/english/run-by',
      },
    ],
    explicitRecognitionGoal: false,
    excludedByUser: false,
    createdAt: '2026-08-09T00:00:00.000Z',
    ...overrides,
  };
}

function memory(overrides: Partial<FacetMemory> = {}): FacetMemory {
  return {
    itemId: 'item-1',
    facet: 'meaning',
    target: 'novel_context_recognition',
    halfLifeHours: 48,
    uncertainty: 0.4,
    lastEvidenceAt: '2026-08-08T10:34:09.493Z',
    cooldownUntil: null,
    immediateUnaidedSuccesses: 0,
    delayedUnaidedSuccesses: 0,
    ...overrides,
  };
}

function candidate(overrides: Partial<SelectionCandidate> = {}): SelectionCandidate {
  const baseItem = overrides.item ?? item();
  const baseMemory = overrides.memory ?? memory({ itemId: baseItem.id });
  return {
    item: baseItem,
    memory: baseMemory,
    facet: baseMemory.facet,
    attemptCount: 1,
    currentSourceFit: 1,
    contextQuality: 0.9,
    transferGap: 0.7,
    recentExposurePenalty: 0,
    redundancyPenalty: 0,
    ambiguityRisk: 0,
    ...overrides,
  };
}

describe('learning selection eligibility', () => {
  it.each([
    ['unresolved sense', candidate({ item: item({ senseStatus: 'unresolved' }) })],
    ['non-verified quality', candidate({ item: item({ qualityStatus: 'unresolved' }) })],
    ['excluded item', candidate({ item: item({ excludedByUser: true }) })],
    ['low context quality', candidate({ contextQuality: 0.69 })],
    ['active cooldown', candidate({ memory: memory({ cooldownUntil: '2026-08-10T01:00:00.000Z' }) })],
    ['missing applicable facet', candidate({ facet: 'syntax', memory: memory({ facet: 'syntax' }) })],
  ])('rejects %s as a hard failure', (_name, input) => {
    expect(isEligible(input, now).eligible).toBe(false);
  });

  it('does not let uncertainty promote low-value items through the value gate', () => {
    const lowValue = candidate({
      item: item({ value: value({ personal: 0.1, transfer: 0.1, comprehension: 0.1, recurrence: 0.1 }) }),
      memory: memory({ uncertainty: 1 }),
    });

    expect(isEligible(lowValue, now)).toMatchObject({ eligible: false, reason: 'low_value' });
  });

  it('allows direct value, comprehension, recurrence, or explicit recognition goal through the value gate', () => {
    const lowBaseValue = value({ personal: 0.1, transfer: 0.1, comprehension: 0.1, recurrence: 0.1 });

    expect(isEligible(candidate({ item: item({ value: value({ personal: 1, transfer: 0.5, comprehension: 0.5, recurrence: 0.5 }) }) }), now).eligible).toBe(true);
    expect(isEligible(candidate({ item: item({ value: { ...lowBaseValue, comprehension: 0.8 } }) }), now).eligible).toBe(true);
    expect(isEligible(candidate({ item: item({ value: { ...lowBaseValue, recurrence: 0.8 } }) }), now).eligible).toBe(true);
    expect(isEligible(candidate({ item: item({ value: lowBaseValue, explicitRecognitionGoal: true }) }), now).eligible).toBe(true);
  });

  it('allows verified seeds with no attempts but rejects unresolved captured words', () => {
    const seed = candidate({
      attemptCount: 0,
      item: item({ kind: 'collocation', qualityStatus: 'verified', senseStatus: 'resolved' }),
    });
    const unresolvedWord = candidate({
      attemptCount: 0,
      item: item({ kind: 'word', qualityStatus: 'unresolved', senseStatus: 'unresolved' }),
    });

    expect(isEligible(seed, now).eligible).toBe(true);
    expect(isEligible(unresolvedWord, now).eligible).toBe(false);
  });
});

describe('learning selection priority', () => {
  it('lets a high-value item at retrievability 0.6 outrank a low-value item at 0.3', () => {
    const highValue = candidate({
      item: item({ id: 'high', value: value({ personal: 1, transfer: 1, comprehension: 1, recurrence: 1 }) }),
      memory: memory({
        itemId: 'high',
        halfLifeHours: 32.59586525251859,
        lastEvidenceAt: '2026-08-08T00:00:00.000Z',
      }),
    });
    const lowValue = candidate({
      item: item({ id: 'low', value: value({ personal: 0.3, transfer: 0.3, comprehension: 0.3, recurrence: 0.3 }) }),
      memory: memory({
        itemId: 'low',
        halfLifeHours: 27.761613237154106,
        lastEvidenceAt: '2026-08-08T00:00:00.000Z',
      }),
    });

    expect(computePriority(highValue, now).score).toBeGreaterThan(computePriority(lowValue, now).score);
  });

  it('recommends a hint when predicted success is low', () => {
    const result = computePriority(
      candidate({
        memory: memory({
          halfLifeHours: 8,
          lastEvidenceAt: '2026-08-08T00:00:00.000Z',
        }),
      }),
      now,
    );

    expect(result.recommendedSupport).toBe('hint_1');
  });
});

describe('learning bounded round selection', () => {
  it('selects one new adaptive main unit and at most two previously attempted additional units', () => {
    const selected = selectRoundUnits(
      [
        candidate({ item: item({ id: 'new-main' }), memory: memory({ itemId: 'new-main' }), attemptCount: 0 }),
        candidate({ item: item({ id: 'old-a' }), memory: memory({ itemId: 'old-a' }), attemptCount: 2 }),
        candidate({ item: item({ id: 'old-b' }), memory: memory({ itemId: 'old-b' }), attemptCount: 3 }),
        candidate({ item: item({ id: 'old-c' }), memory: memory({ itemId: 'old-c' }), attemptCount: 4 }),
      ],
      { currentSourceId: null },
      now,
    );

    expect(selected.map((unit) => unit.itemId)).toHaveLength(3);
    expect(selected[0]).toMatchObject({ itemId: 'new-main', role: 'main', nextStepPolicy: 'adaptive_minimum', maxSteps: 3 });
    expect(selected.slice(1).every((unit) => unit.role === 'additional' && unit.maxSteps === 1)).toBe(true);
  });

  it('groups multiple facet candidates for the main item into one unit', () => {
    const selected = selectRoundUnits(
      [
        candidate({ item: item({ id: 'same', facets: ['meaning', 'syntax'] }), memory: memory({ itemId: 'same', facet: 'meaning' }), facet: 'meaning' }),
        candidate({ item: item({ id: 'same', facets: ['meaning', 'syntax'] }), memory: memory({ itemId: 'same', facet: 'syntax' }), facet: 'syntax' }),
      ],
      { currentSourceId: null },
      now,
    );

    expect(selected).toHaveLength(1);
    expect(selected[0].itemId).toBe('same');
  });

  it('stays bounded even when many old candidates are eligible weeks later', () => {
    const selected = selectRoundUnits(
      Array.from({ length: 12 }, (_, index) =>
        candidate({
          item: item({ id: `old-${index}` }),
          memory: memory({ itemId: `old-${index}`, lastEvidenceAt: '2026-07-01T00:00:00.000Z' }),
          attemptCount: 5,
        }),
      ),
      { currentSourceId: null },
      now,
    );

    expect(selected).toHaveLength(3);
    expect(selected.filter((unit) => unit.role === 'main')).toHaveLength(1);
  });

  it('promotes the best old item to main when no new item exists', () => {
    const selected = selectRoundUnits(
      [
        candidate({ item: item({ id: 'old-b' }), memory: memory({ itemId: 'old-b' }), attemptCount: 2 }),
        candidate({ item: item({ id: 'old-a' }), memory: memory({ itemId: 'old-a' }), attemptCount: 2 }),
      ],
      { currentSourceId: null },
      now,
    );

    expect(selected[0]).toMatchObject({ role: 'main', nextStepPolicy: 'adaptive_minimum' });
    expect(selected[0].itemId).toBe('old-a');
  });

  it('uses current source fit for the main item and permits other-source old items only as additions', () => {
    const selected = selectRoundUnits(
      [
        candidate({ item: item({ id: 'other-source-new' }), memory: memory({ itemId: 'other-source-new' }), attemptCount: 0, currentSourceFit: 0 }),
        candidate({ item: item({ id: 'current-source' }), memory: memory({ itemId: 'current-source' }), attemptCount: 0, currentSourceFit: 1 }),
        candidate({ item: item({ id: 'old-other-source' }), memory: memory({ itemId: 'old-other-source' }), attemptCount: 3, currentSourceFit: 0 }),
      ],
      { currentSourceId: 'source-1' },
      now,
    );

    expect(selected[0].itemId).toBe('current-source');
    expect(selected[0].initialCandidate.currentSourceFit).toBe(1);
    expect(selected.some((unit) => unit.role === 'additional' && unit.itemId === 'old-other-source')).toBe(true);
  });

  it('returns an empty selection when a source-constrained round has no current-source item', () => {
    const selected = selectRoundUnits(
      [candidate({ item: item({ id: 'other-source' }), memory: memory({ itemId: 'other-source' }), currentSourceFit: 0 })],
      { currentSourceId: 'source-1' },
      now,
    );

    expect(selected).toEqual([]);
  });

  it('breaks deterministic ties by item id', () => {
    const selected = selectRoundUnits(
      [
        candidate({ item: item({ id: 'b-item' }), memory: memory({ itemId: 'b-item' }), attemptCount: 0 }),
        candidate({ item: item({ id: 'a-item' }), memory: memory({ itemId: 'a-item' }), attemptCount: 0 }),
      ],
      { currentSourceId: null },
      now,
    );

    expect(selected[0].itemId).toBe('a-item');
  });
});
