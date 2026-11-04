import type { HubContext } from './core/context';
import { taipeiDateKey } from './core/time';
import { COLLECTIONS } from './core/types';

function sendsId(agentId: string, now: Date): string {
  return `agentSends_${agentId}_${taipeiDateKey(now)}`;
}

export async function getAgentSendsToday(ctx: HubContext, agentId: string): Promise<number> {
  return (await ctx.store.get<{ count: number }>(COLLECTIONS.counters, sendsId(agentId, ctx.now())))?.count ?? 0;
}

export async function incrementAgentSends(ctx: HubContext, agentId: string, by = 1): Promise<number> {
  return ctx.store.mutate<{ count: number }, number>(COLLECTIONS.counters, sendsId(agentId, ctx.now()), (current) => {
    const count = (current?.count ?? 0) + by;
    return { next: { count }, result: count };
  });
}
