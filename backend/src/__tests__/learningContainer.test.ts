const getDb = jest.fn();
const CloudTasksLearningQueue = jest.fn();

jest.mock('../firebase', () => ({
  getDb,
}));

jest.mock('../learning/adapters/jobs/cloudTasksLearningQueue', () => ({
  CloudTasksLearningQueue,
}));

import { getLearningContainer, setLearningContainerForTests } from '../learning/application/container';

describe('learning production container', () => {
  beforeEach(() => {
    setLearningContainerForTests(null);
    jest.clearAllMocks();
    getDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false }),
        })),
      })),
    });
    delete process.env['LEARNING_TASKS_PROJECT_ID'];
    delete process.env['LEARNING_TASKS_LOCATION'];
    delete process.env['LEARNING_TASKS_QUEUE'];
    delete process.env['LEARNING_WORKER_BASE_URL'];
    delete process.env['LEARNING_TASKS_SERVICE_ACCOUNT'];
    delete process.env['LEARNING_TASKS_AUDIENCE'];
  });

  afterEach(() => {
    setLearningContainerForTests(null);
  });

  it('does not construct the ingestion queue while serving access checks', async () => {
    const container = getLearningContainer();

    await expect(container.repository.hasLearningAccess('user-a')).resolves.toBe(false);
    expect(CloudTasksLearningQueue).not.toHaveBeenCalled();
  });
});
