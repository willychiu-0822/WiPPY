import { spawn } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import net from 'node:net';

const root = fileURLToPath(new URL('../', import.meta.url));
const localTools = path.join(root, '.uat-tools');
mkdirSync(localTools, { recursive: true });
const emptyEnv = path.join(localTools, 'empty.env');
writeFileSync(emptyEnv, '# Local UAT: intentionally no external credentials or configuration.\n');
const javaDir = process.env.JAVA_HOME || (existsSync(localTools)
  ? readdirSync(localTools).map(p => path.join(localTools, p)).find(p => existsSync(path.join(p, 'bin/java')))
  : undefined);
// Deliberately whitelist environment: never inherit real project credentials or provider keys.
const env = {
  PATH: `${javaDir ? path.join(javaDir, 'bin') + ':' : ''}${process.env.PATH}`,
  HOME: process.env.HOME,
  NODE_ENV: 'development', METADATA_SERVER_DETECTION: 'none', DOTENV_CONFIG_PATH: emptyEnv,
  FIREBASE_PROJECT_ID: 'demo-wippy-uat', GCLOUD_PROJECT: 'demo-wippy-uat',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:4123', FIRESTORE_EMULATOR_HOST: '127.0.0.1:4124',
  FIREBASE_EMULATORS_PATH: path.join(localTools, 'emulators'),
  XDG_CONFIG_HOME: path.join(localTools, 'config'), JAVA_TOOL_OPTIONS: '-Xmx512m -XX:ActiveProcessorCount=2',
  FIREBASE_CLI_DISABLE_MOTD: 'true', NO_PROXY: '127.0.0.1,localhost',
  ...(javaDir ? { JAVA_HOME: javaDir } : {}),
};
const children = [];
let stopping = false;
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children.toReversed()) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already exited */ }
  }
  await new Promise(resolve => setTimeout(resolve, 1500));
  for (const child of children.toReversed()) {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already exited */ }
  }
  process.exit(code);
}
process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
function start(command, args, options = {}) {
  const child = spawn(command, args, { cwd: root, env, stdio: 'inherit', detached: true, ...options });
  children.push(child);
  child.on('error', error => { console.error(error.message); shutdown(1); });
  child.on('exit', code => { if (!stopping) { console.error(`UAT child exited (${code})`); shutdown(1); } });
  return child;
}
async function waitFor(url) {
  for (let n = 0; n < 180 && !stopping; n++) {
    try { if ((await fetch(url)).ok) return; } catch { /* service starting */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`UAT service did not become ready: ${url}`);
}
try {
  // Do not adopt or kill someone else's servers.
  for (const port of [4121, 4122, 4123, 4124, 4125, 4126, 4127]) {
    await new Promise((resolve, reject) => {
      const probe = net.createServer();
      probe.once('error', () => reject(new Error(`Port ${port} is in use; stop its owner first.`)));
      probe.listen(port, '127.0.0.1', () => probe.close(resolve));
    });
  }
  start(process.execPath, ['node_modules/firebase-tools/lib/bin/firebase.js', 'emulators:start', '--config', 'firebase.uat.json', '--project', 'demo-wippy-uat', '--only', 'auth,firestore']);
  await waitFor('http://127.0.0.1:4125/emulators');
  await waitFor('http://127.0.0.1:4123/');
  start(process.execPath, ['e2e/backend.cjs']);
  await waitFor('http://127.0.0.1:4122/health');
  start(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4121', '--strictPort'], {
    cwd: path.join(root, 'frontend'),
    env: {
      ...env, VITE_UAT_MODE: 'true', VITE_LIFF_DEV: 'true', VITE_LIFF_ID: 'uat-local',
      VITE_API_BASE_URL: '', VITE_FIREBASE_PROJECT_ID: 'demo-wippy-uat',
      VITE_FIREBASE_API_KEY: 'demo-public-config', VITE_FIREBASE_AUTH_DOMAIN: 'demo-wippy-uat.firebaseapp.com',
      VITE_FIREBASE_APP_ID: 'demo-wippy-app', VITE_FIREBASE_STORAGE_BUCKET: 'demo-wippy-uat.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      VITE_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:4123',
      VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1', VITE_FIRESTORE_EMULATOR_PORT: '4124',
    },
  });
  await waitFor('http://127.0.0.1:4121');
  console.log('WiPPY local UAT ready: http://127.0.0.1:4121 — emulator + mock LINE/LLM. Ctrl+C to stop.');
} catch (error) {
  console.error(error.message);
  await shutdown(1);
}
