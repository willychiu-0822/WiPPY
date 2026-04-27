import { Firestore } from 'firebase-admin/firestore';
import type { Activity, ActivityKnowledge, ActivityMessage, AgentSession, AgentSessionMessage } from '../types';

const MAX_HISTORY = 10;

export interface ContextEnvelope {
  activityId: string;
  userId: string;
  activity: Activity;
  knowledge: ActivityKnowledge[];
  existingMessages: ActivityMessage[];
  recentTurns: AgentSessionMessage[];
  sessionId: string;
}

export async function buildContextEnvelope(
  db: Firestore,
  activityId: string,
  userId: string,
  session: AgentSession
): Promise<ContextEnvelope> {
  const [actSnap, knowledgeSnap, msgsSnap] = await Promise.all([
    db.collection('activities').doc(activityId).get(),
    db.collection('activityKnowledge')
      .where('activityId', '==', activityId)
      .where('userId', '==', userId)
      .get(),
    db.collection('activities').doc(activityId)
      .collection('activityMessages')
      .orderBy('sequenceOrder', 'asc')
      .get(),
  ]);

  if (!actSnap.exists) throw new Error('Activity not found');
  const activity = actSnap.data() as Activity;
  if (activity.userId !== userId) throw new Error('Activity not found');

  const knowledge = knowledgeSnap.docs
    .map((d) => d.data() as ActivityKnowledge)
    .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
  const existingMessages = msgsSnap.docs.map((d) => d.data() as ActivityMessage);
  const recentTurns = session.messages.filter((m) => m.role !== 'system').slice(-MAX_HISTORY);

  return { activityId, userId, activity, knowledge, existingMessages, recentTurns, sessionId: session.id };
}
