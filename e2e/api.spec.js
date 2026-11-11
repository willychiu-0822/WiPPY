const { test } = require('@playwright/test');
const h = require('./helpers.cjs');
const { expect } = h;
let f, a;
test.beforeEach(async () => { f = await h.setup(); await h.openGroup(f); a = await h.create(f); });
test.afterEach(async ({ page }, info) => {
  await h.login(page); await page.goto('/hub/agents');
  await expect(page.getByRole('button', { name: `停用 ${a.agent.name}`, exact: true })).toBeVisible();
  await h.shot(page, info, info.title.match(/UAT-\d+/)[0]);
});
test('UAT-24 Whitespace-only names are rejected without creating an agent', async () => {
  const before = (await h.api(f.owner, '/api/hub/admin/agents')).body.agents;
  const invalid = await h.api(f.owner, '/api/hub/admin/agents', 'POST', { kind: 'grok_bot', name: '   ', allowedGroupIds: [], dailySendLimit: 5 });
  expect(invalid.status).toBe(400);
  expect((await h.api(f.owner, '/api/hub/admin/agents')).body.agents).toEqual(before);
  const valid = await h.create(f);
  expect((await h.api(valid.apiKey, '/api/hub/me')).status).toBe(200);
});
test('UAT-23 Wrong Routine key can be corrected and omitted in later settings', async () => {
  const url = `/api/hub/admin/agents/${a.agent.id}`;
  const before = (await h.events()).routines.length;
  expect((await h.api(f.owner, url, 'PATCH', { routineUrl: 'https://routine.example.invalid/uat', routineKey: 'emulator-only-wrong-routine' })).status).toBe(200);
  expect((await h.api(f.owner, `${url}/test`, 'POST', {})).body).toMatchObject({ ok: false, status: 401 });
  expect((await h.events()).routines).toHaveLength(before);
  expect((await h.api(f.owner, url, 'PATCH', { routineKey: 'emulator-only-routine' })).status).toBe(200);
  expect((await h.api(f.owner, `${url}/test`, 'POST', {})).body.ok).toBe(true);
  expect((await h.api(f.owner, url, 'PATCH', { dailySendLimit: 4 })).status).toBe(200);
  expect((await h.api(f.owner, `${url}/test`, 'POST', {})).body.ok).toBe(true);
  expect((await h.events()).routines).toHaveLength(before + 2);
});
test('UAT-22 Invalid limits are rejected without changing an agent', async () => {
  const r = await h.api(f.owner, '/api/hub/admin/agents', 'POST', { kind: 'grok_bot', name: 'invalid', allowedGroupIds: [], dailySendLimit: -1 });
  expect(r.status).toBe(400);
  expect((await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}`, 'PATCH', { dailySendLimit: 1001 })).status).toBe(400);
  expect((await h.api(f.owner, '/api/hub/admin/agents')).body.agents.find(x => x.id === a.agent.id).dailySendLimit).toBe(5);
});
test('UAT-21 Group access can be assigned after creation', async () => {
  const created = await h.api(f.owner, '/api/hub/admin/agents', 'POST', {
    kind: 'grok_bot', name: `empty-${f.tag}`, allowedGroupIds: [], dailySendLimit: 5,
  });
  expect(created.status).toBe(201);
  const { apiKey, agent } = created.body;
  expect((await h.api(apiKey, '/api/hub/v1/groups')).body.groups).toEqual([]);
  expect((await h.api(apiKey, `/api/hub/v1/groups/${f.groups[0]}/messages`)).status).toBe(403);
  expect((await h.api(f.owner, `/api/hub/admin/agents/${agent.id}`, 'PATCH', { allowedGroupIds: [f.groups[0]] })).status).toBe(200);
  expect((await h.api(apiKey, '/api/hub/v1/groups')).body.groups.map(g => g.groupId)).toEqual([f.groups[0]]);
  expect((await h.api(apiKey, `/api/hub/v1/groups/${f.groups[0]}/messages`)).status).toBe(200);
});
test('UAT-20 Incorrect Instinct password fails and the correct password still works', async () => {
  const i = await h.create(f, 'instinct');
  const wrong = await h.signIn(i.agent.accountEmail, 'incorrect-emulator-password');
  expect(wrong.status).toBe(400);
  expect(wrong.token).toBeUndefined();
  const valid = await h.signIn(i.agent.accountEmail, i.password);
  expect(valid.status).toBe(200);
  expect((await h.api(valid.token, '/api/hub/me')).body).toMatchObject({ role: 'agent', agentId: i.agent.id });
});
test('UAT-01 REST identity, group listing and MCP discovery', async () => {
  expect((await h.api(a.apiKey, '/api/hub/me')).body).toMatchObject({ role: 'agent', agentId: a.agent.id });
  const init = await h.mcp(a.apiKey, 'initialize', { protocolVersion: '2025-06-18' });
  expect(init.body.result.protocolVersion).toBe('2025-06-18');
  const tools = (await h.mcp(a.apiKey, 'tools/list')).body.result.tools;
  for (const name of ['list_groups', 'get_messages', 'record', 'send_message', 'complete_dispatch']) expect(tools.map(t => t.name)).toContain(name);
  expect((await h.api(a.apiKey, '/api/hub/v1/groups')).body.groups.map(g => g.groupId)).toEqual([f.groups[0]]);
});
test('UAT-02 Routine handshake, dispatch body and completion', async () => {
  const beforeTests = (await h.events()).routines.filter(r => r.kind === 'wippy.test').length;
  expect((await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}`, 'PATCH', { routineUrl: 'https://routine.example.invalid/uat', routineKey: 'emulator-only-wrong-routine' })).status).toBe(200);
  const wrong = await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}/test`, 'POST', {});
  expect(wrong.body).toMatchObject({ ok: false, status: 401 });
  expect((await h.events()).routines.filter(r => r.kind === 'wippy.test')).toHaveLength(beforeTests);
  expect((await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}`, 'PATCH', { routineUrl: 'https://routine.example.invalid/uat', routineKey: 'emulator-only-routine' })).status).toBe(200);
  expect((await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}/test`, 'POST', {})).body.ok).toBe(true);
  expect((await h.events()).routines.filter(r => r.kind === 'wippy.test')).toHaveLength(beforeTests + 1);
  const keyword = `API${f.tag}`; await h.rule(f, a.agent, keyword); await h.event(f, `${keyword} 活動`);
  let d; await expect.poll(async () => { d = (await h.events()).routines.find(d => d.rule?.name === `旅程-${keyword}`); return !!d; }).toBe(true);
  expect(d.callback.restUrl).toBe(`http://127.0.0.1:4142/api/hub/v1/dispatches/${d.jobId}/complete`);
  expect(d.messages[0].text).toBe(`${keyword} 活動`);
  expect((await h.api(a.apiKey, `/api/hub/v1/dispatches/${d.jobId}/complete`, 'POST', { summary: '完成' })).body.status).toBe('done');
  expect((await h.db.collection('agentDispatches').doc(d.jobId).get()).data().status).toBe('completed');
});
test('UAT-03 Idempotent sends, record reads, schedule persistence and quota accounting', async () => {
  await h.event(f, `活動${f.tag}`);
  expect((await h.api(a.apiKey, `/api/hub/v1/groups/${f.groups[0]}/messages`)).body.messages[0].text).toBe(`活動${f.tag}`);
  const key = h.randomUUID(); const p = { groupId: f.groups[0], text: '收到' };
  const first = await h.act(a.apiKey, 'send_message', p, key); expect(first.body.status).toBe('done');
  const replay = await h.act(a.apiKey, 'send_message', p, key); expect(replay.body.replayed).toBe(true); expect(replay.body.actionId).toBe(first.body.actionId);
  expect((await h.events()).pushes.filter(p => p.to === f.groups[0])).toHaveLength(1);
  expect((await h.api(a.apiKey, '/api/hub/v1/quota')).body.agentDailyRemaining).toBe(4);
  expect((await h.act(a.apiKey, 'record', { groupId: f.groups[0], category: '活動', title: '活動摘要', content: '收到' })).body.status).toBe('done');
  expect((await h.api(a.apiKey, `/api/hub/v1/records?groupId=${f.groups[0]}`)).body.records[0].title).toBe('活動摘要');
  const s = await h.act(a.apiKey, 'schedule_message', { groupId: f.groups[0], text: '明日提醒', sendAt: new Date(Date.now() + 86400000).toISOString() });
  expect(s.body.status).toBe('done');
  expect((await h.db.doc(`activities/${s.body.result.activityId}/activityMessages/${s.body.result.messageId}`).get()).data()).toMatchObject({ status: 'pending', reviewStatus: 'approved', content: '明日提醒' });
});
test('UAT-04 Disable blocks REST and MCP, enable preserves settings', async () => {
  await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}`, 'PATCH', { enabled: false });
  for (const r of [await h.api(a.apiKey, '/api/hub/me'), await h.mcp(a.apiKey, 'tools/list')]) {
    expect(r.status).toBe(403); expect(r.body.code).toBe('agent_disabled'); expect(r.body.error).toContain('停用');
  }
  const r = await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}`, 'PATCH', { enabled: true });
  expect(r.body.agent.allowedGroupIds).toEqual([f.groups[0]]); expect(r.body.agent.dailySendLimit).toBe(5);
  expect((await h.api(a.apiKey, '/api/hub/me')).status).toBe(200);
});
test('UAT-05 Unassigned and closed groups, exhausted limit and explicit empty permissions', async () => {
  await h.api(f.owner, `/api/hub/admin/groups/${f.groups[1]}/agent-access`, 'PATCH', { enabled: true });
  for (const id of [f.groups[1]]) {
    expect((await h.api(a.apiKey, `/api/hub/v1/groups/${id}/messages`)).status).toBe(403);
    expect((await h.act(a.apiKey, 'send_message', { groupId: id, text: 'no' })).body.code).toBe('group_not_allowed');
  }
  await h.openGroup(f, false);
  expect((await h.api(a.apiKey, '/api/hub/v1/groups')).body.groups).toHaveLength(0);
  expect((await h.act(a.apiKey, 'send_message', { groupId: f.groups[0], text: 'no' })).body.code).toBe('group_not_allowed');
  await h.openGroup(f);
  await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}`, 'PATCH', { dailySendLimit: 1 });
  expect((await h.act(a.apiKey, 'send_message', { groupId: f.groups[0], text: 'first' })).body.status).toBe('done');
  expect((await h.act(a.apiKey, 'send_message', { groupId: f.groups[0], text: 'second' })).body.code).toBe('agent_daily_limit');
  await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}`, 'PATCH', { allowedGroupIds: [], dailySendLimit: 0 });
  expect((await h.api(a.apiKey, '/api/hub/v1/groups')).body.groups).toHaveLength(0);
  expect((await h.events()).pushes.filter(p => p.to === f.groups[0])).toHaveLength(1);
});
test('UAT-06 Instinct uses Firebase token and cannot access owner APIs', async () => {
  const i = await h.create(f, 'instinct'); expect(i.apiKey).toBeUndefined();
  const token = (await h.signIn(i.agent.accountEmail, i.password)).token;
  expect((await h.api(token, '/api/hub/me')).body).toMatchObject({ role: 'agent', agentId: i.agent.id });
  expect((await h.api(token, '/api/hub/admin/settings')).status).toBe(403);
  expect((await h.api(token, '/api/hub/v1/groups')).body.groups.map(g => g.groupId)).toEqual([f.groups[0]]);
  expect((await h.act(token, 'send_message', { groupId: f.groups[1], text: 'no' })).body.code).toBe('group_not_allowed');
  await h.api(f.owner, `/api/hub/admin/agents/${i.agent.id}`, 'PATCH', { dailySendLimit: 0 });
  expect((await h.act(token, 'send_message', { groupId: f.groups[0], text: 'no' })).body.code).toBe('agent_daily_limit');
});
test('UAT-07 Instinct reads dispatch and completes inbox through REST', async () => {
  const i = await h.create(f, 'instinct'); const token = (await h.signIn(i.agent.accountEmail, i.password)).token;
  const keyword = `Inbox${f.tag}`; await h.rule(f, i.agent, keyword); await h.event(f, `${keyword} 活動`);
  let item; await expect.poll(async () => { item = (await h.api(token, '/api/hub/v1/inbox')).body.items[0]; return !!item; }).toBe(true);
  expect((await h.api(token, `/api/hub/v1/dispatches/${item.dispatchId}`)).body.messages[0].text).toBe(`${keyword} 活動`);
  expect((await h.act(token, 'send_message', { groupId: f.groups[0], text: 'Instinct 收到' })).body.status).toBe('done');
  expect((await h.api(token, `/api/hub/v1/inbox/${item.id}/complete`, 'POST', { note: '已確認活動' })).body.status).toBe('done');
  expect((await h.api(token, '/api/hub/v1/inbox')).body.items).toHaveLength(0);
  expect((await h.api(token, '/api/hub/v1/inbox?status=done')).body.items[0].note).toBe('已確認活動');
});
test('UAT-08 Key rotation, password reset and disabled existing tokens', async () => {
  const rotated = await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}/api-key`, 'POST', {});
  expect((await h.api(a.apiKey, '/api/hub/me')).status).toBe(401);
  expect((await h.api(rotated.body.apiKey, '/api/hub/me')).status).toBe(200);
  const i = await h.create(f, 'instinct');
  const reset = await h.api(f.owner, `/api/hub/admin/agents/${i.agent.id}/reset-password`, 'POST', {});
  expect((await h.signIn(i.agent.accountEmail, i.password)).status).toBe(400);
  const signedIn = await h.signIn(i.agent.accountEmail, reset.body.password);
  expect(signedIn.status).toBe(200); const token = signedIn.token;
  await h.api(f.owner, `/api/hub/admin/agents/${i.agent.id}`, 'PATCH', { enabled: false });
  const disabled = await h.api(token, '/api/hub/me');
  expect(disabled.status).toBe(403); expect(disabled.body.code).toBe('account_disabled'); expect(disabled.body.error).toContain('停用');
  expect((await h.signIn(i.agent.accountEmail, reset.body.password)).status).toBe(400);
  await h.api(f.owner, `/api/hub/admin/agents/${i.agent.id}`, 'PATCH', { enabled: true });
  expect((await h.signIn(i.agent.accountEmail, reset.body.password)).status).toBe(200);
});

test('UAT-11 Saved dispatch and inbox honor current group access for both agents', async () => {
  const i = await h.create(f, 'instinct');
  const token = (await h.signIn(i.agent.accountEmail, i.password)).token;
  await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}`, 'PATCH', { routineUrl: 'https://routine.example.invalid/uat', routineKey: 'emulator-only-routine' });
  for (const [agent, credential] of [[a, a.apiKey], [i, token]]) {
    const keyword = `Withdraw-${agent.agent.kind}-${f.tag}`;
    await h.rule(f, agent.agent, keyword); await h.event(f, `${keyword} 私密活動`);
    let dispatchId;
    await expect.poll(async () => {
      if (agent === i) dispatchId = (await h.api(token, '/api/hub/v1/inbox')).body.items[0]?.dispatchId;
      else dispatchId = (await h.events()).routines.find(d => d.rule?.name === `旅程-${keyword}`)?.jobId;
      return !!dispatchId;
    }).toBe(true);
    expect((await h.api(credential, `/api/hub/v1/dispatches/${dispatchId}`)).body.messages.at(-1).text).toBe(`${keyword} 私密活動`);
    for (const mode of ['closed', 'unassigned']) {
      if (mode === 'closed') await h.openGroup(f, false);
      else await h.api(f.owner, `/api/hub/admin/agents/${agent.agent.id}`, 'PATCH', { allowedGroupIds: [] });
      const denied = await h.api(credential, `/api/hub/v1/dispatches/${dispatchId}`);
      expect(denied.status).toBe(403); expect(denied.body.code).toBe('group_not_allowed');
      const deniedMcp = await h.mcp(credential, 'tools/call', { name: 'get_dispatch', arguments: { jobId: dispatchId } });
      expect(deniedMcp.body.result.isError).toBe(true); expect(deniedMcp.body.result.content[0].text).toContain('group_not_allowed');
      expect((await h.api(credential, '/api/hub/v1/inbox?status=all')).body.items).toHaveLength(0);
      expect((await h.api(f.owner, `/api/hub/v1/dispatches/${dispatchId}`)).status).toBe(200);
      if (mode === 'closed') await h.openGroup(f);
      else await h.api(f.owner, `/api/hub/admin/agents/${agent.agent.id}`, 'PATCH', { allowedGroupIds: [f.groups[0]] });
      expect((await h.api(credential, `/api/hub/v1/dispatches/${dispatchId}`)).status).toBe(200);
    }
    if (agent === i) expect((await h.api(token, '/api/hub/v1/inbox')).body.items).toHaveLength(1);
  }
});
test('UAT-09 Invalid inputs, no credentials and cross-agent isolation', async () => {
  expect((await h.api(null, '/api/hub/me')).body.code).toBe('unauthenticated');
  expect((await h.api('wpy_invalid', '/api/hub/me')).body.code).toBe('invalid_api_key');
  expect((await h.act(a.apiKey, 'send_message', { groupId: f.groups[0] })).status).toBe(400);
  expect((await h.act(a.apiKey, 'send_link', { groupId: f.groups[0], title: '連結', url: 'http://example.com' })).body.code).toBe('url_not_https');
  expect((await h.act(a.apiKey, 'schedule_message', { groupId: f.groups[0], text: 'past', sendAt: '2020-01-01T00:00:00Z' })).body.code).toBe('send_at_in_past');
  const unknown = await h.act(a.apiKey, 'draft_message', { groupId: f.groups[0], text: 'draft' });
  expect(unknown.status).toBe(400); expect(unknown.body.code).toBe('invalid_request');
  const i = await h.create(f, 'instinct'); await h.rule(f, i.agent, `private${f.tag}`); await h.event(f, `private${f.tag}`);
  const token = (await h.signIn(i.agent.accountEmail, i.password)).token;
  let item; await expect.poll(async () => { item = (await h.api(token, '/api/hub/v1/inbox')).body.items[0]; return !!item; }).toBe(true);
  expect((await h.api(a.apiKey, `/api/hub/v1/dispatches/${item.dispatchId}`)).status).toBe(404);
  expect((await h.act(a.apiKey, 'complete_inbox', { itemId: item.id })).body.status).toBe('blocked');
  expect((await h.events()).pushes.filter(p => p.to === f.groups[0])).toHaveLength(0);
});
test('UAT-10 Execute every documented curl example as Grok and Instinct', async () => {
  const { runGuideExamples } = require('./guide-examples.cjs');
  await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}`, 'PATCH', { routineUrl: 'https://routine.example.invalid/uat', routineKey: 'emulator-only-routine' });
  await h.rule(f, a.agent, `GuideGrok${f.tag}`); await h.event(f, `GuideGrok${f.tag} 活動`);
  let dispatch; await expect.poll(async () => { dispatch = (await h.events()).routines.find(d => d.rule?.name === `旅程-GuideGrok${f.tag}`); return !!dispatch; }).toBe(true);
  const i = await h.create(f, 'instinct');
  await h.rule(f, i.agent, `GuideInstinct${f.tag}`); await h.event(f, `GuideInstinct${f.tag} 活動`);
  let items;
  await expect.poll(async () => { items = await h.db.collection('agentInbox').where('agentId', '==', i.agent.id).get(); return items.size; }).toBe(1);
  const count = await runGuideExamples({
    API_BASE_URL: 'http://127.0.0.1:4142', YOUR_KEY: a.apiKey, GROUP_ID: f.groups[0], JOB_ID: dispatch.jobId,
    ITEM_ID: items.docs[0].id, FUTURE_ISO_TIME: new Date(Date.now() + 86400000).toISOString(),
    FIREBASE_WEB_API_KEY: 'emulator-only', INSTINCT_EMAIL: i.agent.accountEmail, INSTINCT_PASSWORD: i.password,
  }, ({ status, body, command, isLogin, index }) => {
    expect(status, `Guide curl ${index}`).toBe(200);
    if (isLogin) return;
    if (body.role) expect(body.role).toBe('agent');
    if (body.result) { expect(!!body.error).toBe(false); if ('isError' in body.result) expect(body.result.isError).toBe(false); }
    if (body.status) expect(body.status).toBe('done');
    if (command.includes('/groups\'')) expect(body.groups.map(g => g.groupId)).toEqual([f.groups[0]]);
    if (command.includes('/messages')) expect(body.messages.length).toBeGreaterThan(0);
  });
  expect(count).toBe(19);
  expect((await h.events()).pushes.filter(p => p.to === f.groups[0])).toHaveLength(1);
  expect((await h.db.collection('agentInbox').doc(items.docs[0].id).get()).data().status).toBe('done');
  expect((await h.db.collection('agentDispatches').doc(dispatch.jobId).get()).data().status).toBe('completed');
  const names = (await h.api(a.apiKey, '/api/hub/v1/tools')).body.tools.map(t => t.name);
  expect(names).not.toContain('draft_message'); expect(names).not.toContain('list_activities');
});
test('UAT-12 Reject invalid Routine URLs and duplicate Instinct accounts without partial agents', async () => {
  const invalid = await h.api(f.owner, '/api/hub/admin/agents', 'POST', {
    kind: 'grok_bot', name: 'Invalid Routine', routineUrl: 'http://routine.example.invalid/uat',
  });
  expect(invalid.status).toBe(400); expect(invalid.body.code).toBe('invalid_request'); expect(invalid.body.error).toContain('https://');
  expect((await h.api(f.owner, '/api/hub/admin/agents')).body.agents).toHaveLength(1);
  const i = await h.create(f, 'instinct');
  const duplicate = await h.api(f.owner, '/api/hub/admin/agents', 'POST', { kind: 'instinct', name: 'Duplicate Instinct', email: i.agent.accountEmail });
  expect(duplicate.status).toBe(409); expect(duplicate.body.code).toBe('account_create_failed'); expect(duplicate.body.error).toContain('無法建立登入帳號');
  expect((await h.api(f.owner, '/api/hub/admin/agents')).body.agents).toHaveLength(2);
  const signedIn = await h.signIn(i.agent.accountEmail, i.password);
  expect(signedIn.status).toBe(200); expect((await h.api(signedIn.token, '/api/hub/me')).body.agentId).toBe(i.agent.id);
});
test('UAT-13 Instinct identity and access do not require a browser profile document', async () => {
  const i = await h.create(f, 'instinct');
  expect((await h.db.collection('users').doc(i.agent.accountUid).get()).exists).toBe(false);
  const signedIn = await h.signIn(i.agent.accountEmail, i.password); expect(signedIn.status).toBe(200);
  expect((await h.api(signedIn.token, '/api/hub/me')).body).toMatchObject({ role: 'agent', agentId: i.agent.id });
  expect((await h.api(signedIn.token, '/api/hub/admin/agents')).status).toBe(403);
  expect((await h.api(signedIn.token, '/api/hub/v1/groups')).body.groups.map(g => g.groupId)).toEqual([f.groups[0]]);
});

test('UAT-14 Revoked groups cannot complete saved dispatches or inbox work', async () => {
  const i = await h.create(f, 'instinct');
  const token = (await h.signIn(i.agent.accountEmail, i.password)).token;
  await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}`, 'PATCH', { routineUrl: 'https://routine.example.invalid/uat', routineKey: 'emulator-only-routine' });
  for (const [agent, credential] of [[a, a.apiKey], [i, token]]) {
    const keyword = `Complete-${agent.agent.kind}-${f.tag}`;
    await h.rule(f, agent.agent, keyword); await h.event(f, keyword);
    let dispatchId, item;
    await expect.poll(async () => {
      if (agent === i) {
        item = (await h.api(token, '/api/hub/v1/inbox')).body.items[0]; dispatchId = item?.dispatchId;
      } else dispatchId = (await h.events()).routines.find(d => d.rule?.name === `旅程-${keyword}`)?.jobId;
      return !!dispatchId;
    }).toBe(true);
    const originalDispatch = (await h.db.collection('agentDispatches').doc(dispatchId).get()).data();
    const originalItem = item && (await h.db.collection('agentInbox').doc(item.id).get()).data();
    for (const mode of ['closed', 'unassigned']) {
      if (mode === 'closed') await h.openGroup(f, false);
      else await h.api(f.owner, `/api/hub/admin/agents/${agent.agent.id}`, 'PATCH', { allowedGroupIds: [] });
      const rest = await h.api(credential, `/api/hub/v1/dispatches/${dispatchId}/complete`, 'POST', { summary: 'must not persist', idempotencyKey: h.randomUUID() });
      expect(rest.body).toMatchObject({ status: 'blocked', code: 'group_not_allowed' });
      const mcp = await h.mcp(credential, 'tools/call', { name: 'complete_dispatch', arguments: { jobId: dispatchId, summary: 'must not persist', idempotencyKey: h.randomUUID() } });
      expect(mcp.body.result.isError).toBe(true);
      expect(mcp.body.result.structuredContent).toMatchObject({ status: 'blocked', code: 'group_not_allowed' });
      if (item) {
        const inbox = await h.api(credential, `/api/hub/v1/inbox/${item.id}/complete`, 'POST', { note: 'must not persist', idempotencyKey: h.randomUUID() });
        expect(inbox.body).toMatchObject({ status: 'blocked', code: 'group_not_allowed' });
        expect((await h.db.collection('agentInbox').doc(item.id).get()).data()).toEqual(originalItem);
      }
      expect((await h.db.collection('agentDispatches').doc(dispatchId).get()).data()).toEqual(originalDispatch);
      if (mode === 'closed') await h.openGroup(f);
      else await h.api(f.owner, `/api/hub/admin/agents/${agent.agent.id}`, 'PATCH', { allowedGroupIds: [f.groups[0]] });
    }
    const path = item ? `/api/hub/v1/inbox/${item.id}/complete` : `/api/hub/v1/dispatches/${dispatchId}/complete`;
    expect((await h.api(credential, path, 'POST', { summary: 'restored', note: 'restored', idempotencyKey: h.randomUUID() })).body.status).toBe('done');
    expect((await h.db.collection('agentDispatches').doc(dispatchId).get()).data().status).toBe('completed');
  }
  expect((await h.events()).pushes.filter(p => p.to === f.groups[0])).toHaveLength(0);
});

test('UAT-15 Existing Instinct token is blocked while disabled and recovers with permissions intact', async () => {
  const i = await h.create(f, 'instinct');
  const token = (await h.signIn(i.agent.accountEmail, i.password)).token;
  await h.api(f.owner, `/api/hub/admin/agents/${i.agent.id}`, 'PATCH', { enabled: false });
  for (const result of [await h.api(token, '/api/hub/me'), await h.mcp(token, 'tools/list')]) {
    expect(result.status).toBe(403); expect(result.body.code).toBe('account_disabled');
  }
  expect((await h.act(token, 'send_message', { groupId: f.groups[0], text: 'must not send' })).status).toBe(403);
  expect((await h.events()).pushes.filter(p => p.to === f.groups[0])).toHaveLength(0);
  const enabled = await h.api(f.owner, `/api/hub/admin/agents/${i.agent.id}`, 'PATCH', { enabled: true });
  expect(enabled.body.agent).toMatchObject({ allowedGroupIds: [f.groups[0]], dailySendLimit: 5 });
  expect((await h.api(token, '/api/hub/me')).body).toMatchObject({ role: 'agent', agentId: i.agent.id });
  expect((await h.api(token, '/api/hub/v1/quota')).body.agentDailyRemaining).toBe(5);
});

test('UAT-16 Completion endpoints separate their keys and accept a new key after recovery', async () => {
  const i = await h.create(f, 'instinct'); const token = (await h.signIn(i.agent.accountEmail, i.password)).token;
  const keyword = `Separate${f.tag}`; await h.rule(f, i.agent, keyword); await h.event(f, keyword);
  let item; await expect.poll(async () => { item = (await h.api(token, '/api/hub/v1/inbox')).body.items[0]; return !!item; }).toBe(true);
  const dispatchPath = `/api/hub/v1/dispatches/${item.dispatchId}/complete`;
  const inboxPath = `/api/hub/v1/inbox/${item.id}/complete`;
  const dispatch = await h.api(token, dispatchPath, 'POST', { summary: 'dispatch done' });
  expect(dispatch.body).toMatchObject({ type: 'complete_dispatch', status: 'done' });
  const inbox = await h.api(token, inboxPath, 'POST', { note: 'inbox done' });
  expect(inbox.body).toMatchObject({ type: 'complete_inbox', status: 'done' });
  expect(inbox.body.actionId).not.toBe(dispatch.body.actionId);
  expect((await h.db.collection('agentInbox').doc(item.id).get()).data()).toMatchObject({ status: 'done', note: 'inbox done' });
  expect((await h.api(token, inboxPath, 'POST', { note: 'must not overwrite' })).body).toMatchObject({ actionId: inbox.body.actionId, replayed: true });
  expect((await h.db.collection('agentInbox').doc(item.id).get()).data().note).toBe('inbox done');
  for (const path of [dispatchPath, inboxPath]) {
    await h.openGroup(f, false);
    const blockedKey = h.randomUUID();
    const denied = await h.api(token, path, 'POST', { idempotencyKey: blockedKey });
    expect(denied.body).toMatchObject({ status: 'blocked', code: 'group_not_allowed' });
    await h.openGroup(f);
    expect((await h.api(token, path, 'POST', { idempotencyKey: blockedKey })).body).toMatchObject({ actionId: denied.body.actionId, status: 'blocked', replayed: true });
    const recoveryKey = h.randomUUID();
    const restored = await h.api(token, path, 'POST', { idempotencyKey: recoveryKey, note: 'recovered' });
    expect(restored.body.status).toBe('done'); expect(restored.body.actionId).not.toBe(denied.body.actionId);
    expect((await h.api(token, path, 'POST', { idempotencyKey: recoveryKey })).body).toMatchObject({ actionId: restored.body.actionId, status: 'done', replayed: true });
    expect((await h.api(token, path, 'POST', { idempotencyKey: 'invalid/key' })).status).toBe(400);
  }
});

test('UAT-17 Inbox and dispatch provide the rule and group labels shown to a newcomer', async () => {
  const i = await h.create(f, 'instinct'); const token = (await h.signIn(i.agent.accountEmail, i.password)).token;
  const keyword = `Readable${f.tag}`; await h.rule(f, i.agent, keyword); await h.event(f, keyword);
  let item; await expect.poll(async () => { item = (await h.api(token, '/api/hub/v1/inbox')).body.items[0]; return !!item; }).toBe(true);
  expect(item).toMatchObject({ ruleName: `旅程-${keyword}`, groupName: `安裝測試 ${f.tag} 活動群組`, instruction: '請讀活動訊息並回覆收到，完成後寫一句摘要。' });
  const dispatch = await h.api(token, `/api/hub/v1/dispatches/${item.dispatchId}`);
  expect(dispatch.body.rule).toMatchObject({ name: item.ruleName, instruction: item.instruction });
  expect(dispatch.body.messages.at(-1).text).toBe(keyword);
});

test('UAT-18 Plaintext credentials are usable once issued and absent from later reads', async () => {
  const i = await h.create(f, 'instinct');
  const rotated = (await h.api(f.owner, `/api/hub/admin/agents/${a.agent.id}/api-key`, 'POST')).body;
  const reset = (await h.api(f.owner, `/api/hub/admin/agents/${i.agent.id}/reset-password`, 'POST')).body;
  expect((await h.api(a.apiKey, '/api/hub/me')).status).toBe(401);
  expect((await h.api(rotated.apiKey, '/api/hub/me')).body.agentId).toBe(a.agent.id);
  expect((await h.signIn(i.agent.accountEmail, i.password)).status).toBe(400);
  const signedIn = await h.signIn(i.agent.accountEmail, reset.password);
  expect(signedIn.status).toBe(200);
  expect((await h.api(signedIn.token, '/api/hub/me')).body.agentId).toBe(i.agent.id);
  const reads = [
    await h.api(f.owner, '/api/hub/admin/agents'),
    await h.api(rotated.apiKey, '/api/hub/me'),
    await h.api(signedIn.token, '/api/hub/me'),
  ];
  for (const result of reads) {
    expect(result.status).toBe(200);
    const body = JSON.stringify(result.body);
    for (const credential of [a.apiKey, i.password, rotated.apiKey, reset.password]) expect(body.includes(credential), 'read API must not return any plaintext credential').toBe(false);
  }
});

test('UAT-19 Failed requests leave Instinct work intact and valid retries recover', async () => {
  const i = await h.create(f, 'instinct'); const keyword = `Retry${f.tag}`;
  const token = (await h.signIn(i.agent.accountEmail, i.password)).token;
  await h.rule(f, i.agent, keyword); await h.event(f, keyword);
  let item; await expect.poll(async () => { item = (await h.api(token, '/api/hub/v1/inbox')).body.items[0]; return !!item; }).toBe(true);
  const original = (await h.db.collection('agentInbox').doc(item.id).get()).data();
  expect((await h.api(null, `/api/hub/v1/inbox/${item.id}/complete`, 'POST', { note: 'rejected' })).status).toBe(401);
  expect((await h.api(null, `/api/hub/v1/messages/search?q=${keyword}`)).status).toBe(401);
  await h.api(f.owner, `/api/hub/admin/agents/${i.agent.id}`, 'PATCH', { enabled: false });
  expect((await h.api(token, `/api/hub/v1/inbox/${item.id}/complete`, 'POST', { note: 'rejected' })).status).toBe(403);
  expect((await h.api(token, `/api/hub/v1/messages/search?q=${keyword}`)).status).toBe(403);
  expect((await h.db.collection('agentInbox').doc(item.id).get()).data()).toEqual(original);
  await h.api(f.owner, `/api/hub/admin/agents/${i.agent.id}`, 'PATCH', { enabled: true });
  const done = await h.api(token, `/api/hub/v1/inbox/${item.id}/complete`, 'POST', { note: 'recovered', idempotencyKey: h.randomUUID() });
  expect(done.body.status).toBe('done');
  expect((await h.api(token, '/api/hub/v1/inbox?status=done')).body.items[0].note).toBe('recovered');
  expect((await h.api(token, `/api/hub/v1/messages/search?q=${keyword}`)).body.messages.at(-1).text).toBe(keyword);
  expect((await h.events()).pushes.filter(p => p.to === f.groups[0])).toHaveLength(0);
});
