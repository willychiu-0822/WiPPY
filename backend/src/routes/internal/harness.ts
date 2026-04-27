import express, { Request, Response } from 'express';
import { getDb } from '../../firebase';
import { createLLMProvider } from '../../services/llmProvider';
import { executeHarness } from '../../services/harnessOrchestrator';

const router = express.Router();

// POST /api/internal/harness/run
// Called by Cloud Tasks. Executes the harness pipeline synchronously and returns 200 when done.
// Cloud Tasks retries on non-2xx responses.
router.post('/harness/run', async (req: Request, res: Response) => {
  const secret = req.headers['x-harness-secret'];
  if (secret !== (process.env.INTERNAL_HARNESS_SECRET ?? '')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { runId, activityId, userId, userMessage, sessionId } = req.body as {
    runId: string;
    activityId: string;
    userId: string;
    userMessage: string;
    sessionId?: string;
  };

  if (!runId || !activityId || !userId || !userMessage) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const db = getDb();
    const llm = createLLMProvider();
    await executeHarness(db, llm, { runId, activityId, userId, userMessage, sessionId });
    res.json({ ok: true });
  } catch (err) {
    // Log but return 200 — the run is already marked failed in Firestore.
    // Returning 5xx would cause Cloud Tasks to retry, which we don't want for logical failures.
    // Only infrastructure failures (DB unreachable, OOM) should propagate as 5xx.
    const msg = String(err);
    const isInfra = msg.includes('UNAVAILABLE') || msg.includes('DEADLINE_EXCEEDED') || msg.includes('RESOURCE_EXHAUSTED');
    console.log(JSON.stringify({ severity: isInfra ? 'ERROR' : 'WARN', runId, message: msg }));
    res.status(isInfra ? 500 : 200).json({ ok: !isInfra, error: msg });
  }
});

export { router as internalRouter };
