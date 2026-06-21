import type { HeroState } from '../../lib/waterLogic';

interface Props {
  heroState: HeroState;
  onQuickLog: (ml: number) => void;
}

export default function HeroStatusCard({ heroState, onQuickLog }: Props) {
  const { kind } = heroState;

  if (kind === 'streak_risk') {
    return (
      <div data-testid="hero-streak-risk" className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-orange-600">🔥 連線告急！已連 {heroState.streak} 天</p>
        <p className="text-xs text-orange-400 mt-1">今天還沒喝，快補一杯守住連線</p>
        <button
          onClick={() => onQuickLog(200)}
          className="mt-3 w-full min-h-[44px] bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all"
        >
          快速記 200 ml
        </button>
      </div>
    );
  }

  if (kind === 'overtaken') {
    const reclaimMl = heroState.reclaimMl ?? 250;
    return (
      <div data-testid="hero-overtaken" className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-indigo-600">
          😤 {heroState.aboveDisplayName} 在 {heroState.minutesAgo} 分鐘前超越了你！
        </p>
        <p className="text-xs text-indigo-400 mt-1">再喝 {reclaimMl} ml 就反超</p>
        <button
          onClick={() => onQuickLog(reclaimMl)}
          className="mt-3 w-full min-h-[44px] bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all"
        >
          反超 — 記 {reclaimMl} ml
        </button>
      </div>
    );
  }

  if (kind === 'ignition') {
    return (
      <div data-testid="hero-ignition" className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-cyan-600">☀️ 今天群組還沒有人喝水！</p>
        <p className="text-xs text-cyan-400 mt-1">成為今日開局者，點燃群組喝水熱情</p>
        <button
          onClick={() => onQuickLog(200)}
          className="mt-3 w-full min-h-[44px] bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all"
        >
          我來開局 — 200 ml
        </button>
      </div>
    );
  }

  if (kind === 'defending') {
    return (
      <div data-testid="hero-defending" className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-amber-600">👑 你正在第一名！</p>
        {heroState.leadOverSecond != null && (
          <p className="text-xs text-amber-400 mt-1">領先 {Math.round(heroState.leadOverSecond)} ml，繼續保持</p>
        )}
        <button
          onClick={() => onQuickLog(300)}
          className="mt-3 w-full min-h-[44px] bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all"
        >
          拉大差距 — 再喝 300 ml
        </button>
      </div>
    );
  }

  // normal
  return (
    <div data-testid="hero-normal" className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
      {heroState.gapToAbove != null && heroState.aboveDisplayNameForNormal ? (
        <>
          <p className="text-sm font-bold text-sky-600">
            💪 再喝 {heroState.gapToAbove} ml 追上 {heroState.aboveDisplayNameForNormal}
          </p>
          <p className="text-xs text-sky-400 mt-1">今日已累計 {Math.round(heroState.todayMl ?? 0)} ml</p>
        </>
      ) : (
        <p className="text-sm font-bold text-sky-600">💧 喝多一點！</p>
      )}
      <button
        onClick={() => onQuickLog(200)}
        className="mt-3 w-full min-h-[44px] bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all"
      >
        快速記 200 ml
      </button>
    </div>
  );
}
