import type {
  AchievementId,
  DrinkResponse,
  DrinkType,
  FirestoreTimestamp,
  GroupGoal,
  LeaderboardRow,
  MeInfo,
  MyProfileResponse,
  PulseItem,
  SessionResponse,
  TauntsResponse,
  TodayResponse,
  WaterMember,
  WeeklyStatsResponse,
} from './liffApi';
import { getActiveLiffMockPresetId, type LiffMockPresetId } from './liffDev';

const MOCK_USER_ID = 'Udev1234567890';
const NOW_TS: FirestoreTimestamp = { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 };
const RECENT_TS: FirestoreTimestamp = { _seconds: Math.floor(Date.now() / 1000) - 5 * 60, _nanoseconds: 0 }; // 5 min ago
const OLD_TS: FirestoreTimestamp = { _seconds: Math.floor(Date.now() / 1000) - 30 * 60, _nanoseconds: 0 }; // 30 min ago
const DEFAULT_GROUP_ID = 'Cdev1';
const DEFAULT_GROUP_NAME = '開發測試群';
const DEFAULT_BASELINE_ML = 1500;

interface MockMemberState {
  todayMl: number;
  weekMl: number;
  totalMl: number;
  streak: number;
  achievements: AchievementId[];
  drinkCount: number;
  lastDrinkAt: FirestoreTimestamp | null;
}

interface LiffMockState {
  member: MockMemberState;
  others: LeaderboardRow[];
  groupGoalOverride?: Partial<GroupGoal>;
  // combo: extra records in 90-min window for this user
  priorComboCount: number;
}

export interface LiffWaterApiAdapter {
  session: (entryGroupId: string, entryGroupName?: string, selectedGroupId?: string, idToken?: string) => Promise<SessionResponse>;
  drink: (groupId: string, ml: number, drinkType: DrinkType, idToken?: string) => Promise<DrinkResponse>;
  todayLeaderboard: (groupId: string, idToken?: string) => Promise<TodayResponse>;
  myProfile: (groupId: string, idToken?: string) => Promise<MyProfileResponse>;
  weeklyStats: (groupId: string, idToken?: string) => Promise<WeeklyStatsResponse>;
  taunts: (idToken?: string) => Promise<TauntsResponse>;
  pulse: (groupId: string, idToken?: string) => Promise<{ pulse: PulseItem[] }>;
}

export const LIFF_MOCK_PRESET_DESCRIPTIONS: Record<LiffMockPresetId, string> = {
  default: '一般開發情境：使用者在測試群中，排行榜資料正常。',
  new_user: '新使用者第一次進入，今日水量與成就為零。',
  rank_behind: '使用者落後其他成員，用來測排行榜追趕 UI。',
  rank_first: '使用者目前第一名，用來測領先狀態與分享文案。',
  no_group: 'LIFF context 沒有 groupId，用來測非群組 guard。',
  share_unavailable: 'LINE 分享 API 不可用，用來測分享錯誤 UI。',
  api_401: '水量 API 回 401，用來測 token/auth 錯誤。',
  api_500: '水量 API 回 500，用來測後端錯誤。',
  overtaken: '我第 2 名、上一名最近喝過 → 英雄卡 overtaken 紅態。',
  streak_risk: '今日未記、streak=5 → 英雄卡 streak_risk 置頂（M6）。',
  group_near_goal: '群組 95% 進度 → 記一杯觸發 groupGoalJustReached。',
  combo: '90 分鐘內已 2 筆 → 下次 drink comboCount ≥ 3。',
  cold_start: '群組今日全 0、我 streak=0 → 英雄卡 ignition；首杯 isDailyFirst=true。',
};

const MOCK_TAUNTS = [
  '你喝了多少水？我今天已經超過你了 💪',
  '水分補充不足，腦子不好使喔 🧠',
  '喝水才能贏，快跟上！',
  '我今天的水量已經把你淹沒了 🌊',
  '連喝水都輸給我，你還有什麼優勢？',
  '再不喝水，你的皮膚要裂了 😬',
  '別讓我一個人喝水，太孤單了 🥹',
  '喝水冠軍非我莫屬 🏆',
  '你的腎臟在哭泣，快去喝水！',
  '就知道你不夠水 😏',
];

function baseOthers(): LeaderboardRow[] {
  return [
    {
      rank: 2,
      lineUserId: 'Uother1',
      displayName: '小明',
      pictureUrl: '',
      todayMl: 200,
      streak: 1,
      gapToAbove: 300,
      leadOverSecond: null,
      lastDrinkAt: OLD_TS,
    },
    {
      rank: 3,
      lineUserId: 'Uother2',
      displayName: '小美',
      pictureUrl: '',
      todayMl: 100,
      streak: 0,
      gapToAbove: 100,
      leadOverSecond: null,
      lastDrinkAt: null,
    },
  ];
}

function buildPresetState(presetId: LiffMockPresetId): LiffMockState {
  const state: LiffMockState = {
    member: {
      todayMl: 500,
      weekMl: 2000,
      totalMl: 10000,
      streak: 3,
      achievements: ['first_drink'],
      drinkCount: 1,
      lastDrinkAt: OLD_TS,
    },
    others: baseOthers(),
    priorComboCount: 0,
  };

  if (presetId === 'new_user') {
    state.member = {
      todayMl: 0,
      weekMl: 0,
      totalMl: 0,
      streak: 0,
      achievements: [],
      drinkCount: 0,
      lastDrinkAt: null,
    };
  }

  if (presetId === 'rank_behind') {
    state.member.todayMl = 150;
    state.member.weekMl = 900;
    state.others = [
      { ...state.others[0]!, todayMl: 1200, rank: 1, gapToAbove: null, leadOverSecond: 550, lastDrinkAt: RECENT_TS },
      { ...state.others[1]!, todayMl: 650, rank: 2, gapToAbove: 550, leadOverSecond: null, lastDrinkAt: OLD_TS },
    ];
  }

  if (presetId === 'rank_first') {
    state.member.todayMl = 1800;
    state.member.weekMl = 5600;
    state.member.streak = 7;
    state.member.achievements = ['first_drink', '7_day_streak', 'now_im_best'];
    state.member.lastDrinkAt = RECENT_TS;
  }

  // ★ overtaken: I'm rank 2, person above me drank AFTER me
  if (presetId === 'overtaken') {
    state.member.todayMl = 400;
    state.member.lastDrinkAt = OLD_TS;
    state.others = [
      {
        rank: 1,
        lineUserId: 'Uother1',
        displayName: '小明',
        pictureUrl: '',
        todayMl: 500,
        streak: 2,
        gapToAbove: null,
        leadOverSecond: 100,
        lastDrinkAt: RECENT_TS, // drank more recently than me → overtaken
      },
      {
        rank: 3,
        lineUserId: 'Uother2',
        displayName: '小美',
        pictureUrl: '',
        todayMl: 200,
        streak: 0,
        gapToAbove: 200,
        leadOverSecond: null,
        lastDrinkAt: null,
      },
    ];
  }

  // ★ streak_risk: today = 0, streak = 5
  if (presetId === 'streak_risk') {
    state.member.todayMl = 0;
    state.member.streak = 5;
    state.member.drinkCount = 0;
    state.member.lastDrinkAt = null;
    state.others = [
      { ...state.others[0]!, todayMl: 300, rank: 1, gapToAbove: null, leadOverSecond: 100, lastDrinkAt: OLD_TS },
      { ...state.others[1]!, todayMl: 200, rank: 2, gapToAbove: 100, leadOverSecond: null, lastDrinkAt: null },
    ];
  }

  // ★ group_near_goal: group is at ~95% of 3×1500 = 4500 → need ~225ml more
  if (presetId === 'group_near_goal') {
    state.member.todayMl = 1400;
    state.others = [
      { ...state.others[0]!, todayMl: 1400, rank: 2, gapToAbove: null, leadOverSecond: null, lastDrinkAt: OLD_TS },
      { ...state.others[1]!, todayMl: 1425, rank: 1, gapToAbove: null, leadOverSecond: null, lastDrinkAt: RECENT_TS },
    ];
    state.groupGoalOverride = {
      todayMl: 4225, // 1400 + 1400 + 1425
      goalMl: 4500,
      goalReached: false,
    };
  }

  // ★ combo: 2 drinks already logged in past 90 min → next drink gives comboCount ≥ 3
  if (presetId === 'combo') {
    state.member.todayMl = 600;
    state.member.drinkCount = 2;
    state.member.lastDrinkAt = RECENT_TS;
    state.priorComboCount = 2;
  }

  // ★ cold_start: group today = 0, nobody has drunk yet
  if (presetId === 'cold_start') {
    state.member.todayMl = 0;
    state.member.streak = 0;
    state.member.drinkCount = 0;
    state.member.lastDrinkAt = null;
    state.others = [
      { ...state.others[0]!, todayMl: 0, rank: 1, gapToAbove: null, leadOverSecond: null, lastDrinkAt: null },
      { ...state.others[1]!, todayMl: 0, rank: 2, gapToAbove: 0, leadOverSecond: null, lastDrinkAt: null },
    ];
    state.groupGoalOverride = {
      todayMl: 0,
      goalMl: 4500,
      goalReached: false,
      firstLoggerDisplayName: null,
    };
  }

  return state;
}

let activePresetId = getActiveLiffMockPresetId();
let activeState = buildPresetState(activePresetId);
let lastMockError: string | null = null;
let groupDrinkSeqCounter = 1;

export function getLastLiffMockError(): string | null {
  return lastMockError;
}

export function resetActiveLiffMockState(): void {
  activePresetId = getActiveLiffMockPresetId();
  activeState = buildPresetState(activePresetId);
  lastMockError = null;
  groupDrinkSeqCounter = 1;
}

function getState(): LiffMockState {
  const nextPresetId = getActiveLiffMockPresetId();
  if (nextPresetId !== activePresetId) {
    activePresetId = nextPresetId;
    activeState = buildPresetState(activePresetId);
    lastMockError = null;
    groupDrinkSeqCounter = 1;
  }
  return activeState;
}

function maybeThrowPresetError(): void {
  const presetId = getActiveLiffMockPresetId();
  if (presetId === 'api_401') {
    lastMockError = '401: LIFF ID token expired';
    throw new Error(lastMockError);
  }
  if (presetId === 'api_500') {
    lastMockError = '500: Water API unavailable';
    throw new Error(lastMockError);
  }
}

function buildMockMember(state = getState()): WaterMember {
  return {
    lineUserId: MOCK_USER_ID,
    displayName: 'Dev User',
    pictureUrl: '',
    todayMl: state.member.todayMl,
    weekMl: state.member.weekMl,
    totalMl: state.member.totalMl,
    streak: state.member.streak,
    achievements: [...state.member.achievements],
    lastDrinkAt: state.member.lastDrinkAt,
  };
}

function buildMockLeaderboard(state = getState()): { members: LeaderboardRow[]; me: MeInfo } {
  const allRows: LeaderboardRow[] = [
    {
      rank: 0,
      lineUserId: MOCK_USER_ID,
      displayName: 'Dev User',
      pictureUrl: '',
      todayMl: state.member.todayMl,
      streak: state.member.streak,
      gapToAbove: null,
      leadOverSecond: null,
      lastDrinkAt: state.member.lastDrinkAt,
    },
    ...state.others.map(row => ({ ...row })),
  ];

  allRows.sort((a, b) => b.todayMl - a.todayMl);
  allRows.forEach((row, i) => { row.rank = i + 1; });

  for (let i = 0; i < allRows.length; i++) {
    if (i === 0) {
      allRows[i].gapToAbove = null;
      allRows[i].leadOverSecond = allRows.length > 1 ? allRows[i].todayMl - allRows[1].todayMl : null;
    } else {
      allRows[i].gapToAbove = allRows[i - 1].todayMl - allRows[i].todayMl;
      allRows[i].leadOverSecond = null;
    }
  }

  const myRow = allRows.find(row => row.lineUserId === MOCK_USER_ID)!;
  const myIndex = allRows.indexOf(myRow);
  const above = myIndex > 0 ? allRows[myIndex - 1] : null;
  const below = allRows[myIndex + 1] ?? null;

  return {
    members: allRows,
    me: {
      lineUserId: MOCK_USER_ID,
      rank: myRow.rank,
      todayMl: myRow.todayMl,
      gapToAbove: myRow.gapToAbove,
      leadOverSecond: myRow.leadOverSecond,
      aboveDisplayName: above?.displayName ?? null,
      aboveLastDrinkAt: above?.lastDrinkAt ?? null,
      belowDisplayName: below?.displayName ?? null,
    },
  };
}

function buildGroupGoal(state: LiffMockState, members: LeaderboardRow[]): GroupGoal {
  const totalMl = members.reduce((sum, m) => sum + m.todayMl, 0);
  const goalMl = members.length * DEFAULT_BASELINE_ML;
  const base: GroupGoal = {
    todayMl: totalMl,
    goalMl,
    goalReached: totalMl >= goalMl,
    perMemberBaselineMl: DEFAULT_BASELINE_ML,
    firstLoggerDisplayName: null,
  };
  return { ...base, ...state.groupGoalOverride };
}

function buildMockPulse(state: LiffMockState, members: LeaderboardRow[]): PulseItem[] {
  const rankMap = new Map(members.map(m => [m.lineUserId, m.rank]));
  const items: PulseItem[] = [];

  if (state.member.lastDrinkAt && state.member.drinkCount > 0) {
    items.push({
      lineUserId: MOCK_USER_ID,
      displayName: 'Dev User',
      pictureUrl: '',
      ml: 250,
      drinkType: 'water',
      timestamp: state.member.lastDrinkAt,
      rankNow: rankMap.get(MOCK_USER_ID) ?? 0,
    });
  }

  for (const other of state.others) {
    if (other.lastDrinkAt && other.todayMl > 0) {
      items.push({
        lineUserId: other.lineUserId,
        displayName: other.displayName,
        pictureUrl: other.pictureUrl,
        ml: Math.round(other.todayMl * 0.4),
        drinkType: 'water',
        timestamp: other.lastDrinkAt,
        rankNow: rankMap.get(other.lineUserId) ?? 0,
      });
    }
  }

  items.sort((a, b) => b.timestamp._seconds - a.timestamp._seconds);
  return items;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const mockWaterApi: LiffWaterApiAdapter = {
  session: async (entryGroupId: string, entryGroupName?: string): Promise<SessionResponse> => {
    maybeThrowPresetError();
    await delay(300);
    const state = getState();
    const { members, me } = buildMockLeaderboard(state);
    return {
      status: 'ready',
      activeGroup: {
        groupId: entryGroupId || DEFAULT_GROUP_ID,
        groupName: entryGroupName ?? DEFAULT_GROUP_NAME,
        entryGroupId: entryGroupId || DEFAULT_GROUP_ID,
      },
      isNewUser: activePresetId === 'new_user',
      user: {
        lineUserId: MOCK_USER_ID,
        displayName: 'Dev User',
        pictureUrl: '',
        firstSeenAt: NOW_TS,
        lastSeenAt: NOW_TS,
        lastGroupId: entryGroupId || DEFAULT_GROUP_ID,
        groupIds: [entryGroupId || DEFAULT_GROUP_ID],
      },
      member: buildMockMember(state),
      today: {
        groupName: entryGroupName ?? DEFAULT_GROUP_NAME,
        memberCount: members.length,
        members,
        me,
        group: buildGroupGoal(state, members),
        pulse: buildMockPulse(state, members),
      },
    };
  },

  drink: async (_groupId: string, ml: number, drinkType: DrinkType): Promise<DrinkResponse> => {
    maybeThrowPresetError();
    await delay(400);
    const state = getState();
    const rankBefore = buildMockLeaderboard(state).me.rank;

    state.member.todayMl += ml;
    state.member.weekMl += ml;
    state.member.totalMl += ml;
    state.member.drinkCount += 1;
    state.member.lastDrinkAt = NOW_TS;

    const { members, me: meAfter } = buildMockLeaderboard(state);
    const rankAfter = meAfter.rank;
    const surpassedCount = Math.max(0, rankBefore - rankAfter);

    const eventAchievements: AchievementId[] = [];
    if (rankAfter === 1) eventAchievements.push('now_im_best');
    else if (rankAfter === state.others.length + 1) eventAchievements.push('now_im_worst');

    const newPersistentAchievements: AchievementId[] = [];
    if (state.member.drinkCount === 1 && !state.member.achievements.includes('first_drink')) {
      newPersistentAchievements.push('first_drink');
      state.member.achievements.push('first_drink');
    }
    if (state.member.drinkCount >= 5 && !state.member.achievements.includes('hydration_master')) {
      newPersistentAchievements.push('hydration_master');
      state.member.achievements.push('hydration_master');
    }

    // ★ M6 daily_first
    const isDailyFirst = activePresetId === 'cold_start' && state.member.drinkCount === 1;
    if (isDailyFirst) {
      eventAchievements.push('daily_first');
      if (state.groupGoalOverride) {
        state.groupGoalOverride.firstLoggerDisplayName = 'Dev User';
      }
    }

    // ★ M4 gamification fields
    const comboCount = state.priorComboCount + 1; // combo accumulates across drinks in session
    state.priorComboCount = comboCount;

    const groupTodayMl = members.reduce((sum, m) => sum + m.todayMl, 0);
    const groupGoalMl = members.length * DEFAULT_BASELINE_ML;
    const groupGoalOverrideTodayMl = state.groupGoalOverride?.todayMl;
    const effectiveGroupTodayMl = groupGoalOverrideTodayMl != null
      ? groupGoalOverrideTodayMl + ml
      : groupTodayMl;

    if (state.groupGoalOverride?.todayMl != null) {
      state.groupGoalOverride.todayMl = effectiveGroupTodayMl;
    }

    const groupGoalJustReached =
      activePresetId === 'group_near_goal' &&
      effectiveGroupTodayMl >= groupGoalMl &&
      (groupGoalOverrideTodayMl ?? 0) < groupGoalMl;

    groupDrinkSeqCounter += 1;

    return {
      record: {
        id: `mock-${Date.now()}`,
        lineUserId: MOCK_USER_ID,
        displayName: 'Dev User',
        ml,
        drinkType,
        date: new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }).replace(/\//g, '-'),
        timestamp: NOW_TS,
      },
      member: buildMockMember(state),
      rankBefore,
      rankAfter,
      surpassedCount,
      eventAchievements,
      newPersistentAchievements,
      comboCount,
      groupTodayMl: effectiveGroupTodayMl,
      groupGoalMl,
      groupGoalJustReached,
      groupDrinkSequence: groupDrinkSeqCounter,
      belowDisplayName: meAfter.belowDisplayName,
      isDailyFirst,
    };
  },

  todayLeaderboard: async (): Promise<TodayResponse> => {
    maybeThrowPresetError();
    await delay(200);
    const state = getState();
    const { members, me } = buildMockLeaderboard(state);
    return {
      groupName: DEFAULT_GROUP_NAME,
      memberCount: members.length,
      members,
      me,
      group: buildGroupGoal(state, members),
      pulse: buildMockPulse(state, members),
    };
  },

  myProfile: async (): Promise<MyProfileResponse> => {
    maybeThrowPresetError();
    await delay(200);
    const { me } = buildMockLeaderboard();
    return {
      member: buildMockMember(),
      rank: me.rank,
      gapToAbove: me.gapToAbove,
      leadOverSecond: me.leadOverSecond,
      aboveDisplayName: me.aboveDisplayName,
    };
  },

  weeklyStats: async (): Promise<WeeklyStatsResponse> => {
    maybeThrowPresetError();
    await delay(200);
    const state = getState();
    const today = new Date();
    const dailyTotals = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().slice(0, 10), totalMl: 600 + i * 140 };
    });
    return {
      dailyTotals,
      memberBreakdown: [
        { lineUserId: MOCK_USER_ID, displayName: 'Dev User', weekMl: state.member.weekMl },
        { lineUserId: 'Uother1', displayName: '小明', weekMl: 1200 },
        { lineUserId: 'Uother2', displayName: '小美', weekMl: 800 },
      ],
    };
  },

  taunts: async (): Promise<TauntsResponse> => {
    await delay(100);
    return { taunts: MOCK_TAUNTS };
  },

  pulse: async (): Promise<{ pulse: PulseItem[] }> => {
    await delay(200);
    const state = getState();
    const { members } = buildMockLeaderboard(state);
    return { pulse: buildMockPulse(state, members) };
  },
};

export { DEFAULT_GROUP_ID };
