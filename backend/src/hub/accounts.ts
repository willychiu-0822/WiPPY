import type { HubContext } from './core/context';
import { hashApiKey } from './core/crypto';
import { COLLECTIONS, type Actor, type ActorVia, type AgentDoc, type HubAccountDoc } from './core/types';

/**
 * Who is this Firebase user? The configured owner, an agent account (Instinct)
 * created by the owner, or nobody (public sign-ups are rejected).
 */
export async function resolveFirebaseActor(ctx: HubContext, uid: string, ownerUserId: string | undefined): Promise<Actor | null> {
  if (!ownerUserId?.trim() || uid === ownerUserId) {
    return { kind: 'owner', ownerId: ctx.ownerId, via: 'ui' };
  }
  const account = await ctx.store.get<HubAccountDoc>(COLLECTIONS.accounts, uid);
  if (!account || account.disabled || account.ownerId !== ctx.ownerId) return null;
  const agent = await ctx.store.get<AgentDoc>(COLLECTIONS.agents, account.agentId);
  if (!agent?.enabled) return null;
  return { kind: 'agent', ownerId: ctx.ownerId, agentId: account.agentId, via: 'ui' };
}

/** Resolves a `wpy_` API key (Grok Bot) to its enabled agent. */
export async function resolveApiKeyActor(ctx: HubContext, key: string, via: ActorVia): Promise<Actor | null> {
  const matches = await ctx.store.query<AgentDoc>(COLLECTIONS.agents, {
    where: [{ field: 'apiKeyHash', op: '==', value: hashApiKey(key) }],
    limit: 1,
  });
  const match = matches[0];
  if (!match || !match.data.enabled || match.data.ownerId !== ctx.ownerId) return null;
  return { kind: 'agent', ownerId: ctx.ownerId, agentId: match.id, via };
}
