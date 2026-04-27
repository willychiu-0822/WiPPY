jest.mock('firebase-admin', () => ({
  firestore: {
    Timestamp: {
      now: () => ({ toMillis: () => Date.now() }),
      fromMillis: (ms: number) => ({ toMillis: () => ms }),
    },
  },
}));
jest.mock('firebase-admin/firestore', () => ({}));

import { checkRateLimit, isNearLimit } from '../services/rateLimitService';

function buildDb(stored: { windowStartMs: number; requestCount: number } | null) {
  const docRef = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
  };
  if (stored) {
    docRef.get.mockResolvedValue({
      data: () => ({
        windowStart: { toMillis: () => stored.windowStartMs },
        requestCount: stored.requestCount,
      }),
    });
  } else {
    docRef.get.mockResolvedValue({ data: () => undefined });
  }

  const db = {
    collection: jest.fn(() => ({ doc: jest.fn(() => docRef) })),
    runTransaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        get: jest.fn().mockResolvedValue(stored
          ? {
              data: () => ({
                windowStart: { toMillis: () => stored.windowStartMs },
                requestCount: stored.requestCount,
              }),
            }
          : { data: () => undefined }),
        set: jest.fn(),
      };
      return fn(tx);
    }),
  };

  return { db, docRef };
}

describe('checkRateLimit', () => {
  it('allows first request (no existing record)', async () => {
    const { db } = buildDb(null);
    const result = await checkRateLimit(db as any, 'user_1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('allows request within window when under limit', async () => {
    const { db } = buildDb({ windowStartMs: Date.now() - 5000, requestCount: 5 });
    const result = await checkRateLimit(db as any, 'user_1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks when requestCount reaches 10', async () => {
    const { db } = buildDb({ windowStartMs: Date.now() - 5000, requestCount: 10 });
    const result = await checkRateLimit(db as any, 'user_1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('resets window when 60s have elapsed', async () => {
    const { db } = buildDb({ windowStartMs: Date.now() - 61000, requestCount: 10 });
    const result = await checkRateLimit(db as any, 'user_1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('retryAfterSeconds decreases as window ages', async () => {
    const { db } = buildDb({ windowStartMs: Date.now() - 30000, requestCount: 10 });
    const result = await checkRateLimit(db as any, 'user_1');
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(30);
  });
});

describe('isNearLimit', () => {
  it('returns false when far from limit', () => {
    expect(isNearLimit({ allowed: true, remaining: 9, retryAfterSeconds: 0, windowResetInSeconds: 55 })).toBe(false);
  });

  it('returns false when not allowed', () => {
    expect(isNearLimit({ allowed: false, remaining: 0, retryAfterSeconds: 30, windowResetInSeconds: 30 })).toBe(false);
  });

  it('returns true when remaining is 1', () => {
    expect(isNearLimit({ allowed: true, remaining: 1, retryAfterSeconds: 0, windowResetInSeconds: 20 })).toBe(true);
  });

  it('returns true when remaining is 2', () => {
    expect(isNearLimit({ allowed: true, remaining: 2, retryAfterSeconds: 0, windowResetInSeconds: 20 })).toBe(true);
  });
});
