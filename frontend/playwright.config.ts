import { defineConfig, devices } from '@playwright/test';

const isCi = Boolean(process.env.CI);
const isWindows = process.platform === 'win32';

export default defineConfig({
  testDir: './e2e',
  globalSetup: isWindows ? './e2e/global-setup.ts' : undefined,
  globalTeardown: './e2e/global-teardown.ts',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: isCi ? 1 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: isWindows ? undefined : [
    {
      command: 'node ../backend/node_modules/firebase-tools/lib/bin/firebase.js emulators:start --config ../firebase.json --project demo-wippy-learning --only auth,firestore',
      url: 'http://localhost:4000',
      reuseExistingServer: false,
      timeout: 120_000,
      gracefulShutdown: { signal: 'SIGINT', timeout: 1_000 },
      env: {
        XDG_CONFIG_HOME: '../.tmp/firebase-config',
      },
    },
    {
      command: 'node ../backend/node_modules/ts-node/dist/bin.js --project ../backend/tsconfig.json ../backend/src/index.ts',
      url: 'http://localhost:8088/health',
      reuseExistingServer: false,
      timeout: 120_000,
      gracefulShutdown: { signal: 'SIGINT', timeout: 1_000 },
      env: {
        PORT: '8088',
        GCLOUD_PROJECT: 'demo-wippy-learning',
        FIREBASE_PROJECT_ID: 'demo-wippy-learning',
        FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
        FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
        LEARNING_INLINE_QUEUE: 'true',
      },
    },
    {
      command: 'node node_modules/vite/bin/vite.js --host localhost',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 120_000,
      gracefulShutdown: { signal: 'SIGINT', timeout: 1_000 },
      env: {
        VITE_API_BASE_URL: 'http://localhost:8088',
        VITE_FIREBASE_PROJECT_ID: 'demo-wippy-learning',
        VITE_FIREBASE_API_KEY: 'fake-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'demo-wippy-learning.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'demo-wippy-learning.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
        VITE_FIREBASE_APP_ID: '1:1234567890:web:e2e',
        VITE_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099',
        VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1',
        VITE_FIRESTORE_EMULATOR_PORT: '8080',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
