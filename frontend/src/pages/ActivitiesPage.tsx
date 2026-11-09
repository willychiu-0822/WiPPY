import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Activity, Group } from '../lib/api';

function ActivityCard({ activity, onClick }: { activity: Activity; onClick: () => void }) {
  const reviewColors: Record<Activity['reviewStatus'], string> = {
    pending_review: 'text-yellow-600',
    approved: 'text-green-600',
    revision_requested: 'text-orange-600',
  };
  const reviewLabels: Record<Activity['reviewStatus'], string> = {
    pending_review: '待審核',
    approved: '已核准',
    revision_requested: '修改中',
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{activity.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {activity.targetGroups.length} 個群組
          </p>
        </div>
        <span className={`text-xs font-medium shrink-0 ${reviewColors[activity.reviewStatus]}`}>
          {reviewLabels[activity.reviewStatus]}
        </span>
      </div>
    </button>
  );
}

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [actRes, groupRes] = await Promise.all([api.activities.list(), api.groups.list()]);
      setActivities(actRes.activities);
      setGroups(groupRes.groups);
    } catch {
      setLoadError('無法載入活動列表，請檢查網路連線後重試');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadActivities(); }, [loadActivities]);

  async function handleCreate() {
    if (creating || !newName.trim()) return;
    setError(null);
    setCreating(true);
    try {
      const res = await api.activities.create(newName.trim(), selectedGroupIds);
      setActivities((prev) => [res.activity, ...prev]);
      setNewName('');
      setSelectedGroupIds([]);
      setShowCreate(false);
      navigate(`/activities/${res.activity.id}`);
    } catch {
      setError('無法建立活動，請檢查網路連線後重試；活動名稱與群組已保留');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400 text-sm">載入中...</div>;
  }

  if (loadError) return (
    <div className="text-center py-12 space-y-3">
      <h1 className="text-lg font-bold text-gray-800">活動列表</h1>
      <p role="alert" className="text-sm text-red-600">{loadError}</p>
      <button onClick={loadActivities} className="text-sm text-blue-600 hover:underline">重試</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">活動列表</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="text-sm bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
        >
          + 新增活動
        </button>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {showCreate && (
        <div className="bg-white border border-blue-200 rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">新增活動</h2>
          <input
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="活動名稱"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229 && handleCreate()}
            autoFocus
          />
          <div className="space-y-2">
            <p className="text-xs text-gray-500">目標群組（可複選）</p>
            {groups.length === 0 ? (
              <p className="text-xs text-gray-500">尚無可選群組。<Link className="text-blue-600 underline" to="/groups">前往群組設定</Link>，依步驟連結 LINE 群組；也可以先建立活動、稍後選群組。</p>
            ) : (
              <div className="max-h-48 overflow-auto border border-gray-100 rounded-xl p-2 space-y-1">
                {groups.map((group) => {
                  const checked = selectedGroupIds.includes(group.groupId);
                  return (
                    <label key={group.groupId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroupIds((prev) => [...prev, group.groupId]);
                            return;
                          }
                          setSelectedGroupIds((prev) => prev.filter((id) => id !== group.groupId));
                        }}
                      />
                      <span className="text-sm text-gray-700 truncate">{group.name || group.groupId}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-400">已選 {selectedGroupIds.length} 個群組</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="text-sm text-gray-500 hover:text-gray-700">取消</button>
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="text-sm bg-blue-500 text-white px-4 py-1.5 rounded-xl hover:bg-blue-600 disabled:opacity-50"
            >
              {creating ? '建立中...' : '建立'}
            </button>
          </div>
        </div>
      )}

      {activities.length === 0 && !showCreate ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-gray-400 text-sm">尚無活動</p>
          <p className="text-gray-300 text-xs">建立第一個活動，讓 Agent 協助規劃推播企畫</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              onClick={() => navigate(`/activities/${a.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
