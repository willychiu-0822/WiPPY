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
    return <p className="text-center text-sky-400 text-sm py-4">尚無成員資料</p>;
  }

  const myRank = members.find(m => m.lineUserId === myUserId)?.rank ?? null;
  const myLastMs = myLastDrinkAt ? tsToMs(myLastDrinkAt) : 0;

  return (
    <div className="flex flex-col gap-1">
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
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
              isMe ? 'bg-sky-100 border border-sky-300' : 'bg-white'
            }`}
          >
            <span className="w-6 text-center text-base leading-none">
              {medal ?? <span className="text-sky-300 text-xs font-bold">{row.rank}</span>}
            </span>

            <div className={`w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ${
              isActive ? 'ring-2 ring-sky-400' : 'bg-sky-200'
            }`}>
              {row.pictureUrl ? (
                <img src={row.pictureUrl} alt={row.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sky-500 text-sm font-bold bg-sky-200">
                  {row.displayName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isMe ? 'text-sky-700' : 'text-gray-700'}`}>
                {row.displayName}
                {isMe && <span className="ml-1 text-xs text-sky-500">(我)</span>}
                {isOvertaker && <span className="ml-1 text-xs text-indigo-400">↑ 剛追上</span>}
              </p>
              {row.streak > 0 && (
                <p className="text-xs text-orange-400">🔥 {row.streak} 天</p>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-bold ${isMe ? 'text-sky-600' : 'text-gray-600'}`}>
                {Math.round(row.todayMl)} ml
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
