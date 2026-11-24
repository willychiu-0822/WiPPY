import { randomUUID } from 'crypto';
import * as admin from 'firebase-admin';
import type { DocumentReference, Firestore, UpdateData } from 'firebase-admin/firestore';

/**
 * Cloud Run SIGTERM is per instance. Only runs this process owns are marked
 * `cloud_run_terminated`. Runs that nobody is updating anymore are reclaimed
 * separately, and only after updatedAt is strictly older than 5 minutes.
 */

export const CLOUD_RUN_TERMINATED = 'cloud_run_terminated';
export const STUCK_RUN_TIMEOUT = 'stuck_run_timeout';
export const STUCK_RUN_STALE_MS = 5 * 60 * 1000;
export const STUCK_RUN_RECLAIM_INTERVAL_MS = 60 * 1000;
export const RUN_HEARTBEAT_MS = 60 * 1000;

const ACTIVE_STATUSES = ['queued', 'running'] as const;

export interface ShutdownClock {
  nowMs: number;
  now: unknown;
}

export interface ShutdownResult {
  ownedFailed: string[];
  reclaimed: string[];
}

type RunData = Record<string, unknown>;

interface RunDocRef {
  id?: string;
  get(): Promise<RunDocSnap>;
  update(patch: RunData): Promise<unknown>;
}

interface RunDocSnap {
  id: string;
  exists: boolean;
  ref: RunDocRef;
  data(): RunData | undefined;
}

export class InstanceRunTracker {
  readonly ownedRunIds = new Set<string>();

  constructor(readonly instanceId: string) {}

  claim(runId: string): void {
    if (runId) this.ownedRunIds.add(runId);
  }

  release(runId: string): void {
    this.ownedRunIds.delete(runId);
  }
}

export function createProcessInstanceId(): string {
  const revision = process.env.K_REVISION?.trim();
  const unique = randomUUID();
  return revision ? `${revision}:${unique}` : unique;
}

const processRunTracker = new InstanceRunTracker(createProcessInstanceId());

export function getProcessRunTracker(): InstanceRunTracker {
  return processRunTracker;
}

function log(severity: 'WARN' | 'ERROR', message: string, extra?: RunData): void {
  console.log(JSON.stringify({ severity, message, ...extra }));
}

function isActiveStatus(status: unknown): boolean {
  return status === 'queued' || status === 'running';
}

function readInstanceId(data: RunData | undefined): string | null {
  const value = data?.instanceId;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function timestampToMillis(value: unknown): number | null {
  if (value == null || typeof value !== 'object') return null;
  const candidate = value as { toMillis?: () => number; seconds?: unknown; nanoseconds?: unknown };
  if (typeof candidate.toMillis === 'function') {
    const ms = candidate.toMillis();
    return typeof ms === 'number' && Number.isFinite(ms) ? ms : null;
  }
  if (typeof candidate.seconds !== 'number' || !Number.isFinite(candidate.seconds)) return null;
  const nanos = typeof candidate.nanoseconds === 'number' && Number.isFinite(candidate.nanoseconds)
    ? candidate.nanoseconds
    : 0;
  return candidate.seconds * 1000 + Math.floor(nanos / 1e6);
}

function isStale(updatedAt: unknown, nowMs: number, staleAfterMs: number): boolean {
  const updatedMs = timestampToMillis(updatedAt);
  if (updatedMs === null) return false;
  return nowMs - updatedMs > staleAfterMs;
}

function failurePatch(lastError: string, now: unknown): RunData {
  return { status: 'failed', lastError, updatedAt: now };
}

function runs(db: Firestore) {
  return db.collection('harnessRuns');
}

async function updateIfActive(
  db: Firestore,
  ref: DocumentReference,
  decide: (data: RunData) => RunData | null,
): Promise<boolean> {
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const patch = decide((snap.data() ?? {}) as RunData);
    if (!patch) return false;
    tx.update(snap.ref, patch as UpdateData<RunData>);
    return true;
  });
}

export async function claimHarnessRun(
  db: Firestore,
  runId: string,
  tracker: InstanceRunTracker = processRunTracker,
): Promise<void> {
  tracker.claim(runId);
  try {
    await runs(db).doc(runId).update({ instanceId: tracker.instanceId });
  } catch (err) {
    log('WARN', `Failed to stamp harness run instanceId: ${String(err)}`, {
      runId,
      instanceId: tracker.instanceId,
    });
  }
}

export function releaseHarnessRun(runId: string, tracker: InstanceRunTracker = processRunTracker): void {
  tracker.release(runId);
}

export function startOwnedRunHeartbeat(
  db: Firestore,
  runId: string,
  tracker: InstanceRunTracker = processRunTracker,
  intervalMs = RUN_HEARTBEAT_MS,
  now: () => unknown = () => admin.firestore.Timestamp.now(),
): () => void {
  const timer = setInterval(() => {
    if (!tracker.ownedRunIds.has(runId)) return;
    void runs(db).doc(runId).update({ updatedAt: now() as admin.firestore.Timestamp }).catch((err) => {
      log('WARN', `Harness run heartbeat failed: ${String(err)}`, { runId });
    });
  }, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
  return () => clearInterval(timer);
}

async function ownedCandidateIds(db: Firestore, ownership: InstanceRunTracker): Promise<Map<string, DocumentReference>> {
  const refs = new Map<string, DocumentReference>();
  for (const runId of ownership.ownedRunIds) {
    const snap = await runs(db).doc(runId).get();
    if (snap.exists) refs.set(snap.id, snap.ref);
  }
  const stamped = await runs(db).where('instanceId', '==', ownership.instanceId).get();
  for (const doc of stamped.docs) refs.set(doc.id, doc.ref);
  return refs;
}

export async function reclaimStuckRuns(
  db: Firestore,
  clock: ShutdownClock,
  options?: { staleAfterMs?: number; excludeRunIds?: ReadonlySet<string> },
): Promise<string[]> {
  const staleAfterMs = options?.staleAfterMs ?? STUCK_RUN_STALE_MS;
  const exclude = options?.excludeRunIds ?? new Set<string>();
  const active = await runs(db).where('status', 'in', [...ACTIVE_STATUSES]).get();
  const reclaimed: string[] = [];

  for (const doc of active.docs) {
    if (exclude.has(doc.id)) continue;
    try {
      const updated = await updateIfActive(db, doc.ref, (data) => {
        if (exclude.has(doc.id)) return null;
        if (!isActiveStatus(data.status)) return null;
        if (!isStale(data.updatedAt, clock.nowMs, staleAfterMs)) return null;
        return failurePatch(STUCK_RUN_TIMEOUT, clock.now);
      });
      if (updated) reclaimed.push(doc.id);
    } catch (err) {
      log('ERROR', `Stuck harness run reclaim failed: ${String(err)}`, { runId: doc.id });
    }
  }

  reclaimed.sort();
  return reclaimed;
}

export async function handleInstanceShutdown(
  db: Firestore,
  ownership: InstanceRunTracker,
  clock: ShutdownClock,
  options?: { staleAfterMs?: number },
): Promise<ShutdownResult> {
  const candidates = await ownedCandidateIds(db, ownership);
  const excludeFromReclaim = new Set(ownership.ownedRunIds);
  const ownedFailed: string[] = [];

  for (const [runId, ref] of candidates) {
    const snap = await ref.get();
    const data = (snap.data() ?? {}) as RunData;
    const stamped = readInstanceId(data);
    if (ownership.ownedRunIds.has(runId) && stamped && stamped !== ownership.instanceId) {
      excludeFromReclaim.delete(runId);
    }
  }

  for (const [runId, ref] of candidates) {
    try {
      const updated = await updateIfActive(db, ref, (data) => {
        if (!isActiveStatus(data.status)) return null;
        const stamped = readInstanceId(data);
        if (stamped && stamped !== ownership.instanceId) return null;
        if (!stamped && !ownership.ownedRunIds.has(runId)) return null;
        return failurePatch(CLOUD_RUN_TERMINATED, clock.now);
      });
      if (updated) ownedFailed.push(runId);
    } catch (err) {
      log('ERROR', `SIGTERM cleanup failed for run: ${String(err)}`, { runId });
    }
  }

  const reclaimed = await reclaimStuckRuns(db, clock, {
    staleAfterMs: options?.staleAfterMs,
    excludeRunIds: excludeFromReclaim,
  });
  ownedFailed.sort();
  return { ownedFailed, reclaimed };
}

function defaultClock(): ShutdownClock {
  return { nowMs: Date.now(), now: admin.firestore.Timestamp.now() };
}

export function startStuckRunReclaimer(
  db: Firestore,
  tracker: InstanceRunTracker = processRunTracker,
  intervalMs = STUCK_RUN_RECLAIM_INTERVAL_MS,
  clock: () => ShutdownClock = defaultClock,
): () => void {
  const tick = (reason: string) => {
    const sample = clock();
    void reclaimStuckRuns(db, sample, { excludeRunIds: tracker.ownedRunIds })
      .then((ids) => {
        if (ids.length > 0) {
          log('WARN', `Reclaimed ${ids.length} stuck harness runs`, { reason });
        }
      })
      .catch((err) => {
        log('ERROR', `Stuck harness run reclaim failed: ${String(err)}`, { reason });
      });
  };

  tick('startup');
  const timer = setInterval(() => tick('interval'), intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
  return () => clearInterval(timer);
}
