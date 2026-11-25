import { useState } from 'react';
import { shownError } from '../../lib/helperCopy';
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
      setActionError(shownError(err, '沒有更新成功。請稍後再試一次。'));
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card title="哪些群組交給小幫手">
      <p className="text-xs text-gray-500">預設全部關閉。只有打開的群組，對話才會留下來交給小幫手，小幫手也才能發訊息到這個群組。</p>
      <ErrorText error={error ?? actionError} />
      {loading && <p className="text-sm text-gray-400">載入中...</p>}
      <ul className="divide-y divide-gray-100">
        {data?.map((g) => (
          <li key={g.groupId} className="flex items-center justify-between py-3 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{g.name}</p>
              <p className="text-xs text-gray-400">{g.memberCount} 人・{g.agentEnabled ? '已開放' : '未開放'}</p>
            </div>
            <Switch label={`${g.name} 交給小幫手`} checked={g.agentEnabled} disabled={saving === g.groupId} onChange={(on) => toggle(g.groupId, on)} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
