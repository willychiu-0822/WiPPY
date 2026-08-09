import express, { RequestHandler } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { segmentSourceText } from '../application/segmentSourceText';
import { createLearningRound } from '../application/createLearningRound';
import { submitLearningAttempt } from '../application/submitLearningAttempt';
import { reportChallengeIssue } from '../application/reportChallengeIssue';
import { listLearningKnowledge } from '../application/listLearningKnowledge';
import { retryLearningIngestion } from '../application/retryLearningIngestion';
import { getLearningContainer, type LearningContainer } from '../application/container';
import { createLearningAccessMiddleware } from './learningAccessMiddleware';
import { challengeReportSchema, createRoundSchema, createSourceSchema, patchKnowledgeSchema, retryRunSchema, submitAttemptSchema } from './learningSchemas';
import { statusForLearningError } from './learningErrors';

function handleError(res: express.Response, error: unknown): void {
  if (error instanceof Error && error.name === 'ZodError') {
    res.status(400).json({ error: 'Invalid request', code: 'invalid_request' });
    return;
  }
  const mapped = statusForLearningError(error);
  res.status(mapped.status).json(mapped.body);
}

export function createLearningRouter(input: { auth?: RequestHandler; container?: LearningContainer } = {}) {
  const router = express.Router();
  const auth = input.auth ?? authMiddleware;
  const container = () => input.container ?? getLearningContainer();

  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
  });

  router.get('/access', auth, async (req, res) => {
    try {
      res.json({ enabled: await container().repository.hasLearningAccess(req.userId) });
    } catch (error) {
      handleError(res, error);
    }
  });

  router.use(auth, (req, res, next) => createLearningAccessMiddleware(container().repository)(req, res, next));

  router.post('/sources', async (req, res) => {
    try {
      const body = createSourceSchema.parse(req.body);
      const segments = segmentSourceText(body.body);
      const created = await container().repository.createSourceAndRun({
        userId: req.userId,
        requestId: body.requestId,
        title: body.title,
        author: body.author ?? null,
        url: body.url ?? null,
        objective: body.learningObjective ?? null,
        createdAt: container().now().toISOString(),
        segments,
      });
      let status = (await container().repository.getRun(req.userId, created.runId))?.status ?? 'pending_enqueue';
      try {
        if (status === 'pending_enqueue' || status === 'retryable') {
          await container().queue.enqueue({ userId: req.userId, runId: created.runId });
          status = 'queued';
        }
      } catch {
        await container().repository.failRun({
          userId: req.userId,
          runId: created.runId,
          failedAt: container().now().toISOString(),
          safeErrorCode: 'queue_unavailable',
        });
        status = 'retryable';
      }
      res.status(202).json({ sourceId: created.sourceId, runId: created.runId, status });
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/sources/:sourceId', async (req, res) => {
    try {
      const source = await container().repository.getSource(req.userId, req.params['sourceId']!);
      if (!source) throw new Error('not_found');
      res.json({
        source: {
          id: source.id,
          title: source.title,
          author: source.author,
          url: source.url,
          objective: source.objective,
          status: source.status,
          verifiedItemCount: source.verifiedItemCount,
          paragraphs: source.segments.map((segment) => ({ id: segment.id, text: segment.text, order: segment.ordinal })),
        },
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/runs/:runId', async (req, res) => {
    try {
      const run = await container().repository.getRun(req.userId, req.params['runId']!);
      if (!run) throw new Error('not_found');
      res.json({ run });
    } catch (error) {
      handleError(res, error);
    }
  });

  router.post('/runs/:runId/retry', async (req, res) => {
    try {
      retryRunSchema.parse(req.body);
      const result = await retryLearningIngestion(
        { userId: req.userId, runId: req.params['runId']!, now: container().now() },
        { repository: container().repository, queue: container().queue },
      );
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.post('/rounds', async (req, res) => {
    try {
      const body = createRoundSchema.parse(req.body);
      const result = await createLearningRound(
        { userId: req.userId, sourceId: body.sourceId ?? null, now: container().now() },
        { repository: container().repository, challengeBuilder: container().challengeBuilder, idFactory: container().idFactory },
      );
      res.status(201).json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.post('/attempts', async (req, res) => {
    try {
      const attempt = submitAttemptSchema.parse(req.body);
      const result = await submitLearningAttempt(
        { userId: req.userId, attempt, now: container().now() },
        { repository: container().repository, challengeBuilder: container().challengeBuilder, idFactory: container().idFactory },
      );
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.post('/challenges/:id/reports', async (req, res) => {
    try {
      const body = challengeReportSchema.parse(req.body);
      const result = await reportChallengeIssue(
        { userId: req.userId, challengeId: req.params['id']!, issue: body.issue, detail: body.detail ?? null, now: container().now() },
        { repository: container().repository, challengeBuilder: container().challengeBuilder, idFactory: container().idFactory },
      );
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.get('/knowledge', async (req, res) => {
    try {
      const limit = Number(req.query['limit'] ?? '20');
      const cursor = typeof req.query['cursor'] === 'string' ? req.query['cursor'] : null;
      res.json(await listLearningKnowledge({ userId: req.userId, limit, cursor }, { repository: container().repository }));
    } catch (error) {
      handleError(res, error);
    }
  });

  router.patch('/knowledge/:itemId', async (req, res) => {
    try {
      const body = patchKnowledgeSchema.parse(req.body);
      const ok = await container().repository.setExcludedByUser(req.userId, req.params['itemId']!, body.excludedByUser);
      if (!ok) throw new Error('not_found');
      res.json({ ok: true });
    } catch (error) {
      handleError(res, error);
    }
  });

  return router;
}

export const learningRouter = createLearningRouter();
