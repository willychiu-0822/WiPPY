import { expect, test } from '@playwright/test';

test('login document is WiPPY in Traditional Chinese', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle('WiPPY');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');
  await expect(page.locator('img[src="/favicon.svg"]')).toBeVisible();
  await expect(page.getByText('🤖')).toHaveCount(0);
  await expect(page.getByText('帳號由 WiPPY 擁有者建立，不開放註冊。')).toBeVisible();
});
