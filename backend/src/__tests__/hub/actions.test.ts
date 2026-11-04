import { executeAction, runActionJob, onActionFailed } from '../../hub/actions';
import { RetryableError } from '../../hub/core/jobs';
import { UpstreamError } from '../../hub/core/ports';
import type { Actor } from '../../hub/core/types';
import { incrementAgentSends } from '../../hub/counters';
import { saveSettings } from '../../hub/settings';
import { GROUP, GROUP_B, makeTestHub, seedGrokAgent, seedGroup, seedInstinctAgent, type TestHub } from './helpers';

const ALERT_GROUP = 'C9999999999abcdef0123456789abcdef';
const grok: Actor = { kind: 'agent', ownerId: 'owner_1', agentId: 'grok_1', via: 'mcp' };
const instinct: Actor = { kind: 'agent', ownerId: 'owner_1', agentId: 'instinct_1', via: 'ui' };
const owner: Actor = { kind: 'owner', ownerId: 'owner_1', via: 'ui' };

function head(status: number, headers: Record<string, string> = {}) {
  return new Response(null, { status, headers });
}

describe('executeAction', () => {
  let hub: TestHub;
  beforeEach(async () => {
    hub = makeTestHub();
    await seedGroup(hub, GROUP, { memberCount: 5 });
    await seedGroup(hub, GROUP_B, { memberCount: 5, agentEnabled: false });
    await seedGroup(hub, ALERT_GROUP, { memberCount: 1 });
    await seedGrokAgent(hub);
    await seedInstinctAgent(hub);
    await saveSettings(hub, { alertGroupId: ALERT_GROUP });
  });

  it('rejects unknown types and invalid params without creating anything', async () => {
    expect(await executeAction(hub, grok, { type: 'nuke', idempotencyKey: 'k1', params: {} })).toMatchObject({ status: 'invalid', code: 'invalid_request' });
    expect(await executeAction(hub, grok, { type: 'send_message', idempotencyKey: 'k1', params: { groupId: GROUP, text: '' } })).toMatchObject({ status: 'invalid', code: 'invalid_params' });
    expect(await executeAction(hub, grok, { type: 'send_message', idempotencyKey: 'bad/key', params: { groupId: GROUP, text: 'x' } })).toMatchObject({ status: 'invalid', code: 'invalid_request' });
    expect(hub.store.dump('hubActions')).toEqual({});
  });

  it('sends a message, counts it, audits it, and replays the same result for the same key', async () => {
    const first = await executeAction(hub, grok, { type: 'send_message', idempotencyKey: 'k1', params: { groupId: GROUP, text: '請大家注意安全' } });
    expect(first).toMatchObject({ actionId: 'grok_1_k1', status: 'done', result: { cost: 5 } });
    expect(hub.line.pushes).toHaveLength(1);
    expect(hub.line.pushes[0]).toMatchObject({ to: GROUP, messages: [{ type: 'text', text: '請大家注意安全' }] });
    const again = await executeAction(hub, grok, { type: 'send_message', idempotencyKey: 'k1', params: { groupId: GROUP, text: 'different' } });
    expect(again).toMatchObject({ actionId: 'grok_1_k1', status: 'done', replayed: true });
    expect(hub.line.pushes).toHaveLength(1);
    expect(Object.values(hub.store.dump('hubCounters')).find((c) => 'count' in c && !('windowCount' in c))).toMatchObject({ count: 1 });
    expect(Object.values(hub.store.dump('hubAuditLogs'))[0]).toMatchObject({ actor: 'grok_1', via: 'mcp', action: 'send_message', status: 'done', target: GROUP });
  });

  it('blocks groups the agent may not use, closed groups, daily limit and quota reserve', async () => {
    expect(await executeAction(hub, grok, { type: 'send_message', idempotencyKey: 'a', params: { groupId: GROUP_B, text: 'x' } })).toMatchObject({ status: 'blocked', code: 'group_not_allowed' });
    await seedGrokAgent(hub, { allowedGroupIds: [GROUP, GROUP_B] });
    expect(await executeAction(hub, grok, { type: 'send_message', idempotencyKey: 'b', params: { groupId: GROUP_B, text: 'x' } })).toMatchObject({ status: 'blocked', code: 'group_not_allowed' });
    await incrementAgentSends(hub, 'grok_1', 20);
    expect(await executeAction(hub, grok, { type: 'send_message', idempotencyKey: 'c', params: { groupId: GROUP, text: 'x' } })).toMatchObject({ status: 'blocked', code: 'agent_daily_limit' });
    await seedGrokAgent(hub, { dailySendLimit: 100 });
    hub.line.consumption = 190;
    expect(await executeAction(hub, grok, { type: 'send_message', idempotencyKey: 'd', params: { groupId: GROUP, text: 'x' } })).toMatchObject({ status: 'blocked', code: 'line_quota_reserve' });
    await seedGrokAgent(hub, { enabled: false });
    expect(await executeAction(hub, grok, { type: 'send_message', idempotencyKey: 'e', params: { groupId: GROUP, text: 'x' } })).toMatchObject({ status: 'blocked', code: 'agent_disabled' });
    expect(hub.line.pushes).toHaveLength(0);
  });

  it('sends link cards only for publicly reachable URLs and returns the reason otherwise', async () => {
    hub.fetchMock.mockResolvedValueOnce(head(401));
    const bad = await executeAction(hub, grok, { type: 'send_link', idempotencyKey: 'l1', params: { groupId: GROUP, url: 'https://grok.example/private', title: '報告' } });
    expect(bad).toMatchObject({ status: 'invalid', code: 'url_requires_login' });
    hub.fetchMock.mockResolvedValueOnce(head(200, { 'content-type': 'text/html' }));
    const ok = await executeAction(hub, grok, { type: 'send_link', idempotencyKey: 'l2', params: { groupId: GROUP, url: 'https://grok.example/page', title: '報告', description: '本週' } });
    expect(ok.status).toBe('done');
    expect(hub.line.pushes[0].messages[0]).toMatchObject({ type: 'flex', altText: '報告' });
  });

  it('sends images directly from the agent URL, requiring a preview when the original is over 1MB', async () => {
    hub.fetchMock.mockResolvedValueOnce(head(200, { 'content-type': 'image/png', 'content-length': '2000000' }));
    expect(await executeAction(hub, grok, { type: 'send_image', idempotencyKey: 'i1', params: { groupId: GROUP, url: 'https://cdn.example/a.png' } }))
      .toMatchObject({ status: 'invalid', code: 'preview_required' });
    hub.fetchMock.mockResolvedValueOnce(head(200, { 'content-type': 'image/png', 'content-length': '20000' }));
    expect((await executeAction(hub, grok, { type: 'send_image', idempotencyKey: 'i2', params: { groupId: GROUP, url: 'https://cdn.example/b.png' } })).status).toBe('done');
    expect(hub.line.pushes[0].messages[0]).toEqual({ type: 'image', originalContentUrl: 'https://cdn.example/b.png', previewImageUrl: 'https://cdn.example/b.png' });
  });

  it('validates video previews and audio durations', async () => {
    expect(await executeAction(hub, grok, { type: 'send_video', idempotencyKey: 'v0', params: { groupId: GROUP, url: 'https://cdn.example/v.mp4' } })).toMatchObject({ status: 'invalid', code: 'invalid_params' });
    hub.fetchMock
      .mockResolvedValueOnce(head(200, { 'content-type': 'video/mp4', 'content-length': '5000' }))
      .mockResolvedValueOnce(head(200, { 'content-type': 'text/html' }));
    expect(await executeAction(hub, grok, { type: 'send_video', idempotencyKey: 'v1', params: { groupId: GROUP, url: 'https://cdn.example/v.mp4', previewUrl: 'https://cdn.example/p' } }))
      .toMatchObject({ status: 'invalid', code: 'url_wrong_type' });
    hub.fetchMock.mockResolvedValueOnce(head(200, { 'content-type': 'audio/x-m4a' }));
    expect((await executeAction(hub, grok, { type: 'send_audio', idempotencyKey: 'a1', params: { groupId: GROUP, url: 'https://cdn.example/a.m4a', durationMs: 3000 } })).status).toBe('done');
    expect(hub.line.pushes[0].messages[0]).toEqual({ type: 'audio', originalContentUrl: 'https://cdn.example/a.m4a', duration: 3000 });
  });

  it('queues a retry when LINE fails transiently and finishes it from the job', async () => {
    hub.line.pushError = new UpstreamError('LINE 500', 500);
    const queued = await executeAction(hub, grok, { type: 'send_message', idempotencyKey: 'r1', params: { groupId: GROUP, text: 'x' } });
    expect(queued).toMatchObject({ status: 'queued' });
    expect(hub.queue.jobs[0]).toMatchObject({ job: { type: 'action_execute', id: 'grok_1_r1', attempt: 2, payload: { actionId: 'grok_1_r1' } }, delaySeconds: 10 });
    await expect(runActionJob(hub, 'grok_1_r1')).rejects.toBeInstanceOf(RetryableError);
    hub.line.pushError = null;
    await runActionJob(hub, 'grok_1_r1');
    expect(hub.store.dump('hubActions')['grok_1_r1']).toMatchObject({ status: 'done', attempts: 3 });
    expect(hub.line.pushes[0].retryKey).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('marks an action failed and alerts after the final retry', async () => {
    hub.line.pushError = new UpstreamError('LINE 500', 500);
    await executeAction(hub, grok, { type: 'send_message', idempotencyKey: 'f1', params: { groupId: GROUP, text: 'x' } });
    await onActionFailed(hub, 'grok_1_f1', new Error('LINE 500'));
    expect(hub.store.dump('hubActions')['grok_1_f1']).toMatchObject({ status: 'failed', lastError: 'LINE 500' });
    expect(Object.values(hub.store.dump('hubAlerts')).some((a) => a['source'] === 'action')).toBe(true);
  });

  it('sends alerts to the alert group even from the reserve and records them', async () => {
    hub.line.consumption = 199;
    const res = await executeAction(hub, instinct, { type: 'send_alert', idempotencyKey: 'al1', params: { text: '有人在群組抱怨退款', severity: 'warning' } });
    expect(res.status).toBe('done');
    expect(hub.line.pushes[0]).toMatchObject({ to: ALERT_GROUP, messages: [{ type: 'text', text: '⚠️ Instinct 預警\n有人在群組抱怨退款' }] });
    expect(Object.values(hub.store.dump('hubAlerts'))[0]).toMatchObject({ source: 'agent:instinct_1', delivered: true });
    await saveSettings(hub, { alertGroupId: null });
    expect(await executeAction(hub, instinct, { type: 'send_alert', idempotencyKey: 'al2', params: { text: 'x' } })).toMatchObject({ status: 'blocked', code: 'alert_group_not_set' });
  });

  it('records information for allowed groups', async () => {
    const res = await executeAction(hub, grok, { type: 'record', idempotencyKey: 'rec1', params: { category: '待辦', title: '修電燈', content: '3F 走廊', tags: ['維修'], groupId: GROUP, sourceMessageIds: ['m1'] } });
    expect(res).toMatchObject({ status: 'done', result: { recordId: 'grok_1_rec1' } });
    expect(hub.store.dump('agentRecords')['grok_1_rec1']).toMatchObject({ agentId: 'grok_1', category: '待辦', title: '修電燈', groupId: GROUP, tags: ['維修'] });
    expect(await executeAction(hub, grok, { type: 'record', idempotencyKey: 'rec2', params: { category: 'x', title: 't', content: 'c', groupId: GROUP_B } })).toMatchObject({ status: 'blocked', code: 'group_not_allowed' });
  });

  it('schedules messages into the activity scheduler, pre-approved, in Taipei time', async () => {
    const res = await executeAction(hub, grok, { type: 'schedule_message', idempotencyKey: 's1', params: { groupId: GROUP, text: '明天記得帶傘', sendAt: '2026-11-05T09:30:00+08:00' } });
    expect(res).toMatchObject({ status: 'done', result: { activityId: `agent-schedule-${GROUP}`, messageId: 'grok_1_s1' } });
    expect(hub.store.dump('activities')[`agent-schedule-${GROUP}`]).toMatchObject({ userId: 'owner_1', status: 'active', reviewStatus: 'approved', targetGroups: [GROUP] });
    expect(hub.store.dump(`activities/agent-schedule-${GROUP}/activityMessages`)['grok_1_s1']).toMatchObject({
      content: '明天記得帶傘', triggerType: 'scheduled', triggerValue: '2026-11-05T09:30:00+08:00', status: 'pending', reviewStatus: 'approved', processingAt: null, generatedByAgent: true, targetGroups: [GROUP],
    });
    expect(await executeAction(hub, grok, { type: 'schedule_message', idempotencyKey: 's2', params: { groupId: GROUP, text: 'x', sendAt: '2020-01-01T00:00:00Z' } })).toMatchObject({ status: 'invalid', code: 'send_at_in_past' });
  });

  it('completes the agent own dispatches and inbox items only', async () => {
    await hub.store.set('agentDispatches', 'd1', { ownerId: 'owner_1', agentId: 'grok_1', status: 'sent', groupId: GROUP });
    await hub.store.set('agentInbox', 'i1', { ownerId: 'owner_1', agentId: 'instinct_1', status: 'open', groupId: GROUP });
    expect(await executeAction(hub, instinct, { type: 'complete_dispatch', idempotencyKey: 'c0', params: { jobId: 'd1' } })).toMatchObject({ status: 'blocked', code: 'not_found' });
    expect((await executeAction(hub, grok, { type: 'complete_dispatch', idempotencyKey: 'c1', params: { jobId: 'd1', summary: '已發預警' } })).status).toBe('done');
    expect(hub.store.dump('agentDispatches')['d1']).toMatchObject({ status: 'completed', summary: '已發預警', completedAt: hub.now() });
    expect((await executeAction(hub, instinct, { type: 'complete_inbox', idempotencyKey: 'c2', params: { itemId: 'i1', note: '已處理' } })).status).toBe('done');
    expect(hub.store.dump('agentInbox')['i1']).toMatchObject({ status: 'done', note: '已處理', doneAt: hub.now() });
  });

  it('lets the owner act on any owned group without agent limits', async () => {
    await incrementAgentSends(hub, 'grok_1', 99);
    expect((await executeAction(hub, owner, { type: 'send_message', idempotencyKey: 'o1', params: { groupId: GROUP_B, text: 'owner says hi' } })).status).toBe('done');
    expect(await executeAction(hub, owner, { type: 'send_message', idempotencyKey: 'o2', params: { groupId: 'Cnotmine', text: 'x' } })).toMatchObject({ status: 'blocked', code: 'group_not_allowed' });
  });
});
