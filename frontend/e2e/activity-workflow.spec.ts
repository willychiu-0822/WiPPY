import { test as base, expect, type Page } from '@playwright/test';

const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await use(errors);
  }, { auto: true }],
});
test.afterEach(async ({ errors }) => {
  expect(errors, '瀏覽器不得有未處理例外').toEqual([]);
});

const fixturePassword = 'local-uat-test-only';

async function createAccount(page: Page) {
  const email = `w21-${crypto.randomUUID()}@example.test`;
  const res = await page.request.post('http://127.0.0.1:4123/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-public-config',
    { data: { email, password: fixturePassword, returnSecureToken: true } });
  expect(res.ok(), 'emulator 建立測試帳號').toBe(true);
  return email;
}

async function register(page: Page) {
  const email = await createAccount(page);
  await page.goto('/login');
  await page.getByPlaceholder('Email', { exact: true }).fill(email);
  await page.getByPlaceholder('密碼', { exact: true }).fill(fixturePassword);
  await page.getByRole('button', { name: '登入', exact: true }).click();
  await expect(page.getByRole('heading', { name: '群組', exact: true })).toBeVisible();
}

async function createActivity(page: Page) {
  await page.getByRole('link', { name: '活動', exact: true }).click();
  await page.getByRole('button', { name: '+ 新增活動' }).click();
  await page.getByPlaceholder('活動名稱').fill('新手讀書交流活動');
  await page.getByRole('checkbox', { name: 'UAT 讀書會' }).check();
  await page.getByRole('button', { name: '建立', exact: true }).click();
  await expect(page.getByRole('heading', { name: '新手讀書交流活動' })).toBeVisible();
}

async function plan(page: Page) {
  await page.getByRole('button', { name: 'Agent 對話', exact: true }).click();
  await page.getByPlaceholder('輸入訊息... (Enter 送出，Shift+Enter 換行)').fill('幫我規劃三則活動前的暖場推播訊息');
  await page.getByRole('button', { name: '送出', exact: true }).click();
  await expect(page.getByText('本機活動提醒 1：歡迎參加活動！', { exact: true })).toBeVisible();
}

function primary(page: Page) {
  return page.locator('[data-primary="true"]');
}

test('W-21 活動詳情依狀態只顯示一個主要動作', async ({ page }, testInfo) => {
  async function shot(name: string) {
    if (testInfo.project.name !== 'desktop') return;
    await page.screenshot({ path: `/opt/cursor/artifacts/w21-after-${name}.png`, fullPage: true });
  }

  await register(page);
  await createActivity(page);

  await test.step('還沒有企畫時，主要動作是先規劃', async () => {
    await expect(page.getByRole('navigation', { name: '活動流程' })).toContainText('1 核准企畫');
    await expect(page.getByRole('navigation', { name: '活動流程' })).toContainText('2 確認排程');
    await expect(page.getByRole('navigation', { name: '活動流程' })).toContainText('3 送出');
    await expect(page.locator('[aria-current="step"]')).toHaveText(/核准企畫/);
    await expect(primary(page)).toHaveCount(1);
    await expect(primary(page)).toHaveText('請小幫手安排第一則訊息');
    await expect(page.getByRole('button', { name: '核准企畫', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /確認排程/ })).toHaveCount(0);
  });

  await plan(page);

  await test.step('企畫尚未核准時，主要動作是核准企畫', async () => {
    await expect(primary(page)).toHaveCount(1);
    await expect(primary(page)).toHaveText('核准企畫');
    await expect(page.locator('[aria-current="step"]')).toHaveText(/核准企畫/);
    await page.getByRole('button', { name: 'Agent 對話', exact: true }).click();
    await expect(page.getByRole('button', { name: /確認排程/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '送出', exact: true })).not.toHaveAttribute('data-primary', 'true');
    await expect(primary(page)).toHaveText('核准企畫');
    await shot('1-approve');
  });

  await test.step('已核准、排程未確認時，主要動作是確認排程', async () => {
    await page.getByRole('button', { name: '核准企畫', exact: true }).click();
    await expect(page.getByText('企畫已核准', { exact: true })).toBeVisible();
    await expect(page.locator('[aria-current="step"]')).toHaveText(/確認排程/);
    await expect(primary(page)).toHaveCount(1);
    await expect(primary(page)).toHaveText(/確認排程/);
    await expect(page.getByRole('button', { name: '核准企畫', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '送出', exact: true })).not.toHaveAttribute('data-primary', 'true');
    await shot('2-confirm');
    await primary(page).click();
  });

  await test.step('排程已確認時，主要動作是送出', async () => {
    await expect(page.locator('[aria-current="step"]')).toHaveText(/送出/);
    await expect(primary(page)).toHaveCount(1);
    await expect(primary(page)).toHaveText('送出');
    const confirm = page.getByRole('button', { name: /確認排程/ });
    if (await confirm.count()) await expect(confirm).not.toHaveAttribute('data-primary', 'true');
    await shot('3-send');
    await page.reload();
    await expect(page.getByText('企畫已核准', { exact: true })).toBeVisible();
    await expect(page.locator('[aria-current="step"]')).toHaveText(/送出/);
    await expect(primary(page)).toHaveText('送出');
  });

  await test.step('要求修改後回到核准', async () => {
    await page.getByRole('button', { name: '要求修改', exact: true }).click();
    await expect(page.getByText('修改中 — 待發訊息已暫停', { exact: true })).toBeVisible();
    await expect(page.locator('[aria-current="step"]')).toHaveText(/核准企畫/);
    await expect(primary(page)).toHaveCount(1);
    await expect(primary(page)).toHaveText('重新核准');
    await page.getByRole('button', { name: 'Agent 對話', exact: true }).click();
    await expect(page.getByRole('button', { name: /確認排程/ })).toHaveCount(0);
  });
});
