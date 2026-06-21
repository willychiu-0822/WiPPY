import { useState } from 'react';
import type { PulseItem } from '../../lib/liffApi';
import { relativeTimeFromTs } from '../../lib/waterLogic';

interface Props {
  pulse: PulseItem[];
  compact?: boolean;
}

const FIFTEEN_MIN_MS = 15 * 60 * 1000;

export default function LivePulse({ pulse, compact = false }: Props) {
  const [now] = useState(() => Date.now());

  if (pulse.length === 0) {
    return (
      <div data-testid="pulse-empty" className={compact ? 'rounded-full border border-white/10 bg-white/[.035] px-4 py-3 text-center' : 'rounded-3xl border border-white/10 bg-white/[.035] p-4 text-center'}>
        <p className="text-sm text-slate-400">今天還沒有人開喝</p>
      </div>
    );
  }

  if (compact) {
    const loop = [...pulse, ...pulse];
    return (
      <div className="flex items-center overflow-hidden rounded-full border border-white/10 bg-white/[.035]">
        <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_100%)]">
          <div className="wb-marquee flex w-max gap-2 px-3 py-2">
            {loop.map((item, i) => {
              const ageMs = now - item.timestamp._seconds * 1000;
              const isRecent = ageMs < FIFTEEN_MIN_MS;
              return (
                <div
                  key={`${item.lineUserId}-${item.timestamp._seconds}-${i}`}
                  data-testid={isRecent ? 'pulse-recent' : 'pulse-item'}
                  className={`flex flex-none items-center gap-2 rounded-full px-3 py-1.5 ${isRecent ? 'wb-breathe bg-sky-400/10' : 'bg-white/[.035]'}`}
                >
                  <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-sky-300 text-[10px] font-black text-[#03060e]">
                    {item.pictureUrl ? <img src={item.pictureUrl} alt={item.displayName} className="h-full w-full object-cover" /> : item.displayName.charAt(0)}
                  </div>
                  <span className="whitespace-nowrap text-xs font-bold text-sky-100">{item.displayName}</span>
                  <span className="font-['Archivo'] text-xs font-black text-sky-300">+{item.ml}ml</span>
                  <span className="whitespace-nowrap text-[11px] text-slate-500">{relativeTimeFromTs(item.timestamp, now)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="m-1 flex h-9 w-9 flex-none items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/15 text-sm font-black text-sky-200">你</div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
      <h2 className="mb-3 text-sm font-black text-sky-100">即時動態</h2>
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
                isRecent ? 'bg-sky-300 animate-pulse' : 'bg-slate-700'
              }`} />

              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-sky-300/20">
                {item.pictureUrl ? (
                  <img src={item.pictureUrl} alt={item.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sky-400 text-xs font-bold">
                    {item.displayName.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-bold text-sky-100">{item.displayName}</p>
                <p className="text-xs text-slate-500">
                  +{item.ml} ml · {relativeTimeFromTs(item.timestamp, now)}
                </p>
              </div>

              <span className="flex-shrink-0 text-xs text-sky-300">#{item.rankNow}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
