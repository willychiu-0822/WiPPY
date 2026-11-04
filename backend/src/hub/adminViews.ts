import { z } from 'zod';
import { AdminInputError } from './agentsAdmin';
import type { HubContext } from './core/context';
import { COLLECTIONS, type AgentDoc, type HubSettings, type RuleDoc } from './core/types';
import { getAgentSendsToday } from './counters';
import { getOwnedGroup } from './groups';
import { getLlmUsage } from './llmThrottle';
import { getQuotaStatus } from './quota';
import { validateRuleInput } from './rules';
import { getSettings, saveSettings } from './settings';

// ─── Rules ────────────────────────────────────────────────────────────────────

export async function listRules(ctx: HubContext) {
  const rows = await ctx.store.query<RuleDoc>(COLLECTIONS.agentRules, { where: [{ field: 'ownerId', op: '==', value: ctx.ownerId }] });
  return rows.map((r) => ({ id: r.id, ...r.data })).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

async function validatedRule(ctx: HubContext, input: unknown) {
  const result = validateRuleInput(input);
  if (!result.ok) throw new AdminInputError(result.error);
  const agent = await ctx.store.get<AgentDoc>(COLLECTIONS.agents, result.rule.agentId);
  if (!agent || agent.ownerId !== ctx.ownerId) throw new AdminInputError('agentId: Agent not found');
  for (const g of result.rule.groupIds) {
    if (!(await getOwnedGroup(ctx, g))) throw new AdminInputError(`groupIds: ${g} is not one of your groups`);
  }
  return result.rule;
}

export async function createRule(ctx: HubContext, input: unknown) {
  const rule = await validatedRule(ctx, input);
  const id = ctx.store.newId();
  const now = ctx.now();
  const doc: RuleDoc = { ownerId: ctx.ownerId, ...rule, createdAt: now, updatedAt: now };
  await ctx.store.set(COLLECTIONS.agentRules, id, doc);
  return { id, ...doc };
}

export async function replaceRule(ctx: HubContext, id: string, input: unknown) {
  const existing = await ctx.store.get<RuleDoc>(COLLECTIONS.agentRules, id);
  if (!existing || existing.ownerId !== ctx.ownerId) throw new AdminInputError('Rule not found', 404, 'not_found');
  const rule = await validatedRule(ctx, input);
  const doc: RuleDoc = { ...existing, ...rule, updatedAt: ctx.now() };
  await ctx.store.set(COLLECTIONS.agentRules, id, doc);
  return { id, ...doc };
}

export async function deleteRule(ctx: HubContext, id: string): Promise<void> {
  const existing = await ctx.store.get<RuleDoc>(COLLECTIONS.agentRules, id);
  if (!existing || existing.ownerId !== ctx.ownerId) throw new AdminInputError('Rule not found', 404, 'not_found');
  await ctx.store.delete(COLLECTIONS.agentRules, id);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  alertGroupId: z.string().min(1).nullable().optional(),
  quotaWarnPercents: z.array(z.number().min(1).max(100)).min(1).max(5).optional(),
  quotaReservePercent: z.number().min(0).max(50).optional(),
  retentionDays: z.number().int().min(7).max(3650).optional(),
  mediaMaxBytes: z.number().int().min(1024 * 1024).max(200 * 1024 * 1024).optional(),
  signedUrlDays: z.number().int().min(1).max(7).optional(),
  llm: z.object({
    maxRpm: z.number().int().min(1).max(1000).optional(),
    maxRpd: z.number().int().min(0).max(100000).optional(),
    minIntervalMs: z.number().int().min(0).max(600000).optional(),
  }).optional(),
});

export async function updateSettings(ctx: HubContext, input: unknown): Promise<HubSettings> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) throw new AdminInputError(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  const data = parsed.data;
  if (data.alertGroupId && !(await getOwnedGroup(ctx, data.alertGroupId))) throw new AdminInputError('alertGroupId: not one of your groups');
  const current = await getSettings(ctx);
  return saveSettings(ctx, { ...data, llm: { ...current.llm, ...(data.llm ?? {}) } } as Partial<HubSettings>);
}

// ─── Dashboard / logs ─────────────────────────────────────────────────────────

const LOGS = {
  dispatches: COLLECTIONS.dispatches,
  actions: COLLECTIONS.actions,
  inbox: COLLECTIONS.inbox,
  alerts: COLLECTIONS.alerts,
  audit: COLLECTIONS.audit,
  media: COLLECTIONS.mediaAssets,
} as const;

export type LogName = keyof typeof LOGS;

export function isLogName(name: string): name is LogName {
  return name in LOGS;
}

export async function listLog(ctx: HubContext, name: LogName, opts: { status?: string; limit?: number }) {
  const orderField = name === 'audit' ? 'at' : 'createdAt';
  const rows = await ctx.store.query<Record<string, unknown>>(LOGS[name], { orderBy: [{ field: orderField, direction: 'desc' }], limit: 300 });
  return rows
    .filter((r) => r.data['ownerId'] === ctx.ownerId)
    .filter((r) => !opts.status || r.data['status'] === opts.status)
    .slice(0, Math.min(opts.limit ?? 100, 300))
    .map((r) => {
      const { params, ...rest } = r.data;
      return { id: r.id, ...rest, ...(params ? { params } : {}) };
    });
}

export async function dashboard(ctx: HubContext) {
  const [quota, llm, agents, alerts, dispatches, actions, media, inbox] = await Promise.all([
    getQuotaStatus(ctx),
    getLlmUsage(ctx),
    ctx.store.query<AgentDoc>(COLLECTIONS.agents, { where: [{ field: 'ownerId', op: '==', value: ctx.ownerId }] }),
    listLog(ctx, 'alerts', { limit: 10 }),
    listLog(ctx, 'dispatches', { status: 'failed' }),
    listLog(ctx, 'actions', { status: 'failed' }),
    listLog(ctx, 'media', { status: 'failed' }),
    listLog(ctx, 'inbox', { status: 'open' }),
  ]);
  const now = ctx.now();
  const dayOfMonth = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', day: 'numeric' }).format(now));
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return {
    quota: { ...quota, projectedMonthEnd: quota.limit ? Math.round((quota.used / Math.max(dayOfMonth, 1)) * daysInMonth) : null },
    llm,
    agents: await Promise.all(agents.map(async (a) => ({ id: a.id, name: a.data.name, kind: a.data.kind, enabled: a.data.enabled, sendsToday: await getAgentSendsToday(ctx, a.id), dailySendLimit: a.data.dailySendLimit }))),
    failed: { dispatches: dispatches.length, actions: actions.length, media: media.length },
    openInbox: inbox.length,
    recentAlerts: alerts,
  };
}

// ─── Manual retry ─────────────────────────────────────────────────────────────

export async function retryFailed(ctx: HubContext, kind: 'dispatches' | 'actions' | 'media', id: string): Promise<void> {
  const collection = LOGS[kind];
  const doc = await ctx.store.get<Record<string, unknown>>(collection, id);
  if (!doc || doc['ownerId'] !== ctx.ownerId) throw new AdminInputError('Not found', 404, 'not_found');
  if (doc['status'] !== 'failed') throw new AdminInputError('only failed items can be retried', 409, 'not_failed');
  if (kind === 'dispatches') {
    await ctx.store.update(collection, id, { status: 'queued', attempts: 0, lastError: null });
    await ctx.queue.enqueue({ type: 'dispatch', id, attempt: 1, payload: { dispatchId: id } });
  } else if (kind === 'actions') {
    await ctx.store.update(collection, id, { status: 'retrying', code: null, detail: null, finishedAt: null });
    await ctx.queue.enqueue({ type: 'action_execute', id, attempt: 1, payload: { actionId: id } });
  } else {
    await ctx.store.update(collection, id, { status: 'pending', attempts: 0, lastError: null });
    await ctx.queue.enqueue({ type: 'media_download', id, attempt: 1, payload: { mediaAssetId: id } });
  }
}
