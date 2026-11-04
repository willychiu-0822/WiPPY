import type { HubContext } from './core/context';
import type { WhereClause } from './core/ports';
import { addDays } from './core/time';
import {
  COLLECTIONS,
  type Actor,
  type AgentDoc,
  type DigestDoc,
  type DispatchDoc,
  type GroupDocLike,
  type GroupMessageDoc,
  type HubMessageType,
  type InboxDoc,
  type MediaAssetDoc,
} from './core/types';
import { getAgentSendsToday } from './counters';
import { buildDispatchPayload } from './dispatch';
import { listHubGroups, type HubGroupSummary } from './groups';
import { toMessageViews, type MessageView } from './messagesView';
import { getQuotaStatus } from './quota';
import { chronological } from './rules';
import { getSettings } from './settings';

export class HubAccessError extends Error {
  constructor(readonly code: 'group_not_allowed' | 'not_found' | 'agent_disabled', message: string, readonly status: number) {
    super(message);
    this.name = 'HubAccessError';
  }
}

async function agentOf(ctx: HubContext, actor: Actor): Promise<AgentDoc | null> {
  if (actor.kind !== 'agent') return null;
  const agent = await ctx.store.get<AgentDoc>(COLLECTIONS.agents, actor.agentId);
  if (!agent?.enabled) throw new HubAccessError('agent_disabled', 'Agent 已停用', 403);
  return agent;
}

/** Groups this actor may read: owner → all owned; agent → opened and allowed. */
export async function listGroupsFor(ctx: HubContext, actor: Actor): Promise<HubGroupSummary[]> {
  const groups = await listHubGroups(ctx);
  if (actor.kind !== 'agent') return groups;
  const agent = await agentOf(ctx, actor);
  return groups.filter((g) => g.agentEnabled && agent!.allowedGroupIds.includes(g.groupId));
}

async function assertGroup(ctx: HubContext, actor: Actor, groupId: string): Promise<void> {
  const group = await ctx.store.get<GroupDocLike>(COLLECTIONS.groups, groupId);
  const ok = !!group && group.userId === ctx.ownerId
    && (actor.kind !== 'agent' || (!!group.agentEnabled && !!(await agentOf(ctx, actor))?.allowedGroupIds.includes(groupId)));
  if (!ok) throw new HubAccessError('group_not_allowed', '沒有這個群組的讀取權限', 403);
}

async function allowedGroupIds(ctx: HubContext, actor: Actor): Promise<string[]> {
  return (await listGroupsFor(ctx, actor)).map((g) => g.groupId);
}

export async function getMessagesFor(
  ctx: HubContext,
  actor: Actor,
  groupId: string,
  opts: { since?: Date; until?: Date; types?: HubMessageType[]; limit?: number },
): Promise<MessageView[]> {
  await assertGroup(ctx, actor, groupId);
  const where: WhereClause[] = [{ field: 'groupId', op: '==', value: groupId }];
  if (opts.since) where.push({ field: 'timestamp', op: '>=', value: opts.since });
  if (opts.until) where.push({ field: 'timestamp', op: '<=', value: opts.until });
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 200);
  const rows = await ctx.store.query<GroupMessageDoc>(COLLECTIONS.groupMessages, { where, orderBy: [{ field: 'timestamp', direction: 'desc' }], limit });
  const filtered = opts.types?.length ? rows.filter((r) => opts.types!.includes(r.data.type)) : rows;
  return toMessageViews(ctx, chronological(filtered).map((r) => ({ id: r.id, ...r.data })), true);
}

/** Plain case-insensitive text match (hard flow, no model) over recent messages. */
export async function searchMessagesFor(ctx: HubContext, actor: Actor, query: string, opts: { groupIds?: string[]; since?: Date; limit?: number }): Promise<MessageView[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  let groups = await allowedGroupIds(ctx, actor);
  if (opts.groupIds?.length) groups = groups.filter((g) => opts.groupIds!.includes(g));
  const hits: Array<{ id: string; data: GroupMessageDoc }> = [];
  for (const gid of groups) {
    const where: WhereClause[] = [{ field: 'groupId', op: '==', value: gid }];
    if (opts.since) where.push({ field: 'timestamp', op: '>=', value: opts.since });
    const rows = await ctx.store.query<GroupMessageDoc>(COLLECTIONS.groupMessages, { where, orderBy: [{ field: 'timestamp', direction: 'desc' }], limit: 500 });
    hits.push(...rows.filter((r) => [r.data.text, r.data.fileName, r.data.senderName].some((v) => v?.toLowerCase().includes(needle))));
  }
  const limited = chronological(hits).slice(-(opts.limit ?? 50));
  return toMessageViews(ctx, limited.map((r) => ({ id: r.id, ...r.data })), true);
}

export async function getDigestFor(ctx: HubContext, actor: Actor, digestId: string): Promise<DigestDoc & { id: string }> {
  const digest = await ctx.store.get<DigestDoc>(COLLECTIONS.digests, digestId);
  if (!digest || digest.ownerId !== ctx.ownerId) throw new HubAccessError('not_found', '找不到這份整理', 404);
  await assertGroup(ctx, actor, digest.groupId);
  return { id: digestId, ...digest };
}

export async function getLatestDigestFor(ctx: HubContext, actor: Actor, groupId: string): Promise<(DigestDoc & { id: string }) | null> {
  await assertGroup(ctx, actor, groupId);
  const rows = await ctx.store.query<DigestDoc>(COLLECTIONS.digests, {
    where: [{ field: 'groupId', op: '==', value: groupId }],
    orderBy: [{ field: 'createdAt', direction: 'desc' }],
    limit: 1,
  });
  return rows[0] ? { id: rows[0].id, ...rows[0].data } : null;
}

export async function getMediaFor(ctx: HubContext, actor: Actor, mediaAssetId: string) {
  const asset = await ctx.store.get<MediaAssetDoc>(COLLECTIONS.mediaAssets, mediaAssetId);
  if (!asset || asset.ownerId !== ctx.ownerId) throw new HubAccessError('not_found', '找不到這個媒體', 404);
  await assertGroup(ctx, actor, asset.groupId);
  const settings = await getSettings(ctx);
  const expiresAt = addDays(ctx.now(), settings.signedUrlDays);
  let url: string | null = null;
  if (asset.status === 'ready' && asset.storagePath && ctx.blobs) url = await ctx.blobs.signedUrl(asset.storagePath, expiresAt);
  if (asset.status === 'external') url = asset.externalUrl;
  return {
    mediaAssetId,
    groupId: asset.groupId,
    messageType: asset.messageType,
    status: asset.status,
    contentType: asset.contentType,
    size: asset.size,
    fileName: asset.fileName,
    url,
    urlExpiresAt: url && asset.status === 'ready' ? expiresAt.toISOString() : null,
  };
}

export interface RecordView {
  id: string;
  agentId: string;
  groupId: string | null;
  category: string;
  title: string;
  content: string;
  tags: string[];
  sourceMessageIds: string[];
  createdAt: string;
}

export async function listRecordsFor(ctx: HubContext, actor: Actor, opts: { groupId?: string; category?: string; q?: string; limit?: number }): Promise<RecordView[]> {
  const rows = await ctx.store.query<Record<string, unknown>>(COLLECTIONS.records, {
    where: [{ field: 'ownerId', op: '==', value: ctx.ownerId }],
    orderBy: [{ field: 'createdAt', direction: 'desc' }],
    limit: 500,
  });
  const allowed = actor.kind === 'agent' ? new Set(await allowedGroupIds(ctx, actor)) : null;
  const q = opts.q?.trim().toLowerCase();
  return rows
    .filter((r) => !allowed || r.data['groupId'] === null || allowed.has(String(r.data['groupId'])))
    .filter((r) => !opts.groupId || r.data['groupId'] === opts.groupId)
    .filter((r) => !opts.category || r.data['category'] === opts.category)
    .filter((r) => !q || [r.data['title'], r.data['content'], ...((r.data['tags'] as string[]) ?? [])].some((v) => String(v ?? '').toLowerCase().includes(q)))
    .slice(0, Math.min(opts.limit ?? 100, 500))
    .map((r) => ({
      id: r.id,
      agentId: String(r.data['agentId']),
      groupId: (r.data['groupId'] as string | null) ?? null,
      category: String(r.data['category']),
      title: String(r.data['title']),
      content: String(r.data['content']),
      tags: (r.data['tags'] as string[]) ?? [],
      sourceMessageIds: (r.data['sourceMessageIds'] as string[]) ?? [],
      createdAt: new Date(r.data['createdAt'] as Date).toISOString(),
    }));
}

export async function getQuotaFor(ctx: HubContext, actor: Actor) {
  const status = await getQuotaStatus(ctx);
  const agent = await agentOf(ctx, actor);
  const used = agent && actor.kind === 'agent' ? await getAgentSendsToday(ctx, actor.agentId) : 0;
  return {
    line: { type: status.type, limit: status.limit, used: status.used, remaining: status.remaining, reserve: status.reserve, percent: status.percent, unknown: status.unknown },
    agentDailyLimit: agent?.dailySendLimit ?? null,
    agentDailyRemaining: agent ? Math.max(0, agent.dailySendLimit - used) : null,
  };
}

export async function listInboxFor(ctx: HubContext, actor: Actor, status: 'open' | 'done' | 'all' = 'open') {
  const where: WhereClause[] = [{ field: 'ownerId', op: '==', value: ctx.ownerId }];
  if (status !== 'all') where.push({ field: 'status', op: '==', value: status });
  if (actor.kind === 'agent') where.push({ field: 'agentId', op: '==', value: actor.agentId });
  const rows = await ctx.store.query<InboxDoc>(COLLECTIONS.inbox, { where, orderBy: [{ field: 'createdAt', direction: 'desc' }], limit: 100 });
  return rows.map((r) => ({ id: r.id, ...r.data }));
}

export async function getDispatchFor(ctx: HubContext, actor: Actor, dispatchId: string) {
  const dispatch = await ctx.store.get<DispatchDoc>(COLLECTIONS.dispatches, dispatchId);
  if (!dispatch || dispatch.ownerId !== ctx.ownerId || (actor.kind === 'agent' && dispatch.agentId !== actor.agentId)) {
    throw new HubAccessError('not_found', '找不到這個派送工作', 404);
  }
  return buildDispatchPayload(ctx, dispatchId);
}
