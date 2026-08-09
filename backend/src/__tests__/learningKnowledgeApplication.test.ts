import { listLearningKnowledge } from '../learning/application/listLearningKnowledge';
import type { LearningRepository } from '../learning/application/ports';

describe('listLearningKnowledge', () => {
  it('includes unresolved items and uses non-mastery evidence language', async () => {
    const repository: Partial<LearningRepository> = {
      listKnowledgeRecords: jest.fn().mockResolvedValue({
        items: [
          {
            id: 'item-1',
            expression: 'run',
            normalizedForm: 'run',
            senseKey: 'unresolved-cluster',
            senseStatus: 'unresolved',
            qualityStatus: 'unresolved',
            kind: 'word',
            facets: ['meaning'],
            value: { personal: 0.1, transfer: 0.1, comprehension: 0.1, recurrence: 0.1, productiveIntent: 0 },
            evidence: [],
            explicitRecognitionGoal: false,
            excludedByUser: false,
            createdAt: '2026-08-10T00:00:00.000Z',
          },
        ],
        nextCursor: null,
      }),
      listAttemptEvidenceContext: jest.fn().mockResolvedValue({ attempts: [], invalidatedAttemptIds: [] }),
    };

    const result = await listLearningKnowledge({ userId: 'user-a', limit: 10, cursor: null }, { repository: repository as LearningRepository });

    expect(result.items[0]).toMatchObject({
      expression: 'run',
      facets: [{ facet: 'meaning', evidence: null, label: '尚無證據' }],
    });
    expect(JSON.stringify(result)).not.toMatch(/已學會|精通|掌握/);
  });
});
