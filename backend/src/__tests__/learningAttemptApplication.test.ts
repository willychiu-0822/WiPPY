import { submitLearningAttempt } from '../learning/application/submitLearningAttempt';
import type { ChallengeBuilder, LearningRepository } from '../learning/application/ports';
import type { InternalChallenge } from '../learning/domain/model';

function challenge(): InternalChallenge {
  return {
    id: 'challenge-1',
    sessionId: 'round-1',
    unitId: 'unit-1',
    itemId: 'item-1',
    facet: 'meaning',
    target: 'novel_context_recognition',
    stage: 'immediate_novel',
    taskMode: 'meaning_choice',
    contextProvenance: 'synthetic',
    templateId: 'template-1',
    excerptEn: 'Run it by Maya first.',
    contextFingerprint: 'fp-1',
    contextQuality: 1,
    contextNovelty: 0.9,
    promptZh: '意思？',
    options: [{ id: 'a', text: '徵詢意見' }, { id: 'b', text: '跑過去' }],
    correctOptionId: 'a',
    hints: ['hint'],
    recommendedSupport: 'none',
    explanationZh: 'run by 表示徵詢意見。',
    decisiveCluesZh: ['run it by + 人'],
    optionExplanations: [{ optionId: 'a', explanationZh: '正確' }, { optionId: 'b', explanationZh: '誤解 run' }],
    ambiguityNoteZh: null,
    evidence: [{ sourceType: 'dictionary', sourceName: 'Cambridge', locator: 'https://dictionary.cambridge.org/us/dictionary/english/run-by' }],
    status: 'active',
    isOldItem: false,
  };
}

describe('submitLearningAttempt', () => {
  it('rejects answer IDs not present on the server challenge', async () => {
    const repository: Partial<LearningRepository> = {
      getInternalChallenge: jest.fn().mockResolvedValue(challenge()),
    };

    await expect(
      submitLearningAttempt(
        {
          userId: 'user-a',
          attempt: { challengeId: 'challenge-1', firstAnswerId: 'z', finalAnswerId: 'z', supportLevel: 'none', answerRevealed: false, skipped: false, responseMs: 1000 },
          now: new Date('2026-08-10T00:00:00.000Z'),
        },
        { repository: repository as LearningRepository, challengeBuilder: {} as ChallengeBuilder, idFactory: { create: (kind) => `${kind}-1` } },
      ),
    ).rejects.toThrow('invalid_answer_option');
  });

  it('derives correctness server-side and returns feedback without claiming delayed retention', async () => {
    const transitions: unknown[] = [];
    const repository: Partial<LearningRepository> = {
      getInternalChallenge: jest.fn().mockResolvedValue(challenge()),
      listAttemptEvidenceContext: jest.fn().mockResolvedValue({ attempts: [], invalidatedAttemptIds: [] }),
      recordAttemptAndAdvance: jest.fn(async (input) => {
        transitions.push(input);
        return { replayed: false, nextChallengeId: null, roundComplete: true };
      }),
    };

    const result = await submitLearningAttempt(
      {
        userId: 'user-a',
        attempt: { challengeId: 'challenge-1', firstAnswerId: 'b', finalAnswerId: 'a', supportLevel: 'none', answerRevealed: false, skipped: false, responseMs: 1000 },
        now: new Date('2026-08-10T00:00:00.000Z'),
      },
      { repository: repository as LearningRepository, challengeBuilder: {} as ChallengeBuilder, idFactory: { create: (kind) => `${kind}-1` } },
    );

    expect(transitions[0]).toMatchObject({
      attempt: expect.objectContaining({ id: expect.any(String), firstAnswerId: 'b', finalAnswerId: 'a', correct: true }),
    });
    expect(result.feedback).toMatchObject({ correctOptionId: 'a', decisiveCluesZh: ['run it by + 人'] });
    expect(result.evidence.headline).not.toMatch(/延遲/);
  });
});
