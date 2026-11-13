import { hubApi } from '../hubApi';
import { Card, ErrorText } from '../ui';
import { formatTime } from '../format';
import { useLoad } from '../useLoad';

export default function DashboardPage() {
  const dash = useLoad(() => hubApi.admin.dashboard());
  const d = dash.data;
  if (!d) return <Card title="總覽"><ErrorText error={dash.error} /><p className="text-sm text-gray-400">載入中...</p></Card>;
  const q = d.quota;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="LINE 推播額度（本月）">
          {q.unknown ? <p className="text-sm text-gray-500">暫時無法取得額度</p> : q.type === 'none' ? <p className="text-sm text-gray-700">無上限方案</p> : (
            <>
              <p className="text-lg font-semibold text-gray-900">{q.used} / {q.limit} 則（{q.percent}%）</p>
              {q.projectedMonthEnd !== null && q.projectedMonthEnd !== undefined && <p className="text-xs text-gray-500">預估月底 {q.projectedMonthEnd} 則</p>}
              <p className="text-xs text-gray-400">剩 {q.remaining} 則，其中 {q.reserve} 則保留給預警</p>
            </>
          )}
        </Card>
        <Card title="免費模型（今天）">
          <p className="text-lg font-semibold text-gray-900">{d.llm.today} / {d.llm.maxRpd} 次</p>
        </Card>
      </div>
      <Card title="Agent 今日發送">
        {d.agents.length === 0 && <p className="text-sm text-gray-400">還沒有 Agent</p>}
        <ul className="text-sm text-gray-700 space-y-1">
          {d.agents.map((a) => <li key={a.id}>{a.name}：今天 {a.sendsToday} / {a.dailySendLimit} 次{a.enabled ? '' : '（已停用）'}</li>)}
        </ul>
        <p className="text-xs text-gray-500">待處理收件匣 {d.openInbox} 項・失敗：派送 {d.failed.dispatches}、動作 {d.failed.actions}、媒體 {d.failed.media}</p>
      </Card>
      <Card title="最近預警">
        {d.recentAlerts.length === 0 && <p className="text-sm text-gray-400">沒有預警</p>}
        <ul className="space-y-2">
          {d.recentAlerts.map((a) => (
            <li key={a.id} className="text-sm">
              <p className="text-gray-900">{a.text}</p>
              <p className="text-xs text-gray-400">{formatTime(a.createdAt)}・{a.severity}・{a.delivered ? '已送到預警群組' : `未送出（${a.deliveryError ?? '未知'}）`}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
