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
import { internalRouter } from './routes/internal/harness';

export function initializeFirebaseApp(): void {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
}

export function createApp() {
  initializeFirebaseApp();

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
  app.use('/api/internal', express.json(), internalRouter);

  app.use('/webhook', webhookRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}
