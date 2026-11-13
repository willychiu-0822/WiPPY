import { GROUP, makeTestHub, seedGroup, type TestHub } from './helpers';
import { startHubServer, type HubServer } from './httpHelpers';
import { setIdTokenVerifier } from '../../hub/http/auth';

describe('hub HTTP: auth, me, group access, internal jobs', () => {
  let hub: TestHub;
  let server: HubServer;
  const prevOwner = process.env.OWNER_USER_ID;
  const prevNodeEnv = process.env.NODE_ENV;
  const prevService = process.env.K_SERVICE;
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
    if (prevNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prevNodeEnv;
    if (prevService === undefined) delete process.env.K_SERVICE; else process.env.K_SERVICE = prevService;
    jest.restoreAllMocks();
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

  it('PR42-UAT-08 distinguishes a Firebase-disabled account from an invalid token', async () => {
    setIdTokenVerifier(async () => { throw Object.assign(new Error('disabled'), { code: 'auth/user-disabled' }); });
    expect(await server.call('GET', '/api/hub/me', { token: 'previously-valid-token' }))
      .toMatchObject({ status: 403, body: { code: 'account_disabled', error: expect.stringContaining('停用') } });
    setIdTokenVerifier(async () => { throw Object.assign(new Error('expired'), { code: 'auth/id-token-expired' }); });
    expect(await server.call('GET', '/api/hub/me', { token: 'expired-token' }))
      .toMatchObject({ status: 401, body: { code: 'invalid_token' } });
  });

  it('PR42-UAT-08 tells an already signed-in Instinct that the owner disabled it', async () => {
    await hub.store.update('agents', 'instinct_1', { enabled: false });
    expect(await server.call('GET', '/api/hub/me', { token: 'token-instinct_uid' }))
      .toMatchObject({ status: 403, body: { code: 'agent_disabled', error: expect.stringContaining('停用') } });
    await hub.store.update('agents', 'instinct_1', { enabled: true });
    await hub.store.update('hubAccounts', 'instinct_uid', { disabled: true });
    expect(await server.call('GET', '/api/hub/me', { token: 'token-instinct_uid' }))
      .toMatchObject({ status: 403, body: { code: 'agent_disabled' } });
    await hub.store.update('hubAccounts', 'instinct_uid', { ownerId: 'foreign' });
    expect(await server.call('GET', '/api/hub/me', { token: 'token-instinct_uid' }))
      .toMatchObject({ status: 403, body: { code: 'account_not_allowed' } });
  });

  it.each([undefined, '', 'instinct_uid', 'owner_uid'])('keeps Instinct an agent with OWNER_USER_ID=%s', async (owner) => {
    delete process.env.K_SERVICE;
    process.env.NODE_ENV = 'test';
    if (owner === undefined) delete process.env.OWNER_USER_ID; else process.env.OWNER_USER_ID = owner;
    const me = await server.call('GET', '/api/hub/me', { token: 'token-instinct_uid' });
    expect(me).toMatchObject({ status: 200, body: { role: 'agent', agentId: 'instinct_1' } });
  });

  it.each(['production', 'cloud-run'])('fails closed on all hub routes without owner (%s)', async (mode) => {
    delete process.env.OWNER_USER_ID;
    delete process.env.K_SERVICE;
    process.env.NODE_ENV = mode === 'production' ? 'production' : 'test';
    if (mode === 'cloud-run') process.env.K_SERVICE = 'wippy';
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    for (const path of ['/api/hub/me', '/api/hub/admin/agents', '/api/hub/v1/groups', '/api/hub/mcp', '/api/hub/unknown']) {
      expect(await server.call('GET', path, { token: 'token-owner_uid' }))
        .toMatchObject({ status: 503, body: { code: 'owner_not_configured' } });
    }
    expect(warning.mock.calls.some(([line]) => JSON.parse(line).event === 'owner_not_configured')).toBe(true);
    process.env.OWNER_USER_ID = '  ';
    expect((await server.call('GET', '/api/hub/me')).status).toBe(503);
    process.env.OWNER_USER_ID = 'owner_uid';
    expect((await server.call('GET', '/api/hub/me', { token: 'token-instinct_uid' })).body.role).toBe('agent');
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
