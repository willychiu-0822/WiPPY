import express, { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { getDb } from '../firebase';
import { getLineClient } from '../line';

const router = express.Router();

// Called by Cloud Scheduler every minute: send due, approved ActivityMessages.
router.post('/tick', async (_req: Request, res: Response) => {
  try {
    const sent = await processScheduledActivityMessages();
    res.json({ ok: true, sent });
  } catch (err) {
    console.error('Scheduler tick error:', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ── Process scheduled ActivityMessages ────────────────────────────────────

async function processScheduledActivityMessages(): Promise<number> {
  const db = getDb();
  const now = admin.firestore.Timestamp.now();

  // Find pending approved scheduled messages whose triggerValue is due
  const snapshot = await db.collectionGroup('activityMessages')
    .where('status', '==', 'pending')
    .where('triggerType', '==', 'scheduled')
    .where('reviewStatus', '==', 'approved')
    .where('processingAt', '==', null)
    .get();

  if (snapshot.empty) return 0;

  let sent = 0;

  for (const doc of snapshot.docs) {
    // Datetimes may use Z or any ISO offset. Compare instants, never string order.
    if (Date.parse(doc.data()['triggerValue']) > now.toMillis()) continue;
    let msg: FirebaseFirestore.DocumentData | null;
    try {
      msg = await db.runTransaction(async transaction => {
        const fresh = await transaction.get(doc.ref);
        if (!fresh.exists) return null;
        const data = fresh.data()!;
        if (data['status'] !== 'pending' || data['reviewStatus'] !== 'approved' || data['processingAt'] != null
          || !Number.isFinite(Date.parse(data['triggerValue'])) || Date.parse(data['triggerValue']) > now.toMillis()) return null;
        const activity = await transaction.get(db.collection('activities').doc(data['activityId']));
        if (!activity.exists || activity.data()!['status'] !== 'active' || activity.data()!['reviewStatus'] !== 'approved'
          || activity.data()!['userId'] !== data['userId']) return null;
        transaction.update(doc.ref, { processingAt: now, updatedAt: now });
        return data;
      });
    } catch { continue; }
    if (!msg) continue;

    // Lifecycle gate: check parent Activity is active
    const activityId = msg['activityId'] as string;
    const activitySnap = await db.collection('activities').doc(activityId).get();
    if (!activitySnap.exists || activitySnap.data()!['status'] !== 'active' || activitySnap.data()!['reviewStatus'] !== 'approved') {
      await doc.ref.update({ processingAt: null, updatedAt: now });
      continue;
    }

    // Check sendWindow if set
    const sendWindowStart = msg['sendWindowStart'] as admin.firestore.Timestamp | null;
    const sendWindowEnd = msg['sendWindowEnd'] as admin.firestore.Timestamp | null;
    if (sendWindowStart && now.seconds < sendWindowStart.seconds) {
      await doc.ref.update({ processingAt: null, updatedAt: now });
      continue;
    }
    if (sendWindowEnd && now.seconds > sendWindowEnd.seconds) {
      // Window expired — mark failed rather than silently skip
      await doc.ref.update({
        status: 'failed',
        processingAt: null,
        updatedAt: now,
      });
      await writeSendLog(db, msg, 'failed', null, 'Send window expired');
      continue;
    }

    const targetGroups = msg['targetGroups'] as string[];
    const content = msg['content'] as string;
    const userId = msg['userId'] as string;
    const msgId = doc.id;

    let firstLineMessageId: string | null = null;
    let sendStatus: 'success' | 'failed' = 'success';
    let errorMessage: string | null = null;

    // Push to each target group
    for (const groupId of targetGroups) {
      try {
        const group = await db.collection('groups').doc(groupId).get();
        if (!group.exists || group.data()!['userId'] !== userId || group.data()!['isActive'] === false) throw new Error('Group not found');
        const lineClient = getLineClient();
        const resp = await lineClient.pushMessage(groupId, { type: 'text', text: content });
        if (!firstLineMessageId) {
          firstLineMessageId = (resp as { messageId?: string })?.messageId ?? null;
        }
        await writeSendLog(db, msg, 'success', firstLineMessageId, null, groupId);
      } catch (err) {
        sendStatus = 'failed';
        errorMessage = String(err);
        await writeSendLog(db, msg, 'failed', null, errorMessage, groupId);
        console.error(JSON.stringify({
          event: 'scheduler_send_error',
          activityId,
          msgId,
          groupId,
          error: errorMessage,
        }));
      }
    }

    if (sendStatus === 'success') {
      await doc.ref.update({
        status: 'sent',
        sentAt: now,
        processingAt: null,
        updatedAt: now,
      });
      sent++;
    } else {
      await doc.ref.update({
        status: 'failed',
        processingAt: null,
        updatedAt: now,
      });
    }
  }

  return sent;
}

async function writeSendLog(
  db: ReturnType<typeof getDb>,
  msg: FirebaseFirestore.DocumentData,
  status: 'success' | 'failed',
  lineMessageId: string | null,
  errorMessage: string | null,
  groupId?: string
): Promise<void> {
  await db.collection('sendLogs').add({
    userId: msg['userId'],
    activityId: msg['activityId'],
    activityMessageId: msg['id'] ?? null,
    groupId: groupId ?? (msg['targetGroups']?.[0] ?? ''),
    content: msg['content'],
    status,
    errorMessage,
    lineMessageId,
    triggerType: 'scheduled',
    sentAt: admin.firestore.Timestamp.now(),
  });
}

export { router as schedulerRouter };
