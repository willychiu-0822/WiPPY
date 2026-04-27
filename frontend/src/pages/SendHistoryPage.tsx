import { useState, useEffect } from 'react';
import { api, type SendLog } from '../lib/api';

const TRIGGER_LABEL: Record<string, string> = {
  scheduled: '排程',
  keyword: '關鍵字',
  manual: '手動',
  broadcast: '廣播',
};

function formatDateTime(seconds: number | undefined): string {
  if (!seconds) return '';
  return new Date(seconds * 1000).toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SendHistoryPage() {
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    api.sendLogs.list({ limit: 30 }).then((r) => {
      setLogs(r.logs);
      setHasMore(r.hasMore);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center text-gray-400 text-sm mt-12">載入中...</p>;

  return (
    <>
      <h1 className="text-lg font-bold text-gray-900 mb-4">發送記錄</h1>

      {logs.length === 0 && (
        <p className="text-center text-gray-400 text-sm mt-12">尚無發送記錄</p>
      )}

      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  log.status === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {log.status === 'success' ? '成功' : '失敗'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {TRIGGER_LABEL[log.triggerType] || log.triggerType}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {formatDateTime(log.sentAt._seconds)}
              </span>
            </div>
            <p className="text-sm text-gray-800 line-clamp-2">{log.content}</p>
            {log.errorMessage && (
              <p className="text-xs text-red-500">{log.errorMessage}</p>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <p className="text-center text-gray-400 text-xs mt-4">顯示最近 30 筆</p>
      )}
    </>
  );
}
