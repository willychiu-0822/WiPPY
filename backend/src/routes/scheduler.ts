import express, { Request, Response } from 'express';
import { Client } from '@line/bot-sdk';
import * as admin from 'firebase-admin';
import { formatInTimeZone } from 'date-fns-tz';
import { getDb } from '../firebase';

const router = express.Router();

const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

const TZ = 'Asia/Taipei';

// ── V1: Called by Cloud Scheduler every minute (legacy route, keep for V1) ───
router.post('/notify', async (_req: Request, res: Response) => {
  try {
    const count = await sendPendingNotifications();
    res.json({ ok: true, notified: count });
  } catch (err) {
    console.error('Scheduler error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// ── V2: New scheduler tick endpoint ──────────────────────────────────────────
router.post('/tick', async (_req: Request, res: Response) => {
  try {
    const [v1Result, v2Result] = await Promise.allSettled([
      sendPendingNotifications(),
      processScheduledActivityMessages(),
    ]);

    const v1Ok = v1Result.status === 'fulfilled';
    const v2Ok = v2Result.status === 'fulfilled';
    const v1Count = v1Ok ? v1Result.value : 0;
    const v2Count = v2Ok ? v2Result.value : 0;

    if (!v1Ok) {
      console.error('Scheduler V1 error:', v1Result.reason);
    }
    if (!v2Ok) {
      console.error('Scheduler V2 error:', v2Result.reason);
    }

    const allOk = v1Ok && v2Ok;
    res.status(allOk ? 200 : 207).json({
      ok: allOk,
      v1: {
        ok: v1Ok,
        notified: v1Count,
        error: v1Ok ? null : String(v1Result.reason),
      },
      v2: {
        ok: v2Ok,
        sent: v2Count,
        error: v2Ok ? null : String(v2Result.reason),
      },
    });
  } catch (err) {
    console.error('Scheduler tick unexpected error:', err);
    res.status(500).json({ error: String(err) });
  }
});

async function sendPendingNotifications(): Promise<number> {
  const db = getDb();
  const nowTZ = formatInTimeZone(new Date(), TZ, 'HH:mm');
  const todayTZ = formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');

  const snapshot = await db.collectionGroup('slots')
    .where('status', '==', 'pending')
    .where('date', '==', todayTZ)
    .get();

  let notified = 0;
  const batch = db.batch();
  const pushPromises: Promise<unknown>[] = [];

  for (const doc of snapshot.docs) {
    const slot = doc.data();

    if (slot['endTime'] > nowTZ) continue;

    const userId = doc.ref.parent.parent!.id;

    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) continue;

    const { lineUserId } = userSnap.data()!;
    if (!lineUserId) continue;

    batch.update(doc.ref, {
      status: 'notified',
      notifiedAt: admin.firestore.Timestamp.now(),
    });

    pushPromises.push(
      sendFeelPrompt(
        lineUserId as string,
        userId,
        doc.id,
        slot['wishName'] as string,
        slot['startTime'] as string,
        slot['endTime'] as string
      )
    );

    notified++;
  }

  await batch.commit();
  await Promise.allSettled(pushPromises);

  return notified;
}

async function sendFeelPrompt(
  lineUserId: string,
  userId: string,
  slotId: string,
  wishName: string,
  startTime: string,
  endTime: string
): Promise<void> {
  const message = {
    type: 'flex' as const,
    altText: `剛才的「${wishName}」感覺如何？`,
    contents: {
      type: 'bubble' as const,
      size: 'kilo' as const,
      header: {
        type: 'box' as const,
        layout: 'vertical' as const,
        contents: [
          { type: 'text' as const, text: 'WiPPY 體感紀錄', size: 'xs' as const, color: '#888888' },
          { type: 'text' as const, text: `「${wishName}」`, size: 'lg' as const, weight: 'bold' as const, color: '#1A73E8' },
          { type: 'text' as const, text: `${startTime} - ${endTime}`, size: 'xs' as const, color: '#888888' },
        ],
        paddingAll: '16px',
        backgroundColor: '#F8F9FA',
      },
      body: {
        type: 'box' as const,
        layout: 'vertical' as const,
        contents: [
          { type: 'text' as const, text: '剛才的時段，感覺如何？', size: 'md' as const, align: 'center' as const, margin: 'md' as const },
        ],
        paddingAll: '12px',
      },
      footer: {
        type: 'box' as const,
        layout: 'horizontal' as const,
        spacing: 'sm' as const,
        contents: [
          makeButton('😊', 'good', slotId, userId, '#34A853'),
          makeButton('🟡', 'ok', slotId, userId, '#FBBC04'),
          makeButton('☁️', 'cloud', slotId, userId, '#9E9E9E'),
        ],
        paddingAll: '12px',
      },
    },
  };

  await lineClient.pushMessage(lineUserId, message);
}

function makeButton(emoji: string, feel: string, slotId: string, userId: string, color: string) {
  return {
    type: 'button' as const,
    style: 'primary' as const,
    color,
    action: {
      type: 'postback' as const,
      label: emoji,
      data: `slotId=${slotId}&userId=${userId}&feel=${feel}`,
      displayText: emoji,
    },
    height: 'sm' as const,
  };
}

// ── V2: Process scheduled ActivityMessages ────────────────────────────────────

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
