import { raiseAlert } from './alerts';
import type { HubContext } from './core/context';
import { decryptSecret } from './core/crypto';
import { errorMessage, toJobError } from './core/errors';
import { PermanentError } from './core/jobs';
import { UpstreamError } from './core/ports';
import { COLLECTIONS, type AgentDoc, type DigestDoc, type DispatchDoc, type GroupDocLike, type InboxDoc } from './core/types';
import { getAgentSendsToday } from './counters';
import { ensureDigest } from './digest';
import { loadMessages, toMessageViews } from './messagesView';
import { getQuotaStatus } from './quota';

const WEBHOOK_TIMEOUT_MS = 15_000;

export async function buildDispatchPayload(ctx: HubContext, dispatchId: string) {
  const dispatch = await ctx.store.get<DispatchDoc>(COLLECTIONS.dispatches, dispatchId);
  if (!dispatch) throw new PermanentError(`dispatch ${dispatchId} not found`);
  const [agent, group, quota, sendsToday] = await Promise.all([
    ctx.store.get<AgentDoc>(COLLECTIONS.agents, dispatch.agentId),
    ctx.store.get<GroupDocLike>(COLLECTIONS.groups, dispatch.groupId),
    getQuotaStatus(ctx),
    getAgentSendsToday(ctx, dispatch.agentId),
  ]);
  const messages = await loadMessages(ctx, dispatch.messageIds);
  const digest = dispatch.digestId ? await ctx.store.get<DigestDoc>(COLLECTIONS.digests, dispatch.digestId) : null;
  const base = ctx.env.publicBaseUrl;
  return {
    jobId: dispatchId,
    kind: 'wippy.dispatch',
    createdAt: new Date(dispatch.createdAt).toISOString(),
    callback: {
      tool: 'complete_dispatch',
      restUrl: `${base}/api/hub/v1/dispatches/${dispatchId}/complete`,
      mcpUrl: `${base}/api/hub/mcp`,
    },
    howToAct: '要執行動作（發訊息、預警、記錄、發連結/圖片/影片/語音、排程）請呼叫 WiPPY 的 MCP 工具或 POST /api/hub/v1/actions，每個請求都要帶 idempotencyKey；完成後呼叫 complete_dispatch。',
    rule: { id: dispatch.ruleId, name: dispatch.ruleName, trigger: dispatch.trigger, instruction: dispatch.instruction },
    group: { id: dispatch.groupId, name: group?.name ?? dispatch.groupId, memberCount: group?.memberCount ?? null },
    window: { start: dispatch.windowStart ? new Date(dispatch.windowStart).toISOString() : null, end: new Date(dispatch.windowEnd).toISOString() },
    digest: digest
      ? { summary: digest.summary, points: digest.points, tags: digest.tags, imageNotes: digest.imageNotes, mediaList: digest.mediaList, skipped: digest.skipped, skipReason: digest.skipReason }
      : null,
    messageCount: messages.length,
    messages: dispatch.include.raw ? await toMessageViews(ctx, messages, dispatch.include.media) : [],
    quota: {
      lineRemaining: quota.remaining,
      lineReserve: quota.reserve,
      agentDailyRemaining: Math.max(0, (agent?.dailySendLimit ?? 0) - sendsToday),
    },
  };
}

async function postToRoutine(ctx: HubContext, agent: AgentDoc, body: unknown): Promise<void> {
  if (!agent.routineUrl || !agent.routineKeyEnc) throw new PermanentError('Grok routine webhook URL or key is not configured');
  if (!ctx.env.encryptionKey) throw new PermanentError('HUB_ENCRYPTION_KEY is not configured');
  let key: string;
  try {
    key = decryptSecret(agent.routineKeyEnc, ctx.env.encryptionKey);
  } catch {
    throw new PermanentError('cannot decrypt the Grok routine key (HUB_ENCRYPTION_KEY changed?)');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const res = await ctx.fetch(agent.routineUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new UpstreamError(`routine webhook HTTP ${res.status}: ${text.slice(0, 200)}`, res.status);
    }
  } finally {
    clearTimeout(timer);
  }
}

/** Dispatch job: optional digest, then Grok routine webhook or Instinct inbox. */
export async function runDispatch(ctx: HubContext, dispatchId: string): Promise<void> {
  const dispatch = await ctx.store.get<DispatchDoc>(COLLECTIONS.dispatches, dispatchId);
  if (!dispatch || dispatch.status !== 'queued') return;
  const agent = await ctx.store.get<AgentDoc>(COLLECTIONS.agents, dispatch.agentId);
  if (!agent?.enabled) throw new PermanentError(`agent ${dispatch.agentId} is disabled or missing`);

  await ctx.store.update(COLLECTIONS.dispatches, dispatchId, { attempts: dispatch.attempts + 1 });
  try {
    if (dispatch.include.digest && !dispatch.digestId) {
      const digest = await ensureDigest(ctx, dispatch.groupId, await loadMessages(ctx, dispatch.messageIds));
      await ctx.store.update(COLLECTIONS.dispatches, dispatchId, { digestId: digest.id });
    }

    if (agent.kind === 'instinct') {
      const group = await ctx.store.get<GroupDocLike>(COLLECTIONS.groups, dispatch.groupId);
      const fresh = (await ctx.store.get<DispatchDoc>(COLLECTIONS.dispatches, dispatchId))!;
      const item: InboxDoc = {
        ownerId: ctx.ownerId,
        agentId: dispatch.agentId,
        dispatchId,
        ruleId: dispatch.ruleId,
        ruleName: dispatch.ruleName,
        groupId: dispatch.groupId,
        groupName: group?.name ?? dispatch.groupId,
        instruction: dispatch.instruction,
        messageIds: dispatch.messageIds,
        digestId: fresh.digestId,
        status: 'open',
        note: null,
        createdAt: ctx.now(),
        doneAt: null,
        alertedAt: null,
      };
      await ctx.store.create(COLLECTIONS.inbox, dispatchId, item);
      await ctx.store.update(COLLECTIONS.dispatches, dispatchId, { status: 'delivered_to_inbox', sentAt: ctx.now(), lastError: null });
      return;
    }

    await postToRoutine(ctx, agent, await buildDispatchPayload(ctx, dispatchId));
    await ctx.store.update(COLLECTIONS.dispatches, dispatchId, { status: 'sent', sentAt: ctx.now(), lastError: null });
  } catch (err) {
    await ctx.store.update(COLLECTIONS.dispatches, dispatchId, { lastError: errorMessage(err) });
    throw toJobError(err, 'dispatch');
  }
}

export async function onDispatchFailed(ctx: HubContext, dispatchId: string, error: Error): Promise<void> {
  const dispatch = await ctx.store.get<DispatchDoc>(COLLECTIONS.dispatches, dispatchId);
  if (!dispatch) return;
  await ctx.store.update(COLLECTIONS.dispatches, dispatchId, { status: 'failed', lastError: error.message });
  const agent = await ctx.store.get<AgentDoc>(COLLECTIONS.agents, dispatch.agentId);
  await raiseAlert(ctx, {
    severity: 'critical',
    source: 'dispatch',
    text: `規則「${dispatch.ruleName}」派送給 ${agent?.name ?? dispatch.agentId} 失敗，已重試 ${dispatch.attempts} 次：${error.message}。可在後台「執行紀錄」手動重試。`,
  });
}
