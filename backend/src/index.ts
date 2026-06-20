import * as admin from 'firebase-admin';
import { getDb } from './firebase';
import { createApp } from './app';

const PORT = process.env.PORT || 8080;
const app = createApp();

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
