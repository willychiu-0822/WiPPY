// Local-only provider replacements. Product routers, authentication, validation and persistence remain real.
const path = require('node:path');
const { createRequire } = require('node:module');
const backendRequire = createRequire(path.resolve(__dirname, '../backend/package.json'));
backendRequire('ts-node').register({ project: path.resolve(__dirname, '../backend/tsconfig.json'), transpileOnly: true });
if (process.env.FIREBASE_PROJECT_ID !== 'demo-wippy-uat'
  || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:4124'
  || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:4123'
  || process.env.NODE_ENV === 'production') throw new Error('UAT backend requires local demo emulators');

const line = require('../backend/src/line.ts');
line.getLineClient = () => ({
  async pushMessage(_groupId, message) {
    if (message.text.includes('[模擬失敗]')) throw new Error('本機模擬：LINE 暫時無法發送，請重試');
    if (message.text.includes('[延遲發送]')) await new Promise(resolve => setTimeout(resolve, 2500));
    return { messageId: `mock-${Date.now()}` };
  },
  async getGroupSummary() { return { groupName: 'UAT 模擬群組' }; },
  async getGroupMembersCount() { return { count: 5 }; },
});
const llm = require('../backend/src/services/llmProvider.ts');
llm.createLLMProvider = () => ({
  async chat(messages) {
    const text = messages.filter(m => m.role === 'user').at(-1)?.content || '';
    if (text.includes('[模擬失敗]')) throw new Error('本機模擬：LLM 暫時不可用');
    if (/規劃|排程|JSON 陣列/.test(text)) {
      return JSON.stringify([1, 2, 3].map(i => ({
        content: `本機活動提醒 ${i}：歡迎參加活動！`, targetGroups: ['all'],
        triggerValue: new Date(Date.now() + i * 86400000).toISOString().replace(/\.\d{3}Z$/, 'Z'), sequenceOrder: i,
      })));
    }
    if (/萃取知識/.test(text)) {
      return '已記下活動資訊（本機模擬）。\nEXTRACTED_KNOWLEDGE:\n' + JSON.stringify([
        { knowledgeType: 'background', title: 'AI 萃取的活動資訊', content: text },
      ]);
    }
    return '你好！我可以協助整理活動資訊、萃取知識與規劃推播（本機模擬）。';
  },
});
const express = backendRequire('express');
const admin = backendRequire('firebase-admin');
const { getDb } = require('../backend/src/firebase.ts');
const { authMiddleware } = require('../backend/src/middleware/auth.ts');
const { createApp } = require('../backend/src/app.ts');
const app = express();
const seeded = new Map();
app.use('/api', authMiddleware, async (req, res, next) => {
  try {
    if (!seeded.has(req.userId)) {
      const seed = (async () => {
        const db = getDb();
        const batch = db.batch();
        const now = admin.firestore.Timestamp.now();
        for (const [i, name] of ['UAT 讀書會', 'UAT 工作坊'].entries()) {
          const groupId = 'C' + require('node:crypto').createHash('md5').update(req.userId + i).digest('hex');
          const ref = db.collection('groups').doc(groupId);
          batch.set(ref, { groupId, userId: req.userId, name, memberCount: 5, isActive: true,
            lastMessageAt: now, lastMessagePreview: '歡迎加入本機測試群組', createdAt: now, updatedAt: now });
          batch.set(ref.collection('recentMessages').doc('welcome'), { senderId: 'mock-user', senderName: '測試夥伴', content: '歡迎加入本機測試群組', messageType: 'text', timestamp: now });
        }
        await batch.commit();
      })();
      seeded.set(req.userId, seed);
    }
    await seeded.get(req.userId);
    next();
  } catch { res.status(500).json({ error: 'Local fixture initialization failed' }); }
});
app.use(createApp());
const server = app.listen(4122, '127.0.0.1', () => console.log('UAT backend ready (mock LINE/LLM)'));
// Serial local clock replaces Cloud Scheduler. Same real /scheduler/tick route.
let ticking = false;
const timer = setInterval(async () => {
  if (ticking) return;
  ticking = true;
  try { await fetch('http://127.0.0.1:4122/scheduler/tick', { method: 'POST' }); }
  finally { ticking = false; }
}, 1000);
process.on('SIGTERM', () => { clearInterval(timer); server.close(() => process.exit(0)); });
