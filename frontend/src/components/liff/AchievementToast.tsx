import { useEffect, useRef } from 'react';
import type { AchievementId } from '../../lib/liffApi';

const ACHIEVEMENT_LABELS: Record<AchievementId, string> = {
  now_im_best: '現在我最棒 🏆',
  now_im_worst: '現在我最爛 😵',
  first_drink: '今日首杯 💧',
  hydration_master: '喝水狂人 🚰',
  '7_day_streak': '七日連線 🔥',
  '30_day_streak': '三十日連線 🏅',
};

interface Props {
  queue: AchievementId[];
  onDismiss: (id: AchievementId) => void;
}

// Inner item — mounts fresh for each new achievement (via key), auto-dismisses after delay
function ToastItem({ id, onDismiss }: { id: AchievementId; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Trigger slide-in
    el.style.transform = 'translate(-50%, 0)';
    el.style.opacity = '1';

    const hideTimer = setTimeout(() => {
      el.style.transform = 'translate(-50%, -1rem)';
      el.style.opacity = '0';
    }, 2200);

    const dismissTimer = setTimeout(onDismiss, 2500);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div
      ref={ref}
      role="alert"
      aria-live="polite"
      style={{
        transform: 'translate(-50%, -1rem)',
        opacity: '0',
        transition: 'transform 0.3s ease, opacity 0.3s ease',
      }}
      className="fixed top-4 left-1/2 z-50"
    >
      <div className="bg-sky-500 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold whitespace-nowrap">
        {ACHIEVEMENT_LABELS[id] ?? id}
      </div>
    </div>
  );
}

export default function AchievementToast({ queue, onDismiss }: Props) {
  const current = queue[0];
  if (!current) return null;

  return (
    <ToastItem
      key={current + queue.length}
      id={current}
      onDismiss={() => onDismiss(current)}
    />
  );
}
