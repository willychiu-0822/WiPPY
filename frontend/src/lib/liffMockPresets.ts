import type {
  AchievementId,
  DrinkResponse,
  DrinkType,
  FirestoreTimestamp,
  LeaderboardRow,
  MeInfo,
  MyProfileResponse,
  SessionResponse,
  TauntsResponse,
  TodayResponse,
  WaterMember,
  WeeklyStatsResponse,
} from './liffApi';
import { getActiveLiffMockPresetId, type LiffMockPresetId } from './liffDev';

const MOCK_USER_ID = 'Udev1234567890';
const NOW_TS: FirestoreTimestamp = { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 };
const DEFAULT_GROUP_ID = 'Cdev1';
const DEFAULT_GROUP_NAME = '開發測試群';

interface MockMemberState {
  todayMl: number;
  weekMl: number;
  totalMl: number;
  streak: number;
  achievements: AchievementId[];
  drinkCount: number;
}

interface LiffMockState {
  member: MockMemberState;
  others: LeaderboardRow[];
}

export interface LiffWaterApiAdapter {
  session: (groupId: string, groupName?: string, idToken?: string) => Promise<SessionResponse>;
  drink: (groupId: string, ml: number, drinkType: DrinkType, idToken?: string) => Promise<DrinkResponse>;
  todayLeaderboard: (groupId: string, idToken?: string) => Promise<TodayResponse>;
  myProfile: (groupId: string, idToken?: string) => Promise<MyProfileResponse>;
  weeklyStats: (groupId: string, idToken?: string) => Promise<WeeklyStatsResponse>;
  taunts: (idToken?: string) => Promise<TauntsResponse>;
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
    },
    others: baseOthers(),
  };

  if (presetId === 'new_user') {
    state.member = {
      todayMl: 0,
      weekMl: 0,
      totalMl: 0,
      streak: 0,
      achievements: [],
      drinkCount: 0,
    };
  }

  if (presetId === 'rank_behind') {
    state.member.todayMl = 150;
    state.member.weekMl = 900;
    state.others = [
      { ...state.others[0], todayMl: 1200 },
      { ...state.others[1], todayMl: 650 },
    ];
  }

  if (presetId === 'rank_first') {
    state.member.todayMl = 1800;
    state.member.weekMl = 5600;
    state.member.streak = 7;
    state.member.achievements = ['first_drink', '7_day_streak', 'now_im_best'];
  }

  return state;
}

let activePresetId = getActiveLiffMockPresetId();
let activeState = buildPresetState(activePresetId);
let lastMockError: string | null = null;

export function getLastLiffMockError(): string | null {
  return lastMockError;
}

export function resetActiveLiffMockState(): void {
  activePresetId = getActiveLiffMockPresetId();
  activeState = buildPresetState(activePresetId);
  lastMockError = null;
}

function getState(): LiffMockState {
  const nextPresetId = getActiveLiffMockPresetId();
  if (nextPresetId !== activePresetId) {
    activePresetId = nextPresetId;
    activeState = buildPresetState(activePresetId);
    lastMockError = null;
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
    lastDrinkAt: state.member.drinkCount > 0 ? NOW_TS : null,
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
  const above = myRow.rank > 1 ? allRows[myRow.rank - 2] : null;

  return {
    members: allRows,
    me: {
      lineUserId: MOCK_USER_ID,
      rank: myRow.rank,
      todayMl: myRow.todayMl,
      gapToAbove: myRow.gapToAbove,
      leadOverSecond: myRow.leadOverSecond,
      aboveDisplayName: above?.displayName ?? null,
    },
  };
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const mockWaterApi: LiffWaterApiAdapter = {
  session: async (groupId: string, groupName?: string): Promise<SessionResponse> => {
    maybeThrowPresetError();
    await delay(300);
    const state = getState();
    const { members, me } = buildMockLeaderboard(state);
    return {
      isNewUser: activePresetId === 'new_user',
      user: {
        lineUserId: MOCK_USER_ID,
        displayName: 'Dev User',
        pictureUrl: '',
        firstSeenAt: NOW_TS,
        lastSeenAt: NOW_TS,
        lastGroupId: groupId,
      },
      member: buildMockMember(state),
      today: {
        groupName: groupName ?? DEFAULT_GROUP_NAME,
        memberCount: members.length,
        members,
        me,
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

    const rankAfter = buildMockLeaderboard(state).me.rank;
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
    };
  },

  todayLeaderboard: async (): Promise<TodayResponse> => {
    maybeThrowPresetError();
    await delay(200);
    const { members, me } = buildMockLeaderboard();
    return { groupName: DEFAULT_GROUP_NAME, memberCount: members.length, members, me };
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
};

export { DEFAULT_GROUP_ID };
