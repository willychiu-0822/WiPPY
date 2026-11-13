import type { HubContext } from './core/context';
import { taipeiDateKey } from './core/time';
import { COLLECTIONS } from './core/types';
import { getSettings } from './settings';

interface LlmCounterDoc {
  count: number;
  windowStart: Date | null;
  windowCount: number;
  lastCallAt: Date | null;
}

export type LlmSlot = { ok: true } | { ok: false; reason: 'daily_limit' | 'rate_limit'; retryAfterMs: number };

const WINDOW_MS = 60_000;

function counterId(now: Date): string {
  return `llm_${taipeiDateKey(now)}`;
}

function windowed(doc: LlmCounterDoc | null, now: Date): LlmCounterDoc {
  const base = doc ?? { count: 0, windowStart: null, windowCount: 0, lastCallAt: null };
  const start = base.windowStart ? new Date(base.windowStart) : null;
  if (!start || now.getTime() - start.getTime() >= WINDOW_MS) return { ...base, windowStart: now, windowCount: 0 };
  return base;
}

/**
 * Global budget for the free model, shared by every caller: daily cap, calls
 * per minute and a minimum gap between calls. Reserves the slot when granted.
 */
export async function acquireLlmSlot(ctx: HubContext): Promise<LlmSlot> {
  const { llm } = await getSettings(ctx);
  const now = ctx.now();
  return ctx.store.mutate<LlmCounterDoc, LlmSlot>(COLLECTIONS.counters, counterId(now), (current) => {
    const doc = windowed(current, now);
    if (doc.count >= llm.maxRpd) return { next: null, result: { ok: false, reason: 'daily_limit', retryAfterMs: 3_600_000 } };
    if (doc.windowCount >= llm.maxRpm) {
      return { next: null, result: { ok: false, reason: 'rate_limit', retryAfterMs: new Date(doc.windowStart!).getTime() + WINDOW_MS - now.getTime() } };
    }
    const last = doc.lastCallAt ? new Date(doc.lastCallAt) : null;
    if (last && now.getTime() - last.getTime() < llm.minIntervalMs) {
      return { next: null, result: { ok: false, reason: 'rate_limit', retryAfterMs: llm.minIntervalMs - (now.getTime() - last.getTime()) } };
    }
    return { next: { ...doc, count: doc.count + 1, windowCount: doc.windowCount + 1, lastCallAt: now }, result: { ok: true } };
  });
}

/** Counts a model call made outside the hub (e.g. the activity planner). */
export async function recordLlmCall(ctx: HubContext): Promise<void> {
  const now = ctx.now();
  await ctx.store.mutate<LlmCounterDoc, void>(COLLECTIONS.counters, counterId(now), (current) => {
    const doc = windowed(current, now);
    return { next: { ...doc, count: doc.count + 1, windowCount: doc.windowCount + 1, lastCallAt: now }, result: undefined };
  });
}

export async function getLlmUsage(ctx: HubContext): Promise<{ today: number; maxRpd: number }> {
  const { llm } = await getSettings(ctx);
  const doc = await ctx.store.get<LlmCounterDoc>(COLLECTIONS.counters, counterId(ctx.now()));
  return { today: doc?.count ?? 0, maxRpd: llm.maxRpd };
}
