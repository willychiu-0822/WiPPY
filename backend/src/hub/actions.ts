import { z } from 'zod';
import { raiseAlert } from './alerts';
import type { HubContext } from './core/context';
import { errorMessage } from './core/errors';
import { backoffSeconds, RetryableError } from './core/jobs';
import type { LineMessage } from './core/ports';
import { addDays, taipeiIso } from './core/time';
import {
  actorId,
  COLLECTIONS,
  type Actor,
  type AgentDoc,
  type DispatchDoc,
  type GroupDocLike,
  type HubAlertDoc,
  type InboxDoc,
} from './core/types';
import { getAgentSendsToday, incrementAgentSends } from './counters';
import { linkCard, retryKeyFor, sendToLine } from './send';
import { getSettings } from './settings';
import { checkPublicUrl } from './urlCheck';

const PREVIEW_MAX_BYTES = 1024 * 1024;
const groupId = z.string().min(1).max(64);
const httpsUrl = z.string().min(1).max(2000);

export const ACTION_SCHEMAS = {
  send_message: z.object({ groupId, text: z.string().trim().min(1).max(5000) }),
  send_alert: z.object({ text: z.string().trim().min(1).max(4000), severity: z.enum(['info', 'warning', 'critical']).default('warning') }),
  send_link: z.object({ groupId, url: httpsUrl, title: z.string().trim().min(1).max(200), description: z.string().max(1000).nullish(), imageUrl: httpsUrl.nullish() }),
  send_image: z.object({ groupId, url: httpsUrl, previewUrl: httpsUrl.nullish() }),
  send_video: z.object({ groupId, url: httpsUrl, previewUrl: httpsUrl }),
  send_audio: z.object({ groupId, url: httpsUrl, durationMs: z.number().int().min(1).max(24 * 3600_000) }),
  record: z.object({
    category: z.string().trim().min(1).max(50),
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(10000),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    groupId: groupId.nullish(),
    sourceMessageIds: z.array(z.string().max(100)).max(200).default([]),
  }),
  schedule_message: z.object({ groupId, text: z.string().trim().min(1).max(5000), sendAt: z.string().min(1) }),
  complete_dispatch: z.object({ jobId: z.string().min(1).max(100), summary: z.string().max(4000).nullish() }),
  complete_inbox: z.object({ itemId: z.string().min(1).max(100), note: z.string().max(4000).nullish() }),
} as const;

export type ActionType = keyof typeof ACTION_SCHEMAS;
export const ACTION_TYPES = Object.keys(ACTION_SCHEMAS) as ActionType[];
const SEND_TYPES: ActionType[] = ['send_message', 'send_link', 'send_image', 'send_video', 'send_audio', 'schedule_message'];

const envelopeSchema = z.object({
  type: z.enum(ACTION_TYPES as [ActionType, ...ActionType[]]),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_.:-]{1,100}$/, 'idempotencyKey: 1-100 chars of A-Z a-z 0-9 _ . : -'),
  params: z.unknown(),
});

export type ActionStatus = 'queued' | 'retrying' | 'done' | 'blocked' | 'invalid' | 'failed';
const TERMINAL: ActionStatus[] = ['done', 'blocked', 'invalid', 'failed'];

interface ActionDoc {
  ownerId: string;
  actor: Actor;
  actorKey: string;
  idempotencyKey: string;
  type: ActionType;
  params: Record<string, unknown>;
  status: ActionStatus;
  code: string | null;
  detail: string | null;
  result: Record<string, unknown> | null;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
}

export interface ActionResultView {
  actionId: string;
  type: string;
  status: 'queued' | 'done' | 'blocked' | 'invalid' | 'failed';
  code: string | null;
  detail: string | null;
  result: Record<string, unknown> | null;
  replayed?: boolean;
}

type Outcome = { status: 'done' | 'blocked' | 'invalid' | 'failed'; code?: string; detail?: string; result?: Record<string, unknown> };

function view(actionId: string, doc: Pick<ActionDoc, 'type' | 'status' | 'code' | 'detail' | 'result'>, replayed = false): ActionResultView {
  const status = doc.status === 'retrying' ? 'queued' : doc.status;
  return { actionId, type: doc.type, status, code: doc.code, detail: doc.detail, result: doc.result, ...(replayed ? { replayed } : {}) };
}

function formatIssues(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join('.') || 'value'}: ${i.message}`).join('; ');
}

const blocked = (code: string, detail: string): Outcome => ({ status: 'blocked', code, detail });
const invalid = (code: string, detail: string): Outcome => ({ status: 'invalid', code, detail });

async function groupAccess(ctx: HubContext, actor: Actor, agent: AgentDoc | null, id: string): Promise<Outcome | null> {
  const group = await ctx.store.get<GroupDocLike>(COLLECTIONS.groups, id);
  if (!group || group.userId !== ctx.ownerId) return blocked('group_not_allowed', '找不到這個群組');
  if (actor.kind === 'agent' && (!group.agentEnabled || !agent?.allowedGroupIds.includes(id))) {
    return blocked('group_not_allowed', '這個 Agent 不能使用這個群組（群組未開放，或不在允許清單）');
  }
  return null;
}

async function dailyLimit(ctx: HubContext, actor: Actor, agent: AgentDoc | null): Promise<Outcome | null> {
  if (actor.kind !== 'agent' || !agent) return null;
  const used = await getAgentSendsToday(ctx, actor.agentId);
  if (used >= agent.dailySendLimit) return blocked('agent_daily_limit', `今天已發送 ${used} 次，達到每日上限 ${agent.dailySendLimit} 次`);
  return null;
}

async function push(ctx: HubContext, actionId: string, actor: Actor, to: string, messages: LineMessage[], purpose: 'agent' | 'alert'): Promise<Outcome> {
  const res = await sendToLine(ctx, { to, messages, retryKey: retryKeyFor(`action:${actionId}`), purpose });
  if (res.ok) {
    if (actor.kind === 'agent' && purpose === 'agent') await incrementAgentSends(ctx, actor.agentId);
    return { status: 'done', result: { cost: res.cost } };
  }
  if (res.code === 'line_error' && res.retryable) throw new RetryableError(res.detail);
  if (res.code === 'line_quota_reserve' || res.code === 'line_quota_exhausted') return blocked(res.code, res.detail);
  return { status: 'failed', code: res.code, detail: res.detail };
}

async function perform(ctx: HubContext, actionId: string, doc: ActionDoc): Promise<Outcome> {
  const { actor } = doc;
  let agent: AgentDoc | null = null;
  if (actor.kind === 'agent') {
    agent = await ctx.store.get<AgentDoc>(COLLECTIONS.agents, actor.agentId);
    if (!agent?.enabled || agent.ownerId !== ctx.ownerId) return blocked('agent_disabled', 'Agent 已停用');
  }
  const p = doc.params as Record<string, any>;

  if (SEND_TYPES.includes(doc.type) || doc.type === 'record') {
    if (p['groupId']) {
      const denied = await groupAccess(ctx, actor, agent, p['groupId']);
      if (denied) return denied;
    }
  }
  if (SEND_TYPES.includes(doc.type)) {
    const limited = await dailyLimit(ctx, actor, agent);
    if (limited) return limited;
  }

  switch (doc.type) {
    case 'send_message':
      return push(ctx, actionId, actor, p['groupId'], [{ type: 'text', text: p['text'] }], 'agent');

    case 'send_link': {
      const page = await checkPublicUrl(ctx, p['url'], 'page');
      if (!page.ok) return invalid(page.code, page.detail);
      if (p['imageUrl']) {
        const image = await checkPublicUrl(ctx, p['imageUrl'], 'image');
        if (!image.ok) return invalid(image.code, `封面圖：${image.detail}`);
      }
      return push(ctx, actionId, actor, p['groupId'], [linkCard({ url: p['url'], title: p['title'], description: p['description'], imageUrl: p['imageUrl'] })], 'agent');
    }

    case 'send_image': {
      const image = await checkPublicUrl(ctx, p['url'], 'image');
      if (!image.ok) return invalid(image.code, image.detail);
      let preview: string = p['previewUrl'];
      if (preview) {
        const pv = await checkPublicUrl(ctx, preview, 'preview');
        if (!pv.ok) return invalid(pv.code, `預覽圖：${pv.detail}`);
      } else if (image.size !== null && image.size <= PREVIEW_MAX_BYTES) {
        preview = p['url'];
      } else {
        return invalid('preview_required', '原圖超過 1MB 或大小未知，請另外提供 ≤ 1MB 的 previewUrl');
      }
      return push(ctx, actionId, actor, p['groupId'], [{ type: 'image', originalContentUrl: p['url'], previewImageUrl: preview }], 'agent');
    }

    case 'send_video': {
      const video = await checkPublicUrl(ctx, p['url'], 'video');
      if (!video.ok) return invalid(video.code, video.detail);
      const pv = await checkPublicUrl(ctx, p['previewUrl'], 'preview');
      if (!pv.ok) return invalid(pv.code, `預覽圖：${pv.detail}`);
      return push(ctx, actionId, actor, p['groupId'], [{ type: 'video', originalContentUrl: p['url'], previewImageUrl: p['previewUrl'] }], 'agent');
    }

    case 'send_audio': {
      const audio = await checkPublicUrl(ctx, p['url'], 'audio');
      if (!audio.ok) return invalid(audio.code, audio.detail);
      return push(ctx, actionId, actor, p['groupId'], [{ type: 'audio', originalContentUrl: p['url'], duration: p['durationMs'] }], 'agent');
    }

    case 'send_alert': {
      const settings = await getSettings(ctx);
      if (!settings.alertGroupId) return blocked('alert_group_not_set', '尚未設定預警群組');
      const severity = (p['severity'] ?? 'warning') as HubAlertDoc['severity'];
      const label = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
      const who = agent?.name ?? 'WiPPY';
      const outcome = await push(ctx, actionId, actor, settings.alertGroupId, [{ type: 'text', text: `${label} ${who} 預警\n${p['text']}` }], 'alert');
      const now = ctx.now();
      const alert: HubAlertDoc = {
        ownerId: ctx.ownerId,
        severity,
        source: `${actor.kind === 'agent' ? 'agent' : actor.kind}:${actorId(actor)}`,
        text: p['text'],
        delivered: outcome.status === 'done',
        deliveryError: outcome.status === 'done' ? null : outcome.code ?? null,
        createdAt: now,
        ttl: addDays(now, settings.retentionDays),
      };
      await ctx.store.set(COLLECTIONS.alerts, `action_${actionId}`, alert);
      return outcome;
    }

    case 'record': {
      const now = ctx.now();
      await ctx.store.set(COLLECTIONS.records, actionId, {
        ownerId: ctx.ownerId,
        agentId: actorId(actor),
        groupId: p['groupId'] ?? null,
        category: p['category'],
        title: p['title'],
        content: p['content'],
        tags: p['tags'] ?? [],
        sourceMessageIds: p['sourceMessageIds'] ?? [],
        createdAt: now,
      });
      return { status: 'done', result: { recordId: actionId } };
    }

    case 'schedule_message': {
      const sendAt = new Date(p['sendAt']);
      if (Number.isNaN(sendAt.getTime())) return invalid('invalid_params', 'sendAt 必須是 ISO 8601 時間，例如 2026-11-05T09:30:00+08:00');
      if (sendAt.getTime() <= ctx.now().getTime()) return invalid('send_at_in_past', 'sendAt 必須是未來的時間');
      const gid = p['groupId'] as string;
      const activityId = `agent-schedule-${gid}`;
      const group = await ctx.store.get<GroupDocLike>(COLLECTIONS.groups, gid);
      const now = ctx.now();
      await ctx.store.create('activities', activityId, {
        id: activityId,
        userId: ctx.ownerId,
        name: `Agent 排程｜${group?.name ?? gid}`,
        targetGroups: [gid],
        status: 'active',
        reviewStatus: 'approved',
        approvedAt: now,
        agentSessionId: null,
        eventStartAt: null,
        eventEndAt: null,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.store.set(`activities/${activityId}/activityMessages`, actionId, {
        id: actionId,
        activityId,
        userId: ctx.ownerId,
        content: p['text'],
        targetGroups: [gid],
        triggerType: 'scheduled',
        triggerValue: taipeiIso(sendAt),
        cooldownMinutes: null,
        status: 'pending',
        reviewStatus: 'approved',
        generatedByAgent: true,
        agentSessionId: null,
        hubActionId: actionId,
        sequenceOrder: sendAt.getTime(),
        sendWindowStart: null,
        sendWindowEnd: null,
        sentAt: null,
        processingAt: null,
        createdAt: now,
        updatedAt: now,
      });
      if (actor.kind === 'agent') await incrementAgentSends(ctx, actor.agentId);
      return { status: 'done', result: { activityId, messageId: actionId, triggerValue: taipeiIso(sendAt) } };
    }

    case 'complete_dispatch': {
      const dispatch = await ctx.store.get<DispatchDoc>(COLLECTIONS.dispatches, p['jobId']);
      if (!dispatch || dispatch.ownerId !== ctx.ownerId || (actor.kind === 'agent' && dispatch.agentId !== actor.agentId)) {
        return blocked('not_found', '找不到這個派送工作');
      }
      const denied = await groupAccess(ctx, actor, agent, dispatch.groupId);
      if (denied) return denied;
      await ctx.store.update(COLLECTIONS.dispatches, p['jobId'], { status: 'completed', completedAt: ctx.now(), summary: p['summary'] ?? null });
      return { status: 'done', result: { jobId: p['jobId'] } };
    }

    case 'complete_inbox': {
      const item = await ctx.store.get<InboxDoc>(COLLECTIONS.inbox, p['itemId']);
      if (!item || item.ownerId !== ctx.ownerId || (actor.kind === 'agent' && item.agentId !== actor.agentId)) {
        return blocked('not_found', '找不到這個收件匣項目');
      }
      const denied = await groupAccess(ctx, actor, agent, item.groupId);
      if (denied) return denied;
      await ctx.store.update(COLLECTIONS.inbox, p['itemId'], { status: 'done', doneAt: ctx.now(), note: p['note'] ?? null });
      if (item.dispatchId) {
        await ctx.store.update(COLLECTIONS.dispatches, item.dispatchId, { status: 'completed', completedAt: ctx.now(), summary: p['note'] ?? null }).catch(() => undefined);
      }
      return { status: 'done', result: { itemId: p['itemId'] } };
    }

    default:
      return invalid('invalid_request', `unsupported action ${String(doc.type)}`);
  }
}

async function finalize(ctx: HubContext, actionId: string, doc: ActionDoc, outcome: Outcome): Promise<ActionResultView> {
  const now = ctx.now();
  const patch = {
    status: outcome.status,
    code: outcome.code ?? null,
    detail: outcome.detail ?? null,
    result: outcome.result ?? null,
    updatedAt: now,
    finishedAt: now,
  };
  await ctx.store.update(COLLECTIONS.actions, actionId, patch);
  const p = doc.params;
  await ctx.store.set(COLLECTIONS.audit, ctx.store.newId(), {
    ownerId: ctx.ownerId,
    actor: doc.actorKey,
    actorKind: doc.actor.kind,
    via: doc.actor.via,
    action: doc.type,
    actionId,
    target: (p['groupId'] ?? p['jobId'] ?? p['itemId'] ?? null) as string | null,
    status: outcome.status,
    code: outcome.code ?? null,
    detail: outcome.detail ?? null,
    at: now,
    ttl: addDays(now, (await getSettings(ctx)).retentionDays),
  });
  return view(actionId, { ...doc, ...patch });
}

async function attempt(ctx: HubContext, actionId: string): Promise<{ view: ActionResultView } | { retry: RetryableError }> {
  const doc = await ctx.store.get<ActionDoc>(COLLECTIONS.actions, actionId);
  if (!doc) return { view: { actionId, type: 'unknown', status: 'failed', code: 'not_found', detail: 'action not found', result: null } };
  if (TERMINAL.includes(doc.status)) return { view: view(actionId, doc) };
  await ctx.store.update(COLLECTIONS.actions, actionId, { attempts: doc.attempts + 1, updatedAt: ctx.now() });
  try {
    return { view: await finalize(ctx, actionId, doc, await perform(ctx, actionId, doc)) };
  } catch (err) {
    if (err instanceof RetryableError) {
      await ctx.store.update(COLLECTIONS.actions, actionId, { status: 'retrying', lastError: err.message, updatedAt: ctx.now() });
      return { retry: err };
    }
    await ctx.store.update(COLLECTIONS.actions, actionId, { lastError: errorMessage(err) });
    return { view: await finalize(ctx, actionId, doc, { status: 'failed', code: 'internal_error', detail: errorMessage(err) }) };
  }
}

/**
 * Executes one agent/owner/system action with idempotency, guards and audit.
 * Transient LINE failures are retried in the background (status `queued`).
 */
export async function executeAction(ctx: HubContext, actor: Actor, request: unknown): Promise<ActionResultView> {
  const env = envelopeSchema.safeParse(request);
  if (!env.success) {
    return { actionId: '', type: String((request as { type?: unknown })?.type ?? ''), status: 'invalid', code: 'invalid_request', detail: formatIssues(env.error), result: null };
  }
  const { type, idempotencyKey } = env.data;
  const parsed = ACTION_SCHEMAS[type].safeParse(env.data.params ?? {});
  if (!parsed.success) {
    return { actionId: '', type, status: 'invalid', code: 'invalid_params', detail: formatIssues(parsed.error), result: null };
  }

  const actorKey = actorId(actor);
  const actionId = `${actorKey}_${idempotencyKey}`;
  const now = ctx.now();
  const doc: ActionDoc = {
    ownerId: ctx.ownerId,
    actor,
    actorKey,
    idempotencyKey,
    type,
    params: parsed.data as Record<string, unknown>,
    status: 'queued',
    code: null,
    detail: null,
    result: null,
    attempts: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    finishedAt: null,
  };
  if (!(await ctx.store.create(COLLECTIONS.actions, actionId, doc))) {
    const existing = await ctx.store.get<ActionDoc>(COLLECTIONS.actions, actionId);
    return view(actionId, existing ?? doc, true);
  }

  const out = await attempt(ctx, actionId);
  if ('view' in out) return out.view;
  await ctx.queue.enqueue({ type: 'action_execute', id: actionId, attempt: 2, payload: { actionId } }, { delaySeconds: backoffSeconds(1) });
  return { actionId, type, status: 'queued', code: 'retry_scheduled', detail: out.retry.message, result: null };
}

/** action_execute job body: throws RetryableError so the runner reschedules. */
export async function runActionJob(ctx: HubContext, actionId: string): Promise<void> {
  const out = await attempt(ctx, actionId);
  if ('retry' in out) throw out.retry;
}

export async function onActionFailed(ctx: HubContext, actionId: string, error: Error): Promise<void> {
  const doc = await ctx.store.get<ActionDoc>(COLLECTIONS.actions, actionId);
  if (!doc || TERMINAL.includes(doc.status)) return;
  await ctx.store.update(COLLECTIONS.actions, actionId, { lastError: error.message });
  await finalize(ctx, actionId, doc, { status: 'failed', code: 'retries_exhausted', detail: error.message });
  await raiseAlert(ctx, {
    severity: 'warning',
    source: 'action',
    text: `${doc.actorKey} 的動作 ${doc.type} 重試 ${doc.attempts} 次仍失敗：${error.message}`,
  });
}

export async function getActionView(ctx: HubContext, actor: Actor, actionId: string): Promise<ActionResultView | null> {
  const doc = await ctx.store.get<ActionDoc>(COLLECTIONS.actions, actionId);
  if (!doc || doc.ownerId !== ctx.ownerId) return null;
  if (actor.kind === 'agent' && doc.actorKey !== actor.agentId) return null;
  return view(actionId, doc);
}
