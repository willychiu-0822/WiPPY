import type { LearningRunView } from '../api/types';
import { isActiveRunStatus, type ActiveLearningRunStatus } from './runStatus';

const activeCopy: Record<ActiveLearningRunStatus, string> = {
  pending_enqueue: '準備開始整理內容。',
  queued: '內容已排入整理，閱讀頁可以先看。',
  running: '正在整理內容，閱讀頁可以先看。',
  publishing: '快好了，正在更新知識庫。',
};

export function SourceProcessingStatus({
  run,
  transportError,
  onRefresh,
  onRetry,
}: {
  run: LearningRunView | null;
  transportError: string | null;
  onRefresh: () => void;
  onRetry: () => void;
}) {
  if (!run && !transportError) return null;

  if (transportError) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" aria-live="polite">
        <h2 className="font-semibold">暫時連不上處理狀態</h2>
        <p className="mt-1">{transportError}</p>
        <button type="button" onClick={onRefresh} className="mt-3 rounded-lg bg-white px-3 py-2 font-medium text-amber-900">
          再試一次
        </button>
      </section>
    );
  }

  if (!run) return null;

  if (isActiveRunStatus(run.status)) {
    return (
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900" aria-live="polite">
        <h2 className="font-semibold">正在處理來源</h2>
        <p className="mt-1">{activeCopy[run.status]}</p>
        <button type="button" onClick={onRefresh} className="mt-3 rounded-lg bg-white px-3 py-2 font-medium text-blue-900">
          手動刷新
        </button>
      </section>
    );
  }

  if (run.status === 'retryable') {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" aria-live="polite">
        <h2 className="font-semibold">處理暫時卡住</h2>
        <p className="mt-1">處理暫時卡住，可以由你決定要不要重試。</p>
        {run.errorCode ? <p className="mt-1 font-mono text-xs">{run.errorCode}</p> : null}
        <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-white px-3 py-2 font-medium text-amber-900">
          重新處理
        </button>
      </section>
    );
  }

  if (run.status === 'failed') {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" aria-live="polite">
        <h2 className="font-semibold">這篇目前無法整理</h2>
        <p className="mt-1">你仍然可以閱讀原文；若要換一篇，下面有入口。</p>
        {run.errorCode ? <p className="mt-1 font-mono text-xs">{run.errorCode}</p> : null}
        <a href="/learn/sources/new" className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 font-medium text-rose-900">
          加入另一篇
        </a>
      </section>
    );
  }

  return null;
}
