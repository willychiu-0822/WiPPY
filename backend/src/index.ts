import * as admin from 'firebase-admin';
import { getDb } from './firebase';
import { createApp } from './app';
import { reportConfigGaps } from './config/startupCheck';
import {
  getProcessRunTracker,
  handleInstanceShutdown,
  startStuckRunReclaimer,
} from './services/harnessRunShutdown';

const PORT = process.env.PORT || 8080;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(JSON.stringify({ severity: 'INFO', message: `WiPPY backend running on port ${PORT}` }));
  // Warn only; a missing setting must never stop the service from starting.
  try {
    reportConfigGaps();
  } catch (err) {
    console.log(JSON.stringify({ severity: 'WARNING', message: `Config check failed: ${String(err)}` }));
  }
});

let stopReclaimer = (): void => {};
try {
  stopReclaimer = startStuckRunReclaimer(getDb(), getProcessRunTracker());
} catch (err) {
  console.log(JSON.stringify({ severity: 'ERROR', message: `Stuck harness run reclaim failed to start: ${String(err)}` }));
}

// SIGTERM is per Cloud Run instance. Fail only runs this process owns.
// Stuck runs (updatedAt older than 5 minutes) are reclaimed separately.
process.on('SIGTERM', async () => {
  console.log(JSON.stringify({ severity: 'WARN', message: 'SIGTERM received, starting graceful shutdown' }));
  stopReclaimer();
  server.close();

  try {
    const result = await handleInstanceShutdown(getDb(), getProcessRunTracker(), {
      nowMs: Date.now(),
      now: admin.firestore.Timestamp.now(),
    });
    if (result.ownedFailed.length > 0 || result.reclaimed.length > 0) {
      console.log(JSON.stringify({
        severity: 'WARN',
        message: `Marked ${result.ownedFailed.length} owned runs as failed on shutdown`,
        reclaimed: result.reclaimed.length,
      }));
    }
  } catch (err) {
    console.log(JSON.stringify({ severity: 'ERROR', message: `SIGTERM cleanup failed: ${String(err)}` }));
  }

  process.exit(0);
});
