import { PermanentError, RetryableError } from '../../hub/core/jobs';
import { buildDispatchPayload, onDispatchFailed, runDispatch } from '../../hub/dispatch';
import { alertOverdueInbox } from '../../hub/inbox';
import { saveSettings } from '../../hub/settings';
import { GROUP, jsonResponse, makeTestHub, seedGrokAgent, seedGroup, seedInstinctAgent, seedMessage, type TestHub } from './helpers';

async function seedDispatch(hub: TestHub, overrides: Record<string, unknown> = {}) {
  await hub.store.set('agentDispatches', 'd1', {
    ownerId: hub.ownerId, ruleId: 'r1', ruleName: '緊急關鍵字', agentId: 'grok_1', agentKind: 'grok_bot',
    groupId: GROUP, trigger: 'keyword', messageIds: ['a', 'img'], windowStart: null, windowEnd: hub.now(),
    instruction: '判斷是否需要預警', include: { digest: false, raw: true, media: true, contextCount: 5 },
    status: 'queued', attempts: 0, lastError: null, digestId: null, createdAt: hub.now(), sentAt: null, completedAt: null, summary: null,
    ...overrides,
  });
}

describe('dispatch to agents', () => {
  let hub: TestHub;
  beforeEach(async () => {
    hub = makeTestHub();
    await seedGroup(hub, GROUP, { name: 'Team', memberCount: 6 });
    await seedMessage(hub, { id: 'a', text: '緊急：停電' });
    hub.clock.now = new Date(hub.clock.now.getTime() + 1000);
    await seedMessage(hub, { id: 'img', type: 'image', text: null, mediaAssetId: 'line_img' });
    await hub.store.set('mediaAssets', 'line_img', { status: 'ready', storagePath: `line-media/${GROUP}/line_img`, contentType: 'image/jpeg', size: 10 });
    await hub.blobs.put(`line-media/${GROUP}/line_img`, Buffer.from('x'), 'image/jpeg');
  });

  it('builds a payload with callback, rule, group, messages, signed media links and budgets', async () => {
    await seedGrokAgent(hub);
    await seedDispatch(hub);
    const payload = await buildDispatchPayload(hub, 'd1');
    expect(payload).toMatchObject({
      jobId: 'd1',
      kind: 'wippy.dispatch',
      callback: { tool: 'complete_dispatch', restUrl: 'https://wippy.test/api/hub/v1/dispatches/d1/complete', mcpUrl: 'https://wippy.test/api/hub/mcp' },
      rule: { id: 'r1', name: '緊急關鍵字', trigger: 'keyword', instruction: '判斷是否需要預警' },
      group: { id: GROUP, name: 'Team', memberCount: 6 },
      digest: null,
      quota: { agentDailyRemaining: 20 },
      messageCount: 2,
    });
    expect(payload.messages[0]).toMatchObject({ id: 'a', sender: 'Alice', type: 'text', text: '緊急：停電', media: null });
    expect(payload.messages[1].media).toMatchObject({ status: 'ready', contentType: 'image/jpeg', url: expect.stringContaining(`https://blobs.test/line-media/${GROUP}/line_img`) });
  });

  it('omits raw messages and media links when the rule says so', async () => {
    await seedGrokAgent(hub);
    await seedDispatch(hub, { include: { digest: false, raw: false, media: false, contextCount: 5 } });
    const payload = await buildDispatchPayload(hub, 'd1');
    expect(payload.messages).toEqual([]);
    expect(payload.messageCount).toBe(2);
  });

  it('POSTs the payload to the Grok routine webhook with the decrypted key and marks it sent', async () => {
    await seedGrokAgent(hub);
    await seedDispatch(hub);
    hub.fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    await runDispatch(hub, 'd1');
    const [url, init] = hub.fetchMock.mock.calls[0];
    expect(url).toBe('https://grok.example/routines/r1/webhook');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer routine-secret');
    expect(JSON.parse(init.body).jobId).toBe('d1');
    expect(hub.store.dump('agentDispatches')['d1']).toMatchObject({ status: 'sent', attempts: 1, sentAt: hub.now(), lastError: null });
    await runDispatch(hub, 'd1');
    expect(hub.fetchMock).toHaveBeenCalledTimes(1);
  });

  it('includes the digest when asked and stores its id', async () => {
    await seedGrokAgent(hub);
    await seedDispatch(hub, { include: { digest: true, raw: true, media: true, contextCount: 5 } });
    await saveSettings(hub, { llm: { maxRpm: 100, maxRpd: 100, minIntervalMs: 0 } });
    hub.llmMock.chat.mockResolvedValueOnce('{"summary":"停電","points":["需要處理"],"tags":["緊急"]}');
    hub.fetchMock.mockResolvedValueOnce(jsonResponse(200, {}));
    await runDispatch(hub, 'd1');
    const body = JSON.parse(hub.fetchMock.mock.calls[0][1].body);
    expect(body.digest).toMatchObject({ summary: '停電', skipped: false, mediaList: [expect.objectContaining({ messageId: 'img' })] });
    expect(hub.store.dump('agentDispatches')['d1']['digestId']).toMatch(/^dg_/);
  });

  it('retries on 5xx/429/network errors and fails permanently on auth errors', async () => {
    await seedGrokAgent(hub);
    await seedDispatch(hub);
    hub.fetchMock.mockResolvedValueOnce(jsonResponse(503, 'busy'));
    await expect(runDispatch(hub, 'd1')).rejects.toBeInstanceOf(RetryableError);
    hub.fetchMock.mockRejectedValueOnce(new Error('ECONNRESET'));
    await expect(runDispatch(hub, 'd1')).rejects.toBeInstanceOf(RetryableError);
    hub.fetchMock.mockResolvedValueOnce(jsonResponse(401, 'bad key'));
    await expect(runDispatch(hub, 'd1')).rejects.toBeInstanceOf(PermanentError);
    expect(hub.store.dump('agentDispatches')['d1']).toMatchObject({ status: 'queued', attempts: 3 });
  });

  it('fails permanently when the agent is disabled or the routine is not configured', async () => {
    await seedGrokAgent(hub, { routineUrl: null });
    await seedDispatch(hub);
    await expect(runDispatch(hub, 'd1')).rejects.toThrow(/routine/);
    await seedGrokAgent(hub, { enabled: false });
    await expect(runDispatch(hub, 'd1')).rejects.toBeInstanceOf(PermanentError);
  });

  it('marks the dispatch failed and raises a critical alert after the last retry', async () => {
    await seedGrokAgent(hub);
    await seedDispatch(hub);
    await onDispatchFailed(hub, 'd1', new Error('Grok webhook down'));
    expect(hub.store.dump('agentDispatches')['d1']).toMatchObject({ status: 'failed', lastError: 'Grok webhook down' });
    const alert = Object.values(hub.store.dump('hubAlerts'))[0];
    expect(alert).toMatchObject({ severity: 'critical', source: 'dispatch' });
    expect(String(alert['text'])).toContain('Grok');
  });

  it('delivers Instinct dispatches to its inbox (no network call)', async () => {
    await seedInstinctAgent(hub);
    await seedDispatch(hub, { agentId: 'instinct_1', agentKind: 'instinct' });
    await runDispatch(hub, 'd1');
    expect(hub.fetchMock).not.toHaveBeenCalled();
    expect(hub.store.dump('agentDispatches')['d1']).toMatchObject({ status: 'delivered_to_inbox' });
    expect(hub.store.dump('agentInbox')['d1']).toMatchObject({ agentId: 'instinct_1', dispatchId: 'd1', status: 'open', groupName: 'Team', instruction: '判斷是否需要預警', messageIds: ['a', 'img'] });
  });
});

describe('alertOverdueInbox', () => {
  it('alerts once for inbox items left open longer than the agent threshold', async () => {
    const hub = makeTestHub();
    await seedInstinctAgent(hub, { inboxAlertHours: 24 });
    const base = { ownerId: hub.ownerId, agentId: 'instinct_1', dispatchId: 'x', ruleId: 'r', ruleName: '每日摘要', groupId: GROUP, groupName: 'Team', instruction: 'i', messageIds: [], digestId: null, note: null, doneAt: null, alertedAt: null };
    await hub.store.set('agentInbox', 'old', { ...base, status: 'open', createdAt: new Date(hub.now().getTime() - 25 * 3600_000) });
    await hub.store.set('agentInbox', 'new', { ...base, status: 'open', createdAt: new Date(hub.now().getTime() - 2 * 3600_000) });
    await hub.store.set('agentInbox', 'done', { ...base, status: 'done', createdAt: new Date(hub.now().getTime() - 48 * 3600_000) });
    expect(await alertOverdueInbox(hub)).toBe(1);
    expect(await alertOverdueInbox(hub)).toBe(0);
    expect(hub.store.dump('agentInbox')['old']['alertedAt']).toEqual(hub.now());
    expect(String(Object.values(hub.store.dump('hubAlerts'))[0]['text'])).toContain('Instinct');
  });
});
