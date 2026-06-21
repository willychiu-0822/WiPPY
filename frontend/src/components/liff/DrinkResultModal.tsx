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
  groupId: string;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DrinkResultModal({ drinkResult, idToken, groupId: _groupId, onClose }: Props) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Banner */}
        {banner ? (
          <div className={`bg-gradient-to-br ${banner.gradient} p-7 text-center relative overflow-hidden`}>
            <div className="absolute top-3 left-4 text-white/60 text-xl select-none">✨</div>
            <div className="absolute top-4 right-5 text-white/60 text-lg select-none">⭐</div>
            <div className="absolute bottom-3 left-8 text-white/50 text-sm select-none">✨</div>
            <div className="absolute bottom-4 right-6 text-white/60 text-xl select-none">⭐</div>

            <div className="text-7xl mb-3 drop-shadow-lg">{banner.emoji}</div>
            <p className="text-2xl font-black text-white drop-shadow-sm tracking-tight">{banner.label}</p>
            <p className="text-sm text-white/80 mt-1 font-medium">{banner.sub}</p>

            {achievements.length > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                {achievements.slice(1).map(id => (
                  <span key={id} className="text-xl">{ACHIEVEMENT_CONFIG[id]?.emoji ?? '🎖️'}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-sky-400 to-cyan-400 p-6 text-center">
            <div className="text-6xl mb-2">💧</div>
            <p className="text-xl font-black text-white">記錄成功！</p>
          </div>
        )}

        {/* Stats */}
        <div className="px-6 py-5 text-center border-b border-gray-100">
          <p className="text-4xl font-black text-sky-700">
            {Math.round(member.todayMl)} <span className="text-xl font-semibold text-sky-400">ml</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">今日累計</p>
          {surpassedCount > 0 && (
            <p className="text-sm text-indigo-500 font-semibold mt-2">🚀 超越了 {surpassedCount} 位成員</p>
          )}
          {member.streak > 1 && (
            <p className="text-sm text-orange-400 font-medium mt-1">🔥 連續 {member.streak} 天</p>
          )}
          {groupGoalJustReached && (
            <p className="text-sm text-emerald-500 font-semibold mt-2">
              🎯 你幫群組達成 {Math.round(groupGoalMl)} ml 目標！
            </p>
          )}
          <p className="text-xs text-gray-300 mt-2">群組今日 {Math.round(groupTodayMl)} ml</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex flex-col gap-3">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="w-full min-h-[56px] bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 active:scale-95 text-white font-black text-base rounded-2xl shadow-md transition-all disabled:opacity-50"
          >
            {sharing ? '分享中...' : '📤 分享成就到群組'}
          </button>
          {shareError && (
            <p className="text-xs text-red-500 text-center leading-relaxed">{shareError}</p>
          )}

          <button
            onClick={onClose}
            className="text-xs text-gray-300 hover:text-gray-400 transition-colors py-1 text-center"
          >
            忍痛放棄分享
          </button>
        </div>
      </div>
    </div>
  );
}
