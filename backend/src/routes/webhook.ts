import express, { Request, Response, type ErrorRequestHandler } from 'express';
import { middleware, SignatureValidationFailed, WebhookEvent } from '@line/bot-sdk';
import { getDb } from '../firebase';
import { getLineClient, getLineMiddlewareConfig, hasLineWebhookConfig } from '../line';
import {
  upsertGroupOnJoin,
  setGroupInactive,
  refreshMemberCount,
  updateGroupOnMessage,
  appendRecentMessage,
} from '../services/groupService';
import { processHubWebhookEvents } from '../hub/webhook';
import { getHub } from '../hub/runtime';

const router = express.Router();

const OFFICIAL_ACCOUNT_ID = process.env.LINE_OFFICIAL_ACCOUNT_ID || 'default';

function configuredOwnerUserId(): string | undefined {
  const ownerUserId = process.env.OWNER_USER_ID?.trim();
  return ownerUserId || undefined;
}

// LINE SDK middleware validates signature using raw body
if (hasLineWebhookConfig()) {
  const lineConfig = getLineMiddlewareConfig();
  router.post('/line', middleware(lineConfig), async (req: Request, res: Response) => {
    const events: WebhookEvent[] = req.body.events ?? [];

    // Agent Hub: store messages of agent-enabled groups before acknowledging,
    // so a storage failure makes LINE redeliver (event ids dedupe retries).
    try {
      await processHubWebhookEvents(getHub(), events);
    } catch (err) {
      console.error(JSON.stringify({ severity: 'ERROR', event: 'hub_webhook_ingest_error', error: String(err) }));
      res.status(500).json({ ok: false });
      return;
    }

    // Respond quickly — LINE requires a response within a few seconds
    res.json({ ok: true });

    // Legacy group bookkeeping runs out-of-band
    setImmediate(() => {
      Promise.all(events.map(handleEvent)).catch((err) => {
        console.error(JSON.stringify({ event: 'webhook_error', error: String(err) }));
      });
    });
  });
} else {
  router.post('/line', (_req: Request, res: Response) => {
    res.status(503).json({ error: 'LINE webhook is not configured' });
  });
}

// Signature failures are client authentication errors, not server failures.
const signatureErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof SignatureValidationFailed) {
    res.status(401).json({ error: 'Invalid LINE webhook signature', code: 'invalid_signature' });
    return;
  }
  next(err);
};
router.use(signatureErrorHandler);

async function handleEvent(event: WebhookEvent): Promise<void> {
  const db = getDb();
  const lineClient = getLineClient();
  const ownerUserId = configuredOwnerUserId();

  // ── Group: bot joined ─────────────────────────────────────────────────────
  if (event.type === 'join' && event.source.type === 'group') {
    if (!ownerUserId) {
      console.warn(JSON.stringify({ severity: 'WARNING', event: 'owner_not_configured', lineEvent: 'join' }));
      return;
    }
    await upsertGroupOnJoin(
      db, lineClient,
      event.source.groupId,
      ownerUserId,
      OFFICIAL_ACCOUNT_ID
    );
    return;
  }

  // ── Group: bot left / was removed ─────────────────────────────────────────
  if (event.type === 'leave' && event.source.type === 'group') {
    await setGroupInactive(db, event.source.groupId);
    return;
  }

  // ── Group: member count changed ───────────────────────────────────────────
  if (
    (event.type === 'memberJoined' || event.type === 'memberLeft') &&
    event.source.type === 'group'
  ) {
    await refreshMemberCount(db, lineClient, event.source.groupId);
    return;
  }

  // ── Group: incoming message ───────────────────────────────────────────────
  if (event.type === 'message' && event.source.type === 'group') {
    const groupId = event.source.groupId;
    const senderId = event.source.userId || 'unknown';

    if (!ownerUserId) {
      console.warn(JSON.stringify({ severity: 'WARNING', event: 'owner_not_configured', lineEvent: 'message' }));
      return;
    }

    if (event.message.type === 'text') {
      const content = event.message.text;

      await updateGroupOnMessage(
        db, groupId, ownerUserId, OFFICIAL_ACCOUNT_ID, content, event.timestamp
      );
      await appendRecentMessage(
        db, lineClient, groupId, senderId, content, 'text', event.timestamp
      );

      // TODO Phase 4: checkKeywordTriggers(db, lineClient, groupId, content)
      // TODO Phase 4: checkAndCapture(db, groupId, senderId, content, event.timestamp)
    } else {
      // Non-text message — just update group's lastMessageAt
      await updateGroupOnMessage(
        db, groupId, ownerUserId, OFFICIAL_ACCOUNT_ID,
        `[${event.message.type}]`, event.timestamp
      );
    }
    return;
  }

  // ── Follow event ──────────────────────────────────────────────────────────
  if (event.type === 'follow') {
    console.log(`New follower: ${event.source.userId}`);
    return;
  }
}

export { router as webhookRouter };
