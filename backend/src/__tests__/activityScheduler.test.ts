// Runs the real processScheduledActivityMessages against an in-memory Firestore.

let mockNowMs = Date.parse('2026-11-16T04:00:00Z');
const mockTs = (ms: number) => ({ seconds: Math.floor(ms / 1000), nanoseconds: 0, toMillis: () => ms });

jest.mock('firebase-admin', () => ({
  firestore: { Timestamp: { now: () => mockTs(mockNowMs) } },
}));

type Data = Record<string, any>;
const mockStore = new Map<string, Data>();
const mockState = { queryReads: [] as number[], missingIndexFields: new Set<string>(), failWrites: false, autoId: 0 };

function mockClone<T>(value: T): T {
  if (value === null || typeof value !== 'object' || value instanceof Date) return value;
  if (typeof (value as any).toMillis === 'function') return value; // timestamps are immutable
  if (Array.isArray(value)) return value.map(mockClone) as unknown as T;
  return Object.fromEntries(Object.entries(value as object).map(([k, v]) => [k, mockClone(v)])) as T;
}

function mockMs(value: any): number | null {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value.toMillis === 'function') return value.toMillis();
  return typeof value === 'number' ? value : null;
}

function mockDocRef(path: string) {
  const ref = {
    path,
    id: path.split('/').pop()!,
    get: async () => mockSnap(path),
    update: async (patch: Data) => {
      if (mockState.failWrites) throw new Error('process died');
      if (!mockStore.has(path)) throw new Error(`no doc ${path}`);
      mockStore.set(path, { ...mockStore.get(path), ...mockClone(patch) });
    },
    set: async (data: Data) => {
      if (mockState.failWrites) throw new Error('process died');
      mockStore.set(path, mockClone(data));
    },
  };
  return ref;
}

function mockSnap(path: string) {
  const data = mockStore.get(path);
  return { exists: data !== undefined, id: path.split('/').pop()!, ref: mockDocRef(path), data: () => (data ? mockClone(data) : undefined) };
}

function mockQuery(group: string, filters: Array<[string, string, any]> = [], order: string | null = null, max: number | null = null): any {
  return {
    where: (field: string, op: string, value: any) => mockQuery(group, [...filters, [field, op, value]], order, max),
    orderBy: (field: string) => mockQuery(group, filters, field, max),
    limit: (n: number) => mockQuery(group, filters, order, n),
    get: async () => {
      const fields = [...filters.map(f => f[0]), ...(order ? [order] : [])];
      if (fields.some(f => mockState.missingIndexFields.has(f))) {
        throw Object.assign(new Error('The query requires an index'), { code: 9 });
      }
      let paths = [...mockStore.keys()].filter(p => p.split('/').slice(-2, -1)[0] === group);
      paths = paths.filter(p => {
        const d = mockStore.get(p)!;
        return filters.every(([field, op, value]) => {
          if (op === '==') return (d[field] ?? null) === value && field in d;
          const a = mockMs(d[field]);
          return a !== null && a <= mockMs(value)!;
        }) && (!order || d[order] != null);
      });
      if (order) {
        paths.sort((a, b) => {
          const x = mockStore.get(a)![order], y = mockStore.get(b)![order];
          return typeof x === 'string' ? x.localeCompare(y) : mockMs(x)! - mockMs(y)!;
        });
      }
      if (max !== null) paths = paths.slice(0, max);
      mockState.queryReads.push(paths.length);
      return { empty: paths.length === 0, docs: paths.map(mockSnap) };
    },
  };
}

const mockDb = {
  collectionGroup: (name: string) => mockQuery(name),
  collection: (name: string) => ({
    doc: (id: string) => mockDocRef(`${name}/${id}`),
    add: async (data: Data) => {
      if (mockState.failWrites) throw new Error('process died');
      mockStore.set(`${name}/auto_${++mockState.autoId}`, mockClone(data));
    },
  }),
  runTransaction: async (fn: (t: any) => Promise<unknown>) => {
    const writes: Array<() => Promise<void>> = [];
    const result = await fn({
      get: (ref: { get: () => Promise<unknown> }) => ref.get(),
      update: (ref: { update: (p: Data) => Promise<void> }, patch: Data) => { writes.push(() => ref.update(patch)); },
    });
    for (const write of writes) await write();
    return result;
  },
};

jest.mock('../firebase', () => ({ getDb: () => mockDb }));

const mockPush = jest.fn<Promise<string | null>, [string, string, string]>();
jest.mock('../line', () => ({ pushLineText: (to: string, text: string, key: string) => mockPush(to, text, key) }));

import { processScheduledActivityMessages, resetBackfillStateForTests } from '../services/activityScheduler';
import { MAX_SEND_ATTEMPTS, SEND_LOCK_TTL_MS, isSendLockActive } from '../services/activitySchedule';

const MIN = 60 * 1000;
const START = Date.parse('2026-11-16T04:00:00Z');
const iso = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z');
const MSG = 'activities/act_1/activityMessages/msg_1';

function seedMessage(id: string, overrides: Data = {}, legacy = false): string {
  const triggerValue = overrides.triggerValue ?? iso(START - 60 * MIN);
  const path = `activities/act_1/activityMessages/${id}`;
  mockStore.set(path, {
    id, activityId: 'act_1', userId: 'user_1', content: '明天見囉！', targetGroups: ['Ca'],
    triggerType: 'scheduled', triggerValue,
    ...(legacy ? {} : { triggerAt: new Date(Date.parse(triggerValue)) }),
    status: 'pending', reviewStatus: 'approved', processingAt: null,
    sendWindowStart: null, sendWindowEnd: null, sentAt: null,
    ...overrides,
  });
  return path;
}

function markBackfillFinished() {
  mockStore.set('systemState/activityMessageTriggerAtBackfill', { firstRunAtMs: 0, lastRunAtMs: 2 * 24 * 60 * MIN });
}

const pushedGroups = () => mockPush.mock.calls.map(call => call[0]);
const sendLogs = () => [...mockStore.entries()].filter(([p]) => p.startsWith('sendLogs/')).map(([, d]) => d);

beforeEach(() => {
  mockStore.clear();
  mockState.queryReads = [];
  mockState.missingIndexFields = new Set();
  mockState.failWrites = false;
  mockNowMs = START;
  mockPush.mockReset();
  mockPush.mockResolvedValue('line_msg');
  resetBackfillStateForTests();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  mockStore.set('activities/act_1', { id: 'act_1', userId: 'user_1', status: 'active', reviewStatus: 'approved' });
  for (const gid of ['Ca', 'Cb', 'Cc']) mockStore.set(`groups/${gid}`, { userId: 'user_1', isActive: true });
  markBackfillFinished();
});

afterEach(() => jest.restoreAllMocks());

describe('到期查詢', () => {
  it('讀取筆數等於到期筆數，不把未到期的也撈回來', async () => {
    for (let i = 0; i < 3; i++) seedMessage(`due_${i}`, { triggerValue: iso(START - (i + 1) * MIN) });
    for (let i = 0; i < 5; i++) seedMessage(`future_${i}`, { triggerValue: iso(START + (i + 1) * 60 * MIN) });
    for (let i = 0; i < 2; i++) seedMessage(`draft_${i}`, { reviewStatus: 'pending_review' });

    expect(await processScheduledActivityMessages()).toBe(3);
    expect(mockState.queryReads).toEqual([3]);
    expect(mockPush).toHaveBeenCalledTimes(3);
  });

  it('帶時區的時間用時間點比較：+08:00 還沒到就不發', async () => {
    // 字串排序上比現在（Z）小，實際上是一小時後。
    seedMessage('msg_1', { triggerValue: '2026-11-16T13:00:00+08:00' });
    expect(await processScheduledActivityMessages()).toBe(0);
    expect(mockState.queryReads).toEqual([0]);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('索引還沒建好時退回舊查詢，照樣發得出去', async () => {
    mockState.missingIndexFields.add('triggerAt');
    seedMessage('msg_1');
    seedMessage('future', { triggerValue: iso(START + 60 * MIN) });
    expect(await processScheduledActivityMessages()).toBe(1);
    expect(pushedGroups()).toEqual(['Ca']);
  });

  it('其他查詢錯誤不吞掉', async () => {
    mockDb.collectionGroup = () => ({ where: () => { throw Object.assign(new Error('boom'), { code: 14 }); } }) as any;
    await expect(processScheduledActivityMessages()).rejects.toThrow('boom');
    mockDb.collectionGroup = (name: string) => mockQuery(name);
  });
});

describe('不該發的不發', () => {
  it.each([
    ['活動不是進行中', () => { mockStore.get('activities/act_1')!.status = 'completed'; }],
    ['活動還沒核准', () => { mockStore.get('activities/act_1')!.reviewStatus = 'pending_review'; }],
    ['活動是別人的', () => { mockStore.get('activities/act_1')!.userId = 'someone_else'; }],
    ['發送時段還沒開始', () => { mockStore.get(MSG)!.sendWindowStart = mockTs(START + MIN); }],
  ])('%s', async (_name, arrange) => {
    seedMessage('msg_1');
    arrange();
    expect(await processScheduledActivityMessages()).toBe(0);
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockStore.get(MSG)).toMatchObject({ status: 'pending', processingAt: null });
  });

  it('發送時段過了就標成失敗並留紀錄', async () => {
    seedMessage('msg_1', { sendWindowEnd: mockTs(START - MIN) });
    expect(await processScheduledActivityMessages()).toBe(0);
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockStore.get(MSG)).toMatchObject({ status: 'failed', processingAt: null });
    expect(sendLogs()).toEqual([expect.objectContaining({ status: 'failed', errorMessage: 'Send window expired', activityMessageId: 'msg_1' })]);
  });
});

describe('鎖的逾時回收', () => {
  it('鎖定後當機：鎖還新時不碰，逾時後重領，已記下的群不重發', async () => {
    seedMessage('msg_1', { targetGroups: ['Ca', 'Cb', 'Cc'] });
    // 發到 Cb 的當下行程掛掉：LINE 已收下 Cb，但之後什麼都寫不進去。
    mockPush.mockImplementation(async (to) => {
      if (to === 'Cb') mockState.failWrites = true;
      return 'line_msg';
    });
    await expect(processScheduledActivityMessages()).rejects.toThrow('process died');
    expect(pushedGroups()).toEqual(['Ca', 'Cb']);
    expect(mockStore.get(MSG)).toMatchObject({ status: 'pending' });
    expect(mockStore.get(MSG)!.processingAt).not.toBeNull();

    mockState.failWrites = false;
    mockPush.mockReset();
    mockPush.mockResolvedValue('line_msg');

    // 鎖還沒逾時：下一輪不能搶。
    mockNowMs = START + SEND_LOCK_TTL_MS - MIN;
    expect(await processScheduledActivityMessages()).toBe(0);
    expect(mockPush).not.toHaveBeenCalled();

    // 逾時後重領。
    mockNowMs = START + SEND_LOCK_TTL_MS + MIN;
    expect(await processScheduledActivityMessages()).toBe(1);
    expect(pushedGroups()).toEqual(['Cb', 'Cc']); // Ca 已記下成功，不再發
    expect(mockStore.get(MSG)).toMatchObject({ status: 'sent', processingAt: null });

    // 再跑一輪也不會再發。
    mockNowMs += MIN;
    expect(await processScheduledActivityMessages()).toBe(0);
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it('沒來得及記下的那一群，重發時帶同一個 retry key（LINE 端只收一次）', async () => {
    seedMessage('msg_1', { targetGroups: ['Ca', 'Cb'] });
    mockPush.mockImplementation(async (to) => {
      if (to === 'Cb') mockState.failWrites = true;
      return 'line_msg';
    });
    await expect(processScheduledActivityMessages()).rejects.toThrow();
    const firstKey = mockPush.mock.calls.find(call => call[0] === 'Cb')![2];
    const otherGroupKey = mockPush.mock.calls.find(call => call[0] === 'Ca')![2];

    mockState.failWrites = false;
    mockPush.mockReset();
    mockPush.mockResolvedValue(null); // 409：LINE 說這把 key 已經收過
    mockNowMs = START + SEND_LOCK_TTL_MS + MIN;
    expect(await processScheduledActivityMessages()).toBe(1);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls[0][2]).toBe(firstKey);
    expect(firstKey).not.toBe(otherGroupKey);
    expect(firstKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('isSendLockActive：沒鎖、鎖還新、鎖過期', () => {
    expect(isSendLockActive(null, START)).toBe(false);
    expect(isSendLockActive(mockTs(START - MIN), START)).toBe(true);
    expect(isSendLockActive(mockTs(START - SEND_LOCK_TTL_MS), START)).toBe(false);
  });
});

describe('部分失敗', () => {
  it('三群中一群失敗：訊息留在待發送，下一輪只重試那一群', async () => {
    seedMessage('msg_1', { targetGroups: ['Ca', 'Cb', 'Cc'] });
    mockPush.mockImplementation(async (to) => {
      if (to === 'Cb') throw Object.assign(new Error('LINE 500'), { status: 500 });
      return 'line_msg';
    });
    expect(await processScheduledActivityMessages()).toBe(0);
    expect(pushedGroups()).toEqual(['Ca', 'Cb', 'Cc']);
    const afterFirst = mockStore.get(MSG)!;
    expect(afterFirst).toMatchObject({ status: 'pending', processingAt: null, sendAttempts: 1 });
    expect(afterFirst.deliveries.Ca).toMatchObject({ status: 'sent', attempts: 1 });
    expect(afterFirst.deliveries.Cb).toMatchObject({ status: 'failed', attempts: 1, retryable: true });
    expect(afterFirst.deliveries.Cc).toMatchObject({ status: 'sent', attempts: 1 });
    expect(afterFirst.nextRetryAt.getTime()).toBeGreaterThan(START);

    mockPush.mockReset();
    mockPush.mockResolvedValue('line_msg_2');

    // 退避時間還沒到：不重試。
    mockNowMs = START + 1000;
    expect(await processScheduledActivityMessages()).toBe(0);
    expect(mockPush).not.toHaveBeenCalled();

    mockNowMs = START + MIN;
    expect(await processScheduledActivityMessages()).toBe(1);
    expect(pushedGroups()).toEqual(['Cb']);
    const done = mockStore.get(MSG)!;
    expect(done).toMatchObject({ status: 'sent', processingAt: null, nextRetryAt: null, sendAttempts: 2 });
    expect(done.deliveries.Cb).toMatchObject({ status: 'sent', attempts: 2, lineMessageId: 'line_msg_2' });
    expect(sendLogs().filter(log => log.status === 'success').map(log => log.groupId).sort()).toEqual(['Ca', 'Cb', 'Cc']);
    expect(sendLogs().filter(log => log.status === 'failed').map(log => log.groupId)).toEqual(['Cb']);
  });

  it('重試也救不回來的（群組已停用）直接標失敗，成功的群有記下來', async () => {
    seedMessage('msg_1', { targetGroups: ['Ca', 'Cb'] });
    mockStore.get('groups/Cb')!.isActive = false;
    expect(await processScheduledActivityMessages()).toBe(0);
    expect(pushedGroups()).toEqual(['Ca']);
    const msg = mockStore.get(MSG)!;
    expect(msg).toMatchObject({ status: 'failed', processingAt: null });
    expect(msg.deliveries.Ca.status).toBe('sent');
    expect(msg.deliveries.Cb).toMatchObject({ status: 'failed', retryable: false });
  });

  it('LINE 回 4xx 不重試', async () => {
    seedMessage('msg_1');
    mockPush.mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));
    await processScheduledActivityMessages();
    expect(mockStore.get(MSG)).toMatchObject({ status: 'failed', sendAttempts: 1 });
  });

  it(`一直失敗：試滿 ${MAX_SEND_ATTEMPTS} 輪就標失敗，不會無限重試`, async () => {
    seedMessage('msg_1');
    mockPush.mockRejectedValue(Object.assign(new Error('LINE 503'), { status: 503 }));
    for (let round = 0; round < MAX_SEND_ATTEMPTS + 3; round++) {
      await processScheduledActivityMessages();
      mockNowMs += 15 * MIN;
    }
    expect(mockPush).toHaveBeenCalledTimes(MAX_SEND_ATTEMPTS);
    expect(mockStore.get(MSG)).toMatchObject({ status: 'failed', processingAt: null, sendAttempts: MAX_SEND_ATTEMPTS });
  });
});

describe('舊資料補 triggerAt', () => {
  it('沒有 triggerAt 的舊訊息會被補上並照常發送，之後不再全撈', async () => {
    mockStore.delete('systemState/activityMessageTriggerAtBackfill');
    seedMessage('old_due', {}, true);
    seedMessage('old_future', { triggerValue: iso(START + 60 * MIN), reviewStatus: 'pending_review' }, true);

    expect(await processScheduledActivityMessages()).toBe(1);
    expect(mockStore.get('activities/act_1/activityMessages/old_future')!.triggerAt.getTime()).toBe(START + 60 * MIN);
    expect(mockState.queryReads).toEqual([2, 1]); // 補資料讀 2 筆，到期查詢讀 1 筆

    // 10 分鐘內不再補。
    mockState.queryReads = [];
    mockNowMs += MIN;
    await processScheduledActivityMessages();
    expect(mockState.queryReads).toEqual([0]);

    // 首次補完滿 24 小時後的那一次是最後一次，之後永久關閉。
    mockNowMs = START + 25 * 60 * MIN;
    await processScheduledActivityMessages();
    mockState.queryReads = [];
    mockNowMs += 60 * MIN;
    await processScheduledActivityMessages();
    await processScheduledActivityMessages();
    expect(mockState.queryReads).toEqual([0, 0]);
  });

  it('補資料失敗不影響發送', async () => {
    mockStore.delete('systemState/activityMessageTriggerAtBackfill');
    mockState.missingIndexFields.add('triggerValue');
    seedMessage('msg_1');
    expect(await processScheduledActivityMessages()).toBe(1);
  });
});
