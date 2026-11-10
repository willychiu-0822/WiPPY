process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './e2e', timeout: 60000, expect: { timeout: 15000 },
  workers: 1, fullyParallel: false, retries: 0,
  reporter: [['list'], ['./e2e/reporter.cjs']],
  use: { baseURL: 'http://127.0.0.1:4141', channel: 'chrome', viewport: { width: 1280, height: 800 }, trace: 'off', screenshot: 'off', video: 'off' },
  projects: [
    { name: 'desktop', testMatch: /journey\.spec\.js/, use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', testMatch: /journey\.spec\.js/, use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'api', testMatch: /api\.spec\.js/ },
  ],
  webServer: {
    command: 'node e2e/stack.cjs', url: 'http://127.0.0.1:4141',
    reuseExistingServer: false, timeout: 60000,
    stdout: 'ignore', stderr: 'pipe',
  },
});
