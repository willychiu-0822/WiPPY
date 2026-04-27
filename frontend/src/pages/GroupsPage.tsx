import { useState, useEffect, useCallback } from 'react';
import { api, type Group, type RecentMessage, type BroadcastPreview } from '../lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number | undefined): string {
  if (!seconds) return '';
  const d = new Date(seconds * 1000);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 24) return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  if (diffH < 168) return d.toLocaleDateString('zh-TW', { weekday: 'short' });
  return d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
}

// ─── Message Drawer ───────────────────────────────────────────────────────────

function MessageDrawer({
  group,
  onClose,
}: {
  group: Group;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.groups.messages(group.groupId).then((r) => {
      setMessages(r.messages);
      setLoading(false);
    });
  }, [group.groupId]);

  async function handleSend() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.groups.send(group.groupId, reply.trim());
      setReply('');
      setSent(true);
      setTimeout(() => setSent(false), 2000);
      // Refresh messages
      const r = await api.groups.messages(group.groupId);
      setMessages(r.messages);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-lg">←</button>
        <div>
          <div className="font-semibold text-gray-900">{group.name}</div>
          <div className="text-xs text-gray-400">{group.memberCount} 人</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading && <p className="text-center text-gray-400 text-sm mt-8">載入中...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">尚無訊息記錄</p>
        )}
        {[...messages].reverse().map((msg) => (
          <div key={msg.id} className="space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-gray-700">{msg.senderName}</span>
              <span className="text-xs text-gray-400">{formatTime(msg.timestamp._seconds)}</span>
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-800 inline-block max-w-xs">
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Quick reply input */}
      <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="輸入訊息..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={sending || !reply.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-40 hover:bg-blue-700"
        >
          {sent ? '✓' : sending ? '...' : '發送'}
        </button>
      </div>
    </div>
  );
}

// ─── Broadcast Composer ───────────────────────────────────────────────────────

function BroadcastComposer({
  selected,
  groups,
  onClose,
  onDone,
}: {
  selected: string[];
  groups: Group[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<'compose' | 'tweak' | 'result'>('compose');
  const [baseContent, setBaseContent] = useState('');
  const [previews, setPreviews] = useState<BroadcastPreview[]>([]);
  const [results, setResults] = useState<Array<{ groupId: string; status: string; error?: string }>>([]);
  const [loading, setLoading] = useState(false);

  const selectedGroups = groups.filter((g) => selected.includes(g.groupId));

  async function handlePreview() {
    if (!baseContent.trim()) return;
    setLoading(true);
    try {
      const r = await api.broadcast.preview(selected, baseContent.trim());
      setPreviews(r.previews);
      setStep('tweak');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    setLoading(true);
    try {
      const r = await api.broadcast.multi(
        previews.map((p) => ({ groupId: p.groupId, content: p.content }))
      );
      setResults(r.results);
      setStep('result');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-lg">←</button>
        <span className="font-semibold text-gray-900">
          {step === 'compose' && `廣播至 ${selected.length} 個群組`}
          {step === 'tweak' && '各群組微調'}
          {step === 'result' && '發送結果'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Step 1: Compose */}
        {step === 'compose' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              目標群組：{selectedGroups.map((g) => g.name).join('、')}
            </div>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={6}
              placeholder="輸入訊息內容..."
              value={baseContent}
              onChange={(e) => setBaseContent(e.target.value)}
            />
            <button
              onClick={handlePreview}
              disabled={loading || !baseContent.trim()}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700"
            >
              {loading ? '處理中...' : '下一步：各群組微調 →'}
            </button>
          </div>
        )}

        {/* Step 2: Per-group tweak */}
        {step === 'tweak' && (
          <div className="space-y-4">
            {previews.map((p, i) => (
              <div key={p.groupId} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="text-sm font-medium text-gray-700">{p.groupName}</div>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50"
                  rows={3}
                  value={p.content}
                  onChange={(e) => {
                    const next = [...previews];
                    next[i] = { ...next[i], content: e.target.value };
                    setPreviews(next);
                  }}
                />
              </div>
            ))}
            <button
              onClick={handleSend}
              disabled={loading}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-green-700"
            >
              {loading ? '發送中...' : `確認發送至 ${previews.length} 個群組`}
            </button>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 'result' && (
          <div className="space-y-3">
            {results.map((r) => {
              const g = groups.find((g) => g.groupId === r.groupId);
              return (
                <div key={r.groupId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-700">{g?.name || r.groupId}</span>
                  <span className={`text-sm font-medium ${r.status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {r.status === 'success' ? '✓ 成功' : `✗ ${r.error || '失敗'}`}
                  </span>
                </div>
              );
            })}
            <button
              onClick={onDone}
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 mt-2"
            >
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [showBroadcast, setShowBroadcast] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.groups.list();
      setGroups(r.groups);
    } catch {
      setError('無法載入群組，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  function toggleSelect(groupId: string) {
    setSelected((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected([]);
  }

  if (loading) return <p className="text-center text-gray-400 text-sm mt-12">載入中...</p>;
  if (error) return <p className="text-center text-red-500 text-sm mt-12">{error}</p>;

  return (
    <>
      {/* Message drawer */}
      {activeGroup && !selectMode && (
        <MessageDrawer group={activeGroup} onClose={() => setActiveGroup(null)} />
      )}

      {/* Broadcast composer */}
      {showBroadcast && (
        <BroadcastComposer
          selected={selected}
          groups={groups}
          onClose={() => setShowBroadcast(false)}
          onDone={() => { setShowBroadcast(false); exitSelectMode(); }}
        />
      )}

      {/* Header actions */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">群組</h1>
        <div className="flex gap-2">
          {selectMode ? (
            <>
              <button
                onClick={exitSelectMode}
                className="text-sm text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={() => setShowBroadcast(true)}
                disabled={selected.length === 0}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-blue-700"
              >
                廣播 ({selected.length})
              </button>
            </>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              className="text-sm text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              廣播
            </button>
          )}
        </div>
      </div>

      {/* Group list */}
      {groups.length === 0 && (
        <p className="text-center text-gray-400 text-sm mt-12">
          尚無群組。請先將 bot 加入 LINE 群組。
        </p>
      )}

      <div className="space-y-2">
        {groups.map((group) => (
          <div
            key={group.groupId}
            className={`flex items-center gap-3 p-3 bg-white rounded-xl border cursor-pointer transition-colors ${
              selectMode && selected.includes(group.groupId)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => {
              if (selectMode) toggleSelect(group.groupId);
              else setActiveGroup(group);
            }}
          >
            {/* Checkbox in select mode */}
            {selectMode && (
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected.includes(group.groupId) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {selected.includes(group.groupId) && <span className="text-white text-xs">✓</span>}
              </div>
            )}

            {/* Group avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {group.name.charAt(0)}
            </div>

            {/* Group info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-gray-900 text-sm truncate">{group.name}</span>
                {group.lastMessageAt && (
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                    {formatTime(group.lastMessageAt._seconds)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {group.lastMessagePreview || '尚無訊息'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
