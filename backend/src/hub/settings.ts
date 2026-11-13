import type { HubContext } from './core/context';
import { COLLECTIONS, type HubSettings } from './core/types';

export const DEFAULT_SETTINGS: HubSettings = {
  alertGroupId: null,
  quotaWarnPercents: [70, 90],
  quotaReservePercent: 5,
  retentionDays: 180,
  mediaMaxBytes: 50 * 1024 * 1024,
  signedUrlDays: 7,
  llm: { maxRpm: 10, maxRpd: 500, minIntervalMs: 6000 },
};

export async function getSettings(ctx: HubContext): Promise<HubSettings> {
  const stored = await ctx.store.get<Partial<HubSettings>>(COLLECTIONS.settings, ctx.ownerId);
  return {
    ...DEFAULT_SETTINGS,
    ...(stored ?? {}),
    llm: { ...DEFAULT_SETTINGS.llm, ...(stored?.llm ?? {}) },
  };
}

export async function saveSettings(ctx: HubContext, patch: Partial<HubSettings>): Promise<HubSettings> {
  const current = await getSettings(ctx);
  const next: HubSettings = {
    ...current,
    ...patch,
    llm: { ...current.llm, ...(patch.llm ?? {}) },
    quotaWarnPercents: [...(patch.quotaWarnPercents ?? current.quotaWarnPercents)].sort((a, b) => a - b),
  };
  await ctx.store.set(COLLECTIONS.settings, ctx.ownerId, next);
  return next;
}
