import { useState } from 'react';
import liff from '@line/liff';
import type { AchievementId, WaterMember } from '../../lib/liffApi';
import { waterApi } from '../../lib/liffApi';

// ─── Achievement display config ───────────────────────────────────────────────

const ACHIEVEMENT_CONFIG: Record<AchievementId, { emoji: string; label: string; sub: string; gradient: string }> = {
  now_im_best:      { emoji: '🏆', label: '現在我最棒！',   sub: '你站上了今日喝水排行榜第一名',  gradient: 'from-amber-400 via-yellow-300 to-amber-400' },
  now_im_worst:     { emoji: '😵', label: '現在我墊底…',   sub: '不要灰心，趕快補一杯！',         gradient: 'from-slate-400 via-slate-300 to-slate-400' },
  first_drink:      { emoji: '💧', label: '今日首杯！',     sub: '美好的一天從喝水開始',           gradient: 'from-sky-400 via-cyan-300 to-sky-400' },
  hydration_master: { emoji: '🚰', label: '喝水狂人！',     sub: '今日已記錄 5 次以上，你太棒了', gradient: 'from-teal-400 via-emerald-300 to-teal-400' },
  '7_day_streak':   { emoji: '🔥', label: '七日連線！',     sub: '連續 7 天都有記錄，習慣養成中', gradient: 'from-orange-400 via-red-300 to-orange-400' },
  '30_day_streak':  { emoji: '🏅', label: '三十日連線！',   sub: '連續 30 天，你是喝水傳說',       gradient: 'from-purple-400 via-pink-300 to-purple-400' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  member: WaterMember;
  achievements: AchievementId[];
  surpassedCount: number;
  idToken: string | null;
  groupId: string;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DrinkResultModal({ member, achievements, surpassedCount, idToken, groupId: _groupId, onClose }: Props) {
  const [sharing, setSharing] = useState(false);

  const primary = achievements[0] ? ACHIEVEMENT_CONFIG[achievements[0]] : null;

  async function handleShare() {
    setSharing(true);
    try {
      const { taunts } = await waterApi.taunts(idToken ?? undefined);
      const taunt = taunts[Math.floor(Math.random() * taunts.length)] ?? '';
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const liffId = import.meta.env.VITE_LIFF_ID as string;

      await liff.shareTargetPicker([{
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
              ...(primary ? [{ type: 'text' as const, text: `${primary.emoji} ${primary.label}`, size: 'sm' as const, color: '#f59e0b' }] : []),
              { type: 'text' as const, text: `今日已喝 ${Math.round(member.todayMl)} ml`, size: 'md' as const, color: '#374151' },
              ...(surpassedCount > 0 ? [{ type: 'text' as const, text: `超越了 ${surpassedCount} 人 🚀`, size: 'sm' as const, color: '#6366f1' }] : []),
              { type: 'text' as const, text: taunt, size: 'sm' as const, color: '#6b7280', wrap: true },
              { type: 'button' as const, action: { type: 'uri' as const, label: '我也要記錄 💧', uri: `https://liff.line.me/${liffId}` }, style: 'primary' as const, color: '#0ea5e9' },
            ],
          },
        },
      }]);
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setSharing(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Achievement banner */}
        {primary ? (
          <div className={`bg-gradient-to-br ${primary.gradient} p-7 text-center relative overflow-hidden`}>
            {/* Decorative sparkles */}
            <div className="absolute top-3 left-4 text-white/60 text-xl select-none">✨</div>
            <div className="absolute top-4 right-5 text-white/60 text-lg select-none">⭐</div>
            <div className="absolute bottom-3 left-8 text-white/50 text-sm select-none">✨</div>
            <div className="absolute bottom-4 right-6 text-white/60 text-xl select-none">⭐</div>

            <div className="text-7xl mb-3 drop-shadow-lg">{primary.emoji}</div>
            <p className="text-2xl font-black text-white drop-shadow-sm tracking-tight">{primary.label}</p>
            <p className="text-sm text-white/80 mt-1 font-medium">{primary.sub}</p>

            {/* Extra achievements */}
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
          <p className="text-4xl font-black text-sky-700">{Math.round(member.todayMl)} <span className="text-xl font-semibold text-sky-400">ml</span></p>
          <p className="text-sm text-gray-400 mt-1">今日累計</p>
          {surpassedCount > 0 && (
            <p className="text-sm text-indigo-500 font-semibold mt-2">🚀 超越了 {surpassedCount} 位成員</p>
          )}
          {member.streak > 1 && (
            <p className="text-sm text-orange-400 font-medium mt-1">🔥 連續 {member.streak} 天</p>
          )}
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
