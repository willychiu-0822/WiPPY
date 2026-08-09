import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLearningApi } from '../api/learningApiContextValue';
import type { LearningSourceView } from '../api/types';
import { SourceProcessingStatus } from './SourceProcessingStatus';
import { useIngestionRun } from './useIngestionRun';

export function ReaderPage() {
  const api = useLearningApi();
  const { sourceId } = useParams<{ sourceId: string }>();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('run');
  const [source, setSource] = useState<LearningSourceView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSource = useCallback(async () => {
    if (!sourceId) return;
    try {
      setSource(await api.getSource(sourceId));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '無法讀取來源');
    }
  }, [api, sourceId]);

  const { run, transportError, refresh, retry } = useIngestionRun(runId, loadSource);

  useEffect(() => {
    if (!sourceId) return;
    let cancelled = false;
    void api
      .getSource(sourceId)
      .then((nextSource) => {
        if (cancelled) return;
        setSource(nextSource);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : '無法讀取來源');
      });
    return () => {
      cancelled = true;
    };
  }, [api, sourceId]);

  const orderedParagraphs = useMemo(() => {
    return [...(source?.paragraphs ?? [])].sort((left, right) => left.order - right.order);
  }, [source?.paragraphs]);

  if (error) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>;
  }

  if (!source) {
    return <p className="text-sm text-gray-500">正在載入來源…</p>;
  }

  const processingIncomplete = run ? run.status !== 'completed' : false;
  const canPractice = !processingIncomplete && source.verifiedItemCount > 0;
  const completedWithoutPractice = !processingIncomplete && source.verifiedItemCount === 0;

  return (
    <div className="space-y-5">
      <SourceProcessingStatus run={run} transportError={transportError} onRefresh={refresh} onRetry={retry} />

      <article className="mx-auto max-w-[72ch] rounded-3xl bg-white p-5 shadow-sm">
        <header className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold text-gray-950">{source.title}</h1>
          <div className="space-y-1 text-sm text-gray-500">
            {source.author ? <p>{source.author}</p> : null}
            {source.url ? (
              <a className="break-all text-blue-700" href={source.url} target="_blank" rel="noreferrer">
                {source.url}
              </a>
            ) : null}
          </div>
          {source.learningObjective ? (
            <p className="rounded-2xl bg-blue-50 p-3 text-sm text-blue-900">這次想理解：{source.learningObjective}</p>
          ) : null}
        </header>

        <div className="space-y-5 text-[17px] leading-8 text-gray-900">
          {orderedParagraphs.map((paragraph) => (
            <p key={paragraph.id} data-testid="source-paragraph">
              {paragraph.text}
            </p>
          ))}
        </div>
      </article>

      {canPractice ? (
        <div className="mx-auto flex max-w-[72ch] justify-end">
          <Link to={`/learn/round?sourceId=${source.id}`} className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white">
            開始 3–5 分鐘練習
          </Link>
        </div>
      ) : null}

      {completedWithoutPractice ? (
        <section className="mx-auto max-w-[72ch] rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          <p>內容已完整收進知識庫；目前沒有足夠可靠、適合出題的英文項目。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className="rounded-lg bg-gray-100 px-3 py-2 font-medium text-gray-800" to="/learn/knowledge">
              查看已收錄內容
            </Link>
            <Link className="rounded-lg bg-gray-100 px-3 py-2 font-medium text-gray-800" to="/learn/sources/new">
              加入另一篇
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
