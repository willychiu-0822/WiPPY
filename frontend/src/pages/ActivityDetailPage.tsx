import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Activity, ActivityMessage, ActivityKnowledge, AgentChatApiResponse, Group } from '../lib/api';
import ReviewBanner from '../components/ReviewBanner';
import KnowledgeEditor from '../components/KnowledgeEditor';
import AgentChatPanel from '../components/AgentChatPanel';
import MessagePlanTable from '../components/MessagePlanTable';

type Tab = 'knowledge' | 'agent' | 'plan' | 'history';

const TABS: { id: Tab; label: string }[] = [
  { id: 'knowledge', label: '知識庫' },
  { id: 'agent', label: 'Agent 對話' },
  { id: 'plan', label: '推播企畫' },
  { id: 'history', label: '發送紀錄' },
];

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<ActivityMessage[]>([]);
  const [knowledge, setKnowledge] = useState<ActivityKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('agent');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [groupSaving, setGroupSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const lsKey = id ? `wippy_session_${id}` : null;

  const loadAll = useCallback(async () => {
    if (!id) return;
    try {
      const [actRes, msgRes, knowRes, groupRes] = await Promise.all([
        api.activities.get(id),
        api.activities.messages.list(id),
        api.activities.knowledge.list(id),
        api.groups.list(),
      ]);
      setActivity(actRes.activity);
      setMessages(msgRes.messages);
      setKnowledge(knowRes.knowledge);
      setGroups(groupRes.groups);

      // sessionId: Firestore is authoritative; sync localStorage to match
      const firestoreSession = actRes.activity.agentSessionId;
      if (firestoreSession) {
        setSessionId(firestoreSession);
        if (lsKey) localStorage.setItem(lsKey, firestoreSession);
      } else if (lsKey) {
        const cached = localStorage.getItem(lsKey);
        if (cached) setSessionId(cached);
      }
    } catch (err) {
      setError(String(err));
    }
  }, [id, lsKey]);

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  async function handleApprove() {
    if (!id) return;
    setReviewLoading(true);
    try {
      const res = await api.activities.approve(id);
      setActivity(res.activity);
      await api.activities.messages.list(id).then((r) => setMessages(r.messages));
    } catch (err) {
      setError(String(err));
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleRequestRevision() {
    if (!id) return;
    setReviewLoading(true);
    try {
      const res = await api.activities.requestRevision(id);
      setActivity(res.activity);
      await api.activities.messages.list(id).then((r) => setMessages(r.messages));
    } catch (err) {
      setError(String(err));
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleAgentChat(message: string, sid: string | null): Promise<AgentChatApiResponse> {
    return api.agent.chat(id!, message, sid ?? undefined);
  }

  function handleSessionId(newId: string) {
    setSessionId(newId);
    if (lsKey) localStorage.setItem(lsKey, newId);
  }

  // ── Knowledge handlers ─────────────────────────────────────────────────────

  async function handleAddKnowledge(data: { knowledgeType: ActivityKnowledge['knowledgeType']; title: string; content: string }) {
    if (!id) return;
    const res = await api.activities.knowledge.create(id, data);
    setKnowledge((prev) => [...prev, res.knowledge]);
  }

  async function handleUpdateKnowledge(knowledgeId: string, patch: { title?: string; content?: string }) {
    if (!id) return;
    const res = await api.activities.knowledge.update(id, knowledgeId, patch);
    setKnowledge((prev) => prev.map((k) => (k.id === knowledgeId ? res.knowledge : k)));
  }

  async function handleDeleteKnowledge(knowledgeId: string) {
    if (!id) return;
    await api.activities.knowledge.delete(id, knowledgeId);
    setKnowledge((prev) => prev.filter((k) => k.id !== knowledgeId));
  }

  // ── Message handlers ───────────────────────────────────────────────────────

  async function handleUpdateMessage(msgId: string, patch: { content?: string; triggerValue?: string; sequenceOrder?: number }) {
    if (!id) return;
    const res = await api.activities.messages.update(id, msgId, patch);
    setMessages((prev) => prev.map((m) => (m.id === msgId ? res.message : m)));
  }

  async function handleDeleteMessage(msgId: string) {
    if (!id) return;
    await api.activities.messages.delete(id, msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  async function handleToggleGroup(groupId: string, checked: boolean) {
    if (!id || !activity) return;
    const nextTargetGroups = checked
      ? [...activity.targetGroups, groupId]
      : activity.targetGroups.filter((id) => id !== groupId);

    setGroupSaving(true);
    try {
      const res = await api.activities.update(id, { targetGroups: nextTargetGroups });
      setActivity(res.activity);
    } catch (err) {
      setError(String(err));
    } finally {
      setGroupSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">載入中...</div>;
  if (!activity) return (
    <div className="text-center py-12 space-y-2">
      <p className="text-gray-400 text-sm">找不到活動</p>
      <button onClick={() => navigate('/activities')} className="text-blue-500 text-sm hover:underline">返回活動列表</button>
    </div>
  );

  const planLocked = activity.reviewStatus === 'approved';

  return (
    <div className="space-y-4">
      {/* Back + title */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/activities')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 返回
        </button>
        <h1 className="text-lg font-bold text-gray-800 truncate">{activity.name}</h1>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-700">活動目標群組</p>
          <span className="text-xs text-gray-400">
            已選 {activity.targetGroups.length} 個
            {groupSaving ? ' · 儲存中...' : ''}
          </span>
        </div>
        {groups.length === 0 ? (
          <p className="text-xs text-gray-400">尚無可選群組，請先到群組頁同步。</p>
        ) : (
          <div className="max-h-52 overflow-auto border border-gray-100 rounded-xl p-2 space-y-1">
            {groups.map((group) => {
              const checked = activity.targetGroups.includes(group.groupId);
              return (
                <label key={group.groupId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={groupSaving}
                    onChange={(e) => handleToggleGroup(group.groupId, e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 truncate">{group.name || group.groupId}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Review banner */}
      <ReviewBanner
        activity={activity}
        onApprove={handleApprove}
        onRequestRevision={handleRequestRevision}
        loading={reviewLoading}
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-sm px-4 py-2.5 border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
            {t.id === 'plan' && messages.length > 0 && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                {messages.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pb-8">
        {tab === 'knowledge' && (
          <KnowledgeEditor
            knowledge={knowledge}
            onAdd={handleAddKnowledge}
            onUpdate={handleUpdateKnowledge}
            onDelete={handleDeleteKnowledge}
          />
        )}

        {tab === 'agent' && (
          <AgentChatPanel
            activityId={id!}
            sessionId={sessionId}
            onSessionId={handleSessionId}
            onMessagesGenerated={() => {
              api.activities.messages.list(id!).then((r) => setMessages(r.messages));
              setTab('plan');
            }}
            onKnowledgeExtracted={() => {
              api.activities.knowledge.list(id!).then((r) => setKnowledge(r.knowledge));
            }}
            onSendMessage={handleAgentChat}
          />
        )}

        {tab === 'plan' && (
          <MessagePlanTable
            messages={messages}
            locked={planLocked}
            onUpdate={handleUpdateMessage}
            onDelete={handleDeleteMessage}
          />
        )}

        {tab === 'history' && (
          <SendHistoryTab activityId={id!} />
        )}
      </div>
    </div>
  );
}

// ── Inline send history tab ────────────────────────────────────────────────────

function SendHistoryTab({ activityId }: { activityId: string }) {
  const [logs, setLogs] = useState<Array<{ id: string; groupId: string; content: string; status: string; sentAt: { _seconds: number }; triggerType: string; errorMessage: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sendLogs.list({ activityId, limit: 50 })
      .then((res) => setLogs(res.logs as typeof logs))
      .finally(() => setLoading(false));
  }, [activityId]);

  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">載入中...</div>;
  if (logs.length === 0) return <p className="text-sm text-gray-400 text-center py-12">尚無發送紀錄</p>;

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="bg-white border border-gray-100 rounded-xl p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 line-clamp-2">{log.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(log.sentAt._seconds * 1000).toLocaleString('zh-TW')} · {log.groupId}
              </p>
              {log.errorMessage && (
                <p className="text-xs text-red-500 mt-1">{log.errorMessage}</p>
              )}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {log.status === 'success' ? '成功' : '失敗'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
