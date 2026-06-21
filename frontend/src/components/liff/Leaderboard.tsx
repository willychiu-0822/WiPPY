import { useEffect, useRef, useState } from 'react';
import type { FirestoreTimestamp, LeaderboardRow } from '../../lib/liffApi';
import { computeFocusScrollTop } from '../../lib/leaderboardFocus';

const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const RANK_COLORS: Record<number, string> = {
  1: '#fbbf24',
  2: '#cbd5e1',
  3: '#d8884a',
};

function tsToMs(ts: FirestoreTimestamp): number {
  return ts._seconds * 1000 + Math.floor(ts._nanoseconds / 1e6);
}

interface Props {
  members: LeaderboardRow[];
  myUserId: string;
  myLastDrinkAt?: FirestoreTimestamp | null;
  className?: string;
  scrollable?: boolean;
  focusMyRank?: boolean;
}

export default function Leaderboard({ members, myUserId, myLastDrinkAt, className = '', scrollable = false, focusMyRank = false }: Props) {
  const [now] = useState(() => Date.now());
  const scrollerRef = useRef<HTMLDivElement>(null);
  const myRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusMyRank) return;
    const scroller = scrollerRef.current;
    const row = myRowRef.current;
    if (!scroller || !row) return;

    // Measure the row's position relative to the scroller via bounding rects.
    // offsetTop is relative to the nearest positioned ancestor (offsetParent),
    // which is NOT the scroller here — using it over-scrolls and can push the
    // top-ranked row (e.g. rank 1) out of view entirely.
    const getRect = row.getBoundingClientRect?.bind(row);
    const getScrollerRect = scroller.getBoundingClientRect?.bind(scroller);
    if (!getRect || !getScrollerRect) return;

    const rowRect = getRect();
    const scrollerRect = getScrollerRect();
    const top = computeFocusScrollTop({
      rowTop: rowRect.top,
      scrollerTop: scrollerRect.top,
      scrollerScrollTop: scroller.scrollTop,
      scrollerClientHeight: scroller.clientHeight,
      scrollerScrollHeight: scroller.scrollHeight,
      rowHeight: row.clientHeight,
    });

    if (typeof scroller.scrollTo === 'function') {
      scroller.scrollTo({ top, behavior: 'smooth' });
    } else {
      scroller.scrollTop = top;
    }
  }, [focusMyRank, members, myUserId]);

  if (members.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-400">尚無成員資料</p>;
  }

  const myRank = members.find(m => m.lineUserId === myUserId)?.rank ?? null;
  const myLastMs = myLastDrinkAt ? tsToMs(myLastDrinkAt) : 0;

  return (
    <div ref={scrollerRef} className={`${scrollable ? 'wb-scroll overflow-y-auto pr-1' : ''} ${className}`}>
      <div className="flex flex-col gap-2">
      {members.map(row => {
        const isMe = row.lineUserId === myUserId;
        const medalBg = RANK_COLORS[row.rank];
        const isActive = row.lastDrinkAt != null
          && (now - tsToMs(row.lastDrinkAt)) < FIFTEEN_MIN_MS;
        const isOvertaker = !isMe
          && myRank != null
          && row.rank < myRank
          && row.lastDrinkAt != null
          && tsToMs(row.lastDrinkAt) > myLastMs;

        return (
          <div
            key={row.lineUserId}
            ref={isMe ? myRowRef : undefined}
            data-testid={isActive ? 'row-active' : undefined}
            className={`flex items-center gap-[11px] rounded-[15px] px-[11px] py-[9px] transition-colors ${
              isMe ? 'border border-sky-300/40 bg-sky-400/15' : 'border border-white/5 bg-white/[.025]'
            }`}
          >
            <span
              className="flex h-6 w-6 flex-none items-center justify-center rounded-lg text-center font-['Archivo'] text-xs font-black leading-none"
              style={medalBg ? { backgroundColor: medalBg, color: '#03060e' } : { color: '#5e7796' }}
            >
              {row.rank}
            </span>

            <div className={`h-10 w-10 flex-shrink-0 overflow-hidden rounded-full ${
              isActive ? 'ring-2 ring-sky-300 ring-offset-2 ring-offset-[#071326]' : 'bg-sky-300/20'
            }`}>
              {row.pictureUrl ? (
                <img src={row.pictureUrl} alt={row.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-sky-300 text-sm font-black text-[#03060e]">
                  {row.displayName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`truncate text-sm font-black ${isMe ? 'text-sky-50' : 'text-slate-300'}`}>
                {row.displayName}
                {isMe && <span className="ml-1 text-xs text-sky-300">(我)</span>}
                {isOvertaker && <span className="ml-1 text-xs text-violet-300">剛剛超車</span>}
              </p>
              {row.streak > 0 && (
                <p className="text-xs font-bold text-orange-300">連線 {row.streak} 天</p>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <p className={`font-['Archivo'] text-sm font-black ${isMe ? 'text-sky-300' : 'text-sky-100'}`}>
                {Math.round(row.todayMl)} ml
              </p>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
