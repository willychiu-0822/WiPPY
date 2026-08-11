import { DeterministicExtractor } from '../adapters/extraction/deterministicExtractor';
import { captureSourceVersion } from './captureSourceVersion';
import type { LearningRepository } from './ports';

export async function runLearningIngestion(
  input: { userId: string; runId: string; workerId: string; now: Date },
  deps: { repository: LearningRepository },
): Promise<void> {
  const claimed = await deps.repository.claimRun({
    userId: input.userId,
    runId: input.runId,
    workerId: input.workerId,
    claimedAt: input.now.toISOString(),
    leaseUntil: new Date(input.now.getTime() + 10 * 60_000).toISOString(),
  });
  if (claimed === null) return;

  try {
    const summary = await captureSourceVersion(
      {
        userId: claimed.userId,
        runId: claimed.runId,
        sourceId: claimed.sourceId,
        sourceVersionId: claimed.sourceVersionId,
        capturedAt: input.now.toISOString(),
      },
      { repository: deps.repository, extractor: new DeterministicExtractor() },
    );
    await deps.repository.completeRun({
      userId: claimed.userId,
      runId: claimed.runId,
      sourceId: claimed.sourceId,
      sourceVersionId: claimed.sourceVersionId,
      completedAt: input.now.toISOString(),
      capturedItemCount: summary.capturedItemCount,
      verifiedItemCount: summary.verifiedItemCount,
    });
  } catch (error) {
    await deps.repository.failRun({
      userId: input.userId,
      runId: input.runId,
      failedAt: input.now.toISOString(),
      safeErrorCode: error instanceof Error ? error.message.slice(0, 80) : 'ingestion_failed',
    });
    throw error;
  }
}
