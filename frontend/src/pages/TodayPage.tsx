import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFoundations, getWishes, getSlotsForDate, saveSlotsForDate } from '../lib/firestore';
import { generateSlots, buildTimeline } from '../lib/schedule';
import type { Foundation, Wish, Slot, TimeBlock } from '../types';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTimeRange(start: string, end: string) {
  return `${start} – ${end}`;
}

const FEEL_LABEL: Record<string, string> = { '😊': '很充實', '🟡': '還好', '☁️': '不太對' };

function TimeBlockCard({ block }: { block: TimeBlock }) {
  const isWish = block.type === 'wish';
  const isFoundation = block.type === 'foundation';

  return (
    <div className={`rounded-xl p-3.5 flex items-center gap-3 ${
      isFoundation ? 'bg-gray-100 border border-gray-200' : 'bg-white border border-gray-200 shadow-sm'
    }`}>
      {/* Color dot */}
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: block.color }} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isFoundation ? 'text-gray-500' : 'text-gray-800'}`}>
          {block.emoji && <span className="mr-1">{block.emoji}</span>}
          {block.name}
        </p>
        <p className="text-xs text-gray-400">{formatTimeRange(block.startTime, block.endTime)}</p>
      </div>

      {/* Feel emoji (if recorded) */}
      {isWish && block.feelEmoji && (
        <div className="flex items-center gap-1 text-sm">
          <span>{block.feelEmoji}</span>
          <span className="text-xs text-gray-400">{FEEL_LABEL[block.feelEmoji]}</span>
        </div>
      )}

      {/* Pending status */}
      {isWish && !block.feelEmoji && block.status === 'notified' && (
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">待紀錄</span>
      )}
    </div>
  );
}

export default function TodayPage() {
  const { user } = useAuth();
  const [foundations, setFoundations] = useState<Foundation[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [timeline, setTimeline] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const today = todayStr();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [f, w, s] = await Promise.all([
        getFoundations(user.uid),
        getWishes(user.uid),
        getSlotsForDate(user.uid, today),
      ]);
      setFoundations(f);
      setWishes(w);

      let activeSlots = s;

      // Auto-generate slots for today if none exist
      if (s.length === 0 && w.length > 0) {
        const generated = generateSlots(today, f, w);
        if (generated.length > 0) {
          await saveSlotsForDate(user.uid, generated);
          const saved = await getSlotsForDate(user.uid, today);
          activeSlots = saved;
        }
      }

      setSlots(activeSlots);
      setTimeline(buildTimeline(today, f, activeSlots));
      setLoading(false);
    })();
  }, [user, today]);

  const dateLabel = new Date(today + 'T00:00:00').toLocaleDateString('zh-TW', {
    month: 'long', day: 'numeric', weekday: 'short',
  });

  const recordedCount = slots.filter((s) => s.status === 'recorded').length;
  const totalWishSlots = slots.length;

  if (loading) {
    return <div className="text-center text-gray-400 mt-20">載入中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{dateLabel}</h1>
        {totalWishSlots > 0 && (
          <p className="text-sm text-gray-500 mt-0.5">
            今日彈性時段 {recordedCount}/{totalWishSlots} 已紀錄
          </p>
        )}
      </div>

      {/* Progress bar */}
      {totalWishSlots > 0 && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${(recordedCount / totalWishSlots) * 100}%` }}
          />
        </div>
      )}

      {/* Empty state */}
      {foundations.length === 0 && wishes.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium text-gray-600 mb-1">還沒有設定排程</p>
          <p className="text-sm">前往「設定」新增地基時間與彈性願望</p>
        </div>
      )}

      {wishes.length === 0 && foundations.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
          💡 新增彈性願望後，WiPPY 會自動幫你安排進空閒時段！
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2">
        {timeline.map((block, i) => (
          <TimeBlockCard key={i} block={block} />
        ))}
      </div>

      {/* LINE reminder */}
      {totalWishSlots > 0 && recordedCount === 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-700">
          📱 時段結束後，WiPPY 會透過 LINE Bot 通知你紀錄體感。
        </div>
      )}
    </div>
  );
}
