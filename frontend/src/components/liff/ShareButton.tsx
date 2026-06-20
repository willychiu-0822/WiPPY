import { useState } from 'react';
import liff from '@line/liff';
import type { DrinkResponse, AchievementId } from '../../lib/liffApi';
import { waterApi } from '../../lib/liffApi';

const ACHIEVEMENT_LABELS: Record<AchievementId, string> = {
  now_im_best: '現在我最棒 🏆',
  now_im_worst: '現在我最爛 😵',
  first_drink: '今日首杯 💧',
  hydration_master: '喝水狂人 🚰',
  '7_day_streak': '七日連線 🔥',
  '30_day_streak': '三十日連線 🏅',
};

interface Props {
  lastDrink: DrinkResponse | null;
  idToken: string | null;
}

export default function ShareButton({ lastDrink, idToken }: Props) {
  const [sharing, setSharing] = useState(false);

  if (typeof liff.isApiAvailable === 'function' && !liff.isApiAvailable('shareTargetPicker')) {
    return null;
  }

  async function handleShare() {
    if (!lastDrink || sharing) return;
    setSharing(true);
    try {
      const { taunts } = await waterApi.taunts(idToken ?? undefined);
      const taunt = taunts[Math.floor(Math.random() * taunts.length)] ?? '';

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const allAchievements = [
        ...lastDrink.eventAchievements,
        ...lastDrink.newPersistentAchievements,
      ];
      const achievementLabel =
        allAchievements.length > 0
          ? ACHIEVEMENT_LABELS[allAchievements[0]] ?? allAchievements[0]
          : null;

      const liffId = import.meta.env.VITE_LIFF_ID as string;
      const liffUrl = `https://liff.line.me/${liffId}`;

      const flexMessage = {
        type: 'flex' as const,
        altText: `💧 ${timeStr} 喝水打卡！今日已喝 ${Math.round(lastDrink.member.todayMl)} ml`,
        contents: {
          type: 'bubble' as const,
          body: {
            type: 'box' as const,
            layout: 'vertical' as const,
            spacing: 'sm' as const,
            contents: [
              {
                type: 'text' as const,
                text: `💧 ${timeStr} 喝水打卡`,
                weight: 'bold' as const,
                size: 'lg' as const,
                color: '#0ea5e9',
              },
              ...(achievementLabel
                ? [{ type: 'text' as const, text: achievementLabel, size: 'sm' as const, color: '#f59e0b' }]
                : []),
              {
                type: 'text' as const,
                text: `今日已喝 ${Math.round(lastDrink.member.todayMl)} ml`,
                size: 'md' as const,
                color: '#374151',
              },
              ...(lastDrink.surpassedCount > 0
                ? [{
                    type: 'text' as const,
                    text: `超越了 ${lastDrink.surpassedCount} 人 🚀`,
                    size: 'sm' as const,
                    color: '#6366f1',
                  }]
                : []),
              {
                type: 'text' as const,
                text: taunt,
                size: 'sm' as const,
                color: '#6b7280',
                wrap: true,
              },
              {
                type: 'button' as const,
                action: { type: 'uri' as const, label: '我也要記錄 💧', uri: liffUrl },
                style: 'primary' as const,
                color: '#0ea5e9',
              },
            ],
          },
        },
      };

      await liff.shareTargetPicker([flexMessage]);
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setSharing(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={!lastDrink || sharing}
      className="w-full min-h-[48px] bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold rounded-xl text-sm disabled:opacity-40 transition-all"
    >
      {sharing ? '分享中...' : '📤 分享成績到群組'}
    </button>
  );
}
