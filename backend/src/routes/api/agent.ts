import express, { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { getDb } from '../../firebase';
import { authMiddleware } from '../../middleware/auth';
import { createLLMProvider } from '../../services/llmProvider';
import { checkRateLimit, isNearLimit } from '../../services/rateLimitService';
import { executeHarness } from '../../services/harnessOrchestrator';
import { isCloudTasksEnabled, enqueueHarnessRun } from '../../services/cloudTasksService';
import type { HarnessRun, AgentChatApiResponse } from '../../types';

const router = express.Router();

function toClientErrorMessage(err: unknown): string {
  const msg = String(err).replace(/^Error:\s*/, '');
  if (msg.startsWith('LLM configuration error:')) return msg;
  return 'Agent request failed';
}

// POST /api/agent/chat
// Returns immediately with { status: 'queued' } (prod) or { status: 'completed' } (dev/no Cloud Tasks).
router.post('/chat', authMiddleware, async (req: Request, res: Response) => {
  const { activityId, message, sessionId } = req.body as {
    activityId?: string;
    message?: string;
    sessionId?: string;
  };

  if (!activityId?.trim()) { res.status(400).json({ error: 'activityId is required' }); return; }
  if (!message?.trim()) { res.status(400).json({ error: 'message is required' }); return; }

  const db = getDb();
  const userId = req.userId!;

  // Rate limit check
  const rateResult = await checkRateLimit(db, userId);
  if (!rateResult.allowed) {
    const response: AgentChatApiResponse = {
      status: 'rate_limited',
      runId: '',
      sessionId: sessionId ?? '',
      retryAfterSeconds: rateResult.retryAfterSeconds,
    };
    res.status(429).json(response);
    return;
  }

  // Create HarnessRun document (status: queued)
  const now = admin.firestore.Timestamp.now();
  const ttlExpiry = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const runRef = db.collection('harnessRuns').doc();
  const run: HarnessRun = {
    id: runRef.id,
    sessionId: sessionId ?? '',
    activityId: activityId.trim(),
    userId,
    intentType: 'unknown',
    currentStage: null,
    status: 'queued',
    llmCallCount: 0,
    persistedBatches: 0,
    lastError: null,
    reply: null,
    generatedMessageCount: 0,
    extractedKnowledgeCount: 0,
    ttlExpiry,
    createdAt: now,
    updatedAt: now,
  };
  await runRef.set(run);

  const rateLimitWarning = isNearLimit(rateResult)
    ? { remaining: rateResult.remaining, windowResetInSeconds: rateResult.windowResetInSeconds }
    : undefined;

  const harnessInput = {
    runId: runRef.id,
    activityId: activityId.trim(),
    userId,
    userMessage: message.trim(),
    sessionId: sessionId ?? undefined,
  };

  if (isCloudTasksEnabled()) {
    // Async path: enqueue to Cloud Tasks, return immediately
    try {
      await enqueueHarnessRun(harnessInput);
    } catch (err) {
      // If enqueue fails, mark run as failed and return error
      await runRef.update({ status: 'failed', lastError: String(err).slice(0, 500), updatedAt: admin.firestore.Timestamp.now() });
      res.status(500).json({ error: 'Failed to queue request' });
      return;
    }
    const response: AgentChatApiResponse = {
      status: 'queued',
      runId: runRef.id,
      sessionId: sessionId ?? '',
      rateLimitWarning,
    };
    res.json(response);
  } else {
    // Dev/sync path: run harness inline
    try {
      const llm = createLLMProvider();
      const output = await executeHarness(db, llm, harnessInput);
      const response: AgentChatApiResponse = {
        status: 'completed',
        runId: runRef.id,
        sessionId: output.sessionId,
        reply: output.reply,
        generatedMessageCount: output.generatedMessageCount,
        extractedKnowledgeCount: output.extractedKnowledgeCount,
        rateLimitWarning,
      };
      res.json(response);
    } catch (err) {
      const msg = String(err);
      console.log(JSON.stringify({ severity: 'ERROR', event: 'agent_chat_error', runId: runRef.id, error: msg }));
      res.status(500).json({ error: toClientErrorMessage(err) });
    }
  }
});

export { router as agentRouter };
