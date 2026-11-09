// Run against the local stack only; isolated emulator account, no production calls.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const folder = new URL(`../docs/uat/evidence/exploration-${new Date().toISOString().replace(/[:.]/g, '-')}/`, import.meta.url);
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'zh-TW', timezoneId: 'Asia/Taipei' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const findings = [];
try {
  await page.goto('http://127.0.0.1:4121/login');
  await page.getByRole('button', { name: '還沒有帳號？免費註冊' }).click();
  await page.getByPlaceholder('Email', { exact: true }).fill(`novice-${crypto.randomUUID()}@example.test`);
  await page.getByPlaceholder('密碼', { exact: true }).fill('local-uat-test-only');
  await page.getByRole('button', { name: '建立帳號', exact: true }).click();
  await page.getByText('UAT 讀書會', { exact: true }).waitFor();
  await page.getByRole('link', { name: '活動', exact: true }).click();
  await page.getByRole('button', { name: '+ 新增活動' }).click();
  await page.getByPlaceholder('活動名稱').fill('第一次辦讀書會');
  await page.getByRole('checkbox', { name: 'UAT 讀書會' }).check();
  await page.getByRole('button', { name: '建立', exact: true }).click();
  await page.getByRole('heading', { name: '第一次辦讀書會' }).waitFor();
  await page.screenshot({ path: new URL('01-first-activity.png', folder).pathname, fullPage: true });
  findings.push({ area: '第一個活動', prematureApproval: await page.getByRole('button', { name: '核准企畫', exact: true }).count(), nextStep: await page.getByRole('button', { name: '請 AI 規劃第一份推播', exact: true }).count() });
  await page.getByPlaceholder('輸入訊息... (Enter 送出，Shift+Enter 換行)').fill('幫我規劃三則活動前的暖場推播訊息');
  await page.getByRole('button', { name: '送出', exact: true }).click();
  await page.getByRole('button', { name: '編輯', exact: true }).first().click();
  await page.screenshot({ path: new URL('02-schedule-editor.png', folder).pathname, fullPage: true });
  findings.push({ area: '設定推播時間', nativeDatePicker: await page.locator('input[type=datetime-local]').count(), isoInput: await page.getByPlaceholder('2025-05-10T10:00:00+08:00').count() });
  const groups = await page.evaluate(async () => {
    const { auth } = await import('/src/firebase.ts');
    const token = await auth.currentUser.getIdToken();
    return (await (await fetch('/api/groups', { headers: { Authorization: `Bearer ${token}` } })).json()).groups;
  });
  // Remove this account's emulator fixtures to observe a real empty group list.
  for (const group of groups) {
    const response = await context.request.delete(`http://127.0.0.1:4124/v1/projects/demo-wippy-uat/databases/(default)/documents/groups/${group.groupId}`, { headers: { Authorization: 'Bearer owner' } });
    if (!response.ok()) throw new Error('Could not prepare empty-group emulator fixture');
  }
  await page.getByRole('link', { name: '群組', exact: true }).click();
  await page.getByRole('heading', { name: '群組', exact: true }).waitFor();
  await page.screenshot({ path: new URL('03-empty-groups.png', folder).pathname, fullPage: true });
  findings.push({ area: 'LINE 設定空狀態', body: await page.locator('main').innerText() });
} finally {
  writeFileSync(new URL('findings.json', folder), JSON.stringify({ at: new Date().toISOString(), viewport: '390x844', findings, errors }, null, 2) + '\n');
  await browser.close();
}
console.log(folder.pathname);
