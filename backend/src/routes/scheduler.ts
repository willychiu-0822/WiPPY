import express, { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { formatInTimeZone } from 'date-fns-tz';
import { getDb } from '../firebase';
import { getLineClient } from '../line';

const router = express.Router();

const TZ = 'Asia/Taipei';

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
  // triggerValue is stored as "+08:00" local strings; use the same format for comparison
  const nowIso = formatInTimeZone(new Date(now.seconds * 1000), TZ, "yyyy-MM-dd'T'HH:mm:ssxxx");

  // Find pending approved scheduled messages whose triggerValue is due
  const snapshot = await db.collectionGroup('activityMessages')
    .where('status', '==', 'pending')
    .where('triggerType', '==', 'scheduled')
    .where('reviewStatus', '==', 'approved')
    .where('triggerValue', '<=', nowIso)
    .where('processingAt', '==', null)
    .get();

  if (snapshot.empty) return 0;

  let sent = 0;

  for (const doc of snapshot.docs) {
    const msg = doc.data();

    // Acquire dedup lock — skip if another tick already locked this doc
    try {
      await doc.ref.update({
        processingAt: now,
        updatedAt: now,
      });
    } catch {
      continue;
    }

    // Lifecycle gate: check parent Activity is active
    const activityId = msg['activityId'] as string;
    const activitySnap = await db.collection('activities').doc(activityId).get();
    if (!activitySnap.exists || activitySnap.data()!['status'] !== 'active') {
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
