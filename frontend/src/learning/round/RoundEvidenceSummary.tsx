import { Link } from 'react-router-dom';
import type { EvidenceSummaryView } from '../api/types';

export function RoundEvidenceSummary({ evidence }: { evidence: EvidenceSummaryView[] }) {
  return (
    <section className="mx-auto max-w-2xl space-y-4 rounded-3xl bg-white p-5 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-950">這輪先到這裡</h1>
      {evidence.length > 0 ? (
        <ul className="space-y-3">
          {evidence.map((item, index) => (
            <li key={`${item.headline}-${index}`} className="rounded-2xl bg-gray-50 p-3">
              <p className="font-medium text-gray-900">{item.headline}</p>
              {item.details.map((detail) => (
                <p key={detail} className="mt-1 text-sm text-gray-600">
                  {detail}
                </p>
              ))}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-600">這輪沒有產生新的學習證據，也沒有欠任何東西。</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Link to="/learn/round" className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white">
          再來一輪
        </Link>
        <Link to="/learn/knowledge" className="rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800">
          查看知識庫
        </Link>
      </div>
    </section>
  );
}
