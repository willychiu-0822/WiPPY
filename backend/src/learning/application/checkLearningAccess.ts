import type { LearningRepository } from './ports';

export async function checkLearningAccess(
  userId: string,
  deps: { repository: LearningRepository },
): Promise<{ enabled: boolean }> {
  return { enabled: await deps.repository.hasLearningAccess(userId) };
}
