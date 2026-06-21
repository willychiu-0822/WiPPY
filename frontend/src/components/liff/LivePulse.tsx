import type { PulseItem } from '../../lib/liffApi';
import { relativeTimeFromTs } from '../../lib/waterLogic';

interface Props {
  pulse: PulseItem[];
}

const FIFTEEN_MIN_MS = 15 * 60 * 1000;

export default function LivePulse({ pulse }: Props) {
  if (pulse.length === 0) {
    return (
      <div data-testid="pulse-empty" className="bg-white rounded-2xl p-4 shadow-sm text-center">
        <p className="text-sm text-sky-400">今天還沒有人喝水，快來開局！</p>
      </div>
    );
  }

  const now = Date.now();

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-sky-600 mb-3">即時動態</h2>
      <div className="flex flex-col gap-2">
        {pulse.map((item, i) => {
          const ageMs = now - item.timestamp._seconds * 1000;
          const isRecent = ageMs < FIFTEEN_MIN_MS;

          return (
            <div
              key={`${item.lineUserId}-${item.timestamp._seconds}-${i}`}
              data-testid={isRecent ? 'pulse-recent' : 'pulse-item'}
              className="flex items-center gap-3"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isRecent ? 'bg-sky-500 animate-pulse' : 'bg-sky-200'
              }`} />

              <div className="w-8 h-8 rounded-full bg-sky-100 overflow-hidden flex-shrink-0">
                {item.pictureUrl ? (
                  <img src={item.pictureUrl} alt={item.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sky-400 text-xs font-bold">
                    {item.displayName.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{item.displayName}</p>
                <p className="text-xs text-gray-400">
                  +{item.ml} ml · {relativeTimeFromTs(item.timestamp, now)}
                </p>
              </div>

              <span className="text-xs text-sky-400 flex-shrink-0">#{item.rankNow}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
