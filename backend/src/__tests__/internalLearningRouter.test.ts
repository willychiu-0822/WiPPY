import express from 'express';
import request from 'supertest';
import { createInternalLearningRouter } from '../learning/http/internalLearningRouter';

describe('internal learning router', () => {
  it('rejects requests without a verified task token', async () => {
    const app = express();
    app.use(express.json());
    app.use('/internal/learning', createInternalLearningRouter({
      verifyTaskToken: jest.fn().mockResolvedValue(false),
      runIngestion: jest.fn(),
      reconcileEnqueues: jest.fn(),
    }));

    await request(app).post('/internal/learning/ingest').send({ userId: 'user-a', runId: 'run-1' }).expect(401);
  });

  it('runs ingestion only after token verification', async () => {
    const runIngestion = jest.fn().mockResolvedValue(undefined);
    const app = express();
    app.use(express.json());
    app.use('/internal/learning', createInternalLearningRouter({
      verifyTaskToken: jest.fn().mockResolvedValue(true),
      runIngestion,
      reconcileEnqueues: jest.fn(),
    }));

    await request(app).post('/internal/learning/ingest').send({ userId: 'user-a', runId: 'run-1' }).expect(204);
    expect(runIngestion).toHaveBeenCalledWith({ userId: 'user-a', runId: 'run-1' });
  });
});
