// Shared rules for scheduled activity messages: the sortable due time and the
// send lock. Kept free of LINE/Firestore imports so every write path can use it.

/** A send lock older than this is treated as abandoned (the worker died mid-send). */
export const SEND_LOCK_TTL_MS = 10 * 60 * 1000;

/** How many scheduler rounds may try to deliver one message before it is marked failed. */
export const MAX_SEND_ATTEMPTS = 5;

type TimeLike = Date | { toMillis?: () => number; seconds?: number; _seconds?: number } | null | undefined;

export function timeToMillis(value: TimeLike): number | null {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value.toMillis === 'function') return value.toMillis();
  const seconds = value.seconds ?? value._seconds;
  return typeof seconds === 'number' ? seconds * 1000 : null;
}

export function isSendLockActive(processingAt: TimeLike, nowMs: number): boolean {
  const lockedAt = timeToMillis(processingAt);
  return lockedAt !== null && nowMs - lockedAt < SEND_LOCK_TTL_MS;
}

/**
 * `triggerValue` is an ISO string that may carry any offset, so it cannot be
 * range-queried. Scheduled messages also store the same instant as `triggerAt`
 * (a Date, saved by Firestore as a Timestamp) for the scheduler's `<= now` query.
 */
export function scheduledTriggerAt(triggerType: string, triggerValue: unknown): Date | null {
  if (triggerType !== 'scheduled' || typeof triggerValue !== 'string') return null;
  const ms = Date.parse(triggerValue);
  return Number.isFinite(ms) ? new Date(ms) : null;
}
