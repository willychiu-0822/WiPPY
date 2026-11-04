import { useState } from 'react';
import { getErrorMessage } from '../../lib/apiError';
import { hubApi } from '../hubApi';
import { Card, ErrorText, Switch } from '../ui';
import { useLoad } from '../useLoad';

export default function GroupAccessPage() {
  const { data, setData, loading, error } = useLoad(() => hubApi.admin.groups().then((r) => r.groups));
  const [saving, setSaving] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggle(groupId: string, enabled: boolean) {
    setSaving(groupId);
    setActionError(null);
    try {
      const { group } = await hubApi.admin.setGroupAccess(groupId, enabled);
      setData((prev) => prev?.map((g) => (g.groupId === groupId ? { ...g, agentEnabled: group.agentEnabled } : g)) ?? null);
    } catch (err) {
      setActionError(getErrorMessage(err, '更新失敗'));
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card title="群組開放給 Agent">
      <p className="text-xs text-gray-500">預設全部關閉。只有開啟的群組，訊息才會被保存、交給 Agent，Agent 也才能發訊息到這個群組。</p>
      <ErrorText error={error ?? actionError} />
      {loading && <p className="text-sm text-gray-400">載入中...</p>}
      <ul className="divide-y divide-gray-100">
        {data?.map((g) => (
          <li key={g.groupId} className="flex items-center justify-between py-3 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{g.name}</p>
              <p className="text-xs text-gray-400">{g.memberCount} 人・{g.agentEnabled ? '已開放' : '未開放'}</p>
            </div>
            <Switch label={`${g.name} 允許 Agent 讀取`} checked={g.agentEnabled} disabled={saving === g.groupId} onChange={(on) => toggle(g.groupId, on)} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
