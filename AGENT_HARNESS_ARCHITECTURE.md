# WiPPY Agent / Harness 架構整理

本文件整理目前 WiPPY 後端的 Agent 架構，聚焦於：
- 從輸入到輸出的實際執行流程
- Harness 相關功能包含哪些
- 各功能怎麼實作、分散在哪些模組

---

## 1. 架構總覽（目前實作）

目前主流程已從舊版「單一 `agentChat` 直打 LLM」演進為：

`API Route -> HarnessRun -> Orchestrator Stage Pipeline -> LLM/Validation/Persistence -> Firestore Result`

核心模組：
- API 入口：`backend/src/routes/api/agent.ts`
- Orchestrator：`backend/src/services/harnessOrchestrator.ts`
- Context 載入：`backend/src/services/contextBuilder.ts`
- LLM 抽象：`backend/src/services/llmProvider.ts`
- 輸出驗證：`backend/src/services/planValidator.ts`
- 寫回層：`backend/src/services/persistenceAdapter.ts`
- 非同步 worker 入口：`backend/src/routes/internal/harness.ts`
- Cloud Tasks enqueue：`backend/src/services/cloudTasksService.ts`

---

## 2. 輸入到輸出流程（End-to-End）

### 2.1 API 進入點：`POST /api/agent/chat`

位置：`backend/src/routes/api/agent.ts`

流程：
1. 驗證 `activityId`、`message` 必填。
2. 經過 `authMiddleware` 取得 `userId`。
3. 呼叫 `checkRateLimit()`，超限回 `429` + `status: rate_limited`。
4. 建立 `harnessRuns/{runId}`（初始 `status: queued`，含 `llmCallCount`、`currentStage` 等欄位）。
5. 分流：
   - 若 Cloud Tasks 啟用：enqueue 後立即回 `status: queued`。
   - 否則（本機 / dev）：同步呼叫 `executeHarness()`，直接回 `status: completed` 與結果。

### 2.2 Harness Worker（非同步）

位置：`backend/src/routes/internal/harness.ts`

流程：
1. 驗證 `X-Harness-Secret`。
2. 驗證 body 欄位（`runId/activityId/userId/userMessage`）。
3. 呼叫 `executeHarness()` 執行完整 stage pipeline。
4. 錯誤處理策略：
   - 邏輯錯誤：回 200（避免 Cloud Tasks 重複 retry）。
   - 基礎設施錯誤（如 UNAVAILABLE）：回 500 允許 Cloud Tasks retry。

### 2.3 Orchestrator 主流程（7 個 Stage）

位置：`backend/src/services/harnessOrchestrator.ts`

固定 stage：
1. `load_context`
2. `build_prompt`
3. `run_planner`
4. `parse_output`
5. `validate_output`
6. `persist_effects`
7. `finalize_response`

每個 stage 開始前都會更新 `HarnessRun.currentStage` 與 `status: running`。

---

## 3. 三種輸出意圖（Intent）

Orchestrator 會從 LLM 輸出判斷 intent：
- `plan_messages`：可解析成訊息規劃 JSON 陣列
- `extract_knowledge`：包含 `EXTRACTED_KNOWLEDGE:` 區塊
- `general_chat`：以上皆非

### 3.1 `plan_messages`
1. `tryParseMessagePlan()` 抽取 JSON。
2. `validateMessagePlan()` 驗證欄位格式（content、ISO datetime、sequenceOrder、targetGroups）。
3. 若驗證失敗，進入一次 repair（把 validation feedback 回送 LLM）。
4. 成功後透過 `persistEffects()` 寫入 `activityMessages`。
5. 最終回覆轉為固定提示文案（已規劃 N 則訊息）。

### 3.2 `extract_knowledge`
1. `tryParseKnowledge()` 解析 `EXTRACTED_KNOWLEDGE` 區段。
2. 透過 `persistEffects()` 寫入 `activityKnowledge`（`sourceType = agent_generated`）。
3. 回給使用者時去除結構化區塊，只保留自然語言主體。

### 3.3 `general_chat`
1. 不產生 message/knowledge side effects。
2. 回覆直接使用 LLM 自然語言輸出。
3. 仍寫入 session history。

---

## 4. Harness 功能清單（已實作）

### 4.1 可觀測性（Observability）
- `harnessRuns` 記錄：
  - `status`: `queued/running/completed/failed`
  - `currentStage`
  - `llmCallCount`
  - `persistedBatches`
  - `intentType`
  - `reply/lastError`

型別位置：`backend/src/types.ts`（`HarnessRun`, `HarnessStage`, `HarnessStatus`）。

### 4.2 Session 連續性
- `getOrCreateSession()` 以 `activityId + userId + sessionId` 續接或建立 session。
- session 切換/建立時回寫 `activities/{activityId}.agentSessionId`。
- 每次對話追加 user/assistant 訊息，並保留最近 `MAX_SESSION_HISTORY`（目前 20）。

### 4.3 LLM Guardrail
- 每個 run 最多 `MAX_LLM_CALLS = 3`。
- LLM 若回 429 或 rate_limit 字樣，轉為 `llm_rate_limit_error`。

### 4.4 Validation + Repair
- 僅對 `plan_messages` 啟用。
- 初次 validation 失敗時，組 repair prompt 再呼叫一次 LLM。
- repair 後仍不合法則 fail run。

### 4.5 Persistence Adapter
- `persistEffects()` 統一處理 message + knowledge 寫入。
- 使用 batch chunk（`BATCH_LIMIT = 499`）避免超過 Firestore batch 上限。

### 4.6 非同步執行（Cloud Tasks）
- API 端 enqueue，worker 端執行。
- `INTERNAL_HARNESS_SECRET` 保護 internal route。

### 4.7 Graceful Shutdown 保護
- Cloud Run 收到 SIGTERM 時，會將 `queued/running` 的 `harnessRuns` 標記 `failed`，避免 zombie run。

---

## 5. 模組責任分工（實作觀點）

- `routes/api/agent.ts`：
  請求驗證、rate limit、建立 run、同步/非同步分流、API 回應組裝。

- `services/harnessOrchestrator.ts`：
  流程控制中心；stage 切換、intent 判斷、repair、最終狀態收斂。

- `services/contextBuilder.ts`：
  載入 activity / knowledge / existing messages / session turns，組 `ContextEnvelope`。

- `services/llmProvider.ts`：
  抽象不同 LLM provider（OpenAI-compatible / Ollama / Vertex AI）。

- `services/planValidator.ts`：
  message plan（及 knowledge validator 函式）欄位契約檢查。

- `services/persistenceAdapter.ts`：
  side effects 落地，並加入 `runId` 提升可追溯性。

- `routes/internal/harness.ts` + `services/cloudTasksService.ts`：
  worker 執行入口與排程佇列整合。

---

## 6. 舊版與新版差異

舊版（`services/agentPlanService.ts`）：
- 單函式包含 context load、LLM call、parse、逐筆寫回。
- 缺少 run-level stage/checkpoint 與非同步 worker 執行模型。

新版（Harness）：
- 有明確 stage pipeline。
- 有 `HarnessRun` 追蹤與錯誤收斂。
- 有 repair loop、LLM call 上限、batch persistence。
- 支援 Cloud Tasks 非同步路徑。

---

## 7. 現況缺口（待補強）

1. `validateExtractedKnowledge()` 已存在，但目前 orchestrator 尚未套用該 validator。
2. 文件規劃中的更完整錯誤分類/pause hooks/tool registry 尚未全部落地。
3. 現在仍是單一 prompt + 事後 parse 推斷 intent，尚未完全 mode-based prompt orchestration。
4. 多 batch 寫入不是跨批原子；若跨批失敗需依 `runId` 做補償或重試策略。

---

## 8. 參考檔案

- `backend/src/routes/api/agent.ts`
- `backend/src/routes/internal/harness.ts`
- `backend/src/services/harnessOrchestrator.ts`
- `backend/src/services/contextBuilder.ts`
- `backend/src/services/llmProvider.ts`
- `backend/src/services/planValidator.ts`
- `backend/src/services/persistenceAdapter.ts`
- `backend/src/services/cloudTasksService.ts`
- `backend/src/types.ts`
- `backend/src/services/agentPlanService.ts`（舊版）
- `Harness v1 PLAN.md`（設計規劃文件）
