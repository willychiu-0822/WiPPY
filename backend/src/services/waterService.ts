import * as admin from 'firebase-admin';
import { format as formatDate, subDays, parseISO, differenceInCalendarDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Firestore, Timestamp } from 'firebase-admin/firestore';

const TZ = 'Asia/Taipei';
const WATER_USERS_COLLECTION = 'waterUsers';
const WATER_GROUPS_COLLECTION = 'waterGroups';
const WATER_USER_RECORDS_COLLECTION = 'records';
const WATER_USER_AGGREGATE_VERSION = 1;

export type DrinkType = 'water' | 'tea' | 'coffee' | 'juice' | 'other';

export type AchievementId =
  | 'first_drink'
  | '7_day_streak'
  | '30_day_streak'
  | 'hydration_master'
  | 'now_im_best'
  | 'now_im_worst'
  | 'daily_first';

export interface FirestoreTimestampJson {
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
  timestamp: FirestoreTimestampJson;
}

export interface WaterUser {
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  firstSeenAt: FirestoreTimestampJson;
  lastSeenAt: FirestoreTimestampJson;
  lastGroupId: string | null;
  groupIds: string[];
}

export interface WaterGroupSummary {
  groupId: string;
  groupName: string;
  alreadyBound: boolean;
  isEntryGroup: boolean;
}

export interface WaterSessionSelection {
  status: 'needs_group_selection';
  user: WaterUser | null;
  entryGroup: {
    groupId: string;
    groupName: string;
  };
  availableGroups: WaterGroupSummary[];
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
  lastDrinkAt: FirestoreTimestampJson | null;
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
  lastDrinkAt: FirestoreTimestampJson | null; // ★ BE-2
}

export interface LeaderboardMe {
  lineUserId: string;
  rank: number;
  todayMl: number;
  gapToAbove: number | null;
  leadOverSecond: number | null;
  aboveDisplayName: string | null;
  aboveLastDrinkAt: FirestoreTimestampJson | null; // ★ BE-3
  belowDisplayName: string | null;                 // ★ BE-3
}

export interface GroupGoal {                        // ★ BE-1 / M3
  todayMl: number;
  goalMl: number;
  goalReached: boolean;
  perMemberBaselineMl: number;
  firstLoggerDisplayName: string | null;           // ★ BE-8 / M6
}

export interface PulseItem {                        // ★ BE-4 / M2
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  ml: number;
  drinkType: DrinkType;
  timestamp: FirestoreTimestampJson;
  rankNow: number;
}

export interface TodayLeaderboardResponse {
  groupName: string;
  memberCount: number;
  members: LeaderboardRow[];
  me: LeaderboardMe;
  group: GroupGoal;   // ★ BE-1
  pulse: PulseItem[]; // ★ BE-4
}

export interface WeeklyStatsResponse {
  dailyTotals: Array<{ date: string; totalMl: number }>;
  memberBreakdown: Array<{ lineUserId: string; displayName: string; weekMl: number }>;
}

export interface WaterAdminMemberSummary {
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  todayMl: number;
  weekMl: number;
  totalMl: number;
  streak: number;
  rank: number;
  lastDrinkAt: FirestoreTimestampJson | null;
}

export interface LogDrinkResponse {
  record: WaterRecord;
  member: WaterMember;
  rankBefore: number;
  rankAfter: number;
  surpassedCount: number;
  eventAchievements: AchievementId[];
  newPersistentAchievements: AchievementId[];
  comboCount: number;            // ★ BE-5
  groupTodayMl: number;          // ★ BE-5
  groupGoalMl: number;           // ★ BE-5
  groupGoalJustReached: boolean; // ★ BE-5
  groupDrinkSequence: number;    // ★ BE-5
  belowDisplayName: string | null; // ★ BE-5
  isDailyFirst: boolean;         // ★ BE-8
}

export interface EnsureIdentityResponse {
  isNewUser: boolean;
  user: WaterUser;
  member: WaterMember;
}

export interface ResetTodayWaterResponse {
  member: WaterMember;
  removedMl: number;
  removedRecordCount: number;
}

export interface LiffUser {
  userId: string;
  displayName: string;
  pictureUrl: string;
}

interface WaterUserDoc {
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  firstSeenAt: Timestamp;
  lastSeenAt: Timestamp;
  lastGroupId: string | null;
  groupIds?: string[];
  totalMl?: number;
  streak?: number;
  achievements?: string[];
  lastDrinkAt?: Timestamp | null;
  aggregateVersion?: number;
}

interface WaterGroupDoc {
  groupName: string;
  memberCount: number;
  activeSince: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  perMemberBaselineMl?: number;      // ★ BE-1 optional per-group override
  lastGoalReachedDate?: string;      // ★ BE-5 de-dup M3 goal celebration (yyyy-MM-dd)
  firstLoggerDate?: string;          // ★ BE-8 M6 today's first logger date
  firstLoggerUserId?: string;        // ★ BE-8
  firstLoggerDisplayName?: string;   // ★ BE-8
  isEnabled?: boolean;
  enabledAt?: Timestamp;
}

interface WaterMemberDoc {
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  todayMl: number;
  todayDate: string;
  weekMl: number;
  totalMl: number;
  streak: number;
  achievements: string[];
  lastDrinkAt: Timestamp | null;
  joinedAt: Timestamp;
  updatedAt: Timestamp;
}

interface WaterRecordDoc {
  id: string;
  lineUserId: string;
  displayName: string;
  ml: number;
  drinkType: DrinkType;
  date: string;
  timestamp: Timestamp;
  createdAt: Timestamp;
}

interface WaterUserRecordDoc extends WaterRecordDoc {
  groupId: string;
  groupName: string;
}

interface MemberResetPatch {
  todayMl?: number;
  todayDate?: string;
  streak?: number;
}

interface NormalizedMember {
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  todayMl: number;
  todayDate: string;
  weekMl: number;
  totalMl: number;
  streak: number;
  achievements: string[];
  lastDrinkAt: Timestamp | null;
  joinedAt: Timestamp;
  updatedAt: Timestamp;
}

interface UserHistorySummary {
  totalMl: number;
  streak: number;
  achievements: string[];
  lastDrinkAt: Timestamp | null;
}

export const TAUNT_MESSAGES: string[] = [
  '水壺不是擺設，輪到你補水了。',
  '排行榜在等你，不要只用眼神喝水。',
  '再拖下去，你的細胞要開檢討會了。',
  '別人喝的是水，你喝的是空氣嗎？',
  '再來一杯，今天不要把墊底留給自己。',
  '你的名次可以落後，但水量別再裝忙。',
  '快補水，不然第一名要笑你一整天。',
  '嘴上說努力，水杯怎麼還是滿的？',
  '今天的逆轉就差你手上那一杯。',
  '喝水這題很簡單，先把水拿起來。',
];

export function getTaipeiDateString(now: Date = new Date()): string {
  return formatInTimeZone(now, TZ, 'yyyy-MM-dd');
}

function getWeekStartDateString(todayStr: string): string {
  return formatDate(subDays(parseISO(todayStr), 6), 'yyyy-MM-dd');
}

function listWeekDates(todayStr: string): string[] {
  const base = parseISO(todayStr);
  return Array.from({ length: 7 }, (_, index) =>
    formatDate(subDays(base, 6 - index), 'yyyy-MM-dd')
  );
}

function timestampToJson(timestamp: Timestamp): FirestoreTimestampJson {
  return {
    _seconds: timestamp.seconds,
    _nanoseconds: timestamp.nanoseconds,
  };
}

function serializeWaterUser(doc: WaterUserDoc): WaterUser {
  return {
    lineUserId: doc.lineUserId,
    displayName: doc.displayName,
    pictureUrl: doc.pictureUrl,
    firstSeenAt: timestampToJson(doc.firstSeenAt),
    lastSeenAt: timestampToJson(doc.lastSeenAt),
    lastGroupId: doc.lastGroupId,
    groupIds: [...new Set((doc.groupIds ?? []).filter((groupId): groupId is string => typeof groupId === 'string' && groupId.length > 0))],
  };
}

export class WaterGroupAccessError extends Error {
  constructor(
    public readonly code: 'water_group_not_enabled' | 'water_group_selection_required' | 'water_group_forbidden',
    message: string,
    public readonly status = 403
  ) {
    super(message);
    this.name = 'WaterGroupAccessError';
  }
}

function serializeWaterMember(doc: NormalizedMember): WaterMember {
  return {
    lineUserId: doc.lineUserId,
    displayName: doc.displayName,
    pictureUrl: doc.pictureUrl,
    todayMl: doc.todayMl,
    weekMl: doc.weekMl,
    totalMl: doc.totalMl,
    streak: doc.streak,
    achievements: [...doc.achievements],
    lastDrinkAt: doc.lastDrinkAt ? timestampToJson(doc.lastDrinkAt) : null,
  };
}

function serializeWaterAdminMemberSummary(doc: NormalizedMember, rank: number): WaterAdminMemberSummary {
  return {
    lineUserId: doc.lineUserId,
    displayName: doc.displayName,
    pictureUrl: doc.pictureUrl,
    todayMl: doc.todayMl,
    weekMl: doc.weekMl,
    totalMl: doc.totalMl,
    streak: doc.streak,
    rank,
    lastDrinkAt: doc.lastDrinkAt ? timestampToJson(doc.lastDrinkAt) : null,
  };
}

function serializeWaterRecord(doc: WaterRecordDoc): WaterRecord {
  return {
    id: doc.id,
    lineUserId: doc.lineUserId,
    displayName: doc.displayName,
    ml: doc.ml,
    drinkType: doc.drinkType,
    date: doc.date,
    timestamp: timestampToJson(doc.timestamp),
  };
}

function compareLeaderboardMembers(left: NormalizedMember, right: NormalizedMember): number {
  if (right.todayMl !== left.todayMl) {
    return right.todayMl - left.todayMl;
  }

  const leftTime = left.lastDrinkAt?.toMillis() ?? 0;
  const rightTime = right.lastDrinkAt?.toMillis() ?? 0;
  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }

  const nameCompare = left.displayName.localeCompare(right.displayName, 'zh-Hant');
  if (nameCompare !== 0) {
    return nameCompare;
  }

  return left.lineUserId.localeCompare(right.lineUserId);
}

function computeLeaderboardRows(members: NormalizedMember[]): LeaderboardRow[] {
  const sorted = [...members].sort(compareLeaderboardMembers);

  return sorted.map((member, index) => {
    const above = index > 0 ? sorted[index - 1] : null;
    const second = index === 0 ? sorted[1] ?? null : null;

    return {
      rank: index + 1,
      lineUserId: member.lineUserId,
      displayName: member.displayName,
      pictureUrl: member.pictureUrl,
      todayMl: member.todayMl,
      streak: member.streak,
      gapToAbove: above ? Math.max(0, above.todayMl - member.todayMl) : null,
      leadOverSecond: index === 0 ? Math.max(0, member.todayMl - (second?.todayMl ?? member.todayMl)) : null,
      lastDrinkAt: member.lastDrinkAt ? timestampToJson(member.lastDrinkAt) : null, // ★ BE-2
    };
  });
}

function buildMeRow(rows: LeaderboardRow[], userId: string): LeaderboardMe {
  const index = rows.findIndex((row) => row.lineUserId === userId);
  const me = rows[index];

  if (!me) {
    throw new Error(`Member ${userId} not found in leaderboard`);
  }

  return {
    lineUserId: me.lineUserId,
    rank: me.rank,
    todayMl: me.todayMl,
    gapToAbove: me.gapToAbove,
    leadOverSecond: me.leadOverSecond,
    aboveDisplayName: index > 0 ? rows[index - 1]?.displayName ?? null : null,
    aboveLastDrinkAt: index > 0 ? rows[index - 1]?.lastDrinkAt ?? null : null, // ★ BE-3
    belowDisplayName: rows[index + 1]?.displayName ?? null,                    // ★ BE-3
  };
}

function getRecordDate(timestamp: Timestamp): string {
  return formatInTimeZone(timestamp.toDate(), TZ, 'yyyy-MM-dd');
}

function buildMemberDoc(
  user: LiffUser,
  todayStr: string,
  now: Timestamp
): WaterMemberDoc {
  return {
    lineUserId: user.userId,
    displayName: user.displayName,
    pictureUrl: user.pictureUrl,
    todayMl: 0,
    todayDate: todayStr,
    weekMl: 0,
    totalMl: 0,
    streak: 0,
    achievements: [],
    lastDrinkAt: null,
    joinedAt: now,
    updatedAt: now,
  };
}

function normalizeMemberDoc(raw: WaterMemberDoc, overrides: Partial<WaterMemberDoc> = {}): NormalizedMember {
  return {
    lineUserId: overrides.lineUserId ?? raw.lineUserId,
    displayName: overrides.displayName ?? raw.displayName,
    pictureUrl: overrides.pictureUrl ?? raw.pictureUrl,
    todayMl: overrides.todayMl ?? raw.todayMl,
    todayDate: overrides.todayDate ?? raw.todayDate,
    weekMl: overrides.weekMl ?? raw.weekMl,
    totalMl: overrides.totalMl ?? raw.totalMl,
    streak: overrides.streak ?? raw.streak,
    achievements: [...(overrides.achievements ?? raw.achievements ?? [])],
    lastDrinkAt: overrides.lastDrinkAt === undefined ? raw.lastDrinkAt : overrides.lastDrinkAt,
    joinedAt: overrides.joinedAt ?? raw.joinedAt,
    updatedAt: overrides.updatedAt ?? raw.updatedAt,
  };
}

function mapByUser(records: WaterRecordDoc[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const record of records) {
    totals.set(record.lineUserId, (totals.get(record.lineUserId) ?? 0) + record.ml);
  }

  return totals;
}

function buildRecentRecordsQuery(
  recordsRef: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>,
  startDate: string,
  endDate: string
) {
  return recordsRef
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .orderBy('date', 'asc')
    .orderBy('timestamp', 'desc');
}

function toWaterRecordDoc(snapshot: FirebaseFirestore.QueryDocumentSnapshot): WaterRecordDoc {
  return snapshot.data() as WaterRecordDoc;
}

function toWaterUserRecordDoc(snapshot: FirebaseFirestore.QueryDocumentSnapshot): WaterUserRecordDoc {
  return snapshot.data() as WaterUserRecordDoc;
}

function toWaterMemberDoc(snapshot: FirebaseFirestore.QueryDocumentSnapshot): WaterMemberDoc {
  return snapshot.data() as WaterMemberDoc;
}

function toWaterGroupDoc(snapshot: FirebaseFirestore.DocumentSnapshot): WaterGroupDoc | null {
  if (!snapshot.exists) {
    return null;
  }
  return snapshot.data() as WaterGroupDoc;
}

export function resetDayIfNeeded(memberData: Pick<WaterMemberDoc, 'todayDate' | 'todayMl' | 'streak' | 'lastDrinkAt'>, todayStr: string): MemberResetPatch {
  if (memberData.todayDate === todayStr) {
    return {};
  }

  const lastDrinkDate = memberData.lastDrinkAt ? getRecordDate(memberData.lastDrinkAt) : null;
  const dayDiff = lastDrinkDate ? differenceInCalendarDays(parseISO(todayStr), parseISO(lastDrinkDate)) : null;

  return {
    todayMl: 0,
    todayDate: todayStr,
    streak: dayDiff === 1 ? memberData.streak : 0,
  };
}

function computeStreakAfterDrink(member: NormalizedMember, todayStr: string): number {
  if (!member.lastDrinkAt) {
    return 1;
  }

  const lastDrinkDate = getRecordDate(member.lastDrinkAt);
  const dayDiff = differenceInCalendarDays(parseISO(todayStr), parseISO(lastDrinkDate));

  if (dayDiff <= 0) {
    return Math.max(member.streak, 1);
  }

  if (dayDiff === 1) {
    return Math.max(member.streak, 0) + 1;
  }

  return 1;
}

function maybeUnlockPersistentAchievement(
  achievements: string[],
  unlocked: AchievementId[],
  achievementId: AchievementId,
  shouldUnlock: boolean
): string[] {
  if (!shouldUnlock || achievements.includes(achievementId)) {
    return achievements;
  }

  unlocked.push(achievementId);
  return [...achievements, achievementId];
}

async function loadWaterUser(db: Firestore, userId: string): Promise<WaterUserDoc> {
  const snapshot = await db.collection(WATER_USERS_COLLECTION).doc(userId).get();
  if (!snapshot.exists) {
    throw new Error(`Water user ${userId} not found`);
  }

  return snapshot.data() as WaterUserDoc;
}

function buildUserRecordsQuery(
  userRecordsRef: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>,
  startDate: string,
  endDate: string
) {
  return userRecordsRef
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .orderBy('date', 'asc')
    .orderBy('timestamp', 'desc');
}

function computePersistentAchievementsFromRecords(records: WaterUserRecordDoc[], todayStr: string): string[] {
  if (records.length === 0) {
    return [];
  }

  const byDateCount = new Map<string, number>();
  for (const record of records) {
    byDateCount.set(record.date, (byDateCount.get(record.date) ?? 0) + 1);
  }

  const dates = [...new Set(records.map((record) => record.date))].sort();
  let maxStreak = 0;
  let run = 0;
  let previousDate: string | null = null;
  for (const date of dates) {
    if (!previousDate) {
      run = 1;
    } else {
      const diff = differenceInCalendarDays(parseISO(date), parseISO(previousDate));
      run = diff === 1 ? run + 1 : 1;
    }
    previousDate = date;
    maxStreak = Math.max(maxStreak, run);
  }

  const achievements: AchievementId[] = ['first_drink'];
  if ([...byDateCount.values()].some((count) => count >= 5)) {
    achievements.push('hydration_master');
  }
  if (maxStreak >= 7) {
    achievements.push('7_day_streak');
  }
  if (maxStreak >= 30) {
    achievements.push('30_day_streak');
  }

  return achievements.filter((id, index, list) => list.indexOf(id) === index);
}

function summarizeUserHistory(records: WaterUserRecordDoc[], todayStr: string): UserHistorySummary {
  if (records.length === 0) {
    return {
      totalMl: 0,
      streak: 0,
      achievements: [],
      lastDrinkAt: null,
    };
  }

  const totalMl = records.reduce((sum, record) => sum + record.ml, 0);
  const sortedDates = [...new Set(records.map((record) => record.date))].sort((left, right) =>
    left.localeCompare(right, 'en')
  );
  const lastRecord = records.reduce((latest, record) =>
    !latest || record.timestamp.toMillis() > latest.timestamp.toMillis() ? record : latest
  , null as WaterUserRecordDoc | null);

  let streak = 0;
  let cursorDate = lastRecord?.date ?? null;
  const dateSet = new Set(sortedDates);
  while (cursorDate && dateSet.has(cursorDate)) {
    streak += 1;
    cursorDate = formatDate(subDays(parseISO(cursorDate), 1), 'yyyy-MM-dd');
  }

  const lastDrinkDate = lastRecord?.date ?? null;
  if (lastDrinkDate) {
    const dayDiff = differenceInCalendarDays(parseISO(todayStr), parseISO(lastDrinkDate));
    if (dayDiff > 1) {
      streak = 0;
    }
  }

  return {
    totalMl,
    streak,
    achievements: computePersistentAchievementsFromRecords(records, todayStr),
    lastDrinkAt: lastRecord?.timestamp ?? null,
  };
}

async function ensureUserHistoryReady(db: Firestore, userId: string): Promise<void> {
  const userRef = db.collection(WATER_USERS_COLLECTION).doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return;
  }

  const userDoc = userSnap.data() as WaterUserDoc;
  if (userDoc.aggregateVersion === WATER_USER_AGGREGATE_VERSION) {
    return;
  }

  const groupRecordSnap = await db.collectionGroup('records').where('lineUserId', '==', userId).get();
  const userRecordsRef = userRef.collection(WATER_USER_RECORDS_COLLECTION);
  const batch = db.batch();
  const mirroredRecords: WaterUserRecordDoc[] = [];

  for (const doc of groupRecordSnap.docs) {
    if (doc.ref.parent.parent?.parent?.id !== WATER_GROUPS_COLLECTION) {
      continue;
    }
    const record = toWaterRecordDoc(doc);
    const groupId = doc.ref.parent.parent?.id ?? '';
    if (!groupId) {
      continue;
    }

    const userRecord: WaterUserRecordDoc = {
      ...record,
      groupId,
      groupName: '',
    };
    mirroredRecords.push(userRecord);
    batch.set(userRecordsRef.doc(record.id), userRecord, { merge: true });
  }

  const summary = summarizeUserHistory(mirroredRecords, getTaipeiDateString());
  batch.set(userRef, {
    totalMl: summary.totalMl,
    streak: summary.streak,
    achievements: summary.achievements,
    lastDrinkAt: summary.lastDrinkAt,
    aggregateVersion: WATER_USER_AGGREGATE_VERSION,
  } satisfies Partial<WaterUserDoc>, { merge: true });

  await batch.commit();
}

async function refreshMembersForToday(db: Firestore, groupId: string, todayStr: string): Promise<NormalizedMember[]> {
  const membersRef = db.collection(WATER_GROUPS_COLLECTION).doc(groupId).collection('members');
  const recordsRef = db.collection(WATER_GROUPS_COLLECTION).doc(groupId).collection('records');
  const weekStart = getWeekStartDateString(todayStr);
  const [membersSnap, recordsSnap] = await Promise.all([
    membersRef.get(),
    buildRecentRecordsQuery(recordsRef, weekStart, todayStr).get(),
  ]);

  const records = recordsSnap.docs.map(toWaterRecordDoc);
  const weekTotals = mapByUser(records);
  const todayTotals = mapByUser(records.filter((record) => record.date === todayStr));
  const batch = db.batch();
  const now = admin.firestore.Timestamp.now();
  let hasWrites = false;

  const members = membersSnap.docs.map((doc) => {
    const raw = toWaterMemberDoc(doc);
    const resetPatch = resetDayIfNeeded(raw, todayStr);
    const weekMl = weekTotals.get(doc.id) ?? 0;
    const todayMl = todayTotals.get(doc.id) ?? resetPatch.todayMl ?? raw.todayMl;
    const normalized = normalizeMemberDoc(raw, {
      ...resetPatch,
      todayMl,
      weekMl,
      lineUserId: raw.lineUserId || doc.id,
    });

    const shouldUpdateWeekMl = raw.weekMl !== weekMl;
    const shouldUpdateTodayMl = raw.todayMl !== todayMl;
    const shouldApplyReset = Object.keys(resetPatch).length > 0;

    if (shouldApplyReset || shouldUpdateWeekMl || shouldUpdateTodayMl || raw.displayName !== normalized.displayName || raw.pictureUrl !== normalized.pictureUrl) {
      batch.set(
        doc.ref,
        {
          ...resetPatch,
          todayMl,
          weekMl,
          updatedAt: now,
        },
        { merge: true }
      );
      hasWrites = true;
    }

    return normalized;
  });

  if (hasWrites) {
    await batch.commit();
  }

  return members;
}

async function loadNormalizedMember(db: Firestore, groupId: string, userId: string, todayStr: string): Promise<NormalizedMember> {
  const members = await refreshMembersForToday(db, groupId, todayStr);
  const member = members.find((item) => item.lineUserId === userId);

  if (!member) {
    throw new Error(`Water member ${userId} not found in group ${groupId}`);
  }

  return member;
}

// LINE group/room ids look like "C" or "R" followed by 32 hex chars. Anything
// else (notably the ephemeral UUIDs liff.getContext() can hand back) is rejected
// so we never partition water data on a value that changes every launch.
const LINE_GROUP_ID_PATTERN = /^[CR][0-9a-f]{32}$/i;

export function isValidLineGroupId(groupId?: string | null): boolean {
  return typeof groupId === 'string' && LINE_GROUP_ID_PATTERN.test(groupId.trim());
}

export async function ensureGroup(db: Firestore, groupId: string, groupName?: string): Promise<void> {
  const now = admin.firestore.Timestamp.now();
  const groupRef = db.collection(WATER_GROUPS_COLLECTION).doc(groupId);
  const snapshot = await groupRef.get();
  const group = toWaterGroupDoc(snapshot);

  await groupRef.set(
    {
      groupName: groupName ?? group?.groupName ?? '',
      memberCount: group?.memberCount ?? 0,
      activeSince: group?.activeSince ?? now,
      createdAt: group?.createdAt ?? now,
      updatedAt: now,
      isEnabled: group?.isEnabled ?? false,
      enabledAt: group?.enabledAt,
    } satisfies WaterGroupDoc,
    { merge: true }
  );
}

function normalizeGroupIdList(groupIds: Array<string | null | undefined>): string[] {
  return [...new Set(groupIds
    .map((groupId) => typeof groupId === 'string' ? groupId.trim() : '')
    .filter((groupId): groupId is string => groupId.length > 0))];
}

async function loadWaterUserDocOrNull(db: Firestore, userId: string): Promise<WaterUserDoc | null> {
  const snapshot = await db.collection(WATER_USERS_COLLECTION).doc(userId).get();
  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as WaterUserDoc;
}

async function loadEnabledWaterGroupOrThrow(
  db: Firestore,
  groupId: string,
  fallbackName?: string
): Promise<{ groupId: string; groupName: string }> {
  if (!isValidLineGroupId(groupId)) {
    throw new WaterGroupAccessError('water_group_not_enabled', '此喝水入口未開通，請聯絡管理員。');
  }

  const snapshot = await db.collection(WATER_GROUPS_COLLECTION).doc(groupId).get();
  const group = toWaterGroupDoc(snapshot);
  if (!group?.isEnabled) {
    throw new WaterGroupAccessError('water_group_not_enabled', '此喝水入口未開通，請聯絡管理員。');
  }

  return {
    groupId,
    groupName: fallbackName?.trim() || group.groupName || groupId,
  };
}

async function listBoundGroupIds(db: Firestore, userId: string, userDoc?: WaterUserDoc | null): Promise<string[]> {
  const stored = normalizeGroupIdList(userDoc?.groupIds ?? []);
  if (stored.length > 0) {
    return stored;
  }

  const snapshot = await db.collectionGroup('members').where('lineUserId', '==', userId).get();
  return normalizeGroupIdList(snapshot.docs
    .map((doc) => doc.ref.parent.parent?.id ?? null));
}

async function loadSelectableGroups(
  db: Firestore,
  groupIds: string[],
  boundGroupIds: string[],
  entryGroupId: string
): Promise<WaterGroupSummary[]> {
  const uniqueGroupIds = normalizeGroupIdList(groupIds);
  const boundSet = new Set(normalizeGroupIdList(boundGroupIds));
  const groups = await Promise.all(uniqueGroupIds.map(async (groupId) => {
    const snapshot = await db.collection(WATER_GROUPS_COLLECTION).doc(groupId).get();
    const group = toWaterGroupDoc(snapshot);
    if (!group?.isEnabled) {
      return null;
    }

    return {
      groupId,
      groupName: group.groupName || groupId,
      alreadyBound: boundSet.has(groupId),
      isEntryGroup: groupId === entryGroupId,
    } satisfies WaterGroupSummary;
  }));

  return groups
    .filter((group): group is WaterGroupSummary => Boolean(group))
    .sort((left, right) => {
      if (left.isEntryGroup !== right.isEntryGroup) {
        return left.isEntryGroup ? -1 : 1;
      }
      return left.groupName.localeCompare(right.groupName, 'zh-Hant');
    });
}

export async function resolveWaterSession(
  db: Firestore,
  userId: string,
  input: {
    entryGroupId?: string | null;
    entryGroupName?: string;
    selectedGroupId?: string | null;
  }
): Promise<{ groupId: string; groupName: string } | WaterSessionSelection> {
  const entryGroupId = input.entryGroupId?.trim();
  if (!entryGroupId) {
    throw new WaterGroupAccessError('water_group_not_enabled', '缺少群組入口資訊，請使用群組專屬 LIFF 連結。');
  }

  const entryGroup = await loadEnabledWaterGroupOrThrow(db, entryGroupId, input.entryGroupName);
  const userDoc = await loadWaterUserDocOrNull(db, userId);
  const boundGroupIds = await listBoundGroupIds(db, userId, userDoc);
  const selectableGroups = await loadSelectableGroups(
    db,
    normalizeGroupIdList([...boundGroupIds, entryGroup.groupId]),
    boundGroupIds,
    entryGroup.groupId
  );

  const selectedGroupId = input.selectedGroupId?.trim();
  if (selectedGroupId) {
    const selected = selectableGroups.find((group) => group.groupId === selectedGroupId);
    if (!selected) {
      throw new WaterGroupAccessError('water_group_forbidden', '選擇的群組不可用。');
    }
    return {
      groupId: selected.groupId,
      groupName: selected.groupName,
    };
  }

  if (boundGroupIds.length === 0) {
    return entryGroup;
  }

  if (boundGroupIds.length === 1) {
    if (boundGroupIds[0] === entryGroup.groupId) {
      return entryGroup;
    }

    return entryGroup;
  }

  return {
    status: 'needs_group_selection',
    user: userDoc ? serializeWaterUser(userDoc) : null,
    entryGroup,
    availableGroups: selectableGroups,
  };
}

export async function assertUserCanAccessWaterGroup(
  db: Firestore,
  userId: string,
  groupId?: string | null
): Promise<string> {
  const requestedGroupId = groupId?.trim();
  if (!requestedGroupId) {
    throw new WaterGroupAccessError('water_group_forbidden', '缺少群組資訊。');
  }

  const group = await loadEnabledWaterGroupOrThrow(db, requestedGroupId);
  const userDoc = await loadWaterUserDocOrNull(db, userId);
  const boundGroupIds = await listBoundGroupIds(db, userId, userDoc);
  if (!boundGroupIds.includes(group.groupId)) {
    throw new WaterGroupAccessError('water_group_forbidden', '你尚未加入這個喝水群組。');
  }

  return group.groupId;
}

export async function setWaterGroupEnabled(
  db: Firestore,
  groupId: string,
  input: { enabled: boolean; groupName?: string }
): Promise<{ groupId: string; groupName: string; isEnabled: boolean }> {
  await ensureGroup(db, groupId, input.groupName);

  const now = admin.firestore.Timestamp.now();
  const groupRef = db.collection(WATER_GROUPS_COLLECTION).doc(groupId);
  const snapshot = await groupRef.get();
  const existing = toWaterGroupDoc(snapshot);

  await groupRef.set({
    isEnabled: input.enabled,
    enabledAt: input.enabled ? (existing?.enabledAt ?? now) : existing?.enabledAt,
    groupName: input.groupName?.trim() || existing?.groupName || '',
    updatedAt: now,
  } satisfies Partial<WaterGroupDoc>, { merge: true });

  return {
    groupId,
    groupName: input.groupName?.trim() || existing?.groupName || groupId,
    isEnabled: input.enabled,
  };
}

export async function ensureIdentity(
  db: Firestore,
  group: { groupId: string; groupName?: string },
  user: LiffUser
): Promise<EnsureIdentityResponse> {
  const now = admin.firestore.Timestamp.now();
  const todayStr = getTaipeiDateString();
  const userRef = db.collection(WATER_USERS_COLLECTION).doc(user.userId);
  const groupRef = db.collection(WATER_GROUPS_COLLECTION).doc(group.groupId);
  const memberRef = groupRef.collection('members').doc(user.userId);

  const isNewUser = await db.runTransaction(async (transaction) => {
    const [userSnap, groupSnap, memberSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(groupRef),
      transaction.get(memberRef),
    ]);

    const existingGroup = toWaterGroupDoc(groupSnap);
    const existingUser = userSnap.exists ? (userSnap.data() as WaterUserDoc) : null;
    const existingMember = memberSnap.exists ? (memberSnap.data() as WaterMemberDoc) : null;
    const resetPatch = existingMember ? resetDayIfNeeded(existingMember, todayStr) : {};
    const nextMemberCount = (existingGroup?.memberCount ?? 0) + (memberSnap.exists ? 0 : 1);
    const nextGroupIds = normalizeGroupIdList([...(existingUser?.groupIds ?? []), group.groupId]);

    transaction.set(
      userRef,
      {
        lineUserId: user.userId,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        firstSeenAt: existingUser?.firstSeenAt ?? now,
        lastSeenAt: now,
        lastGroupId: group.groupId,
        groupIds: nextGroupIds,
        totalMl: existingUser?.totalMl ?? 0,
        streak: existingUser?.streak ?? 0,
        achievements: existingUser?.achievements ?? [],
        lastDrinkAt: existingUser?.lastDrinkAt ?? null,
        aggregateVersion: existingUser?.aggregateVersion ?? 0,
      } satisfies WaterUserDoc,
      { merge: true }
    );

    transaction.set(
      groupRef,
      {
        groupName: group.groupName ?? existingGroup?.groupName ?? '',
        memberCount: nextMemberCount,
        activeSince: existingGroup?.activeSince ?? now,
        createdAt: existingGroup?.createdAt ?? now,
        updatedAt: now,
      } satisfies WaterGroupDoc,
      { merge: true }
    );

    if (!existingMember) {
      transaction.set(memberRef, buildMemberDoc(user, todayStr, now));
    } else {
      transaction.set(
        memberRef,
        {
          lineUserId: user.userId,
          displayName: user.displayName,
          pictureUrl: user.pictureUrl,
          ...resetPatch,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    return !userSnap.exists;
  });

  await ensureUserHistoryReady(db, user.userId);

  const [userDoc, memberDoc] = await Promise.all([
    loadWaterUser(db, user.userId),
    loadNormalizedMember(db, group.groupId, user.userId, todayStr),
  ]);

  return {
    isNewUser,
    user: serializeWaterUser(userDoc),
    member: serializeWaterMember(memberDoc),
  };
}

export async function logDrink(
  db: Firestore,
  groupId: string,
  user: LiffUser,
  input: { ml: number; drinkType: DrinkType; groupName?: string }
): Promise<LogDrinkResponse> {
  await ensureIdentity(db, { groupId, groupName: input.groupName }, user);

  const todayStr = getTaipeiDateString();
  const weekStart = getWeekStartDateString(todayStr);
  const userRef = db.collection(WATER_USERS_COLLECTION).doc(user.userId);
  const userRecordsRef = userRef.collection(WATER_USER_RECORDS_COLLECTION);
  const groupRef = db.collection(WATER_GROUPS_COLLECTION).doc(groupId);
  const memberRef = groupRef.collection('members').doc(user.userId);
  const membersRef = groupRef.collection('members');
  const recordsRef = groupRef.collection('records');

  return db.runTransaction(async (transaction) => {
    const now = admin.firestore.Timestamp.now();
    const [userSnap, userTodayRecordsSnap, groupSnap, memberSnap, membersSnap, weekRecordsSnap, todayRecordsSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(buildUserRecordsQuery(userRecordsRef, todayStr, todayStr)),
      transaction.get(groupRef),
      transaction.get(memberRef),
      transaction.get(membersRef),
      transaction.get(buildRecentRecordsQuery(recordsRef, weekStart, todayStr)),
      transaction.get(buildRecentRecordsQuery(recordsRef, todayStr, todayStr)),
    ]);
    const userDoc = userSnap.data() as WaterUserDoc | undefined;
    const groupDoc = toWaterGroupDoc(groupSnap as Parameters<typeof toWaterGroupDoc>[0]);

    if (!memberSnap.exists) {
      throw new Error(`Water member ${user.userId} not found`);
    }
    if (!userDoc) {
      throw new Error(`Water user ${user.userId} not found`);
    }

    const weekRecords = weekRecordsSnap.docs.map(toWaterRecordDoc);
    const todayRecords = todayRecordsSnap.docs.map(toWaterRecordDoc);
    const weekTotals = mapByUser(weekRecords);
    const todayTotals = mapByUser(todayRecords);
    const userTodayRecords = userTodayRecordsSnap.docs.map(toWaterUserRecordDoc);

    const normalizedMembers = membersSnap.docs.map((doc) => {
      const raw = toWaterMemberDoc(doc);
      const resetPatch = resetDayIfNeeded(raw, todayStr);
      const todayMl = todayTotals.get(doc.id) ?? resetPatch.todayMl ?? raw.todayMl;
      const normalized = normalizeMemberDoc(raw, {
        ...resetPatch,
        todayMl,
        weekMl: weekTotals.get(doc.id) ?? 0,
        lineUserId: raw.lineUserId || doc.id,
      });

      if (Object.keys(resetPatch).length > 0 || raw.weekMl !== normalized.weekMl || raw.todayMl !== normalized.todayMl) {
        transaction.set(
          doc.ref,
          {
            ...resetPatch,
            todayMl: normalized.todayMl,
            weekMl: normalized.weekMl,
            updatedAt: now,
          },
          { merge: true }
        );
      }

      return normalized;
    });

    const currentMember = normalizedMembers.find((member) => member.lineUserId === user.userId);
    if (!currentMember) {
      throw new Error(`Water member ${user.userId} not found`);
    }

    const beforeRows = computeLeaderboardRows(normalizedMembers);
    const beforeMe = buildMeRow(beforeRows, user.userId);

    const todayUserRecords = todayRecords.filter((record) => record.lineUserId === user.userId);
    const newTodayDrinkCount = todayUserRecords.length + 1;
    const nextWeekMl = (weekTotals.get(user.userId) ?? 0) + input.ml;
    const nextStreak = computeStreakAfterDrink(currentMember, todayStr);
    const nextUserTodayDrinkCount = userTodayRecords.length + 1;
    const nextUserStreak = computeStreakAfterDrink({
      lineUserId: user.userId,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
      todayMl: 0,
      todayDate: todayStr,
      weekMl: 0,
      totalMl: userDoc.totalMl ?? 0,
      streak: userDoc.streak ?? 0,
      achievements: userDoc.achievements ?? [],
      lastDrinkAt: userDoc.lastDrinkAt ?? null,
      joinedAt: userDoc.firstSeenAt,
      updatedAt: userDoc.lastSeenAt,
    }, todayStr);

    const newPersistentAchievements: AchievementId[] = [];
    let nextAchievements = [...currentMember.achievements];
    nextAchievements = maybeUnlockPersistentAchievement(
      nextAchievements,
      newPersistentAchievements,
      'first_drink',
      newTodayDrinkCount === 1
    );
    nextAchievements = maybeUnlockPersistentAchievement(
      nextAchievements,
      newPersistentAchievements,
      'hydration_master',
      newTodayDrinkCount >= 5
    );
    nextAchievements = maybeUnlockPersistentAchievement(
      nextAchievements,
      newPersistentAchievements,
      '7_day_streak',
      nextStreak >= 7
    );
    nextAchievements = maybeUnlockPersistentAchievement(
      nextAchievements,
      newPersistentAchievements,
      '30_day_streak',
      nextStreak >= 30
    );

    const userUnlocked: AchievementId[] = [];
    let nextUserAchievements = [...(userDoc.achievements ?? [])];
    nextUserAchievements = maybeUnlockPersistentAchievement(
      nextUserAchievements,
      userUnlocked,
      'first_drink',
      (userDoc.totalMl ?? 0) === 0
    );
    nextUserAchievements = maybeUnlockPersistentAchievement(
      nextUserAchievements,
      userUnlocked,
      'hydration_master',
      nextUserTodayDrinkCount >= 5
    );
    nextUserAchievements = maybeUnlockPersistentAchievement(
      nextUserAchievements,
      userUnlocked,
      '7_day_streak',
      nextUserStreak >= 7
    );
    nextUserAchievements = maybeUnlockPersistentAchievement(
      nextUserAchievements,
      userUnlocked,
      '30_day_streak',
      nextUserStreak >= 30
    );

    const updatedMember = normalizeMemberDoc(currentMember, {
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
      todayMl: currentMember.todayMl + input.ml,
      todayDate: todayStr,
      weekMl: nextWeekMl,
      totalMl: currentMember.totalMl + input.ml,
      streak: nextStreak,
      achievements: nextAchievements,
      lastDrinkAt: now,
      updatedAt: now,
    });

    transaction.set(
      memberRef,
      {
        lineUserId: user.userId,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        todayMl: updatedMember.todayMl,
        todayDate: todayStr,
        weekMl: updatedMember.weekMl,
        totalMl: updatedMember.totalMl,
        streak: updatedMember.streak,
        achievements: updatedMember.achievements,
        lastDrinkAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    const recordRef = recordsRef.doc();
    const recordDoc: WaterRecordDoc = {
      id: recordRef.id,
      lineUserId: user.userId,
      displayName: user.displayName,
      ml: input.ml,
      drinkType: input.drinkType,
      date: todayStr,
      timestamp: now,
      createdAt: now,
    };
    transaction.set(recordRef, recordDoc);
    transaction.set(userRecordsRef.doc(recordDoc.id), {
      ...recordDoc,
      groupId,
      groupName: input.groupName ?? groupDoc?.groupName ?? '',
    } satisfies WaterUserRecordDoc);
    transaction.set(userRef, {
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
      lastSeenAt: now,
      lastGroupId: groupId,
      groupIds: normalizeGroupIdList([...(userDoc.groupIds ?? []), groupId]),
      totalMl: (userDoc.totalMl ?? 0) + input.ml,
      streak: nextUserStreak,
      achievements: nextUserAchievements,
      lastDrinkAt: now,
      aggregateVersion: WATER_USER_AGGREGATE_VERSION,
    } satisfies Partial<WaterUserDoc>, { merge: true });

    const afterMembers = normalizedMembers.map((member) =>
      member.lineUserId === user.userId ? updatedMember : member
    );
    const afterRows = computeLeaderboardRows(afterMembers);
    const afterMe = buildMeRow(afterRows, user.userId);
    const eventAchievements: AchievementId[] = [];

    if (afterMe.rank < beforeMe.rank || (beforeMe.rank === 1 && afterMe.rank === 1)) {
      eventAchievements.push('now_im_best');
    }

    if (afterMe.rank === afterRows.length && afterRows.length >= 2) {
      eventAchievements.push('now_im_worst');
    }

    // ─── BE-5: New gamification fields ────────────────────────────────────────

    const baseline = getPerMemberBaseline(groupDoc);

    // comboCount: records by this user in the past 90 min + 1 (this drink)
    const ninetyMinAgoMs = now.toMillis() - 90 * 60 * 1000;
    const comboCount =
      todayUserRecords.filter((r) => r.timestamp.toMillis() >= ninetyMinAgoMs).length + 1;

    // group totals before and after this drink
    const beforeGroupTodayMl = normalizedMembers.reduce((sum, m) => sum + m.todayMl, 0);
    const groupTodayMl = afterMembers.reduce((sum, m) => sum + m.todayMl, 0);
    const groupGoalMl = afterMembers.length * baseline;

    // groupDrinkSequence: position of this drink in today's group log
    const groupDrinkSequence = todayRecordsSnap.docs.length + 1;

    // groupGoalJustReached: first time today that the group crossed the goal
    const groupGoalJustReached =
      beforeGroupTodayMl < groupGoalMl &&
      groupTodayMl >= groupGoalMl &&
      (groupDoc?.lastGoalReachedDate ?? '') !== todayStr;

    if (groupGoalJustReached) {
      transaction.set(groupRef, { lastGoalReachedDate: todayStr, updatedAt: now }, { merge: true });
    }

    // belowDisplayName: the member ranked just below me after this drink
    const belowDisplayName = afterRows[afterMe.rank]?.displayName ?? null;

    // ─── BE-8: M6 daily first logger ──────────────────────────────────────────

    const isDailyFirst =
      groupDrinkSequence === 1 && (groupDoc?.firstLoggerDate ?? '') !== todayStr;

    if (isDailyFirst) {
      transaction.set(
        groupRef,
        {
          firstLoggerDate: todayStr,
          firstLoggerUserId: user.userId,
          firstLoggerDisplayName: user.displayName,
          updatedAt: now,
        },
        { merge: true }
      );
      eventAchievements.push('daily_first');
    }

    return {
      record: serializeWaterRecord(recordDoc),
      member: serializeWaterMember(updatedMember),
      rankBefore: beforeMe.rank,
      rankAfter: afterMe.rank,
      surpassedCount: Math.max(0, beforeMe.rank - afterMe.rank),
      eventAchievements,
      newPersistentAchievements,
      comboCount,
      groupTodayMl,
      groupGoalMl,
      groupGoalJustReached,
      groupDrinkSequence,
      belowDisplayName,
      isDailyFirst,
    };
  });
}

// ─── BE-1: Group goal ────────────────────────────────────────────────────────

function getPerMemberBaseline(group?: WaterGroupDoc | null): number {
  return group?.perMemberBaselineMl ?? (Number(process.env['WATER_PER_MEMBER_GOAL_ML']) || 1500);
}

function computeGroupGoal(
  members: NormalizedMember[],
  baseline: number,
  group: WaterGroupDoc | null,
  todayStr: string
): GroupGoal {
  const todayMl = members.reduce((sum, m) => sum + m.todayMl, 0);
  const goalMl = members.length * baseline;
  return {
    todayMl,
    goalMl,
    goalReached: todayMl >= goalMl,
    perMemberBaselineMl: baseline,
    firstLoggerDisplayName:
      group?.firstLoggerDate === todayStr ? (group.firstLoggerDisplayName ?? null) : null,
  };
}

// ─── BE-4: Pulse ─────────────────────────────────────────────────────────────

async function getRecentPulse(
  db: Firestore,
  groupId: string,
  limit: number,
  todayStr: string,
  rows: LeaderboardRow[]
): Promise<PulseItem[]> {
  const recordsRef = db.collection(WATER_GROUPS_COLLECTION).doc(groupId).collection('records');
  const snap = await recordsRef
    .where('date', '==', todayStr)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  const rankMap = new Map(rows.map((r) => [r.lineUserId, r.rank]));
  const pictureMap = new Map(rows.map((r) => [r.lineUserId, r.pictureUrl]));

  return snap.docs.map((doc) => {
    const record = toWaterRecordDoc(doc);
    return {
      lineUserId: record.lineUserId,
      displayName: record.displayName,
      pictureUrl: pictureMap.get(record.lineUserId) ?? '',
      ml: record.ml,
      drinkType: record.drinkType,
      timestamp: timestampToJson(record.timestamp),
      rankNow: rankMap.get(record.lineUserId) ?? 0,
    };
  });
}

export async function getTodayLeaderboard(
  db: Firestore,
  groupId: string,
  lineUserId: string
): Promise<TodayLeaderboardResponse> {
  const todayStr = getTaipeiDateString();
  const pulseLimit = Number(process.env['WATER_PULSE_DEFAULT_LIMIT']) || 20;
  const groupRef = db.collection(WATER_GROUPS_COLLECTION).doc(groupId);
  const [groupSnap, members] = await Promise.all([
    groupRef.get(),
    refreshMembersForToday(db, groupId, todayStr),
  ]);

  const groupDoc = toWaterGroupDoc(groupSnap);
  const rows = computeLeaderboardRows(members);
  const baseline = getPerMemberBaseline(groupDoc);
  const pulse = await getRecentPulse(db, groupId, pulseLimit, todayStr, rows);

  return {
    groupName: groupDoc?.groupName ?? '',
    memberCount: rows.length,
    members: rows,
    me: buildMeRow(rows, lineUserId),
    group: computeGroupGoal(members, baseline, groupDoc, todayStr),
    pulse,
  };
}

// ─── BE-6: Standalone pulse endpoint ─────────────────────────────────────────

export async function getGroupPulse(
  db: Firestore,
  groupId: string,
  limit: number
): Promise<{ pulse: PulseItem[] }> {
  const todayStr = getTaipeiDateString();
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const members = await refreshMembersForToday(db, groupId, todayStr);
  const rows = computeLeaderboardRows(members);
  const pulse = await getRecentPulse(db, groupId, safeLimit, todayStr, rows);
  return { pulse };
}

export async function getMemberProfile(
  db: Firestore,
  groupId: string,
  lineUserId: string
): Promise<{
  member: WaterMember;
  rank: number;
  gapToAbove: number | null;
  leadOverSecond: number | null;
  aboveDisplayName: string | null;
}> {
  const todayStr = getTaipeiDateString();
  const members = await refreshMembersForToday(db, groupId, todayStr);
  const rows = computeLeaderboardRows(members);
  const me = buildMeRow(rows, lineUserId);
  const member = members.find((item) => item.lineUserId === lineUserId);

  if (!member) {
    throw new Error(`Water member ${lineUserId} not found`);
  }

  return {
    member: serializeWaterMember(member),
    rank: me.rank,
    gapToAbove: me.gapToAbove,
    leadOverSecond: me.leadOverSecond,
    aboveDisplayName: me.aboveDisplayName,
  };
}

export async function getWeeklyStats(db: Firestore, groupId: string): Promise<WeeklyStatsResponse> {
  const todayStr = getTaipeiDateString();
  const weekStart = getWeekStartDateString(todayStr);
  const groupRef = db.collection(WATER_GROUPS_COLLECTION).doc(groupId);
  const recordsRef = groupRef.collection('records');

  const [members, recordsSnap] = await Promise.all([
    refreshMembersForToday(db, groupId, todayStr),
    buildRecentRecordsQuery(recordsRef, weekStart, todayStr).get(),
  ]);

  const dates = listWeekDates(todayStr);
  const totals = new Map<string, number>(dates.map((date) => [date, 0]));
  const breakdown = new Map<string, { lineUserId: string; displayName: string; weekMl: number }>();

  for (const member of members) {
    breakdown.set(member.lineUserId, {
      lineUserId: member.lineUserId,
      displayName: member.displayName,
      weekMl: 0,
    });
  }

  for (const doc of recordsSnap.docs) {
    const record = toWaterRecordDoc(doc);
    totals.set(record.date, (totals.get(record.date) ?? 0) + record.ml);

    const existing = breakdown.get(record.lineUserId) ?? {
      lineUserId: record.lineUserId,
      displayName: record.displayName,
      weekMl: 0,
    };
    existing.weekMl += record.ml;
    breakdown.set(record.lineUserId, existing);
  }

  return {
    dailyTotals: dates.map((date) => ({ date, totalMl: totals.get(date) ?? 0 })),
    memberBreakdown: [...breakdown.values()].sort((left, right) => {
      if (right.weekMl !== left.weekMl) {
        return right.weekMl - left.weekMl;
      }
      return left.displayName.localeCompare(right.displayName, 'zh-Hant');
    }),
  };
}

export async function listWaterMembersForAdmin(
  db: Firestore,
  groupId: string
): Promise<WaterAdminMemberSummary[]> {
  const todayStr = getTaipeiDateString();
  const members = await refreshMembersForToday(db, groupId, todayStr);
  const rows = computeLeaderboardRows(members);

  return rows.map((row) => {
    const member = members.find((item) => item.lineUserId === row.lineUserId);
    if (!member) {
      throw new Error(`Water member ${row.lineUserId} not found in group ${groupId}`);
    }
    return serializeWaterAdminMemberSummary(member, row.rank);
  });
}

export async function resetMemberTodayWater(
  db: Firestore,
  groupId: string,
  lineUserId: string
): Promise<ResetTodayWaterResponse> {
  const todayStr = getTaipeiDateString();
  const weekStart = getWeekStartDateString(todayStr);
  const userRef = db.collection(WATER_USERS_COLLECTION).doc(lineUserId);
  const userRecordsRef = userRef.collection(WATER_USER_RECORDS_COLLECTION);
  const groupRef = db.collection(WATER_GROUPS_COLLECTION).doc(groupId);
  const memberRef = groupRef.collection('members').doc(lineUserId);
  const recordsRef = groupRef.collection('records');

  return db.runTransaction(async (transaction) => {
    const now = admin.firestore.Timestamp.now();
    const [userSnap, userRecordsSnap, memberSnap, weekRecordsSnap, todayRecordsSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(userRecordsRef),
      transaction.get(memberRef),
      transaction.get(buildRecentRecordsQuery(recordsRef, weekStart, todayStr)),
      transaction.get(buildRecentRecordsQuery(recordsRef, todayStr, todayStr)),
    ]);

    if (!memberSnap.exists) {
      throw new Error(`Water member ${lineUserId} not found in group ${groupId}`);
    }

    const raw = memberSnap.data() as WaterMemberDoc;
    const userDoc = userSnap.exists ? (userSnap.data() as WaterUserDoc) : null;
    const userRecords = userRecordsSnap.docs.map(toWaterUserRecordDoc);
    const weekRecords = weekRecordsSnap.docs.map(toWaterRecordDoc);
    const todayUserRecords = todayRecordsSnap.docs
      .map(toWaterRecordDoc)
      .filter((record) => record.lineUserId === lineUserId);

    const removedMl = todayUserRecords.reduce((sum, record) => sum + record.ml, 0);
    const removedRecordCount = todayUserRecords.length;
    const weekMl = Math.max(0, (weekRecords
      .filter((record) => record.lineUserId === lineUserId)
      .reduce((sum, record) => sum + record.ml, 0)) - removedMl);
    const totalMl = Math.max(0, raw.totalMl - removedMl);

    for (const doc of todayRecordsSnap.docs) {
      const record = toWaterRecordDoc(doc);
      if (record.lineUserId === lineUserId) {
        transaction.delete(doc.ref);
        transaction.delete(userRecordsRef.doc(record.id));
      }
    }

    if (userDoc) {
      const removedRecordIds = new Set(todayUserRecords.map((record) => record.id));
      const remainingUserRecords = userRecords.filter((record) => !removedRecordIds.has(record.id));
      const userSummary = summarizeUserHistory(remainingUserRecords, todayStr);

      transaction.set(userRef, {
        totalMl: userSummary.totalMl,
        streak: userSummary.streak,
        achievements: userSummary.achievements,
        lastDrinkAt: userSummary.lastDrinkAt,
        aggregateVersion: WATER_USER_AGGREGATE_VERSION,
        lastSeenAt: now,
      } satisfies Partial<WaterUserDoc>, { merge: true });
    }

    const updatedMember = normalizeMemberDoc(raw, {
      todayMl: 0,
      todayDate: todayStr,
      weekMl,
      totalMl,
      updatedAt: now,
    });

    transaction.set(
      memberRef,
      {
        todayMl: updatedMember.todayMl,
        todayDate: updatedMember.todayDate,
        weekMl: updatedMember.weekMl,
        totalMl: updatedMember.totalMl,
        updatedAt: now,
      },
      { merge: true }
    );

    return {
      member: serializeWaterMember(updatedMember),
      removedMl,
      removedRecordCount,
    };
  });
}

export function getRandomTaunt(randomIndex: number = Math.floor(Math.random() * TAUNT_MESSAGES.length)): string {
  return TAUNT_MESSAGES[randomIndex % TAUNT_MESSAGES.length]!;
}

export async function resetDailyWater(db: Firestore): Promise<number> {
  const todayStr = getTaipeiDateString();
  const snapshot = await db.collectionGroup('members').get();
  const batch = db.batch();
  const now = admin.firestore.Timestamp.now();
  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const parentDoc = doc.ref.parent.parent;
    if (parentDoc?.parent?.id !== WATER_GROUPS_COLLECTION) {
      continue;
    }

    const member = toWaterMemberDoc(doc);
    const patch = resetDayIfNeeded(member, todayStr);

    if (Object.keys(patch).length === 0) {
      continue;
    }

    batch.set(
      doc.ref,
      {
        ...patch,
        updatedAt: now,
      },
      { merge: true }
    );
    updatedCount += 1;
  }

  if (updatedCount > 0) {
    await batch.commit();
  }

  return updatedCount;
}
