import { runLearningIngestion } from '../learning/application/runLearningIngestion';
import type { LearningRepository } from '../learning/application/ports';

describe('runLearningIngestion', () => {
  it('claims a run, captures it, and completes with verified counts', async () => {
    const repository: Partial<LearningRepository> = {
      claimRun: jest.fn().mockResolvedValue({ userId: 'user-a', runId: 'run-1', sourceId: 'source-1', sourceVersionId: 'version-1' }),
      listSourceSegments: jest.fn().mockResolvedValue([{ id: 'segment-1', ordinal: 0, text: 'Run the idea by a few users.' }]),
      saveCaptureBatch: jest.fn(),
      completeRun: jest.fn(),
    };

    await runLearningIngestion(
      { userId: 'user-a', runId: 'run-1', workerId: 'worker-1', now: new Date('2026-08-10T00:00:00.000Z') },
      { repository: repository as LearningRepository },
    );

    expect(repository.completeRun).toHaveBeenCalledWith(expect.objectContaining({ verifiedItemCount: 1 }));
  });
});
