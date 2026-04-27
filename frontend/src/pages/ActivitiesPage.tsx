import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([api.activities.list(), api.groups.list()])
      .then(([actRes, groupRes]) => {
        setActivities(actRes.activities);
        setGroups(groupRes.groups);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await api.activities.create(newName.trim(), selectedGroupIds);
      setActivities((prev) => [res.activity, ...prev]);
      setNewName('');
      setSelectedGroupIds([]);
      setShowCreate(false);
      navigate(`/activities/${res.activity.id}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400 text-sm">載入中...</div>;
  }

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
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
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
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="space-y-2">
            <p className="text-xs text-gray-500">目標群組（可複選）</p>
            {groups.length === 0 ? (
              <p className="text-xs text-gray-400">尚無可選群組，請先到群組頁同步。</p>
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
