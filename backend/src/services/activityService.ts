import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import type {
  Activity,
  ActivityStatus,
  ActivityReviewStatus,
  ActivityMessage,
  MessageReviewStatus,
  ActivityKnowledge,
  KnowledgeType,
  KnowledgeSourceType,
} from '../types';

// ─── Activity ─────────────────────────────────────────────────────────────────

export async function createActivity(
  db: Firestore,
  userId: string,
  data: { name: string; targetGroups: string[] }
): Promise<Activity> {
  const now = admin.firestore.Timestamp.now();
  const ref = db.collection('activities').doc();
  const activity: Activity = {
    id: ref.id,
    userId,
    name: data.name,
    targetGroups: data.targetGroups,
    status: 'draft',
    reviewStatus: 'pending_review',
    approvedAt: null,
    agentSessionId: null,
    eventStartAt: null,
    eventEndAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(activity);
  return activity;
}

export async function getActivity(
  db: Firestore,
  activityId: string,
  userId: string
): Promise<Activity | null> {
  const snap = await db.collection('activities').doc(activityId).get();
  if (!snap.exists) return null;
  const data = snap.data() as Activity;
  if (data.userId !== userId) return null;
  return data;
}

export async function listActivities(
  db: Firestore,
  userId: string
): Promise<Activity[]> {
  try {
    const snap = await db
      .collection('activities')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((d) => d.data() as Activity);
  } catch (err) {
    const message = String(err);
    const isIndexNotReady =
      message.includes('FAILED_PRECONDITION') &&
      (message.includes('requires an index') || message.includes('currently building'));

    if (!isIndexNotReady) throw err;

    const snap = await db
      .collection('activities')
      .where('userId', '==', userId)
      .get();

    const activities = snap.docs.map((d) => d.data() as Activity);
    activities.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    return activities;
  }
}

export async function updateActivity(
  db: Firestore,
  activityId: string,
  userId: string,
  patch: Partial<Pick<Activity, 'name' | 'targetGroups' | 'status' | 'eventStartAt' | 'eventEndAt' | 'agentSessionId'>>
): Promise<Activity | null> {
  const ref = db.collection('activities').doc(activityId);
  const snap = await ref.get();
  if (!snap.exists || (snap.data() as Activity).userId !== userId) return null;
  await ref.update({ ...patch, updatedAt: admin.firestore.Timestamp.now() });
  const updated = await ref.get();
  return updated.data() as Activity;
}

export async function approveActivity(
  db: Firestore,
  activityId: string,
  userId: string
): Promise<Activity | null> {
  const ref = db.collection('activities').doc(activityId);
  const snap = await ref.get();
  if (!snap.exists || (snap.data() as Activity).userId !== userId) return null;

  const now = admin.firestore.Timestamp.now();
  const batch = db.batch();

  batch.update(ref, {
    status: 'active' as ActivityStatus,
    reviewStatus: 'approved' as ActivityReviewStatus,
    approvedAt: now,
    updatedAt: now,
  });

  // Approve all pending_review messages in one batch
  const msgsSnap = await ref
    .collection('activityMessages')
    .where('reviewStatus', '==', 'pending_review')
    .get();
  msgsSnap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      reviewStatus: 'approved' as MessageReviewStatus,
      updatedAt: now,
    });
  });

  await batch.commit();
  const updated = await ref.get();
  return updated.data() as Activity;
}

export async function requestRevision(
  db: Firestore,
  activityId: string,
  userId: string
): Promise<Activity | null> {
  const ref = db.collection('activities').doc(activityId);
  const snap = await ref.get();
  if (!snap.exists || (snap.data() as Activity).userId !== userId) return null;

  const now = admin.firestore.Timestamp.now();
  const batch = db.batch();

  batch.update(ref, {
    reviewStatus: 'revision_requested' as ActivityReviewStatus,
    updatedAt: now,
  });

  // Lock all pending messages — scheduler will skip them until re-approved
  const msgsSnap = await ref
    .collection('activityMessages')
    .where('status', '==', 'pending')
    .get();
  msgsSnap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      reviewStatus: 'pending_review' as MessageReviewStatus,
      updatedAt: now,
    });
  });

  await batch.commit();
  const updated = await ref.get();
  return updated.data() as Activity;
}

// ─── Activity Message ─────────────────────────────────────────────────────────

export async function listMessages(
  db: Firestore,
  activityId: string,
  userId: string
): Promise<ActivityMessage[]> {
  const activity = await getActivity(db, activityId, userId);
  if (!activity) return [];
  const snap = await db
    .collection('activities')
    .doc(activityId)
    .collection('activityMessages')
    .orderBy('sequenceOrder', 'asc')
    .get();
  return snap.docs.map((d) => d.data() as ActivityMessage);
}

export async function createMessage(
  db: Firestore,
  activityId: string,
  userId: string,
  data: {
    content: string;
    targetGroups: string[];
    triggerType: 'scheduled' | 'keyword';
    triggerValue: string;
    sequenceOrder: number;
    generatedByAgent?: boolean;
    agentSessionId?: string | null;
  }
): Promise<ActivityMessage | null> {
  const activity = await getActivity(db, activityId, userId);
  if (!activity) return null;

  const now = admin.firestore.Timestamp.now();
  const ref = db
    .collection('activities')
    .doc(activityId)
    .collection('activityMessages')
    .doc();

  const message: ActivityMessage = {
    id: ref.id,
    activityId,
    userId,
    content: data.content,
    targetGroups: data.targetGroups,
    triggerType: data.triggerType,
    triggerValue: data.triggerValue,
    cooldownMinutes: null,
    status: 'pending',
    reviewStatus: 'pending_review',
    generatedByAgent: data.generatedByAgent ?? false,
    agentSessionId: data.agentSessionId ?? null,
    sequenceOrder: data.sequenceOrder,
    sendWindowStart: null,
    sendWindowEnd: null,
    sentAt: null,
    processingAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(message);
  return message;
}

export async function updateMessage(
  db: Firestore,
  activityId: string,
  messageId: string,
  userId: string,
  patch: Partial<Pick<ActivityMessage, 'content' | 'targetGroups' | 'triggerValue' | 'sequenceOrder'>>
): Promise<ActivityMessage | null> {
  const activity = await getActivity(db, activityId, userId);
  if (!activity) return null;

  const ref = db
    .collection('activities')
    .doc(activityId)
    .collection('activityMessages')
    .doc(messageId);

  const snap = await ref.get();
  if (!snap.exists) return null;

  await ref.update({ ...patch, updatedAt: admin.firestore.Timestamp.now() });
  const updated = await ref.get();
  return updated.data() as ActivityMessage;
}

export async function deleteMessage(
  db: Firestore,
  activityId: string,
  messageId: string,
  userId: string
): Promise<boolean> {
  const activity = await getActivity(db, activityId, userId);
  if (!activity) return false;

  const ref = db
    .collection('activities')
    .doc(activityId)
    .collection('activityMessages')
    .doc(messageId);

  const snap = await ref.get();
  if (!snap.exists) return false;

  await ref.delete();
  return true;
}

// ─── Activity Knowledge ───────────────────────────────────────────────────────

export async function listKnowledge(
  db: Firestore,
  activityId: string,
  userId: string
): Promise<ActivityKnowledge[]> {
  const activity = await getActivity(db, activityId, userId);
  if (!activity) return [];
  try {
    const snap = await db
      .collection('activityKnowledge')
      .where('activityId', '==', activityId)
      .where('userId', '==', userId)
      .orderBy('knowledgeType', 'asc')
      .orderBy('createdAt', 'asc')
      .get();
    return snap.docs.map((d) => d.data() as ActivityKnowledge);
  } catch (err) {
    const message = String(err);
    const isIndexNotReady =
      message.includes('FAILED_PRECONDITION') &&
      (message.includes('requires an index') || message.includes('currently building'));

    if (!isIndexNotReady) throw err;

    const snap = await db
      .collection('activityKnowledge')
      .where('userId', '==', userId)
      .get();

    const knowledge = snap.docs
      .map((d) => d.data() as ActivityKnowledge)
      .filter((item) => item.activityId === activityId);

    knowledge.sort((a, b) => {
      if (a.knowledgeType !== b.knowledgeType) {
        return a.knowledgeType.localeCompare(b.knowledgeType);
      }
      return a.createdAt.toMillis() - b.createdAt.toMillis();
    });

    return knowledge;
  }
}

export async function createKnowledge(
  db: Firestore,
  activityId: string,
  userId: string,
  data: {
    knowledgeType: KnowledgeType;
    title: string;
    content: string;
    sourceType?: KnowledgeSourceType;
    targetGroupId?: string | null;
  }
): Promise<ActivityKnowledge | null> {
  const activity = await getActivity(db, activityId, userId);
  if (!activity) return null;

  const now = admin.firestore.Timestamp.now();
  const ref = db.collection('activityKnowledge').doc();
  const knowledge: ActivityKnowledge = {
    id: ref.id,
    activityId,
    userId,
    knowledgeType: data.knowledgeType,
    title: data.title,
    content: data.content,
    sourceType: data.sourceType ?? 'manual',
    targetGroupId: data.targetGroupId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(knowledge);
  return knowledge;
}

export async function updateKnowledge(
  db: Firestore,
  knowledgeId: string,
  userId: string,
  patch: Partial<Pick<ActivityKnowledge, 'title' | 'content' | 'knowledgeType' | 'targetGroupId'>>
): Promise<ActivityKnowledge | null> {
  const ref = db.collection('activityKnowledge').doc(knowledgeId);
  const snap = await ref.get();
  if (!snap.exists || (snap.data() as ActivityKnowledge).userId !== userId) return null;
  await ref.update({ ...patch, updatedAt: admin.firestore.Timestamp.now() });
  const updated = await ref.get();
  return updated.data() as ActivityKnowledge;
}

export async function deleteKnowledge(
  db: Firestore,
  knowledgeId: string,
  userId: string
): Promise<boolean> {
  const ref = db.collection('activityKnowledge').doc(knowledgeId);
  const snap = await ref.get();
  if (!snap.exists || (snap.data() as ActivityKnowledge).userId !== userId) return false;
  await ref.delete();
  return true;
}
