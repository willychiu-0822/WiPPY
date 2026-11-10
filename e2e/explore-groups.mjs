// New organizer on mobile: recover LINE messages and check broadcast drafts.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const { chromium, expect } = require('@playwright/test');
const verify = process.argv.includes('--verify');
const folder = new URL(`../docs/uat/evidence/groups-${new Date().toISOString().replace(/[:.]/g, '-')}/`, import.meta.url);
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
  await page.getByPlaceholder('Email', { exact: true }).fill(`group-novice-${crypto.randomUUID()}@example.test`);
  await page.getByPlaceholder('密碼', { exact: true }).fill('local-uat-test-only');
  await page.getByRole('button', { name: '建立帳號', exact: true }).click();
  await page.getByText('UAT 讀書會', { exact: true }).waitFor();
  await context.setOffline(true);
  await page.getByText('UAT 讀書會', { exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await capture('00-group-load-offline', {
    misleadingEmptyState: await page.getByText('尚無訊息記錄', { exact: true }).isVisible(),
    retryCount: await page.getByRole('button', { name: '重新載入訊息', exact: true }).count(),
  });
  if (verify) {
    await expect(page.getByText('尚無訊息記錄', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '重新載入訊息', exact: true })).toHaveCount(1);
  }
  await context.setOffline(false);
  const retry = page.getByRole('button', { name: '重新載入訊息', exact: true });
  if (await retry.count()) await retry.click();
  else {
    await page.getByRole('button', { name: '←', exact: true }).click();
    await page.getByText('UAT 讀書會', { exact: true }).click();
  }
  await page.getByText('測試夥伴', { exact: true }).waitFor();
  const reply = page.getByPlaceholder('輸入訊息...', { exact: true });
  await reply.fill('想提醒大家帶一本喜歡的書');
  await context.setOffline(true);
  await page.getByRole('button', { name: '發送', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await capture('01-group-send-offline', { draft: await reply.inputValue() });
  if (verify) await expect(page.getByRole('alert')).toContainText(/無法連線.*輸入內容已保留/);
  await context.setOffline(false);
  await page.getByRole('button', { name: '發送', exact: true }).click();
  await expect(reply).toHaveValue('');
  await page.getByRole('button', { name: '←', exact: true }).click();
  await page.getByRole('button', { name: '廣播', exact: true }).click();
  await page.getByText('UAT 讀書會', { exact: true }).click();
  await page.getByText('UAT 工作坊', { exact: true }).click();
  await page.getByRole('button', { name: '廣播 (2)', exact: true }).click();
  const broadcast = page.getByPlaceholder('輸入訊息內容...');
  await broadcast.fill('讀書會改到社區圖書館');
  await context.setOffline(true);
  await page.getByRole('button', { name: '下一步：各群組微調 →', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await capture('02-broadcast-preview-offline', { draft: await broadcast.inputValue() });
  if (verify) await expect(page.getByRole('alert')).toContainText(/無法連線.*內容已保留/);
  await context.setOffline(false);
  await page.getByRole('button', { name: '下一步：各群組微調 →', exact: true }).click();
  await expect(page.locator('textarea')).toHaveCount(2);
  await page.locator('textarea').first().fill('   ');
  await capture('03-broadcast-empty-tweak', {
    emptySendEnabled: await page.getByRole('button', { name: '確認發送至 2 個群組', exact: true }).isEnabled(),
  });
  if (verify) {
    await expect(page.getByRole('button', { name: '確認發送至 2 個群組', exact: true })).toBeDisabled();
    await expect(page.getByRole('alert')).toContainText(/UAT 讀書會.*不可為空/);
  }
  await page.locator('textarea').first().fill('讀書會改到社區圖書館，請帶一本書');
  await context.setOffline(true);
  await page.getByRole('button', { name: '確認發送至 2 個群組', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await capture('04-broadcast-send-offline', { drafts: await page.locator('textarea').evaluateAll(fields => fields.map(field => field.value)) });
  if (verify) await expect(page.getByRole('alert')).toContainText(/無法連線.*內容已保留/);
  await context.setOffline(false);
  await page.getByRole('button', { name: '確認發送至 2 個群組', exact: true }).click();
  await expect(page.getByText('✓ 成功', { exact: true })).toHaveCount(2);
  await capture('05-broadcast-recovered');
  expect(errors).toEqual([]);
} finally {
  await context.setOffline(false);
  writeFileSync(new URL('findings.json', folder), JSON.stringify({ at: new Date().toISOString(), viewport: '390x844', findings, errors }, null, 2) + '\n');
  await browser.close();
}
console.log(folder.pathname);
