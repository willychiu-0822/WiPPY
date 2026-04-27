import express, { Request, Response } from 'express';
import { Client } from '@line/bot-sdk';
import * as admin from 'firebase-admin';
import { getDb } from '../../firebase';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();

const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

const OFFICIAL_ACCOUNT_ID = process.env.LINE_OFFICIAL_ACCOUNT_ID || 'default';

// GET /api/groups
// Returns all active groups for the authenticated user, sorted by lastMessageAt DESC
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const snap = await db.collection('groups')
      .where('userId', '==', req.userId)
      .where('isActive', '==', true)
      .orderBy('lastMessageAt', 'desc')
      .get();

    const groups = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        groupId: data['groupId'],
        name: data['name'],
        memberCount: data['memberCount'],
        lastMessageAt: data['lastMessageAt'],
        lastMessagePreview: data['lastMessagePreview'],
        isActive: data['isActive'],
      };
    });

    res.json({ groups });
  } catch (err) {
    console.error(JSON.stringify({ event: 'get_groups_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// GET /api/groups/:groupId/messages
// Returns recent messages for a group (up to 50, newest first)
router.get('/:groupId/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = req.params['groupId'] as string;
    const db = getDb();

    // Verify group belongs to this user
    const groupSnap = await db.collection('groups').doc(groupId).get();
    if (!groupSnap.exists || groupSnap.data()!['userId'] !== req.userId) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const limit = Math.min(Number(req.query['limit'] as string) || 20, 50);

    const snap = await db.collection('groups').doc(groupId)
      .collection('recentMessages')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const messages = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      groupName: groupSnap.data()!['name'],
      messages,
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'get_messages_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/groups/:groupId/messages
// Send a quick reply to a single group
router.post('/:groupId/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = req.params['groupId'] as string;
    const { content } = req.body as { content: string };

    if (!content?.trim()) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const db = getDb();

    // Verify group belongs to this user
    const groupSnap = await db.collection('groups').doc(groupId).get();
    if (!groupSnap.exists || groupSnap.data()!['userId'] !== req.userId) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    let lineMessageId: string | null = null;
    let status: 'success' | 'failed' = 'success';
    let errorMessage: string | null = null;

    try {
      await lineClient.pushMessage(groupId, { type: 'text', text: content });
    } catch (err) {
      status = 'failed';
      errorMessage = String(err);
    }

    // Write send log
    const logRef = await db.collection('sendLogs').add({
      userId: req.userId,
      activityId: null,
      activityMessageId: null,
      groupId,
      content,
      status,
      errorMessage,
      lineMessageId,
      triggerType: 'manual',
      sentAt: admin.firestore.Timestamp.now(),
    });

    if (status === 'failed') {
      res.status(502).json({ error: errorMessage, sendLogId: logRef.id });
      return;
    }

    res.json({ ok: true, sendLogId: logRef.id });
  } catch (err) {
    console.error(JSON.stringify({ event: 'send_message_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/groups/sync
// Refresh group data from LINE API for all active groups
router.post('/sync', authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const snap = await db.collection('groups')
      .where('userId', '==', req.userId)
      .where('isActive', '==', true)
      .get();

    let updated = 0;
    for (const doc of snap.docs) {
      const groupId = doc.id;
      try {
        const summary = await lineClient.getGroupSummary(groupId);
        const members = await lineClient.getGroupMembersCount(groupId);
        await doc.ref.update({
          name: summary.groupName,
          memberCount: members.count,
          updatedAt: admin.firestore.Timestamp.now(),
        });
        updated++;
      } catch {
        // Skip groups that fail (e.g. bot was removed)
      }
    }

    res.json({ ok: true, updated });
  } catch (err) {
    console.error(JSON.stringify({ event: 'sync_groups_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to sync groups' });
  }
});

export { router as groupsRouter };
