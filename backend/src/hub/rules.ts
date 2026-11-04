import { z } from 'zod';
import type { HubContext } from './core/context';
import { addMinutes } from './core/time';
import {
  COLLECTIONS,
  type AgentDoc,
  type DispatchDoc,
  type GroupDocLike,
  type GroupMessageDoc,
  type RuleDoc,
  type RuleStateDoc,
  type RuleTrigger,
} from './core/types';

type StoredMessage = GroupMessageDoc & { id: string };

const MESSAGE_TYPES = ['text', 'image', 'video', 'audio', 'file', 'sticker', 'location', 'other'] as const;
const MAX_SCHEDULE_MESSAGES = 200;

/** Chronological order with a stable tie-break on id. */
export function chronological<T extends { id: string; data: { timestamp: Date } }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => new Date(a.data.timestamp).getTime() - new Date(b.data.timestamp).getTime() || a.id.localeCompare(b.id));
}

const triggerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('keyword'),
    keywords: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
    regex: z.string().max(200).nullable().optional(),
  }).refine((t) => t.keywords.length > 0 || !!t.regex, { message: '至少要有一個關鍵字或 regex' })
    .refine((t) => { if (!t.regex) return true; try { new RegExp(t.regex, 'i'); return true; } catch { return false; } }, { message: 'regex 格式錯誤' }),
  z.object({ type: z.literal('message_type'), messageTypes: z.array(z.enum(MESSAGE_TYPES)).min(1) }),
  z.object({ type: z.literal('mention') }),
  z.object({ type: z.literal('volume'), windowMinutes: z.number().int().min(1).max(1440), threshold: z.number().int().min(1).max(10000) }),
  z.object({ type: z.literal('schedule'), intervalMinutes: z.number().int().min(5).max(10080) }),
]);

export const ruleInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  enabled: z.boolean().default(true),
  agentId: z.string().min(1),
  groupIds: z.array(z.string().min(1)).min(1).max(100),
  trigger: triggerSchema,
  include: z.object({
    digest: z.boolean().default(false),
    raw: z.boolean().default(true),
    media: z.boolean().default(true),
    contextCount: z.number().int().min(0).max(200).default(20),
  }).default({ digest: false, raw: true, media: true, contextCount: 20 }),
  instruction: z.string().trim().min(1).max(4000),
  cooldownMinutes: z.number().int().min(0).max(10080).default(0),
});

export type RuleInput = z.infer<typeof ruleInputSchema>;

export function validateRuleInput(input: unknown): { ok: true; rule: RuleInput } | { ok: false; error: string } {
  const parsed = ruleInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || 'rule'}: ${i.message}`).join('; ') };
  return { ok: true, rule: parsed.data };
}

/** Pure real-time trigger check (volume and schedule need the store). */
export function matchesMessage(trigger: RuleTrigger, message: Pick<GroupMessageDoc, 'type' | 'text' | 'mentionsBot'>): boolean {
  switch (trigger.type) {
    case 'keyword': {
      if (message.type !== 'text' || !message.text) return false;
      const text = message.text.toLowerCase();
      if (trigger.keywords.some((k) => text.includes(k.toLowerCase()))) return true;
      if (trigger.regex) {
        try { return new RegExp(trigger.regex, 'i').test(message.text); } catch { return false; }
      }
      return false;
    }
    case 'message_type':
      return trigger.messageTypes.includes(message.type);
    case 'mention':
      return message.mentionsBot;
    default:
      return false;
  }
}

async function enabledRules(ctx: HubContext): Promise<Array<{ id: string; data: RuleDoc }>> {
  const rows = await ctx.store.query<RuleDoc>(COLLECTIONS.agentRules, { where: [{ field: 'enabled', op: '==', value: true }] });
  return rows.filter((r) => r.data.ownerId === ctx.ownerId);
}

async function agentCanUseGroup(ctx: HubContext, agentId: string, groupId: string): Promise<AgentDoc | null> {
  const [agent, group] = await Promise.all([
    ctx.store.get<AgentDoc>(COLLECTIONS.agents, agentId),
    ctx.store.get<GroupDocLike>(COLLECTIONS.groups, groupId),
  ]);
  if (!agent?.enabled || !agent.allowedGroupIds.includes(groupId) || !group?.agentEnabled) return null;
  return agent;
}

async function claimCooldown(ctx: HubContext, ruleId: string, groupId: string, cooldownMinutes: number): Promise<boolean> {
  const now = ctx.now();
  return ctx.store.mutate<RuleStateDoc, boolean>(COLLECTIONS.ruleState, `${ruleId}_${groupId}`, (current) => {
    const last = current?.lastFiredAt ? new Date(current.lastFiredAt) : null;
    if (last && cooldownMinutes > 0 && now.getTime() < addMinutes(last, cooldownMinutes).getTime()) return { next: null, result: false };
    return { next: { lastFiredAt: now, lastScheduledAt: current?.lastScheduledAt ?? null }, result: true };
  });
}

async function createDispatch(
  ctx: HubContext,
  rule: { id: string; data: RuleDoc },
  agent: AgentDoc,
  groupId: string,
  messageIds: string[],
  windowStart: Date | null,
): Promise<string> {
  const id = ctx.store.newId();
  const now = ctx.now();
  const doc: DispatchDoc = {
    ownerId: ctx.ownerId,
    ruleId: rule.id,
    ruleName: rule.data.name,
    agentId: rule.data.agentId,
    agentKind: agent.kind,
    groupId,
    trigger: rule.data.trigger.type,
    messageIds,
    windowStart,
    windowEnd: now,
    instruction: rule.data.instruction,
    include: rule.data.include,
    status: 'queued',
    attempts: 0,
    lastError: null,
    digestId: null,
    createdAt: now,
    sentAt: null,
    completedAt: null,
    summary: null,
  };
  await ctx.store.set(COLLECTIONS.dispatches, id, doc);
  await ctx.queue.enqueue({ type: 'dispatch', id, attempt: 1, payload: { dispatchId: id } });
  return id;
}

/** Real-time rules for a freshly stored message. Returns created dispatch ids. */
export async function evaluateMessage(ctx: HubContext, message: StoredMessage): Promise<string[]> {
  const fired: string[] = [];
  for (const rule of await enabledRules(ctx)) {
    const { trigger } = rule.data;
    if (trigger.type === 'schedule' || !rule.data.groupIds.includes(message.groupId)) continue;

    let hit: boolean;
    if (trigger.type === 'volume') {
      const since = addMinutes(ctx.now(), -trigger.windowMinutes);
      const recent = await ctx.store.query<GroupMessageDoc>(COLLECTIONS.groupMessages, {
        where: [{ field: 'groupId', op: '==', value: message.groupId }, { field: 'timestamp', op: '>=', value: since }],
        orderBy: [{ field: 'timestamp', direction: 'desc' }],
        limit: trigger.threshold,
      });
      hit = recent.length >= trigger.threshold;
    } else {
      hit = matchesMessage(trigger, message);
    }
    if (!hit) continue;

    const agent = await agentCanUseGroup(ctx, rule.data.agentId, message.groupId);
    if (!agent) continue;
    if (!(await claimCooldown(ctx, rule.id, message.groupId, rule.data.cooldownMinutes))) continue;

    const context = rule.data.include.contextCount;
    const recent = await ctx.store.query<GroupMessageDoc>(COLLECTIONS.groupMessages, {
      where: [{ field: 'groupId', op: '==', value: message.groupId }, { field: 'timestamp', op: '<=', value: message.timestamp }],
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: Math.max(context, 1),
    });
    const ids = chronological(recent).map((r) => r.id);
    if (!ids.includes(message.id)) ids.push(message.id);
    fired.push(await createDispatch(ctx, rule, agent, message.groupId, ids.slice(-Math.max(context, 1)), null));
  }
  return fired;
}

/** Schedule rules (called by /scheduler/hub-tick): batch new messages per interval. */
export async function runScheduledRules(ctx: HubContext): Promise<string[]> {
  const fired: string[] = [];
  const now = ctx.now();
  for (const rule of await enabledRules(ctx)) {
    const { trigger } = rule.data;
    if (trigger.type !== 'schedule') continue;
    for (const groupId of rule.data.groupIds) {
      const agent = await agentCanUseGroup(ctx, rule.data.agentId, groupId);
      if (!agent) continue;
      const windowStart = await ctx.store.mutate<RuleStateDoc, Date | null | 'wait'>(COLLECTIONS.ruleState, `${rule.id}_${groupId}`, (current) => {
        const last = current?.lastScheduledAt ? new Date(current.lastScheduledAt) : null;
        if (!last) return { next: { lastFiredAt: current?.lastFiredAt ?? null, lastScheduledAt: now }, result: 'wait' };
        if (now.getTime() < addMinutes(last, trigger.intervalMinutes).getTime()) return { next: null, result: 'wait' };
        return { next: { lastFiredAt: now, lastScheduledAt: now }, result: last };
      });
      if (windowStart === 'wait' || windowStart === null) continue;

      const rows = await ctx.store.query<GroupMessageDoc>(COLLECTIONS.groupMessages, {
        where: [{ field: 'groupId', op: '==', value: groupId }, { field: 'timestamp', op: '>', value: windowStart }],
        orderBy: [{ field: 'timestamp', direction: 'desc' }],
        limit: MAX_SCHEDULE_MESSAGES,
      });
      const inWindow = rows.filter((r) => new Date(r.data.timestamp).getTime() <= now.getTime());
      if (!inWindow.length) continue;
      fired.push(await createDispatch(ctx, rule, agent, groupId, chronological(inWindow).map((r) => r.id), windowStart));
    }
  }
  return fired;
}
