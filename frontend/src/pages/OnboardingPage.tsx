import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { addFoundation, addWish, updateUserDoc, createLinkToken } from '../lib/firestore';
import type { Foundation, Wish } from '../types';

// ── Step indicator ─────────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const steps = ['歡迎', '地基時間', '彈性願望', '綁定 LINE'];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            i < current ? 'bg-blue-600 text-white' :
            i === current ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
            'bg-gray-200 text-gray-500'
          }`}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < current ? 'bg-blue-600' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );
}

// ── Step 0: Welcome ────────────────────────────────────────────────────────────
function WelcomeStep() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <Steps current={0} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">歡迎使用 WiPPY</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            生活中有很多「想做但總是沒做到」的事。
            WiPPY 的設計基於<strong>外部機制論</strong>——
            我們不靠意志力，而是靠<strong>系統的力量</strong>讓你自然而然地做到。
          </p>
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-left space-y-2 mb-6">
            <p className="font-medium text-blue-800">外部機制論 是什麼？</p>
            <p className="text-blue-700">
              行為改變不靠「更努力」，而是靠設計環境。
              當我們把時間提前規劃好，並在事後紀錄感受，
              大腦就會逐漸建立正向連結。
            </p>
          </div>
          <button
            onClick={() => navigate('/onboarding/foundations')}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 transition-colors"
          >
            開始設定 →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Foundations ────────────────────────────────────────────────────────
const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const PRESET_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

function FoundationsStep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [foundations, setFoundations] = useState<Omit<Foundation, 'id'>[]>([]);
  const [form, setForm] = useState({
    name: '', startTime: '09:00', endTime: '18:00',
    daysOfWeek: [1, 2, 3, 4, 5] as number[], color: PRESET_COLORS[0],
  });
  const [saving, setSaving] = useState(false);

  function toggleDay(d: number) {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d)
        ? f.daysOfWeek.filter((x) => x !== d)
        : [...f.daysOfWeek, d].sort(),
    }));
  }

  function addBlock() {
    if (!form.name.trim()) return;
    setFoundations((prev) => [...prev, { ...form, name: form.name.trim() }]);
    setForm((f) => ({ ...f, name: '' }));
  }

  async function handleNext() {
    if (!user) return;
    setSaving(true);
    try {
      await Promise.all(foundations.map((f) => addFoundation(user.uid, f)));
      navigate('/onboarding/wishes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white px-4 py-8">
      <div className="max-w-sm mx-auto">
        <Steps current={1} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">地基時間</h2>
          <p className="text-gray-500 text-sm mb-4">固定且不可移動的時間塊，例如上班、睡覺。</p>

          {/* Added blocks */}
          {foundations.length > 0 && (
            <div className="space-y-2 mb-4">
              {foundations.map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color }} />
                  <span className="text-sm font-medium flex-1">{f.name}</span>
                  <span className="text-xs text-gray-500">{f.startTime}–{f.endTime}</span>
                  <button onClick={() => setFoundations((p) => p.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-400 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <input
              placeholder="名稱（例如：上班）"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">開始</label>
                <input type="time" value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">結束</label>
                <input type="time" value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">星期</label>
              <div className="flex gap-1">
                {DAYS.map((d, i) => (
                  <button key={i} onClick={() => toggleDay(i)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                      form.daysOfWeek.includes(i) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">顏色</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((c) => (
                  <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-blue-400 scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button onClick={addBlock}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors">
              + 新增地基時間
            </button>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate('/onboarding/wishes')}
              className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
              跳過
            </button>
            <button onClick={handleNext} disabled={saving}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
              {saving ? '儲存中...' : '下一步 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Wishes ─────────────────────────────────────────────────────────────
const EMOJI_OPTIONS = ['🎸', '📚', '🏃', '🎨', '🧘', '💻', '✍️', '🎵', '🌿', '🎮', '🏊', '🍳'];

function WishesStep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishes, setWishes] = useState<Omit<Wish, 'id'>[]>([]);
  const [form, setForm] = useState({ name: '', emoji: '🎸', minDuration: 30 });
  const [saving, setSaving] = useState(false);

  function addWishItem() {
    if (!form.name.trim()) return;
    setWishes((prev) => [...prev, { ...form, name: form.name.trim(), priority: prev.length + 1 }]);
    setForm((f) => ({ ...f, name: '' }));
  }

  async function handleNext() {
    if (!user) return;
    setSaving(true);
    try {
      await Promise.all(wishes.map((w) => addWish(user.uid, w)));
      navigate('/onboarding/line');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white px-4 py-8">
      <div className="max-w-sm mx-auto">
        <Steps current={2} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">彈性願望</h2>
          <p className="text-gray-500 text-sm mb-4">你想在空閒時間做的事。WiPPY 會自動幫你安排進去。</p>

          {wishes.length > 0 && (
            <div className="space-y-2 mb-4">
              {wishes.map((w, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
                  <span className="text-lg">{w.emoji}</span>
                  <span className="text-sm font-medium flex-1">{w.name}</span>
                  <span className="text-xs text-gray-500">最少 {w.minDuration} 分鐘</span>
                  <button onClick={() => setWishes((p) => p.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-400 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <input
              placeholder="願望名稱（例如：吉他練習）"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <div>
              <label className="text-xs text-gray-500 mb-1 block">選一個 Emoji</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button key={e} onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                    className={`text-xl w-9 h-9 rounded-lg transition-all ${
                      form.emoji === e ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-100'
                    }`}
                  >{e}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">最短時間（分鐘）</label>
              <select value={form.minDuration}
                onChange={(e) => setForm((f) => ({ ...f, minDuration: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400">
                {[15, 20, 30, 45, 60, 90].map((m) => (
                  <option key={m} value={m}>{m} 分鐘</option>
                ))}
              </select>
            </div>
            <button onClick={addWishItem}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors">
              + 新增願望
            </button>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate('/onboarding/line')}
              className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
              跳過
            </button>
            <button onClick={handleNext} disabled={saving}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
              {saving ? '儲存中...' : '下一步 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: LINE binding ───────────────────────────────────────────────────────
function LineStep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [linkToken, setLinkToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function generateToken() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await createLinkToken(user.uid);
      setLinkToken(token);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    if (!user) return;
    await updateUserDoc(user.uid, { onboardingCompleted: true });
    navigate('/today');
  }

  const LINE_BOT_URL = 'https://line.me/R/ti/p/@YOUR_BOT_ID'; // TODO: replace with actual bot ID

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white px-4 py-8">
      <div className="max-w-sm mx-auto">
        <Steps current={3} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">綁定 LINE</h2>
          <p className="text-gray-500 text-sm mb-4">
            加入 WiPPY LINE Bot 後，時段結束時你會收到推播，一鍵紀錄體感。
          </p>

          {!linkToken ? (
            <>
              <div className="bg-green-50 rounded-xl p-4 mb-4 text-sm text-green-800">
                <p className="font-medium mb-1">步驟：</p>
                <ol className="list-decimal list-inside space-y-1 text-green-700">
                  <li>點擊下方「取得連結碼」</li>
                  <li>加 WiPPY LINE Bot 好友</li>
                  <li>傳送連結碼給 Bot</li>
                </ol>
              </div>
              <button onClick={generateToken} disabled={loading}
                className="w-full bg-green-500 text-white rounded-xl py-3 font-medium hover:bg-green-600 transition-colors disabled:opacity-50 mb-3">
                {loading ? '產生中...' : '取得連結碼'}
              </button>
            </>
          ) : (
            <div className="space-y-4 mb-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-2">你的連結碼（有效 1 小時）：</p>
                <p className="font-mono text-lg font-bold tracking-wider text-gray-900">
                  WIPPY_LINK:{linkToken}
                </p>
              </div>
              <p className="text-sm text-gray-600 text-center">
                請將上方的連結碼傳送給 WiPPY LINE Bot
              </p>
              <a href={LINE_BOT_URL} target="_blank" rel="noopener noreferrer"
                className="block w-full bg-green-500 text-white rounded-xl py-3 font-medium text-center hover:bg-green-600 transition-colors">
                開啟 LINE Bot →
              </a>
              <button onClick={() => setDone(true)}
                className="w-full border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
                我已完成綁定 ✓
              </button>
            </div>
          )}

          {done && (
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 mb-4">
              太棒了！綁定完成後就可以開始使用 WiPPY 了 🎉
            </div>
          )}

          <button onClick={handleFinish}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 transition-colors">
            開始使用 WiPPY 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Onboarding router ─────────────────────────────────────────────────────────
export default function OnboardingPage() {
  return (
    <Routes>
      <Route index element={<WelcomeStep />} />
      <Route path="foundations" element={<FoundationsStep />} />
      <Route path="wishes" element={<WishesStep />} />
      <Route path="line" element={<LineStep />} />
    </Routes>
  );
}
