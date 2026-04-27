import { useState } from 'react';
import type { ActivityMessage } from '../lib/api';

interface Props {
  messages: ActivityMessage[];
  locked: boolean;
  onUpdate: (id: string, patch: { content?: string; triggerValue?: string; sequenceOrder?: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const REVIEW_BADGE: Record<ActivityMessage['reviewStatus'], { label: string; style: string }> = {
  pending_review: { label: '待審核', style: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已核准', style: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒絕', style: 'bg-red-100 text-red-700' },
};

const STATUS_BADGE: Record<ActivityMessage['status'], { label: string; style: string }> = {
  pending: { label: '待發送', style: 'bg-gray-100 text-gray-600' },
  sent: { label: '已送出', style: 'bg-blue-100 text-blue-700' },
  failed: { label: '失敗', style: 'bg-red-100 text-red-700' },
};

function formatTriggerValue(v: string) {
  try {
    return new Date(v).toLocaleString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return v;
  }
}

interface EditState { id: string; content: string; triggerValue: string }

export default function MessagePlanTable({ messages, locked, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = [...messages].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      await onUpdate(editing.id, { content: editing.content, triggerValue: editing.triggerValue });
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  if (messages.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-12">
        尚無推播訊息，請在「Agent 對話」讓 Agent 規劃企畫。
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((msg) =>
        editing?.id === msg.id ? (
          <div key={msg.id} className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">發送時間（ISO 格式）</label>
              <input
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={editing.triggerValue}
                onChange={(e) => setEditing({ ...editing, triggerValue: e.target.value })}
                placeholder="2025-05-10T10:00:00+08:00"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">訊息內容</label>
              <textarea
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                rows={4}
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="text-xs text-gray-500 hover:text-gray-700">取消</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        ) : (
          <div key={msg.id} className="bg-white border border-gray-100 rounded-xl p-3">
            <div className="flex items-start gap-3">
              {/* Sequence number */}
              <span className="text-xs font-mono text-gray-400 mt-0.5 shrink-0 w-5 text-center">
                {msg.sequenceOrder}
              </span>

              <div className="flex-1 min-w-0">
                {/* Time + badges */}
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className="text-xs text-blue-600 font-medium">
                    {formatTriggerValue(msg.triggerValue)}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${REVIEW_BADGE[msg.reviewStatus].style}`}>
                    {REVIEW_BADGE[msg.reviewStatus].label}
                  </span>
                  {msg.status !== 'pending' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_BADGE[msg.status].style}`}>
                      {STATUS_BADGE[msg.status].label}
                    </span>
                  )}
                  {msg.generatedByAgent && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">AI</span>
                  )}
                </div>

                {/* Content */}
                <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{msg.content}</p>

                {/* Target groups */}
                <p className="text-xs text-gray-400 mt-1">
                  群組：{msg.targetGroups.join(', ') || '（無）'}
                </p>
              </div>

              {/* Actions — disabled when locked or message already sent */}
              {!locked && msg.status === 'pending' && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditing({ id: msg.id, content: msg.content, triggerValue: msg.triggerValue })}
                    className="text-xs text-blue-500 hover:text-blue-700 px-1"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => onDelete(msg.id)}
                    className="text-xs text-red-400 hover:text-red-600 px-1"
                  >
                    刪除
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
