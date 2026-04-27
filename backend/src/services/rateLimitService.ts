import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import type { RateLimitResult } from '../types';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const WARNING_AT = 8; // warn when remaining < (MAX - WARNING_AT)

export async function checkRateLimit(db: Firestore, userId: string): Promise<RateLimitResult> {
  const ref = db.collection('rateLimits').doc(userId);
  const now = Date.now();

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as
      | { windowStart: admin.firestore.Timestamp; requestCount: number }
      | undefined;

    const windowStart = data?.windowStart?.toMillis() ?? 0;
    const elapsed = now - windowStart;
    const inWindow = elapsed < WINDOW_MS;
    const count = inWindow ? (data?.requestCount ?? 0) : 0;
    const newWindowStart = inWindow ? windowStart : now;

    if (count >= MAX_REQUESTS) {
      const retryAfterSeconds = Math.ceil((WINDOW_MS - elapsed) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds, windowResetInSeconds: retryAfterSeconds };
    }

    tx.set(ref, {
      windowStart: admin.firestore.Timestamp.fromMillis(newWindowStart),
      requestCount: count + 1,
    });

    const remaining = MAX_REQUESTS - count - 1;
    const windowResetInSeconds = Math.ceil((WINDOW_MS - (now - newWindowStart)) / 1000);
    return { allowed: true, remaining, retryAfterSeconds: 0, windowResetInSeconds };
  });
}

export function isNearLimit(result: RateLimitResult): boolean {
  return result.allowed && result.remaining <= MAX_REQUESTS - WARNING_AT;
}
