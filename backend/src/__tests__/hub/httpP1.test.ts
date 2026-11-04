import { GROUP, makeTestHub, seedGroup, type TestHub } from './helpers';
import { startHubServer, type HubServer } from './httpHelpers';

describe('hub HTTP: auth, me, group access, internal jobs', () => {
  let hub: TestHub;
  let server: HubServer;
  const prevOwner = process.env.OWNER_USER_ID;
  const prevSecret = process.env.INTERNAL_HARNESS_SECRET;

  beforeEach(async () => {
    process.env.OWNER_USER_ID = 'owner_uid';
    process.env.INTERNAL_HARNESS_SECRET = 'job-secret';
    hub = makeTestHub();
    await seedGroup(hub, GROUP, { agentEnabled: false });
    await hub.store.set('agents', 'instinct_1', { ownerId: hub.ownerId, name: 'Instinct', kind: 'instinct', enabled: true });
    await hub.store.set('hubAccounts', 'instinct_uid', { role: 'agent', ownerId: hub.ownerId, agentId: 'instinct_1', disabled: false });
    server = await startHubServer(hub);
  });

  afterEach(async () => {
    await server.close();
    process.env.OWNER_USER_ID = prevOwner;
    process.env.INTERNAL_HARNESS_SECRET = prevSecret;
  });

  it('requires a token and rejects unknown Firebase users (no public sign-up)', async () => {
    expect((await server.call('GET', '/api/hub/me')).status).toBe(401);
    expect((await server.call('GET', '/api/hub/me', { token: 'garbage' })).status).toBe(401);
    const stranger = await server.call('GET', '/api/hub/me', { token: 'token-stranger' });
    expect(stranger.status).toBe(403);
    expect(stranger.body.code).toBe('account_not_allowed');
  });

  it('reports the role of owner and agent accounts', async () => {
    expect((await server.call('GET', '/api/hub/me', { token: 'token-owner_uid' })).body).toEqual({ role: 'owner', agentId: null, agentName: null, ownerConfigured: true });
    expect((await server.call('GET', '/api/hub/me', { token: 'token-instinct_uid' })).body).toEqual({ role: 'agent', agentId: 'instinct_1', agentName: 'Instinct', ownerConfigured: true });
  });

  it('lets only the owner toggle group agent access', async () => {
    const denied = await server.call('PATCH', `/api/hub/admin/groups/${GROUP}/agent-access`, { token: 'token-instinct_uid', body: { enabled: true } });
    expect(denied.status).toBe(403);
    const bad = await server.call('PATCH', `/api/hub/admin/groups/${GROUP}/agent-access`, { token: 'token-owner_uid', body: { enabled: 'yes' } });
    expect(bad.status).toBe(400);
    const ok = await server.call('PATCH', `/api/hub/admin/groups/${GROUP}/agent-access`, { token: 'token-owner_uid', body: { enabled: true } });
    expect(ok.status).toBe(200);
    expect(ok.body.group).toMatchObject({ groupId: GROUP, agentEnabled: true });
    expect((await server.call('PATCH', '/api/hub/admin/groups/Cmissing/agent-access', { token: 'token-owner_uid', body: { enabled: true } })).status).toBe(404);
    const list = await server.call('GET', '/api/hub/admin/groups', { token: 'token-owner_uid' });
    expect(list.body.groups[0]).toMatchObject({ groupId: GROUP, agentEnabled: true });
  });

  it('runs internal jobs only with the job secret', async () => {
    await hub.store.set('mediaAssets', 'm1', { ownerId: hub.ownerId, groupId: GROUP, lineMessageId: 'm1', messageType: 'image', status: 'pending', attempts: 0 });
    hub.line.contents['m1'] = { data: Buffer.from('x'), contentType: 'image/jpeg' };
    const job = { type: 'media_download', id: 'm1', attempt: 1, payload: { mediaAssetId: 'm1' } };
    expect((await server.call('POST', '/api/internal/hub/jobs', { body: job })).status).toBe(401);
    expect((await server.call('POST', '/api/internal/hub/jobs', { body: { nope: 1 }, headers: { 'X-Hub-Job-Secret': 'job-secret' } })).status).toBe(400);
    const res = await server.call('POST', '/api/internal/hub/jobs', { body: job, headers: { 'X-Hub-Job-Secret': 'job-secret' } });
    expect(res.body).toEqual({ ok: true, outcome: 'done' });
    expect(hub.store.dump('mediaAssets')['m1']['status']).toBe('ready');
  });
});
