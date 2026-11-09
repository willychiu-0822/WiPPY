import { z } from 'zod';
import type { HubContext } from './core/context';
import { apiKeyPrefix, decryptSecret, encryptSecret, generateApiKey, generatePassword, hashApiKey } from './core/crypto';
import { COLLECTIONS, type AgentDoc, type HubAccountDoc } from './core/types';
import { getOwnedGroup } from './groups';

export class AdminInputError extends Error {
  constructor(message: string, readonly status = 400, readonly code = 'invalid_request') {
    super(message);
    this.name = 'AdminInputError';
  }
}

const httpsUrl = z.string().url().refine((u) => u.startsWith('https://'), 'must start with https://');
const common = {
  name: z.string().trim().min(1).max(60),
  allowedGroupIds: z.array(z.string().min(1)).max(100),
  dailySendLimit: z.number().int().min(0).max(1000),
  inboxAlertHours: z.number().int().min(1).max(720),
};

const createFields = {
  ...common,
  allowedGroupIds: common.allowedGroupIds.default([]),
  dailySendLimit: common.dailySendLimit.default(20),
  inboxAlertHours: common.inboxAlertHours.default(24),
};

const createSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('grok_bot'), ...createFields, routineUrl: httpsUrl.nullish(), routineKey: z.string().min(1).max(500).nullish() }),
  z.object({ kind: z.literal('instinct'), ...createFields, email: z.string().email() }),
]);

const updateSchema = z.object({
  name: common.name.optional(),
  enabled: z.boolean().optional(),
  allowedGroupIds: common.allowedGroupIds.optional(),
  dailySendLimit: common.dailySendLimit.optional(),
  inboxAlertHours: common.inboxAlertHours.optional(),
  routineUrl: httpsUrl.nullish(),
  routineKey: z.string().min(1).max(500).nullish(),
});

export interface AgentView {
  id: string;
  name: string;
  kind: AgentDoc['kind'];
  enabled: boolean;
  allowedGroupIds: string[];
  dailySendLimit: number;
  inboxAlertHours: number;
  routineUrl: string | null;
  hasRoutineKey: boolean;
  apiKeyPrefix: string | null;
  accountUid: string | null;
  accountEmail: string | null;
  createdAt: string;
}

export function toAgentView(id: string, a: AgentDoc): AgentView {
  return {
    id,
    name: a.name,
    kind: a.kind,
    enabled: a.enabled,
    allowedGroupIds: a.allowedGroupIds ?? [],
    dailySendLimit: a.dailySendLimit,
    inboxAlertHours: a.inboxAlertHours,
    routineUrl: a.routineUrl ?? null,
    hasRoutineKey: !!a.routineKeyEnc,
    apiKeyPrefix: a.apiKeyPrefix ?? null,
    accountUid: a.accountUid ?? null,
    accountEmail: a.accountEmail ?? null,
    createdAt: new Date(a.createdAt).toISOString(),
  };
}

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const r = schema.safeParse(input);
  if (!r.success) throw new AdminInputError(r.error.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; '));
  return r.data;
}

async function assertOwnedGroups(ctx: HubContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    if (!(await getOwnedGroup(ctx, id))) throw new AdminInputError(`group ${id} is not one of your groups`);
  }
}

function encrypt(ctx: HubContext, secret: string): string {
  if (!ctx.env.encryptionKey) throw new AdminInputError('HUB_ENCRYPTION_KEY is not configured on the server', 503, 'encryption_key_missing');
  return encryptSecret(secret, ctx.env.encryptionKey);
}

async function getAgentOrThrow(ctx: HubContext, id: string): Promise<AgentDoc> {
  const agent = await ctx.store.get<AgentDoc>(COLLECTIONS.agents, id);
  if (!agent || agent.ownerId !== ctx.ownerId) throw new AdminInputError('Agent not found', 404, 'not_found');
  return agent;
}

export async function listAgents(ctx: HubContext): Promise<AgentView[]> {
  const rows = await ctx.store.query<AgentDoc>(COLLECTIONS.agents, { where: [{ field: 'ownerId', op: '==', value: ctx.ownerId }] });
  return rows.map((r) => toAgentView(r.id, r.data)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Creates a Grok Bot (returns its API key once) or an Instinct login account (returns its password once). */
export async function createAgent(ctx: HubContext, input: unknown): Promise<{ agent: AgentView; apiKey?: string; password?: string }> {
  const data = parse(createSchema, input);
  await assertOwnedGroups(ctx, data.allowedGroupIds);
  const id = ctx.store.newId();
  const now = ctx.now();
  const base: AgentDoc = {
    ownerId: ctx.ownerId,
    name: data.name,
    kind: data.kind,
    enabled: true,
    allowedGroupIds: data.allowedGroupIds,
    dailySendLimit: data.dailySendLimit,
    inboxAlertHours: data.inboxAlertHours,
    routineUrl: null,
    routineKeyEnc: null,
    apiKeyHash: null,
    apiKeyPrefix: null,
    accountUid: null,
    accountEmail: null,
    createdAt: now,
    updatedAt: now,
  };

  if (data.kind === 'grok_bot') {
    const apiKey = generateApiKey();
    const doc: AgentDoc = {
      ...base,
      routineUrl: data.routineUrl ?? null,
      routineKeyEnc: data.routineKey ? encrypt(ctx, data.routineKey) : null,
      apiKeyHash: hashApiKey(apiKey),
      apiKeyPrefix: apiKeyPrefix(apiKey),
    };
    await ctx.store.set(COLLECTIONS.agents, id, doc);
    return { agent: toAgentView(id, doc), apiKey };
  }

  if (!ctx.authAdmin) throw new AdminInputError('Firebase Auth admin is not available', 503, 'auth_unavailable');
  const password = generatePassword();
  let uid: string;
  try {
    uid = (await ctx.authAdmin.createUser({ email: data.email, password, displayName: data.name })).uid;
  } catch (err) {
    throw new AdminInputError(`無法建立登入帳號：${err instanceof Error ? err.message : String(err)}`, 409, 'account_create_failed');
  }
  const doc: AgentDoc = { ...base, accountUid: uid, accountEmail: data.email };
  await ctx.store.set(COLLECTIONS.agents, id, doc);
  const account: HubAccountDoc = { role: 'agent', ownerId: ctx.ownerId, agentId: id, disabled: false, createdAt: now };
  await ctx.store.set(COLLECTIONS.accounts, uid, account);
  return { agent: toAgentView(id, doc), password };
}

export async function updateAgent(ctx: HubContext, id: string, input: unknown): Promise<AgentView> {
  const agent = await getAgentOrThrow(ctx, id);
  const data = parse(updateSchema, input);
  if (data.allowedGroupIds) await assertOwnedGroups(ctx, data.allowedGroupIds);
  const patch: Partial<AgentDoc> = { updatedAt: ctx.now() };
  for (const key of ['name', 'enabled', 'allowedGroupIds', 'dailySendLimit', 'inboxAlertHours'] as const) {
    if (data[key] !== undefined) (patch as Record<string, unknown>)[key] = data[key];
  }
  if (agent.kind === 'grok_bot') {
    if (data.routineUrl !== undefined) patch.routineUrl = data.routineUrl ?? null;
    if (data.routineKey !== undefined) patch.routineKeyEnc = data.routineKey ? encrypt(ctx, data.routineKey) : null;
  }
  if (agent.kind === 'instinct' && data.enabled !== undefined && agent.accountUid) {
    await ctx.authAdmin?.setDisabled(agent.accountUid, !data.enabled);
    await ctx.store.update(COLLECTIONS.accounts, agent.accountUid, { disabled: !data.enabled });
  }
  await ctx.store.update(COLLECTIONS.agents, id, patch);
  return toAgentView(id, { ...agent, ...patch });
}

export async function rotateApiKey(ctx: HubContext, id: string): Promise<{ apiKey: string; agent: AgentView }> {
  const agent = await getAgentOrThrow(ctx, id);
  if (agent.kind !== 'grok_bot') throw new AdminInputError('only Grok Bot agents use API keys');
  const apiKey = generateApiKey();
  const patch = { apiKeyHash: hashApiKey(apiKey), apiKeyPrefix: apiKeyPrefix(apiKey), updatedAt: ctx.now() };
  await ctx.store.update(COLLECTIONS.agents, id, patch);
  return { apiKey, agent: toAgentView(id, { ...agent, ...patch }) };
}

export async function resetAgentPassword(ctx: HubContext, id: string): Promise<{ password: string }> {
  const agent = await getAgentOrThrow(ctx, id);
  if (agent.kind !== 'instinct' || !agent.accountUid || !ctx.authAdmin) throw new AdminInputError('only Instinct accounts have passwords');
  const password = generatePassword();
  await ctx.authAdmin.updatePassword(agent.accountUid, password);
  return { password };
}

/** Sends a harmless test payload to the Grok routine webhook. */
export async function testAgentRoutine(ctx: HubContext, id: string): Promise<{ ok: boolean; status: number | null; detail: string | null }> {
  const agent = await getAgentOrThrow(ctx, id);
  if (agent.kind !== 'grok_bot' || !agent.routineUrl || !agent.routineKeyEnc) throw new AdminInputError('Grok routine URL and key are required to test');
  if (!ctx.env.encryptionKey) throw new AdminInputError('HUB_ENCRYPTION_KEY is not configured on the server', 503, 'encryption_key_missing');
  try {
    const res = await ctx.fetch(agent.routineUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${decryptSecret(agent.routineKeyEnc, ctx.env.encryptionKey)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'wippy.test', message: 'WiPPY 連線測試：收到這則代表 webhook 設定正確，不需要做任何動作。', sentAt: ctx.now().toISOString() }),
    });
    return { ok: res.ok, status: res.status, detail: res.ok ? null : (await res.text().catch(() => '')).slice(0, 300) };
  } catch (err) {
    return { ok: false, status: null, detail: err instanceof Error ? err.message : String(err) };
  }
}
