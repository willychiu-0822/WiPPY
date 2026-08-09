import { Router } from 'express';

export function createInternalLearningRouter(deps: {
  verifyTaskToken: (authorizationHeader: string | undefined) => Promise<boolean>;
  runIngestion: (input: { userId: string; runId: string }) => Promise<void>;
  reconcileEnqueues: () => Promise<void>;
}): Router {
  const router = Router();

  router.post('/ingest', async (req, res) => {
    const ok = await deps.verifyTaskToken(req.header('authorization'));
    if (!ok) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await deps.runIngestion({ userId: req.body?.userId, runId: req.body?.runId });
    res.status(204).send();
  });

  router.post('/reconcile-enqueues', async (req, res) => {
    const ok = await deps.verifyTaskToken(req.header('authorization'));
    if (!ok) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await deps.reconcileEnqueues();
    res.status(204).send();
  });

  return router;
}
