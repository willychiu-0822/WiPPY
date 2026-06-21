import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiff } from '../../contexts/useLiff';
import { waterApi } from '../../lib/liffApi';
import type { DrinkType, ReadySessionResponse, SessionResponse, DrinkResponse, WaterGroupOption } from '../../lib/liffApi';
import { getErrorMessage } from '../../lib/apiError';
import { selectHeroState } from '../../lib/waterLogic';
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

  const scenarioChips = ['一般追趕', '被超越', '連線告急', '守擂第一', '冷啟動'];

  return (
    <div className="min-h-screen min-w-full w-max bg-[radial-gradient(120%_80%_at_30%_0%,#0a1830_0%,#050a16_55%,#03060e_100%)] p-10 text-sky-50">
      <div className="mb-1.5 flex items-center gap-3.5">
        <div className="h-[9px] w-[9px] rounded-full bg-sky-400 shadow-[0_0_12px_2px_#38bdf8]" />
        <h1 className="m-0 font-['Archivo'] text-[22px] font-black tracking-normal text-[#eaf6ff]">WiPPY · 喝水戰隊</h1>
        <span className="font-['Archivo'] text-xs uppercase tracking-[.1em] text-[#5e7796]">LINE LIFF · Group Hydration Battle</span>
      </div>
      <p className="mb-[22px] ml-[23px] max-w-[680px] text-[13px] text-[#6b85a6]">點下方情境切換英雄卡狀態 · 在手機內記錄一杯會觸發結算橫幅 · 右側為分享回群組的 LINE 卡片</p>

      <div className="mb-[26px] ml-[23px] flex flex-wrap items-center gap-2">
        <span className="mr-1 font-['Archivo'] text-[11px] uppercase tracking-[.14em] text-[#5e7796]">情境</span>
        {scenarioChips.map((chip, index) => (
          <button
            key={chip}
            type="button"
            className={`min-h-[38px] rounded-full px-3.5 text-[13px] font-bold transition hover:brightness-110 ${
              index === 0
                ? 'border border-transparent bg-[linear-gradient(135deg,#38bdf8,#2563eb)] text-[#03060e]'
                : 'border border-white/10 bg-white/[.04] text-[#9fb6d2]'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-9">
        <div className="flex-none">
          <div className="mb-2.5 pl-1 font-['Archivo'] text-[11px] uppercase tracking-[.14em] text-[#6b85a6]">主畫面 · In-App</div>
      <div className="relative h-[844px] w-[390px] rounded-[46px] bg-[#03060e] p-[11px] shadow-[0_0_0_2px_#1b2942,0_40px_80px_-20px_rgba(0,0,0,.8),inset_0_0_0_1px_rgba(255,255,255,.04)]">
        <div className="absolute left-1/2 top-[11px] z-[60] h-[30px] w-32 -translate-x-1/2 rounded-b-[18px] bg-[#03060e]" />
        <div className={`wb-scroll relative h-full w-full overflow-x-hidden rounded-[36px] bg-[linear-gradient(180deg,#081428_0%,#050b18_45%,#04080f_100%)] transition-[padding-top] duration-500 ${heroExpanded ? 'overflow-y-hidden pt-20' : 'overflow-y-auto pt-0'}`}>
        <header className="px-[14px] pt-[14px]">
          <div className={`mb-2 flex h-[44px] items-start justify-between px-[10px] transition-all duration-500 ${heroExpanded ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'}`}>
            <span className="font-['Archivo'] text-sm font-black text-sky-50">9:41</span>
            <span className="font-['Archivo'] text-[11px] font-bold tracking-widest text-slate-400">5G&nbsp;&nbsp;100%</span>
          </div>

          <button type="button" onClick={() => setHistoryOpen(true)} className="block w-full text-left">
            <LivePulse pulse={today.pulse} compact />
          </button>

          <div className={`mt-[10px] overflow-hidden rounded-[18px] border border-white/[.06] bg-white/[.035] transition-all duration-500 ${heroExpanded ? 'max-h-0 opacity-0' : 'max-h-60 p-[14px_16px] opacity-100'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-black leading-tight text-sky-50">{today.groupName || '喝水戰隊'}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {today.memberCount} 位成員 · 今日 {activeCount} 人已喝
                </p>
                <span className="sr-only">{today.memberCount} 位成員</span>
              </div>
              {profile && (
                <button type="button" onClick={() => setProfileOpen(true)} className="flex flex-none flex-col items-end gap-1">
                  {profile.pictureUrl ? (
                    <img src={profile.pictureUrl} alt={profile.displayName} className="h-10 w-10 rounded-full border border-sky-300/40 object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-300/40 bg-sky-400/20 text-sm font-black text-sky-200">
                      {profile.displayName.charAt(0)}
                    </div>
                  )}
                  <span className="max-w-20 truncate text-[11px] font-bold text-slate-400">{profile.displayName}</span>
                </button>
              )}
            </div>
            <div className="mt-3">
              <GroupGoalBar group={today.group} compact />
            </div>
          </div>
        </header>

        <main className="px-[14px] pb-24 pt-3">
          <HeroStatusCard heroState={heroState} onQuickLog={handleHeroAction} todayMl={today.me.todayMl} expanded={heroExpanded}>
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
      </div>
        </div>
        <ShareCardRail
          member={member}
          group={today.group}
          groupName={today.groupName}
          surpassedCount={drinkResult?.surpassedCount ?? 0}
        />
      </div>
    </div>
  );
}

function ShareCardRail(props: {
  member: { todayMl: number };
  group: { todayMl: number; goalMl: number };
  groupName: string;
  surpassedCount: number;
}) {
  const groupPct = props.group.goalMl > 0 ? Math.min(100, Math.round((props.group.todayMl / props.group.goalMl) * 100)) : 0;

  return (
    <div className="flex flex-none flex-col gap-[30px]">
      <div>
        <div className="mb-2.5 pl-1 font-['Archivo'] text-[11px] uppercase tracking-[.14em] text-[#6b85a6]">分享卡 A · 嗆聲戰報</div>
        <LineShareCard
          variant="taunt"
          title={`我超越了 ${props.surpassedCount > 0 ? `${props.surpassedCount} 人` : '阿華'}`}
          subtitle="換你了"
          metricLabel="我的名次"
          metricValue={`第 2 名 · ${Math.round(props.member.todayMl)} ml`}
        />
      </div>

      <div className="w-[300px] rounded-2xl border border-orange-300/20 bg-white/[.03] p-[14px_16px] text-xs leading-7 text-[#9fb6d2]">
        <div className="mb-1.5 font-['Archivo'] text-[10px] font-black uppercase tracking-[.14em] text-[#ffb866]">LINE Flex 可行性</div>
        <div className="mb-1.5">大致可行，但兩處要改用 Flex 支援的做法：</div>
        <div className="flex gap-2"><span className="flex-none text-emerald-300">可</span><span>漸層 header、名次文字、綠色 CTA 皆原生支援。</span></div>
        <div className="flex gap-2"><span className="flex-none text-[#ffb866]">改</span><span>動態波浪 SVG 無法跑動畫 → 改成預先算圖的 hero image。</span></div>
        <div className="flex gap-2"><span className="flex-none text-[#ffb866]">改</span><span>頭像重疊用 position:absolute + offset 疊放。</span></div>
      </div>

      <div>
        <div className="mb-2.5 pl-1 font-['Archivo'] text-[11px] uppercase tracking-[.14em] text-[#6b85a6]">分享卡 B · 群組達標</div>
        <LineShareCard
          variant="group"
          title="群組今天達標了"
          subtitle={`${(props.group.goalMl / 1000).toFixed(0)}L 全數補滿`}
          metricLabel="今日群組水位"
          metricValue={`${(props.group.todayMl / 1000).toFixed(1)}L / ${(props.group.goalMl / 1000).toFixed(0)}L · ${groupPct}%`}
        />
      </div>

      <div className="w-[300px] rounded-2xl border border-white/[.06] bg-white/[.03] p-[14px_16px] text-xs leading-7 text-[#6b85a6]">
        <div className="mb-1.5 font-['Archivo'] text-[10px] font-black uppercase tracking-[.14em] text-[#7fdcff]">IA 重構</div>
        次要內容（成就 / 週統計 / 設定）收進右上頭像抽屜；完整動態歷史收進 Live 點擊後的底部抽屜，主畫面只留「狀態 → 行動 → 競爭」三層。
      </div>
    </div>
  );
}

function LineShareCard(props: {
  variant: 'taunt' | 'group';
  title: string;
  subtitle: string;
  metricLabel: string;
  metricValue: string;
}) {
  const gradient = props.variant === 'group'
    ? 'linear-gradient(160deg,#34d399,#059669 60%,#047857)'
    : 'linear-gradient(160deg,#ff5a5f,#e11d48 60%,#9f1239)';
  const avatar = props.variant === 'group'
    ? 'linear-gradient(140deg,#34d399,#059669)'
    : 'linear-gradient(140deg,#38bdf8,#2563eb)';

  return (
    <div className="w-[300px] overflow-hidden rounded-[22px] bg-[#8aa0b8] p-[16px_14px_18px]">
      <div className="flex items-end gap-2">
        <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full text-[13px] font-black text-[#03060e]" style={{ background: avatar }}>你</div>
        <div className="max-w-[240px] overflow-hidden rounded-[6px_18px_18px_18px] bg-white shadow-[0_2px_6px_rgba(0,0,0,.12)]">
          <div className="relative h-24 overflow-hidden" style={{ background: gradient }}>
            <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="wb-wave absolute -bottom-1 left-0 h-[34px] w-[200%]">
              <path d="M0 20 q37.5 -15 75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 t75 0 V40 H0 Z" fill="rgba(255,255,255,.28)" />
            </svg>
            <div className="relative z-10 p-[14px_16px]">
              <div className="font-['Archivo'] text-[9px] font-black uppercase tracking-[.14em] text-white/85">WiPPY · 喝水戰隊</div>
              <div className="mt-1 text-[19px] font-black leading-[1.15] text-white">{props.title}<br />{props.subtitle}</div>
            </div>
          </div>
          <div className="p-[13px_16px_16px]">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex">
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-[#fbbf24] text-xs font-black text-[#3b2606]">明</div>
                <div className="-ml-[9px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-[#38bdf8] text-xs font-black text-[#03060e]">你</div>
                <div className="-ml-[9px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-[#a78bfa] text-xs font-black text-[#1e1442]">華</div>
              </div>
              <div className="flex-1">
                <div className="text-[11px] text-slate-400">{props.metricLabel}</div>
                <div className="font-['Archivo'] text-[15px] font-black text-slate-900">{props.metricValue}</div>
              </div>
            </div>
            <div className="flex min-h-[42px] w-full items-center justify-center rounded-xl bg-[#06C755] text-sm font-black text-white">我也要記錄</div>
          </div>
        </div>
      </div>
    </div>
  );
}
