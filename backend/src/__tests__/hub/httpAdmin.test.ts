import '../../hub/register';
import { decryptSecret, hashApiKey } from '../../hub/core/crypto';
import { GROUP, GROUP_B, jsonResponse, makeTestHub, seedGroup, type TestHub } from './helpers';
import { startHubServer, type HubServer } from './httpHelpers';

const OWNER = { token: 'token-owner_uid' };

describe('owner admin API', () => {
  let hub: TestHub;
  let server: HubServer;
  const prevOwner = process.env.OWNER_USER_ID;

  beforeEach(async () => {
    process.env.OWNER_USER_ID = 'owner_uid';
    hub = makeTestHub();
    await seedGroup(hub, GROUP, { name: 'Alpha' });
    await seedGroup(hub, GROUP_B, { name: 'Beta' });
    server = await startHubServer(hub);
  });
  afterEach(async () => {
    await server.close();
    process.env.OWNER_USER_ID = prevOwner;
  });

  it('creates a Grok agent with an encrypted routine key and a one-time API key', async () => {
    const res = await server.call('POST', '/api/hub/admin/agents', { ...OWNER, body: { kind: 'grok_bot', name: 'Grok', routineUrl: 'https://grok.example/r/1', routineKey: 'rk-123', allowedGroupIds: [GROUP], dailySendLimit: 30 } });
    expect(res.status).toBe(201);
    expect(res.body.apiKey).toMatch(/^wpy_/);
    expect(res.body.agent).toMatchObject({ kind: 'grok_bot', name: 'Grok', hasRoutineKey: true, apiKeyPrefix: res.body.apiKey.slice(0, 10), dailySendLimit: 30 });
    expect(JSON.stringify(res.body.agent)).not.toContain('rk-123');
    const stored = hub.store.dump('agents')[res.body.agent.id];
    expect(decryptSecret(String(stored['routineKeyEnc']), 'test-encryption-key')).toBe('rk-123');
    expect(stored['apiKeyHash']).toBe(hashApiKey(res.body.apiKey));
    const list = await server.call('GET', '/api/hub/admin/agents', OWNER);
    expect(list.body.agents).toHaveLength(1);
    expect(JSON.stringify(list.body)).not.toMatch(/routineKeyEnc|apiKeyHash/);
  });

  it('validates agent input (https routine URL, owned groups)', async () => {
    expect((await server.call('POST', '/api/hub/admin/agents', { ...OWNER, body: { kind: 'grok_bot', name: 'G', routineUrl: 'http://x', allowedGroupIds: [] } })).status).toBe(400);
    expect((await server.call('POST', '/api/hub/admin/agents', { ...OWNER, body: { kind: 'grok_bot', name: 'G', allowedGroupIds: ['Cnotmine'] } })).status).toBe(400);
  });

  it('creates an Instinct login account and can reset its password and disable it', async () => {
    const res = await server.call('POST', '/api/hub/admin/agents', { ...OWNER, body: { kind: 'instinct', name: 'Instinct', email: 'instinct@example.com', allowedGroupIds: [GROUP, GROUP_B], inboxAlertHours: 12 } });
    expect(res.status).toBe(201);
    expect(res.body.password).toHaveLength(20);
    const uid = res.body.agent.accountUid;
    expect(hub.authAdmin.users[uid]).toMatchObject({ email: 'instinct@example.com', password: res.body.password });
    expect(hub.store.dump('hubAccounts')[uid]).toMatchObject({ role: 'agent', agentId: res.body.agent.id, disabled: false });

    const me = await server.call('GET', '/api/hub/me', { token: `token-${uid}` });
    expect(me.body).toMatchObject({ role: 'agent', agentName: 'Instinct' });

    const reset = await server.call('POST', `/api/hub/admin/agents/${res.body.agent.id}/reset-password`, OWNER);
    expect(hub.authAdmin.users[uid].password).toBe(reset.body.password);

    await server.call('PATCH', `/api/hub/admin/agents/${res.body.agent.id}`, { ...OWNER, body: { enabled: false } });
    expect(hub.authAdmin.users[uid].disabled).toBe(true);
    expect(hub.store.dump('hubAccounts')[uid]['disabled']).toBe(true);
    expect((await server.call('GET', '/api/hub/me', { token: `token-${uid}` })).status).toBe(403);
  });

  it('rotates Grok API keys and tests the routine webhook', async () => {
    const created = await server.call('POST', '/api/hub/admin/agents', { ...OWNER, body: { kind: 'grok_bot', name: 'Grok', routineUrl: 'https://grok.example/r/1', routineKey: 'rk', allowedGroupIds: [GROUP] } });
    const id = created.body.agent.id;
    const rotated = await server.call('POST', `/api/hub/admin/agents/${id}/api-key`, OWNER);
    expect(rotated.body.apiKey).not.toBe(created.body.apiKey);
    expect((await server.call('GET', '/api/hub/v1/groups', { token: created.body.apiKey })).status).toBe(401);
    expect((await server.call('GET', '/api/hub/v1/groups', { token: rotated.body.apiKey })).status).toBe(200);

    hub.fetchMock.mockResolvedValueOnce(jsonResponse(200, {}));
    const test = await server.call('POST', `/api/hub/admin/agents/${id}/test`, OWNER);
    expect(test.body).toEqual({ ok: true, status: 200, detail: null });
    expect(JSON.parse(hub.fetchMock.mock.calls[0][1].body)).toMatchObject({ kind: 'wippy.test' });
    hub.fetchMock.mockResolvedValueOnce(jsonResponse(401, 'nope'));
    expect((await server.call('POST', `/api/hub/admin/agents/${id}/test`, OWNER)).body).toMatchObject({ ok: false, status: 401 });
  });

  it('manages rules with validation and checks the agent exists', async () => {
    const agent = await server.call('POST', '/api/hub/admin/agents', { ...OWNER, body: { kind: 'grok_bot', name: 'Grok', allowedGroupIds: [GROUP] } });
    const rule = { name: '緊急', agentId: agent.body.agent.id, groupIds: [GROUP], trigger: { type: 'keyword', keywords: ['緊急'] }, instruction: '判斷', cooldownMinutes: 5 };
    expect((await server.call('POST', '/api/hub/admin/rules', { ...OWNER, body: { ...rule, agentId: 'missing' } })).status).toBe(400);
    const created = await server.call('POST', '/api/hub/admin/rules', { ...OWNER, body: rule });
    expect(created.status).toBe(201);
    const id = created.body.rule.id;
    expect((await server.call('PUT', `/api/hub/admin/rules/${id}`, { ...OWNER, body: { ...rule, enabled: false } })).body.rule.enabled).toBe(false);
    expect((await server.call('GET', '/api/hub/admin/rules', OWNER)).body.rules).toHaveLength(1);
    expect((await server.call('DELETE', `/api/hub/admin/rules/${id}`, OWNER)).status).toBe(204);
    expect((await server.call('GET', '/api/hub/admin/rules', OWNER)).body.rules).toHaveLength(0);
  });

  it('reads and validates settings', async () => {
    expect((await server.call('GET', '/api/hub/admin/settings', OWNER)).body.settings).toMatchObject({ quotaWarnPercents: [70, 90], quotaReservePercent: 5, retentionDays: 180 });
    expect((await server.call('PUT', '/api/hub/admin/settings', { ...OWNER, body: { alertGroupId: 'Cnotmine' } })).status).toBe(400);
    expect((await server.call('PUT', '/api/hub/admin/settings', { ...OWNER, body: { quotaReservePercent: 90 } })).status).toBe(400);
    const saved = await server.call('PUT', '/api/hub/admin/settings', { ...OWNER, body: { alertGroupId: GROUP, quotaWarnPercents: [90, 50], llm: { maxRpd: 200 } } });
    expect(saved.body.settings).toMatchObject({ alertGroupId: GROUP, quotaWarnPercents: [50, 90], llm: { maxRpd: 200, maxRpm: 10 } });
  });

  it('shows a dashboard and activity logs, and retries failed work', async () => {
    hub.line.consumption = 40;
    await hub.store.set('agentDispatches', 'd1', { ownerId: 'owner_1', status: 'failed', ruleName: 'r', agentId: 'grok_1', groupId: GROUP, createdAt: hub.now(), attempts: 8, lastError: 'down' });
    await hub.store.set('hubActions', 'a1', { ownerId: 'owner_1', status: 'failed', code: 'retries_exhausted', type: 'send_message', createdAt: hub.now(), actorKey: 'grok_1' });
    await hub.store.set('mediaAssets', 'm1', { ownerId: 'owner_1', status: 'failed', groupId: GROUP, lineMessageId: 'm1', createdAt: hub.now() });
    await hub.store.set('hubAlerts', 'al1', { ownerId: 'owner_1', severity: 'warning', text: 'x', createdAt: hub.now(), delivered: false });

    const dash = await server.call('GET', '/api/hub/admin/dashboard', OWNER);
    expect(dash.body).toMatchObject({ quota: { used: 40, limit: 200 }, llm: { today: 0 }, failed: { dispatches: 1, actions: 1, media: 1 }, recentAlerts: [expect.objectContaining({ id: 'al1' })] });

    expect((await server.call('GET', '/api/hub/admin/dispatches?status=failed', OWNER)).body.items.map((d: any) => d.id)).toEqual(['d1']);
    expect((await server.call('GET', '/api/hub/admin/actions', OWNER)).body.items.map((d: any) => d.id)).toEqual(['a1']);

    expect((await server.call('POST', '/api/hub/admin/dispatches/d1/retry', OWNER)).status).toBe(202);
    expect(hub.store.dump('agentDispatches')['d1']).toMatchObject({ status: 'queued', attempts: 0 });
    expect((await server.call('POST', '/api/hub/admin/actions/a1/retry', OWNER)).status).toBe(202);
    expect(hub.store.dump('hubActions')['a1']['status']).toBe('retrying');
    expect((await server.call('POST', '/api/hub/admin/media/m1/retry', OWNER)).status).toBe(202);
    expect(hub.store.dump('mediaAssets')['m1']['status']).toBe('pending');
    expect(hub.queue.jobs.map((j) => j.job.type)).toEqual(['dispatch', 'action_execute', 'media_download']);
    expect((await server.call('POST', '/api/hub/admin/dispatches/d1/retry', OWNER)).status).toBe(409);
  });
});
