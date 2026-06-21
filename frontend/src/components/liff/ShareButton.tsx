import { useState } from 'react';
import type { AchievementId, WaterMember } from '../../lib/liffApi';
import { waterApi } from '../../lib/liffApi';
import { getErrorMessage } from '../../lib/apiError';
import { buildWaterShareMessage, shareLineMessage } from '../../lib/liffShare';

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

    setSharing(true);
    try {
      const { taunts } = await waterApi.taunts(idToken ?? undefined);
      const taunt = taunts[Math.floor(Math.random() * taunts.length)] ?? '';
      const result = await shareLineMessage(buildWaterShareMessage({
        member,
        taunt,
        surpassedCount,
        achievement: achievements[0] ?? null,
      }));
      if (result === 'cancelled') {
        setShareError('尚未選擇分享對象，訊息未送出');
      }
    } catch (err) {
      console.error('Share failed:', err);
      setShareError(`分享失敗：${getErrorMessage(err)}`);
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
