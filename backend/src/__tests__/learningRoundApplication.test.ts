import { createLearningRound } from '../learning/application/createLearningRound';
import type { ChallengeBuilder, LearningRepository } from '../learning/application/ports';
import type { ChallengeBlueprint, KnowledgeItem, SourceContextRef } from '../learning/domain/model';
import type { SelectionCandidate } from '../learning/domain/selection/types';

function item(id = 'item-1'): KnowledgeItem {
  return {
    id,
    expression: 'run something by someone',
    normalizedForm: 'run something by someone',
    senseKey: 'seek-feedback',
    senseStatus: 'resolved',
    qualityStatus: 'verified',
    kind: 'collocation',
    facets: ['meaning'],
    value: { personal: 1, transfer: 1, comprehension: 1, recurrence: 1, productiveIntent: 0 },
    evidence: [{ sourceType: 'dictionary', sourceName: 'Cambridge', locator: 'https://dictionary.cambridge.org/us/dictionary/english/run-by' }],
    explicitRecognitionGoal: false,
    excludedByUser: false,
    createdAt: '2026-08-10T00:00:00.000Z',
  };
}

function blueprint(): ChallengeBlueprint {
  return {
    facet: 'meaning',
    target: 'source_recognition',
    stage: 'immediate_source',
    taskMode: 'meaning_choice',
    promptZh: '意思？',
    options: [{ id: 'a', text: '徵詢意見' }],
    correctOptionId: 'a',
    hints: ['hint'],
    recommendedSupport: 'none',
    explanationZh: 'explain',
    decisiveCluesZh: ['clue'],
    optionExplanations: [{ optionId: 'a', explanationZh: 'reason' }],
    ambiguityNoteZh: null,
    evidence: [],
    contextNovelty: 0.4,
    contextProvenance: 'source',
    segmentId: 'segment-1',
    startOffset: 0,
    endOffset: 10,
    contextFingerprint: 'source-fp',
    contextQuality: 1,
  };
}

function candidate(id = 'item-1'): SelectionCandidate {
  return {
    item: item(id),
    memory: {
      itemId: id,
      facet: 'meaning',
      target: 'source_recognition',
      halfLifeHours: 24,
      uncertainty: 1,
      lastEvidenceAt: null,
      cooldownUntil: null,
      immediateUnaidedSuccesses: 0,
      delayedUnaidedSuccesses: 0,
    },
    facet: 'meaning',
    attemptCount: 0,
    currentSourceFit: 1,
    contextQuality: 1,
    transferGap: 1,
    recentExposurePenalty: 0,
    redundancyPenalty: 0,
    ambiguityRisk: 0,
  };
}

describe('createLearningRound', () => {
  it('builds resolved unit blueprints before saving and returns one redacted challenge', async () => {
    const saved: unknown[] = [];
    const sourceContext: SourceContextRef = {
      provenance: 'source',
      sourceId: 'source-1',
      sourceVersionId: 'version-1',
      segmentId: 'segment-1',
      startOffset: 0,
      endOffset: 10,
      contextFingerprint: 'source-fp',
      contextQuality: 1,
      contextNovelty: 0.4,
    };
    const repository: Partial<LearningRepository> = {
      listSelectionCandidates: jest.fn().mockResolvedValue([candidate('item-1')]),
      getKnowledgeItem: jest.fn().mockResolvedValue(item('item-1')),
      findChallengeContext: jest.fn().mockResolvedValue(sourceContext),
      getSourceSpan: jest.fn().mockResolvedValue('run it by'),
      saveRound: jest.fn(async (input) => {
        saved.push(input);
        return { roundId: input.roundId, firstChallengeId: input.firstChallenge?.id ?? null };
      }),
    };
    const builder: ChallengeBuilder = { build: jest.fn().mockResolvedValue(blueprint()) };

    const result = await createLearningRound(
      { userId: 'user-a', sourceId: 'source-1', now: new Date('2026-08-10T00:00:00.000Z') },
      {
        repository: repository as LearningRepository,
        challengeBuilder: builder,
        idFactory: { create: (kind) => `${kind}-1` },
      },
    );

    expect(repository.listSelectionCandidates).toHaveBeenCalledWith('user-a', { nowIso: '2026-08-10T00:00:00.000Z', limit: 100, currentSourceId: 'source-1' });
    expect(repository.findChallengeContext).toHaveBeenCalledWith('user-a', expect.objectContaining({ provenance: 'source', sourceId: 'source-1' }));
    expect(saved[0]).toMatchObject({ roundId: 'round-1', units: [expect.objectContaining({ initialPlan: expect.objectContaining({ contextProvenance: 'source' }) })] });
    expect(result.challenge).toMatchObject({ id: 'challenge-1', excerptEn: 'run it by' });
    expect(JSON.stringify(result)).not.toMatch(/correctOptionId|itemId|review|XP|due|backlog/);
  });

  it('returns an empty completed round when no quality challenge can be built', async () => {
    const repository: Partial<LearningRepository> = {
      listSelectionCandidates: jest.fn().mockResolvedValue([candidate('item-1')]),
      getKnowledgeItem: jest.fn().mockResolvedValue(item('item-1')),
      findChallengeContext: jest.fn().mockResolvedValue(null),
      saveRound: jest.fn(async (input) => ({ roundId: input.roundId, firstChallengeId: null })),
    };

    const result = await createLearningRound(
      { userId: 'user-a', sourceId: 'source-1', now: new Date('2026-08-10T00:00:00.000Z') },
      {
        repository: repository as LearningRepository,
        challengeBuilder: { build: jest.fn() },
        idFactory: { create: (kind) => `${kind}-1` },
      },
    );

    expect(result).toEqual({ roundId: 'round-1', challenge: null, roundComplete: true });
  });
});
