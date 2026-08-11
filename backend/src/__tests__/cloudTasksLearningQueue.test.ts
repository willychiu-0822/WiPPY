import { CloudTasksLearningQueue } from '../learning/adapters/jobs/cloudTasksLearningQueue';

describe('CloudTasksLearningQueue', () => {
  it('targets the mounted internal learning ingestion route', async () => {
    const createTask = jest.fn().mockResolvedValue([{}]);
    const client = {
      queuePath: jest.fn().mockReturnValue('projects/p/locations/l/queues/q'),
      createTask,
    };

    const queue = new CloudTasksLearningQueue({
      projectId: 'p',
      location: 'l',
      queue: 'q',
      serviceUrl: 'https://backend.example.com',
      serviceAccountEmail: 'worker@example.com',
      audience: 'https://backend.example.com',
      client,
    });

    await queue.enqueue({ userId: 'user-a', runId: 'run-a' });

    expect(createTask).toHaveBeenCalledWith(expect.objectContaining({
      task: expect.objectContaining({
        httpRequest: expect.objectContaining({
          url: 'https://backend.example.com/api/internal/learning/ingest',
        }),
      }),
    }));
  });
});
