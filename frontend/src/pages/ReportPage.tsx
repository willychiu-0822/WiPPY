import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRecords } from '../lib/firestore';
import type { Record as WRecord, FeelEmoji } from '../types';

interface WishSummary {
  wishId: string;
  wishName: string;
  counts: Record<FeelEmoji, number>;
  total: number;
}

const FEEL_EMOJIS: FeelEmoji[] = ['😊', '🟡', '☁️'];
const FEEL_COLORS: Record<FeelEmoji, string> = {
  '😊': '#34A853',
  '🟡': '#FBBC04',
  '☁️': '#9E9E9E',
};
const FEEL_LABELS: Record<FeelEmoji, string> = {
  '😊': '很充實',
  '🟡': '還好',
  '☁️': '不太對',
};

function FeelBar({ emoji, count, total }: { emoji: FeelEmoji; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-base w-6">{emoji}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: FEEL_COLORS[emoji] }}
        />
      </div>
      <span className="text-xs text-gray-500 w-12 text-right">{count} 次 ({pct}%)</span>
    </div>
  );
}

export default function ReportPage() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<WishSummary[]>([]);
  const [recentRecords, setRecentRecords] = useState<WRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const records = await getRecords(user.uid);
      setRecentRecords(records.slice(0, 20));

      // Group by wishId
      const map = new Map<string, WishSummary>();
      for (const r of records) {
        if (!map.has(r.wishId)) {
          map.set(r.wishId, {
            wishId: r.wishId,
            wishName: r.wishName,
            counts: { '😊': 0, '🟡': 0, '☁️': 0 },
            total: 0,
          });
        }
        const s = map.get(r.wishId)!;
        if (r.feelEmoji in s.counts) {
          s.counts[r.feelEmoji as FeelEmoji]++;
          s.total++;
        }
      }
      setSummaries(Array.from(map.values()).sort((a, b) => b.total - a.total));
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="text-center text-gray-400 mt-20">載入中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">體感報告</h1>

      {summaries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium text-gray-600 mb-1">還沒有紀錄</p>
          <p className="text-sm">完成時段後，透過 LINE Bot 紀錄體感，這裡就會出現統計！</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="space-y-4">
            {summaries.map((s) => {
              const topFeel = FEEL_EMOJIS.reduce((a, b) =>
                s.counts[a] >= s.counts[b] ? a : b
              );
              return (
                <div key={s.wishId} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">{s.wishName}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <span>{topFeel}</span>
                      <span className="text-xs">{FEEL_LABELS[topFeel]}</span>
                      <span className="text-xs text-gray-400 ml-1">(最常出現)</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {FEEL_EMOJIS.map((e) => (
                      <FeelBar key={e} emoji={e} count={s.counts[e]} total={s.total} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-right">共 {s.total} 次紀錄</p>
                </div>
              );
            })}
          </div>

          {/* Recent records */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-3">最近紀錄</h2>
            <div className="space-y-2">
              {recentRecords.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                  <span className="text-xl">{r.feelEmoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{r.wishName}</p>
                    <p className="text-xs text-gray-400">
                      {r.date} ｜ {FEEL_LABELS[r.feelEmoji as FeelEmoji]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
