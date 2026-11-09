import '../../hub/register';
import { generateApiKey, hashApiKey } from '../../hub/core/crypto';
import { GROUP, GROUP_B, makeTestHub, seedGrokAgent, seedGroup, seedInstinctAgent, seedMessage, type TestHub } from './helpers';
import { startHubServer, type HubServer } from './httpHelpers';

describe('agent REST API and MCP server', () => {
  let hub: TestHub;
  let server: HubServer;
  let apiKey: string;
  const prevOwner = process.env.OWNER_USER_ID;

  beforeEach(async () => {
    process.env.OWNER_USER_ID = 'owner_uid';
    hub = makeTestHub();
    await seedGroup(hub, GROUP, { name: 'Alpha' });
    await seedGroup(hub, GROUP_B, { name: 'Beta' });
    apiKey = generateApiKey();
    await seedGrokAgent(hub, { apiKeyHash: hashApiKey(apiKey), allowedGroupIds: [GROUP] });
    await seedInstinctAgent(hub);
    await seedMessage(hub, { id: 'm1', text: '退款怎麼辦' });
    server = await startHubServer(hub);
  });

  afterEach(async () => {
    await server.close();
    process.env.OWNER_USER_ID = prevOwner;
  });

  it.each(['/api/hub/v1/groups', '/api/hub/mcp'])('distinguishes disabled agents from invalid keys at %s', async (path) => {
    await hub.store.update('agents', 'grok_1', { enabled: false });
    const disabled = await server.call('GET', path, { token: apiKey });
    expect(disabled).toMatchObject({ status: 403, body: { code: 'agent_disabled' } });
    expect(disabled.body.error).toMatch(/[\u4e00-\u9fff]/);
    expect(await server.call('GET', path, { token: generateApiKey() }))
      .toMatchObject({ status: 401, body: { code: 'invalid_api_key' } });
    await hub.store.update('agents', 'grok_1', { ownerId: 'other-owner' });
    expect((await server.call('GET', path, { token: apiKey })).status).toBe(401);
  });

  describe('REST', () => {
    it('authenticates Grok by API key (Bearer or x-api-key) and rejects bad keys', async () => {
      expect((await server.call('GET', '/api/hub/v1/groups', { token: generateApiKey() })).status).toBe(401);
      const res = await server.call('GET', '/api/hub/v1/groups', { token: apiKey });
      expect(res.body.groups.map((g: any) => g.groupId)).toEqual([GROUP]);
      expect((await server.call('GET', '/api/hub/v1/groups', { headers: { 'x-api-key': apiKey } })).status).toBe(200);
    });

    it('reads messages and search results, and denies other groups with 403', async () => {
      expect((await server.call('GET', `/api/hub/v1/groups/${GROUP}/messages?limit=10`, { token: apiKey })).body.messages[0]).toMatchObject({ id: 'm1', text: '退款怎麼辦' });
      expect((await server.call('GET', '/api/hub/v1/messages/search?q=退款', { token: apiKey })).body.messages).toHaveLength(1);
      const denied = await server.call('GET', `/api/hub/v1/groups/${GROUP_B}/messages`, { token: apiKey });
      expect(denied).toMatchObject({ status: 403, body: { code: 'group_not_allowed' } });
      expect((await server.call('GET', `/api/hub/v1/groups/${GROUP}/messages?since=not-a-date`, { token: apiKey })).status).toBe(400);
    });

    it('executes actions with idempotency and maps results to HTTP codes', async () => {
      const send = await server.call('POST', '/api/hub/v1/actions', { token: apiKey, body: { type: 'send_message', idempotencyKey: 'k1', params: { groupId: GROUP, text: '收到' } } });
      expect(send).toMatchObject({ status: 200, body: { status: 'done', actionId: 'grok_1_k1' } });
      expect((await server.call('GET', '/api/hub/v1/actions/grok_1_k1', { token: apiKey })).body).toMatchObject({ status: 'done' });
      expect((await server.call('POST', '/api/hub/v1/actions', { token: apiKey, body: { type: 'send_message', idempotencyKey: 'k2', params: {} } })).status).toBe(400);
      const blocked = await server.call('POST', '/api/hub/v1/actions', { token: apiKey, body: { type: 'send_message', idempotencyKey: 'k3', params: { groupId: GROUP_B, text: 'x' } } });
      expect(blocked).toMatchObject({ status: 200, body: { status: 'blocked', code: 'group_not_allowed' } });
    });

    it('completes dispatches through the callback URL', async () => {
      await hub.store.set('agentDispatches', 'd1', { ownerId: 'owner_1', agentId: 'grok_1', status: 'sent', groupId: GROUP });
      const res = await server.call('POST', '/api/hub/v1/dispatches/d1/complete', { token: apiKey, body: { summary: 'ok' } });
      expect(res.body).toMatchObject({ status: 'done' });
      expect(hub.store.dump('agentDispatches')['d1']).toMatchObject({ status: 'completed', summary: 'ok' });
    });

    it('lets the Instinct account use the same API through its login session', async () => {
      const res = await server.call('GET', '/api/hub/v1/inbox', { token: 'token-instinct_uid' });
      expect(res).toMatchObject({ status: 200, body: { items: [] } });
      expect((await server.call('GET', '/api/hub/admin/groups', { token: 'token-instinct_uid' })).status).toBe(403);
    });
  });

  describe('MCP', () => {
    const rpc = (body: unknown, token?: string) => server.call('POST', '/api/hub/mcp', { token, body, headers: { Accept: 'application/json, text/event-stream' } });

    it('performs the initialize handshake and acknowledges notifications', async () => {
      const init = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'grok', version: '1' } } }, apiKey);
      expect(init.body.result).toMatchObject({ protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'wippy-agent-hub' } });
      expect((await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, apiKey)).status).toBe(202);
      expect((await rpc({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '1999-01-01' } }, apiKey)).body.result.protocolVersion).toBe('2025-06-18');
    });

    it('requires authentication', async () => {
      expect((await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' })).status).toBe(401);
    });

    it('lists read and action tools with JSON schemas (actions require idempotencyKey)', async () => {
      const res = await rpc({ jsonrpc: '2.0', id: 3, method: 'tools/list' }, apiKey);
      const tools = res.body.result.tools as Array<{ name: string; inputSchema: any }>;
      const names = tools.map((t) => t.name);
      expect(names).toEqual(expect.arrayContaining(['list_groups', 'get_messages', 'get_dispatch', 'send_message', 'send_link', 'record', 'schedule_message', 'complete_dispatch']));
      const sendLink = tools.find((t) => t.name === 'send_link')!;
      expect(sendLink.inputSchema.required).toEqual(expect.arrayContaining(['idempotencyKey', 'groupId', 'url', 'title']));
    });

    it('calls tools and flags rejected actions as errors', async () => {
      const groups = await rpc({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'list_groups', arguments: {} } }, apiKey);
      expect(groups.body.result.isError).toBe(false);
      expect(JSON.parse(groups.body.result.content[0].text).groups[0].groupId).toBe(GROUP);

      const sent = await rpc({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'send_message', arguments: { idempotencyKey: 'mcp-1', groupId: GROUP, text: 'hi' } } }, apiKey);
      expect(sent.body.result).toMatchObject({ isError: false, structuredContent: { status: 'done' } });
      expect(hub.line.pushes).toHaveLength(1);

      const rejected = await rpc({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'send_message', arguments: { idempotencyKey: 'mcp-2', groupId: GROUP_B, text: 'hi' } } }, apiKey);
      expect(rejected.body.result).toMatchObject({ isError: true, structuredContent: { code: 'group_not_allowed' } });

      const denied = await rpc({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'get_messages', arguments: { groupId: GROUP_B } } }, apiKey);
      expect(denied.body.result.isError).toBe(true);
      expect(denied.body.result.content[0].text).toContain('group_not_allowed');
    });

    it('supports batches, unknown methods and rejects GET streams', async () => {
      const batch = await rpc([{ jsonrpc: '2.0', id: 1, method: 'ping' }, { jsonrpc: '2.0', id: 2, method: 'nope' }], apiKey);
      expect(batch.body).toEqual([{ jsonrpc: '2.0', id: 1, result: {} }, { jsonrpc: '2.0', id: 2, error: { code: -32601, message: 'Method not found: nope' } }]);
      expect((await server.call('GET', '/api/hub/mcp', { token: apiKey })).status).toBe(405);
    });
  });
});
