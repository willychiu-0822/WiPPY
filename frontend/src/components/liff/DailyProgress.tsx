interface Props {
  todayMl: number;
  rank: number;
  gapToAbove: number | null;
  leadOverSecond: number | null;
  aboveDisplayName: string | null;
}

export default function DailyProgress({
  todayMl,
  rank,
  gapToAbove,
  leadOverSecond,
  aboveDisplayName,
}: Props) {
  const display = Math.round(todayMl);

  const gapText =
    rank === 1
      ? leadOverSecond != null
        ? `領先第二名 ${Math.round(leadOverSecond)} ml`
        : '你是唯一的成員 💧'
      : gapToAbove != null && aboveDisplayName
      ? `再喝 ${Math.round(gapToAbove)} ml 就追上 ${aboveDisplayName}`
      : null;

  // SVG ring: r=44, circumference ≈ 276. We show a fixed decorative ring, no target %.
  const RADIUS = 44;
  const CIRC = 2 * Math.PI * RADIUS;
  const fill = Math.min(display / 2000, 1);
  const dash = fill * CIRC;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="10"
          />
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-sky-700">{display}</span>
          <span className="text-xs text-sky-500">ml</span>
        </div>
      </div>

      {gapText && (
        <p className="text-sm text-sky-600 text-center px-2">{gapText}</p>
      )}
    </div>
  );
}
