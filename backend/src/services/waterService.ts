import * as admin from 'firebase-admin';
import { format as formatDate, subDays, parseISO, differenceInCalendarDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Firestore, Timestamp } from 'firebase-admin/firestore';

const TZ = 'Asia/Taipei';
const WATER_USERS_COLLECTION = 'waterUsers';
const WATER_GROUPS_COLLECTION = 'waterGroups';

export type DrinkType = 'water' | 'tea' | 'coffee' | 'juice' | 'other';

export type AchievementId =
  | 'first_drink'
  | '7_day_streak'
  | '30_day_streak'
  | 'hydration_master'
  | 'now_im_best'
  | 'now_im_worst';

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
}

export interface LeaderboardMe {
  lineUserId: string;
  rank: number;
  todayMl: number;
  gapToAbove: number | null;
  leadOverSecond: number | null;
  aboveDisplayName: string | null;
}

export interface TodayLeaderboardResponse {
  groupName: string;
  memberCount: number;
  members: LeaderboardRow[];
  me: LeaderboardMe;
}

export interface WeeklyStatsResponse {
  dailyTotals: Array<{ date: string; totalMl: number }>;
  memberBreakdown: Array<{ lineUserId: string; displayName: string; weekMl: number }>;
}

export interface LogDrinkResponse {
  record: WaterRecord;
  member: WaterMember;
  rankBefore: number;
  rankAfter: number;
  surpassedCount: number;
  eventAchievements: AchievementId[];
  newPersistentAchievements: AchievementId[];
}

export interface EnsureIdentityResponse {
  isNewUser: boolean;
  user: WaterUser;
  member: WaterMember;
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
}

interface WaterGroupDoc {
  groupName: string;
  memberCount: number;
  activeSince: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
  };
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
    } satisfies WaterGroupDoc,
    { merge: true }
  );
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
    const existingMember = memberSnap.exists ? (memberSnap.data() as WaterMemberDoc) : null;
    const resetPatch = existingMember ? resetDayIfNeeded(existingMember, todayStr) : {};
    const nextMemberCount = (existingGroup?.memberCount ?? 0) + (memberSnap.exists ? 0 : 1);

    transaction.set(
      userRef,
      {
        lineUserId: user.userId,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        firstSeenAt: userSnap.exists ? (userSnap.data() as WaterUserDoc).firstSeenAt : now,
        lastSeenAt: now,
        lastGroupId: group.groupId,
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
  const groupRef = db.collection(WATER_GROUPS_COLLECTION).doc(groupId);
  const memberRef = groupRef.collection('members').doc(user.userId);
  const membersRef = groupRef.collection('members');
  const recordsRef = groupRef.collection('records');

  return db.runTransaction(async (transaction) => {
    const now = admin.firestore.Timestamp.now();
    const [memberSnap, membersSnap, weekRecordsSnap, todayRecordsSnap] = await Promise.all([
      transaction.get(memberRef),
      transaction.get(membersRef),
      transaction.get(buildRecentRecordsQuery(recordsRef, weekStart, todayStr)),
      transaction.get(buildRecentRecordsQuery(recordsRef, todayStr, todayStr)),
    ]);

    if (!memberSnap.exists) {
      throw new Error(`Water member ${user.userId} not found`);
    }

    const weekRecords = weekRecordsSnap.docs.map(toWaterRecordDoc);
    const todayRecords = todayRecordsSnap.docs.map(toWaterRecordDoc);
    const weekTotals = mapByUser(weekRecords);
    const todayTotals = mapByUser(todayRecords);

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

    return {
      record: serializeWaterRecord(recordDoc),
      member: serializeWaterMember(updatedMember),
      rankBefore: beforeMe.rank,
      rankAfter: afterMe.rank,
      surpassedCount: Math.max(0, beforeMe.rank - afterMe.rank),
      eventAchievements,
      newPersistentAchievements,
    };
  });
}

export async function getTodayLeaderboard(
  db: Firestore,
  groupId: string,
  lineUserId: string
): Promise<TodayLeaderboardResponse> {
  const todayStr = getTaipeiDateString();
  const groupRef = db.collection(WATER_GROUPS_COLLECTION).doc(groupId);
  const [groupSnap, members] = await Promise.all([
    groupRef.get(),
    refreshMembersForToday(db, groupId, todayStr),
  ]);

  const group = toWaterGroupDoc(groupSnap);
  const rows = computeLeaderboardRows(members);

  return {
    groupName: group?.groupName ?? '',
    memberCount: rows.length,
    members: rows,
    me: buildMeRow(rows, lineUserId),
  };
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
