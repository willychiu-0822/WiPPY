import { useState } from 'react';
import type { FirestoreTimestamp, LeaderboardRow } from '../../lib/liffApi';

const MEDALS = ['🥇', '🥈', '🥉'];
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

function tsToMs(ts: FirestoreTimestamp): number {
  return ts._seconds * 1000 + Math.floor(ts._nanoseconds / 1e6);
}

interface Props {
  members: LeaderboardRow[];
  myUserId: string;
  myLastDrinkAt?: FirestoreTimestamp | null;
}

export default function Leaderboard({ members, myUserId, myLastDrinkAt }: Props) {
  const [now] = useState(() => Date.now());

  if (members.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-400">尚無成員資料</p>;
  }

  const myRank = members.find(m => m.lineUserId === myUserId)?.rank ?? null;
  const myLastMs = myLastDrinkAt ? tsToMs(myLastDrinkAt) : 0;

  return (
    <div className="flex flex-col gap-2">
      {members.map(row => {
        const isMe = row.lineUserId === myUserId;
        const medal = row.rank <= 3 ? MEDALS[row.rank - 1] : null;
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
            data-testid={isActive ? 'row-active' : undefined}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors ${
              isMe ? 'border border-sky-300/40 bg-sky-400/15' : 'border border-white/5 bg-white/[.025]'
            }`}
          >
            <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-xl text-center text-sm font-black leading-none ${
              row.rank <= 3 ? 'bg-amber-300 text-[#03060e]' : 'text-slate-500'
            }`}>
              {medal ?? row.rank}
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
  );
}
