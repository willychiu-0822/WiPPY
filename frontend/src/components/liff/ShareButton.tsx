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
  entryGroupId?: string | null;
}

export default function ShareButton({ member, surpassedCount = 0, achievements = [], idToken, entryGroupId }: Props) {
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
        entryGroupId,
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
        className="min-h-[54px] w-full rounded-[18px] bg-gradient-to-r from-[#06c755] to-[#22c55e] text-sm font-black text-white shadow-xl shadow-emerald-950/40 transition hover:brightness-110 active:scale-95 disabled:opacity-40"
      >
        {sharing ? '分享中...' : '分享喝水戰績到群組'}
      </button>
      {shareError && (
        <p className="text-center text-xs text-rose-300">{shareError}</p>
      )}
    </div>
  );
}
