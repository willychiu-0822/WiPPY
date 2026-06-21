import type { DrinkResponse, FirestoreTimestamp, MeInfo, TodayResponse, WaterMember } from './liffApi';

// ─── Hero State (M1 + M6) ────────────────────────────────────────────────────

export type HeroStateKind =
  | 'streak_risk'  // M6: today = 0, streak ≥ 1 — top priority
  | 'overtaken'    // M1: rank > 1, above member drank after me
  | 'ignition'     // M6: nobody in group has drunk today
  | 'defending'    // M1: rank = 1
  | 'normal';      // everything else

export interface HeroState {
  kind: HeroStateKind;
  // streak_risk
  streak?: number;
  // overtaken
  aboveDisplayName?: string;
  minutesAgo?: number;
  reclaimMl?: number;
  // defending
  leadOverSecond?: number;
  // normal / fallback
  gapToAbove?: number;
  aboveDisplayNameForNormal?: string;
  todayMl?: number;
}

function tsToMs(ts: FirestoreTimestamp): number {
  return ts._seconds * 1000 + Math.floor(ts._nanoseconds / 1e6);
}

/**
 * Selects the single most relevant hero card state for the current user.
 * Priority (highest first):
 *   1. streak_risk — today not drunk yet, streak ≥ 1
 *   2. overtaken   — rank > 1 and above member drank more recently than me
 *   3. ignition    — nobody in group drunk today (group.todayMl === 0)
 *   4. defending   — rank 1
 *   5. normal
 */
export function selectHeroState(today: TodayResponse, member: WaterMember): HeroState {
  const me: MeInfo = today.me;

  // 1. streak_risk (置頂): today not yet recorded, existing streak to protect
  if (member.todayMl === 0 && member.streak >= 1) {
    return { kind: 'streak_risk', streak: member.streak };
  }

  // 2. overtaken: above member's lastDrinkAt is newer than mine
  if (me.rank > 1 && me.aboveLastDrinkAt != null) {
    const myLastMs = member.lastDrinkAt ? tsToMs(member.lastDrinkAt) : 0;
    const aboveLastMs = tsToMs(me.aboveLastDrinkAt);
    if (aboveLastMs > myLastMs) {
      const minutesAgo = Math.max(1, Math.round((Date.now() - aboveLastMs) / 60000));
      const reclaimMl = (me.gapToAbove ?? 1) + 1;
      return {
        kind: 'overtaken',
        aboveDisplayName: me.aboveDisplayName ?? '上一名',
        minutesAgo,
        reclaimMl,
      };
    }
  }

  // 3. ignition (cold start): group total is 0
  if (today.group.todayMl === 0) {
    return { kind: 'ignition' };
  }

  // 4. defending: I'm first
  if (me.rank === 1) {
    return { kind: 'defending', leadOverSecond: me.leadOverSecond ?? undefined };
  }

  // 5. normal
  return {
    kind: 'normal',
    gapToAbove: me.gapToAbove ?? undefined,
    aboveDisplayNameForNormal: me.aboveDisplayName ?? undefined,
    todayMl: me.todayMl,
  };
}

// ─── Result Variant (M4) ─────────────────────────────────────────────────────

export type ResultVariant =
  | 'daily_first'   // M6: isDailyFirst — highest priority
  | 'group_goal'    // M3: group goal just reached
  | 'reversal'      // surpassedCount > 0
  | 'combo'         // comboCount ≥ 2
  | 'rare'          // groupDrinkSequence hits a milestone (multiples of 50)
  | 'defending'     // rank 1 after drink
  | 'plain';        // fallback

/**
 * Selects the top-priority variant for the drink result modal banner.
 * Priority (highest first): daily_first > group_goal > reversal > combo > rare > defending > plain
 */
export function selectResultVariant(drink: DrinkResponse): ResultVariant {
  if (drink.isDailyFirst) return 'daily_first';
  if (drink.groupGoalJustReached) return 'group_goal';
  if (drink.surpassedCount > 0) return 'reversal';
  if (drink.comboCount >= 2) return 'combo';
  if (drink.groupDrinkSequence >= 2 && drink.groupDrinkSequence % 50 === 0) return 'rare';
  if (drink.rankAfter === 1) return 'defending';
  return 'plain';
}

// ─── Relative Time ───────────────────────────────────────────────────────────

/**
 * Returns a human-readable relative time string like "3 分鐘前" or "2 小時前".
 * Always returns a non-empty string.
 */
export function relativeTimeFromTs(ts: FirestoreTimestamp, now: number = Date.now()): string {
  const diffMs = now - tsToMs(ts);
  const diffMin = Math.max(0, Math.round(diffMs / 60000));

  if (diffMin < 60) {
    return diffMin <= 0 ? '剛剛' : `${diffMin} 分鐘前`;
  }

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return `${diffHr} 小時前`;
  }

  return '超過一天前';
}
