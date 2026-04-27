import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  getFoundations, addFoundation, deleteFoundation,
  getWishes, addWish, deleteWish, createLinkToken,
} from '../lib/firestore';
import type { Foundation, Wish } from '../types';

const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const PRESET_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
const EMOJI_OPTIONS = ['🎸', '📚', '🏃', '🎨', '🧘', '💻', '✍️', '🎵', '🌿', '🎮', '🏊', '🍳'];

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'foundations' | 'wishes' | 'line'>('foundations');

  // Foundations
  const [foundations, setFoundations] = useState<Foundation[]>([]);
  const [fForm, setFForm] = useState({ name: '', startTime: '09:00', endTime: '18:00', daysOfWeek: [1,2,3,4,5] as number[], color: PRESET_COLORS[0] });
  const [fSaving, setFSaving] = useState(false);

  // Wishes
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wForm, setWForm] = useState({ name: '', emoji: '🎸', minDuration: 30 });
  const [wSaving, setWSaving] = useState(false);

  // LINE
  const [linkToken, setLinkToken] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getFoundations(user.uid).then(setFoundations);
    getWishes(user.uid).then(setWishes);
  }, [user]);

  function toggleDay(d: number) {
    setFForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter((x) => x !== d) : [...f.daysOfWeek, d].sort(),
    }));
  }

  async function handleAddFoundation() {
    if (!user || !fForm.name.trim()) return;
    setFSaving(true);
    const id = await addFoundation(user.uid, { ...fForm, name: fForm.name.trim() });
    setFoundations((prev) => [...prev, { id, ...fForm, name: fForm.name.trim() }]);
    setFForm((f) => ({ ...f, name: '' }));
    setFSaving(false);
  }

  async function handleDeleteFoundation(id: string) {
    if (!user) return;
    await deleteFoundation(user.uid, id);
    setFoundations((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleAddWish() {
    if (!user || !wForm.name.trim()) return;
    setWSaving(true);
    const id = await addWish(user.uid, { ...wForm, name: wForm.name.trim(), priority: wishes.length + 1 });
    setWishes((prev) => [...prev, { id, ...wForm, name: wForm.name.trim(), priority: wishes.length + 1 }]);
    setWForm((f) => ({ ...f, name: '' }));
    setWSaving(false);
  }

  async function handleDeleteWish(id: string) {
    if (!user) return;
    await deleteWish(user.uid, id);
    setWishes((prev) => prev.filter((w) => w.id !== id));
  }

  async function generateToken() {
    if (!user) return;
    setTokenLoading(true);
    const token = await createLinkToken(user.uid);
    setLinkToken(token);
    setTokenLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <button onClick={() => signOut(auth)} className="text-sm text-gray-400 hover:text-red-400 transition-colors">
          登出
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {(['foundations', 'wishes', 'line'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'foundations' ? '地基' : t === 'wishes' ? '願望' : 'LINE'}
          </button>
        ))}
      </div>

      {/* ── Foundations tab ─────────────────────────────────────────────── */}
      {tab === 'foundations' && (
        <div className="space-y-3">
          {foundations.map((f) => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color }} />
              <div className="flex-1">
                <p className="text-sm font-medium">{f.name}</p>
                <p className="text-xs text-gray-400">
                  {f.startTime}–{f.endTime} ｜ {f.daysOfWeek.map((d) => DAYS[d]).join('、')}
                </p>
              </div>
              <button onClick={() => handleDeleteFoundation(f.id)} className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none">×</button>
            </div>
          ))}
          {/* Add form */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">新增地基時間</p>
            <input placeholder="名稱" value={fForm.name}
              onChange={(e) => setFForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">開始</label>
                <input type="time" value={fForm.startTime}
                  onChange={(e) => setFForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">結束</label>
                <input type="time" value={fForm.endTime}
                  onChange={(e) => setFForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex gap-1">
              {DAYS.map((d, i) => (
                <button key={i} onClick={() => toggleDay(i)}
                  className={`w-8 h-8 rounded-full text-xs font-medium ${fForm.daysOfWeek.includes(i) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                >{d}</button>
              ))}
            </div>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} onClick={() => setFForm((f) => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full ${fForm.color === c ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button onClick={handleAddFoundation} disabled={fSaving || !fForm.name.trim()}
              className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
              {fSaving ? '儲存中...' : '新增'}
            </button>
          </div>
        </div>
      )}

      {/* ── Wishes tab ──────────────────────────────────────────────────── */}
      {tab === 'wishes' && (
        <div className="space-y-3">
          {wishes.map((w) => (
            <div key={w.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
              <span className="text-xl">{w.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{w.name}</p>
                <p className="text-xs text-gray-400">最少 {w.minDuration} 分鐘 ｜ 優先度 {w.priority}</p>
              </div>
              <button onClick={() => handleDeleteWish(w.id)} className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none">×</button>
            </div>
          ))}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">新增彈性願望</p>
            <input placeholder="願望名稱" value={wForm.name}
              onChange={(e) => setWForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} onClick={() => setWForm((f) => ({ ...f, emoji: e }))}
                  className={`text-xl w-9 h-9 rounded-lg ${wForm.emoji === e ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-100'}`}
                >{e}</button>
              ))}
            </div>
            <select value={wForm.minDuration}
              onChange={(e) => setWForm((f) => ({ ...f, minDuration: Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400">
              {[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} 分鐘</option>)}
            </select>
            <button onClick={handleAddWish} disabled={wSaving || !wForm.name.trim()}
              className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
              {wSaving ? '儲存中...' : '新增'}
            </button>
          </div>
        </div>
      )}

      {/* ── LINE tab ─────────────────────────────────────────────────────── */}
      {tab === 'line' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-800">LINE Bot 綁定</h2>
          <p className="text-sm text-gray-500">
            綁定後，WiPPY 會在每個時段結束時透過 LINE 推播，讓你一鍵紀錄體感。
          </p>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>點擊「產生連結碼」</li>
            <li>加 WiPPY LINE Bot 好友</li>
            <li>傳送連結碼給 Bot</li>
          </ol>
          {linkToken ? (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-2">連結碼（有效 1 小時）</p>
                <p className="font-mono text-base font-bold text-gray-900 break-all">
                  WIPPY_LINK:{linkToken}
                </p>
              </div>
              <button onClick={generateToken} disabled={tokenLoading}
                className="w-full border border-gray-200 text-gray-500 rounded-xl py-2 text-sm hover:bg-gray-50 transition-colors">
                重新產生
              </button>
            </div>
          ) : (
            <button onClick={generateToken} disabled={tokenLoading}
              className="w-full bg-green-500 text-white rounded-xl py-3 font-medium hover:bg-green-600 transition-colors disabled:opacity-50">
              {tokenLoading ? '產生中...' : '產生連結碼'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
