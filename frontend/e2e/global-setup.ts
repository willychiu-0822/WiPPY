import { spawn } from 'node:child_process';

const urls = ['http://localhost:4000', 'http://localhost:8088/health', 'http://localhost:5173'];

function start(command: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, ...env },
  });
  child.unref();
}

async function waitFor(url: string) {
  const deadline = Date.now() + 120_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}: ${String(lastError)}`);
}

export default async function globalSetup() {
  start('node', ['../backend/node_modules/firebase-tools/lib/bin/firebase.js', 'emulators:start', '--config', '../firebase.json', '--project', 'demo-wippy-learning', '--only', 'auth,firestore'], {
    XDG_CONFIG_HOME: '../.tmp/firebase-config',
  });
  start('node', ['../backend/node_modules/ts-node/dist/bin.js', '--project', '../backend/tsconfig.json', '../backend/src/index.ts'], {
    PORT: '8088',
    GCLOUD_PROJECT: 'demo-wippy-learning',
    FIREBASE_PROJECT_ID: 'demo-wippy-learning',
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
    LEARNING_INLINE_QUEUE: 'true',
  });
  start('node', ['node_modules/vite/bin/vite.js', '--host', 'localhost'], {
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
  });
  for (const url of urls) {
    await waitFor(url);
  }
}
