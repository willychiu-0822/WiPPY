import type { Activity } from '../lib/api';

interface Props {
  activity: Activity;
  onApprove: () => void;
  onRequestRevision: () => void;
  loading?: boolean;
  hasMessages?: boolean;
}

const STATUS_CONFIG = {
  pending_review: {
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-800',
    label: '企畫待審核',
    desc: '請確認推播訊息內容與時間後核准，核准後訊息將依排程自動發送。',
    primary: { label: '核准企畫', action: 'approve' as const, style: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
    secondary: null,
  },
  approved: {
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-800',
    label: '企畫已核准',
    desc: '訊息將依排程自動發送到目標群組。',
    primary: null,
    secondary: { label: '要求修改', action: 'revision' as const, style: 'text-green-700 hover:text-green-900 underline' },
  },
  revision_requested: {
    bg: 'bg-orange-50 border-orange-200',
    text: 'text-orange-800',
    label: '修改中 — 待發訊息已暫停',
    desc: '請在「Agent 對話」重新規劃，或直接在「推播企畫」編輯後重新核准。',
    primary: { label: '重新核准', action: 'approve' as const, style: 'bg-orange-500 hover:bg-orange-600 text-white' },
    secondary: null,
  },
} as const;

export default function ReviewBanner({ activity, onApprove, onRequestRevision, loading, hasMessages = true }: Props) {
  if (!hasMessages && activity.reviewStatus !== 'approved') return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
      <p className="text-sm font-semibold text-blue-900">先建立推播企畫</p>
      <p className="text-xs text-blue-800 mt-1">在「Agent 對話」描述活動，或請 AI 規劃第一份推播。產生訊息後，確認群組、內容與時間，再核准發送。</p>
    </div>
  );
  const config = STATUS_CONFIG[activity.reviewStatus];
  const needsGroup = activity.targetGroups.length === 0;

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${config.bg}`}>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${config.text}`}>{config.label}</p>
        <p className={`text-xs mt-0.5 ${config.text} opacity-80`}>{config.desc}</p>
        {config.primary && needsGroup && (
          <p className={`text-xs mt-1 ${config.text}`}>請先在上方選擇至少一個目標群組，再核准企畫。</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {config.secondary && (
          <button
            onClick={onRequestRevision}
            disabled={loading}
            className={`text-xs ${config.secondary.style} disabled:opacity-50`}
          >
            {config.secondary.label}
          </button>
        )}
        {config.primary && (
          <button
            onClick={config.primary.action === 'approve' ? onApprove : onRequestRevision}
            disabled={loading || needsGroup}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium ${config.primary.style} disabled:opacity-50`}
          >
            {loading ? '處理中...' : config.primary.label}
          </button>
        )}
      </div>
    </div>
  );
}
