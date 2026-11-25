import { useState } from 'react';
import { FriendlyNotice } from '../../components/FriendlyNotice';
import { explainRaw, messageKindLabel, shownError, statusLabel } from '../../lib/helperCopy';
import { hubApi, type LogItem, type LogName } from '../hubApi';
import { Button, Card, ErrorText } from '../ui';
import { formatTime } from '../format';
import { useLoad } from '../useLoad';

const ACTION_LABEL: Record<string, string> = {
  send_message: '發訊息到群組',
  send_alert: '發提醒給擁有者',
  send_link: '發連結',
  send_image: '發圖片',
  send_video: '發影片',
  send_audio: '發語音',
  record: '存一筆紀錄',
  schedule_message: '排程訊息',
  complete_inbox: '標記完成',
  complete_dispatch: '完成這次工作',
};

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
    case 'dispatches': return `${s('ruleName') || '一則規則'}｜試了 ${s('attempts') || '0'} 次`;
    case 'actions': return ACTION_LABEL[s('type')] ?? '一項動作';
    case 'inbox': return `${s('ruleName')}｜${s('groupName')}`;
    case 'alerts': return s('text');
    case 'media': return `${messageKindLabel(s('messageType'))}${s('fileName') ? ` ${s('fileName')}` : ''}`.trim();
    case 'audit': return statusLabel(s('status')) || '有一筆操作紀錄';
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
      setError(shownError(err, '沒有重試成功。請稍後再試一次。'));
    }
  }

  return (
    <Card title="處理過程">
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
              <p className="text-xs text-gray-400">{formatTime(String(item['createdAt'] ?? item['at'] ?? ''))}・{statusLabel(typeof item.status === 'string' ? item.status : '')}・{item.id}</p>
              {typeof item['lastError'] === 'string' && (
                <FriendlyNotice
                  notice={explainRaw(item['lastError'], '這一步沒有完成。請按重試；若一直失敗，把下方細節轉給協助你的人。')}
                  role="alert"
                  className="text-xs text-red-600"
                />
              )}
              {typeof item['detail'] === 'string' && (
                <FriendlyNotice
                  notice={explainRaw(item['detail'], '這裡有一則系統說明。請把下方細節轉給協助你的人。')}
                  className="text-xs text-gray-500"
                />
              )}
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
