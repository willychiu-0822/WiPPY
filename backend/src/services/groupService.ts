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
  let name = groupId; // fallback
  let memberCount = 0;

  try {
    const summary = await lineClient.getGroupSummary(groupId);
    name = summary.groupName;
  } catch (err) {
    console.error(JSON.stringify({ event: 'group_summary_error', groupId, error: String(err) }));
  }

  try {
    const members = await lineClient.getGroupMembersCount(groupId);
    memberCount = members.count;
  } catch {
    // Non-critical — leave as 0
  }

  const now = admin.firestore.Timestamp.now();
  await db.collection('groups').doc(groupId).set(
    {
      groupId,
      officialAccountId,
      userId,
      name,
      memberCount,
      lastMessageAt: now,
      lastMessagePreview: '',
      isActive: true,
      updatedAt: now,
    },
    { merge: true }
  );

  // Set createdAt only on first write (merge won't overwrite existing)
  const snap = await db.collection('groups').doc(groupId).get();
  if (!snap.data()?.['createdAt']) {
    await db.collection('groups').doc(groupId).update({ createdAt: now });
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
  try {
    const members = await lineClient.getGroupMembersCount(groupId);
    await db.collection('groups').doc(groupId).set(
      { memberCount: members.count, updatedAt: admin.firestore.Timestamp.now() },
      { merge: true }
    );
  } catch (err) {
    console.error(JSON.stringify({ event: 'member_count_error', groupId, error: String(err) }));
  }
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
  await db.collection('groups').doc(groupId).set(
    {
      groupId,
      userId,
      officialAccountId,
      lastMessageAt: now,
      lastMessagePreview: content.substring(0, 80),
      isActive: true,
      updatedAt: now,
    },
    { merge: true }
  );

  // Ensure createdAt is set for groups that joined before Phase 1
  const snap = await db.collection('groups').doc(groupId).get();
  if (!snap.data()?.['createdAt']) {
    await db.collection('groups').doc(groupId).update({ createdAt: now });
  }
}

// ─── Append message to recentMessages subcollection (capped at 50) ───────────
export async function appendRecentMessage(
  db: Firestore,
  lineClient: Client,
  groupId: string,
  senderId: string,
  content: string,
  messageType: string,
  timestamp: number
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

  await colRef.add({
    senderId,
    senderName,
    content,
    messageType,
    timestamp: admin.firestore.Timestamp.fromMillis(timestamp),
    ttl: admin.firestore.Timestamp.fromDate(ttl),
  });
}
