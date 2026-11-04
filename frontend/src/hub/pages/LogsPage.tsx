import { useState } from 'react';
import { getErrorMessage } from '../../lib/apiError';
import { hubApi, type LogItem, type LogName } from '../hubApi';
import { Button, Card, ErrorText } from '../ui';
import { formatTime } from '../format';
import { useLoad } from '../useLoad';

const TABS: Array<{ name: LogName; label: string }> = [
  { name: 'dispatches', label: '派送' },
  { name: 'actions', label: '動作' },
  { name: 'inbox', label: '收件匣' },
  { name: 'alerts', label: '預警' },
  { name: 'media', label: '媒體' },
  { name: 'audit', label: '稽核' },
];
const RETRYABLE: LogName[] = ['dispatches', 'actions', 'media'];

function summary(name: LogName, item: LogItem): string {
  const s = (k: string) => (item[k] === undefined || item[k] === null ? '' : String(item[k]));
  switch (name) {
    case 'dispatches': return `${s('ruleName')} → ${s('agentId')}｜嘗試 ${s('attempts')} 次`;
    case 'actions': return `${s('actorKey')}：${s('type')}${s('code') ? `｜${s('code')}` : ''}`;
    case 'inbox': return `${s('ruleName')}｜${s('groupName')}`;
    case 'alerts': return `[${s('severity')}] ${s('text')}`;
    case 'media': return `${s('messageType')} ${s('fileName')}`;
    case 'audit': return `${s('actor')}（${s('via')}）${s('action')} → ${s('status')}${s('code') ? `｜${s('code')}` : ''}`;
  }
}

export default function LogsPage() {
  const [tab, setTab] = useState<LogName>('dispatches');
  const log = useLoad(() => hubApi.admin.log(tab).then((r) => r.items), [tab]);
  const [error, setError] = useState<string | null>(null);

  async function retry(id: string) {
    setError(null);
    try {
      await hubApi.admin.retry(tab as 'dispatches' | 'actions' | 'media', id);
      await log.reload();
    } catch (err) {
      setError(getErrorMessage(err, '重試失敗'));
    }
  }

  return (
    <Card title="執行紀錄">
      <div className="flex flex-wrap gap-1" role="tablist">
        {TABS.map((t) => (
          <button key={t.name} type="button" role="tab" aria-selected={tab === t.name} onClick={() => setTab(t.name)} className={`px-3 py-1.5 rounded-lg text-sm ${tab === t.name ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <ErrorText error={log.error ?? error} />
      {log.data?.length === 0 && <p className="text-sm text-gray-400">沒有資料</p>}
      <ul className="divide-y divide-gray-100">
        {log.data?.map((item) => (
          <li key={item.id} className="py-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-gray-900 break-words">{summary(tab, item)}</p>
              <p className="text-xs text-gray-400">{formatTime(String(item['createdAt'] ?? item['at'] ?? ''))}・{item.status ?? ''}・{item.id}</p>
              {typeof item['lastError'] === 'string' && <p className="text-xs text-red-600 break-words">{String(item['lastError'])}</p>}
              {typeof item['detail'] === 'string' && <p className="text-xs text-gray-500 break-words">{String(item['detail'])}</p>}
            </div>
            {RETRYABLE.includes(tab) && item.status === 'failed' && (
              <Button variant="secondary" label={`重試 ${item.id}`} onClick={() => void retry(item.id)}>重試</Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
