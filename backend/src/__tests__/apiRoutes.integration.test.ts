import http from 'http';
import type { AddressInfo } from 'net';

const mockVerifyIdToken = jest.fn();
const mockGetDb = jest.fn();
const mockEnsureFirebaseApp = jest.fn();
const mockListActivities = jest.fn();
const mockCreateActivity = jest.fn();
const mockGetActivity = jest.fn();
const mockUpdateActivity = jest.fn();
const mockApproveActivity = jest.fn();
const mockRequestRevision = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockIsNearLimit = jest.fn();
const mockIsCloudTasksEnabled = jest.fn();
const mockEnqueueHarnessRun = jest.fn();
const mockCreateLLMProvider = jest.fn();
const mockExecuteHarness = jest.fn();

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: { applicationDefault: jest.fn(() => ({})) },
  auth: () => ({ verifyIdToken: mockVerifyIdToken }),
  firestore: {
    Timestamp: {
      now: () => ({ _seconds: 1_700_000_000, _nanoseconds: 0, seconds: 1_700_000_000, toMillis: () => 1_700_000_000_000 }),
      fromDate: (date: Date) => ({ _seconds: Math.floor(date.getTime() / 1000), _nanoseconds: 0 }),
      fromMillis: (ms: number) => ({ _seconds: Math.floor(ms / 1000), _nanoseconds: 0, toMillis: () => ms }),
    },
  },
}));

jest.mock('@line/bot-sdk', () => ({
  middleware: jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  Client: jest.fn().mockImplementation(() => ({
    pushMessage: jest.fn().mockResolvedValue({ messageId: 'line_msg_1' }),
    getGroupSummary: jest.fn(),
    getGroupMembersCount: jest.fn(),
  })),
}));

jest.mock('../firebase', () => ({
  getDb: () => mockGetDb(),
  ensureFirebaseApp: () => mockEnsureFirebaseApp(),
}));

jest.mock('../services/activityService', () => ({
  createActivity: (...args: unknown[]) => mockCreateActivity(...args),
  getActivity: (...args: unknown[]) => mockGetActivity(...args),
  listActivities: (...args: unknown[]) => mockListActivities(...args),
  updateActivity: (...args: unknown[]) => mockUpdateActivity(...args),
  approveActivity: (...args: unknown[]) => mockApproveActivity(...args),
  requestRevision: (...args: unknown[]) => mockRequestRevision(...args),
  listMessages: jest.fn().mockResolvedValue([]),
  createMessage: jest.fn(),
  updateMessage: jest.fn(),
  deleteMessage: jest.fn(),
  listKnowledge: jest.fn().mockResolvedValue([]),
  createKnowledge: jest.fn(),
  updateKnowledge: jest.fn(),
  deleteKnowledge: jest.fn(),
}));

jest.mock('../services/rateLimitService', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  isNearLimit: (...args: unknown[]) => mockIsNearLimit(...args),
}));

jest.mock('../services/cloudTasksService', () => ({
  isCloudTasksEnabled: () => mockIsCloudTasksEnabled(),
  enqueueHarnessRun: (...args: unknown[]) => mockEnqueueHarnessRun(...args),
}));

jest.mock('../services/llmProvider', () => ({
  createLLMProvider: () => mockCreateLLMProvider(),
  getLLMConfigStatus: () => ({ provider: 'test', missingEnv: [], isConfigured: false }),
  setLLMCallObserver: jest.fn(),
}));

jest.mock('../services/harnessOrchestrator', () => ({
  executeHarness: (...args: unknown[]) => mockExecuteHarness(...args),
}));

import { createApp } from '../app';

type JsonResponse = {
  status: number;
  body: any;
  headers: http.IncomingHttpHeaders;
};

async function request(
  server: http.Server,
  method: string,
  path: string,
  body?: unknown,
  token = 'valid-token',
  extraHeaders?: Record<string, string>,
): Promise<JsonResponse> {
  const address = server.address() as AddressInfo;
  const payload = body === undefined ? undefined : JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: address.port,
        // Every test closes and recreates its server on the same allowed port.
        // Do not reuse a global-agent socket belonging to the previous server.
        agent: false,
        method,
        path,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(extraHeaders ?? {}),
        },
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            body: data ? JSON.parse(data) : null,
            headers: res.headers,
          });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function makeHarnessDb() {
  const runRef = {
    id: 'run_1',
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
  };
  return {
    collection: jest.fn((name: string) => ({
      doc: jest.fn(() => (name === 'harnessRuns' ? runRef : { id: 'doc_1' })),
    })),
    runRef,
  };
}

describe('backend API route integration safety net', () => {
  let server: http.Server;

  beforeEach((done) => {
    jest.clearAllMocks();
    process.env.INTERNAL_HARNESS_SECRET = 'test-secret';
    process.env.SCHEDULER_SECRET = 'sched-secret';
    delete process.env.CLOUD_TASKS_QUEUE;
    delete process.env.CLOUD_RUN_SERVICE_URL;
    delete process.env.LIFF_DEV_BYPASS_USER;
    delete process.env.LIFF_CHANNEL_ID;
    mockVerifyIdToken.mockResolvedValue({ uid: 'user_a' });
    mockIsNearLimit.mockReturnValue(false);
    server = createApp().listen(4129, '127.0.0.1', done);
  });

  afterEach((done) => {
    if (server) {
      server.close(done);
      return;
    }
    done();
  });

  it('returns Cloud Run health with an ISO timestamp', async () => {
    const res = await request(server, 'GET', '/health', undefined, '');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('enforces auth before /api/groups data access', async () => {
    const res = await request(server, 'GET', '/api/groups', undefined, '');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Missing Authorization header' });
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('rejects non-owner accounts on back-office routes when OWNER_USER_ID is set', async () => {
    process.env.OWNER_USER_ID = 'owner_uid';
    try {
      const res = await request(server, 'GET', '/api/groups');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Forbidden', code: 'not_owner' });
    } finally {
      delete process.env.OWNER_USER_ID;
    }
  });

  it.each([
    ['unset', undefined],
    ['blank', ''],
    ['whitespace', '   '],
  ] as const)('returns 503 from /api/groups when production has OWNER_USER_ID %s', async (_label, owner) => {
    const previousOwner = process.env.OWNER_USER_ID;
    const previousService = process.env.K_SERVICE;
    process.env.K_SERVICE = 'wippy-backend';
    if (owner === undefined) delete process.env.OWNER_USER_ID;
    else process.env.OWNER_USER_ID = owner;
    try {
      const res = await request(server, 'GET', '/api/groups');
      expect(res.status).toBe(503);
      expect(res.body).toEqual({ error: 'WiPPY 尚未設定擁有者，請聯絡管理員', code: 'owner_not_configured' });
      expect(mockGetDb).not.toHaveBeenCalled();
    } finally {
      if (previousOwner === undefined) delete process.env.OWNER_USER_ID;
      else process.env.OWNER_USER_ID = previousOwner;
      if (previousService === undefined) delete process.env.K_SERVICE;
      else process.env.K_SERVICE = previousService;
    }
  });

  it('still serves /api/groups to the configured owner in production', async () => {
    const previousOwner = process.env.OWNER_USER_ID;
    const previousService = process.env.K_SERVICE;
    process.env.K_SERVICE = 'wippy-backend';
    process.env.OWNER_USER_ID = 'user_a';
    const query = { where: jest.fn(), orderBy: jest.fn(), get: jest.fn() };
    query.where.mockReturnValue(query);
    query.orderBy.mockReturnValue(query);
    query.get.mockResolvedValue({ docs: [] });
    mockGetDb.mockReturnValue({ collection: () => query });
    try {
      const res = await request(server, 'GET', '/api/groups');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ groups: [] });
    } finally {
      if (previousOwner === undefined) delete process.env.OWNER_USER_ID;
      else process.env.OWNER_USER_ID = previousOwner;
      if (previousService === undefined) delete process.env.K_SERVICE;
      else process.env.K_SERVICE = previousService;
    }
  });

  it('queries /api/groups by authenticated owner and hides backend-only fields', async () => {
    const where = jest.fn().mockReturnThis();
    const orderBy = jest.fn().mockReturnThis();
    const get = jest.fn().mockResolvedValue({
      docs: [{
        data: () => ({
          groupId: 'group_a',
          userId: 'user_a',
          officialAccountId: 'oa_1',
          name: 'VIP group',
          memberCount: 12,
          lastMessageAt: { _seconds: 1, _nanoseconds: 0 },
          lastMessagePreview: 'hello',
          isActive: true,
        }),
      }],
    });
    mockGetDb.mockReturnValue({ collection: jest.fn(() => ({ where, orderBy, get })) });

    const res = await request(server, 'GET', '/api/groups');

    expect(res.status).toBe(200);
    expect(where).toHaveBeenCalledWith('userId', '==', 'user_a');
    expect(where).toHaveBeenCalledWith('isActive', '==', true);
    expect(res.body).toEqual({
      groups: [{
        groupId: 'group_a',
        name: 'VIP group',
        memberCount: 12,
        lastMessageAt: { _seconds: 1, _nanoseconds: 0 },
        lastMessagePreview: 'hello',
        isActive: true,
      }],
    });
  });

  it('returns 404 when a user requests another owner group messages', async () => {
    mockGetDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ userId: 'user_b' }) }),
        })),
      })),
    });

    const res = await request(server, 'GET', '/api/groups/group_b/messages');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Group not found' });
  });

  it('covers activity list, create, update, approve, and request-revision route contracts', async () => {
    const db = { tag: 'db' };
    const activity = {
      id: 'act_1',
      userId: 'user_a',
      name: 'Launch',
      targetGroups: ['group_a'],
      status: 'draft',
      reviewStatus: 'pending_review',
      approvedAt: null,
      agentSessionId: null,
      eventStartAt: null,
      eventEndAt: null,
      createdAt: { _seconds: 1, _nanoseconds: 0 },
      updatedAt: { _seconds: 1, _nanoseconds: 0 },
    };
    mockGetDb.mockReturnValue(db);
    mockListActivities.mockResolvedValue([activity]);
    mockCreateActivity.mockResolvedValue(activity);
    mockUpdateActivity.mockResolvedValue({ ...activity, name: 'Updated' });
    mockApproveActivity.mockResolvedValue({ ...activity, status: 'active', reviewStatus: 'approved' });
    mockRequestRevision.mockResolvedValue({ ...activity, reviewStatus: 'revision_requested' });

    await expect(request(server, 'GET', '/api/activities')).resolves.toMatchObject({
      status: 200,
      body: { activities: [activity] },
    });
    await expect(request(server, 'POST', '/api/activities', { name: ' Launch ', targetGroups: ['group_a'] }))
      .resolves.toMatchObject({ status: 201, body: { activity } });
    await expect(request(server, 'PATCH', '/api/activities/act_1', { name: 'Updated' }))
      .resolves.toMatchObject({ status: 200, body: { activity: expect.objectContaining({ name: 'Updated' }) } });
    await expect(request(server, 'PATCH', '/api/activities/act_1/approve'))
      .resolves.toMatchObject({ status: 200, body: { activity: expect.objectContaining({ reviewStatus: 'approved' }) } });
    await expect(request(server, 'PATCH', '/api/activities/act_1/request-revision'))
      .resolves.toMatchObject({ status: 200, body: { activity: expect.objectContaining({ reviewStatus: 'revision_requested' }) } });

    expect(mockCreateActivity).toHaveBeenCalledWith(db, 'user_a', { name: 'Launch', targetGroups: ['group_a'] });
    expect(mockUpdateActivity).toHaveBeenCalledWith(db, 'act_1', 'user_a', { name: 'Updated' });
  });

  it('keeps activity validation and ownership misses in consistent error shapes', async () => {
    mockGetDb.mockReturnValue({});
    mockGetActivity.mockResolvedValue(null);

    await expect(request(server, 'POST', '/api/activities', { targetGroups: [] }))
      .resolves.toMatchObject({ status: 400, body: { error: 'name is required' } });
    await expect(request(server, 'GET', '/api/activities/other_user_activity'))
      .resolves.toMatchObject({ status: 404, body: { error: 'Activity not found' } });
  });

  it('returns rate_limited for /api/agent/chat before creating harness work', async () => {
    mockGetDb.mockReturnValue({});
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 42,
      windowResetInSeconds: 42,
    });

    const res = await request(server, 'POST', '/api/agent/chat', {
      activityId: 'act_1',
      message: 'plan this',
      sessionId: 'session_1',
    });

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      status: 'rate_limited',
      runId: '',
      sessionId: 'session_1',
      retryAfterSeconds: 42,
    });
  });

  it('returns queued for /api/agent/chat when Cloud Tasks is enabled', async () => {
    const db = makeHarnessDb();
    mockGetDb.mockReturnValue(db);
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, retryAfterSeconds: 0, windowResetInSeconds: 60 });
    mockIsCloudTasksEnabled.mockReturnValue(true);
    mockEnqueueHarnessRun.mockResolvedValue(undefined);

    const res = await request(server, 'POST', '/api/agent/chat', {
      activityId: 'act_1',
      message: 'plan this',
      sessionId: 'session_1',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'queued', runId: 'run_1', sessionId: 'session_1' });
    expect(mockEnqueueHarnessRun).toHaveBeenCalledWith(expect.objectContaining({
      runId: 'run_1',
      activityId: 'act_1',
      userId: 'user_a',
    }));
  });

  it('returns completed for /api/agent/chat in sync mode', async () => {
    const db = makeHarnessDb();
    const llm = { provider: 'mock' };
    mockGetDb.mockReturnValue(db);
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, retryAfterSeconds: 0, windowResetInSeconds: 60 });
    mockIsCloudTasksEnabled.mockReturnValue(false);
    mockCreateLLMProvider.mockReturnValue(llm);
    mockExecuteHarness.mockResolvedValue({
      sessionId: 'session_2',
      reply: 'Done',
      generatedMessageCount: 2,
      extractedKnowledgeCount: 1,
    });

    const res = await request(server, 'POST', '/api/agent/chat', {
      activityId: 'act_1',
      message: 'plan this',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'completed',
      runId: 'run_1',
      sessionId: 'session_2',
      reply: 'Done',
      generatedMessageCount: 2,
      extractedKnowledgeCount: 1,
    });
  });
  it('runs /scheduler/tick for activity messages only and reports sent count', async () => {
    const query: Record<string, jest.Mock> = {};
    query.where = jest.fn(() => query);
    query.orderBy = jest.fn(() => query);
    query.limit = jest.fn(() => query);
    query.get = jest.fn().mockResolvedValue({ empty: true, docs: [], size: 0 });
    const collectionGroup = jest.fn(() => query);
    mockGetDb.mockReturnValue({ collectionGroup });

    const res = await request(server, 'POST', '/scheduler/tick', undefined, '', {
      'X-Scheduler-Secret': 'sched-secret',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, sent: 0 });
    expect(collectionGroup).toHaveBeenCalledTimes(1);
    expect(collectionGroup).toHaveBeenCalledWith('activityMessages');
  });

  it('returns 500 from /scheduler/tick when the activity message query fails', async () => {
    const query: Record<string, jest.Mock> = {};
    query.where = jest.fn(() => query);
    query.orderBy = jest.fn(() => query);
    query.limit = jest.fn(() => query);
    query.get = jest.fn().mockRejectedValue(new Error('firestore down'));
    mockGetDb.mockReturnValue({ collectionGroup: jest.fn(() => query) });

    const res = await request(server, 'POST', '/scheduler/tick', undefined, '', {
      'X-Scheduler-Secret': 'sched-secret',
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: 'scheduler_failed' });
    expect(JSON.stringify(res.body)).not.toContain('firestore down');
  });

  const schedulerPaths = [
    '/scheduler/tick',
    '/scheduler/hub-tick',
    '/scheduler/hub-quota',
    '/scheduler/hub-cleanup',
    '/scheduler/notify',
    '/scheduler/water-reset',
  ];

  it.each(schedulerPaths)('rejects %s unless the scheduler secret matches', async (path) => {
    const missing = await request(server, 'POST', path, undefined, '');
    const empty = await request(server, 'POST', path, undefined, '', { 'X-Scheduler-Secret': '' });
    const wrongLength = await request(server, 'POST', path, undefined, '', { 'X-Scheduler-Secret': 'nope' });
    const sameLength = await request(server, 'POST', path, undefined, '', { 'X-Scheduler-Secret': 'sched-secreX' });

    for (const res of [missing, empty, wrongLength, sameLength]) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    }
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it.each([
    ['unset', undefined],
    ['blank', ''],
    ['whitespace', '   '],
  ] as const)('rejects scheduler routes when SCHEDULER_SECRET is %s', async (_label, secret) => {
    const previous = process.env.SCHEDULER_SECRET;
    if (secret === undefined) delete process.env.SCHEDULER_SECRET;
    else process.env.SCHEDULER_SECRET = secret;
    try {
      for (const path of schedulerPaths) {
        const missing = await request(server, 'POST', path, undefined, '');
        const empty = await request(server, 'POST', path, undefined, '', { 'X-Scheduler-Secret': '' });
        const arbitrary = await request(server, 'POST', path, undefined, '', { 'X-Scheduler-Secret': 'anything' });
        expect(missing.status).toBe(401);
        expect(empty.status).toBe(401);
        expect(arbitrary.status).toBe(401);
        expect(missing.body).toEqual({ error: 'Unauthorized' });
        expect(JSON.stringify(arbitrary.body)).not.toContain('anything');
      }
      expect(mockGetDb).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.SCHEDULER_SECRET;
      else process.env.SCHEDULER_SECRET = previous;
    }
  });

  it.each(['/scheduler/notify', '/scheduler/water-reset'])(
    'still does not serve removed %s when the scheduler secret is valid',
    async (path) => {
      const address = server.address() as AddressInfo;
      const res = await fetch(`http://127.0.0.1:${address.port}${path}`, {
        method: 'POST',
        headers: { 'X-Scheduler-Secret': 'sched-secret' },
      });
      expect(res.status).toBe(404);
    },
  );

  it.each([
    ['POST', '/api/water/session'],
    ['GET', '/api/groups/group_a/water-config'],
    ['GET', '/api/learning/access'],
    ['POST', '/api/internal/deploy-notify'],
  ])('no longer serves removed legacy endpoint %s %s', async (method, path) => {
    const address = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: { Authorization: 'Bearer valid-token' },
    });
    expect(res.status).toBe(404);
  });

  const harnessBody = {
    runId: 'run_1',
    activityId: 'act_1',
    userId: 'user_a',
    userMessage: 'go',
  };

  function postHarness(secret?: string): Promise<JsonResponse> {
    const address = server.address() as AddressInfo;
    const payload = JSON.stringify(harnessBody);
    const headers: http.OutgoingHttpHeaders = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    };
    if (secret !== undefined) headers['X-Harness-Secret'] = secret;

    return new Promise((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1',
        port: address.port,
        agent: false,
        method: 'POST',
        path: '/api/internal/harness/run',
        headers,
      }, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            body: data ? JSON.parse(data) : null,
            headers: res.headers,
          });
        });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  it('rejects /api/internal/harness/run whenever INTERNAL_HARNESS_SECRET is unset', async () => {
    const previous = process.env.INTERNAL_HARNESS_SECRET;
    delete process.env.INTERNAL_HARNESS_SECRET;
    mockExecuteHarness.mockResolvedValue(undefined);

    try {
      const missing = await postHarness();
      const empty = await postHarness('');
      const arbitrary = await postHarness('not-the-secret');

      expect(missing.status).toBe(401);
      expect(empty.status).toBe(401);
      expect(arbitrary.status).toBe(401);
      expect(missing.body).toEqual({ error: 'Unauthorized' });
      expect(empty.body).toEqual({ error: 'Unauthorized' });
      expect(arbitrary.body).toEqual({ error: 'Unauthorized' });
      expect(mockExecuteHarness).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.INTERNAL_HARNESS_SECRET;
      else process.env.INTERNAL_HARNESS_SECRET = previous;
    }
  });

  it('rejects /api/internal/harness/run when INTERNAL_HARNESS_SECRET is an empty string', async () => {
    const previous = process.env.INTERNAL_HARNESS_SECRET;
    process.env.INTERNAL_HARNESS_SECRET = '';
    mockExecuteHarness.mockResolvedValue(undefined);

    try {
      const missing = await postHarness();
      const empty = await postHarness('');
      const arbitrary = await postHarness('not-the-secret');

      expect(missing.status).toBe(401);
      expect(empty.status).toBe(401);
      expect(arbitrary.status).toBe(401);
      expect(mockExecuteHarness).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.INTERNAL_HARNESS_SECRET;
      else process.env.INTERNAL_HARNESS_SECRET = previous;
    }
  });

  it('accepts /api/internal/harness/run only for the configured secret', async () => {
    mockExecuteHarness.mockResolvedValue(undefined);

    const missing = await postHarness();
    const empty = await postHarness('');
    const wrongLength = await postHarness('wrong-secret');
    const sameLength = await postHarness('xxxx-secret');
    const correct = await postHarness('test-secret');

    expect(missing.status).toBe(401);
    expect(empty.status).toBe(401);
    expect(wrongLength.status).toBe(401);
    expect(sameLength.status).toBe(401);
    expect(correct.status).toBe(200);
    expect(correct.body).toEqual({ ok: true });
    expect(mockExecuteHarness).toHaveBeenCalledTimes(1);
    expect(mockExecuteHarness).toHaveBeenCalledWith(expect.anything(), expect.anything(), harnessBody);
  });

  it('protects /api/internal/harness/run with the internal secret', async () => {
    mockExecuteHarness.mockResolvedValue(undefined);

    const missing = await request(server, 'POST', '/api/internal/harness/run', {
      runId: 'run_1',
      activityId: 'act_1',
      userId: 'user_a',
      userMessage: 'go',
    }, '');
    expect(missing.status).toBe(401);
    expect(mockExecuteHarness).not.toHaveBeenCalled();

    const ok = await request(server, 'POST', '/api/internal/harness/run', {
      runId: 'run_1',
      activityId: 'act_1',
      userId: 'user_a',
      userMessage: 'go',
    }, '');

    expect(ok.status).toBe(401);

    const address = server.address() as AddressInfo;
    const payload = JSON.stringify({
      runId: 'run_1',
      activityId: 'act_1',
      userId: 'user_a',
      userMessage: 'go',
    });
    const success = await new Promise<JsonResponse>((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1',
        port: address.port,
        method: 'POST',
        path: '/api/internal/harness/run',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'X-Harness-Secret': 'test-secret',
        },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: JSON.parse(data), headers: res.headers }));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    expect(success.status).toBe(200);
    expect(success.body).toEqual({ ok: true });
    expect(mockExecuteHarness).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      runId: 'run_1',
      activityId: 'act_1',
      userId: 'user_a',
      userMessage: 'go',
    });
  });
});
