import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import type { ActivityMessage } from '../types';

const BATCH_LIMIT = 499;

export interface MessageDraft {
  content: string;
  targetGroups: string[];
  triggerValue: string;
  sequenceOrder: number;
  agentSessionId: string;
  runId: string;
  activityId: string;
  userId: string;
}

export interface KnowledgeDraft {
  knowledgeType: string;
  title: string;
  content: string;
  activityId: string;
  userId: string;
  runId: string;
}

export interface PersistResult {
  savedMessages: ActivityMessage[];
  savedKnowledgeCount: number;
  savedKnowledgeIds: string[];
  batchCount: number;
}

/** Reported after each batch commits, so a trace can record exactly what landed. */
export interface BatchCommitInfo {
  batchIndex: number;
  messageIds: string[];
  knowledgeIds: string[];
}

export async function persistEffects(
  db: Firestore,
  messages: MessageDraft[],
  knowledge: KnowledgeDraft[],
  onBatchCommitted?: (info: BatchCommitInfo) => void
): Promise<PersistResult> {
  const now = admin.firestore.Timestamp.now();
  const savedMessages: ActivityMessage[] = [];
  const validKnowledgeTypes = new Set(['background', 'restriction', 'character', 'faq']);

  type Op = {
    ref: admin.firestore.DocumentReference;
    data: Record<string, unknown>;
    kind: 'message' | 'knowledge';
    id: string;
  };
  const ops: Op[] = [];

  for (const draft of messages) {
    const ref = db.collection('activities').doc(draft.activityId)
      .collection('activityMessages').doc();
    const msg: ActivityMessage = {
      id: ref.id,
      activityId: draft.activityId,
      userId: draft.userId,
      content: draft.content,
      targetGroups: draft.targetGroups,
      triggerType: 'scheduled',
      triggerValue: draft.triggerValue,
      cooldownMinutes: null,
      status: 'pending',
      reviewStatus: 'pending_review',
      generatedByAgent: true,
      agentSessionId: draft.agentSessionId,
      sequenceOrder: draft.sequenceOrder,
      sendWindowStart: null,
      sendWindowEnd: null,
      sentAt: null,
      processingAt: null,
      createdAt: now,
      updatedAt: now,
    };
    savedMessages.push(msg);
    ops.push({ ref, data: { ...msg, runId: draft.runId }, kind: 'message', id: ref.id });
  }

  const savedKnowledgeIds: string[] = [];
  for (const item of knowledge) {
    if (!validKnowledgeTypes.has(item.knowledgeType)) continue;
    const ref = db.collection('activityKnowledge').doc();
    ops.push({
      ref,
      kind: 'knowledge',
      id: ref.id,
      data: {
        id: ref.id,
        activityId: item.activityId,
        userId: item.userId,
        knowledgeType: item.knowledgeType,
        title: item.title,
        content: item.content,
        sourceType: 'agent_generated',
        targetGroupId: null,
        runId: item.runId,
        createdAt: now,
        updatedAt: now,
      },
    });
    savedKnowledgeIds.push(ref.id);
  }

  let batchCount = 0;
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const slice = ops.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    for (const op of slice) {
      batch.set(op.ref, op.data);
    }
    await batch.commit();
    onBatchCommitted?.({
      batchIndex: batchCount,
      messageIds: slice.filter((o) => o.kind === 'message').map((o) => o.id),
      knowledgeIds: slice.filter((o) => o.kind === 'knowledge').map((o) => o.id),
    });
    batchCount++;
  }

  return { savedMessages, savedKnowledgeCount: savedKnowledgeIds.length, savedKnowledgeIds, batchCount };
}
