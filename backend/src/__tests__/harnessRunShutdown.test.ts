import type { Firestore } from 'firebase-admin/firestore';
import {
  CLOUD_RUN_TERMINATED,
  STUCK_RUN_STALE_MS,
  STUCK_RUN_TIMEOUT,
  InstanceRunTracker,
  claimHarnessRun,
  createProcessInstanceId,
  handleInstanceShutdown,
  reclaimStuckRuns,
  releaseHarnessRun,
  startOwnedRunHeartbeat,
  startStuckRunReclaimer,
  timestampToMillis,
} from '../services/harnessRunShutdown';

/**
 * W-11: SIGTERM must fail only the runs this Cloud Run instance owns.
 * Another instance's in-flight run stays queued/running.
 */

type DocData = Record<string, unknown>;

function ts(ms: number) {
  return { toMillis: () => ms, seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1e6 };
}

function clone<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (typeof (value as { toMillis?: unknown }).toMillis === 'function') return value;
  if (Array.isArray(value)) return value.map((item) => clone(item)) as T;
  return Object.fromEntries(Object.entries(value as object).map(([key, item]) => [key, clone(item)])) as T;
}

function createDb() {
  const store = new Map<string, DocData>();

  function doc(id: string) {
    const ref = {
      id,
      get: async () => {
        const data = store.get(id);
        return {
          id,
          exists: data !== undefined,
          ref,
          data: () => (data === undefined ? undefined : clone(data)),
        };
      },
      set: async (data: DocData) => {
        store.set(id, clone(data));
      },
      update: async (patch: DocData) => {
        const current = store.get(id);
        if (!current) throw new Error(`no doc harnessRuns/${id}`);
        store.set(id, { ...current, ...clone(patch) });
      },
    };
    return ref;
  }

  function matches(data: DocData, field: string, op: string, value: unknown): boolean {
    if (op === '==') return data[field] === value;
    if (op === 'in') return Array.isArray(value) && value.includes(data[field]);
    throw new Error(`unsupported op ${op}`);
  }

  function query(filters: Array<[string, string, unknown]>): {
    where: (field: string, op: string, value: unknown) => ReturnType<typeof query>;
    get: () => Promise<{ empty: boolean; size: number; docs: Array<Awaited<ReturnType<ReturnType<typeof doc>['get']>>> }>;
  } {
    return {
      where: (field: string, op: string, value: unknown) => query([...filters, [field, op, value]]),
      get: async () => {
        const docs = [...store.entries()]
          .filter(([, data]) => filters.every(([field, op, value]) => matches(data, field, op, value)))
          .map(([id]) => doc(id).get());
        const snaps = await Promise.all(docs);
        return { empty: snaps.length === 0, size: snaps.length, docs: snaps };
      },
    };
  }

  const db = {
    collection: (name: string) => {
      if (name !== 'harnessRuns') throw new Error(`unexpected collection ${name}`);
      return {
        doc,
        where: (field: string, op: string, value: unknown) => query([[field, op, value]]),
      };
    },
    batch: () => {
      const ops: Array<() => Promise<void>> = [];
      return {
        update: (ref: { update: (patch: DocData) => Promise<void> }, patch: DocData) => {
          ops.push(() => ref.update(patch));
        },
        commit: async () => {
          for (const op of ops) await op();
        },
      };
    },
    runTransaction: async <T>(fn: (tx: {
      get: (ref: { get: () => Promise<unknown> }) => Promise<unknown>;
      update: (ref: { update: (patch: DocData) => Promise<void> }, patch: DocData) => void;
    }) => Promise<T>): Promise<T> => {
      const ops: Array<() => Promise<void>> = [];
      const result = await fn({
        get: (ref) => ref.get(),
        update: (ref, patch) => { ops.push(() => ref.update(patch)); },
      });
      for (const op of ops) await op();
      return result;
    },
  };

  return db;
}

type TestDb = ReturnType<typeof createDb>;

function asFirestore(db: TestDb): Firestore {
  return db as unknown as Firestore;
}

async function seed(db: TestDb, id: string, data: DocData): Promise<void> {
  await db.collection('harnessRuns').doc(id).set({ id, ...data });
}

async function read(db: TestDb, id: string): Promise<DocData> {
  const snap = await db.collection('harnessRuns').doc(id).get();
  return snap.data() ?? {};
}

describe('W-11 SIGTERM harness run scope', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('leaves the other instance running run unchanged when one instance handles SIGTERM', async () => {
    const db = createDb();
    const nowMs = Date.parse('2026-11-24T02:00:00.000Z');
    const now = ts(nowMs);
    const fresh = ts(nowMs - 30_000);

    await seed(db, 'run-a', {
      status: 'running',
      instanceId: 'instance-a',
      updatedAt: fresh,
      lastError: null,
      userId: 'user-a',
    });
    await seed(db, 'run-b', {
      status: 'running',
      instanceId: 'instance-b',
      updatedAt: fresh,
      lastError: null,
      userId: 'user-b',
    });

    const instanceA = new InstanceRunTracker('instance-a');
    instanceA.claim('run-a');
    const instanceB = new InstanceRunTracker('instance-b');
    instanceB.claim('run-b');

    const result = await handleInstanceShutdown(asFirestore(db), instanceA, { nowMs, now });

    expect(result.ownedFailed).toEqual(['run-a']);
    expect(result.reclaimed).toEqual([]);
    await expect(read(db, 'run-a')).resolves.toMatchObject({
      status: 'failed',
      lastError: CLOUD_RUN_TERMINATED,
      instanceId: 'instance-a',
      userId: 'user-a',
      updatedAt: now,
    });
    await expect(read(db, 'run-b')).resolves.toMatchObject({
      status: 'running',
      lastError: null,
      instanceId: 'instance-b',
      userId: 'user-b',
      updatedAt: fresh,
    });
  });

  it('fails this instance queued run and leaves another instance queued run alone', async () => {
    const db = createDb();
    const nowMs = Date.parse('2026-11-24T02:00:00.000Z');
    const now = ts(nowMs);
    const fresh = ts(nowMs - 5_000);
    await seed(db, 'run-a', { status: 'queued', instanceId: 'instance-a', updatedAt: fresh, lastError: null });
    await seed(db, 'run-b', { status: 'queued', instanceId: 'instance-b', updatedAt: fresh, lastError: null });
    const instanceA = new InstanceRunTracker('instance-a');
    instanceA.claim('run-a');

    await handleInstanceShutdown(asFirestore(db), instanceA, { nowMs, now });

    await expect(read(db, 'run-a')).resolves.toMatchObject({ status: 'failed', lastError: CLOUD_RUN_TERMINATED });
    await expect(read(db, 'run-b')).resolves.toMatchObject({ status: 'queued', lastError: null });
  });

  it('fails a run tracked only in memory when the instanceId stamp is missing', async () => {
    const db = createDb();
    const nowMs = Date.parse('2026-11-24T02:00:00.000Z');
    const now = ts(nowMs);
    const fresh = ts(nowMs - 5_000);
    await seed(db, 'run-a', { status: 'running', updatedAt: fresh, lastError: null });
    await seed(db, 'run-b', { status: 'running', updatedAt: fresh, lastError: null });
    const instanceA = new InstanceRunTracker('instance-a');
    instanceA.claim('run-a');

    await handleInstanceShutdown(asFirestore(db), instanceA, { nowMs, now });

    await expect(read(db, 'run-a')).resolves.toMatchObject({ status: 'failed', lastError: CLOUD_RUN_TERMINATED });
    await expect(read(db, 'run-b')).resolves.toMatchObject({ status: 'running', lastError: null });
    expect((await read(db, 'run-b')).instanceId).toBeUndefined();
  });

  it('fails a run stamped with this instanceId even if the in-memory set lost it', async () => {
    const db = createDb();
    const nowMs = Date.parse('2026-11-24T02:00:00.000Z');
    const now = ts(nowMs);
    await seed(db, 'run-a', {
      status: 'running',
      instanceId: 'instance-a',
      updatedAt: ts(nowMs - 5_000),
      lastError: null,
    });
    const instanceA = new InstanceRunTracker('instance-a');

    await handleInstanceShutdown(asFirestore(db), instanceA, { nowMs, now });

    await expect(read(db, 'run-a')).resolves.toMatchObject({ status: 'failed', lastError: CLOUD_RUN_TERMINATED });
  });

  it('does not fail a completed run or a run another instance has taken over', async () => {
    const db = createDb();
    const nowMs = Date.parse('2026-11-24T02:00:00.000Z');
    const now = ts(nowMs);
    const fresh = ts(nowMs - 5_000);
    await seed(db, 'done', {
      status: 'completed',
      instanceId: 'instance-a',
      updatedAt: fresh,
      lastError: null,
    });
    await seed(db, 'taken', {
      status: 'running',
      instanceId: 'instance-b',
      updatedAt: fresh,
      lastError: null,
    });
    const instanceA = new InstanceRunTracker('instance-a');
    instanceA.claim('done');
    instanceA.claim('taken');

    const result = await handleInstanceShutdown(asFirestore(db), instanceA, { nowMs, now });

    expect(result.ownedFailed).toEqual([]);
    await expect(read(db, 'done')).resolves.toMatchObject({ status: 'completed', lastError: null });
    await expect(read(db, 'taken')).resolves.toMatchObject({ status: 'running', instanceId: 'instance-b', lastError: null });
  });

  it('keeps cloud_run_terminated for this instance stale run and reclaims other stuck runs', async () => {
    const db = createDb();
    const nowMs = Date.parse('2026-11-24T02:00:00.000Z');
    const now = ts(nowMs);
    const stale = ts(nowMs - STUCK_RUN_STALE_MS - 1);
    const fresh = ts(nowMs - 5_000);
    await seed(db, 'mine', { status: 'running', instanceId: 'instance-a', updatedAt: stale, lastError: null });
    await seed(db, 'orphan', { status: 'queued', updatedAt: stale, lastError: null });
    await seed(db, 'taken-stale', { status: 'running', instanceId: 'instance-b', updatedAt: stale, lastError: null });
    await seed(db, 'live-other', { status: 'running', instanceId: 'instance-b', updatedAt: fresh, lastError: null });
    await seed(db, 'old-doc-fresh', { status: 'running', updatedAt: fresh, lastError: null });
    const instanceA = new InstanceRunTracker('instance-a');
    instanceA.claim('mine');
    instanceA.claim('taken-stale');

    const result = await handleInstanceShutdown(asFirestore(db), instanceA, { nowMs, now });

    expect(result.ownedFailed).toEqual(['mine']);
    expect(result.reclaimed).toEqual(['orphan', 'taken-stale']);
    await expect(read(db, 'mine')).resolves.toMatchObject({ status: 'failed', lastError: CLOUD_RUN_TERMINATED });
    await expect(read(db, 'orphan')).resolves.toMatchObject({ status: 'failed', lastError: STUCK_RUN_TIMEOUT, updatedAt: now });
    await expect(read(db, 'taken-stale')).resolves.toMatchObject({ status: 'failed', lastError: STUCK_RUN_TIMEOUT, instanceId: 'instance-b' });
    await expect(read(db, 'live-other')).resolves.toMatchObject({ status: 'running', lastError: null });
    await expect(read(db, 'old-doc-fresh')).resolves.toMatchObject({ status: 'running', lastError: null });
  });

  it('reclaims a run only when updatedAt is strictly older than 5 minutes', async () => {
    expect(STUCK_RUN_STALE_MS).toBe(5 * 60 * 1000);
    const db = createDb();
    const nowMs = Date.parse('2026-11-24T02:00:00.200Z');
    const now = ts(nowMs);
    const cutoff = nowMs - STUCK_RUN_STALE_MS;
    const freshMs = cutoff + 100;
    const freshSeconds = Math.floor(freshMs / 1000);
    await seed(db, 'exact', { status: 'running', updatedAt: ts(cutoff), lastError: null });
    await seed(db, 'older', { status: 'running', updatedAt: ts(cutoff - 1), lastError: null });
    await seed(db, 'nanos-fresh', {
      status: 'running',
      // Inside the window. Dropping nanoseconds would make this second look stale.
      updatedAt: { seconds: freshSeconds, nanoseconds: (freshMs - freshSeconds * 1000) * 1_000_000 },
      lastError: null,
    });
    await seed(db, 'finished', {
      status: 'completed',
      updatedAt: ts(cutoff - 60_000),
      lastError: null,
    });
    await seed(db, 'undated', { status: 'running', lastError: null });
    await seed(db, 'bad-date', { status: 'queued', updatedAt: 'yesterday', lastError: null });

    const reclaimed = await reclaimStuckRuns(asFirestore(db), { nowMs, now });

    expect(reclaimed).toEqual(['older']);
    await expect(read(db, 'exact')).resolves.toMatchObject({ status: 'running' });
    await expect(read(db, 'older')).resolves.toMatchObject({ status: 'failed', lastError: STUCK_RUN_TIMEOUT });
    await expect(read(db, 'nanos-fresh')).resolves.toMatchObject({ status: 'running' });
    await expect(read(db, 'finished')).resolves.toMatchObject({ status: 'completed' });
    await expect(read(db, 'undated')).resolves.toMatchObject({ status: 'running' });
    await expect(read(db, 'bad-date')).resolves.toMatchObject({ status: 'queued' });
  });

  it('does not reclaim a run this process still owns', async () => {
    const db = createDb();
    const nowMs = Date.parse('2026-11-24T02:00:00.000Z');
    const now = ts(nowMs);
    await seed(db, 'mine', {
      status: 'running',
      instanceId: 'instance-a',
      updatedAt: ts(nowMs - STUCK_RUN_STALE_MS - 10_000),
      lastError: null,
    });
    const tracker = new InstanceRunTracker('instance-a');
    tracker.claim('mine');

    const reclaimed = await reclaimStuckRuns(asFirestore(db), { nowMs, now }, { excludeRunIds: tracker.ownedRunIds });

    expect(reclaimed).toEqual([]);
    await expect(read(db, 'mine')).resolves.toMatchObject({ status: 'running', lastError: null });
  });

  it('stamps instanceId on claim and still tracks the run if the write fails', async () => {
    const db = createDb();
    const fresh = ts(Date.parse('2026-11-24T02:00:00.000Z'));
    await seed(db, 'run-a', { status: 'queued', updatedAt: fresh, lastError: null, userId: 'user-a' });
    const tracker = new InstanceRunTracker('instance-a');

    await claimHarnessRun(asFirestore(db), 'run-a', tracker);

    expect(tracker.ownedRunIds.has('run-a')).toBe(true);
    await expect(read(db, 'run-a')).resolves.toMatchObject({
      status: 'queued',
      instanceId: 'instance-a',
      updatedAt: fresh,
      userId: 'user-a',
    });

    const missing = new InstanceRunTracker('instance-a');
    await claimHarnessRun(asFirestore(db), 'missing-run', missing);
    expect(missing.ownedRunIds.has('missing-run')).toBe(true);

    releaseHarnessRun('run-a', tracker);
    expect(tracker.ownedRunIds.has('run-a')).toBe(false);
    await expect(read(db, 'run-a')).resolves.toMatchObject({ instanceId: 'instance-a' });
  });

  it('heartbeats an owned run until it is released', async () => {
    jest.useFakeTimers();
    const db = createDb();
    const start = Date.parse('2026-11-24T02:00:00.000Z');
    await seed(db, 'run-a', { status: 'running', updatedAt: ts(start), lastError: null });
    const tracker = new InstanceRunTracker('instance-a');
    tracker.claim('run-a');
    let current = start;
    const stop = startOwnedRunHeartbeat(asFirestore(db), 'run-a', tracker, 60_000, () => {
      current += 60_000;
      return ts(current);
    });

    await jest.advanceTimersByTimeAsync(60_000);
    const beating = await read(db, 'run-a');
    expect(beating.status).toBe('running');
    expect(timestampToMillis(beating.updatedAt)).toBe(start + 60_000);

    releaseHarnessRun('run-a', tracker);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(timestampToMillis((await read(db, 'run-a')).updatedAt)).toBe(start + 60_000);
    stop();
  });

  it('reclaims stuck runs when the reclaimer starts and skips runs this process owns', async () => {
    const db = createDb();
    const nowMs = Date.now();
    const tracker = new InstanceRunTracker('instance-a');
    tracker.claim('mine');
    await seed(db, 'mine', { status: 'running', updatedAt: ts(nowMs - STUCK_RUN_STALE_MS - 5_000), lastError: null });
    await seed(db, 'orphan', { status: 'running', updatedAt: ts(nowMs - STUCK_RUN_STALE_MS - 5_000), lastError: null });
    await seed(db, 'fresh', { status: 'queued', updatedAt: ts(nowMs), lastError: null });

    const stop = startStuckRunReclaimer(asFirestore(db), tracker, 60_000, () => ({ nowMs, now: ts(nowMs) }));
    try {
      for (let i = 0; i < 10; i += 1) {
        const orphan = await read(db, 'orphan');
        if (orphan.status === 'failed') break;
        await new Promise((resolve) => setImmediate(resolve));
      }
      await expect(read(db, 'orphan')).resolves.toMatchObject({ status: 'failed', lastError: STUCK_RUN_TIMEOUT });
      await expect(read(db, 'mine')).resolves.toMatchObject({ status: 'running' });
      await expect(read(db, 'fresh')).resolves.toMatchObject({ status: 'queued' });
    } finally {
      stop();
    }
  });

  it('builds a per-process id that is not shared across instances of one revision', () => {
    const previous = process.env.K_REVISION;
    try {
      process.env.K_REVISION = 'wippy-backend-00042-abc';
      const first = createProcessInstanceId();
      const second = createProcessInstanceId();
      expect(first.startsWith('wippy-backend-00042-abc:')).toBe(true);
      expect(second.startsWith('wippy-backend-00042-abc:')).toBe(true);
      expect(first).not.toBe(second);

      delete process.env.K_REVISION;
      const unscopedA = createProcessInstanceId();
      const unscopedB = createProcessInstanceId();
      expect(unscopedA).not.toBe(unscopedB);
      expect(unscopedA.includes(':')).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.K_REVISION;
      else process.env.K_REVISION = previous;
    }
  });
});
