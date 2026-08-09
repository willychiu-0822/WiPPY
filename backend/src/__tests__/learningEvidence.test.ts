import { summarizeEvidence } from '../learning/domain/evidence/summarizeEvidence';
import type { AttemptRecord } from '../learning/domain/model';

function attempt(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  return {
    id: 'attempt-1',
    challengeId: 'challenge-1',
    sessionId: 'session-1',
    unitId: 'unit-1',
    itemId: 'item-1',
    facet: 'meaning',
    target: 'novel_context_recognition',
    stage: 'immediate_source',
    contextProvenance: 'source',
    contextNovelty: 0.3,
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

describe('learning evidence summaries', () => {
  it('does not inflate hinted same-session performance', () => {
    const summary = summarizeEvidence([
      attempt({ stage: 'immediate_source', supportLevel: 'hint_1', correct: true }),
      attempt({
        id: 'attempt-2',
        stage: 'immediate_novel',
        supportLevel: 'skip',
        skipped: true,
        firstAnswerId: null,
        finalAnswerId: null,
        correct: false,
      }),
    ]);

    expect(summary.headline).toBe('提示下能辨認；新語境尚無無提示證據');
    expect(JSON.stringify(summary)).not.toMatch(/學會|掌握|精通/);
  });

  it('names delayed unseen evidence precisely', () => {
    const summary = summarizeEvidence([
      attempt({ stage: 'delayed_novel', supportLevel: 'none', correct: true }),
    ]);

    expect(summary.headline).toBe('曾在延遲的未見情境中無提示辨認');
  });

  it('uses strongest evidence precedence without turning direct answer into ability', () => {
    const summary = summarizeEvidence([
      attempt({ stage: 'immediate_source', supportLevel: 'answer', answerRevealed: true, finalAnswerId: null, correct: false }),
      attempt({ id: 'attempt-2', stage: 'organic_reencounter', supportLevel: 'none', correct: true }),
    ]);

    expect(summary.strongestStage).toBe('organic_reencounter');
    expect(summary.details).toContain('直接看答案只代表已看過解釋，不算無提示辨認。');
  });
});
