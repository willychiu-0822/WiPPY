import { raiseAlert } from './alerts';
import type { HubContext } from './core/context';
import { taipeiMonthKey } from './core/time';
import { COLLECTIONS, type GroupDocLike } from './core/types';
import { getSettings } from './settings';

interface QuotaDoc {
  monthKey: string;
  type: 'none' | 'limited';
  limit: number | null;
  usedAtCheck: number;
  sentSinceCheck: number;
  checkedAt: Date;
  warnedLevels: number[];
}

export interface QuotaStatus {
  type: 'none' | 'limited';
  limit: number | null;
  used: number;
  remaining: number | null;
  reserve: number;
  percent: number;
  checkedAt: Date | null;
  /** true when LINE could not be asked and nothing is cached. */
  unknown: boolean;
}

export type QuotaCheck = { ok: true } | { ok: false; code: 'line_quota_reserve' | 'line_quota_exhausted'; detail: string };

const MEMBER_COUNT_TTL_MS = 60 * 60 * 1000;
const QUOTA_MAX_AGE_MS = 60 * 60 * 1000;

/** Messages a push consumes: one per recipient, so a group costs its member count. */
export async function estimateCost(ctx: HubContext, to: string): Promise<number> {
  if (!/^[CR]/.test(to)) return 1;
  const now = ctx.now();
  const cached = await ctx.store.get<{ memberCount: number; checkedAt: Date }>(COLLECTIONS.groupStats, to);
  if (cached && now.getTime() - new Date(cached.checkedAt).getTime() < MEMBER_COUNT_TTL_MS) return cached.memberCount;
  try {
    if (!ctx.line) throw new Error('LINE not configured');
    const memberCount = await ctx.line.getGroupMemberCount(to);
    await ctx.store.set(COLLECTIONS.groupStats, to, { memberCount, checkedAt: now });
    return memberCount;
  } catch {
    const group = await ctx.store.get<GroupDocLike>(COLLECTIONS.groups, to);
    return cached?.memberCount ?? (group?.memberCount && group.memberCount > 0 ? group.memberCount : 1);
  }
}

async function refreshQuota(ctx: HubContext): Promise<QuotaDoc> {
  if (!ctx.line) throw new Error('LINE not configured');
  const [quota, used] = await Promise.all([ctx.line.getQuota(), ctx.line.getConsumption()]);
  const now = ctx.now();
  const monthKey = taipeiMonthKey(now);
  return ctx.store.mutate<QuotaDoc, QuotaDoc>(COLLECTIONS.quota, monthKey, (current) => {
    const next: QuotaDoc = {
      monthKey,
      type: quota.type,
      limit: quota.type === 'limited' ? quota.value ?? 0 : null,
      usedAtCheck: used,
      sentSinceCheck: 0,
      checkedAt: now,
      warnedLevels: current?.warnedLevels ?? [],
    };
    return { next, result: next };
  });
}

function toStatus(doc: QuotaDoc, reservePercent: number): QuotaStatus {
  const used = doc.usedAtCheck + doc.sentSinceCheck;
  if (doc.type === 'none' || doc.limit === null) {
    return { type: 'none', limit: null, used, remaining: null, reserve: 0, percent: 0, checkedAt: doc.checkedAt, unknown: false };
  }
  const limit = doc.limit;
  return {
    type: 'limited',
    limit,
    used,
    remaining: limit - used,
    reserve: Math.ceil((limit * reservePercent) / 100),
    percent: limit > 0 ? Math.round((used / limit) * 1000) / 10 : 100,
    checkedAt: doc.checkedAt,
    unknown: false,
  };
}

export async function getQuotaStatus(ctx: HubContext): Promise<QuotaStatus> {
  const settings = await getSettings(ctx);
  const monthKey = taipeiMonthKey(ctx.now());
  let doc = await ctx.store.get<QuotaDoc>(COLLECTIONS.quota, monthKey);
  if (!doc || ctx.now().getTime() - new Date(doc.checkedAt).getTime() > QUOTA_MAX_AGE_MS) {
    try {
      doc = await refreshQuota(ctx);
    } catch (err) {
      console.warn(JSON.stringify({ severity: 'WARNING', event: 'hub_quota_refresh_failed', error: String(err) }));
    }
  }
  if (!doc) {
    return { type: 'limited', limit: null, used: 0, remaining: null, reserve: 0, percent: 0, checkedAt: null, unknown: true };
  }
  return toStatus(doc, settings.quotaReservePercent);
}

export async function recordSent(ctx: HubContext, cost: number): Promise<void> {
  const monthKey = taipeiMonthKey(ctx.now());
  await ctx.store.mutate<QuotaDoc, void>(COLLECTIONS.quota, monthKey, (current) => ({
    next: current
      ? { ...current, sentSinceCheck: current.sentSinceCheck + cost }
      : { monthKey, type: 'limited', limit: null, usedAtCheck: 0, sentSinceCheck: cost, checkedAt: new Date(0), warnedLevels: [] },
    result: undefined,
  }));
}

/** Agents may not use the reserve; alerts may use everything that is left. */
export function checkQuota(status: QuotaStatus, cost: number, purpose: 'agent' | 'alert'): QuotaCheck {
  if (status.unknown || status.type === 'none' || status.remaining === null) return { ok: true };
  if (cost > status.remaining) {
    return { ok: false, code: 'line_quota_exhausted', detail: `本月 LINE 推播額度不足（需要 ${cost} 則，剩 ${status.remaining} 則）` };
  }
  if (purpose === 'agent' && cost > status.remaining - status.reserve) {
    return { ok: false, code: 'line_quota_reserve', detail: `剩餘額度 ${status.remaining} 則，其中 ${status.reserve} 則保留給預警；這次需要 ${cost} 則` };
  }
  return { ok: true };
}

/** Hourly: refresh usage from LINE and alert once per crossed threshold per month. */
export async function monitorQuota(ctx: HubContext): Promise<{ percent: number; used: number; limit: number | null; alertedLevel: number | null }> {
  const settings = await getSettings(ctx);
  const doc = await refreshQuota(ctx);
  const status = toStatus(doc, settings.quotaReservePercent);
  if (status.type === 'none') return { percent: 0, used: status.used, limit: null, alertedLevel: null };

  const crossed = settings.quotaWarnPercents.filter((level) => status.percent >= level && !doc.warnedLevels.includes(level));
  if (!crossed.length) return { percent: status.percent, used: status.used, limit: status.limit, alertedLevel: null };

  const level = Math.max(...crossed);
  await ctx.store.mutate<QuotaDoc, void>(COLLECTIONS.quota, doc.monthKey, (current) => ({
    next: current ? { ...current, warnedLevels: [...new Set([...current.warnedLevels, ...crossed])] } : null,
    result: undefined,
  }));
  await raiseAlert(ctx, {
    severity: level >= 90 ? 'critical' : 'warning',
    source: 'line_quota',
    text: `LINE 推播額度本月已使用 ${status.percent}%（${status.used}/${status.limit} 則），剩 ${status.remaining} 則；其中 ${status.reserve} 則保留給預警。`,
  });
  return { percent: status.percent, used: status.used, limit: status.limit, alertedLevel: level };
}
