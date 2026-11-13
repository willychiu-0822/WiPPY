const { expect } = require('@playwright/test');
const { randomUUID, createHmac } = require('node:crypto');
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9299';
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8285';
Object.assign(process.env, { METADATA_SERVER_DETECTION: 'none', PLAYWRIGHT_NO_COPY_PROMPT: '1' });
const admin = require('../backend/node_modules/firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'demo-wippy-pr42' });
const db = admin.firestore();
const base = 'http://127.0.0.1:4142';
const ownerEmail = 'pr42-install-owner@example.test';
const ownerPassword = 'EmulatorOnly-Owner-42!';
const uid = 'pr42-install-owner';
async function cleanup() {
  // Single-worker suite, dedicated emulator owner only. Never reset the shared emulator.
  const agents = await db.collection('agents').where('ownerId', '==', uid).get();
  for (const doc of agents.docs) {
    const accountUid = doc.data().accountUid;
    if (accountUid) await admin.auth().deleteUser(accountUid).catch(e => { if (e.code !== 'auth/user-not-found') throw e; });
    await deletePrefix('hubCounters', `agentSends_${doc.id}_`);
  }
  const rules = await db.collection('agentRules').where('ownerId', '==', uid).get();
  for (const doc of rules.docs) await deletePrefix('hubRuleState', `${doc.id}_`);
  const groups = await db.collection('groups').where('userId', '==', uid).get();
  for (const doc of groups.docs) {
    for (const collection of ['groupMessages']) {
      const rows = await db.collection(collection).where('groupId', '==', doc.id).get();
      for (const row of rows.docs) await row.ref.delete();
    }
    await db.collection('hubGroupStats').doc(doc.id).delete();
    await db.recursiveDelete(doc.ref);
  }
  await db.collection('hubSettings').doc(uid).delete();
  await deletePrefix('hubQuota', `${uid}_`);
  for (const collection of ['agents', 'agentRules', 'agentDispatches', 'agentInbox', 'digests', 'hubActions', 'agentRecords', 'hubAlerts', 'hubAuditLogs', 'hubAccounts', 'mediaAssets']) {
    const rows = await db.collection(collection).where('ownerId', '==', uid).get();
    for (const row of rows.docs) await row.ref.delete();
  }
  const activities = await db.collection('activities').where('userId', '==', uid).get();
  for (const row of activities.docs) await db.recursiveDelete(row.ref);
}
async function deletePrefix(collection, prefix) {
  const rows = await db.collection(collection).orderBy(admin.firestore.FieldPath.documentId()).startAt(prefix).endAt(`${prefix}\uf8ff`).get();
  for (const row of rows.docs) await row.ref.delete();
}
async function signIn(email, password) {
  const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-only`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await r.json();
  return { status: r.status, token: data.idToken };
}
async function api(token, path, method = 'GET', body) {
  const r = await fetch(`${base}${path}`, { method, signal: AbortSignal.timeout(15000), headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: r.status, body: await r.json() };
}
async function setup() {
  await cleanup();
  const tag = randomUUID().slice(0, 8);
  const groups = [`C-uat-${tag}-allowed`, `C-uat-${tag}-denied`];
  for (const [i, id] of groups.entries()) await db.collection('groups').doc(id).set({
    userId: uid, name: `安裝測試 ${tag} ${i ? '未授權' : '活動群組'}`, memberCount: 3, isActive: true, agentEnabled: false,
    createdAt: new Date(), updatedAt: new Date(),
  });
  const owner = (await signIn(ownerEmail, ownerPassword)).token;
  expect(!!owner).toBe(true);
  return { tag, groups, owner };
}
async function create(f, kind = 'grok_bot') {
  const r = await api(f.owner, '/api/hub/admin/agents', 'POST', {
    kind, name: `${kind}-${f.tag}`, allowedGroupIds: [f.groups[0]], dailySendLimit: 5,
    ...(kind === 'instinct' ? { email: `instinct-${randomUUID()}@example.test` } : {}),
  });
  expect(r.status).toBe(201); return r.body;
}
async function openGroup(f, enabled = true) {
  expect((await api(f.owner, `/api/hub/admin/groups/${f.groups[0]}/agent-access`, 'PATCH', { enabled })).status).toBe(200);
}
async function act(token, type, params, key = randomUUID()) {
  return api(token, '/api/hub/v1/actions', 'POST', { type, params, idempotencyKey: key });
}
async function mcp(token, method, params = {}) {
  return api(token, '/api/hub/mcp', 'POST', { jsonrpc: '2.0', id: 1, method, params });
}
async function rule(f, agent, keyword) {
  const r = await api(f.owner, '/api/hub/admin/rules', 'POST', {
    name: `旅程-${keyword}`, enabled: true, agentId: agent.id, groupIds: [f.groups[0]],
    trigger: { type: 'keyword', keywords: [keyword] }, include: { digest: false, raw: true, media: false, contextCount: 5 },
    instruction: '請讀活動訊息並回覆收到，完成後寫一句摘要。', cooldownMinutes: 0,
  });
  expect(r.status).toBe(201); return r.body.rule;
}
async function event(f, text) {
  const body = JSON.stringify({ destination: 'U-uat-bot', events: [{
    type: 'message', webhookEventId: randomUUID(), deliveryContext: { isRedelivery: false },
    timestamp: Date.now(), source: { type: 'group', groupId: f.groups[0], userId: 'U-uat-member' },
    message: { id: randomUUID(), type: 'text', text }, replyToken: 'emulator-only', mode: 'active',
  }] });
  const r = await fetch(`${base}/webhook/line`, { method: 'POST', headers: {
    'Content-Type': 'application/json', 'x-line-signature': createHmac('sha256', 'emulator-only-line-signature').update(body).digest('base64'),
  }, body });
  expect(r.status).toBe(200);
}
async function login(page, email = ownerEmail, password = ownerPassword) {
  await page.goto('http://127.0.0.1:4141/login'); await page.getByPlaceholder('Email', { exact: true }).fill(email);
  await page.getByPlaceholder('密碼', { exact: true }).fill(password);
  await page.getByRole('button', { name: '登入', exact: true }).click();
  await page.waitForURL(email === ownerEmail ? '**/groups' : '**/workbench');
}
async function shot(page, info, id) {
  // One-time credentials and all password inputs are masked even if a test leaves them visible.
  const path = require('node:path'); const fs = require('node:fs');
  const name = `${id}-${info.project.name}.png`;
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${id}: the page must fit the configured viewport`).toBeLessThanOrEqual(1);
  for (const folder of ['docs/uat/evidence', 'docs/pr42-fixes/evidence']) {
    fs.mkdirSync(folder, { recursive: true });
    if (folder === 'docs/uat/evidence') await page.screenshot({ path: `${folder}/${name}`, fullPage: false,
      mask: [page.getByRole('region', { name: '只顯示一次的憑證' }), page.locator('input[type=password]')] });
    else fs.copyFileSync(path.join('docs/uat/evidence', name), path.join(folder, name));
  }
}
async function events() { return (await fetch('http://127.0.0.1:4143/events')).json(); }
async function textContrast(locator, pseudo = null) {
  return locator.evaluate((el, pseudo) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const rgba = css => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
    const blend = (fg, bg, opacity = 1) => fg.slice(0, 3).map((v, i) => v * fg[3] / 255 * opacity + bg[i] * (1 - fg[3] / 255 * opacity));
    const ancestors = []; for (let p = el; p; p = p.parentElement) ancestors.push(p);
    const background = ancestors.reverse().reduce((bg, p) => blend(rgba(getComputedStyle(p).backgroundColor), bg), [255, 255, 255]);
    const style = getComputedStyle(el, pseudo);
    const color = blend(rgba(style.color), background, Number(style.opacity));
    const luminance = c => c.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    const a = luminance(color), b = luminance(background);
    return { color: style.color, background, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
  }, pseudo);
}
module.exports = { expect, db, api, setup, create, openGroup, act, mcp, rule, event, login, shot, events, signIn, randomUUID, textContrast };
