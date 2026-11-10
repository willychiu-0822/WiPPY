// Mobile novice exploration; only the isolated local emulator stack is used.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const { chromium, expect } = require('@playwright/test');
const folder = new URL(`../docs/uat/evidence/first-plan-${new Date().toISOString().replace(/[:.]/g, '-')}/`, import.meta.url);
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'zh-TW', timezoneId: 'Asia/Taipei' });
const page = await context.newPage();
const errors = [];
const findings = [];
page.on('pageerror', error => errors.push(error.message));
async function capture(area, extra = {}) {
  await page.screenshot({ path: new URL(`${area}.png`, folder).pathname, fullPage: true });
  findings.push({ area, body: await page.locator('body').innerText(), ...extra });
}
try {
  await page.goto('http://127.0.0.1:4121/login');
  await page.getByRole('button', { name: '還沒有帳號？免費註冊' }).click();
  await page.getByPlaceholder('Email', { exact: true }).fill(`first-plan-${crypto.randomUUID()}@example.test`);
  await page.getByPlaceholder('密碼', { exact: true }).fill('local-uat-test-only');
  await page.getByRole('button', { name: '建立帳號', exact: true }).click();
  await page.getByText('UAT 讀書會', { exact: true }).waitFor();
  await page.getByRole('link', { name: '活動', exact: true }).click();
  await page.getByRole('button', { name: '+ 新增活動' }).click();
  await page.getByPlaceholder('活動名稱').fill('第一次辦親子讀書會');
  await page.getByRole('button', { name: '建立', exact: true }).click();
  await expect(page.getByRole('button', { name: '核准企畫', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '請 AI 規劃第一份推播', exact: true })).toHaveCount(1);
  await capture('00-first-activity');
  await page.getByRole('button', { name: '請 AI 規劃第一份推播', exact: true }).click();
  await page.getByRole('button', { name: '編輯', exact: true }).first().waitFor();
  const approve = page.getByRole('button', { name: '核准企畫', exact: true });
  await expect(approve).toBeDisabled();
  await expect(page.getByText('請先在上方選擇至少一個目標群組，再核准企畫。', { exact: true })).toBeVisible();
  const disabled = await approve.isDisabled();
  await capture('01-plan-without-group', { approvalDisabled: disabled });
  await page.getByRole('checkbox', { name: 'UAT 讀書會' }).check();
  await page.getByText('已選 1 個', { exact: true }).waitFor();
  await expect(page.getByRole('button', { name: '重新核准', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Agent 對話', exact: true }).click();
  const input = page.getByPlaceholder('輸入訊息... (Enter 送出，Shift+Enter 換行)');
  await input.fill('請協助把活動說明寫得適合第一次參加的家長');
  await context.setOffline(true);
  const failed = page.waitForEvent('requestfailed', r => r.method() === 'POST' && r.url().includes('/agent/'));
  await page.getByRole('button', { name: '送出', exact: true }).click();
  await failed;
  await expect(page.getByRole('alert')).toHaveText('無法連線至 AI 助理，請檢查網路連線後重新送出；輸入內容已保留');
  await expect(input).toHaveValue('請協助把活動說明寫得適合第一次參加的家長');
  await capture('02-ai-offline', { inputPreserved: await input.inputValue() });
  await context.setOffline(false);
  await page.getByRole('button', { name: '送出', exact: true }).click();
  await expect(page.getByText(/你好！我可以協助整理活動資訊/)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText('請協助把活動說明寫得適合第一次參加的家長', { exact: true })).toHaveCount(1);
  await capture('03-ai-recovered');
  expect(errors).toEqual([]);
} finally {
  await context.setOffline(false);
  writeFileSync(new URL('findings.json', folder), JSON.stringify({ at: new Date().toISOString(), viewport: '390x844', findings, errors }, null, 2) + '\n');
  await browser.close();
}
console.log(folder.pathname);
