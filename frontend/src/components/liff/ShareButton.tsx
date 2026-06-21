import { useState } from 'react';
import liff from '@line/liff';
import type { AchievementId, WaterMember } from '../../lib/liffApi';
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
  member: WaterMember;
  surpassedCount?: number;
  achievements?: AchievementId[];
  idToken: string | null;
}

export default function ShareButton({ member, surpassedCount = 0, achievements = [], idToken }: Props) {
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  async function handleShare() {
    if (sharing) return;
    setShareError(null);

    if (!liff.isApiAvailable('shareTargetPicker')) {
      setShareError('此環境不支援分享功能，請在 LINE 群組中開啟');
      return;
    }

    setSharing(true);
    try {
      const { taunts } = await waterApi.taunts(idToken ?? undefined);
      const taunt = taunts[Math.floor(Math.random() * taunts.length)] ?? '';
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const liffId = import.meta.env.VITE_LIFF_ID as string;
      const achievementLabel = achievements.length > 0 ? ACHIEVEMENT_LABELS[achievements[0]] : null;

      const result = await liff.shareTargetPicker([{
        type: 'flex',
        altText: `💧 ${timeStr} 喝水打卡！今日已喝 ${Math.round(member.todayMl)} ml`,
        contents: {
          type: 'bubble' as const,
          body: {
            type: 'box' as const,
            layout: 'vertical' as const,
            spacing: 'sm' as const,
            contents: [
              { type: 'text' as const, text: `💧 ${timeStr} 喝水打卡`, weight: 'bold' as const, size: 'lg' as const, color: '#0ea5e9' },
              ...(achievementLabel ? [{ type: 'text' as const, text: achievementLabel, size: 'sm' as const, color: '#f59e0b' }] : []),
              { type: 'text' as const, text: `今日已喝 ${Math.round(member.todayMl)} ml`, size: 'md' as const, color: '#374151' },
              ...(surpassedCount > 0 ? [{ type: 'text' as const, text: `超越了 ${surpassedCount} 人 🚀`, size: 'sm' as const, color: '#6366f1' }] : []),
              { type: 'text' as const, text: taunt, size: 'sm' as const, color: '#6b7280', wrap: true },
              { type: 'button' as const, action: { type: 'uri' as const, label: '我也要記錄 💧', uri: `https://liff.line.me/${liffId}` }, style: 'primary' as const, color: '#0ea5e9' },
            ],
          },
        },
      }]);
      if (!result) {
        // User cancelled the share picker without selecting anyone — not an error
      }
    } catch (err) {
      console.error('Share failed:', err);
      setShareError('分享失敗，請再試一次');
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleShare}
        disabled={sharing}
        className="w-full min-h-[48px] bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold rounded-xl text-sm disabled:opacity-40 transition-all"
      >
        {sharing ? '分享中...' : '📤 分享喝水成績'}
      </button>
      {shareError && (
        <p className="text-xs text-red-500 text-center">{shareError}</p>
      )}
    </div>
  );
}
