import express, { Request, Response } from 'express';
import { Client } from '@line/bot-sdk';
import * as admin from 'firebase-admin';
import { getDb } from '../../firebase';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();

const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

// POST /api/broadcast/preview
// Returns per-group content preview before sending (supports F1-3 per-group tweak)
router.post('/preview', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { groupIds, content } = req.body as { groupIds: string[]; content: string };

    if (!groupIds?.length || !content?.trim()) {
      res.status(400).json({ error: 'groupIds and content are required' });
      return;
    }

    const db = getDb();
    const previews = await Promise.all(
      groupIds.map(async (groupId) => {
        const snap = await db.collection('groups').doc(groupId).get();
        return {
          groupId,
          groupName: snap.exists ? snap.data()!['name'] : groupId,
          content, // default same for all; user can tweak per-group in UI
        };
      })
    );

    res.json({ previews });
  } catch (err) {
    console.error(JSON.stringify({ event: 'broadcast_preview_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// POST /api/broadcast/multi
// Send customized message per group (after per-group tweak)
router.post('/multi', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as { messages: Array<{ groupId: string; content: string }> };

    if (!messages?.length) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const db = getDb();
    const results: Array<{ groupId: string; status: 'success' | 'failed'; error?: string; sendLogId?: string }> = [];

    // Send sequentially with small delay to avoid LINE rate limits
    for (const { groupId, content } of messages) {
      let status: 'success' | 'failed' = 'success';
      let errorMessage: string | null = null;

      try {
        await lineClient.pushMessage(groupId, { type: 'text', text: content });
      } catch (err) {
        status = 'failed';
        errorMessage = String(err);
      }

      const logRef = await db.collection('sendLogs').add({
        userId: req.userId,
        activityId: null,
        activityMessageId: null,
        groupId,
        content,
        status,
        errorMessage,
        lineMessageId: null,
        triggerType: 'broadcast',
        sentAt: admin.firestore.Timestamp.now(),
      });

      results.push({
        groupId,
        status,
        ...(errorMessage ? { error: errorMessage } : {}),
        sendLogId: logRef.id,
      });

      // 50ms delay between sends to respect LINE rate limits
      await new Promise((r) => setTimeout(r, 50));
    }

    res.json({ results });
  } catch (err) {
    console.error(JSON.stringify({ event: 'broadcast_multi_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

export { router as broadcastRouter };
