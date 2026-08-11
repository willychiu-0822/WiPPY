import { useState } from 'react';
import type { KnowledgePageView } from '../api/types';
import { FacetEvidenceRow } from './FacetEvidenceRow';

type KnowledgeItem = KnowledgePageView['items'][number];

function sourceSummary(item: KnowledgeItem): string {
  const count = item.occurrenceCount ?? 0;
  const titles = item.sourceTitles?.length ? item.sourceTitles.join('、') : '尚無來源標題';
  return `${count} 次出現 · ${titles}`;
}

export function KnowledgeItemCard({
  item,
  onToggleExcluded,
}: {
  item: KnowledgeItem;
  onToggleExcluded: (itemId: string, excluded: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isUnresolved = item.senseStatus === 'unresolved';
  const excluded = item.excludedByUser ?? false;
  const challengeability = excluded
    ? '仍保留在知識庫，但不再出題'
    : item.challengeabilityLabel ?? (isUnresolved ? '需要更多語言證據才會出題' : '可出題');

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">{item.expression}</h2>
            <p className="text-sm text-gray-500">{isUnresolved ? '詞義待釐清' : item.senseKey}</p>
          </div>
          <button
            type="button"
            onClick={() => onToggleExcluded(item.id, !excluded)}
            className="min-h-11 rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800"
          >
            {excluded ? `恢復 ${item.expression} 出題` : `暫停 ${item.expression} 出題`}
          </button>
        </div>
        <p className="text-sm text-gray-600">{sourceSummary(item)}</p>
        <p className="rounded-2xl bg-blue-50 p-3 text-sm text-blue-900">{challengeability}</p>
      </header>

      <div className="mt-4">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="text-sm font-medium text-blue-700"
        >
          查看 {item.expression} 的證據細節
        </button>
        {expanded ? (
          <div className="mt-3 space-y-3">
          {item.facets.map((facet) => (
            <FacetEvidenceRow key={`${item.id}-${facet.facet}`} facet={facet.facet} label={facet.label} evidence={facet.evidence} />
          ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
