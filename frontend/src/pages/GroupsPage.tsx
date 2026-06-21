import { useState, useEffect, useCallback } from 'react';
import { api, type Group, type RecentMessage, type BroadcastPreview, type WaterAdminMember, type WaterGroupConfig } from '../lib/api';

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
  const [tab, setTab] = useState<'messages' | 'water'>('messages');
  const [messages, setMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [waterMembers, setWaterMembers] = useState<WaterAdminMember[]>([]);
  const [waterLoading, setWaterLoading] = useState(true);
  const [waterError, setWaterError] = useState('');
  const [resettingUserId, setResettingUserId] = useState('');
  const [resetFeedback, setResetFeedback] = useState('');
  const [waterConfig, setWaterConfig] = useState<WaterGroupConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configFeedback, setConfigFeedback] = useState('');

  useEffect(() => {
    api.groups.messages(group.groupId).then((r) => {
      setMessages(r.messages);
      setLoading(false);
    });

    api.groups.waterMembers(group.groupId)
      .then((r) => {
        setWaterMembers(r.members);
        setWaterError('');
      })
      .catch(() => setWaterError('無法載入喝水資料'))
      .finally(() => setWaterLoading(false));

    api.groups.waterConfig(group.groupId)
      .then((config) => {
        setWaterConfig(config);
        setConfigFeedback('');
      })
      .catch(() => setConfigFeedback('無法載入喝水功能設定'))
      .finally(() => setConfigLoading(false));
  }, [group.groupId]);

  async function reloadWaterMembers() {
    setWaterLoading(true);
    try {
      const r = await api.groups.waterMembers(group.groupId);
      setWaterMembers(r.members);
      setWaterError('');
    } catch {
      setWaterError('無法載入喝水資料');
    } finally {
      setWaterLoading(false);
    }
  }

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

  async function handleResetWater(member: WaterAdminMember) {
    const confirmed = window.confirm(`要把 ${member.displayName} 今天的喝水紀錄重置為 0 嗎？`);
    if (!confirmed) return;

    setResettingUserId(member.lineUserId);
    setResetFeedback('');
    try {
      const result = await api.groups.resetWaterToday(group.groupId, member.lineUserId);
      await reloadWaterMembers();
      setResetFeedback(`已重置 ${member.displayName}，刪除 ${result.removedRecordCount} 筆、${result.removedMl} ml`);
    } catch {
      setResetFeedback(`重置 ${member.displayName} 失敗`);
    } finally {
      setResettingUserId('');
    }
  }

  async function handleToggleWaterEnabled(nextEnabled: boolean) {
    const actionLabel = nextEnabled ? '啟用' : '停用';
    const confirmed = window.confirm(`要為「${group.name}」${actionLabel}喝水競賽功能嗎？`);
    if (!confirmed) return;

    setConfigSaving(true);
    setConfigFeedback('');
    try {
      const next = await api.groups.updateWaterConfig(group.groupId, nextEnabled);
      setWaterConfig(next);
      if (nextEnabled) {
        setConfigFeedback(next.messageSent === false && next.messageError
          ? `已啟用，但自動發送群組連結失敗：${next.messageError}`
          : '已啟用，系統已自動把專屬 LIFF 連結發到該群組');
      } else {
        setConfigFeedback('已停用喝水競賽功能');
      }
    } catch {
      setConfigFeedback(`${actionLabel}喝水競賽功能失敗`);
    } finally {
      setConfigSaving(false);
    }
  }

  async function handleCopyEntryUrl() {
    if (!waterConfig?.entryUrl) return;
    try {
      await navigator.clipboard.writeText(waterConfig.entryUrl);
      setConfigFeedback('已複製群組專屬 LIFF 入口連結');
    } catch {
      setConfigFeedback(waterConfig.entryUrl);
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

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setTab('messages')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              tab === 'messages' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            訊息
          </button>
          <button
            onClick={() => setTab('water')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              tab === 'water' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            喝水管理
          </button>
        </div>
        {resetFeedback && (
          <p className="mt-2 text-xs text-blue-600">{resetFeedback}</p>
        )}
        {configFeedback && (
          <p className="mt-2 text-xs text-emerald-600">{configFeedback}</p>
        )}
      </div>

      {tab === 'messages' ? (
        <>
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
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-sky-900">喝水競賽入口</p>
                <p className="text-xs text-sky-700 mt-1">
                  啟用後系統會自動把帶 `groupId` 的專屬 LIFF 連結發到這個 LINE 群組。舊版沒有 `wg` 的連結不再可用。
                </p>
              </div>
              <button
                onClick={() => handleToggleWaterEnabled(!(waterConfig?.enabled ?? false))}
                disabled={configLoading || configSaving}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  waterConfig?.enabled
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-sky-600 text-white hover:bg-sky-700'
                } disabled:opacity-50`}
              >
                {configSaving ? '處理中...' : waterConfig?.enabled ? '停用' : '啟用'}
              </button>
            </div>
            {waterConfig && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  目前狀態：{waterConfig.enabled ? '已啟用' : '未啟用'}
                </p>
                <div className="rounded-lg bg-white border border-sky-100 px-3 py-2 text-xs break-all text-slate-600">
                  {waterConfig.entryUrl}
                </div>
                <button
                  onClick={handleCopyEntryUrl}
                  className="text-xs text-sky-700 font-medium hover:text-sky-900"
                >
                  複製專屬入口連結
                </button>
              </div>
            )}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            這裡會刪除該成員今日所有喝水紀錄，並把今日水量重置為 0。週總量與總量會同步重算，連勝與成就先保留。
          </div>
          {waterLoading && <p className="text-center text-gray-400 text-sm mt-8">載入中...</p>}
          {!waterLoading && waterError && (
            <div className="space-y-3">
              <p className="text-center text-red-500 text-sm mt-8">{waterError}</p>
              <button
                onClick={reloadWaterMembers}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                重新載入
              </button>
            </div>
          )}
          {!waterLoading && !waterError && waterMembers.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-8">這個群組目前還沒有喝水成員資料</p>
          )}
          {waterMembers.map((member) => (
            <div key={member.lineUserId} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-600">#{member.rank}</span>
                    <p className="text-sm font-medium text-gray-900 truncate">{member.displayName}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 break-all">{member.lineUserId}</p>
                </div>
                <button
                  onClick={() => handleResetWater(member)}
                  disabled={resettingUserId === member.lineUserId}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                >
                  {resettingUserId === member.lineUserId ? '重置中...' : '今日歸零'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-sky-50 px-3 py-2">
                  <div className="text-sky-600">今日</div>
                  <div className="mt-1 font-semibold text-gray-900">{member.todayMl} ml</div>
                </div>
                <div className="rounded-lg bg-emerald-50 px-3 py-2">
                  <div className="text-emerald-600">本週</div>
                  <div className="mt-1 font-semibold text-gray-900">{member.weekMl} ml</div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-gray-500">累積</div>
                  <div className="mt-1 font-semibold text-gray-900">{member.totalMl} ml</div>
                </div>
                <div className="rounded-lg bg-violet-50 px-3 py-2">
                  <div className="text-violet-600">連勝</div>
                  <div className="mt-1 font-semibold text-gray-900">{member.streak} 天</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
