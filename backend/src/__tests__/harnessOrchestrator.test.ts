// Mock firebase-admin first (before any imports that depend on it)
jest.mock('firebase-admin', () => ({
  firestore: {
    Timestamp: {
      now: () => ({ seconds: 0, nanoseconds: 0 }),
      fromDate: () => ({ seconds: 9999, nanoseconds: 0 }),
    },
  },
}));
jest.mock('firebase-admin/firestore', () => ({}));

// Mock contextBuilder to skip real Firestore reads
jest.mock('../services/contextBuilder', () => ({
  buildContextEnvelope: jest.fn(),
}));

// Mock persistenceAdapter to skip real Firestore writes
jest.mock('../services/persistenceAdapter', () => ({
  persistEffects: jest.fn(),
}));

import { executeHarness } from '../services/harnessOrchestrator';
import { buildContextEnvelope } from '../services/contextBuilder';
import { persistEffects } from '../services/persistenceAdapter';
import type { LLMProvider } from '../services/llmProvider';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const RUN_ID = 'run_1';
const ACT_ID = 'act_1';
const USER_ID = 'user_1';

const baseCtx = {
  activityId: ACT_ID,
  userId: USER_ID,
  activity: { id: ACT_ID, userId: USER_ID, name: '測試活動', targetGroups: ['group_a'], status: 'draft', reviewStatus: 'pending_review' },
  knowledge: [],
  existingMessages: [],
  recentTurns: [],
  sessionId: 'session_1',
};

const baseSession = {
  id: 'session_1',
  activityId: ACT_ID,
  userId: USER_ID,
  messages: [],
  lastGeneratedPlanAt: null,
  status: 'active',
  createdAt: { seconds: 0 },
  updatedAt: { seconds: 0 },
};

function makeLLM(reply: string | string[]): LLMProvider {
  const replies = Array.isArray(reply) ? reply : [reply];
  let i = 0;
  return { chat: jest.fn().mockImplementation(() => Promise.resolve(replies[i++] ?? replies[replies.length - 1])) };
}

function buildDb(sessionExists = true) {
  const stageLog: string[] = [];
  const runRef = {
    update: jest.fn().mockImplementation((patch: Record<string, unknown>) => {
      if (patch.currentStage) stageLog.push(patch.currentStage as string);
      return Promise.resolve();
    }),
  };
  const sessionRef = {
    id: 'new_session_id',
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue({
      exists: sessionExists,
      data: () => baseSession,
    }),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const actRef = { update: jest.fn().mockResolvedValue(undefined) };

  const db = {
    collection: jest.fn((name: string) => {
      if (name === 'harnessRuns') return { doc: jest.fn(() => runRef) };
      if (name === 'agentSessions') return { doc: jest.fn(() => sessionRef) };
      if (name === 'activities') return { doc: jest.fn(() => actRef) };
      return { doc: jest.fn(() => ({ set: jest.fn().mockResolvedValue(undefined), update: jest.fn().mockResolvedValue(undefined) })) };
    }),
    stageLog,
    runRef,
    sessionRef,
    actRef,
  };
  return db;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_JSON = JSON.stringify([{
  content: '活動即將開始！',
  targetGroups: ['all'],
  triggerValue: '2025-05-10T10:00:00+08:00',
  sequenceOrder: 1,
}]);

const KNOWLEDGE_REPLY = `好的！\nEXTRACTED_KNOWLEDGE:\n[{"knowledgeType":"background","title":"背景","content":"密室逃脫"}]`;

beforeEach(() => {
  jest.clearAllMocks();
  (buildContextEnvelope as jest.Mock).mockResolvedValue({ ...baseCtx });
  (persistEffects as jest.Mock).mockResolvedValue({ savedMessages: [], savedKnowledgeCount: 0, batchCount: 1 });
});

// ─── Stage progression ────────────────────────────────────────────────────────

describe('executeHarness — stage checkpoints', () => {
  it('writes all 7 stages in order', async () => {
    const db = buildDb();
    const llm = makeLLM('一般對話回覆');
    await executeHarness(db as any, llm, { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '你好' });
    const stages = db.stageLog;
    expect(stages).toEqual([
      'load_context', 'build_prompt', 'run_planner', 'parse_output',
      'validate_output', 'persist_effects', 'finalize_response',
    ]);
  });

  it('marks run as completed on success', async () => {
    const db = buildDb();
    await executeHarness(db as any, makeLLM('ok'), { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '你好' });
    const calls = (db.runRef.update as jest.Mock).mock.calls;
    const lastCall = calls[calls.length - 1][0] as Record<string, unknown>;
    expect(lastCall.status).toBe('completed');
  });

  it('marks run as failed and rethrows on error', async () => {
    (buildContextEnvelope as jest.Mock).mockRejectedValue(new Error('DB error'));
    const db = buildDb();
    await expect(
      executeHarness(db as any, makeLLM('ok'), { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '你好' })
    ).rejects.toThrow('DB error');
    const failCall = (db.runRef.update as jest.Mock).mock.calls
      .find((c: unknown[]) => (c[0] as Record<string, unknown>).status === 'failed');
    expect(failCall).toBeDefined();
    expect(failCall![0].lastError).toContain('DB error');
  });
});

// ─── Intent detection ─────────────────────────────────────────────────────────

describe('executeHarness — intent detection', () => {
  it('detects plan_messages and calls persistEffects', async () => {
    const db = buildDb();
    (persistEffects as jest.Mock).mockResolvedValue({ savedMessages: [{ id: 'm1' }], savedKnowledgeCount: 0, batchCount: 1 });
    const output = await executeHarness(db as any, makeLLM(PLAN_JSON), { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '規劃訊息' });
    expect(output.intentType).toBe('plan_messages');
    expect(persistEffects).toHaveBeenCalledTimes(1);
  });

  it('detects extract_knowledge', async () => {
    const db = buildDb();
    const output = await executeHarness(db as any, makeLLM(KNOWLEDGE_REPLY), { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '說明活動' });
    expect(output.intentType).toBe('extract_knowledge');
  });

  it('detects general_chat', async () => {
    const db = buildDb();
    const output = await executeHarness(db as any, makeLLM('你好，有什麼需要幫忙的嗎？'), { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '你好' });
    expect(output.intentType).toBe('general_chat');
    expect(output.reply).toBe('你好，有什麼需要幫忙的嗎？');
  });

  it('resolves ["all"] targetGroups to activity.targetGroups', async () => {
    const db = buildDb();
    await executeHarness(db as any, makeLLM(PLAN_JSON), { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '規劃' });
    const [_db, msgDrafts] = (persistEffects as jest.Mock).mock.calls[0] as [unknown, Array<{ targetGroups: string[] }>, unknown[]];
    expect(msgDrafts[0].targetGroups).toEqual(['group_a']); // resolved from activity
  });
});

// ─── LLM rate limit & call limit ─────────────────────────────────────────────

describe('executeHarness — LLM guards', () => {
  it('throws llm_rate_limit_error on 429 response', async () => {
    const llm: LLMProvider = {
      chat: jest.fn().mockRejectedValue(new Error('LLM API error 429: rate limit exceeded')),
    };
    const db = buildDb();
    await expect(
      executeHarness(db as any, llm, { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '規劃' })
    ).rejects.toThrow('llm_rate_limit_error');
  });

  it('throws max_llm_calls_exceeded after 3 LLM calls', async () => {
    // Return invalid JSON each time so repair keeps looping
    const badReply = '[{invalid json}]';
    const llm = makeLLM([PLAN_JSON.slice(0, 5), PLAN_JSON.slice(0, 5), PLAN_JSON.slice(0, 5), PLAN_JSON.slice(0, 5)]);
    // Override: always return unparseable content
    (llm.chat as jest.Mock).mockResolvedValue('not json and no EXTRACTED_KNOWLEDGE');
    // Make it return a plan that fails validation on first attempt (triggers repair)
    (llm.chat as jest.Mock)
      .mockResolvedValueOnce(JSON.stringify([{ content: '', triggerValue: 'bad', sequenceOrder: 1, targetGroups: ['all'] }])) // fails validation
      .mockResolvedValueOnce(JSON.stringify([{ content: '', triggerValue: 'bad', sequenceOrder: 1, targetGroups: ['all'] }])) // repair also fails
      .mockResolvedValueOnce('ok') // would be 3rd call — should not reach here
    ;
    const db = buildDb();
    // With 3 calls max: call 1 = run_planner, call 2 = repair → repair fails → error thrown
    await expect(
      executeHarness(db as any, llm, { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '規劃' })
    ).rejects.toThrow('repair_failed');
    expect((llm.chat as jest.Mock)).toHaveBeenCalledTimes(2);
  });
});

// ─── Repair loop ──────────────────────────────────────────────────────────────

describe('executeHarness — repair loop', () => {
  it('calls LLM again with repair prompt when plan validation fails', async () => {
    const invalidPlan = JSON.stringify([{ content: '', triggerValue: 'bad', sequenceOrder: 1, targetGroups: ['all'] }]);
    const llm = makeLLM([invalidPlan, PLAN_JSON]);
    const db = buildDb();
    (persistEffects as jest.Mock).mockResolvedValue({ savedMessages: [{ id: 'm1' }], savedKnowledgeCount: 0, batchCount: 1 });
    const output = await executeHarness(db as any, llm, { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '規劃' });
    expect((llm.chat as jest.Mock)).toHaveBeenCalledTimes(2);
    expect(output.intentType).toBe('plan_messages');
  });

  it('throws repair_failed when repaired output still fails validation', async () => {
    const invalidPlan = JSON.stringify([{ content: '', triggerValue: 'bad', sequenceOrder: 1, targetGroups: ['all'] }]);
    const llm = makeLLM([invalidPlan, invalidPlan]);
    const db = buildDb();
    await expect(
      executeHarness(db as any, llm, { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '規劃' })
    ).rejects.toThrow('repair_failed');
  });

  it('does not trigger repair for general_chat (non-plan) reply', async () => {
    const llm = makeLLM('這是一般對話');
    const db = buildDb();
    await executeHarness(db as any, llm, { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '你好' });
    expect((llm.chat as jest.Mock)).toHaveBeenCalledTimes(1);
  });
});

// ─── Session & activity ───────────────────────────────────────────────────────

describe('executeHarness — session handling', () => {
  it('writes agentSessionId to activity when creating new session', async () => {
    const db = buildDb(false); // session does not exist → new session created
    await executeHarness(db as any, makeLLM('ok'), { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '你好' });
    expect(db.actRef.update).toHaveBeenCalledWith(
      expect.objectContaining({ agentSessionId: expect.any(String) })
    );
  });

  it('returns sessionId in output', async () => {
    const db = buildDb();
    const output = await executeHarness(db as any, makeLLM('ok'), { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '你好', sessionId: 'session_1' });
    expect(typeof output.sessionId).toBe('string');
    expect(output.sessionId.length).toBeGreaterThan(0);
  });

  it('appends exchange to session messages', async () => {
    const db = buildDb();
    await executeHarness(db as any, makeLLM('reply text'), { runId: RUN_ID, activityId: ACT_ID, userId: USER_ID, userMessage: '你好', sessionId: 'session_1' });
    const updateCall = (db.sessionRef.update as jest.Mock).mock.calls[0][0] as { messages: Array<{ role: string; content: string }> };
    const userMsg = updateCall.messages.find((m) => m.role === 'user' && m.content === '你好');
    expect(userMsg).toBeDefined();
  });
});
