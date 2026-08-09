import type { LearningQueue, LearningRepository } from './ports';

export async function retryLearningIngestion(
  input: { userId: string; runId: string; now: Date },
  deps: { repository: LearningRepository; queue: LearningQueue },
): Promise<{ status: 'queued' | 'retryable' | 'completed' | 'already_active'; safeErrorCode: string | null }> {
  const claim = await deps.repository.claimRunEnqueue({
    userId: input.userId,
    runId: input.runId,
    workerId: `enqueue-${input.runId}`,
    claimedAt: input.now.toISOString(),
    leaseUntil: new Date(input.now.getTime() + 10 * 60_000).toISOString(),
  });
  if (claim === 'completed') return { status: 'completed', safeErrorCode: null };
  if (claim === 'already_active') return { status: 'already_active', safeErrorCode: null };

  try {
    await deps.queue.enqueue({ userId: input.userId, runId: input.runId });
    await deps.repository.finishRunEnqueue({
      userId: input.userId,
      runId: input.runId,
      workerId: `enqueue-${input.runId}`,
      finishedAt: input.now.toISOString(),
      accepted: true,
    });
    return { status: 'queued', safeErrorCode: null };
  } catch {
    await deps.repository.failRun({
      userId: input.userId,
      runId: input.runId,
      failedAt: input.now.toISOString(),
      safeErrorCode: 'queue_unavailable',
    });
    return { status: 'retryable', safeErrorCode: 'queue_unavailable' };
  }
}
