import * as admin from 'firebase-admin';
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { Client, WebhookEvent } from '@line/bot-sdk';

const MESSAGE_TTL_DAYS = 90;

// ─── Upsert group on join event ───────────────────────────────────────────────
// Called when the bot joins a group. Fetches group name from LINE API.
export async function upsertGroupOnJoin(
  db: Firestore,
  lineClient: Client,
  groupId: string,
  userId: string,
  officialAccountId: string
): Promise<void> {
  // Look both up before writing. If LINE can't answer, the group is still
  // recorded (so it shows up), but the name / head count already stored are
  // left alone and the error is rethrown at the end so the webhook retries.
  const [summary, members] = await Promise.allSettled([
    lineClient.getGroupSummary(groupId),
    lineClient.getGroupMembersCount(groupId),
  ]);

  const now = admin.firestore.Timestamp.now();
  const ref = db.collection('groups').doc(groupId);
  const existing = (await ref.get()).data();
  const lookedUp: Record<string, unknown> = {};
  if (summary.status === 'fulfilled') lookedUp.name = summary.value.groupName;
  else if (existing?.['name'] === undefined) lookedUp.name = groupId; // placeholder until the retry
  if (members.status === 'fulfilled') lookedUp.memberCount = members.value.count;
  else if (existing?.['memberCount'] === undefined) lookedUp.memberCount = 0;

  await ref.set(
    {
      groupId,
      officialAccountId,
      userId,
      ...lookedUp,
      lastMessageAt: now,
      lastMessagePreview: '',
      isActive: true,
      updatedAt: now,
    },
    { merge: true }
  );

  // Set createdAt only on first write (merge won't overwrite existing)
  if (!existing?.['createdAt']) {
    await ref.update({ createdAt: now });
  }

  const failed = [summary, members].find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failed) {
    throw new Error(`group info lookup failed for ${groupId}: ${String(failed.reason)}`);
  }
}

// ─── Mark group inactive on leave event ──────────────────────────────────────
export async function setGroupInactive(db: Firestore, groupId: string): Promise<void> {
  await db.collection('groups').doc(groupId).set(
    { isActive: false, updatedAt: admin.firestore.Timestamp.now() },
    { merge: true }
  );
}

// ─── Refresh member count on memberJoined/memberLeft ─────────────────────────
export async function refreshMemberCount(
  db: Firestore,
  lineClient: Client,
  groupId: string
): Promise<void> {
  // Errors propagate: the webhook answers 500 and LINE redelivers the event.
  const members = await lineClient.getGroupMembersCount(groupId);
  await db.collection('groups').doc(groupId).set(
    { memberCount: members.count, updatedAt: admin.firestore.Timestamp.now() },
    { merge: true }
  );
}

// ─── Update group metadata on every message ──────────────────────────────────
export async function updateGroupOnMessage(
  db: Firestore,
  groupId: string,
  userId: string,
  officialAccountId: string,
  content: string,
  timestamp: number
): Promise<void> {
  const now = admin.firestore.Timestamp.fromMillis(timestamp);
  const ref = db.collection('groups').doc(groupId);
  const existing = (await ref.get()).data();

  // A redelivered (older) event must not roll the "latest message" back.
  const last = existing?.['lastMessageAt'] as { toMillis?: () => number } | undefined;
  const lastMillis = typeof last?.toMillis === 'function' ? last.toMillis() : undefined;
  const isNewest = lastMillis === undefined || timestamp >= lastMillis;

  await ref.set(
    {
      groupId,
      userId,
      officialAccountId,
      isActive: true,
      ...(isNewest
        ? { lastMessageAt: now, lastMessagePreview: content.substring(0, 80), updatedAt: now }
        : {}),
      // Ensure createdAt is set for groups that joined before Phase 1
      ...(existing?.['createdAt'] ? {} : { createdAt: now }),
    },
    { merge: true }
  );
}

// ─── Append message to recentMessages subcollection (capped at 50) ───────────
export async function appendRecentMessage(
  db: Firestore,
  lineClient: Client,
  groupId: string,
  senderId: string,
  content: string,
  messageType: string,
  timestamp: number,
  eventId?: string
): Promise<void> {
  const colRef = db.collection('groups').doc(groupId).collection('recentMessages');

  // Resolve sender display name (best-effort)
  let senderName = senderId;
  try {
    const profile = await lineClient.getGroupMemberProfile(groupId, senderId);
    senderName = profile.displayName;
  } catch {
    // Non-critical — fall back to senderId
  }

  // TTL: auto-delete after 90 days (Firestore TTL policy on the `ttl` field)
  const ttl = new Date();
  ttl.setDate(ttl.getDate() + MESSAGE_TTL_DAYS);

  // Keyed by the LINE event id, so a redelivered event overwrites its own
  // entry instead of showing up twice.
  const docRef = eventId ? colRef.doc(eventId) : colRef.doc();
  await docRef.set({
    senderId,
    senderName,
    content,
    messageType,
    timestamp: admin.firestore.Timestamp.fromMillis(timestamp),
    ttl: admin.firestore.Timestamp.fromDate(ttl),
  });
}
