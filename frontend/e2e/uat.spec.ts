import { test as base, expect, type Page } from '@playwright/test';

const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await use(errors);
  }, { auto: true }],
});
test.afterEach(async ({ page, errors }, info) => {
  await page.screenshot({ path: info.outputPath('uat.png'), fullPage: true });
  await info.attach('uat-screenshot', { path: info.outputPath('uat.png'), contentType: 'image/png' });
  expect(errors, '瀏覽器不得有未處理例外').toEqual([]);
});
const fixturePassword = 'local-uat-test-only';
async function register(page: Page) {
  const email = `uat-${crypto.randomUUID()}@example.test`;
  await page.goto('/login');
  await page.getByRole('button', { name: '還沒有帳號？免費註冊' }).click();
  await page.getByPlaceholder('Email', { exact: true }).fill(email);
  await page.getByPlaceholder('密碼', { exact: true }).fill(fixturePassword);
  await page.getByRole('button', { name: '建立帳號', exact: true }).click();
  await expect(page.getByRole('heading', { name: '群組', exact: true })).toBeVisible();
  await expect(page.getByText('UAT 讀書會', { exact: true })).toBeVisible();
  return email;
}
async function api(page: Page, path: string, method = 'GET', body?: unknown) {
  return page.evaluate(async ({ path, method, body }) => {
    const modulePath = '/src/firebase.ts';
    const { auth } = await import(modulePath);
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(path, { method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: res.status, data: await res.json() };
  }, { path, method, body });
}
async function createActivity(page: Page, withGroup = true) {
  await page.getByRole('link', { name: '活動', exact: true }).click();
  await page.getByRole('button', { name: '+ 新增活動' }).click();
  await page.getByPlaceholder('活動名稱').fill('新手讀書交流活動');
  if (withGroup) await page.getByRole('checkbox', { name: 'UAT 讀書會' }).check();
  await page.getByRole('button', { name: '建立', exact: true }).click();
  await expect(page.getByRole('heading', { name: '新手讀書交流活動' })).toBeVisible();
  return page.url().split('/').at(-1)!;
}
async function chat(page: Page, text: string) {
  await page.getByRole('button', { name: 'Agent 對話', exact: true }).click();
  await page.getByPlaceholder('輸入訊息... (Enter 送出，Shift+Enter 換行)').fill(text);
  await page.getByRole('button', { name: '送出', exact: true }).click();
}
async function plan(page: Page) {
  await chat(page, '幫我規劃三則活動前的暖場推播訊息');
  await expect(page.getByText('本機活動提醒 1：歡迎參加活動！', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '編輯', exact: true })).toHaveCount(3);
}
async function editFirst(page: Page, content: string, when = '2035-11-12T18:00:00+08:00') {
  await page.getByRole('button', { name: '編輯', exact: true }).first().click();
  await page.getByText('進階：輸入含時區的時間', { exact: true }).click();
  await page.getByPlaceholder('2025-05-10T10:00:00+08:00').fill(when);
  await page.locator('textarea').fill(content);
  await page.getByRole('button', { name: '儲存', exact: true }).click();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), '頁面不得水平溢出').toBe(true);
}

async function addKnowledge(page: Page, title: string, content: string) {
  await page.getByRole('button', { name: '知識庫', exact: true }).click();
  await page.getByRole('button', { name: '+ 新增知識條目' }).click();
  await page.getByPlaceholder('例：主角 — 艾瑞克').fill(title);
  await page.getByPlaceholder('詳細描述此知識條目的內容...').fill(content);
  await page.getByRole('button', { name: '新增', exact: true }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

test('UAT-31 推播企畫用群組名稱顯示收件對象', async ({ page }) => {
  await register(page);
  await createActivity(page);
  await plan(page);
  await expect(page.getByText('群組：UAT 讀書會', { exact: true })).toHaveCount(3);
  await page.reload();
  await page.getByRole('button', { name: /推播企畫/ }).click();
  await expect(page.getByText('群組：UAT 讀書會', { exact: true })).toHaveCount(3);
  await noOverflow(page);
});

test('UAT-28 群組載入與回覆斷線可原地重試，不誤報空對話或遺失草稿', async ({ page }) => {
  await register(page);
  const context = page.context();
  await context.setOffline(true);
  await page.getByText('UAT 讀書會', { exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('無法載入訊息');
  await expect(page.getByText('尚無訊息記錄', { exact: true })).toHaveCount(0);
  const reply = page.getByPlaceholder('輸入訊息...', { exact: true });
  await reply.fill('第一次辦讀書會，請大家帶一本書');
  await expect(page.getByRole('button', { name: '重新載入訊息', exact: true })).toHaveCount(1);
  await context.setOffline(false);
  await page.getByRole('button', { name: '重新載入訊息', exact: true }).click();
  await expect(page.getByText('測試夥伴', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(reply).toHaveValue('第一次辦讀書會，請大家帶一本書');
  await context.setOffline(true);
  await page.getByRole('button', { name: '發送', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(/無法連線.*輸入內容已保留/);
  await expect(reply).toHaveValue('第一次辦讀書會，請大家帶一本書');
  await expect(page.getByText('測試夥伴', { exact: true })).toBeVisible();
  await context.setOffline(false);
  expect((await api(page, '/api/send-logs')).data.logs).toHaveLength(0);
  await page.getByRole('button', { name: '發送', exact: true }).click();
  await expect(reply).toHaveValue('');
  await expect(page.getByRole('status')).toContainText('訊息已送出');
  await expect(page.getByRole('alert')).toHaveCount(0);
  const logs = (await api(page, '/api/send-logs')).data.logs;
  expect(logs).toHaveLength(1);
  expect(logs[0]).toMatchObject({ content: '第一次辦讀書會，請大家帶一本書', status: 'success', triggerType: 'manual' });
  await noOverflow(page);
});

test('UAT-29 廣播預覽與發送斷線用中文說明，保留各群草稿後重試一次', async ({ page }) => {
  await register(page);
  await page.getByRole('button', { name: '廣播', exact: true }).click();
  await page.getByText('UAT 讀書會', { exact: true }).click();
  await page.getByText('UAT 工作坊', { exact: true }).click();
  await page.getByRole('button', { name: '廣播 (2)', exact: true }).click();
  const draft = page.getByPlaceholder('輸入訊息內容...');
  await draft.fill('我們改在社區圖書館集合');
  await page.context().setOffline(true);
  await page.getByRole('button', { name: '下一步：各群組微調 →', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(/無法連線.*內容已保留/);
  await expect(draft).toHaveValue('我們改在社區圖書館集合');
  await page.context().setOffline(false);
  await page.getByRole('button', { name: '下一步：各群組微調 →', exact: true }).click();
  await expect(page.locator('textarea')).toHaveCount(2);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.locator('textarea').first().fill('讀書會帶一本書，在社區圖書館集合');
  await page.context().setOffline(true);
  await page.getByRole('button', { name: '確認發送至 2 個群組', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(/無法連線.*內容已保留/);
  await expect(page.locator('textarea').first()).toHaveValue('讀書會帶一本書，在社區圖書館集合');
  await expect(page.locator('textarea').nth(1)).toHaveValue('我們改在社區圖書館集合');
  await page.context().setOffline(false);
  expect((await api(page, '/api/send-logs')).data.logs).toHaveLength(0);
  await page.getByRole('button', { name: '確認發送至 2 個群組', exact: true }).click();
  await expect(page.getByText('✓ 成功', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('alert')).toHaveCount(0);
  const logs = (await api(page, '/api/send-logs')).data.logs;
  expect(logs).toHaveLength(2);
  expect(new Set(logs.map((log: { groupId: string }) => log.groupId)).size).toBe(2);
  expect(logs.map((log: { content: string }) => log.content).sort()).toEqual(['我們改在社區圖書館集合', '讀書會帶一本書，在社區圖書館集合'].sort());
  expect(logs.every((log: { status: string; triggerType: string }) => log.status === 'success' && log.triggerType === 'broadcast')).toBe(true);
  await noOverflow(page);
});

test('UAT-30 廣播微調空白或過長時指出群組並阻止發送，修正後才送出', async ({ page }) => {
  await register(page);
  await page.getByRole('button', { name: '廣播', exact: true }).click();
  await page.getByText('UAT 讀書會', { exact: true }).click();
  await page.getByText('UAT 工作坊', { exact: true }).click();
  await page.getByRole('button', { name: '廣播 (2)', exact: true }).click();
  const draft = page.getByPlaceholder('輸入訊息內容...');
  await draft.fill('字'.repeat(5001));
  await expect(page.getByRole('button', { name: '下一步：各群組微調 →', exact: true })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('5000');
  await draft.fill('請帶一本書');
  await page.getByRole('button', { name: '下一步：各群組微調 →', exact: true }).click();
  await expect(page.locator('textarea')).toHaveCount(2);
  const fields = page.locator('textarea');
  const send = page.getByRole('button', { name: '確認發送至 2 個群組', exact: true });
  await fields.first().fill('   ');
  await expect(send).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText(/UAT 讀書會.*不可為空/);
  expect((await api(page, '/api/send-logs')).data.logs).toHaveLength(0);
  const groups = (await api(page, '/api/groups')).data.groups;
  const rejected = await api(page, '/api/broadcast/multi', 'POST', { messages: [
    { groupId: groups[0].groupId, content: '   ' }, { groupId: groups[1].groupId, content: '合法內容' },
  ] });
  expect(rejected.status).toBe(400);
  expect((await api(page, '/api/send-logs')).data.logs).toHaveLength(0);
  await fields.first().fill('請帶一本書');
  await fields.nth(1).fill('字'.repeat(5001));
  await expect(send).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText(/UAT 工作坊.*5000/);
  await fields.nth(1).fill('工作坊請帶筆記本');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(send).toBeEnabled();
  await send.click();
  await expect(page.getByText('✓ 成功', { exact: true })).toHaveCount(2);
  const logs = (await api(page, '/api/send-logs')).data.logs;
  expect(logs).toHaveLength(2);
  expect(logs.map((log: { content: string }) => log.content).sort()).toEqual(['請帶一本書', '工作坊請帶筆記本'].sort());
  await noOverflow(page);
});

test('UAT-01 註冊、登入、登出與路由保護', async ({ page }) => {
  await page.goto('/activities/private');
  await expect(page).toHaveURL(/\/login$/);
  const email = await register(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: '群組', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '登出', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByPlaceholder('Email', { exact: true }).fill(email);
  await page.getByPlaceholder('密碼', { exact: true }).fill('wrong-fixture-password');
  await page.getByRole('button', { name: '登入', exact: true }).click();
  await expect(page.getByText(/Email 或密碼錯誤|登入失敗，請再試一次/)).toBeVisible();
  await page.getByPlaceholder('密碼', { exact: true }).fill(fixturePassword);
  await page.getByRole('button', { name: '登入', exact: true }).click();
  await expect(page.getByRole('heading', { name: '群組', exact: true })).toBeVisible();
  await noOverflow(page);
});

test('UAT-02 建立活動及管理目標群組', async ({ page }) => {
  await register(page);
  await page.getByRole('link', { name: '活動', exact: true }).click();
  await expect(page.getByText('尚無活動', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+ 新增活動' }).click();
  await page.getByPlaceholder('活動名稱').fill('   ');
  await expect(page.getByRole('button', { name: '建立', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '取消', exact: true }).click();
  const id = await createActivity(page);
  await page.getByRole('checkbox', { name: 'UAT 工作坊' }).check();
  await expect(page.getByText('已選 2 個', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'UAT 讀書會' }).uncheck();
  await expect(page.getByText('已選 1 個', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'UAT 工作坊' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'UAT 讀書會' })).not.toBeChecked();
  await page.getByRole('button', { name: '← 返回', exact: true }).click();
  await page.getByRole('button', { name: /新手讀書交流活動/ }).click();
  await expect(page).toHaveURL(new RegExp(`/activities/${id}$`));
  await noOverflow(page);
});

test('UAT-03 知識庫新增修改刪除與持久保存', async ({ page }) => {
  await register(page); await createActivity(page);
  await page.getByRole('button', { name: '知識庫', exact: true }).click();
  await page.getByRole('button', { name: '+ 新增知識條目' }).click();
  await expect(page.getByRole('button', { name: '新增', exact: true })).toBeDisabled();
  await page.getByPlaceholder('例：主角 — 艾瑞克').fill('活動背景');
  await page.getByPlaceholder('詳細描述此知識條目的內容...').fill('在圖書館分享喜歡的書。');
  await page.getByRole('button', { name: '新增', exact: true }).click();
  await expect(page.getByText('活動背景', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '編輯', exact: true }).click();
  await page.locator('main input:not([type=checkbox])').fill('修改後背景');
  await page.locator('textarea').fill('改在社區圖書館。');
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page.getByText('修改後背景', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '知識庫', exact: true }).click();
  await expect(page.getByText('改在社區圖書館。', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '刪除', exact: true }).click();
  await expect(page.getByText('修改後背景', { exact: true })).toHaveCount(0);
});

test('UAT-04 AI 對話、知識萃取及三則排程', async ({ page }) => {
  await register(page); const id = await createActivity(page);
  await chat(page, '你好，可以協助我嗎？');
  await expect(page.getByText('你好！我可以協助整理活動資訊、萃取知識與規劃推播（本機模擬）。')).toBeVisible();
  await chat(page, '請萃取知識：活動在圖書館，每人帶一本書。');
  await expect(page.getByText('已記下活動資訊（本機模擬）。', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '知識庫', exact: true }).click();
  await expect(page.getByText('AI 萃取的活動資訊', { exact: true })).toBeVisible();
  await page.reload();
  await plan(page);
  const saved = await api(page, `/api/activities/${id}/messages`);
  expect(saved.data.messages).toHaveLength(3);
  expect(saved.data.messages.every((m: { reviewStatus: string; generatedByAgent: boolean; targetGroups: string[] }) => m.reviewStatus === 'pending_review' && m.generatedByAgent && m.targetGroups.length === 1)).toBe(true);
  await noOverflow(page);
});

test('UAT-05 排程編輯刪除、核准鎖定與修改暫停', async ({ page }) => {
  await register(page); const id = await createActivity(page); await plan(page);
  await editFirst(page, '編輯後的活動提醒');
  await expect(page.getByText('編輯後的活動提醒', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '刪除', exact: true }).nth(1).click();
  await expect(page.getByRole('button', { name: '編輯', exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: '核准企畫', exact: true }).click();
  await expect(page.getByText('企畫已核准', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '編輯', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '要求修改', exact: true }).click();
  await expect(page.getByText('修改中 — 待發訊息已暫停', { exact: true })).toBeVisible();
  expect((await api(page, `/api/activities/${id}/messages`)).data.messages.every((m: { reviewStatus: string }) => m.reviewStatus === 'pending_review')).toBe(true);
  await editFirst(page, '重新核准的活動提醒');
  await page.getByRole('button', { name: '重新核准', exact: true }).click();
  await expect(page.getByText('企畫已核准', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /推播企畫/ }).click();
  await expect(page.getByText('重新核准的活動提醒', { exact: true })).toBeVisible();
});

test('UAT-06 審核後發送、活動記錄與去重', async ({ page }) => {
  await register(page); const id = await createActivity(page); await plan(page);
  await editFirst(page, '立即發送驗收', '2026-01-01T10:00:00+08:00');
  await expect(page.getByText('立即發送驗收', { exact: true })).toBeVisible();
  await api(page, '/scheduler/tick', 'POST');
  expect((await api(page, `/api/send-logs?activityId=${id}`)).data.logs).toHaveLength(0);
  await page.getByRole('button', { name: '核准企畫', exact: true }).click();
  await expect.poll(async () => (await api(page, `/api/send-logs?activityId=${id}`)).data.logs.length).toBe(1);
  await page.getByRole('button', { name: '發送紀錄', exact: true }).click();
  await expect(page.getByText('立即發送驗收', { exact: true })).toBeVisible();
  await expect(page.getByText('成功', { exact: true })).toBeVisible();
  await api(page, '/scheduler/tick', 'POST');
  expect((await api(page, `/api/send-logs?activityId=${id}`)).data.logs).toHaveLength(1);
  await page.getByRole('link', { name: '記錄', exact: true }).click();
  await expect(page.getByText('立即發送驗收', { exact: true })).toBeVisible();
  await expect(page.getByText('排程', { exact: true })).toBeVisible();
});

test('UAT-07 群組近期訊息與單群回覆', async ({ page }) => {
  await register(page);
  await page.getByText('UAT 讀書會', { exact: true }).click();
  await expect(page.getByText('測試夥伴', { exact: true })).toBeVisible();
  await expect(page.getByText('歡迎加入本機測試群組', { exact: true }).last()).toBeVisible();
  await page.getByPlaceholder('輸入訊息...', { exact: true }).fill('手動回覆驗收');
  await page.getByRole('button', { name: '發送', exact: true }).click();
  await expect(page.getByPlaceholder('輸入訊息...', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: '←', exact: true }).click();
  await page.getByRole('link', { name: '記錄', exact: true }).click();
  await expect(page.getByText('手動回覆驗收', { exact: true })).toBeVisible();
  await expect(page.getByText('手動', { exact: true })).toBeVisible();
});

test('UAT-08 多群廣播、預覽及個別微調', async ({ page }) => {
  await register(page);
  await page.getByRole('button', { name: '廣播', exact: true }).click();
  await expect(page.getByRole('button', { name: '廣播 (0)', exact: true })).toBeDisabled();
  await page.getByText('UAT 讀書會', { exact: true }).click();
  await page.getByText('UAT 工作坊', { exact: true }).click();
  await page.getByRole('button', { name: '廣播 (2)', exact: true }).click();
  await page.getByPlaceholder('輸入訊息內容...').fill('廣播共同提醒');
  await page.getByRole('button', { name: '下一步：各群組微調 →' }).click();
  await expect(page.locator('textarea')).toHaveCount(2);
  await page.locator('textarea').first().fill('廣播個別提醒');
  await page.getByRole('button', { name: '確認發送至 2 個群組' }).click();
  await expect(page.getByText('✓ 成功', { exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await page.getByRole('link', { name: '記錄', exact: true }).click();
  await expect(page.getByText('廣播共同提醒', { exact: true })).toBeVisible();
  await expect(page.getByText('廣播個別提醒', { exact: true })).toBeVisible();
  await expect(page.getByText('廣播', { exact: true })).toHaveCount(2);
});

test('UAT-09 LINE 與 AI 失敗回饋及重試', async ({ page }) => {
  await register(page);
  await page.getByText('UAT 讀書會', { exact: true }).click();
  const reply = page.getByPlaceholder('輸入訊息...', { exact: true });
  await reply.fill('[模擬失敗] 手動訊息');
  await page.getByRole('button', { name: '發送', exact: true }).click();
  await expect(page.getByText(/本機模擬：LINE 暫時無法發送/)).toBeVisible();
  await expect(reply).toHaveValue('[模擬失敗] 手動訊息');
  await reply.fill('重試成功');
  await page.getByRole('button', { name: '發送', exact: true }).click();
  await expect(reply).toHaveValue('');
  await page.getByRole('button', { name: '←', exact: true }).click();
  await page.getByRole('link', { name: '記錄', exact: true }).click();
  await expect(page.getByText('失敗', { exact: true })).toBeVisible();
  await createActivity(page);
  await chat(page, '[模擬失敗] AI 問題');
  await expect(page.getByText('Agent request failed', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('輸入訊息... (Enter 送出，Shift+Enter 換行)')).toHaveValue('[模擬失敗] AI 問題');
  await chat(page, '你好');
  await expect(page.getByText('你好！我可以協助整理活動資訊、萃取知識與規劃推播（本機模擬）。')).toBeVisible();
});

test('UAT-10 LIFF mock 入口、無群組與分享失敗', async ({ page }) => {
  await page.goto('/uat/liff?mockPreset=default&liff.state=%2F%3FactivityId%3Duat-demo');
  await expect(page.getByRole('heading', { name: 'LIFF 本機檢查' })).toBeVisible();
  await expect(page.getByText('Dev User', { exact: true })).toBeVisible();
  await expect(page.getByText('Cdev1', { exact: true })).toBeVisible();
  await expect(page.getByText('uat-demo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '測試分享' }).click();
  await expect(page.getByRole('status')).toContainText(/sent|shared|cancelled/);
  await page.goto('/uat/liff?mockPreset=no_group');
  await expect(page.getByText('請從 LINE 群組開啟活動連結', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '測試分享' })).toBeDisabled();
  await page.goto('/uat/liff?mockPreset=share_unavailable');
  await page.getByRole('button', { name: '測試分享' }).click();
  await expect(page.getByRole('alert')).toContainText('LINE 分享功能不可用');
  await noOverflow(page);
});

test('UAT-11 跨帳號資料與廣播隔離', async ({ page, browser }) => {
  await register(page); const id = await createActivity(page);
  const ownGroups = (await api(page, '/api/groups')).data.groups;
  const foreignId = ownGroups[0].groupId;
  const contextB = await browser.newContext({ baseURL: 'http://127.0.0.1:4121', viewport: page.viewportSize()! });
  const b = await contextB.newPage();
  try {
    await register(b);
    const victimUid = await b.evaluate(async () => { const helper = '/e2e/firestore-client.ts'; return (await import(helper)).currentUid(); });
    const victimGroup = (await api(b, '/api/groups')).data.groups[0].groupId;
    const forgery = await page.evaluate(async args => {
      const helper = '/e2e/firestore-client.ts';
      return (await import(helper)).attemptOwnershipForgery(args.id, args.victimUid, args.victimGroup);
    }, { id, victimUid, victimGroup });
    expect(forgery).toEqual({ message: 'permission-denied', ownership: 'permission-denied' });
    await b.goto(`/activities/${id}`);
    await expect(b.getByRole('alert')).toHaveText('找不到活動，可能已被移除或你沒有查看權限');
    expect((await api(b, `/api/activities/${id}`)).status).toBe(404);
    expect((await api(b, `/api/groups/${foreignId}/messages`)).status).toBe(404);
    expect((await api(b, '/api/broadcast/preview', 'POST', { groupIds: [foreignId], content: '越權預覽' })).status).toBe(404);
    expect((await api(b, '/api/broadcast/multi', 'POST', { messages: [{ groupId: foreignId, content: '越權發送' }] })).status).toBe(404);
    expect((await api(b, '/api/send-logs')).data.logs).toHaveLength(0);
    await b.getByRole('button', { name: '返回活動列表' }).click();
    await expect(b.getByRole('heading', { name: '活動列表' })).toBeVisible();
  } finally { await contextB.close(); }
  const unauth = await page.request.get('/api/activities');
  expect(unauth.status()).toBe(401);
  await expect(page.getByRole('heading', { name: '新手讀書交流活動' })).toBeVisible();
});

test('UAT-12 新手探索：無效內容時間與空企畫核准', async ({ page }) => {
  await register(page); const id = await createActivity(page, false);
  await expect(page.getByRole('button', { name: '核准企畫', exact: true })).toHaveCount(0);
  const withoutGroups = await api(page, `/api/activities/${id}/approve`, 'PATCH');
  expect(withoutGroups.status).toBe(400);
  expect(withoutGroups.data.error).toContain('請至少選擇一個目標群組');
  await page.getByRole('checkbox', { name: 'UAT 讀書會' }).check();
  await expect(page.getByText('已選 1 個', { exact: true })).toBeVisible();
  const withoutMessages = await api(page, `/api/activities/${id}/approve`, 'PATCH');
  expect(withoutMessages.status).toBe(400);
  expect(withoutMessages.data.error).toContain('請先建立推播訊息');
  await plan(page);
  await page.getByRole('button', { name: '編輯', exact: true }).first().click();
  await page.locator('textarea').fill('   ');
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page.getByText('訊息內容不可為空', { exact: true })).toBeVisible();
  await page.locator('textarea').fill('合法內容');
  await page.getByText('進階：輸入含時區的時間', { exact: true }).click();
  await page.getByPlaceholder('2025-05-10T10:00:00+08:00').fill('不是時間');
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page.getByText('請輸入有效的 ISO 發送時間', { exact: true })).toBeVisible();
  expect((await api(page, `/api/activities/${id}/messages`)).data.messages[0].content).toBe('本機活動提醒 1：歡迎參加活動！');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  const activity = (await api(page, `/api/activities/${id}`)).data.activity;
  expect((await api(page, `/api/activities/${id}/messages`, 'POST', {
    content: '關鍵字原始內容', targetGroups: activity.targetGroups,
    triggerType: 'keyword', triggerValue: '報名', sequenceOrder: 4,
  })).status).toBe(201);
  await page.reload();
  await page.getByRole('button', { name: /推播企畫/ }).click();
  await page.getByRole('button', { name: '編輯', exact: true }).last().click();
  await expect(page.getByPlaceholder('例：報名')).toHaveValue('報名');
  await page.locator('textarea').fill('關鍵字修改後內容');
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page.getByText('關鍵字修改後內容', { exact: true })).toBeVisible();
  await noOverflow(page);
});

test('UAT-13 探索：對話切換分頁及重整仍可接續', async ({ page }) => {
  await register(page); await createActivity(page);
  await chat(page, '第一次辦活動，請問有什麼建議？');
  await expect(page.getByText('你好！我可以協助整理活動資訊、萃取知識與規劃推播（本機模擬）。')).toBeVisible();
  await page.getByRole('button', { name: '知識庫', exact: true }).click();
  await page.getByRole('button', { name: 'Agent 對話', exact: true }).click();
  await expect(page.getByText('第一次辦活動，請問有什麼建議？', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('第一次辦活動，請問有什麼建議？', { exact: true })).toBeVisible();
  await chat(page, '謝謝你的建議');
  await expect(page.getByText('你好！我可以協助整理活動資訊、萃取知識與規劃推播（本機模擬）。')).toHaveCount(2);
});

test('UAT-14 探索：更換活動群組同步待發訊息並重新審核', async ({ page }) => {
  await register(page); const id = await createActivity(page); await plan(page);
  await page.getByRole('button', { name: '核准企畫', exact: true }).click();
  await expect(page.getByText('企畫已核准', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'UAT 工作坊' }).check();
  await expect(page.getByText('修改中 — 待發訊息已暫停', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'UAT 讀書會' }).uncheck();
  await expect(page.getByText('已選 1 個', { exact: true })).toBeVisible();
  const activity = (await api(page, `/api/activities/${id}`)).data.activity;
  const messages = (await api(page, `/api/activities/${id}/messages`)).data.messages;
  expect(messages).toHaveLength(3);
  for (const msg of messages) {
    expect(msg.targetGroups).toEqual(activity.targetGroups);
    expect(msg.reviewStatus).toBe('pending_review');
  }
  await page.getByRole('button', { name: '重新核准', exact: true }).click();
  await expect(page.getByText('企畫已核准', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'UAT 工作坊' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'UAT 讀書會' })).not.toBeChecked();
  // An already claimed send must finish before recipients can be changed.
  await page.getByRole('button', { name: /推播企畫/ }).click();
  await page.getByRole('button', { name: '要求修改', exact: true }).click();
  await editFirst(page, '[延遲發送] 已開始的發送', '2026-01-01T10:00:00+08:00');
  await page.getByRole('button', { name: '重新核准', exact: true }).click();
  try {
    await expect.poll(async () => Boolean((await api(page, `/api/activities/${id}/messages`)).data.messages[0].processingAt)).toBe(true);
    await page.getByRole('checkbox', { name: 'UAT 讀書會' }).check();
    await expect(page.getByText(/訊息正在發送，請稍後再修改群組/)).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'UAT 讀書會' })).not.toBeChecked();
  } finally {
    const released = await api(page, '/api/__uat/release-line', 'POST', { groupId: activity.targetGroups[0] });
    expect(released.status).toBe(200);
    expect(released.data.released).toBe(true);
  }
  await expect.poll(async () => (await api(page, `/api/send-logs?activityId=${id}`)).data.logs.length).toBe(1);
});

test('UAT-15 探索：UTC 未到期不發送、同時觸發不重複', async ({ page }) => {
  await register(page); const id = await createActivity(page); await plan(page);
  const futureUtc = new Date(Date.now() + 3600000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  await editFirst(page, '一小時後才發送', futureUtc);
  await expect(page.getByText('一小時後才發送', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '核准企畫', exact: true }).click();
  await expect(page.getByText('企畫已核准', { exact: true })).toBeVisible();
  await api(page, '/scheduler/tick', 'POST');
  expect((await api(page, `/api/send-logs?activityId=${id}`)).data.logs).toHaveLength(0);
  await page.getByRole('button', { name: '要求修改', exact: true }).click();
  await editFirst(page, '同時觸發只發一則', '2026-01-01T10:00:00+08:00');
  await page.getByRole('button', { name: '重新核准', exact: true }).click();
  await expect(page.getByText('企畫已核准', { exact: true })).toBeVisible();
  await Promise.all(Array.from({ length: 4 }, () => api(page, '/scheduler/tick', 'POST')));
  await expect.poll(async () => (await api(page, `/api/send-logs?activityId=${id}`)).data.logs.length).toBe(1);
  const logs = (await api(page, `/api/send-logs?activityId=${id}`)).data.logs;
  expect(logs[0].content).toBe('同時觸發只發一則');
  expect(logs[0].status).toBe('success');
  await page.getByRole('button', { name: '發送紀錄', exact: true }).click();
  await expect(page.getByText('同時觸發只發一則', { exact: true })).toHaveCount(1);
});

test('UAT-16 探索：知識編輯必填、API 防呆與合法保存', async ({ page }) => {
  await register(page); const id = await createActivity(page);
  await addKnowledge(page, '不可清空的背景', '原始活動背景');
  await page.getByRole('button', { name: '編輯', exact: true }).click();
  const title = page.locator('main input:not([type=checkbox])');
  await title.fill('   ');
  await expect(page.getByRole('button', { name: '儲存', exact: true })).toBeDisabled();
  await title.fill('合法的新標題');
  await page.locator('textarea').fill('   ');
  await expect(page.getByRole('button', { name: '儲存', exact: true })).toBeDisabled();
  const knowledge = (await api(page, `/api/activities/${id}/knowledge`)).data.knowledge[0];
  for (const patch of [{ title: ' ' }, { content: ' ' }, { title: 42 }, { content: null }]) {
    expect((await api(page, `/api/activities/${id}/knowledge/${knowledge.id}`, 'PATCH', patch)).status).toBe(400);
  }
  const unchanged = (await api(page, `/api/activities/${id}/knowledge`)).data.knowledge[0];
  expect(unchanged.title).toBe('不可清空的背景');
  expect(unchanged.content).toBe('原始活動背景');
  await page.locator('textarea').fill('合法的新背景');
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page.getByText('合法的新標題', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '知識庫', exact: true }).click();
  await expect(page.getByText('合法的新背景', { exact: true })).toBeVisible();
  await noOverflow(page);
});

test('UAT-17 探索：離線知識操作與活動記錄可復原', async ({ page, context }) => {
  await register(page); const id = await createActivity(page);
  try {
    await page.getByRole('button', { name: '知識庫', exact: true }).click();
    await page.getByRole('button', { name: '+ 新增知識條目' }).click();
    await page.getByPlaceholder('例：主角 — 艾瑞克').fill('斷線新增背景');
    await page.getByPlaceholder('詳細描述此知識條目的內容...').fill('離線不應丟失的內容');
    await context.setOffline(true);
    await page.getByRole('button', { name: '新增', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('新增失敗');
    await expect(page.getByPlaceholder('詳細描述此知識條目的內容...')).toHaveValue('離線不應丟失的內容');
    await context.setOffline(false);
    await page.getByRole('button', { name: '新增', exact: true }).click();
    await expect(page.getByText('斷線新增背景', { exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect((await api(page, `/api/activities/${id}/knowledge`)).data.knowledge).toHaveLength(1);

    await page.getByRole('button', { name: '編輯', exact: true }).click();
    await page.locator('textarea').fill('斷線修改後內容');
    await context.setOffline(true);
    await page.getByRole('button', { name: '儲存', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('儲存失敗');
    await expect(page.locator('textarea')).toHaveValue('斷線修改後內容');
    await context.setOffline(false);
    await page.getByRole('button', { name: '儲存', exact: true }).click();
    await expect(page.getByText('斷線修改後內容', { exact: true })).toBeVisible();

    await context.setOffline(true);
    await page.getByRole('button', { name: '刪除', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('刪除失敗');
    await expect(page.getByText('斷線新增背景', { exact: true })).toBeVisible();
    await context.setOffline(false);
    await page.getByRole('button', { name: '刪除', exact: true }).click();
    await expect(page.getByText('斷線新增背景', { exact: true })).toHaveCount(0);

    // Use a real scheduled send so recovered history must show actual persisted data.
    await plan(page);
    await editFirst(page, '離線恢復後的發送紀錄', '2026-01-01T10:00:00+08:00');
    await page.getByRole('button', { name: '核准企畫', exact: true }).click();
    await expect.poll(async () => (await api(page, `/api/send-logs?activityId=${id}`)).data.logs.length).toBe(1);
    await context.setOffline(true);
    await page.getByRole('button', { name: '發送紀錄', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('無法載入發送紀錄');
    await expect(page.getByText('尚無發送紀錄', { exact: true })).toHaveCount(0);
    await context.setOffline(false);
    await page.getByRole('button', { name: '重試', exact: true }).click();
    await expect(page.getByText('離線恢復後的發送紀錄', { exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await context.setOffline(true);
    await page.getByRole('link', { name: '記錄', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('無法載入發送紀錄');
    await expect(page.getByText('尚無發送記錄', { exact: true })).toHaveCount(0);
    await context.setOffline(false);
    await page.getByRole('button', { name: '重試', exact: true }).click();
    await expect(page.getByText('離線恢復後的發送紀錄', { exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await noOverflow(page);
  } finally { await context.setOffline(false); }
});

test('UAT-18 探索：中文選字 Enter 不提前建立或發送', async ({ page }) => {
  await register(page);
  await page.getByRole('link', { name: '活動', exact: true }).click();
  await page.getByRole('button', { name: '+ 新增活動' }).click();
  const name = page.getByPlaceholder('活動名稱');
  await name.fill('中文輸入中的活動');
  await name.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true, bubbles: true });
  await expect(page.getByRole('button', { name: '建立', exact: true })).toBeEnabled();
  expect((await api(page, '/api/activities')).data.activities).toHaveLength(0);
  await expect(name).toHaveValue('中文輸入中的活動');
  await name.press('Enter');
  await expect(page.getByRole('heading', { name: '中文輸入中的活動' })).toBeVisible();

  const input = page.getByPlaceholder('輸入訊息... (Enter 送出，Shift+Enter 換行)');
  await input.fill('還在選字的活動建議');
  await input.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true, bubbles: true });
  await input.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 229, bubbles: true });
  await expect(page.getByRole('button', { name: '送出', exact: true })).toBeEnabled();
  await expect(input).toHaveValue('還在選字的活動建議');
  await expect(page.getByText('還在選字的活動建議', { exact: true }).and(page.locator('div'))).toHaveCount(0);
  await input.press('Enter');
  await expect(page.getByText('還在選字的活動建議', { exact: true })).toBeVisible();
  await expect(page.getByText('你好！我可以協助整理活動資訊、萃取知識與規劃推播（本機模擬）。')).toHaveCount(1);

  await page.getByRole('link', { name: '群組', exact: true }).click();
  await page.getByText('UAT 讀書會', { exact: true }).click();
  const reply = page.getByPlaceholder('輸入訊息...', { exact: true });
  await reply.fill('還在選字的群組回覆');
  await reply.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true, bubbles: true });
  await expect(page.getByRole('button', { name: '發送', exact: true })).toBeEnabled();
  await expect(reply).toHaveValue('還在選字的群組回覆');
  expect((await api(page, '/api/send-logs')).data.logs).toHaveLength(0);
  await reply.press('Enter');
  await expect(reply).toHaveValue('');
  const logs = (await api(page, '/api/send-logs')).data.logs;
  expect(logs).toHaveLength(1);
  expect(logs[0].content).toBe('還在選字的群組回覆');
  await noOverflow(page);
});

test('UAT-19 新手用日期時間選擇器設定推播，時區與資料保存正確', async ({ page }) => {
  await register(page); const id = await createActivity(page); await plan(page);
  await page.getByRole('button', { name: '編輯', exact: true }).first().click();
  const picker = page.getByLabel('發送日期與時間');
  await expect(picker).toHaveAttribute('type', 'datetime-local');
  await picker.fill('2035-11-12T18:30:17');
  const saved = page.waitForResponse(response => response.request().method() === 'PATCH'
    && response.url().includes(`/api/activities/${id}/messages/`));
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  expect((await saved).status()).toBe(200);
  await expect(picker).toHaveCount(0);
  const messages = (await api(page, `/api/activities/${id}/messages`)).data.messages;
  expect(Date.parse(messages[0].triggerValue)).toBe(Date.parse('2035-11-12T18:30:17+08:00'));
  await page.reload();
  await page.getByRole('button', { name: /推播企畫/ }).click();
  await page.getByRole('button', { name: '編輯', exact: true }).first().click();
  await expect(picker).toHaveValue('2035-11-12T18:30:17');
  await picker.fill('');
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('請選擇發送日期與時間');
  expect(Date.parse((await api(page, `/api/activities/${id}/messages`)).data.messages[0].triggerValue)).toBe(Date.parse('2035-11-12T18:30:17+08:00'));
  await noOverflow(page);
});

test('UAT-20 第一個活動先引導 AI 產生企畫，再顯示核准操作', async ({ page }) => {
  await register(page); const id = await createActivity(page);
  await expect(page.getByRole('button', { name: '核准企畫', exact: true })).toHaveCount(0);
  await expect(page.getByText('先建立推播企畫', { exact: true })).toBeVisible();
  const firstPlan = page.getByRole('button', { name: '請 AI 規劃第一份推播', exact: true });
  await expect(firstPlan).toHaveCount(1);
  await firstPlan.click();
  await expect(page.getByRole('button', { name: '編輯', exact: true })).toHaveCount(3);
  await expect(page.getByRole('button', { name: '核准企畫', exact: true })).toBeVisible();
  expect((await api(page, `/api/activities/${id}/messages`)).data.messages).toHaveLength(3);
  expect((await api(page, `/api/send-logs?activityId=${id}`)).data.logs).toHaveLength(0);
  await noOverflow(page);
});

test('UAT-21 LINE 空群組提供操作指引與重新載入，失敗可復原', async ({ page, context }) => {
  await register(page);
  const groups = (await api(page, '/api/groups')).data.groups;
  const fixtureDocs: Array<{ url: string; data: unknown }> = [];
  for (const group of groups) {
    const url = `http://127.0.0.1:4124/v1/projects/demo-wippy-uat/databases/(default)/documents/groups/${group.groupId}`;
    const response = await page.request.get(url, { headers: { Authorization: 'Bearer owner' } });
    expect(response.ok()).toBe(true);
    fixtureDocs.push({ url, data: await response.json() });
    expect((await page.request.delete(url, { headers: { Authorization: 'Bearer owner' } })).ok()).toBe(true);
  }
  await page.reload();
  await expect(page.getByRole('heading', { name: '連結 LINE 群組', exact: true })).toBeVisible();
  await expect(page.getByText(/邀請 WiPPY 的 LINE 官方帳號加入/)).toBeVisible();
  await expect(page.getByText(/傳送一則文字訊息/)).toBeVisible();
  await expect(page.getByRole('button', { name: '廣播', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: '活動', exact: true }).click();
  await page.getByRole('button', { name: '+ 新增活動' }).click();
  await page.getByRole('link', { name: '前往群組設定', exact: true }).click();
  await expect(page.getByRole('heading', { name: '連結 LINE 群組', exact: true })).toBeVisible();
  await createActivity(page, false);
  await page.getByRole('link', { name: '前往群組設定', exact: true }).click();
  await expect(page.getByRole('heading', { name: '連結 LINE 群組', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('button', { name: '重新載入群組', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('無法載入群組');
  await context.setOffline(false);
  for (const fixture of fixtureDocs) {
    expect((await page.request.patch(fixture.url, { headers: { Authorization: 'Bearer owner' }, data: fixture.data })).ok()).toBe(true);
  }
  await page.getByRole('button', { name: '重新載入群組', exact: true }).click();
  await expect(page.getByText('UAT 讀書會', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '廣播', exact: true })).toBeEnabled();
  await createActivity(page, false);
  await page.getByRole('checkbox', { name: 'UAT 讀書會' }).check();
  await expect(page.getByText('已選 1 個', { exact: true })).toBeVisible();
  await noOverflow(page);
});

test('UAT-22 斷線不誤報活動消失，載入與建立都能原地重試', async ({ page, context }) => {
  await register(page); const id = await createActivity(page);
  await page.getByRole('button', { name: '← 返回', exact: true }).click();
  const card = page.getByRole('button', { name: /新手讀書交流活動/ });
  await expect(card).toBeVisible();
  await context.setOffline(true);
  await card.click();
  await expect(page.getByRole('alert')).toContainText('無法載入活動，請檢查網路連線後重試');
  await expect(page.getByText('找不到活動', { exact: true })).toHaveCount(0);
  const retry = page.getByRole('button', { name: '重試', exact: true });
  await expect(retry).toHaveCount(1);
  const retryBox = (await retry.boundingBox())!;
  const returnBox = (await page.getByRole('button', { name: '返回活動列表', exact: true }).boundingBox())!;
  expect(returnBox.y >= retryBox.y + retryBox.height + 8 || returnBox.x >= retryBox.x + retryBox.width + 8,
    '重試與返回活動列表必須分開，讓新手可辨認主要操作').toBe(true);
  await context.setOffline(false);
  await page.getByRole('button', { name: '重試', exact: true }).click();
  await expect(page.getByRole('heading', { name: '新手讀書交流活動' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('link', { name: '群組', exact: true }).click();
  await expect(page.getByText('UAT 讀書會', { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('link', { name: '活動', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('無法載入活動列表，請檢查網路連線後重試');
  await expect(page.getByText('尚無活動', { exact: true })).toHaveCount(0);
  await context.setOffline(false);
  await page.getByRole('button', { name: '重試', exact: true }).click();
  await expect(card).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: '+ 新增活動' }).click();
  await page.getByPlaceholder('活動名稱').fill('網路恢復後的第一場工作坊');
  await page.getByRole('checkbox', { name: 'UAT 工作坊' }).check();
  await context.setOffline(true);
  await page.getByRole('button', { name: '建立', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('無法建立活動，請檢查網路連線後重試');
  await expect(page.getByPlaceholder('活動名稱')).toHaveValue('網路恢復後的第一場工作坊');
  await expect(page.getByRole('checkbox', { name: 'UAT 工作坊' })).toBeChecked();
  await context.setOffline(false);
  await page.getByRole('button', { name: '建立', exact: true }).click();
  await expect(page.getByRole('heading', { name: '網路恢復後的第一場工作坊' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  const activities = (await api(page, '/api/activities')).data.activities;
  expect(activities).toHaveLength(2);
  expect(activities.filter((activity: { name: string }) => activity.name === '網路恢復後的第一場工作坊')).toHaveLength(1);
  expect(activities.some((activity: { id: string }) => activity.id === id)).toBe(true);
  await page.goto('/activities/nonexistent-uat-activity');
  await expect(page.getByRole('alert')).toContainText('找不到活動，可能已被移除或你沒有查看權限');
  await page.getByRole('button', { name: '返回活動列表', exact: true }).click();
  await expect(card).toBeVisible();
  await noOverflow(page);
});

test('UAT-23 斷線刪除與編輯企畫可復原，不遺失待發訊息或草稿', async ({ page, context }) => {
  await register(page); const id = await createActivity(page); await plan(page);
  const original = (await api(page, `/api/activities/${id}/messages`)).data.messages;
  await context.setOffline(true);
  await page.getByRole('button', { name: '刪除', exact: true }).first().click();
  await expect(page.getByRole('alert')).toContainText('刪除失敗，請檢查網路連線後重試');
  await expect(page.getByRole('button', { name: '刪除', exact: true })).toHaveCount(3);
  await expect(page.getByText(original[0].content, { exact: true })).toBeVisible();
  await context.setOffline(false);
  expect((await api(page, `/api/activities/${id}/messages`)).data.messages).toHaveLength(3);
  await page.getByRole('button', { name: '刪除', exact: true }).first().click();
  await expect(page.getByRole('button', { name: '刪除', exact: true })).toHaveCount(2);
  await expect(page.getByRole('alert')).toHaveCount(0);
  const remaining = (await api(page, `/api/activities/${id}/messages`)).data.messages;
  expect(remaining.map((message: { id: string }) => message.id).sort()).toEqual(original.slice(1).map((message: { id: string }) => message.id).sort());
  await page.getByRole('button', { name: '編輯', exact: true }).first().click();
  await page.getByLabel('發送日期與時間').fill('2035-11-12T18:30:17');
  await page.locator('textarea').fill('手機斷線仍保留的提醒草稿');
  await context.setOffline(true);
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('儲存失敗，請檢查網路連線後重試');
  await expect(page.locator('textarea')).toHaveValue('手機斷線仍保留的提醒草稿');
  await expect(page.getByLabel('發送日期與時間')).toHaveValue('2035-11-12T18:30:17');
  await context.setOffline(false);
  expect((await api(page, `/api/activities/${id}/messages`)).data.messages[0].content).toBe(original[1].content);
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText('手機斷線仍保留的提醒草稿', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /推播企畫/ }).click();
  await expect(page.getByText('手機斷線仍保留的提醒草稿', { exact: true })).toBeVisible();
  const saved = (await api(page, `/api/activities/${id}/messages`)).data.messages;
  expect(saved).toHaveLength(2);
  expect(Date.parse(saved[0].triggerValue)).toBe(Date.parse('2035-11-12T18:30:17+08:00'));
  expect((await api(page, `/api/send-logs?activityId=${id}`)).data.logs).toHaveLength(0);
  await noOverflow(page);
});

test('UAT-24 首次登入的帳號資料連線失敗可理解、可重試，不停在處理中', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: '還沒有帳號？免費註冊' }).click();
  await page.evaluate(async () => {
    const helper = '/e2e/firestore-client.ts';
    await (await import(helper)).setFirestoreOnline(false);
  });
  await page.getByPlaceholder('Email', { exact: true }).fill(`profile-${crypto.randomUUID()}@example.test`);
  await page.getByPlaceholder('密碼', { exact: true }).fill(fixturePassword);
  await page.getByRole('button', { name: '建立帳號', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('無法載入帳號資料，請檢查網路連線後重試');
  const retry = page.getByRole('button', { name: '重試載入帳號', exact: true });
  await expect(retry).toHaveCount(1);
  await expect(page.getByRole('button', { name: '處理中...', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '群組', exact: true })).toHaveCount(0);
  await page.evaluate(async () => {
    const helper = '/e2e/firestore-client.ts';
    await (await import(helper)).setFirestoreOnline(true);
  });
  await retry.click();
  await expect(page.getByRole('heading', { name: '群組', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  const uid = await page.evaluate(async () => { const helper = '/e2e/firestore-client.ts'; return (await import(helper)).currentUid(); });
  const userDoc = await page.request.get(`http://127.0.0.1:4124/v1/projects/demo-wippy-uat/databases/(default)/documents/users/${uid}`, { headers: { Authorization: 'Bearer owner' } });
  expect(userDoc.ok()).toBe(true);
  expect((await userDoc.json()).fields.timezone.stringValue).toBe('Asia/Taipei');
  await page.reload();
  await expect(page.getByRole('heading', { name: '群組', exact: true })).toBeVisible();
  await createActivity(page);
  await noOverflow(page);
});

test('UAT-32 帳號資料長時間無回應時可重試，不持續停在載入中', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: '還沒有帳號？免費註冊' }).click();
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const pattern = '**/google.firestore.v1.Firestore/**';
  await page.route(pattern, async route => { await held; await route.abort().catch(() => {}); });
  try {
    await page.getByPlaceholder('Email', { exact: true }).fill(`slow-profile-${crypto.randomUUID()}@example.test`);
    await page.getByPlaceholder('密碼', { exact: true }).fill(fixturePassword);
    await page.getByRole('button', { name: '建立帳號', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('無法載入帳號資料，請檢查網路連線後重試');
    await expect(page.getByRole('button', { name: '重試載入帳號', exact: true })).toHaveCount(1);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
  await page.getByRole('button', { name: '重試載入帳號', exact: true }).click();
  await expect(page.getByRole('heading', { name: '群組', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('UAT-25 無群組企畫先引導選擇收件群組，選妥才可核准或重新核准', async ({ page }) => {
  await register(page); const id = await createActivity(page, false); await plan(page);
  for (const label of ['核准企畫', '重新核准']) {
    await expect(page.getByRole('button', { name: label, exact: true })).toBeDisabled();
    await expect(page.getByText('請先在上方選擇至少一個目標群組，再核准企畫。', { exact: true })).toBeVisible();
    const rejected = await api(page, `/api/activities/${id}/approve`, 'PATCH');
    expect(rejected.status).toBe(400);
    expect(rejected.data.error).toContain('請至少選擇一個目標群組');
    expect((await api(page, `/api/send-logs?activityId=${id}`)).data.logs).toHaveLength(0);
    await page.getByRole('checkbox', { name: 'UAT 讀書會' }).check();
    await expect(page.getByText('已選 1 個', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /核准/, exact: false })).toBeEnabled();
    await page.getByRole('button', { name: /核准/, exact: false }).click();
    await expect(page.getByText('企畫已核准', { exact: true })).toBeVisible();
    if (label === '核准企畫') {
      await page.getByRole('checkbox', { name: 'UAT 讀書會' }).uncheck();
      await expect(page.getByText('修改中 — 待發訊息已暫停', { exact: true })).toBeVisible();
    }
  }
  await page.reload();
  await expect(page.getByText('企畫已核准', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'UAT 讀書會' })).toBeChecked();
  await noOverflow(page);
});

test('UAT-26 AI 斷線用中文說明並保留草稿，重試僅保存一份對話', async ({ page, context }) => {
  await register(page); await createActivity(page);
  const text = '請協助把活動說明寫得適合第一次參加的家長';
  const input = page.getByPlaceholder('輸入訊息... (Enter 送出，Shift+Enter 換行)');
  await input.fill(text);
  try {
    await context.setOffline(true);
    const failed = page.waitForEvent('requestfailed', request => request.method() === 'POST' && request.url().includes('/agent/'));
    await page.getByRole('button', { name: '送出', exact: true }).click();
    await failed;
    await expect(page.getByRole('alert')).toHaveText('無法連線至 AI 助理，請檢查網路連線後重新送出；輸入內容已保留');
    await expect(input).toHaveValue(text);
    await expect(page.getByText('TypeFailed to fetch', { exact: true })).toHaveCount(0);
    await context.setOffline(false);
    let sends = 0;
    page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/agent/')) sends++; });
    await page.getByRole('button', { name: '送出', exact: true }).click();
    await expect(page.getByText(/你好！我可以協助整理活動資訊/)).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(input).toHaveValue('');
    await expect(page.getByText(text, { exact: true })).toHaveCount(1);
    expect(sends).toBe(1);
    await page.reload();
    await expect(page.getByText(text, { exact: true })).toHaveCount(1);
    await expect(page.getByText(/你好！我可以協助整理活動資訊/)).toBeVisible();
    await noOverflow(page);
  } finally { await context.setOffline(false); }
});

test('UAT-27 新手輸入與保留的草稿在淺色表單中清楚可讀', async ({ page }) => {
  async function readable(field: import('@playwright/test').Locator) {
    await expect(field).toBeVisible();
    const ratio = await field.evaluate(element => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d')!;
      function rgb(color: string) {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data];
      }
      const foreground = rgb(getComputedStyle(element).color);
      let background = [255, 255, 255, 255];
      for (let node: Element | null = element; node; node = node.parentElement) {
        const color = rgb(getComputedStyle(node).backgroundColor);
        if (color[3] === 255) { background = color; break; }
      }
      function luminance(color: number[]) {
        return color.slice(0, 3).map(c => c / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
          .reduce((total, c, i) => total + c * [0.2126, 0.7152, 0.0722][i], 0);
      }
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    });
    expect(ratio, '輸入文字與實際背景的對比至少 4.5:1').toBeGreaterThanOrEqual(4.5);
  }
  await page.goto('/login');
  const email = page.getByPlaceholder('Email', { exact: true });
  await email.fill('readability@example.test');
  await readable(email);
  await page.getByPlaceholder('密碼', { exact: true }).fill(fixturePassword);
  await readable(page.getByPlaceholder('密碼', { exact: true }));
  await register(page);
  await page.getByRole('link', { name: '活動', exact: true }).click();
  await page.getByRole('button', { name: '+ 新增活動' }).click();
  const name = page.getByPlaceholder('活動名稱');
  await name.fill('能看清輸入的活動');
  await readable(name);
  await page.getByRole('checkbox', { name: 'UAT 讀書會' }).check();
  await page.getByRole('button', { name: '建立', exact: true }).click();
  const chatInput = page.getByPlaceholder('輸入訊息... (Enter 送出，Shift+Enter 換行)');
  await chatInput.fill('我正在輸入活動內容');
  await readable(chatInput);
  await page.getByRole('button', { name: '知識庫', exact: true }).click();
  await page.getByRole('button', { name: '+ 新增知識條目' }).click();
  const title = page.getByPlaceholder('例：主角 — 艾瑞克');
  const content = page.getByPlaceholder('詳細描述此知識條目的內容...');
  await title.fill('讀得清楚的知識標題');
  await content.fill('輸入框內的活動背景也清楚可讀');
  await readable(title); await readable(content);
  await noOverflow(page);
});
