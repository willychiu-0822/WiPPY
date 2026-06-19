import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import type { LLMProvider, LLMMessage } from './llmProvider';
import type { AgentSession, AgentSessionMessage, HarnessRun, HarnessStage, AgentIntent } from '../types';
import { buildContextEnvelope, type ContextEnvelope } from './contextBuilder';
import { RunTracer, type TraceStage } from './runTrace';
import { intentRegistry, type AnyIntentHandler } from '../harness/intents/registry';

const MAX_LLM_CALLS = 3;
const MAX_SESSION_HISTORY = 20;
// Trace events fall back to a 30-day TTL if the run doc has no ttlExpiry (mirrors agent.ts).
const TRACE_TTL_FALLBACK_MS = 30 * 24 * 60 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HarnessInput {
  runId: string;
  activityId: string;
  userId: string;
  userMessage: string;
  sessionId?: string;
}

export interface HarnessOutput {
  reply: string;
  generatedMessageCount: number;
  extractedKnowledgeCount: number;
  sessionId: string;
  intentType: AgentIntent;
}

// ─── Logging ──────────────────────────────────────────────────────────────────

function log(severity: 'INFO' | 'WARN' | 'ERROR', runId: string, stage: string, message: string, extra?: Record<string, unknown>) {
  console.log(JSON.stringify({ severity, runId, stage, message, ...extra }));
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

async function setStage(db: Firestore, runId: string, stage: HarnessStage) {
  await db.collection('harnessRuns').doc(runId).update({
    currentStage: stage,
    status: 'running',
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

async function finishRun(db: Firestore, runId: string, patch: Partial<HarnessRun>) {
  await db.collection('harnessRuns').doc(runId).update({
    ...patch,
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

// ─── Session helpers ──────────────────────────────────────────────────────────

async function getOrCreateSession(
  db: Firestore,
  activityId: string,
  userId: string,
  sessionId?: string
): Promise<AgentSession> {
  const now = admin.firestore.Timestamp.now();
  if (sessionId) {
    const snap = await db.collection('agentSessions').doc(sessionId).get();
    if (snap.exists) {
      const s = snap.data() as AgentSession;
      if (s.userId === userId && s.activityId === activityId) return s;
    }
  }
  const ref = db.collection('agentSessions').doc();
  const session: AgentSession = {
    id: ref.id, activityId, userId, messages: [],
    lastGeneratedPlanAt: null, status: 'active', createdAt: now, updatedAt: now,
  };
  await ref.set(session);
  return session;
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: ContextEnvelope): string {
  const knowledgeSections = ctx.knowledge
    .map((k) => `[${k.knowledgeType.toUpperCase()}] ${k.title}\n${k.content}`)
    .join('\n\n');

  const existingPlan = ctx.existingMessages.length > 0
    ? ctx.existingMessages.map((m) => `[${m.sequenceOrder}] ${m.triggerValue} — ${m.content}`).join('\n')
    : '（尚無已規劃的訊息）';

  return `# WiPPY System Prompt
> LINE 群組推播規劃 Agent

## Identity
你是 WiPPY，一個專門協助活動舉辦者規劃 LINE 群組推播內容的 AI Agent，非常了解人類心理與情境氛圍營造。
你的工作不是執行推播，而是：理解活動、釐清模糊需求、設計推播排程、產出可直接使用的訊息內容。
你說話簡潔、有條理，不廢話，不過度熱情。

## 當前上下文
### 活動知識庫
${knowledgeSections || '（尚未提供活動資訊）'}

### 目標群組
${ctx.activity.targetGroups.join(', ') || '（尚未設定群組）'}

### 現有推播企畫
${existingPlan}

## ⚠️ 最高優先規則：JSON 落地模式（必須嚴格執行）

當使用者的語意符合下列任一條件，你必須**立即且僅輸出 JSON 陣列**，不得有任何其他文字：

**觸發條件（符合任一即觸發）：**
- 明確要求排程落地：「放進排程」、「排上去」、「幫我排」、「建立排程」、「就這樣排」、「照這個排」、「可以安排了」、「可以放進排程了」、「確認排程」、「儲存排程」
- 明確要求輸出 JSON：「輸出 json」、「產出 json」、「給我 json」、「json 格式」、「輸出給後端」、「json 排程」（不分大小寫）
- 明確要求寫入：「寫入」、「存進去」、「存起來」、「直接產生可寫入」
- 確認定稿後的執行指令：「OK 就這樣安排」、「就這樣」＋上下文為確認定稿時、「好，就照這個」

**觸發時的輸出規則（零例外，系統只能讀取以下格式）：**

✅ 正確格式（你必須輸出完全一樣的結構，無任何前後文字）：
[{"content":"推播訊息全文","targetGroups":["all"],"triggerValue":"2026-05-01T10:00:00+08:00","sequenceOrder":1},{"content":"第二則訊息","targetGroups":["all"],"triggerValue":"2026-05-02T10:00:00+08:00","sequenceOrder":2}]

❌ 嚴格禁止（以下任一格式都會導致系統無法讀取，訊息不會被儲存）：
- 禁止包裝在物件中：{"schedule":[...]} 或 {"event_name":"...","messages":[...]} 或任何 {} 包裝
- 禁止 markdown 格式：\`\`\`json ... \`\`\` 或 \`\`\` ... \`\`\`
- 禁止任何前言或說明文字（例如「以下是 JSON：」）
- 禁止使用 "date" 或 "time" 欄位（必須合併成 "triggerValue": "YYYY-MM-DDTHH:MM:SS+08:00"）
- 禁止使用 "theme"、"title"、"description" 等非規定欄位
- 禁止缺少 "targetGroups" 欄位（必填）

欄位規格（必須完全符合）：
1. 輸出第一個字元必須是 \`[\`，最後一個字元必須是 \`]\`
2. "content": string（推播訊息全文）
3. "targetGroups": string[]（用 ["all"] 代表所有目標群組）
4. "triggerValue": ISO 8601 日期時間，必須含時區（格式：2026-05-10T10:00:00+08:00）
5. "sequenceOrder": number（正整數、從 1 開始遞增、不可重複）
6. targetGroups 優先使用活動已有的目標群組：${ctx.activity.targetGroups.join(', ') || '（尚未設定，使用 ["all"]）'}
7. 若資訊不足以產出完整 JSON（例如完全不知道日期），先在一般對話模式中補齊，再等使用者確認後輸出

**判斷原則：**
- 不必逐字匹配；以「使用者是否已對內容定稿並要求進入可執行階段」為核心判準
- 單純的「OK」、「好」、「可以」若僅是回應討論，不算觸發；但「OK 就這樣安排」、「好，就照這個排」等帶有執行意圖的，必須觸發
- **禁止在觸發後再次詢問確認**，直接輸出 JSON

---

## Workflow（一般對話模式）

### STEP 1｜讀懂活動
先從使用者描述中靜默萃取可用資訊；可推斷就先推斷，無法推斷才列入待確認。
回應前先檢視「活動知識庫」中已有的內容，視同使用者已提供的背景資料。能從知識庫得到的事實直接使用，不要再問；只有知識庫找不到且完成任務必需時，才向使用者詢問。

### STEP 2｜一次性清單策略（Checklist Approach）
第一次回覆時，先給「初步分析或草稿」，再附上 Clarification List（最多 6 個關鍵問題）。
若資訊仍不足，不得停在反問：你必須基於現有資訊給出最佳可行方案，並在回覆末尾清楚列出 Assumptions。

### STEP 3｜輸出推播排程規劃（給使用者閱讀）
在一般對話模式下，可輸出 Markdown 排程總覽，幫助使用者檢視整體節奏。

### STEP 4｜輸出每則推播完整訊息（給使用者閱讀）
在一般對話模式下，可輸出逐則完整文案。emoji 全面開放，可依活動調性使用。

### STEP 5｜交付摘要（給使用者閱讀）
可在一般對話模式下提供總結、待確認欄位與可調整方向。

## 知識萃取規範（EXTRACTED_KNOWLEDGE）
若你從對話中發現可沉澱的活動知識，在一般對話模式回覆中，請在最後附上：
EXTRACTED_KNOWLEDGE:
[
  {
    "knowledgeType": "background|restriction|character|faq",
    "title": "簡短標題",
    "content": "詳細內容"
  }
]

規範：
1. knowledgeType 僅允許 background|restriction|character|faq。
2. 不可產生新類型；若無法判斷，一律使用 background。
3. EXTRACTED_KNOWLEDGE 區塊放在回覆最末尾。
4. JSON 落地模式輸出時，禁止同時輸出 EXTRACTED_KNOWLEDGE。

## Constraints
- 不會主動替舉辦者做任何「當天才能決定」的選擇；需要時以假設或待確認標示。
- 在一般對話模式下，輸出內容要可直接供使用者檢視與調整。
- 在 JSON 落地模式下，嚴格遵守純 JSON 規格，不輸出其他格式。`;
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export async function executeHarness(
  db: Firestore,
  llm: LLMProvider,
  input: HarnessInput
): Promise<HarnessOutput> {
  const { runId, activityId, userId, userMessage, sessionId } = input;
  let llmCallCount = 0;

  // ─── Run Trace (Layer 1) ──────────────────────────────────────────────────
  let tracer: RunTracer | null = null;
  let currentStage: TraceStage = 'orchestrator';

  // Advance to a stage: close out the previous stage, flush its events at the
  // boundary (so a later crash still preserves them), then open the new stage.
  const enterStage = async (stage: HarnessStage): Promise<void> => {
    if (tracer && currentStage !== 'orchestrator') {
      tracer.stageExit(currentStage);
      await tracer.flush();
    }
    await setStage(db, runId, stage);
    tracer?.stageEnter(stage);
    currentStage = stage;
  };

  const callLLM = async (messages: LLMMessage[]): Promise<string> => {
    if (++llmCallCount > MAX_LLM_CALLS) throw new Error('max_llm_calls_exceeded');
    await db.collection('harnessRuns').doc(runId).update({ llmCallCount, updatedAt: admin.firestore.Timestamp.now() });
    const startedAt = Date.now();
    try {
      const result = await llm.chat(messages);
      tracer?.llmCall(currentStage, messages, result, Date.now() - startedAt);
      return result;
    } catch (err) {
      const msg = String(err);
      if (msg.includes('429') || msg.toLowerCase().includes('rate_limit')) throw new Error('llm_rate_limit_error');
      throw err;
    }
  };

  try {
    // Load the run's ttlExpiry so trace events expire alongside the run.
    const runSnap = await db.collection('harnessRuns').doc(runId).get();
    const ttlExpiry = (runSnap.data() as HarnessRun | undefined)?.ttlExpiry
      ?? admin.firestore.Timestamp.fromDate(new Date(Date.now() + TRACE_TTL_FALLBACK_MS));
    tracer = new RunTracer(db, runId, ttlExpiry);

    // load_context
    await enterStage('load_context');
    const session = await getOrCreateSession(db, activityId, userId, sessionId);
    const ctx = await buildContextEnvelope(db, activityId, userId, session);
    log('INFO', runId, 'load_context', 'Context loaded', { knowledge: ctx.knowledge.length, msgs: ctx.existingMessages.length });

    if (!sessionId || sessionId !== session.id) {
      await db.collection('activities').doc(activityId).update({
        agentSessionId: session.id,
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }

    // build_prompt
    await enterStage('build_prompt');
    const sysPrompt = buildSystemPrompt(ctx);
    const history: LLMMessage[] = ctx.recentTurns.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    const llmMessages: LLMMessage[] = [
      { role: 'system', content: sysPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ];

    // run_planner
    await enterStage('run_planner');
    const rawReply = await callLLM(llmMessages);
    log('INFO', runId, 'run_planner', 'LLM replied', { len: rawReply.length });

    // parse_output: try handlers in priority order (plan > knowledge > chat).
    await enterStage('parse_output');
    let matched: { handler: AnyIntentHandler; parsed: unknown } | null = null;
    for (const handler of intentRegistry) {
      const parsed = handler.detect(rawReply);
      if (parsed != null) { matched = { handler, parsed }; break; }
    }
    if (!matched) throw new Error('no_intent_matched'); // generalChat always matches; defensive
    const intentType: AgentIntent = matched.handler.name;

    // validate_output + repair (handler-agnostic: any intent can repair).
    await enterStage('validate_output');
    let outcome = matched.handler.validate(matched.parsed, ctx);
    tracer?.validation(currentStage, outcome.valid, outcome.feedback);
    if (!outcome.valid) {
      log('WARN', runId, 'validate_output', 'Validation failed, repairing', { intent: intentType, feedback: outcome.feedback });
      const hint = matched.handler.repairHint?.() ?? '';
      const repairMsg = `你上一次的輸出有誤，請依錯誤修正後重新輸出。${hint}\n錯誤：${outcome.feedback}\n原輸出（前 300 字）：${rawReply.slice(0, 300)}`;
      const repaired = await callLLM([...llmMessages, { role: 'assistant', content: rawReply }, { role: 'user', content: repairMsg }]);
      tracer?.repair(currentStage, repairMsg, repaired);
      const reparsed = matched.handler.detect(repaired);
      if (reparsed == null) throw new Error('repair_failed: 無法解析修正後的輸出');
      outcome = matched.handler.validate(reparsed, ctx);
      tracer?.validation(currentStage, outcome.valid, outcome.feedback);
      if (!outcome.valid) throw new Error(`repair_failed: ${outcome.feedback}`);
      matched.parsed = reparsed;
    }

    // persist_effects
    await enterStage('persist_effects');
    const now = admin.firestore.Timestamp.now();
    const persistResult = await matched.handler.persist(db, matched.parsed, {
      activityId,
      userId,
      runId,
      agentSessionId: session.id,
      activityTargetGroups: ctx.activity.targetGroups,
      onBatchCommitted: (info) => tracer?.persist(currentStage, info.messageIds, info.knowledgeIds, info.batchIndex),
    });

    const generatedMessageCount = intentType === 'plan_messages' ? persistResult.savedCount : 0;
    const extractedKnowledgeCount = intentType === 'extract_knowledge' ? persistResult.savedCount : 0;

    await db.collection('harnessRuns').doc(runId).update({ persistedBatches: persistResult.batchCount, updatedAt: now });
    log('INFO', runId, 'persist_effects', 'Persisted', { intent: intentType, saved: persistResult.savedCount, batches: persistResult.batchCount });

    if (generatedMessageCount > 0) {
      await db.collection('agentSessions').doc(session.id).update({ lastGeneratedPlanAt: now, updatedAt: now });
    }

    // Append to session history (keep last MAX_SESSION_HISTORY)
    const sessionSnap = await db.collection('agentSessions').doc(session.id).get();
    const currentMsgs = (sessionSnap.data() as AgentSession).messages;
    const newMsgs: AgentSessionMessage[] = [
      { role: 'user', content: userMessage, timestamp: now },
      { role: 'assistant', content: rawReply, timestamp: now },
    ];
    await db.collection('agentSessions').doc(session.id).update({
      messages: [...currentMsgs, ...newMsgs].slice(-MAX_SESSION_HISTORY),
      updatedAt: now,
    });

    // finalize_response
    await enterStage('finalize_response');
    const displayReply = matched.handler.finalize(rawReply, matched.parsed, persistResult);

    tracer?.stageExit(currentStage);
    await finishRun(db, runId, {
      status: 'completed',
      intentType,
      reply: displayReply,
      generatedMessageCount,
      extractedKnowledgeCount,
    });
    await tracer?.flush();

    return { reply: displayReply, generatedMessageCount, extractedKnowledgeCount, sessionId: session.id, intentType };

  } catch (err) {
    const errMsg = String(err).slice(0, 500);
    log('ERROR', runId, 'error', errMsg);
    tracer?.error(currentStage, err);
    try { await tracer?.flush(); } catch { /* trace flush is best-effort; never mask the original error */ }
    await finishRun(db, runId, { status: 'failed', lastError: errMsg });
    throw err;
  }
}
