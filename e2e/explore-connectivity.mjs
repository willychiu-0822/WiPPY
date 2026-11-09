// Mobile novice exploration against the local emulator stack only.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const folder = new URL(`../docs/uat/evidence/connectivity-${new Date().toISOString().replace(/[:.]/g, '-')}/`, import.meta.url);
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'zh-TW', timezoneId: 'Asia/Taipei' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const findings = [];
async function capture(name) {
  await page.screenshot({ path: new URL(`${name}.png`, folder).pathname, fullPage: true });
  findings.push({ area: name, body: await page.locator('main').innerText() });
}
try {
  await page.goto('http://127.0.0.1:4121/login');
  await page.getByRole('button', { name: '還沒有帳號？免費註冊' }).click();
  await page.getByPlaceholder('Email', { exact: true }).fill(`connectivity-${crypto.randomUUID()}@example.test`);
  await page.getByPlaceholder('密碼', { exact: true }).fill('local-uat-test-only');
  await page.getByRole('button', { name: '建立帳號', exact: true }).click();
  await page.getByText('UAT 讀書會', { exact: true }).waitFor();
  await page.getByRole('link', { name: '活動', exact: true }).click();
  await page.getByRole('button', { name: '+ 新增活動' }).click();
  await page.getByPlaceholder('活動名稱').fill('手機讀書會');
  await page.getByRole('checkbox', { name: 'UAT 讀書會' }).check();
  await page.getByRole('button', { name: '建立', exact: true }).click();
  await page.getByRole('heading', { name: '手機讀書會' }).waitFor();
  await page.getByRole('button', { name: '請 AI 規劃第一份推播', exact: true }).click();
  await page.getByRole('button', { name: '刪除', exact: true }).first().waitFor();
  await context.setOffline(true);
  const failedDelete = page.waitForEvent('requestfailed', request => request.method() === 'DELETE');
  await page.getByRole('button', { name: '刪除', exact: true }).first().click();
  await failedDelete;
  await capture('01-delete-offline');
  await context.setOffline(false);
  await page.getByRole('button', { name: '← 返回', exact: true }).click();
  await page.getByRole('button', { name: /手機讀書會/ }).waitFor();
  await context.setOffline(true);
  await page.getByRole('button', { name: /手機讀書會/ }).click();
  await page.getByText('載入中...', { exact: true }).waitFor({ state: 'hidden' });
  await capture('02-open-activity-offline');
  await context.setOffline(false);
  await page.getByRole('link', { name: '群組', exact: true }).click();
  await page.getByText('UAT 讀書會', { exact: true }).waitFor();
  await context.setOffline(true);
  await page.getByRole('link', { name: '活動', exact: true }).click();
  await page.getByText('載入中...', { exact: true }).waitFor({ state: 'hidden' });
  await capture('03-activity-list-offline');
} finally {
  await context.setOffline(false);
  writeFileSync(new URL('findings.json', folder), JSON.stringify({ at: new Date().toISOString(), viewport: '390x844', findings, errors }, null, 2) + '\n');
  await browser.close();
}
console.log(folder.pathname);
