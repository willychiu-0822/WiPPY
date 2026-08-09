import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createEmulatorUser, setLearningAccess, signInEmulatorUser } from './learning-test-data';

const forbiddenLearningCopy = /複習|到期|連勝|\bXP\b|排行榜|剩餘\s*\d+\s*題|未完成|欠題|待審核|已學會|精通/u;

async function expectNoSeriousA11y(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
  expect(serious).toEqual([]);
}

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('密碼').fill(password);
  await page.getByRole('button', { name: '登入' }).click();
  await expect(page).not.toHaveURL(/\/login$/u);
}

async function loginWithLearningAccess(page: import('@playwright/test').Page, email: string, password: string) {
  await login(page, email, password);
  await expect(page.getByRole('link', { name: '探索' })).toHaveCount(1);
}

test.describe('WiPPY learning canary', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('imports an English source, practices without pressure, and persists knowledge evidence', async ({ page }) => {
    const user = await createEmulatorUser();
    await setLearningAccess(user.uid, true);
    await loginWithLearningAccess(page, user.email, user.password);

    await page.getByRole('link', { name: '探索' }).click();
    await page.getByRole('link', { name: '來源', exact: true }).click();
    await expectNoSeriousA11y(page);

    await page.getByLabel('標題').fill('Seed Article');
    await page.getByLabel('英文內容').fill('Before building it, run the idea by a few users. Later, run the company with care.');
    await page.getByRole('button', { name: '收進知識庫' }).click();

    await expect(page.getByRole('heading', { name: 'Seed Article' })).toBeVisible();
    await expect(page.getByText('Before building it, run the idea by a few users.')).toBeVisible();
    await expect(page.getByRole('link', { name: '開始 3–5 分鐘練習' })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('body')).not.toContainText(forbiddenLearningCopy);
    await expectNoSeriousA11y(page);

    await page.getByRole('link', { name: '開始 3–5 分鐘練習' }).click();
    await expect(page.getByRole('button', { name: '確認答案' })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    await page.getByRole('radio').first().click();
    await page.getByRole('button', { name: '再給我一點提示' }).click();
    await page.getByRole('radio').nth(1).click();
    await page.getByRole('button', { name: '確認答案' }).click();

    await expect(page.getByRole('heading', { name: '這題的語言證據' })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('body')).toContainText(/提示|證據/u);
    await expect(page.locator('body')).not.toContainText(/延遲記憶已建立|已學會|精通/u);
    await expectNoSeriousA11y(page);

    const nextOrDone = page.getByRole('button', { name: /繼續|完成/u });
    await nextOrDone.click();
    if (await page.getByRole('button', { name: '跳過' }).isVisible().catch(() => false)) {
      await page.getByRole('button', { name: '跳過' }).click();
      await page.getByRole('button', { name: /繼續|完成/u }).click();
    }
    await expect(page.getByRole('heading', { name: '這輪先到這裡' })).toBeVisible();

    await page.getByRole('link', { name: '查看知識庫' }).click();
    await expect(page.getByRole('heading', { name: 'run something by someone' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'run', exact: true })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(forbiddenLearningCopy);
    await expectNoSeriousA11y(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'run something by someone' })).toBeVisible();
  });

  test('shows a neutral empty state for sources without reviewed challengeable expressions', async ({ page }) => {
    const user = await createEmulatorUser();
    await setLearningAccess(user.uid, true);
    await loginWithLearningAccess(page, user.email, user.password);

    await page.goto('/learn/sources/new');
    await page.getByLabel('標題').fill('Unreviewed');
    await page.getByLabel('英文內容').fill('Curious makers carefully listen before choosing.');
    await page.getByRole('button', { name: '收進知識庫' }).click();

    await expect(page.getByText('內容已完整收進知識庫；目前沒有足夠可靠、適合出題的英文項目。')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('link', { name: '開始 3–5 分鐘練習' })).toHaveCount(0);
    await page.getByRole('link', { name: '查看已收錄內容' }).click();
    await expect(page.getByText('Curious')).toBeVisible({ timeout: 20_000 });
  });

  test('keeps learning private to access-enabled owners', async ({ page, request, browser }) => {
    const owner = await createEmulatorUser();
    const outsider = await createEmulatorUser();
    await setLearningAccess(owner.uid, true);
    await loginWithLearningAccess(page, owner.email, owner.password);
    await page.goto('/learn/sources/new');
    await page.getByLabel('標題').fill('Private');
    await page.getByLabel('英文內容').fill('Before building it, run the idea by a few users.');
    await page.getByRole('button', { name: '收進知識庫' }).click();
    await expect(page.getByRole('heading', { name: 'Private' })).toBeVisible();
    const sourceId = new URL(page.url()).pathname.split('/').pop()!;

    const outsiderContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const outsiderPage = await outsiderContext.newPage();
    await login(outsiderPage, outsider.email, outsider.password);
    await outsiderPage.goto('/learn');
    await expect(outsiderPage).toHaveURL(/\/groups$/u);
    await expect(outsiderPage.getByRole('heading', { name: '英文知識庫' })).toHaveCount(0);
    await outsiderContext.close();

    const outsiderAuth = await signInEmulatorUser(outsider.email, outsider.password);
    const knowledgeResponse = await request.get('http://localhost:8088/api/learning/knowledge', {
      headers: { Authorization: `Bearer ${outsiderAuth.idToken}` },
    });
    expect(knowledgeResponse.status()).toBe(404);

    const apiResponse = await request.get(`http://localhost:8088/api/learning/sources/${sourceId}`, {
      headers: { Authorization: `Bearer ${outsiderAuth.idToken}` },
    });
    expect(apiResponse.status()).toBe(404);
  });
});
