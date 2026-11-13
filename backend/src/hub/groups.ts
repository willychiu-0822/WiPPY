import type { HubContext } from './core/context';
import { COLLECTIONS, type GroupDocLike } from './core/types';

export interface HubGroupSummary {
  groupId: string;
  name: string;
  memberCount: number;
  agentEnabled: boolean;
}

function summarize(id: string, g: GroupDocLike): HubGroupSummary {
  return { groupId: id, name: g.name ?? id, memberCount: g.memberCount ?? 0, agentEnabled: !!g.agentEnabled };
}

export async function listHubGroups(ctx: HubContext): Promise<HubGroupSummary[]> {
  const rows = await ctx.store.query<GroupDocLike>(COLLECTIONS.groups, {
    where: [{ field: 'userId', op: '==', value: ctx.ownerId }, { field: 'isActive', op: '==', value: true }],
  });
  return rows.map((r) => summarize(r.id, r.data)).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getOwnedGroup(ctx: HubContext, groupId: string): Promise<GroupDocLike | null> {
  const group = await ctx.store.get<GroupDocLike>(COLLECTIONS.groups, groupId);
  return group && group.userId === ctx.ownerId ? group : null;
}

/** Owner opt-in: only opened groups are stored for, or visible to, agents. */
export async function setGroupAgentAccess(ctx: HubContext, groupId: string, enabled: boolean): Promise<HubGroupSummary | null> {
  const group = await getOwnedGroup(ctx, groupId);
  if (!group) return null;
  await ctx.store.update(COLLECTIONS.groups, groupId, { agentEnabled: enabled, agentEnabledAt: enabled ? ctx.now() : null });
  return summarize(groupId, { ...group, agentEnabled: enabled });
}
