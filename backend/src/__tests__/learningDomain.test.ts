import { attemptInputSchema, toPublicChallenge } from '../learning/domain/validation';
import type { InternalChallenge } from '../learning/domain/model';

describe('learning evidence contracts', () => {
  it('preserves provisional and final answers separately', () => {
    const parsed = attemptInputSchema.parse({
      challengeId: 'challenge-1',
      firstAnswerId: 'a',
      finalAnswerId: 'b',
      supportLevel: 'hint_1',
      answerRevealed: false,
      skipped: false,
      responseMs: 18_000,
    });

    expect(parsed.firstAnswerId).toBe('a');
    expect(parsed.finalAnswerId).toBe('b');
  });

  it('redacts internal answer and scheduling identity', () => {
    const challenge: InternalChallenge = {
      id: 'challenge-1',
      sessionId: 'session-1',
      unitId: 'unit-1',
      itemId: 'item-1',
      facet: 'meaning',
      target: 'novel_context_recognition',
      stage: 'delayed_novel',
      taskMode: 'meaning_choice',
      contextProvenance: 'synthetic',
      contextNovelty: 0.9,
      contextFingerprint: 'sha256:run-it-by-maya-first',
      contextQuality: 1,
      templateId: 'seed-run-by-1',
      promptZh: '這句最接近哪個意思？',
      excerptEn: 'Run it by Maya first.',
      options: [{ id: 'a', text: '先詢問 Maya 的意見' }],
      correctOptionId: 'a',
      hints: ['Maya 是接收想法的人。'],
      recommendedSupport: 'none',
      explanationZh: 'run something by someone 表示提出來徵詢意見。',
      decisiveCluesZh: ['run it by + 人，表示先把想法提出來徵詢意見。'],
      optionExplanations: [{ optionId: 'a', explanationZh: 'Maya 是接收想法並提供意見的人。' }],
      ambiguityNoteZh: null,
      evidence: [
        {
          sourceType: 'dictionary',
          sourceName: 'Cambridge Dictionary',
          locator: 'https://dictionary.cambridge.org/us/dictionary/english/run-by',
        },
      ],
      status: 'active',
      isOldItem: true,
    };

    const publicChallenge = toPublicChallenge(challenge);

    expect(publicChallenge).not.toHaveProperty('correctOptionId');
    expect(publicChallenge).not.toHaveProperty('itemId');
    expect(publicChallenge).not.toHaveProperty('isOldItem');
    expect(publicChallenge).not.toHaveProperty('stage');
    expect(publicChallenge).not.toHaveProperty('contextFingerprint');
    expect(publicChallenge).not.toHaveProperty('status');
  });

  it('rejects productive task modes', () => {
    expect(() =>
      attemptInputSchema.parse({
        challengeId: 'challenge-1',
        firstAnswerId: null,
        finalAnswerId: null,
        supportLevel: 'none',
        answerRevealed: false,
        skipped: false,
        responseMs: 1000,
        taskMode: 'free_production',
      }),
    ).toThrow();
  });
});
