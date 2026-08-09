import { checkLearningAccess } from '../learning/application/checkLearningAccess';
import type { LearningRepository } from '../learning/application/ports';

describe('learning access policy', () => {
  it('disables missing or false access records and enables true records', async () => {
    await expect(checkLearningAccess('user-a', { repository: { hasLearningAccess: jest.fn().mockResolvedValue(false) } as unknown as LearningRepository })).resolves.toEqual({ enabled: false });
    await expect(checkLearningAccess('user-a', { repository: { hasLearningAccess: jest.fn().mockResolvedValue(true) } as unknown as LearningRepository })).resolves.toEqual({ enabled: true });
  });
});
