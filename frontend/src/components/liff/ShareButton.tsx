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
  compact?: boolean;
}

export default function ShareButton({ member, surpassedCount = 0, achievements = [], idToken, entryGroupId, compact = false }: Props) {
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
    <div className={`flex flex-col items-end gap-1 ${compact ? 'max-w-[180px]' : ''}`}>
      <button
        onClick={handleShare}
        disabled={sharing}
        aria-label="分享我的戰報到群組"
        className={compact
          ? 'flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-400/15 px-4 text-xs font-black text-emerald-50 shadow-lg shadow-emerald-950/25 backdrop-blur-sm transition hover:bg-emerald-400/25 active:scale-95 disabled:opacity-40'
          : 'flex min-h-[54px] w-full items-center justify-center gap-[9px] rounded-[18px] bg-gradient-to-r from-[#06c755] to-[#22c55e] text-base font-black text-white shadow-xl shadow-emerald-950/40 transition hover:brightness-110 active:scale-95 disabled:opacity-40'}
      >
        {!sharing && <span className={`${compact ? 'h-2 w-2 rounded-full' : 'h-[9px] w-[9px] rounded-sm'} inline-block bg-white`} />}
        {sharing ? '分享中...' : compact ? '分享戰報' : '分享我的戰報到群組'}
      </button>
      {shareError && (
        <p className={`${compact ? 'rounded-full bg-[#03060e]/80 px-3 py-1 text-right' : 'text-center'} text-xs text-rose-300`}>{shareError}</p>
      )}
    </div>
  );
}
