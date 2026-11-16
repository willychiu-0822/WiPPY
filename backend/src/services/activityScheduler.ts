import * as admin from 'firebase-admin';
import { getDb } from '../firebase';
import { pushLineText } from '../line';
import { backoffSeconds } from '../hub/core/jobs';
import { retryKeyFor } from '../hub/send';
import { MAX_SEND_ATTEMPTS, isSendLockActive, scheduledTriggerAt, timeToMillis } from './activitySchedule';

// Sends due, approved activity messages. Runs as the `tick` task of the single
// scheduler entry (hub/http/schedulerRoutes.ts); it has no route of its own.
//
// Three guarantees:
//  1. The query only reads messages that are due (`triggerAt <= now`).
//  2. A send lock (`processingAt`) left behind by a dead worker is reclaimed
//     after SEND_LOCK_TTL_MS.
//  3. Results are stored per group (`deliveries`). A later round only pushes to
//     groups that have not got the message, and every push carries a LINE retry
//     key derived from (message, group), so a repeat is delivered once.

type Db = ReturnType<typeof getDb>;
type Doc = FirebaseFirestore.QueryDocumentSnapshot;
type Delivery = {
  status: 'sent' | 'failed';
  attempts: number;
  lineMessageId: string | null;
  errorMessage: string | null;
  retryable: boolean;
  updatedAt: admin.firestore.Timestamp;
};

/** Upper bound of messages handled per tick; the rest are picked up next minute. */
const DUE_BATCH_LIMIT = 200;

const BACKFILL_DOC = ['systemState', 'activityMessageTriggerAtBackfill'] as const;
const BACKFILL_WINDOW_MS = 24 * 60 * 60 * 1000;
const BACKFILL_INTERVAL_MS = 10 * 60 * 1000;
let backfillFinished = false;

/** Test hook: forget that this process already saw the backfill finish. */
export function resetBackfillStateForTests(): void {
  backfillFinished = false;
}

function isMissingIndex(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code;
  return code === 9 || code === 'failed-precondition' || code === 'FAILED_PRECONDITION';
}

function logWarn(event: string, extra: Record<string, unknown>): void {
  console.warn(JSON.stringify({ severity: 'WARNING', event, ...extra }));
}

function scheduledQuery(db: Db) {
  return db.collectionGroup('activityMessages')
    .where('status', '==', 'pending')
    .where('triggerType', '==', 'scheduled');
}

/**
 * Messages written before `triggerAt` existed would never match the due query.
 * For the first 24 hours after rollout (covers instances of the old revision
 * that are still writing), at most every 10 minutes, fill the field in. After
 * that this costs one marker read per cold start.
 */
async function backfillTriggerAt(db: Db, nowMs: number): Promise<void> {
  if (backfillFinished) return;
  try {
    const markerRef = db.collection(BACKFILL_DOC[0]).doc(BACKFILL_DOC[1]);
    const marker = await markerRef.get();
    const first = marker.exists ? Number(marker.data()!['firstRunAtMs']) : null;
    const last = marker.exists ? Number(marker.data()!['lastRunAtMs']) : null;
    if (first !== null && last !== null) {
      if (last - first >= BACKFILL_WINDOW_MS) { backfillFinished = true; return; }
      if (nowMs - last < BACKFILL_INTERVAL_MS) return;
    }
    let docs: Doc[];
    try {
      docs = (await scheduledQuery(db).orderBy('triggerValue').get()).docs;
    } catch (err) {
      if (!isMissingIndex(err)) throw err;
      // New index still building: at least cover the approved ones via the old index.
      docs = (await scheduledQuery(db).where('reviewStatus', '==', 'approved').orderBy('triggerValue').get()).docs;
    }
    let filled = 0;
    for (const doc of docs) {
      if (doc.data()['triggerAt'] != null) continue;
      const triggerAt = scheduledTriggerAt('scheduled', doc.data()['triggerValue']);
      if (!triggerAt) continue;
      await doc.ref.update({ triggerAt });
      filled++;
    }
    await markerRef.set({ firstRunAtMs: first ?? nowMs, lastRunAtMs: nowMs });
    if (filled) console.log(JSON.stringify({ event: 'scheduler_trigger_at_backfill', filled }));
  } catch (err) {
    logWarn('scheduler_trigger_at_backfill_failed', { error: String(err) });
  }
}

async function findDueMessages(db: Db, now: admin.firestore.Timestamp): Promise<Doc[]> {
  const approved = () => scheduledQuery(db).where('reviewStatus', '==', 'approved');
  try {
    const snapshot = await approved()
      .where('triggerAt', '<=', now)
      .orderBy('triggerAt')
      .limit(DUE_BATCH_LIMIT)
      .get();
    return snapshot.docs;
  } catch (err) {
    if (!isMissingIndex(err)) throw err;
    // The triggerAt index is not ready yet (it builds in the background after a
    // deploy). Keep sending with the old read-everything query meanwhile.
    logWarn('scheduler_due_index_missing', { error: String(err) });
    const snapshot = await approved().orderBy('triggerValue').get();
    return snapshot.docs.filter(doc => Date.parse(doc.data()['triggerValue']) <= now.toMillis());
  }
}

function isDue(data: FirebaseFirestore.DocumentData, nowMs: number): boolean {
  const due = Date.parse(data['triggerValue']);
  if (!Number.isFinite(due) || due > nowMs) return false;
  const retryAt = timeToMillis(data['nextRetryAt']);
  return retryAt === null || retryAt <= nowMs;
}

/** LINE 4xx (except 408/429) will not get better by trying again. */
function isRetryableSendError(err: unknown): boolean {
  if (err instanceof GroupUnavailableError) return false;
  const status = (err as { status?: unknown })?.status;
  if (typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
  return true;
}

class GroupUnavailableError extends Error {}

// ── Process scheduled ActivityMessages ────────────────────────────────────

export async function processScheduledActivityMessages(): Promise<number> {
  const db = getDb();
  const tickStart = admin.firestore.Timestamp.now();

  await backfillTriggerAt(db, tickStart.toMillis());

  const docs = await findDueMessages(db, tickStart);
  let sent = 0;

  for (const doc of docs) {
    const now = admin.firestore.Timestamp.now();
    const nowMs = now.toMillis();
    let msg: FirebaseFirestore.DocumentData | null;
    try {
      // Claim: take the lock only if nobody holds a live one.
      msg = await db.runTransaction(async transaction => {
        const fresh = await transaction.get(doc.ref);
        if (!fresh.exists) return null;
        const data = fresh.data()!;
        if (data['status'] !== 'pending' || data['reviewStatus'] !== 'approved' || !isDue(data, nowMs)) return null;
        if (isSendLockActive(data['processingAt'], nowMs)) return null;
        const activity = await transaction.get(db.collection('activities').doc(data['activityId']));
        if (!activity.exists || activity.data()!['status'] !== 'active' || activity.data()!['reviewStatus'] !== 'approved'
          || activity.data()!['userId'] !== data['userId']) return null;
        if (data['processingAt'] != null) {
          logWarn('scheduler_lock_reclaimed', { activityId: data['activityId'], msgId: doc.id });
        }
        transaction.update(doc.ref, { processingAt: now, updatedAt: now });
        return data;
      });
    } catch { continue; }
    if (!msg) continue;

    // Check sendWindow if set
    const sendWindowStart = msg['sendWindowStart'] as admin.firestore.Timestamp | null;
    const sendWindowEnd = msg['sendWindowEnd'] as admin.firestore.Timestamp | null;
    if (sendWindowStart && now.seconds < sendWindowStart.seconds) {
      await doc.ref.update({ processingAt: null, updatedAt: now });
      continue;
    }
    if (sendWindowEnd && now.seconds > sendWindowEnd.seconds) {
      // Window expired — mark failed rather than silently skip
      await doc.ref.update({ status: 'failed', processingAt: null, nextRetryAt: null, updatedAt: now });
      await writeSendLog(db, msg, doc.id, 'failed', null, 'Send window expired');
      continue;
    }

    const activityId = msg['activityId'] as string;
    const targetGroups = msg['targetGroups'] as string[];
    const content = msg['content'] as string;
    const userId = msg['userId'] as string;
    const msgId = doc.id;
    const deliveries: Record<string, Delivery> = { ...(msg['deliveries'] as Record<string, Delivery> | undefined) };

    for (const groupId of targetGroups) {
      const previous = deliveries[groupId];
      if (previous?.status === 'sent') continue; // already got it in an earlier round
      const attempts = (previous?.attempts ?? 0) + 1;
      try {
        const group = await db.collection('groups').doc(groupId).get();
        if (!group.exists || group.data()!['userId'] !== userId || group.data()!['isActive'] === false) {
          throw new GroupUnavailableError('Group not found');
        }
        const lineMessageId = await pushLineText(groupId, content, retryKeyFor(`activity-message:${activityId}:${msgId}:${groupId}`));
        deliveries[groupId] = { status: 'sent', attempts, lineMessageId, errorMessage: null, retryable: false, updatedAt: now };
        // Record right away: if we die after this, the next round skips this group.
        await doc.ref.update({ deliveries, updatedAt: now });
        await writeSendLog(db, msg, msgId, 'success', lineMessageId, null, groupId);
      } catch (err) {
        const errorMessage = String(err);
        deliveries[groupId] = {
          status: 'failed', attempts, lineMessageId: null, errorMessage,
          retryable: isRetryableSendError(err), updatedAt: now,
        };
        await doc.ref.update({ deliveries, updatedAt: now });
        await writeSendLog(db, msg, msgId, 'failed', null, errorMessage, groupId);
        console.error(JSON.stringify({
          event: 'scheduler_send_error',
          activityId,
          msgId,
          groupId,
          error: errorMessage,
        }));
      }
    }

    const failed = targetGroups.filter(groupId => deliveries[groupId]?.status !== 'sent');
    const sendAttempts = (Number(msg['sendAttempts']) || 0) + 1;
    if (failed.length === 0) {
      await doc.ref.update({
        status: 'sent', sentAt: now, processingAt: null, nextRetryAt: null, sendAttempts, deliveries, updatedAt: now,
      });
      sent++;
    } else if (sendAttempts < MAX_SEND_ATTEMPTS && failed.some(groupId => deliveries[groupId].retryable)) {
      // Stay pending; the next due round retries only the groups still missing.
      await doc.ref.update({
        processingAt: null,
        sendAttempts,
        nextRetryAt: new Date(nowMs + backoffSeconds(sendAttempts) * 1000),
        deliveries,
        updatedAt: now,
      });
    } else {
      await doc.ref.update({
        status: 'failed', processingAt: null, nextRetryAt: null, sendAttempts, deliveries, updatedAt: now,
      });
    }
  }

  return sent;
}

async function writeSendLog(
  db: Db,
  msg: FirebaseFirestore.DocumentData,
  msgId: string,
  status: 'success' | 'failed',
  lineMessageId: string | null,
  errorMessage: string | null,
  groupId?: string
): Promise<void> {
  await db.collection('sendLogs').add({
    userId: msg['userId'],
    activityId: msg['activityId'],
    activityMessageId: msg['id'] ?? msgId,
    groupId: groupId ?? (msg['targetGroups']?.[0] ?? ''),
    content: msg['content'],
    status,
    errorMessage,
    lineMessageId,
    triggerType: 'scheduled',
    sentAt: admin.firestore.Timestamp.now(),
  });
}
