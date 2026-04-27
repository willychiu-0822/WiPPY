import 'dotenv/config';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

import { webhookRouter } from './routes/webhook';
import { schedulerRouter } from './routes/scheduler';
import { groupsRouter } from './routes/api/groups';
import { broadcastRouter } from './routes/api/broadcast';
import { sendLogsRouter } from './routes/api/sendLogs';
import { activitiesRouter } from './routes/api/activities';
import { agentRouter } from './routes/api/agent';
import { internalRouter } from './routes/internal/harness';
import { getDb } from './firebase';

const app = express();
const PORT = process.env.PORT || 8080;

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

const server = app.listen(PORT, () => {
  console.log(JSON.stringify({ severity: 'INFO', message: `WiPPY backend running on port ${PORT}` }));
});

// SIGTERM handler: Cloud Run sends SIGTERM before terminating the instance.
// Mark all queued/running HarnessRuns as failed so they don't become zombies.
process.on('SIGTERM', async () => {
  console.log(JSON.stringify({ severity: 'WARN', message: 'SIGTERM received, starting graceful shutdown' }));
  server.close();

  try {
    const db = getDb();
    const runningSnap = await db.collection('harnessRuns')
      .where('status', 'in', ['queued', 'running'])
      .get();

    if (!runningSnap.empty) {
      const batch = db.batch();
      const now = admin.firestore.Timestamp.now();
      for (const doc of runningSnap.docs) {
        batch.update(doc.ref, { status: 'failed', lastError: 'cloud_run_terminated', updatedAt: now });
      }
      await batch.commit();
      console.log(JSON.stringify({ severity: 'WARN', message: `Marked ${runningSnap.size} runs as failed on shutdown` }));
    }
  } catch (err) {
    console.log(JSON.stringify({ severity: 'ERROR', message: `SIGTERM cleanup failed: ${String(err)}` }));
  }

  process.exit(0);
});
