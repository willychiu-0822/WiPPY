import { useState } from 'react';
import type { AchievementId, DrinkResponse } from '../../lib/liffApi';
import { waterApi } from '../../lib/liffApi';
import { getErrorMessage } from '../../lib/apiError';
import { buildWaterShareMessage, shareLineMessage } from '../../lib/liffShare';
import { selectResultVariant } from '../../lib/waterLogic';

// ─── Achievement display config ───────────────────────────────────────────────

const ACHIEVEMENT_CONFIG: Record<AchievementId, { emoji: string; label: string; sub: string; gradient: string }> = {
  now_im_best:      { emoji: '🏆', label: '現在我最棒！',   sub: '你站上了今日喝水排行榜第一名',  gradient: 'from-amber-400 via-yellow-300 to-amber-400' },
  now_im_worst:     { emoji: '😵', label: '現在我墊底…',   sub: '不要灰心，趕快補一杯！',         gradient: 'from-slate-400 via-slate-300 to-slate-400' },
  first_drink:      { emoji: '💧', label: '今日首杯！',     sub: '美好的一天從喝水開始',           gradient: 'from-sky-400 via-cyan-300 to-sky-400' },
  hydration_master: { emoji: '🚰', label: '喝水狂人！',     sub: '今日已記錄 5 次以上，你太棒了', gradient: 'from-teal-400 via-emerald-300 to-teal-400' },
  '7_day_streak':   { emoji: '🔥', label: '七日連線！',     sub: '連續 7 天都有記錄，習慣養成中', gradient: 'from-orange-400 via-red-300 to-orange-400' },
  '30_day_streak':  { emoji: '🏅', label: '三十日連線！',   sub: '連續 30 天，你是喝水傳說',       gradient: 'from-purple-400 via-pink-300 to-purple-400' },
  daily_first:      { emoji: '☀️', label: '今日開局者！',   sub: '你是今天群組第一個喝水的人',     gradient: 'from-yellow-400 via-amber-300 to-orange-400' },
};

// ─── Variant banner config ────────────────────────────────────────────────────

interface Banner { emoji: string; label: string; sub: string; gradient: string }

function getVariantBanner(dr: DrinkResponse): Banner | null {
  switch (selectResultVariant(dr)) {
    case 'daily_first':
      return { emoji: '☀️', label: '今日開局者！',   sub: '你是今天群組第一個喝水的人',   gradient: 'from-yellow-400 via-amber-300 to-orange-400' };
    case 'group_goal':
      return { emoji: '🎯', label: '群組達標！',      sub: '大家一起喝到今日目標了',        gradient: 'from-emerald-400 via-green-300 to-teal-400' };
    case 'reversal':
      return { emoji: '🚀', label: '逆轉勝！',        sub: `超越了 ${dr.surpassedCount} 位成員`, gradient: 'from-indigo-400 via-purple-300 to-indigo-400' };
    case 'combo':
      return { emoji: '💥', label: `${dr.comboCount} 連喝！`, sub: '過去 90 分鐘連喝數次',  gradient: 'from-rose-400 via-pink-300 to-rose-400' };
    case 'rare':
      return { emoji: '✨', label: '里程碑！',        sub: `群組第 ${dr.groupDrinkSequence} 杯水`, gradient: 'from-violet-400 via-purple-300 to-fuchsia-400' };
    default:
      return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  drinkResult: DrinkResponse;
  idToken: string | null;
  entryGroupId?: string | null;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DrinkResultModal({ drinkResult, idToken, entryGroupId, onClose }: Props) {
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const {
    member, eventAchievements, newPersistentAchievements,
    surpassedCount, groupGoalJustReached, groupGoalMl, groupTodayMl,
    isDailyFirst, belowDisplayName,
  } = drinkResult;

  const achievements: AchievementId[] = [...eventAchievements, ...newPersistentAchievements];
  const variantBanner = getVariantBanner(drinkResult);
  const achievementPrimary = achievements[0] ? ACHIEVEMENT_CONFIG[achievements[0]] : null;
  const banner = variantBanner ?? achievementPrimary;

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
        isDailyFirst,
        belowDisplayName,
        groupGoalJustReached,
        entryGroupId,
      }));

      if (result === 'cancelled') {
        setShareError('尚未選擇分享對象，訊息未送出');
        return;
      }

      onClose();
    } catch (err) {
      console.error('Share failed:', err);
      setShareError(`分享失敗：${getErrorMessage(err)}`);
    } finally {
      setSharing(false);
    }
  }

  const bannerStyle = banner
    ? undefined
    : { background: 'linear-gradient(160deg,#0ea5e9,#2563eb 55%,#1e3a8a)' };

  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-[#03060e]/70 p-[18px] backdrop-blur-md">
      <div className="w-full max-w-[340px] overflow-hidden rounded-[28px] border border-white/[.09] bg-[#0a1424] shadow-[0_30px_70px_-20px_rgba(0,0,0,.85)] [animation:wb-pop_.5s_cubic-bezier(.22,1.4,.4,1)]">

        {/* Banner */}
        {banner ? (
          <div className={`relative h-[188px] overflow-hidden bg-gradient-to-br ${banner.gradient}`}>
            <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="wb-wave absolute -bottom-1.5 left-0 h-[46px] w-[200%] opacity-30">
              <path d="M0 20 q37.5 -15 75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 V40 H0 Z" fill="rgba(255,255,255,.5)" />
            </svg>
            <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="wb-wave-fast absolute -bottom-1.5 left-0 h-10 w-[200%] opacity-45">
              <path d="M0 20 q37.5 -15 75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 V40 H0 Z" fill="rgba(255,255,255,.5)" />
            </svg>
            <div className="wb-rise absolute left-[24%] top-10 h-1.5 w-1.5 rounded-full bg-white/60" />
            <div className="wb-rise absolute left-[70%] top-[60px] h-1 w-1 rounded-full bg-white/50 [animation-delay:1s]" />
            <div className="relative z-10 p-[26px_22px] text-left">
              <span className="inline-block rounded-full border border-white/40 px-2.5 py-1 font-['Archivo'] text-[10px] font-black uppercase tracking-[.2em] text-white/85">{selectResultVariant(drinkResult).toUpperCase()}</span>
              <p className="mt-3 text-[34px] font-black leading-none tracking-normal text-white drop-shadow-xl">{banner.label}</p>
              <p className="mt-1.5 text-sm font-semibold text-white/90 drop-shadow">{banner.sub}</p>
            </div>

            {achievements.length > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                {achievements.slice(1).map(id => (
                  <span key={id} className="text-xl">{ACHIEVEMENT_CONFIG[id]?.emoji ?? '🎖️'}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-[188px] overflow-hidden p-[26px_22px]" style={bannerStyle}>
            <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="wb-wave absolute bottom-0 left-0 h-10 w-[200%] opacity-35">
              <path d="M0 20 q37.5 -15 75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 V40 H0 Z" fill="rgba(255,255,255,.5)" />
            </svg>
            <span className="inline-block rounded-full border border-white/40 px-2.5 py-1 font-['Archivo'] text-[10px] font-black uppercase tracking-[.2em] text-white/85">RECORDED</span>
            <p className="mt-3 text-[34px] font-black leading-none text-white">記錄成功</p>
          </div>
        )}

        {/* Stats */}
        <div className="px-[22px] pb-2 pt-5 text-center">
          <p className="font-['Archivo'] text-[52px] font-black leading-none tracking-normal text-white">
            {Math.round(member.todayMl)} <span className="text-xl font-black text-sky-300">ml</span>
          </p>
          <p className="mt-1 text-sm font-bold text-slate-500">今日累計</p>
          {surpassedCount > 0 && (
            <p className="mt-3 rounded-full bg-sky-400/10 px-3 py-2 text-sm font-black text-sky-200">超越了 {surpassedCount} 位成員</p>
          )}
          {member.streak > 1 && (
            <p className="mt-2 text-sm font-bold text-orange-300">連線 {member.streak} 天</p>
          )}
          {groupGoalJustReached && (
            <p className="mt-2 text-sm font-black text-emerald-300">
              你幫群組達成 {Math.round(groupGoalMl)} ml 目標
            </p>
          )}
          <p className="mt-2 text-xs text-slate-600">群組今日 {Math.round(groupTodayMl)} ml</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 px-[22px] pb-[22px] pt-2">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="min-h-[56px] w-full rounded-[18px] bg-gradient-to-r from-[#06c755] to-[#22c55e] text-base font-black text-white shadow-xl shadow-emerald-950/40 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {sharing ? '分享中...' : '分享成就到群組'}
          </button>
          {shareError && (
            <p className="text-center text-xs leading-relaxed text-rose-300">{shareError}</p>
          )}

          <button
            onClick={onClose}
            className="py-1 text-center text-xs text-slate-600 transition-colors hover:text-slate-400"
          >
            忍痛放棄分享
          </button>
        </div>
      </div>
    </div>
  );
}
