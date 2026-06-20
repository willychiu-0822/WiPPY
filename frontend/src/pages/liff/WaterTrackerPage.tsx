import { useState, useCallback, useEffect } from 'react';
import { useLiff } from '../../contexts/useLiff';
import { waterApi } from '../../lib/liffApi';
import type { DrinkType, SessionResponse, DrinkResponse, AchievementId } from '../../lib/liffApi';
import DailyProgress from '../../components/liff/DailyProgress';
import DrinkLogger from '../../components/liff/DrinkLogger';
import Leaderboard from '../../components/liff/Leaderboard';
import AchievementToast from '../../components/liff/AchievementToast';
import ShareButton from '../../components/liff/ShareButton';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4 p-4">
      <div className="h-6 bg-sky-100 rounded w-1/2 mx-auto" />
      <div className="h-32 w-32 bg-sky-100 rounded-full mx-auto" />
      <div className="h-4 bg-sky-100 rounded w-3/4 mx-auto" />
      <div className="h-40 bg-sky-50 rounded-xl" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WaterTrackerPage() {
  const { ready, loading: liffLoading, error: liffError, profile, idToken, groupId } = useLiff();

  const [sessionData, setSessionData] = useState<SessionResponse | null>(null);
  const [lastDrink, setLastDrink] = useState<DrinkResponse | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<AchievementId[]>([]);

  // POST /session on mount (once liff is ready)
  useEffect(() => {
    if (!ready || !groupId) return;
    setSessionLoading(true);

    waterApi
      .session(groupId, undefined, idToken ?? undefined)
      .then(data => {
        setSessionData(data);
        setSessionError(null);
      })
      .catch((err: Error) => setSessionError(err.message || 'Session failed'))
      .finally(() => setSessionLoading(false));
  }, [ready, groupId, idToken]);

  const handleDrink = useCallback(
    async (ml: number, drinkType: DrinkType) => {
      if (!groupId) return;
      setSubmitting(true);
      try {
        const res = await waterApi.drink(groupId, ml, drinkType, idToken ?? undefined);
        setLastDrink(res);

        // Refresh leaderboard via session-derived today, update member stats
        setSessionData(prev => {
          if (!prev) return prev;
          const updatedMembers = prev.today.members.map(m =>
            m.lineUserId === res.member.lineUserId
              ? { ...m, todayMl: res.member.todayMl, streak: res.member.streak }
              : m
          );
          // Re-sort
          updatedMembers.sort((a, b) => b.todayMl - a.todayMl);
          updatedMembers.forEach((m, i) => { m.rank = i + 1; });
          // Recalculate gaps
          for (let i = 0; i < updatedMembers.length; i++) {
            updatedMembers[i].gapToAbove = i === 0 ? null : updatedMembers[i - 1].todayMl - updatedMembers[i].todayMl;
            updatedMembers[i].leadOverSecond = i === 0 && updatedMembers.length > 1 ? updatedMembers[0].todayMl - updatedMembers[1].todayMl : null;
          }
          const myRow = updatedMembers.find(m => m.lineUserId === res.member.lineUserId);
          const above = myRow && myRow.rank > 1 ? updatedMembers[myRow.rank - 2] : null;
          return {
            ...prev,
            member: res.member,
            today: {
              ...prev.today,
              members: updatedMembers,
              me: {
                lineUserId: res.member.lineUserId,
                rank: myRow?.rank ?? prev.today.me.rank,
                todayMl: res.member.todayMl,
                gapToAbove: myRow?.gapToAbove ?? null,
                leadOverSecond: myRow?.leadOverSecond ?? null,
                aboveDisplayName: above?.displayName ?? null,
              },
            },
          };
        });

        // Queue achievements
        const allAchievements = [...res.eventAchievements, ...res.newPersistentAchievements];
        if (allAchievements.length > 0) {
          setAchievementQueue(q => [...q, ...allAchievements]);
        }
      } catch (err) {
        console.error('Drink error:', err);
      } finally {
        setSubmitting(false);
      }
    },
    [groupId, idToken]
  );

  function dismissAchievement(id: AchievementId) {
    setAchievementQueue(q => q.filter((a, i) => !(i === 0 && a === id)));
  }

  // ── Render states ───────────────────────────────────────────────────────────

  if (liffLoading) return <Skeleton />;

  if (liffError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-6 text-center">
        <p className="text-sky-500 text-4xl">💧</p>
        <p className="text-gray-600">LIFF 初始化失敗</p>
        <p className="text-xs text-gray-400">{liffError}</p>
      </div>
    );
  }

  if (ready && !groupId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-6 text-center">
        <p className="text-sky-500 text-4xl">💧</p>
        <p className="text-gray-700 font-semibold">請在群組內開啟</p>
        <p className="text-sm text-gray-400">這個工具需要在 LINE 群組中使用</p>
      </div>
    );
  }

  if (sessionLoading) return <Skeleton />;

  if (sessionError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-6 text-center">
        <p className="text-sky-500 text-4xl">💧</p>
        <p className="text-gray-600">載入失敗，請重試</p>
        <p className="text-xs text-gray-400">{sessionError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-5 py-2 bg-sky-500 text-white rounded-xl text-sm font-semibold"
        >
          重新載入
        </button>
      </div>
    );
  }

  if (!sessionData) return <Skeleton />;

  const { today, member } = sessionData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* Achievement Toast */}
      <AchievementToast queue={achievementQueue} onDismiss={dismissAchievement} />

      {/* Header */}
      <header className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-sky-700">{today.groupName}</h1>
          <p className="text-xs text-sky-400">{today.memberCount} 位成員</p>
        </div>
        {profile && (
          <div className="flex items-center gap-2">
            {profile.pictureUrl ? (
              <img src={profile.pictureUrl} alt={profile.displayName} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-sky-200 flex items-center justify-center text-sky-600 text-xs font-bold">
                {profile.displayName.charAt(0)}
              </div>
            )}
            <span className="text-xs text-sky-600 font-medium">{profile.displayName}</span>
          </div>
        )}
      </header>

      <main className="px-4 pb-8 flex flex-col gap-5">
        {/* Daily Progress */}
        <DailyProgress
          todayMl={today.me.todayMl}
          rank={today.me.rank}
          gapToAbove={today.me.gapToAbove}
          leadOverSecond={today.me.leadOverSecond}
          aboveDisplayName={today.me.aboveDisplayName}
        />

        {/* Drink Logger */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-sky-600 mb-3">記錄喝水</h2>
          <DrinkLogger onSubmit={handleDrink} submitting={submitting} />
        </section>

        {/* Share button (after first drink) */}
        {lastDrink && (
          <ShareButton lastDrink={lastDrink} idToken={idToken} />
        )}

        {/* Leaderboard */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-sky-600 mb-3">今日排行 💧</h2>
          <Leaderboard members={today.members} myUserId={member.lineUserId} />
        </section>
      </main>
    </div>
  );
}
