const { test } = require('@playwright/test');
const h = require('./helpers.cjs');
const { expect } = h;
let f;
test.beforeEach(async ({ page }) => { f = await h.setup(); await h.login(page); });
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) await h.shot(page, info, info.title.match(/UAT-\d+/)[0]);
});
async function agents(page) { await page.goto('/hub/agents'); await expect(page.getByRole('heading', { name: '新增 Agent', exact: true })).toBeVisible(); }
async function grok(page) { await h.openGroup(f); const a = await h.create(f); await agents(page); return a; }
function row(page, a) { return page.getByRole('listitem').filter({ has: page.getByRole('button', { name: `停用 ${a.agent.name}`, exact: true }) }); }
async function save(page, a) {
  await page.getByRole('button', { name: `儲存 ${a.agent.name} 設定`, exact: true }).click();
  await expect(row(page, a).getByRole('status')).toHaveText('已儲存');
}
async function ruleUI(page, agent, keyword) {
  await page.getByRole('navigation', { name: 'Agent Hub', exact: true }).getByRole('link', { name: '規則', exact: true }).click();
  const form = page.locator('form');
  await form.getByLabel('規則名稱', { exact: true }).fill(`旅程-${keyword}`);
  await form.getByLabel('交給哪個 Agent', { exact: true }).selectOption(agent.id);
  await form.getByLabel(`安裝測試 ${f.tag} 活動群組`, { exact: true }).check();
  await form.getByLabel('觸發條件', { exact: true }).selectOption('keyword');
  await form.getByLabel('關鍵字（用逗號分隔）', { exact: true }).fill(keyword);
  await form.getByLabel('附重點整理（會用免費模型）', { exact: true }).uncheck();
  await form.getByLabel('附原始訊息', { exact: true }).check();
  await form.getByLabel('附媒體下載連結', { exact: true }).uncheck();
  await form.getByLabel('給 Agent 的指令', { exact: true }).fill('請讀活動訊息並回覆收到，完成後寫一句摘要。');
  await form.getByRole('button', { name: '儲存規則', exact: true }).click();
  await expect(page.getByRole('switch', { name: `旅程-${keyword} 啟用`, exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.reload();
  await expect(page.getByRole('switch', { name: `旅程-${keyword} 啟用`, exact: true })).toHaveAttribute('aria-checked', 'true');
}
test('UAT-22 Explain invalid limits and allow correction', async ({ page }, info) => {
  await agents(page); const form = page.locator('form');
  const name = `限制測試 ${f.tag}`; await form.getByLabel('名稱', { exact: true }).fill(name);
  const limit = form.getByLabel('每日發送上限', { exact: true }); await limit.fill('-1');
  await form.getByRole('button', { name: '建立 Agent', exact: true }).click();
  await expect(form.getByRole('alert')).toHaveText('每日發送上限請填 0 到 1000 的整數');
  expect((await h.api(f.owner, '/api/hub/admin/agents')).body.agents).toHaveLength(0);
  await limit.fill('1'); await form.getByRole('button', { name: '建立 Agent', exact: true }).click();
  const secret = page.getByRole('region', { name: '只顯示一次的憑證' }); await expect(secret).toBeVisible();
  await secret.getByRole('button', { name: '我已保存' }).click();
  const item = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: `停用 ${name}`, exact: true }) });
  const edit = item.getByLabel('每日發送上限', { exact: true }); await edit.fill('1001');
  await item.getByRole('button', { name: `儲存 ${name} 設定`, exact: true }).click();
  await expect(item.getByRole('status')).toHaveText('每日發送上限請填 0 到 1000 的整數');
  expect((await h.api(f.owner, '/api/hub/admin/agents')).body.agents[0].dailySendLimit).toBe(1);
  await edit.fill('2'); await item.getByRole('button', { name: `儲存 ${name} 設定`, exact: true }).click();
  await expect(item.getByRole('status')).toHaveText('已儲存'); await page.reload(); await expect(edit).toHaveValue('2');
  await h.shot(page, info, 'UAT-22');
});
test('UAT-21 Assign a group after creating a Grok without group access', async ({ page }, info) => {
  await h.openGroup(f); await agents(page);
  const name = `探索 Grok ${f.tag}`; const form = page.locator('form');
  await form.getByLabel('名稱', { exact: true }).fill(name);
  await form.getByRole('button', { name: '建立 Agent', exact: true }).click();
  const secret = page.getByRole('region', { name: '只顯示一次的憑證' });
  await expect(secret).toBeVisible(); const key = await secret.locator('code.block').first().textContent();
  expect((await h.api(key, '/api/hub/v1/groups')).body.groups).toEqual([]);
  await secret.getByRole('button', { name: '我已保存' }).click();
  const item = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: `停用 ${name}`, exact: true }) });
  const group = item.getByLabel(`安裝測試 ${f.tag} 活動群組`, { exact: true });
  await group.check(); await item.getByRole('button', { name: `儲存 ${name} 設定`, exact: true }).click();
  await expect(item.getByRole('status')).toHaveText('已儲存');
  expect((await h.api(key, '/api/hub/v1/groups')).body.groups.map(g => g.groupId)).toEqual([f.groups[0]]);
  await page.reload(); await expect(group).toBeChecked(); await h.shot(page, info, 'UAT-21');
});
test('UAT-20 Instinct recovers after entering a wrong password', async ({ browser }, info) => {
  const a = await h.create(f, 'instinct');
  const ctx = await browser.newContext({ ...info.project.use });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4141/login');
  await page.getByPlaceholder('Email', { exact: true }).fill(a.agent.accountEmail);
  await page.getByPlaceholder('密碼', { exact: true }).fill('incorrect-emulator-password');
  await page.getByRole('button', { name: '登入', exact: true }).click();
  await expect(page.getByText('Email 或密碼錯誤', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('Email', { exact: true })).toHaveValue(a.agent.accountEmail);
  await page.getByPlaceholder('密碼', { exact: true }).fill(a.password);
  await page.getByRole('button', { name: '登入', exact: true }).click();
  await page.waitForURL('**/workbench');
  await h.shot(page, info, 'UAT-20');
  await ctx.close();
});
test('UAT-01 Owner creates Grok and receives a one-time key', async ({ page }, info) => {
  await page.goto('/hub/groups');
  await page.getByRole('switch', { name: `安裝測試 ${f.tag} 活動群組 允許 Agent 讀取`, exact: true }).click();
  await agents(page);
  const form = page.locator('form');
  await form.getByLabel('名稱', { exact: true }).fill(`新手 Grok ${f.tag}`);
  await form.getByLabel(`安裝測試 ${f.tag} 活動群組`, { exact: true }).check();
  await form.getByLabel('每日發送上限', { exact: true }).fill('5');
  await form.getByRole('button', { name: '建立 Agent', exact: true }).click();
  const secret = page.getByRole('region', { name: '只顯示一次的憑證' });
  await expect(secret).toBeVisible(); const key = await secret.locator('code.block').first().textContent();
  expect((await h.api(key, '/api/hub/me')).body.role).toBe('agent');
  const tools = await h.mcp(key, 'tools/list'); expect(tools.body.result.tools.map(t => t.name)).toContain('send_message');
  expect((await h.api(key, '/api/hub/v1/groups')).body.groups.map(g => g.groupId)).toEqual([f.groups[0]]);
  await secret.getByRole('button', { name: '我已保存' }).click(); await page.reload();
  await expect(secret).toHaveCount(0); await expect(page.getByText(`新手 Grok ${f.tag}`, { exact: false }).first()).toBeVisible();
  await h.shot(page, info, 'UAT-01');
});
test('UAT-02 Configure Routine and receive a signed keyword dispatch', async ({ page }, info) => {
  const a = await grok(page);
  await row(page, a).getByLabel(`Routine 網址（${a.agent.name}）`, { exact: true }).fill('https://routine.example.invalid/uat');
  await row(page, a).getByLabel(`Routine Key（${a.agent.name}，留空表示不變）`, { exact: true }).fill('emulator-only-routine');
  await save(page, a); await row(page, a).getByRole('button', { name: '測試 Webhook', exact: true }).click();
  await expect(row(page, a).getByRole('status')).toContainText('Webhook 測試成功');
  const keyword = `Grok${f.tag}`; await ruleUI(page, a.agent, keyword); await h.event(f, `${keyword} 活動今天開始`);
  let dispatch;
  await expect.poll(async () => { dispatch = (await h.events()).routines.find(d => d.rule?.name === `旅程-${keyword}`); return !!dispatch; }).toBe(true);
  expect(dispatch.messages.some(m => m.text.includes('活動今天開始'))).toBe(true);
  expect((await h.api(a.apiKey, `/api/hub/v1/dispatches/${dispatch.jobId}`)).status).toBe(200);
  expect((await h.api(a.apiKey, `/api/hub/v1/dispatches/${dispatch.jobId}/complete`, 'POST', { summary: '已讀活動並完成' })).body.status).toBe('done');
  await h.shot(page, info, 'UAT-02');
});
test('UAT-03 Read activity messages, send once, record and schedule', async ({ page }, info) => {
  const a = await grok(page); await h.event(f, `活動${f.tag} 即將開始`);
  expect((await h.api(a.apiKey, `/api/hub/v1/groups/${f.groups[0]}/messages`)).body.messages.length).toBe(1);
  expect((await h.api(a.apiKey, `/api/hub/v1/messages/search?q=活動${f.tag}`)).body.messages.length).toBe(1);
  const key = h.randomUUID(); const params = { groupId: f.groups[0], text: `Grok 收到 ${f.tag}` };
  expect((await h.act(a.apiKey, 'send_message', params, key)).body.status).toBe('done');
  expect((await h.act(a.apiKey, 'send_message', params, key)).body.replayed).toBe(true);
  expect((await h.events()).pushes.filter(p => p.to === f.groups[0]).length).toBe(1);
  const record = await h.act(a.apiKey, 'record', { groupId: f.groups[0], category: '活動', title: `活動紀錄${f.tag}`, content: '已確認時間' });
  expect(record.body.status).toBe('done');
  expect((await h.api(a.apiKey, `/api/hub/v1/records?groupId=${f.groups[0]}`)).body.records[0].title).toBe(`活動紀錄${f.tag}`);
  const scheduled = await h.act(a.apiKey, 'schedule_message', { groupId: f.groups[0], text: '稍後提醒', sendAt: new Date(Date.now() + 86400000).toISOString() });
  expect(scheduled.body.status).toBe('done');
  const msg = await h.db.doc(`activities/${scheduled.body.result.activityId}/activityMessages/${scheduled.body.result.messageId}`).get();
  expect(msg.data().reviewStatus).toBe('approved'); expect(msg.data().status).toBe('pending');
  await page.goto('/hub/records');
  await expect(page.getByRole('listitem').filter({ hasText: `活動紀錄${f.tag}` }).getByText('已確認時間', { exact: true })).toBeVisible();
  await h.shot(page, info, 'UAT-03');
});
test('UAT-04 Disable and re-enable without losing permissions', async ({ page }, info) => {
  const a = await grok(page);
  await page.getByRole('button', { name: `停用 ${a.agent.name}`, exact: true }).click();
  await expect(page.getByRole('button', { name: `啟用 ${a.agent.name}`, exact: true })).toBeVisible(); await page.reload();
  expect((await h.api(a.apiKey, '/api/hub/me')).body.code).toBe('agent_disabled');
  await page.getByRole('button', { name: `啟用 ${a.agent.name}`, exact: true }).click();
  await expect(page.getByRole('button', { name: `停用 ${a.agent.name}`, exact: true })).toBeVisible(); await page.reload();
  await expect(row(page, a).getByLabel('每日發送上限', { exact: true })).toHaveValue('5');
  await expect(row(page, a).getByLabel(`安裝測試 ${f.tag} 活動群組`, { exact: true })).toBeChecked();
  expect((await h.api(a.apiKey, '/api/hub/me')).status).toBe(200); await h.shot(page, info, 'UAT-04');
});
test('UAT-05 Group withdrawal and zero daily limit block actions', async ({ page }, info) => {
  const a = await grok(page);
  for (const id of [f.groups[1]]) {
    expect((await h.api(a.apiKey, `/api/hub/v1/groups/${id}/messages`)).status).toBe(403);
    expect((await h.act(a.apiKey, 'send_message', { groupId: id, text: '不得送出' })).body.code).toBe('group_not_allowed');
  }
  await h.openGroup(f, false);
  expect((await h.api(a.apiKey, '/api/hub/v1/groups')).body.groups).toEqual([]);
  expect((await h.api(a.apiKey, `/api/hub/v1/groups/${f.groups[0]}/messages`)).status).toBe(403);
  expect((await h.act(a.apiKey, 'send_message', { groupId: f.groups[0], text: '不得送出' })).body.code).toBe('group_not_allowed');
  await h.openGroup(f); await row(page, a).getByLabel('每日發送上限', { exact: true }).fill('0'); await save(page, a);
  const blocked = await h.act(a.apiKey, 'send_message', { groupId: f.groups[0], text: '不得送出' });
  expect(blocked.body.code).toBe('agent_daily_limit'); expect(blocked.body.detail).toContain('上限 0');
  expect((await h.events()).pushes.filter(p => p.to === f.groups[0])).toHaveLength(0); await h.shot(page, info, 'UAT-05');
});
async function instinctUI(page) {
  await h.openGroup(f); await agents(page); const form = page.locator('form');
  await form.getByLabel('類型', { exact: true }).selectOption('instinct');
  await form.getByLabel('名稱', { exact: true }).fill(`Instinct ${f.tag}`);
  const email = `instinct-ui-${f.tag}@example.test`;
  await form.getByLabel('登入 Email', { exact: true }).fill(email);
  await form.getByLabel(`安裝測試 ${f.tag} 活動群組`, { exact: true }).check();
  await form.getByLabel('收件匣逾時預警（小時）', { exact: true }).fill('48');
  await form.getByRole('button', { name: '建立 Agent', exact: true }).click();
  const secret = page.getByRole('region', { name: '只顯示一次的憑證' }); await expect(secret).toBeVisible();
  const password = await secret.locator('code.block').last().textContent();
  await secret.getByRole('button', { name: '我已保存' }).click();
  const agent = (await h.api(f.owner, '/api/hub/admin/agents')).body.agents.find(a => a.name === `Instinct ${f.tag}`);
  return { agent, email, password };
}
test('UAT-06 Create Instinct and log in to restricted workbench', async ({ page, browser }, info) => {
  const a = await instinctUI(page); expect(a.agent.inboxAlertHours).toBe(48);
  const ctx = await browser.newContext({ ...info.project.use }); const p = await ctx.newPage();
  // New context uses explicit URL because it does not inherit baseURL.
  await h.login(p, a.email, a.password);
  const token = (await h.signIn(a.email, a.password)).token;
  expect((await h.api(token, '/api/hub/me')).body.role).toBe('agent');
  expect((await h.api(token, '/api/hub/admin/agents')).status).toBe(403);
  await expect(p.getByRole('link', { name: 'Agent Hub', exact: true })).toHaveCount(0);
  await p.goto('http://127.0.0.1:4141/hub/agents'); await p.waitForURL('**/workbench');
  await p.goto('http://127.0.0.1:4141/workbench'); await h.shot(p, info, 'UAT-06'); await ctx.close();
});
test('UAT-07 Instinct reads inbox, sends message and completes work', async ({ page }, info) => {
  const a = await instinctUI(page); const keyword = `Instinct${f.tag}`;
  await ruleUI(page, a.agent, keyword); await h.event(f, `${keyword} 活動請確認`);
  await page.getByRole('button', { name: '登出', exact: true }).click();
  await page.waitForURL('**/login'); await h.login(page, a.email, a.password);
  await page.getByRole('button', { name: new RegExp(`旅程-${keyword}｜`) }).click();
  await expect(page.getByText('請讀活動訊息並回覆收到，完成後寫一句摘要。', { exact: true })).toBeVisible();
  await expect(page.getByText(`${keyword} 活動請確認`, { exact: true })).toBeVisible();
  await page.getByLabel('群組', { exact: true }).selectOption(f.groups[0]);
  await page.getByLabel('訊息內容', { exact: true }).fill(`Instinct 收到 ${f.tag}`);
  await page.getByRole('button', { name: '送出動作', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('已完成');
  expect((await h.events()).pushes.filter(p => p.to === f.groups[0])).toHaveLength(1);
  await page.getByLabel('完成備註', { exact: true }).fill('已讀活動且回覆收到');
  await page.getByRole('button', { name: '標記完成', exact: true }).click();
  await expect(page.getByText('目前沒有待處理的項目', { exact: true })).toBeVisible();
  const token = (await h.signIn(a.email, a.password)).token;
  expect((await h.api(token, '/api/hub/v1/inbox?status=done')).body.items[0].note).toBe('已讀活動且回覆收到');
  await h.shot(page, info, 'UAT-07');
});
test('UAT-08 Rotate credentials and recover Instinct access', async ({ page }, info) => {
  const a = await grok(page);
  await row(page, a).getByRole('button', { name: '重新產生 API Key', exact: true }).click();
  const secret = page.getByRole('region', { name: '只顯示一次的憑證' }); await expect(secret).toBeVisible();
  const newKey = await secret.locator('code.block').first().textContent();
  expect((await h.api(a.apiKey, '/api/hub/me')).status).toBe(401); expect((await h.api(newKey, '/api/hub/me')).status).toBe(200);
  await secret.getByRole('button', { name: '我已保存' }).click();
  const i = await instinctUI(page);
  const ir = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: `停用 ${i.agent.name}`, exact: true }) });
  await ir.getByRole('button', { name: '重設密碼', exact: true }).click(); await expect(secret).toBeVisible();
  const password = await secret.locator('code.block').last().textContent();
  expect((await h.signIn(i.email, i.password)).status).toBe(400); expect((await h.signIn(i.email, password)).status).toBe(200);
  await secret.getByRole('button', { name: '我已保存' }).click();
  const before = (await h.signIn(i.email, password)).token;
  await page.getByRole('button', { name: `停用 ${i.agent.name}`, exact: true }).click();
  await expect(page.getByRole('button', { name: `啟用 ${i.agent.name}`, exact: true })).toBeVisible();
  const disabled = await h.api(before, '/api/hub/me');
  expect(disabled.status).toBe(403); expect(disabled.body.code).toBe('account_disabled'); expect(disabled.body.error).toContain('停用');
  expect((await h.signIn(i.email, password)).status).toBe(400);
  await page.getByRole('button', { name: `啟用 ${i.agent.name}`, exact: true }).click();
  await expect(page.getByRole('button', { name: `停用 ${i.agent.name}`, exact: true })).toBeVisible();
  expect((await h.signIn(i.email, password)).status).toBe(200); await h.shot(page, info, 'UAT-08');
});
test('UAT-11 Owner withdraws group access and existing Instinct work disappears', async ({ page, browser }, info) => {
  const i = await instinctUI(page); const keyword = `Withdraw${f.tag}`;
  await h.rule(f, i.agent, keyword); await h.event(f, `${keyword} 私密活動`);
  const token = (await h.signIn(i.email, i.password)).token;
  const ctx = await browser.newContext({ ...info.project.use, baseURL: 'http://127.0.0.1:4141' });
  try {
    const p = await ctx.newPage(); await h.login(p, i.email, i.password);
    await expect(p.getByRole('button', { name: new RegExp(`旅程-${keyword}｜`) })).toBeVisible();
    const item = (await h.api(token, '/api/hub/v1/inbox')).body.items[0];
    const ir = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: `停用 ${i.agent.name}`, exact: true }) });
    await ir.getByLabel(`安裝測試 ${f.tag} 活動群組`, { exact: true }).uncheck();
    await page.getByRole('button', { name: `儲存 ${i.agent.name} 設定`, exact: true }).click();
    await expect(ir.getByRole('status')).toHaveText('已儲存');
    await p.reload(); await expect(p.getByText('目前沒有待處理的項目', { exact: true })).toBeVisible();
    expect((await h.api(token, `/api/hub/v1/dispatches/${item.dispatchId}`)).body.code).toBe('group_not_allowed');
    await expect(p.getByLabel('群組', { exact: true }).locator('option')).toHaveCount(1);
    await h.shot(p, info, 'UAT-11');
    await ir.getByLabel(`安裝測試 ${f.tag} 活動群組`, { exact: true }).check();
    await page.getByRole('button', { name: `儲存 ${i.agent.name} 設定`, exact: true }).click();
    await expect(ir.getByRole('status')).toHaveText('已儲存');
    await p.reload(); await expect(p.getByRole('button', { name: new RegExp(`旅程-${keyword}｜`) })).toBeVisible();
  } finally { await ctx.close(); }
});
test('UAT-09 Newcomer receives actionable invalid-action feedback', async ({ page }, info) => {
  await h.openGroup(f); await page.goto('/workbench');
  await page.getByLabel('動作', { exact: true }).selectOption('schedule_message');
  await page.getByLabel('群組', { exact: true }).selectOption(f.groups[0]);
  await page.getByLabel('訊息內容', { exact: true }).fill('過去的排程');
  await page.getByLabel('發送時間（台北時間）', { exact: true }).fill('2020-01-01T10:00');
  await page.getByRole('button', { name: '送出動作', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('sendAt 必須是未來的時間'); await h.shot(page, info, 'UAT-09');
});
test('UAT-10 Beginner installation documentation matches actual interfaces', async ({ page }, info) => {
  const a = await grok(page); expect((await h.mcp(a.apiKey, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'Grok Bot UAT', version: '1' } })).body.result.serverInfo.name).toBe('wippy-agent-hub');
  const tools = (await h.mcp(a.apiKey, 'tools/list')).body.result.tools.map(t => t.name);
  expect(tools).toContain('send_message'); expect(tools).not.toContain('draft_message'); expect(tools).not.toContain('list_activities');
  const groups = await h.mcp(a.apiKey, 'tools/call', { name: 'list_groups', arguments: {} });
  expect(groups.body.result.structuredContent.groups.map(g => g.groupId)).toEqual([f.groups[0]]);
  await h.shot(page, info, 'UAT-10');
});
test('UAT-12 Recover from an invalid Routine URL without losing the installation form', async ({ page }, info) => {
  await h.openGroup(f); await agents(page);
  const form = page.locator('form'); const name = `修正後的 Grok ${f.tag}`;
  await form.getByLabel('名稱', { exact: true }).fill(name);
  await form.getByLabel('Routine Webhook 網址', { exact: true }).fill('http://routine.example.invalid/uat');
  await form.getByLabel(`安裝測試 ${f.tag} 活動群組`, { exact: true }).check();
  await form.getByRole('button', { name: '建立 Agent', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('https://');
  await expect(form.getByLabel('名稱', { exact: true })).toHaveValue(name);
  await expect(form.getByLabel(`安裝測試 ${f.tag} 活動群組`, { exact: true })).toBeChecked();
  expect((await h.api(f.owner, '/api/hub/admin/agents')).body.agents).toHaveLength(0);
  // A Routine is optional for the initial REST installation.
  await form.getByLabel('Routine Webhook 網址', { exact: true }).fill('');
  await form.getByRole('button', { name: '建立 Agent', exact: true }).click();
  const secret = page.getByRole('region', { name: '只顯示一次的憑證' }); await expect(secret).toBeVisible();
  const key = await secret.locator('code.block').first().textContent();
  expect((await h.api(key, '/api/hub/me')).body.agentName).toBe(name);
  await secret.getByRole('button', { name: '我已保存' }).click();
  await h.shot(page, info, 'UAT-12');
});
test('UAT-13 Instinct can sign in and out while browser profile storage is unavailable', async ({ page }, info) => {
  await h.openGroup(f); const i = await h.create(f, 'instinct');
  await page.getByRole('button', { name: '登出', exact: true }).click(); await page.waitForURL('**/login');
  await page.route('**/google.firestore.v1.Firestore/**', route => route.abort('connectionfailed'));
  await h.login(page, i.agent.accountEmail, i.password);
  await expect(page.getByRole('heading', { name: '收件匣（待處理）', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '登出', exact: true }).click(); await page.waitForURL('**/login');
  await expect(page.getByRole('button', { name: '登入', exact: true })).toBeVisible();
  await h.login(page, i.agent.accountEmail, i.password);
  await expect(page.getByRole('heading', { name: '收件匣（待處理）', exact: true })).toBeVisible();
  await h.shot(page, info, 'UAT-13');
});

test('UAT-14 Instinct cannot complete an already open item after Owner withdraws its group', async ({ page, browser }, info) => {
  const i = await instinctUI(page); const keyword = `Stale${f.tag}`;
  await h.rule(f, i.agent, keyword); await h.event(f, `${keyword} 活動`);
  const token = (await h.signIn(i.email, i.password)).token;
  let item; await expect.poll(async () => { item = (await h.api(token, '/api/hub/v1/inbox')).body.items[0]; return !!item; }).toBe(true);
  const before = (await h.db.collection('agentDispatches').doc(item.dispatchId).get()).data();
  const ctx = await browser.newContext({ ...info.project.use, baseURL: 'http://127.0.0.1:4141' });
  try {
    const p = await ctx.newPage(); await h.login(p, i.email, i.password);
    await p.getByRole('button', { name: new RegExp(`旅程-${keyword}｜`) }).click();
    await expect(p.getByText(`${keyword} 活動`, { exact: true })).toBeVisible();
    const ir = row(page, i);
    await ir.getByLabel(`安裝測試 ${f.tag} 活動群組`, { exact: true }).uncheck(); await save(page, i);
    await p.getByLabel('完成備註', { exact: true }).fill('不得寫入的完成備註');
    await p.getByRole('button', { name: '標記完成', exact: true }).click();
    await expect(p.getByText(/blocked：group_not_allowed/)).toBeVisible();
    expect((await h.db.collection('agentInbox').doc(item.id).get()).data()).toMatchObject({ status: 'open', note: null });
    expect((await h.db.collection('agentDispatches').doc(item.dispatchId).get()).data()).toEqual(before);
    await h.shot(p, info, 'UAT-14');
    await ir.getByLabel(`安裝測試 ${f.tag} 活動群組`, { exact: true }).check(); await save(page, i);
    await p.getByLabel('完成備註', { exact: true }).fill('恢復授權後完成');
    await p.getByRole('button', { name: '標記完成', exact: true }).click();
    await expect(p.getByText('目前沒有待處理的項目', { exact: true })).toBeVisible();
    expect((await h.db.collection('agentInbox').doc(item.id).get()).data()).toMatchObject({ status: 'done', note: '恢復授權後完成' });
  } finally { await ctx.close(); }
});

test('UAT-15 Disabled Instinct gets login guidance and signs in after Owner enables it', async ({ page, browser }, info) => {
  const i = await instinctUI(page);
  const ctx = await browser.newContext({ ...info.project.use, baseURL: 'http://127.0.0.1:4141' });
  try {
    const p = await ctx.newPage(); await h.login(p, i.email, i.password);
    await expect(p.getByRole('heading', { name: '收件匣（待處理）', exact: true })).toBeVisible();
    await page.getByRole('button', { name: `停用 ${i.agent.name}`, exact: true }).click();
    await expect(page.getByRole('button', { name: `啟用 ${i.agent.name}`, exact: true })).toBeVisible();
    await p.reload();
    // Firebase rejects persistence refresh for a disabled account and signs out.
    await p.waitForURL('**/login');
    await p.getByPlaceholder('Email', { exact: true }).fill(i.email);
    await p.getByPlaceholder('密碼', { exact: true }).fill(i.password);
    await p.getByRole('button', { name: '登入', exact: true }).click();
    await expect(p.getByRole('alert')).toContainText('此帳號已停用');
    await expect(p.getByRole('alert')).toContainText('請聯絡擁有者重新啟用');
    await expect(p.getByRole('button', { name: '送出動作', exact: true })).toHaveCount(0);
    await h.shot(p, info, 'UAT-15');
    await page.getByRole('button', { name: `啟用 ${i.agent.name}`, exact: true }).click();
    await expect(page.getByRole('button', { name: `停用 ${i.agent.name}`, exact: true })).toBeVisible();
    await p.getByRole('button', { name: '登入', exact: true }).click();
    await expect(p.getByRole('heading', { name: '收件匣（待處理）', exact: true })).toBeVisible();
    await expect(p.getByLabel('群組', { exact: true }).locator('option')).toHaveCount(2);
    await expect(row(page, i).getByLabel(`收件匣逾時預警（${i.agent.name}，小時）`, { exact: true })).toHaveValue('48');
  } finally { await ctx.close(); }
});

test('UAT-16 Completing a dispatch via REST still lets Instinct finish its matching inbox item', async ({ page }, info) => {
  const i = await instinctUI(page); const keyword = `Separate${f.tag}`;
  await h.rule(f, i.agent, keyword); await h.event(f, keyword);
  const token = (await h.signIn(i.email, i.password)).token;
  let item; await expect.poll(async () => { item = (await h.api(token, '/api/hub/v1/inbox')).body.items[0]; return !!item; }).toBe(true);
  const dispatch = await h.api(token, `/api/hub/v1/dispatches/${item.dispatchId}/complete`, 'POST', { summary: '處理完成' });
  expect(dispatch.body).toMatchObject({ type: 'complete_dispatch', status: 'done' });
  const inbox = await h.api(token, `/api/hub/v1/inbox/${item.id}/complete`, 'POST', { note: '收件匣也完成' });
  expect(inbox.body).toMatchObject({ type: 'complete_inbox', status: 'done' });
  expect(inbox.body.actionId).not.toBe(dispatch.body.actionId);
  expect((await h.api(token, `/api/hub/v1/inbox/${item.id}/complete`, 'POST', { note: '重送不得覆寫' })).body).toMatchObject({ actionId: inbox.body.actionId, replayed: true });
  await page.getByRole('button', { name: '登出', exact: true }).click(); await page.waitForURL('**/login');
  await h.login(page, i.email, i.password);
  await expect(page.getByText('目前沒有待處理的項目', { exact: true })).toBeVisible();
  expect((await h.api(token, '/api/hub/v1/inbox?status=done')).body.items[0].note).toBe('收件匣也完成');
  await h.shot(page, info, 'UAT-16');
});

test('UAT-17 Login values and inbox labels remain readable before and after selection', async ({ page }, info) => {
  const i = await instinctUI(page); const keyword = `Readable${f.tag}`;
  await h.rule(f, i.agent, keyword); await h.event(f, keyword);
  await page.getByRole('button', { name: '登出', exact: true }).click(); await page.waitForURL('**/login');
  const email = page.getByPlaceholder('Email', { exact: true }); const password = page.getByPlaceholder('密碼', { exact: true });
  await email.fill(i.email); await password.fill(i.password);
  const ratios = [];
  for (const [label, field] of [['login email', email], ['login password', password]]) {
    ratios.push({ label, ...await h.textContrast(field) });
    ratios.push({ label: `${label} placeholder`, ...await h.textContrast(field, '::placeholder') });
  }
  await page.getByRole('button', { name: '登入', exact: true }).click(); await page.waitForURL('**/workbench');
  const item = page.getByRole('button', { name: new RegExp(`旅程-${keyword}｜`) });
  await expect(item).toBeVisible();
  ratios.push({ label: 'inbox title', ...await h.textContrast(item) });
  ratios.push({ label: 'inbox time', ...await h.textContrast(item.locator('span')) });
  await item.click(); await expect(page.getByText(keyword, { exact: true })).toBeVisible();
  ratios.push({ label: 'selected inbox title', ...await h.textContrast(item) });
  ratios.push({ label: 'selected inbox time', ...await h.textContrast(item.locator('span')) });
  const fs = require('node:fs'); const name = `UAT-17-${info.project.name}-contrast.json`;
  for (const dir of ['docs/uat/evidence', 'docs/pr42-fixes/evidence']) fs.writeFileSync(`${dir}/${name}`, JSON.stringify(ratios, null, 2) + '\n');
  for (const sample of ratios) expect(sample.ratio, sample.label).toBeGreaterThanOrEqual(4.5);
  await h.shot(page, info, 'UAT-17');
});

test('UAT-18 New and recovered credentials are readable and usable without persisting secrets', async ({ page }, info) => {
  await h.openGroup(f); await agents(page);
  const ratios = [];
  const form = page.locator('form');
  const secret = page.getByRole('region', { name: '只顯示一次的憑證' });
  for (const kind of ['grok_bot', 'instinct']) {
    const name = `Readable-${kind}-${f.tag}`;
    const email = `readable-${f.tag}@example.test`;
    await form.getByLabel('類型', { exact: true }).selectOption(kind);
    await form.getByLabel('名稱', { exact: true }).fill(name);
    if (kind === 'instinct') await form.getByLabel('登入 Email', { exact: true }).fill(email);
    await form.getByLabel(`安裝測試 ${f.tag} 活動群組`, { exact: true }).check();
    await form.getByRole('button', { name: '建立 Agent', exact: true }).click();
    for (const stage of ['created', 'recovered']) {
      await expect(secret).toBeVisible();
      const codes = secret.locator('code.block');
      await expect(codes).toHaveCount(2);
      for (let index = 0; index < 2; index++) ratios.push({ label: `${kind} ${stage} field ${index + 1}`, ...await h.textContrast(codes.nth(index)) });
      if (kind === 'grok_bot') {
        const key = await codes.first().textContent();
        expect((await h.api(key, '/api/hub/me')).body.agentName).toBe(name);
      } else {
        const password = await codes.last().textContent();
        expect((await h.signIn(email, password)).status).toBe(200);
      }
      await secret.getByRole('button', { name: '我已保存' }).click();
      await expect(secret).toHaveCount(0);
      if (stage === 'created') {
        const item = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: `停用 ${name}`, exact: true }) });
        await item.getByRole('button', { name: kind === 'grok_bot' ? '重新產生 API Key' : '重設密碼', exact: true }).click();
      }
    }
  }
  const fs = require('node:fs'); const name = `UAT-18-${info.project.name}-contrast.json`;
  for (const dir of ['docs/uat/evidence', 'docs/pr42-fixes/evidence']) fs.writeFileSync(`${dir}/${name}`, JSON.stringify(ratios, null, 2) + '\n');
  for (const sample of ratios) expect(sample.ratio, sample.label).toBeGreaterThanOrEqual(4.5);
  await page.reload(); await expect(secret).toHaveCount(0);
  for (const kind of ['grok_bot', 'instinct']) await expect(page.getByRole('button', { name: `停用 Readable-${kind}-${f.tag}`, exact: true })).toBeVisible();
  await page.getByRole('heading', { name: 'Agent 清單', exact: true }).scrollIntoViewIfNeeded();
  await h.shot(page, info, 'UAT-18');
});

test('UAT-19 Instinct sees completion and search failures and can retry without losing work', async ({ page }, info) => {
  const i = await instinctUI(page); const keyword = `Recover${f.tag}`;
  await h.rule(f, i.agent, keyword); await h.event(f, keyword);
  const token = (await h.signIn(i.email, i.password)).token;
  await page.getByRole('button', { name: '登出', exact: true }).click(); await page.waitForURL('**/login');
  await h.login(page, i.email, i.password);
  const item = page.getByRole('button', { name: new RegExp(`旅程-${keyword}｜`) });
  await item.click(); await expect(page.getByText(keyword, { exact: true })).toBeVisible();
  const errors = []; page.on('pageerror', err => errors.push(err.name));
  const actionUrl = '**/api/hub/v1/actions';
  await page.route(actionUrl, route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 'unavailable', error: '暫時無法完成，請再試一次' }) }));
  await page.getByLabel('完成備註', { exact: true }).fill('保留備註並重試');
  await page.getByRole('button', { name: '標記完成', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('暫時無法完成，請再試一次');
  await expect(page.getByLabel('完成備註', { exact: true })).toHaveValue('保留備註並重試');
  expect((await h.api(token, '/api/hub/v1/inbox')).body.items).toHaveLength(1);
  await page.unroute(actionUrl);
  await page.getByRole('button', { name: '標記完成', exact: true }).click();
  await expect(page.getByText('目前沒有待處理的項目', { exact: true })).toBeVisible();
  expect((await h.api(token, '/api/hub/v1/inbox?status=done')).body.items[0].note).toBe('保留備註並重試');
  const search = page.locator('section').filter({ has: page.getByRole('heading', { name: '搜尋訊息', exact: true }) });
  await search.getByLabel('搜尋關鍵字', { exact: true }).fill(keyword);
  await search.getByRole('button', { name: '搜尋', exact: true }).click();
  await expect(search.getByText(keyword, { exact: true })).toBeVisible();
  const searchUrl = '**/api/hub/v1/messages/search?*';
  await page.route(searchUrl, route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 'unavailable', error: '搜尋暫時失敗，請重試' }) }));
  await search.getByRole('button', { name: '搜尋', exact: true }).click();
  await expect(search.getByRole('alert')).toContainText('搜尋暫時失敗，請重試');
  await expect(search.getByText(keyword, { exact: true })).toHaveCount(0);
  await expect(search.getByLabel('搜尋關鍵字', { exact: true })).toHaveValue(keyword);
  await page.unroute(searchUrl);
  await search.getByRole('button', { name: '搜尋', exact: true }).click();
  await expect(search.getByRole('alert')).toHaveCount(0);
  await expect(search.getByText(keyword, { exact: true })).toBeVisible();
  await search.getByLabel('搜尋關鍵字', { exact: true }).fill('不存在的活動');
  await search.getByRole('button', { name: '搜尋', exact: true }).click();
  await expect(search.getByText('沒有符合的訊息', { exact: true })).toBeVisible();
  await search.getByText('沒有符合的訊息', { exact: true }).scrollIntoViewIfNeeded();
  await expect(search.getByText('沒有符合的訊息', { exact: true })).toBeInViewport();
  expect(errors).toEqual([]);
  await h.shot(page, info, 'UAT-19');
});
