import { raiseAlert } from './alerts';
import type { HubContext } from './core/context';
import { COLLECTIONS, type AgentDoc, type InboxDoc } from './core/types';

/** Alerts once for each inbox item an agent (Instinct) left open too long. */
export async function alertOverdueInbox(ctx: HubContext): Promise<number> {
  const open = await ctx.store.query<InboxDoc>(COLLECTIONS.inbox, { where: [{ field: 'status', op: '==', value: 'open' }] });
  const agents = new Map<string, AgentDoc | null>();
  let alerted = 0;
  for (const item of open) {
    if (item.data.alertedAt || item.data.ownerId !== ctx.ownerId) continue;
    if (!agents.has(item.data.agentId)) agents.set(item.data.agentId, await ctx.store.get<AgentDoc>(COLLECTIONS.agents, item.data.agentId));
    const agent = agents.get(item.data.agentId);
    const hours = agent?.inboxAlertHours ?? 24;
    const ageMs = ctx.now().getTime() - new Date(item.data.createdAt).getTime();
    if (ageMs < hours * 3600_000) continue;
    await raiseAlert(ctx, {
      severity: 'warning',
      source: 'inbox_overdue',
      text: `${agent?.name ?? item.data.agentId} 的收件匣項目「${item.data.ruleName}／${item.data.groupName}」已超過 ${hours} 小時沒處理。`,
    });
    await ctx.store.update(COLLECTIONS.inbox, item.id, { alertedAt: ctx.now() });
    alerted += 1;
  }
  return alerted;
}
