import { auth } from '../firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

// Firestore Timestamps serialize to { _seconds, _nanoseconds } in JSON
export interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface Group {
  groupId: string;
  name: string;
  memberCount: number;
  lastMessageAt: FirestoreTimestamp;
  lastMessagePreview: string;
  isActive: boolean;
}

export interface RecentMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: string;
  timestamp: FirestoreTimestamp;
}

export interface SendLog {
  id: string;
  groupId: string;
  content: string;
  status: 'success' | 'failed';
  errorMessage: string | null;
  triggerType: 'scheduled' | 'keyword' | 'manual' | 'broadcast';
  sentAt: FirestoreTimestamp;
  activityId: string | null;
}

export interface BroadcastPreview {
  groupId: string;
  groupName: string;
  content: string;
}

// ─── Groups API ───────────────────────────────────────────────────────────────

export const api = {
  groups: {
    list: () => request<{ groups: Group[] }>('/api/groups'),

    messages: (groupId: string, limit = 20) =>
      request<{ groupName: string; messages: RecentMessage[] }>(
        `/api/groups/${groupId}/messages?limit=${limit}`
      ),

    send: (groupId: string, content: string) =>
      request<{ ok: boolean; sendLogId: string }>(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),

    sync: () => request<{ ok: boolean; updated: number }>('/api/groups/sync', { method: 'POST' }),
  },

  broadcast: {
    preview: (groupIds: string[], content: string) =>
      request<{ previews: BroadcastPreview[] }>('/api/broadcast/preview', {
        method: 'POST',
        body: JSON.stringify({ groupIds, content }),
      }),

    multi: (messages: Array<{ groupId: string; content: string }>) =>
      request<{ results: Array<{ groupId: string; status: string; error?: string }> }>(
        '/api/broadcast/multi',
        { method: 'POST', body: JSON.stringify({ messages }) }
      ),
  },

  sendLogs: {
    list: (params?: { activityId?: string; groupId?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.activityId) qs.set('activityId', params.activityId);
      if (params?.groupId) qs.set('groupId', params.groupId);
      if (params?.limit) qs.set('limit', String(params.limit));
      return request<{ logs: SendLog[]; hasMore: boolean }>(
        `/api/send-logs${qs.toString() ? '?' + qs.toString() : ''}`
      );
    },
  },

  activities: {
    list: () => request<{ activities: Activity[] }>('/api/activities'),

    create: (name: string, targetGroups: string[]) =>
      request<{ activity: Activity }>('/api/activities', {
        method: 'POST',
        body: JSON.stringify({ name, targetGroups }),
      }),

    get: (id: string) => request<{ activity: Activity }>(`/api/activities/${id}`),

    update: (id: string, patch: Partial<Pick<Activity, 'name' | 'targetGroups'>>) =>
      request<{ activity: Activity }>(`/api/activities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),

    approve: (id: string) =>
      request<{ activity: Activity }>(`/api/activities/${id}/approve`, { method: 'PATCH' }),

    requestRevision: (id: string) =>
      request<{ activity: Activity }>(`/api/activities/${id}/request-revision`, { method: 'PATCH' }),

    messages: {
      list: (activityId: string) =>
        request<{ messages: ActivityMessage[] }>(`/api/activities/${activityId}/messages`),

      create: (activityId: string, data: {
        content: string;
        targetGroups: string[];
        triggerType: 'scheduled' | 'keyword';
        triggerValue: string;
        sequenceOrder: number;
      }) =>
        request<{ message: ActivityMessage }>(`/api/activities/${activityId}/messages`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      update: (activityId: string, msgId: string, patch: Partial<Pick<ActivityMessage, 'content' | 'targetGroups' | 'triggerValue' | 'sequenceOrder'>>) =>
        request<{ message: ActivityMessage }>(`/api/activities/${activityId}/messages/${msgId}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        }),

      delete: (activityId: string, msgId: string) =>
        request<{ ok: boolean }>(`/api/activities/${activityId}/messages/${msgId}`, { method: 'DELETE' }),
    },

    knowledge: {
      list: (activityId: string) =>
        request<{ knowledge: ActivityKnowledge[] }>(`/api/activities/${activityId}/knowledge`),

      create: (activityId: string, data: {
        knowledgeType: ActivityKnowledge['knowledgeType'];
        title: string;
        content: string;
        sourceType?: ActivityKnowledge['sourceType'];
      }) =>
        request<{ knowledge: ActivityKnowledge }>(`/api/activities/${activityId}/knowledge`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      update: (activityId: string, knowledgeId: string, patch: Partial<Pick<ActivityKnowledge, 'title' | 'content' | 'knowledgeType'>>) =>
        request<{ knowledge: ActivityKnowledge }>(`/api/activities/${activityId}/knowledge/${knowledgeId}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        }),

      delete: (activityId: string, knowledgeId: string) =>
        request<{ ok: boolean }>(`/api/activities/${activityId}/knowledge/${knowledgeId}`, { method: 'DELETE' }),
    },
  },

  agent: {
    chat: (activityId: string, message: string, sessionId?: string) =>
      request<AgentChatApiResponse>('/api/agent/chat', {
        method: 'POST',
        body: JSON.stringify({ activityId, message, sessionId }),
      }),
  },
};

// ─── Activity types ───────────────────────────────────────────────────────────

export interface Activity {
  id: string;
  userId: string;
  name: string;
  targetGroups: string[];
  status: 'draft' | 'active' | 'completed';
  reviewStatus: 'pending_review' | 'approved' | 'revision_requested';
  approvedAt: FirestoreTimestamp | null;
  agentSessionId: string | null;
  eventStartAt: FirestoreTimestamp | null;
  eventEndAt: FirestoreTimestamp | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ActivityMessage {
  id: string;
  activityId: string;
  userId: string;
  content: string;
  targetGroups: string[];
  triggerType: 'scheduled' | 'keyword';
  triggerValue: string;
  cooldownMinutes: number | null;
  status: 'pending' | 'sent' | 'failed';
  reviewStatus: 'pending_review' | 'approved' | 'rejected';
  generatedByAgent: boolean;
  agentSessionId: string | null;
  sequenceOrder: number;
  sendWindowStart: FirestoreTimestamp | null;
  sendWindowEnd: FirestoreTimestamp | null;
  sentAt: FirestoreTimestamp | null;
  processingAt: FirestoreTimestamp | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ActivityKnowledge {
  id: string;
  activityId: string;
  userId: string;
  knowledgeType: 'background' | 'restriction' | 'character' | 'faq';
  title: string;
  content: string;
  sourceType: 'manual' | 'upload' | 'agent_generated';
  targetGroupId: string | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface AgentChatApiResponse {
  status: 'queued' | 'rate_limited' | 'completed';
  runId: string;
  sessionId: string;
  retryAfterSeconds?: number;
  rateLimitWarning?: { remaining: number; windowResetInSeconds: number };
  // Dev/sync mode only:
  reply?: string;
  generatedMessageCount?: number;
  extractedKnowledgeCount?: number;
}

export interface HarnessRunSnapshot {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  reply: string | null;
  generatedMessageCount: number;
  extractedKnowledgeCount: number;
  lastError: string | null;
}
