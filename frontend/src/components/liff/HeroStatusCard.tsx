import type { ReactNode } from 'react';
import type { HeroState } from '../../lib/waterLogic';

interface Props {
  heroState: HeroState;
  onQuickLog: (ml: number) => void;
  todayMl?: number;
  rankLabel?: string;
  expanded?: boolean;
  children?: ReactNode;
}

const CONFIG = {
  normal: {
    accent: '#38bdf8',
    ink: '#0c2a6e',
    fill: 'linear-gradient(180deg,#38bdf8 0%,#0ea5e9 55%,#1e40af 100%)',
    kicker: '追趕中',
  },
  overtaken: {
    accent: '#ff5a5f',
    ink: '#7a0922',
    fill: 'linear-gradient(180deg,#ff5a5f 0%,#e11d48 60%,#9f1239 100%)',
    kicker: '被超越',
  },
  streak: {
    accent: '#ff9d3c',
    ink: '#7c2d12',
    fill: 'linear-gradient(180deg,#ff9d3c 0%,#f97316 60%,#c2410c 100%)',
    kicker: '連線告急',
  },
  defending: {
    accent: '#fbbf24',
    ink: '#7c2d12',
    fill: 'linear-gradient(180deg,#fcd34d 0%,#f59e0b 55%,#b45309 100%)',
    kicker: '守擂第一',
  },
  ignition: {
    accent: '#22d3ee',
    ink: '#0e4d63',
    fill: 'linear-gradient(180deg,#22d3ee 0%,#0891b2 100%)',
    kicker: '冷啟動',
  },
} as const;

export default function HeroStatusCard({ heroState, onQuickLog, todayMl = 0, rankLabel = '', expanded = false, children }: Props) {
  const { kind } = heroState;

  let config: (typeof CONFIG)[keyof typeof CONFIG] = CONFIG.normal;
  let title = '喝多一點！';
  let sub = `今日已累計 ${Math.round(todayMl)} ml`;
  let buttonMl = 200;
  let buttonLabel = '快速記 200 ml';
  let fillPct = Math.min(88, Math.max(38, Math.round((todayMl / 2000) * 100)));

  if (kind === 'streak_risk') {
    config = CONFIG.streak;
    title = `${heroState.streak} 天連續紀錄，今天還沒守住`;
    sub = '一杯就能守住，別讓連線斷在今天';
    buttonLabel = '立刻守住 - 記 200 ml';
    fillPct = 18;
  }
  else if (kind === 'overtaken') {
    const reclaimMl = heroState.reclaimMl ?? 250;
    config = CONFIG.overtaken;
    title = `${heroState.aboveDisplayName} 在 ${heroState.minutesAgo} 分鐘前超越了你`;
    sub = `喝 ${reclaimMl} ml 奪回名次`;
    buttonMl = reclaimMl;
    buttonLabel = `奪回 - 記 ${reclaimMl} ml`;
  }
  else if (kind === 'ignition') {
    config = CONFIG.ignition;
    title = '今天群組還沒有人開喝';
    sub = '記下第一杯，點燃整個排行榜';
    buttonLabel = '我來開局 - 記 200 ml';
    fillPct = 8;
  }
  else if (kind === 'defending') {
    config = CONFIG.defending;
    title = `領先第二名 ${Math.round(heroState.leadOverSecond ?? 0)} ml`;
    sub = '再喝一杯，把差距拉到沒人追得上';
    buttonMl = 300;
    buttonLabel = '拉開差距 - 再喝 300 ml';
    fillPct = Math.max(62, fillPct);
  }
  else if (heroState.gapToAbove != null && heroState.aboveDisplayNameForNormal) {
    title = `再喝 ${heroState.gapToAbove} ml 追上 ${heroState.aboveDisplayNameForNormal}`;
    sub = `今日已累計 ${Math.round(heroState.todayMl ?? todayMl)} ml`;
  }

  const testId = kind === 'streak_risk' ? 'hero-streak-risk' : `hero-${kind}`;

  return (
    <div data-testid={testId} className="min-h-0 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#0a1a32_0%,#070f20_100%)] shadow-2xl shadow-black/30">
      <div className={`relative overflow-hidden transition-[height] duration-500 ${expanded ? 'h-[clamp(118px,18dvh,150px)]' : 'h-[clamp(218px,34dvh,284px)]'}`}>
      <div className="absolute inset-x-0 bottom-0 transition-all duration-700" style={{ height: `${fillPct}%`, background: config.fill }}>
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="wb-wave absolute -top-5 left-0 h-10 w-[200%]">
          <path d="M0 20 q37.5 -15 75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 V40 H0 Z" fill="rgba(255,255,255,.18)" />
        </svg>
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="wb-wave-fast absolute -top-3 left-0 h-9 w-[200%]">
          <path d="M0 20 q37.5 -15 75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 V40 H0 Z" fill="rgba(255,255,255,.32)" />
        </svg>
        <div className="wb-rise absolute bottom-3 left-[18%] h-1.5 w-1.5 rounded-full bg-white/50" />
        <div className="wb-rise absolute bottom-1 left-[62%] h-1 w-1 rounded-full bg-white/40 [animation-delay:.8s]" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <span className="rounded-full px-3 py-1.5 font-['Archivo'] text-[10px] font-black uppercase tracking-[.15em] text-[#03060e]" style={{ backgroundColor: config.accent }}>
            {config.kicker}
          </span>
          <span className="font-['Archivo'] text-[13px] font-black tracking-wide text-white">{rankLabel}</span>
        </div>

        <div>
          <h2 className="max-w-[18rem] text-2xl font-black leading-tight text-white drop-shadow-lg">{title}</h2>
          <p className="mt-2 text-sm font-medium text-white/80 drop-shadow">{sub}</p>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
      <button
          onClick={() => onQuickLog(buttonMl)}
          className="min-h-[52px] w-full rounded-2xl font-black text-[#03060e] shadow-xl transition active:scale-95"
          style={{ backgroundColor: config.accent, boxShadow: `0 14px 28px -12px ${config.accent}` }}
      >
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#03060e]" />
          {buttonLabel}
      </button>
        </div>
      </div>
      </div>
      <div
        className="overflow-hidden transition-[max-height,background] duration-500"
        style={{ maxHeight: expanded ? 'calc(100dvh - 140px)' : 0, background: config.fill }}
      >
        <div className={`wb-scroll max-h-[calc(100dvh-150px)] overflow-y-auto p-5 pt-3 transition duration-500 ${expanded ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
          <div className="mb-3 flex justify-center">
            <div className="h-1 w-11 rounded-full bg-white/40" />
          </div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-white drop-shadow">記錄一杯</p>
              <p className="mt-1 text-[11px] font-medium text-white/75">已帶入建議容量，可自由增減或換飲料</p>
            </div>
            <button
              type="button"
              onClick={() => onQuickLog(0)}
              className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/25"
            >
              收起 ▴
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
