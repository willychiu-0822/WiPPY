import express, { Request, Response } from 'express';
import { middleware, Client, WebhookEvent } from '@line/bot-sdk';
import * as admin from 'firebase-admin';
import { getDb } from '../firebase';
import {
  upsertGroupOnJoin,
  setGroupInactive,
  refreshMemberCount,
  updateGroupOnMessage,
  appendRecentMessage,
} from '../services/groupService';

const router = express.Router();

const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
};

const lineClient = new Client(lineConfig);

// Single-user V1 constants — set via Cloud Run env vars
const OWNER_USER_ID = process.env.OWNER_USER_ID!;
const OFFICIAL_ACCOUNT_ID = process.env.LINE_OFFICIAL_ACCOUNT_ID || 'default';

// LINE SDK middleware validates signature using raw body
router.post('/line', middleware(lineConfig), (req: Request, res: Response) => {
  // Respond immediately — LINE requires a response within 15 seconds
  res.json({ ok: true });

  // Process events out-of-band
  setImmediate(() => {
    const events: WebhookEvent[] = req.body.events;
    Promise.all(events.map(handleEvent)).catch((err) => {
      console.error(JSON.stringify({ event: 'webhook_error', error: String(err) }));
    });
  });
});

async function handleEvent(event: WebhookEvent): Promise<void> {
  const db = getDb();

  // ── Group: bot joined ─────────────────────────────────────────────────────
  if (event.type === 'join' && event.source.type === 'group') {
    await upsertGroupOnJoin(
      db, lineClient,
      event.source.groupId,
      OWNER_USER_ID,
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

    if (event.message.type === 'text') {
      const content = event.message.text;

      await updateGroupOnMessage(
        db, groupId, OWNER_USER_ID, OFFICIAL_ACCOUNT_ID, content, event.timestamp
      );
      await appendRecentMessage(
        db, lineClient, groupId, senderId, content, 'text', event.timestamp
      );

      // TODO Phase 4: checkKeywordTriggers(db, lineClient, groupId, content)
      // TODO Phase 4: checkAndCapture(db, groupId, senderId, content, event.timestamp)
    } else {
      // Non-text message — just update group's lastMessageAt
      await updateGroupOnMessage(
        db, groupId, OWNER_USER_ID, OFFICIAL_ACCOUNT_ID,
        `[${event.message.type}]`, event.timestamp
      );
    }
    return;
  }

  // ── V1: Postback (feel emoji button taps from Flex Message) ──────────────
  if (event.type === 'postback') {
    const data = new URLSearchParams(event.postback.data);
    const slotId = data.get('slotId');
    const userId = data.get('userId');
    const feelEmoji = data.get('feel');

    const EMOJI_MAP: Record<string, string> = { good: '😊', ok: '🟡', cloud: '☁️' };
    const emoji = (feelEmoji && EMOJI_MAP[feelEmoji]) || '🟡';

    if (!slotId || !userId) {
      console.warn('Missing slotId or userId in postback data');
      return;
    }

    const now = admin.firestore.Timestamp.now();
    const slotRef = db.collection('users').doc(userId).collection('slots').doc(slotId);
    const slotSnap = await slotRef.get();

    if (!slotSnap.exists) {
      console.warn(`Slot ${slotId} not found for user ${userId}`);
      return;
    }

    const slotData = slotSnap.data()!;
    await slotRef.update({ status: 'recorded', feelEmoji: emoji, recordedAt: now });
    await db.collection('users').doc(userId).collection('records').add({
      slotId,
      wishId: slotData['wishId'],
      wishName: slotData['wishName'],
      date: slotData['date'],
      feelEmoji: emoji,
      recordedAt: now,
    });

    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: `已紀錄 ${emoji}！繼續加油 ✨`,
    });
    return;
  }

  // ── V1: Follow event ──────────────────────────────────────────────────────
  if (event.type === 'follow') {
    console.log(`New follower: ${event.source.userId}`);
    return;
  }

  // ── V1: Direct message (WIPPY_LINK token or help) ─────────────────────────
  if (event.type === 'message' && event.message.type === 'text' && event.source.type === 'user') {
    const lineUserId = event.source.userId;
    const text = event.message.text.trim();

    if (text.startsWith('WIPPY_LINK:')) {
      const linkToken = text.replace('WIPPY_LINK:', '').trim();
      await processLinkToken(lineUserId, linkToken, event.replyToken);
      return;
    }

    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '嗨！WiPPY 會在你的時段結束後通知你紀錄體感。請先完成 Web 設定 👆',
    });
  }
}

async function processLinkToken(
  lineUserId: string,
  linkToken: string,
  replyToken: string
): Promise<void> {
  const db = getDb();
  const linkRef = db.collection('lineLinks').doc(linkToken);
  const linkSnap = await linkRef.get();

  if (!linkSnap.exists) {
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '連結碼無效或已過期，請回到 WiPPY 網頁重新取得連結碼。',
    });
    return;
  }

  const { userId, expiresAt } = linkSnap.data()!;
  if ((expiresAt as admin.firestore.Timestamp).toDate() < new Date()) {
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '連結碼已過期，請回到 WiPPY 網頁重新取得。',
    });
    await linkRef.delete();
    return;
  }

  await db.collection('users').doc(userId as string).update({
    lineUserId,
    lineLinkedAt: admin.firestore.Timestamp.now(),
  });
  await linkRef.delete();

  await lineClient.replyMessage(replyToken, {
    type: 'text',
    text: '綁定成功！🎉 WiPPY 會在時段結束後通知你紀錄體感，期待與你一起成長 💪',
  });
}

export { router as webhookRouter };
