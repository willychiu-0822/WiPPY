import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLiff } from '../../contexts/useLiff';
import { waterApi } from '../../lib/liffApi';
import type { DrinkType, ReadySessionResponse, SessionResponse, DrinkResponse, WaterGroupOption } from '../../lib/liffApi';
import { getErrorMessage } from '../../lib/apiError';
import { getLiffEntryParam, getWaterEntryGroupId, LINE_GROUP_ID_PATTERN } from '../../lib/liffEntry';
import { selectHeroState } from '../../lib/waterLogic';
import DrinkLogger from '../../components/liff/DrinkLogger';
import Leaderboard from '../../components/liff/Leaderboard';
import ShareButton from '../../components/liff/ShareButton';
import DrinkResultModal from '../../components/liff/DrinkResultModal';
import HeroStatusCard from '../../components/liff/HeroStatusCard';
import GroupGoalBar from '../../components/liff/GroupGoalBar';
import LivePulse from '../../components/liff/LivePulse';

function Skeleton() {
  return (
    <div className="min-h-screen bg-[#03060e] p-4">
      <div className="mx-auto flex min-h-screen max-w-md animate-pulse flex-col gap-4 rounded-[2rem] bg-[#071326] p-4">
        <div className="h-11 rounded-3xl bg-white/5" />
        <div className="h-72 rounded-3xl bg-white/5" />
        <div className="h-40 rounded-3xl bg-white/5" />
        <div className="h-64 rounded-3xl bg-white/5" />
      </div>
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
  const { search } = useLocation();
  const screenRef = useRef<HTMLDivElement>(null);

  const entryGroupId = useMemo(() => {
    const explicitGroupId = getWaterEntryGroupId(search);
    if (explicitGroupId) return explicitGroupId;

    const fallbackGroupId = liveGroupId?.trim() || '';
    return LINE_GROUP_ID_PATTERN.test(fallbackGroupId) ? fallbackGroupId : '';
  }, [search, liveGroupId]);
  const entryGroupName = useMemo(
    () => getLiffEntryParam(search, 'wgName')?.trim() || undefined,
    [search]
  );

  const [sessionData, setSessionData] = useState<ReadySessionResponse | null>(null);
  const [selectionData, setSelectionData] = useState<Extract<SessionResponse, { status: 'needs_group_selection' }> | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [drinkError, setDrinkError] = useState<string | null>(null);
  const [drinkResult, setDrinkResult] = useState<DrinkResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [heroExpanded, setHeroExpanded] = useState(false);
  const [suggestedAmount, setSuggestedAmount] = useState<number | undefined>(undefined);
  const [suggestionKey, setSuggestionKey] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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

  const handleHeroAction = useCallback((ml: number) => {
    if (ml <= 0) {
      setHeroExpanded(false);
      return;
    }
    setSuggestedAmount(ml);
    setSuggestionKey((key) => key + 1);
    setHeroExpanded(true);
  }, []);

  useEffect(() => {
    if (!heroExpanded) return;
    screenRef.current?.scrollTo({ top: 0 });
  }, [heroExpanded, suggestionKey]);

  if (liffLoading) return <Skeleton />;

  if (liffError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#03060e] p-6 text-center">
        <p className="text-4xl text-sky-300">💧</p>
        <p className="text-sky-100">{authRedirecting ? '等待 LINE 登入中' : 'LIFF 初始化失敗'}</p>
        <p className="text-xs text-slate-500">{liffError}</p>
      </div>
    );
  }

  if (sessionLoading) return <Skeleton />;

  if (sessionError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#03060e] p-6 text-center">
        <p className="text-4xl text-sky-300">💧</p>
        <p className="text-sky-100">載入失敗，請重試</p>
        <p className="text-xs text-slate-500">{sessionError}</p>
        <button
          onClick={() => bootstrapSession().catch(() => {})}
          className="mt-2 rounded-2xl bg-sky-400 px-5 py-2 text-sm font-black text-[#03060e]"
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
  const activeCount = today.members.filter((item) => item.todayMl > 0).length;

  return (
    <div ref={screenRef} className={`wb-scroll relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#081428_0%,#050b18_45%,#04080f_100%)] text-sky-50 ${heroExpanded ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
      <div className={`overflow-hidden transition-all duration-500 ${heroExpanded ? 'max-h-0 opacity-0' : 'max-h-[210px] opacity-100'}`}>
        <header className="px-[14px] pt-[14px]">
          <LivePulse pulse={today.pulse} compact onOpenHistory={() => setHistoryOpen(true)} onOpenProfile={() => setProfileOpen(true)} />

          <div className="mt-[10px] overflow-hidden rounded-[18px] border border-white/[.06] bg-white/[.035] p-[14px_16px]">
            <div className="mb-[11px] flex items-start justify-between gap-[14px]">
              <div className="min-w-0">
                <p className="text-lg font-black leading-tight text-sky-50">{today.groupName || '喝水戰隊'}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {today.memberCount} 位成員 · 今日 {activeCount} 人已喝
                </p>
                <span className="sr-only">{today.memberCount} 位成員</span>
              </div>
              <div className="flex-none text-right">
                <div className="font-['Archivo'] text-[10px] font-bold uppercase tracking-[.15em] text-[#7fdcff]">Group Tide</div>
                <div className="mt-0.5 font-['Archivo'] text-[15px] font-black text-[#eaf6ff]">
                  <span className="text-[#38bdf8]">{(today.group.todayMl / 1000).toFixed(1)}L</span>
                  <span className="text-[#5e7796]"> / {(today.group.goalMl / 1000).toFixed(1)}L</span>
                  <span className="text-[13px] font-bold text-[#9fb6d2]"> · {today.group.goalMl > 0 ? Math.min(100, Math.round((today.group.todayMl / today.group.goalMl) * 100)) : 0}%</span>
                </div>
              </div>
            </div>
            <GroupGoalBar group={today.group} compact />
          </div>
        </header>
      </div>

        <main className="px-[14px] pb-24 pt-3">
          <HeroStatusCard
            heroState={heroState}
            onQuickLog={handleHeroAction}
            todayMl={today.me.todayMl}
            rankLabel={`第 ${today.me.rank} 名`}
            expanded={heroExpanded}
          >
            <DrinkLogger
              key={suggestionKey}
              onSubmit={handleDrink}
              submitting={submitting}
              initialAmount={suggestedAmount}
              onSubmitted={() => setHeroExpanded(false)}
            />
            {drinkError && (
              <p className="mt-2 text-center text-xs text-rose-100">{drinkError}</p>
            )}
          </HeroStatusCard>

          <section className={`mt-4 overflow-hidden rounded-[22px] border border-white/[.06] bg-white/[.03] p-[16px_14px_14px] transition-all duration-500 ${heroExpanded ? 'max-h-0 opacity-0' : 'max-h-[640px] opacity-100'}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black text-white">今日排行</h2>
              <span className="font-['Archivo'] text-[11px] tracking-wide text-slate-500">TODAY · ml</span>
            </div>
            <Leaderboard
              members={today.members}
              myUserId={member.lineUserId}
              myLastDrinkAt={member.lastDrinkAt}
            />
          </section>
        </main>

        <div className={`absolute bottom-0 left-0 right-0 z-[35] bg-[linear-gradient(180deg,transparent,#04080f_38%)] p-[14px_16px_24px] transition duration-500 ${heroExpanded ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
          <ShareButton
            member={member}
            surpassedCount={drinkResult?.surpassedCount}
            achievements={drinkResult ? [...drinkResult.eventAchievements, ...drinkResult.newPersistentAchievements] : []}
            idToken={idToken}
            entryGroupId={sessionData.activeGroup.entryGroupId}
          />
        </div>

      {showModal && drinkResult && (
        <DrinkResultModal
          drinkResult={drinkResult}
          idToken={idToken}
          entryGroupId={sessionData.activeGroup.entryGroupId}
          onClose={() => setShowModal(false)}
        />
      )}

      {historyOpen && (
        <>
          <div className="absolute inset-0 z-[75] bg-[#03060e]/60 backdrop-blur" onClick={() => setHistoryOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 z-[76] flex max-h-[74%] flex-col rounded-t-[26px] border-t border-white/10 bg-[#0a1424] p-[8px_18px_24px]">
            <div className="mx-auto mb-[14px] mt-2 h-[5px] w-[42px] rounded-[3px] bg-white/[.18]" />
            <div className="mb-[14px] flex items-center justify-between">
              <span className="text-[17px] font-black text-sky-50">今日喝水紀錄</span>
              <button type="button" onClick={() => setHistoryOpen(false)} className="text-sm text-slate-500">關閉</button>
            </div>
            <div className="wb-scroll overflow-y-auto">
              <LivePulse pulse={today.pulse} />
            </div>
          </div>
        </>
      )}

      {profileOpen && (
        <>
          <div className="absolute inset-0 z-[75] bg-[#03060e]/60 backdrop-blur" onClick={() => setProfileOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 z-[76] rounded-t-[26px] border-t border-white/10 bg-[#0a1424] p-[8px_18px_26px]">
            <div className="mx-auto mb-4 mt-2 h-[5px] w-[42px] rounded-[3px] bg-white/[.18]" />
            <div className="mb-[18px] flex items-center gap-[14px]">
              <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[linear-gradient(140deg,#38bdf8,#2563eb)] text-[22px] font-black text-[#03060e]">你</div>
              <div>
                <div className="text-lg font-black text-sky-50">{profile?.displayName ?? member.displayName}</div>
                <div className="mt-0.5 text-xs text-slate-500">{today.groupName} · 第 {today.me.rank} 名</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-[9px]">
              <div className="rounded-2xl border border-white/[.06] bg-white/[.04] p-[14px_4px] text-center">
                <p className="font-['Archivo'] text-[22px] font-black text-sky-300">{member.todayMl}</p>
                <p className="mt-1 text-[10px] text-slate-500">今日 ml</p>
              </div>
              <div className="rounded-2xl border border-white/[.06] bg-white/[.04] p-[14px_4px] text-center">
                <p className="font-['Archivo'] text-[22px] font-black text-orange-300">{member.streak}</p>
                <p className="mt-1 text-[10px] text-slate-500">連續天數</p>
              </div>
              <div className="rounded-2xl border border-white/[.06] bg-white/[.04] p-[14px_4px] text-center">
                <p className="font-['Archivo'] text-[22px] font-black text-cyan-300">{(member.weekMl / 1000).toFixed(1)}</p>
                <p className="mt-1 text-[10px] text-slate-500">本週 L</p>
              </div>
            </div>
            <div className="mt-[14px] text-center text-[11px] text-slate-600">成就 · 週統計 · 設定都收納在這裡</div>
          </div>
        </>
      )}
    </div>
  );
}
