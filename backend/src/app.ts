import 'dotenv/config';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

import { webhookRouter } from './routes/webhook';
import { schedulerRouter } from './routes/scheduler';
import { groupsRouter } from './routes/api/groups';
import { broadcastRouter } from './routes/api/broadcast';
import { sendLogsRouter } from './routes/api/sendLogs';
import { activitiesRouter } from './routes/api/activities';
import { agentRouter } from './routes/api/agent';
import { waterRouter } from './routes/api/water';
import { internalRouter } from './routes/internal/harness';
import { deployNotifyRouter } from './routes/internal/deployNotify';
import { learningRouter } from './learning/http/learningRouter';
import { createInternalLearningRouter } from './learning/http/internalLearningRouter';
import { verifyLearningTaskToken } from './learning/adapters/jobs/verifyLearningTaskToken';
import { getLearningContainer } from './learning/application/container';
import { runLearningIngestion } from './learning/application/runLearningIngestion';
import { reconcileLearningEnqueues } from './learning/application/reconcileLearningEnqueues';
import { ensureFirebaseApp } from './firebase';

export function createApp() {
  ensureFirebaseApp();

  const app = express();

  app.use(cors({
    origin: [
      'https://wippy-mvp.web.app',
      'https://wippy-mvp.firebaseapp.com',
      'http://localhost:5173',
    ],
    credentials: true,
  }));

  app.use('/scheduler', express.json(), schedulerRouter);
  app.use('/api/groups', express.json(), groupsRouter);
  app.use('/api/broadcast', express.json(), broadcastRouter);
  app.use('/api/send-logs', express.json(), sendLogsRouter);
  app.use('/api/activities', express.json(), activitiesRouter);
  app.use('/api/agent', express.json(), agentRouter);
  app.use('/api/water', express.json(), waterRouter);
  app.use('/api/learning', express.json({ limit: '256kb' }), learningRouter);
  app.use('/api/internal/learning', express.json(), createInternalLearningRouter({
    verifyTaskToken: (authorizationHeader) => verifyLearningTaskToken({
      authorizationHeader,
      audience: process.env['LEARNING_TASKS_AUDIENCE'] ?? '',
    }),
    runIngestion: async ({ userId, runId }) => {
      const container = getLearningContainer();
      await runLearningIngestion(
        { userId, runId, workerId: `cloud-task-${runId}`, now: new Date() },
        { repository: container.repository },
      );
    },
    reconcileEnqueues: async () => {
      const container = getLearningContainer();
      await reconcileLearningEnqueues(
        { now: new Date(), limit: 20 },
        { repository: container.repository, queue: container.queue },
      );
    },
  }));
  app.use('/api/internal', express.json(), internalRouter);
  app.use('/api/internal', express.json(), deployNotifyRouter);

  app.use('/webhook', webhookRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}
