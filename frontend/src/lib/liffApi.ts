import liff from '@line/liff';
import { getResponseErrorMessage } from './apiError';
import { mockWaterApi, type LiffWaterApiAdapter } from './liffMockPresets';

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
    throw new Error(await getResponseErrorMessage(res));
  }
  return res.json() as Promise<T>;
}

// ─── Real adapter ─────────────────────────────────────────────────────────────

const realApi: LiffWaterApiAdapter = {
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
  ? mockWaterApi
  : realApi;
