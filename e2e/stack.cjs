// Test-only wiring. Auth, persistence, routers, rules, actions and UI are real.
// Only LINE and Grok's external endpoint are mocked. No real secrets are read.
const http = require('node:http');
const { randomUUID } = require('node:crypto');
Object.assign(process.env, {
  FIREBASE_PROJECT_ID: 'demo-wippy-pr42', GCLOUD_PROJECT: 'demo-wippy-pr42',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9299', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8285',
  OWNER_USER_ID: 'pr42-install-owner', NODE_ENV: 'test',
  LINE_CHANNEL_SECRET: 'emulator-only-line-signature', LINE_CHANNEL_ACCESS_TOKEN: 'emulator-only-line-token',
  HUB_PUBLIC_BASE_URL: 'http://127.0.0.1:4142', HUB_ENCRYPTION_KEY: randomUUID(),
  HUB_TASKS_QUEUE: '', CLOUD_RUN_SERVICE_URL: '', GOOGLE_APPLICATION_CREDENTIALS: '',
  HUB_MEDIA_BUCKET: '', GEMINI_API_KEY: '', OPENAI_API_KEY: '', METADATA_SERVER_DETECTION: 'none',
});
const admin = require('../backend/node_modules/firebase-admin');
admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
const events = { pushes: [], routines: [] };
const mock = http.createServer(async (req, res) => {
  let body = ''; for await (const chunk of req) body += chunk;
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/events') return res.end(JSON.stringify(events));
  if (req.url === '/routine') {
    if (req.headers.authorization !== 'Bearer emulator-only-routine') {
      res.statusCode = 401; return res.end(JSON.stringify({ error: 'Invalid Routine credential' }));
    }
    events.routines.push(JSON.parse(body));
  }
  else if (req.url === '/push') events.pushes.push(JSON.parse(body));
  else { res.statusCode = 404; return res.end('{}'); }
  res.end('{}');
});
(async () => {
  await admin.auth().getUser('pr42-install-owner').catch(() => admin.auth().createUser({
    uid: 'pr42-install-owner', email: 'pr42-install-owner@example.test', password: 'EmulatorOnly-Owner-42!', emailVerified: true,
  }));
  require('../backend/dist/line').getLineClient = () => ({
    getGroupSummary: async id => ({ groupId: id, groupName: 'UAT 群組' }),
    getGroupMembersCount: async () => ({ count: 3 }),
    getGroupMemberProfile: async () => ({ displayName: 'UAT 成員' }),
  });
  const { createApp } = require('../backend/dist/app');
  const { buildProductionHub, setHubContext } = require('../backend/dist/hub/runtime');
  const ctx = buildProductionHub(process.env);
  // The production quota is keyed by month (no owner field). Scope only its ID
  // so mock LINE consumption cannot alter the existing PR42 stack's quota cache.
  const store = ctx.store;
  ctx.store = new Proxy(store, { get(target, method) {
    const value = target[method];
    if (['get', 'set', 'create', 'update', 'delete', 'mutate'].includes(method)) {
      return (collection, id, ...args) => value.call(target, collection, collection === 'hubQuota' ? `pr42-install-owner_${id}` : id, ...args);
    }
    return typeof value === 'function' ? value.bind(target) : value;
  } });
  ctx.line = {
    push: async (to, messages, retryKey) => {
      const r = await fetch('http://127.0.0.1:4143/push', { method: 'POST', body: JSON.stringify({ to, messages, retryKey }) });
      if (!r.ok) throw new Error('Mock LINE unavailable');
    },
    getQuota: async () => ({ type: 'limited', value: 100000 }), getConsumption: async () => 0,
    getGroupMemberCount: async () => 3, getGroupMemberProfile: async () => ({ displayName: 'UAT 成員' }),
  };
  ctx.fetch = (url, init) => {
    if (String(url) === 'https://routine.example.invalid/uat') return fetch('http://127.0.0.1:4143/routine', init);
    throw new Error('UAT does not allow external network requests');
  };
  setHubContext(ctx);
  mock.listen(4143, '127.0.0.1');
  const backend = createApp().listen(4142, '127.0.0.1');
  const { createServer } = await import('../frontend/node_modules/vite/dist/node/index.js');
  const vite = await createServer({
    root: require('node:path').resolve(__dirname, '../frontend'),
    define: Object.fromEntries(Object.entries({
      VITE_FIREBASE_PROJECT_ID: 'demo-wippy-pr42', VITE_FIREBASE_API_KEY: 'emulator-only',
      VITE_FIREBASE_AUTH_DOMAIN: 'localhost', VITE_FIREBASE_APP_ID: 'emulator-only',
      VITE_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9299',
      VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1', VITE_FIRESTORE_EMULATOR_PORT: '8285', VITE_API_BASE_URL: '',
    }).map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)])),
    server: { host: '127.0.0.1', port: 4141, strictPort: true, proxy: {
      '/api': 'http://127.0.0.1:4142',
    } },
  });
  await vite.listen();
  const close = async () => { await vite.close(); backend.close(); mock.close(); await admin.app().delete(); process.exit(0); };
  process.on('SIGTERM', close); process.on('SIGINT', close);
})().catch(err => { console.error('UAT stack failed:', err.name, err.code || '', err.message.replace(/wpy_[A-Za-z0-9_-]+/g, '[REDACTED]')); process.exit(1); });
