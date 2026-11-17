import 'dotenv/config';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

import { webhookRouter } from './routes/webhook';
import { groupsRouter } from './routes/api/groups';
import { broadcastRouter } from './routes/api/broadcast';
import { sendLogsRouter } from './routes/api/sendLogs';
import { activitiesRouter } from './routes/api/activities';
import { agentRouter } from './routes/api/agent';
import { internalRouter } from './routes/internal/harness';
import { parseCorsOrigins } from './config/corsOrigins';
import { ensureFirebaseApp } from './firebase';
import { mountHubRoutes } from './hub/http/routes';
import './hub/register';

export function createApp() {
  ensureFirebaseApp();

  const app = express();

  app.use(cors({
    origin: parseCorsOrigins(),
    credentials: true,
  }));

  app.use('/api/groups', express.json(), groupsRouter);
  app.use('/api/broadcast', express.json(), broadcastRouter);
  app.use('/api/send-logs', express.json(), sendLogsRouter);
  app.use('/api/activities', express.json(), activitiesRouter);
  app.use('/api/agent', express.json(), agentRouter);
  app.use('/api/internal', express.json(), internalRouter);

  mountHubRoutes(app);
  app.use('/webhook', webhookRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}
