import liff from '@line/liff';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

// ─── Types (mirroring 00-API-CONTRACT.md exactly) ────────────────────────────

export type DrinkType = 'water' | 'tea' | 'coffee' | 'juice' | 'other';

export interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface WaterRecord {
  id: string;
  lineUserId: string;
  displayName: string;
  ml: number;
  drinkType: DrinkType;
  date: string;
  timestamp: FirestoreTimestamp;
}

export interface WaterUser {
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  firstSeenAt: FirestoreTimestamp;
  lastSeenAt: FirestoreTimestamp;
  lastGroupId: string | null;
}

export interface WaterMember {
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  todayMl: number;
  weekMl: number;
  totalMl: number;
  streak: number;
  achievements: string[];
  lastDrinkAt: FirestoreTimestamp | null;
}

export interface LeaderboardRow {
  rank: number;
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  todayMl: number;
  streak: number;
  gapToAbove: number | null;
  leadOverSecond: number | null;
}

export type AchievementId =
  | 'first_drink'
  | '7_day_streak'
  | '30_day_streak'
  | 'hydration_master'
  | 'now_im_best'
  | 'now_im_worst';

export interface MeInfo {
  lineUserId: string;
  rank: number;
  todayMl: number;
  gapToAbove: number | null;
  leadOverSecond: number | null;
  aboveDisplayName: string | null;
}

export interface TodayResponse {
  groupName: string;
  memberCount: number;
  members: LeaderboardRow[];
  me: MeInfo;
}

export interface SessionResponse {
  isNewUser: boolean;
  user: WaterUser;
  member: WaterMember;
  today: TodayResponse;
}

export interface DrinkResponse {
  record: WaterRecord;
  member: WaterMember;
  rankBefore: number;
  rankAfter: number;
  surpassedCount: number;
  eventAchievements: AchievementId[];
  newPersistentAchievements: AchievementId[];
}

export interface MyProfileResponse {
  member: WaterMember;
  rank: number;
  gapToAbove: number | null;
  leadOverSecond: number | null;
  aboveDisplayName: string | null;
}

export interface WeeklyStatsResponse {
  dailyTotals: Array<{ date: string; totalMl: number }>;
  memberBreakdown: Array<{ lineUserId: string; displayName: string; weekMl: number }>;
}

export interface TauntsResponse {
  taunts: string[];
}

// ─── Real API ────────────────────────────────────────────────────────────────

async function liffRequest<T>(
  path: string,
  options: RequestInit = {},
  idToken: string
): Promise<T> {
  const doFetch = async (token: string): Promise<Response> =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

  let res = await doFetch(idToken);

  if (res.status === 401) {
    liff.login();
    const newToken = liff.getIDToken() ?? idToken;
    res = await doFetch(newToken);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Mock state ──────────────────────────────────────────────────────────────

const MOCK_USER_ID = 'Udev1234567890';
const NOW_TS: FirestoreTimestamp = { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 };

const mockMemberState = {
  todayMl: 500,
  weekMl: 2000,
  totalMl: 10000,
  streak: 3,
  achievements: ['first_drink'] as string[],
  drinkCount: 1,
};

const mockOthers: LeaderboardRow[] = [
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

function buildMockMember(): WaterMember {
  return {
    lineUserId: MOCK_USER_ID,
    displayName: 'Dev User',
    pictureUrl: '',
    todayMl: mockMemberState.todayMl,
    weekMl: mockMemberState.weekMl,
    totalMl: mockMemberState.totalMl,
    streak: mockMemberState.streak,
    achievements: [...mockMemberState.achievements],
    lastDrinkAt: NOW_TS,
  };
}

function buildMockLeaderboard(): { members: LeaderboardRow[]; me: MeInfo } {
  const myMl = mockMemberState.todayMl;
  const allRows: LeaderboardRow[] = [
    { rank: 0, lineUserId: MOCK_USER_ID, displayName: 'Dev User', pictureUrl: '', todayMl: myMl, streak: mockMemberState.streak, gapToAbove: null, leadOverSecond: null },
    ...mockOthers.map(o => ({ ...o })),
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

  const myRow = allRows.find(r => r.lineUserId === MOCK_USER_ID)!;
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

// ─── Mock adapter ─────────────────────────────────────────────────────────────

const mockApi = {
  session: async (_groupId: string, _groupName?: string): Promise<SessionResponse> => {
    await delay(300);
    const { members, me } = buildMockLeaderboard();
    return {
      isNewUser: false,
      user: {
        lineUserId: MOCK_USER_ID,
        displayName: 'Dev User',
        pictureUrl: '',
        firstSeenAt: NOW_TS,
        lastSeenAt: NOW_TS,
        lastGroupId: _groupId,
      },
      member: buildMockMember(),
      today: { groupName: _groupName ?? '開發測試群', memberCount: 3, members, me },
    };
  },

  drink: async (
    _groupId: string,
    ml: number,
    _drinkType: DrinkType
  ): Promise<DrinkResponse> => {
    await delay(400);
    const rankBefore = buildMockLeaderboard().me.rank;

    mockMemberState.todayMl += ml;
    mockMemberState.weekMl += ml;
    mockMemberState.totalMl += ml;
    mockMemberState.drinkCount += 1;

    const rankAfter = buildMockLeaderboard().me.rank;
    const surpassedCount = Math.max(0, rankBefore - rankAfter);

    const eventAchievements: AchievementId[] = [];
    if (rankAfter === 1) eventAchievements.push('now_im_best');
    else if (rankAfter === 3) eventAchievements.push('now_im_worst');

    const newPersistentAchievements: AchievementId[] = [];
    if (mockMemberState.drinkCount === 1 && !mockMemberState.achievements.includes('first_drink')) {
      newPersistentAchievements.push('first_drink');
      mockMemberState.achievements.push('first_drink');
    }
    if (mockMemberState.drinkCount >= 5 && !mockMemberState.achievements.includes('hydration_master')) {
      newPersistentAchievements.push('hydration_master');
      mockMemberState.achievements.push('hydration_master');
    }

    return {
      record: {
        id: `mock-${Date.now()}`,
        lineUserId: MOCK_USER_ID,
        displayName: 'Dev User',
        ml,
        drinkType: _drinkType,
        date: new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }).replace(/\//g, '-'),
        timestamp: NOW_TS,
      },
      member: buildMockMember(),
      rankBefore,
      rankAfter,
      surpassedCount,
      eventAchievements,
      newPersistentAchievements,
    };
  },

  todayLeaderboard: async (_groupId: string): Promise<TodayResponse> => {
    await delay(200);
    const { members, me } = buildMockLeaderboard();
    return { groupName: '開發測試群', memberCount: 3, members, me };
  },

  myProfile: async (_groupId: string): Promise<MyProfileResponse> => {
    await delay(200);
    const { me } = buildMockLeaderboard();
    return { member: buildMockMember(), rank: me.rank, gapToAbove: me.gapToAbove, leadOverSecond: me.leadOverSecond, aboveDisplayName: me.aboveDisplayName };
  },

  weeklyStats: async (_groupId: string): Promise<WeeklyStatsResponse> => {
    await delay(200);
    const today = new Date();
    const dailyTotals = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().slice(0, 10), totalMl: Math.floor(Math.random() * 2000) };
    });
    return {
      dailyTotals,
      memberBreakdown: [
        { lineUserId: MOCK_USER_ID, displayName: 'Dev User', weekMl: mockMemberState.weekMl },
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

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Real adapter ─────────────────────────────────────────────────────────────

const realApi = {
  session: (groupId: string, groupName?: string, idToken = '') =>
    liffRequest<SessionResponse>(
      '/api/water/session',
      { method: 'POST', body: JSON.stringify({ groupId, groupName }) },
      idToken
    ),

  drink: (groupId: string, ml: number, drinkType: DrinkType, idToken = '') =>
    liffRequest<DrinkResponse>(
      '/api/water/drink',
      { method: 'POST', body: JSON.stringify({ groupId, ml, drinkType }) },
      idToken
    ),

  todayLeaderboard: (groupId: string, idToken = '') =>
    liffRequest<TodayResponse>(`/api/water/group/${groupId}/today`, {}, idToken),

  myProfile: (groupId: string, idToken = '') =>
    liffRequest<MyProfileResponse>(`/api/water/group/${groupId}/me`, {}, idToken),

  weeklyStats: (groupId: string, idToken = '') =>
    liffRequest<WeeklyStatsResponse>(`/api/water/group/${groupId}/stats`, {}, idToken),

  taunts: (idToken = '') =>
    liffRequest<TauntsResponse>('/api/water/taunts', {}, idToken),
};

// ─── Exported waterApi ────────────────────────────────────────────────────────

export const waterApi = USE_MOCK
  ? {
      session: (groupId: string, groupName?: string, _idToken?: string) =>
        mockApi.session(groupId, groupName),
      drink: (groupId: string, ml: number, drinkType: DrinkType, _idToken?: string) =>
        mockApi.drink(groupId, ml, drinkType),
      todayLeaderboard: (groupId: string, _idToken?: string) =>
        mockApi.todayLeaderboard(groupId),
      myProfile: (groupId: string, _idToken?: string) =>
        mockApi.myProfile(groupId),
      weeklyStats: (groupId: string, _idToken?: string) =>
        mockApi.weeklyStats(groupId),
      taunts: (_idToken?: string) => mockApi.taunts(),
    }
  : {
      session: (groupId: string, groupName?: string, idToken?: string) =>
        realApi.session(groupId, groupName, idToken),
      drink: (groupId: string, ml: number, drinkType: DrinkType, idToken?: string) =>
        realApi.drink(groupId, ml, drinkType, idToken),
      todayLeaderboard: (groupId: string, idToken?: string) =>
        realApi.todayLeaderboard(groupId, idToken),
      myProfile: (groupId: string, idToken?: string) =>
        realApi.myProfile(groupId, idToken),
      weeklyStats: (groupId: string, idToken?: string) =>
        realApi.weeklyStats(groupId, idToken),
      taunts: (idToken?: string) => realApi.taunts(idToken),
    };
