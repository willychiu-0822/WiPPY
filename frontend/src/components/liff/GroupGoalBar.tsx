import type { GroupGoal } from '../../lib/liffApi';

interface Props {
  group: GroupGoal;
  compact?: boolean;
}

export default function GroupGoalBar({ group, compact = false }: Props) {
  const pct = group.goalMl > 0
    ? Math.min(100, Math.round((group.todayMl / group.goalMl) * 100))
    : 0;

  return (
    <div data-testid="group-goal-bar" className={compact ? '' : 'rounded-3xl border border-white/10 bg-white/[.035] p-4'}>
      <div className="mb-2 flex items-center justify-between">
        <p className={compact ? 'text-[10px] font-black uppercase tracking-[.16em] text-sky-300' : 'text-sm font-black text-sky-100'}>
          {group.goalReached ? 'Group Goal Clear' : 'Group Tide'}
        </p>
        <p className="font-['Archivo'] text-xs font-black text-sky-50">
          <span className="text-sky-300">{(group.todayMl / 1000).toFixed(1)}L</span>
          <span className="text-slate-500"> / {(group.goalMl / 1000).toFixed(1)}L · {pct}%</span>
        </p>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full border border-white/5 bg-[#081222]">
        <div
          className={`relative h-full rounded-full transition-all duration-700 ${
            group.goalReached ? 'bg-gradient-to-r from-emerald-400 to-cyan-300' : 'bg-gradient-to-r from-sky-500 to-cyan-300'
          }`}
          style={{ width: `${pct}%` }}
        >
          <div className="wb-wave absolute -right-16 -top-2 h-7 w-48 bg-white/20" />
        </div>
      </div>
      {group.firstLoggerDisplayName && (
        <p className="mt-2 text-xs font-bold text-amber-300">{group.firstLoggerDisplayName} 今天率先開喝</p>
      )}
    </div>
  );
}
