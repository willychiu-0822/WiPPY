import type { GroupGoal } from '../../lib/liffApi';

interface Props {
  group: GroupGoal;
}

export default function GroupGoalBar({ group }: Props) {
  const pct = group.goalMl > 0
    ? Math.min(100, Math.round((group.todayMl / group.goalMl) * 100))
    : 0;

  return (
    <div data-testid="group-goal-bar" className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-sky-600">
          {group.goalReached ? '🎯 群組今日達標！' : '群組目標'}
        </p>
        <p className="text-xs text-sky-400">
          {Math.round(group.todayMl)} / {Math.round(group.goalMl)} ml
        </p>
      </div>
      <div className="h-3 bg-sky-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            group.goalReached ? 'bg-emerald-400' : 'bg-sky-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!group.goalReached && (
        <p className="text-xs text-sky-400 mt-1 text-right">{pct}%</p>
      )}
    </div>
  );
}
