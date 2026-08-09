import { useEffect, useState } from 'react';
import { useLearningApi } from '../api/learningApiContextValue';
import type { KnowledgePageView } from '../api/types';
import { KnowledgeItemCard } from './KnowledgeItemCard';

type KnowledgeItem = KnowledgePageView['items'][number];

function mergeItems(existing: KnowledgeItem[], incoming: KnowledgeItem[]): KnowledgeItem[] {
  const seen = new Set(existing.map((item) => item.id));
  return [...existing, ...incoming.filter((item) => !seen.has(item.id))];
}

export function KnowledgePage() {
  const api = useLearningApi();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void api
        .listKnowledge({ limit: 50 })
        .then((page) => {
          if (cancelled) return;
          setItems(page.items);
          setCursor(page.nextCursor);
          setError(null);
        })
        .catch((loadError: unknown) => {
          if (cancelled) return;
          setError(loadError instanceof Error ? loadError.message : '無法讀取知識庫');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [api]);

  async function loadMore() {
    if (!cursor) return;
    const page = await api.listKnowledge({ limit: 50, cursor });
    setItems((current) => mergeItems(current, page.items));
    setCursor(page.nextCursor);
  }

  async function toggleExcluded(itemId: string, excludedByUser: boolean) {
    const previous = items;
    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, excludedByUser } : item)));
    setError(null);
    try {
      await api.setKnowledgeExcluded(itemId, excludedByUser);
    } catch (toggleError) {
      setItems(previous);
      setError(toggleError instanceof Error ? toggleError.message : '無法更新出題狀態');
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-gray-950">英文知識庫</h1>
        <p className="text-sm text-gray-600">這裡是所有被收進來的英文知識，不等於一定會出題。</p>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          {['全部', '可出題', '待釐清', '已暫停'].map((filter) => (
            <button key={filter} type="button" className="rounded-full bg-gray-100 px-3 py-1">
              {filter}
            </button>
          ))}
        </div>
      </header>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-gray-500">正在讀取知識庫…</p> : null}

      <div className="space-y-4">
        {items.map((item) => (
          <KnowledgeItemCard key={item.id} item={item} onToggleExcluded={toggleExcluded} />
        ))}
      </div>

      {cursor ? (
        <button type="button" onClick={loadMore} className="min-h-11 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800">
          載入更多
        </button>
      ) : null}
    </section>
  );
}
