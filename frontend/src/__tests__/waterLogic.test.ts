import { describe, expect, it } from 'vitest';
import type { DrinkResponse, FirestoreTimestamp, TodayResponse, WaterMember } from '../lib/liffApi';
import {
  relativeTimeFromTs,
  selectHeroState,
  selectResultVariant,
} from '../lib/waterLogic';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function ts(secondsAgo: number = 0): FirestoreTimestamp {
  return { _seconds: Math.floor(Date.now() / 1000) - secondsAgo, _nanoseconds: 0 };
}

function buildToday(overrides: {
  rank?: number;
  todayMl?: number;
  gapToAbove?: number | null;
  leadOverSecond?: number | null;
  aboveDisplayName?: string | null;
  aboveLastDrinkAt?: FirestoreTimestamp | null;
  belowDisplayName?: string | null;
  groupTodayMl?: number;
  firstLoggerDisplayName?: string | null;
} = {}): TodayResponse {
  return {
    groupName: '測試群',
    memberCount: 3,
    members: [],
    me: {
      lineUserId: 'U1',
      rank: overrides.rank ?? 2,
      todayMl: overrides.todayMl ?? 500,
      gapToAbove: overrides.gapToAbove ?? 100,
      leadOverSecond: overrides.leadOverSecond ?? null,
      aboveDisplayName: overrides.aboveDisplayName ?? '上一名',
      aboveLastDrinkAt: overrides.aboveLastDrinkAt ?? null,
      belowDisplayName: overrides.belowDisplayName ?? '下一名',
    },
    group: {
      todayMl: overrides.groupTodayMl ?? 1500,
      goalMl: 4500,
      goalReached: false,
      perMemberBaselineMl: 1500,
      firstLoggerDisplayName: overrides.firstLoggerDisplayName ?? null,
    },
    pulse: [],
  };
}

function buildMember(overrides: {
  todayMl?: number;
  streak?: number;
  lastDrinkAt?: FirestoreTimestamp | null;
} = {}): WaterMember {
  return {
    lineUserId: 'U1',
    displayName: 'Test',
    pictureUrl: '',
    todayMl: overrides.todayMl ?? 500,
    weekMl: 2000,
    totalMl: 10000,
    streak: overrides.streak ?? 3,
    achievements: [],
    lastDrinkAt: overrides.lastDrinkAt ?? ts(60),
  };
}

function buildDrink(overrides: Partial<DrinkResponse> = {}): DrinkResponse {
  return {
    record: { id: 'r1', lineUserId: 'U1', displayName: 'Test', ml: 200, drinkType: 'water', date: '2026-06-20', timestamp: ts() },
    member: buildMember(),
    rankBefore: 2,
    rankAfter: 2,
    surpassedCount: 0,
    eventAchievements: [],
    newPersistentAchievements: [],
    comboCount: 1,
    groupTodayMl: 1700,
    groupGoalMl: 4500,
    groupGoalJustReached: false,
    groupDrinkSequence: 3,
    belowDisplayName: '下一名',
    isDailyFirst: false,
    ...overrides,
  };
}

// ─── selectHeroState ─────────────────────────────────────────────────────────

describe('selectHeroState', () => {
  it('streak_risk when todayMl=0 and streak≥1 (top priority)', () => {
    const today = buildToday({ groupTodayMl: 500 }); // group has activity
    const member = buildMember({ todayMl: 0, streak: 5, lastDrinkAt: null });
    const state = selectHeroState(today, member);
    expect(state.kind).toBe('streak_risk');
    expect(state.streak).toBe(5);
  });

  it('streak_risk beats overtaken when todayMl=0 and streak≥1', () => {
    const today = buildToday({
      rank: 2,
      groupTodayMl: 800,
      aboveLastDrinkAt: ts(5), // above drank 5 min ago (very recent)
    });
    const member = buildMember({ todayMl: 0, streak: 3, lastDrinkAt: null });
    const state = selectHeroState(today, member);
    expect(state.kind).toBe('streak_risk');
  });

  it('streak_risk beats ignition when todayMl=0 but group also has no drinks', () => {
    const today = buildToday({ groupTodayMl: 0 });
    const member = buildMember({ todayMl: 0, streak: 2, lastDrinkAt: null });
    // Even if group has 0, streak_risk takes precedence when streak ≥ 1
    const state = selectHeroState(today, member);
    expect(state.kind).toBe('streak_risk');
  });

  it('no streak_risk when streak=0 even if todayMl=0', () => {
    const today = buildToday({ groupTodayMl: 500 });
    const member = buildMember({ todayMl: 0, streak: 0, lastDrinkAt: null });
    // Should not be streak_risk; next priority applies
    const state = selectHeroState(today, member);
    expect(state.kind).not.toBe('streak_risk');
  });

  it('overtaken when above member drank after me', () => {
    const myLastDrink = ts(60); // 60 sec ago
    const aboveLast = ts(30);   // 30 sec ago (more recent)
    const today = buildToday({
      rank: 2,
      gapToAbove: 150,
      aboveDisplayName: '小明',
      aboveLastDrinkAt: aboveLast,
    });
    const member = buildMember({ todayMl: 500, streak: 0, lastDrinkAt: myLastDrink });
    const state = selectHeroState(today, member);
    expect(state.kind).toBe('overtaken');
    expect(state.aboveDisplayName).toBe('小明');
    expect(state.reclaimMl).toBe(151); // gapToAbove + 1
    expect(state.minutesAgo).toBeGreaterThanOrEqual(1);
  });

  it('no overtaken when my last drink is more recent than above', () => {
    const myLastDrink = ts(10);  // 10 sec ago (very recent)
    const aboveLast = ts(120);   // 2 min ago (older)
    const today = buildToday({
      rank: 2,
      aboveLastDrinkAt: aboveLast,
    });
    const member = buildMember({ todayMl: 500, streak: 0, lastDrinkAt: myLastDrink });
    const state = selectHeroState(today, member);
    expect(state.kind).not.toBe('overtaken');
  });

  it('ignition when group.todayMl=0 and no streak (cold start)', () => {
    const today = buildToday({ groupTodayMl: 0 });
    const member = buildMember({ todayMl: 0, streak: 0 });
    const state = selectHeroState(today, member);
    expect(state.kind).toBe('ignition');
  });

  it('defending when rank=1', () => {
    const today = buildToday({ rank: 1, leadOverSecond: 320, gapToAbove: null });
    const member = buildMember({ todayMl: 800, streak: 2 });
    const state = selectHeroState(today, member);
    expect(state.kind).toBe('defending');
    expect(state.leadOverSecond).toBe(320);
  });

  it('normal as fallback', () => {
    const today = buildToday({ rank: 2, gapToAbove: 200, aboveDisplayName: '小美' });
    const member = buildMember({ todayMl: 400, streak: 0 });
    const state = selectHeroState(today, member);
    expect(state.kind).toBe('normal');
    expect(state.gapToAbove).toBe(200);
    expect(state.aboveDisplayNameForNormal).toBe('小美');
  });
});

// ─── selectResultVariant ─────────────────────────────────────────────────────

describe('selectResultVariant', () => {
  it('daily_first is highest priority (M6)', () => {
    const drink = buildDrink({ isDailyFirst: true, groupGoalJustReached: true, surpassedCount: 3 });
    expect(selectResultVariant(drink)).toBe('daily_first');
  });

  it('group_goal when justReached (and not daily_first)', () => {
    const drink = buildDrink({ groupGoalJustReached: true, surpassedCount: 2, comboCount: 3 });
    expect(selectResultVariant(drink)).toBe('group_goal');
  });

  it('reversal when surpassedCount > 0', () => {
    const drink = buildDrink({ surpassedCount: 1, comboCount: 3 });
    expect(selectResultVariant(drink)).toBe('reversal');
  });

  it('combo when comboCount ≥ 2', () => {
    const drink = buildDrink({ comboCount: 3 });
    expect(selectResultVariant(drink)).toBe('combo');
  });

  it('rare when groupDrinkSequence is multiple of 50', () => {
    const drink = buildDrink({ groupDrinkSequence: 100 });
    expect(selectResultVariant(drink)).toBe('rare');

    const drink50 = buildDrink({ groupDrinkSequence: 50 });
    expect(selectResultVariant(drink50)).toBe('rare');
  });

  it('not rare for groupDrinkSequence < 2 or non-multiples', () => {
    expect(selectResultVariant(buildDrink({ groupDrinkSequence: 1 }))).toBe('plain');
    expect(selectResultVariant(buildDrink({ groupDrinkSequence: 51 }))).toBe('plain');
  });

  it('defending when rank 1 after drink', () => {
    const drink = buildDrink({ rankAfter: 1 });
    expect(selectResultVariant(drink)).toBe('defending');
  });

  it('plain as fallback', () => {
    expect(selectResultVariant(buildDrink())).toBe('plain');
  });

  it('priority order is daily_first > group_goal > reversal > combo > rare > defending > plain', () => {
    // Each level beats the ones below
    const all = buildDrink({
      isDailyFirst: true,
      groupGoalJustReached: true,
      surpassedCount: 1,
      comboCount: 3,
      groupDrinkSequence: 50,
      rankAfter: 1,
    });
    expect(selectResultVariant(all)).toBe('daily_first');

    const noFirst = { ...all, isDailyFirst: false };
    expect(selectResultVariant(noFirst)).toBe('group_goal');

    const noGoal = { ...noFirst, groupGoalJustReached: false };
    expect(selectResultVariant(noGoal)).toBe('reversal');

    const noReversal = { ...noGoal, surpassedCount: 0 };
    expect(selectResultVariant(noReversal)).toBe('combo');

    const noCombo = { ...noReversal, comboCount: 1 };
    expect(selectResultVariant(noCombo)).toBe('rare');

    const noRare = { ...noCombo, groupDrinkSequence: 3 };
    expect(selectResultVariant(noRare)).toBe('defending');

    const noDefend = { ...noRare, rankAfter: 2 };
    expect(selectResultVariant(noDefend)).toBe('plain');
  });
});

// ─── relativeTimeFromTs ──────────────────────────────────────────────────────

describe('relativeTimeFromTs', () => {
  const nowMs = Date.now();

  it('shows 剛剛 for brand-new timestamps', () => {
    const t = { _seconds: Math.floor(nowMs / 1000), _nanoseconds: 0 };
    expect(relativeTimeFromTs(t, nowMs)).toBe('剛剛');
  });

  it('shows N 分鐘前 for minutes ago', () => {
    const t = { _seconds: Math.floor(nowMs / 1000) - 5 * 60, _nanoseconds: 0 };
    expect(relativeTimeFromTs(t, nowMs)).toBe('5 分鐘前');
  });

  it('shows N 小時前 for hours ago', () => {
    const t = { _seconds: Math.floor(nowMs / 1000) - 2 * 3600, _nanoseconds: 0 };
    expect(relativeTimeFromTs(t, nowMs)).toBe('2 小時前');
  });

  it('shows 超過一天前 for old timestamps', () => {
    const t = { _seconds: Math.floor(nowMs / 1000) - 25 * 3600, _nanoseconds: 0 };
    expect(relativeTimeFromTs(t, nowMs)).toBe('超過一天前');
  });

  it('clamps to at least 剛剛 for future timestamps', () => {
    const t = { _seconds: Math.floor(nowMs / 1000) + 60, _nanoseconds: 0 };
    expect(relativeTimeFromTs(t, nowMs)).toBe('剛剛');
  });
});
