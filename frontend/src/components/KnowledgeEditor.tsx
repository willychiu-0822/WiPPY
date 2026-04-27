import { useState } from 'react';
import type { ActivityKnowledge } from '../lib/api';

interface Props {
  knowledge: ActivityKnowledge[];
  onAdd: (data: { knowledgeType: ActivityKnowledge['knowledgeType']; title: string; content: string }) => Promise<void>;
  onUpdate: (id: string, patch: { title?: string; content?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TYPE_LABELS: Record<ActivityKnowledge['knowledgeType'], string> = {
  background: '背景設定',
  restriction: '禁止事項',
  character: '角色設定',
  faq: 'FAQ',
};

const SOURCE_BADGE: Record<ActivityKnowledge['sourceType'], { label: string; style: string }> = {
  manual: { label: '手動', style: 'bg-gray-100 text-gray-600' },
  upload: { label: '上傳', style: 'bg-blue-100 text-blue-600' },
  agent_generated: { label: 'AI 生成', style: 'bg-purple-100 text-purple-600' },
};

const KNOWLEDGE_TYPES: ActivityKnowledge['knowledgeType'][] = ['background', 'restriction', 'character', 'faq'];

interface EditState { id: string; title: string; content: string }

export default function KnowledgeEditor({ knowledge, onAdd, onUpdate, onDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<ActivityKnowledge['knowledgeType']>('background');
  const [addTitle, setAddTitle] = useState('');
  const [addContent, setAddContent] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!addTitle.trim() || !addContent.trim()) return;
    setAdding(true);
    try {
      await onAdd({ knowledgeType: addType, title: addTitle.trim(), content: addContent.trim() });
      setAddTitle('');
      setAddContent('');
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      await onUpdate(editing.id, { title: editing.title, content: editing.content });
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {knowledge.length === 0 && !showAdd && (
        <p className="text-sm text-gray-400 text-center py-8">尚無知識條目，請新增活動背景資訊，或直接在「Agent 對話」描述活動。</p>
      )}

      {KNOWLEDGE_TYPES.map((type) => {
        const items = knowledge.filter((k) => k.knowledgeType === type);
        if (items.length === 0) return null;
        return (
          <div key={type}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {TYPE_LABELS[type]}
            </h3>
            <div className="space-y-2">
              {items.map((k) =>
                editing?.id === k.id ? (
                  <div key={k.id} className="bg-white border border-blue-200 rounded-xl p-3 space-y-2">
                    <input
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    />
                    <textarea
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                      rows={3}
                      value={editing.content}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditing(null)} className="text-xs text-gray-500 hover:text-gray-700">取消</button>
                      <button onClick={handleSaveEdit} disabled={saving} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 disabled:opacity-50">
                        {saving ? '儲存中...' : '儲存'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={k.id} className="bg-white border border-gray-100 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate">{k.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${SOURCE_BADGE[k.sourceType].style}`}>
                            {SOURCE_BADGE[k.sourceType].label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{k.content}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditing({ id: k.id, title: k.title, content: k.content })}
                          className="text-xs text-blue-500 hover:text-blue-700 px-1"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => onDelete(k.id)}
                          className="text-xs text-red-400 hover:text-red-600 px-1"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}

      {showAdd ? (
        <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">新增知識條目</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">類型</label>
            <select
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={addType}
              onChange={(e) => setAddType(e.target.value as ActivityKnowledge['knowledgeType'])}
            >
              {KNOWLEDGE_TYPES.filter((t) => t !== 'faq').map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">標題</label>
            <input
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="例：主角 — 艾瑞克"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">內容</label>
            <textarea
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              rows={4}
              placeholder="詳細描述此知識條目的內容..."
              value={addContent}
              onChange={(e) => setAddContent(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="text-sm text-gray-500 hover:text-gray-700">取消</button>
            <button
              onClick={handleAdd}
              disabled={adding || !addTitle.trim() || !addContent.trim()}
              className="text-sm bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {adding ? '新增中...' : '新增'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full text-sm text-blue-500 hover:text-blue-700 border border-dashed border-blue-200 rounded-xl py-3 hover:border-blue-400 transition-colors"
        >
          + 新增知識條目
        </button>
      )}
    </div>
  );
}
