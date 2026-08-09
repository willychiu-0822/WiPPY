import { CloudTasksLearningQueue } from '../learning/adapters/jobs/cloudTasksLearningQueue';
import { InlineLearningQueue } from '../learning/adapters/jobs/inlineLearningQueue';
import type { LearningRepository } from '../learning/application/ports';
import { retryLearningIngestion } from '../learning/application/retryLearningIngestion';

describe('learning queues', () => {
  it('fails closed when production Cloud Tasks configuration is incomplete', () => {
    expect(() => new CloudTasksLearningQueue({} as never)).toThrow('learning_queue_not_configured');
  });

  it('allows inline queue only against the Firestore emulator', async () => {
    await expect(() => new InlineLearningQueue({ firestoreEmulatorHost: '', run: jest.fn() })).toThrow('inline_learning_queue_requires_emulator');
    const run = jest.fn().mockResolvedValue(undefined);
    const queue = new InlineLearningQueue({ firestoreEmulatorHost: '127.0.0.1:8080', run });
    await queue.enqueue({ userId: 'user-a', runId: 'run-1' });
    expect(run).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(run).toHaveBeenCalledWith({ userId: 'user-a', runId: 'run-1' });
  });

  it('marks retryable when enqueue is unavailable rather than pretending queued', async () => {
    const repository: Partial<LearningRepository> = {
      claimRunEnqueue: jest.fn().mockResolvedValue('claimed'),
      finishRunEnqueue: jest.fn(),
      failRun: jest.fn(),
    };

    await expect(
      retryLearningIngestion(
        { userId: 'user-a', runId: 'run-1', now: new Date('2026-08-10T00:00:00.000Z') },
        { repository: repository as LearningRepository, queue: { enqueue: jest.fn().mockRejectedValue(new Error('no queue')) } },
      ),
    ).resolves.toMatchObject({ status: 'retryable', safeErrorCode: 'queue_unavailable' });
    expect(repository.failRun).toHaveBeenCalledWith(expect.objectContaining({ safeErrorCode: 'queue_unavailable' }));
  });
});
