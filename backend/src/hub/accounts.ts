import type { HubContext } from './core/context';
import { hashApiKey } from './core/crypto';
import { COLLECTIONS, type Actor, type ActorVia, type AgentDoc, type HubAccountDoc } from './core/types';

export function isProduction(): boolean {
  return process.env['K_SERVICE'] !== undefined || process.env['NODE_ENV'] === 'production';
}

/**
 * Who is this Firebase user? The configured owner, an agent account (Instinct)
 * created by the owner, or nobody (public sign-ups are rejected).
 */
export async function resolveFirebaseActor(ctx: HubContext, uid: string, ownerUserId: string | undefined): Promise<Actor | null> {
  const account = await ctx.store.get<HubAccountDoc>(COLLECTIONS.accounts, uid);
  // An explicit agent account always takes precedence, even if OWNER_USER_ID
  // accidentally names that uid or is absent in local development.
  if (account) {
    if (account.disabled || account.ownerId !== ctx.ownerId) return null;
    const agent = await ctx.store.get<AgentDoc>(COLLECTIONS.agents, account.agentId);
    if (!agent?.enabled || agent.ownerId !== ctx.ownerId) return null;
    return { kind: 'agent', ownerId: ctx.ownerId, agentId: account.agentId, via: 'ui' };
  }
  const owner = ownerUserId?.trim();
  if (uid === owner || (!owner && !isProduction())) {
    return { kind: 'owner', ownerId: ctx.ownerId, via: 'ui' };
  }
  return null;
}

export class AgentDisabledError extends Error {
  constructor() {
    super('此 Agent 已停用，請聯絡擁有者重新啟用');
    this.name = 'AgentDisabledError';
  }
}

/** Resolves a `wpy_` API key (Grok Bot) to its enabled agent. */
export async function resolveApiKeyActor(ctx: HubContext, key: string, via: ActorVia): Promise<Actor | null> {
  const matches = await ctx.store.query<AgentDoc>(COLLECTIONS.agents, {
    where: [{ field: 'apiKeyHash', op: '==', value: hashApiKey(key) }],
    limit: 1,
  });
  const match = matches[0];
  if (!match || match.data.ownerId !== ctx.ownerId) return null;
  if (!match.data.enabled) throw new AgentDisabledError();
  return { kind: 'agent', ownerId: ctx.ownerId, agentId: match.id, via };
}
