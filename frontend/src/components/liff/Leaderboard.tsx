import type { LeaderboardRow } from '../../lib/liffApi';

const MEDALS = ['🥇', '🥈', '🥉'];

interface Props {
  members: LeaderboardRow[];
  myUserId: string;
}

export default function Leaderboard({ members, myUserId }: Props) {
  if (members.length === 0) {
    return <p className="text-center text-sky-400 text-sm py-4">尚無成員資料</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {members.map(row => {
        const isMe = row.lineUserId === myUserId;
        const medal = row.rank <= 3 ? MEDALS[row.rank - 1] : null;

        return (
          <div
            key={row.lineUserId}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
              isMe ? 'bg-sky-100 border border-sky-300' : 'bg-white'
            }`}
          >
            <span className="w-6 text-center text-base leading-none">
              {medal ?? <span className="text-sky-300 text-xs font-bold">{row.rank}</span>}
            </span>

            <div className="w-9 h-9 rounded-full bg-sky-200 overflow-hidden flex-shrink-0">
              {row.pictureUrl ? (
                <img src={row.pictureUrl} alt={row.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sky-500 text-sm font-bold">
                  {row.displayName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isMe ? 'text-sky-700' : 'text-gray-700'}`}>
                {row.displayName}
                {isMe && <span className="ml-1 text-xs text-sky-500">(我)</span>}
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
