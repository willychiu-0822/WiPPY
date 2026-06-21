import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiff } from '../../contexts/useLiff';
import { waterApi } from '../../lib/liffApi';
import type { DrinkType, ReadySessionResponse, SessionResponse, DrinkResponse, WaterGroupOption } from '../../lib/liffApi';
import { getErrorMessage } from '../../lib/apiError';
import { selectHeroState } from '../../lib/waterLogic';
import DailyProgress from '../../components/liff/DailyProgress';
import DrinkLogger from '../../components/liff/DrinkLogger';
import Leaderboard from '../../components/liff/Leaderboard';
import ShareButton from '../../components/liff/ShareButton';
import DrinkResultModal from '../../components/liff/DrinkResultModal';
import HeroStatusCard from '../../components/liff/HeroStatusCard';
import GroupGoalBar from '../../components/liff/GroupGoalBar';
import LivePulse from '../../components/liff/LivePulse';

const LINE_GROUP_ID_PATTERN = /^[CR][0-9a-f]{32}$/i;

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

function GroupSelector(props: {
  groupName: string;
  groups: WaterGroupOption[];
  submitting: boolean;
  onSelect: (groupId: string) => void;
}) {
  const { groupName, groups, submitting, onSelect } = props;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white px-4 py-6">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-3xl shadow-sm p-5 text-center">
          <p className="text-sm text-sky-500 font-semibold">選擇本次要進入的群組</p>
          <h1 className="text-xl font-black text-sky-800 mt-2">{groupName}</h1>
          <p className="text-sm text-slate-500 mt-2">你已綁定多個喝水群組，請先選擇這次要查看哪一個。</p>
        </div>

        <div className="space-y-3">
          {groups.map((group) => (
            <button
              key={group.groupId}
              type="button"
              disabled={submitting}
              onClick={() => onSelect(group.groupId)}
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-4 text-left shadow-sm transition hover:border-sky-300 disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{group.groupName}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {group.isEntryGroup ? '本次入口群組' : group.alreadyBound ? '已綁定群組' : '可加入的新群組'}
                  </p>
                </div>
                <span className="text-sky-500 text-sm font-semibold">進入</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WaterTrackerPage() {
  const { ready, loading: liffLoading, error: liffError, profile, idToken, groupId: liveGroupId, authRedirecting } = useLiff();
  const [searchParams] = useSearchParams();

  const entryGroupId = useMemo(() => {
    const explicitGroupId = searchParams.get('wg')?.trim();
    if (explicitGroupId) return explicitGroupId;

    const fallbackGroupId = liveGroupId?.trim() || '';
    return LINE_GROUP_ID_PATTERN.test(fallbackGroupId) ? fallbackGroupId : '';
  }, [searchParams, liveGroupId]);
  const entryGroupName = useMemo(
    () => searchParams.get('wgName')?.trim() || undefined,
    [searchParams]
  );

  const [sessionData, setSessionData] = useState<ReadySessionResponse | null>(null);
  const [selectionData, setSelectionData] = useState<Extract<SessionResponse, { status: 'needs_group_selection' }> | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [drinkError, setDrinkError] = useState<string | null>(null);
  const [drinkResult, setDrinkResult] = useState<DrinkResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  const bootstrapSession = useCallback(async (selectedGroupId?: string) => {
    if (!entryGroupId) {
      setSessionError('缺少群組入口資訊，請從群組專屬 LIFF 連結進入。');
      return;
    }

    setSessionLoading(true);
    try {
      const data = await waterApi.session(entryGroupId, entryGroupName, selectedGroupId, idToken ?? undefined);
      if (data.status === 'needs_group_selection') {
        setSelectionData(data);
        setSessionData(null);
      } else {
        setSessionData(data);
        setSelectionData(null);
      }
      setSessionError(null);
    } catch (err: unknown) {
      setSessionError(getErrorMessage(err, 'Session failed'));
    } finally {
      setSessionLoading(false);
    }
  }, [entryGroupId, entryGroupName, idToken]);

  useEffect(() => {
    if (!ready) return;
    bootstrapSession().catch(() => {});
  }, [ready, bootstrapSession]);

  const activeGroupId = sessionData?.activeGroup.groupId ?? '';

  const handleDrink = useCallback(
    async (ml: number, drinkType: DrinkType) => {
      if (!activeGroupId) {
        throw new Error('No active water group');
      }

      setSubmitting(true);
      try {
        const res = await waterApi.drink(activeGroupId, ml, drinkType, idToken ?? undefined);
        setDrinkResult(res);
        setDrinkError(null);

        setSessionData(prev => {
          if (!prev) return prev;
          const updatedMembers = prev.today.members.map(m =>
            m.lineUserId === res.member.lineUserId
              ? { ...m, todayMl: res.member.todayMl, streak: res.member.streak, lastDrinkAt: res.member.lastDrinkAt }
              : m
          );
          updatedMembers.sort((a, b) => b.todayMl - a.todayMl);
          updatedMembers.forEach((m, i) => { m.rank = i + 1; });
          for (let i = 0; i < updatedMembers.length; i += 1) {
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
                aboveLastDrinkAt: prev.today.me.aboveLastDrinkAt,
                belowDisplayName: res.belowDisplayName,
              },
            },
          };
        });

        setShowModal(true);
      } catch (err) {
        console.error('Drink error:', err);
        setDrinkError(`記錄失敗：${getErrorMessage(err)}`);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [activeGroupId, idToken]
  );

  const handleQuickLog = useCallback((ml: number) => {
    handleDrink(ml, 'water').catch(() => {});
  }, [handleDrink]);

  if (liffLoading) return <Skeleton />;

  if (liffError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-6 text-center">
        <p className="text-sky-500 text-4xl">💧</p>
        <p className="text-gray-600">{authRedirecting ? '等待 LINE 登入中' : 'LIFF 初始化失敗'}</p>
        <p className="text-xs text-gray-400">{liffError}</p>
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
          onClick={() => bootstrapSession().catch(() => {})}
          className="mt-2 px-5 py-2 bg-sky-500 text-white rounded-xl text-sm font-semibold"
        >
          重新載入
        </button>
      </div>
    );
  }

  if (selectionData) {
    return (
      <GroupSelector
        groupName={selectionData.entryGroup.groupName}
        groups={selectionData.availableGroups}
        submitting={submitting}
        onSelect={(selectedGroupId) => {
          setSubmitting(true);
          bootstrapSession(selectedGroupId).finally(() => setSubmitting(false));
        }}
      />
    );
  }

  if (!sessionData) return <Skeleton />;

  const { today, member } = sessionData;
  const heroState = selectHeroState(today, member);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {showModal && drinkResult && (
        <DrinkResultModal
          drinkResult={drinkResult}
          idToken={idToken}
          entryGroupId={sessionData.activeGroup.entryGroupId}
          onClose={() => setShowModal(false)}
        />
      )}

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
        <DailyProgress
          todayMl={today.me.todayMl}
          rank={today.me.rank}
          gapToAbove={today.me.gapToAbove}
          leadOverSecond={today.me.leadOverSecond}
          aboveDisplayName={today.me.aboveDisplayName}
        />

        <HeroStatusCard heroState={heroState} onQuickLog={handleQuickLog} />
        <GroupGoalBar group={today.group} />

        <ShareButton
          member={member}
          surpassedCount={drinkResult?.surpassedCount}
          achievements={drinkResult ? [...drinkResult.eventAchievements, ...drinkResult.newPersistentAchievements] : []}
          idToken={idToken}
          entryGroupId={sessionData.activeGroup.entryGroupId}
        />

        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-sky-600 mb-3">記錄喝水</h2>
          <DrinkLogger onSubmit={handleDrink} submitting={submitting} />
          {drinkError && <p className="mt-2 text-xs text-red-500 text-center">{drinkError}</p>}
        </section>

        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-sky-600 mb-3">今日排行 💧</h2>
          <Leaderboard
            members={today.members}
            myUserId={member.lineUserId}
            myLastDrinkAt={member.lastDrinkAt}
          />
        </section>

        <LivePulse pulse={today.pulse} />
      </main>
    </div>
  );
}
