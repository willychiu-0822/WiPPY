import { auth } from '../firebase';
import { getResponseErrorMessage } from '../lib/apiError';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export class HubApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = 'HubApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new HubApiError('Not authenticated', 401, 'unauthenticated');
  const token = await user.getIdToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const clone = res.clone();
    let code: string | null = null;
    try { code = ((await clone.json()) as { code?: string }).code ?? null; } catch { /* not json */ }
    throw new HubApiError(await getResponseErrorMessage(res), res.status, code);
  }
  return res.json() as Promise<T>;
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

// ─── Types (mirror backend/src/hub) ──────────────────────────────────────────

export type HubRole = 'owner' | 'agent';
export interface HubMe { role: HubRole; agentId: string | null; agentName: string | null; ownerConfigured: boolean }

export interface HubGroup { groupId: string; name: string; memberCount: number; agentEnabled: boolean }

export type AgentKind = 'grok_bot' | 'instinct';
export interface AgentView {
  id: string; name: string; kind: AgentKind; enabled: boolean; allowedGroupIds: string[];
  dailySendLimit: number; inboxAlertHours: number; routineUrl: string | null; hasRoutineKey: boolean;
  apiKeyPrefix: string | null; accountUid: string | null; accountEmail: string | null; createdAt: string;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'location' | 'other';
export type RuleTrigger =
  | { type: 'keyword'; keywords: string[]; regex?: string | null }
  | { type: 'message_type'; messageTypes: MessageType[] }
  | { type: 'mention' }
  | { type: 'volume'; windowMinutes: number; threshold: number }
  | { type: 'schedule'; intervalMinutes: number };
export interface RuleInput {
  name: string; enabled: boolean; agentId: string; groupIds: string[]; trigger: RuleTrigger;
  include: { digest: boolean; raw: boolean; media: boolean; contextCount: number };
  instruction: string; cooldownMinutes: number;
}
export interface RuleView extends RuleInput { id: string; createdAt: string; updatedAt: string }

export interface HubSettings {
  alertGroupId: string | null; quotaWarnPercents: number[]; quotaReservePercent: number; retentionDays: number;
  mediaMaxBytes: number; signedUrlDays: number; llm: { maxRpm: number; maxRpd: number; minIntervalMs: number };
}

export interface QuotaStatus { type: 'none' | 'limited'; limit: number | null; used: number; remaining: number | null; reserve: number; percent: number; unknown: boolean; projectedMonthEnd?: number | null }
export interface HubAlert { id: string; severity: 'info' | 'warning' | 'critical'; source: string; text: string; delivered: boolean; deliveryError: string | null; createdAt: string }
export interface Dashboard {
  quota: QuotaStatus;
  llm: { today: number; maxRpd: number };
  agents: Array<{ id: string; name: string; kind: AgentKind; enabled: boolean; sendsToday: number; dailySendLimit: number }>;
  failed: { dispatches: number; actions: number; media: number };
  openInbox: number;
  recentAlerts: HubAlert[];
}

export type LogName = 'dispatches' | 'actions' | 'inbox' | 'alerts' | 'audit' | 'media';
export type LogItem = Record<string, unknown> & { id: string; status?: string };

export interface MessageView {
  id: string; groupId: string; at: string; sender: string; senderId: string; type: MessageType; text: string | null;
  fileName: string | null; fileSize: number | null; durationMs: number | null; mentionsBot: boolean;
  media: null | { mediaAssetId: string; status: string; contentType: string | null; size: number | null; url: string | null; urlExpiresAt: string | null };
}

export interface InboxItem {
  id: string; agentId: string; dispatchId: string; ruleName: string; groupId: string; groupName: string;
  instruction: string; messageIds: string[]; status: 'open' | 'done'; note: string | null; createdAt: string;
}

export interface DispatchPayload {
  jobId: string;
  rule: { id: string; name: string; trigger: string; instruction: string };
  group: { id: string; name: string; memberCount: number | null };
  digest: null | { summary: string | null; points: string[]; tags: string[]; skipped: boolean; skipReason: string | null; mediaList: Array<{ messageId: string; sender: string; type: string; fileName: string | null }> };
  messageCount: number;
  messages: MessageView[];
  quota: { lineRemaining: number | null; lineReserve: number; agentDailyRemaining: number };
}

export interface RecordView { id: string; agentId: string; groupId: string | null; category: string; title: string; content: string; tags: string[]; createdAt: string }

export type ActionType = 'send_message' | 'send_alert' | 'send_link' | 'send_image' | 'send_video' | 'send_audio' | 'record' | 'schedule_message' | 'complete_dispatch' | 'complete_inbox';
export interface ActionResult { actionId: string; type: string; status: 'queued' | 'done' | 'blocked' | 'invalid' | 'failed'; code: string | null; detail: string | null; result: Record<string, unknown> | null; replayed?: boolean }

function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const hubApi = {
  me: () => request<HubMe>('/api/hub/me'),

  admin: {
    groups: () => request<{ groups: HubGroup[] }>('/api/hub/admin/groups'),
    setGroupAccess: (groupId: string, enabled: boolean) =>
      request<{ group: HubGroup }>(`/api/hub/admin/groups/${groupId}/agent-access`, { method: 'PATCH', ...json({ enabled }) }),
    agents: () => request<{ agents: AgentView[] }>('/api/hub/admin/agents'),
    createAgent: (input: Record<string, unknown>) =>
      request<{ agent: AgentView; apiKey?: string; password?: string }>('/api/hub/admin/agents', { method: 'POST', ...json(input) }),
    updateAgent: (id: string, patch: Record<string, unknown>) =>
      request<{ agent: AgentView }>(`/api/hub/admin/agents/${id}`, { method: 'PATCH', ...json(patch) }),
    rotateKey: (id: string) => request<{ apiKey: string; agent: AgentView }>(`/api/hub/admin/agents/${id}/api-key`, { method: 'POST' }),
    resetPassword: (id: string) => request<{ password: string }>(`/api/hub/admin/agents/${id}/reset-password`, { method: 'POST' }),
    testAgent: (id: string) => request<{ ok: boolean; status: number | null; detail: string | null }>(`/api/hub/admin/agents/${id}/test`, { method: 'POST' }),
    rules: () => request<{ rules: RuleView[] }>('/api/hub/admin/rules'),
    createRule: (input: RuleInput) => request<{ rule: RuleView }>('/api/hub/admin/rules', { method: 'POST', ...json(input) }),
    updateRule: (id: string, input: RuleInput) => request<{ rule: RuleView }>(`/api/hub/admin/rules/${id}`, { method: 'PUT', ...json(input) }),
    deleteRule: (id: string) => request<void>(`/api/hub/admin/rules/${id}`, { method: 'DELETE' }),
    settings: () => request<{ settings: HubSettings }>('/api/hub/admin/settings'),
    saveSettings: (patch: Partial<HubSettings>) => request<{ settings: HubSettings }>('/api/hub/admin/settings', { method: 'PUT', ...json(patch) }),
    dashboard: () => request<Dashboard>('/api/hub/admin/dashboard'),
    log: (name: LogName, status?: string) => request<{ items: LogItem[] }>(`/api/hub/admin/${name}${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    retry: (kind: 'dispatches' | 'actions' | 'media', id: string) => request<{ ok: boolean }>(`/api/hub/admin/${kind}/${id}/retry`, { method: 'POST' }),
  },

  agent: {
    groups: () => request<{ groups: HubGroup[] }>('/api/hub/v1/groups'),
    inbox: (status: 'open' | 'done' | 'all' = 'open') => request<{ items: InboxItem[] }>(`/api/hub/v1/inbox?status=${status}`),
    dispatch: (jobId: string) => request<DispatchPayload>(`/api/hub/v1/dispatches/${jobId}`),
    messages: (groupId: string, limit = 50) => request<{ messages: MessageView[] }>(`/api/hub/v1/groups/${groupId}/messages?limit=${limit}`),
    search: (q: string) => request<{ messages: MessageView[] }>(`/api/hub/v1/messages/search?q=${encodeURIComponent(q)}`),
    records: (params: { q?: string; category?: string; groupId?: string } = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => !!v) as Array<[string, string]>);
      return request<{ records: RecordView[] }>(`/api/hub/v1/records${qs.toString() ? `?${qs}` : ''}`);
    },
    quota: () => request<{ line: QuotaStatus; agentDailyLimit: number | null; agentDailyRemaining: number | null }>('/api/hub/v1/quota'),
    act: (type: ActionType, params: Record<string, unknown>, idempotencyKey = newKey()) =>
      request<ActionResult>('/api/hub/v1/actions', { method: 'POST', ...json({ type, idempotencyKey, params }) }).catch((err: unknown) => {
        if (err instanceof HubApiError && err.status === 400) {
          return { actionId: '', type, status: 'invalid', code: err.code ?? 'invalid_request', detail: err.message, result: null } as ActionResult;
        }
        throw err;
      }),
  },
};
