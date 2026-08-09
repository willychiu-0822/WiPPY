import type { EvidenceSummaryView, LearningFacet } from '../api/types';

const facetLabels: Record<LearningFacet, string> = {
  meaning: '意思',
  chunk: '搭配／角色',
  syntax: '句法',
  pragmatics: '語氣／作用',
};

function facetLabel(facet: LearningFacet, fallback: string): string {
  return facetLabels[facet] ?? fallback;
}

export function FacetEvidenceRow({ facet, label, evidence }: { facet: LearningFacet; label: string; evidence: EvidenceSummaryView | null }) {
  const readableLabel = facetLabel(facet, label);
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-gray-900">{readableLabel}</p>
        <p className="text-sm text-gray-600">{evidence ? evidence.headline : '尚無證據'}</p>
      </div>
      {evidence ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
          {evidence.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
