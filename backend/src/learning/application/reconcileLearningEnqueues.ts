import type { LearningQueue, LearningRepository } from './ports';
import { retryLearningIngestion } from './retryLearningIngestion';

export async function reconcileLearningEnqueues(
  input: { now: Date; limit: number },
  deps: { repository: LearningRepository; queue: LearningQueue },
): Promise<{ attempted: number }> {
  const runs = await deps.repository.listRunsNeedingEnqueue(input.now.toISOString(), input.limit);
  for (const run of runs) {
    await retryLearningIngestion({ ...run, now: input.now }, deps);
  }
  return { attempted: runs.length };
}
