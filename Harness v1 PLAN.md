# WiPPY 可遷移 Harness 開發計劃

## 摘要
以 WiPPY 現有 `單次 agentChat -> LLM -> parse -> Firestore` 流程為基礎，重構為一套 `LangGraph-ready`、但先不綁定框架的單 Agent harness。  
目標是先補齊八個面向的工程骨架，讓目前的活動規劃 agent 變成可觀測、可驗證、可恢復、可擴充的 execution pipeline；之後若要接 LangGraph，主要是把既有 stage 與 state 映射進 graph runtime，而不是重寫業務邏輯。

---

## 核心設計

### 1. Orchestration Loop

- 將目前 `agentPlanService` 拆成固定 stage pipeline，不再由單一函式直接完成所有工作。
- Stage 順序固定為：
  1. `load_context`
  2. `build_prompt`
  3. `run_planner`
  4. `parse_output`
  5. `validate_output`
  6. `persist_effects`
  7. `finalize_response`
- 每個 stage 都回傳結構化結果與狀態，不直接跨 stage 寫共享變數。
- 新增 `HarnessRun` / `HarnessStepResult` 型別，讓每次 agent 執行都有 `runId`、`sessionId`、`activityId`、`status`、`currentStage`、`attemptCount`。
- Orchestration 層只負責流程控制，不直接知道 Firestore schema 細節；資料讀寫交給 repository / persistence adapter。
- 預留 `pause_before_persist` 與 `pause_after_validate` hook，未來可直接映射到 LangGraph 的 human-in-the-loop 中斷點。
- **[修正一] Checkpoint 寫入時機**：`HarnessRun.currentStage` 必須在每個 stage **開始前**就寫入 Firestore，而非結束後。Cloud Run 重啟時才能從 Firestore 正確讀回 checkpoint 並繼續，而不是從頭重跑。

#### 非同步執行架構（Cloud Tasks）

LINE Messaging API webhook 要求 30 秒內回應，但 `run_planner` 加上 repair loop 可能遠超過此限制。為避免 LINE 誤判 webhook 失敗而重送（導致重複 `HarnessRun`），採用兩段式非同步架構：

```
[Phase A — webhook handler]
POST /api/agent/chat
  → 驗證請求身份
  → 檢查 LLM rate limit（見 §2）
  → 建立 HarnessRun（status: queued）
  → 將 runId 加入 Cloud Tasks queue
  → 立即回傳 { status: 'queued', runId, sessionId }

[Phase B — harness worker]
Cloud Tasks → POST /api/internal/harness/run
  → 執行完整 stage pipeline
  → 更新 HarnessRun status / result 至 Firestore
  → 前端透過 Firestore onSnapshot 即時取得結果
```

- Cloud Tasks 內建 retry + backoff，不需在 harness 內管理 Cloud Run 層的重試。
- 前端在收到 `queued` 回應後，訂閱 `harnessRuns/{runId}`（Firestore real-time listener），顯示「正在思考中...」直到 status 變為 `completed` 或 `failed`。
- Cloud Tasks 免費額度：每月 100 萬次呼叫，遠超過預期用量。

---

### 2. LLM Rate Limiting

目前 LLM provider 限制為 **每分鐘 10 次請求（per-account）**。若多用戶同時操作，或單一用戶連續送出訊息，將觸發 provider 的 429 錯誤並導致 run 失敗。需要在 harness 層主動管理，而非被動承受。

#### Rate limit 追蹤

使用 Firestore 做跨 Cloud Run instance 的共享計數：

```
Collection: rateLimits
Document: {userId}
Fields:
  - windowStart: Timestamp   // 本輪 60 秒視窗的起始時間
  - requestCount: number     // 本輪已消耗次數
```

每次請求到達 API 層時，在 Firestore transaction 內執行：
1. 讀取 `rateLimits/{userId}`
2. 若 `now - windowStart >= 60s`：重置視窗（windowStart = now, requestCount = 1），放行
3. 若 `requestCount < 10`：遞增計數，放行
4. 若 `requestCount >= 10`：**拒絕請求**，計算 `retryAfterSeconds = 60 - (now - windowStart)`

此 transaction 在進入 Cloud Tasks enqueue 前執行，確保已達上限的請求不消耗 Cloud Tasks 配額。

#### 用戶通知機制

Rate limit 觸發時，API 立即回傳結構化錯誤（不進入 harness pipeline）：

```json
{
  "status": "rate_limited",
  "retryAfterSeconds": 23,
  "message": "AI 助理需要稍作休息，請 23 秒後再試"
}
```

前端處理：
- 顯示倒數計時器：「AI 助理需要稍作休息，請 **23** 秒後再試」
- 倒數結束後自動解鎖輸入框，**不需**用戶手動重試
- 輸入框在倒數期間設為 disabled，避免用戶重複送出
- 倒數時間從 API 回傳的 `retryAfterSeconds` 開始，不在前端自行估算

#### 接近上限的主動提醒

當 `requestCount >= 8`（剩餘 2 次）時，`AgentChatResult` 附帶警示欄位：

```json
{
  "status": "completed",
  "rateLimitWarning": {
    "remaining": 2,
    "windowResetInSeconds": 35
  }
}
```

前端在 chat panel 顯示柔性提示：「本分鐘剩餘 2 次 AI 請求，35 秒後重置」。

#### 限流粒度

- v1 以 `userId` 為限流單位（per-user），避免單一用戶影響他人。
- 若未來需要 per-account global limit，加第二層 `rateLimits/global` 計數即可，架構相同。

---

### 3. Tool Management

- 不在 v1 導入通用 external tools；先建立 `internal tool registry`，把目前隱性能力顯式化。
- v1 tools 定義為：
  - `load_activity_context`
  - `load_activity_knowledge`
  - `load_existing_messages`
  - `save_generated_messages`
  - `save_extracted_knowledge`
- 每個 tool 必須有：
  - name
  - input schema
  - output schema
  - timeout policy
  - retry policy
  - idempotency expectation
- Agent 不直接呼叫任意 function；Orchestrator 只透過 tool interface 存取資料。
- v1 不開放 LLM 自由選 tool；tool invocation 先由 orchestrator 固定控制，避免提早引入 uncontrolled tool-calling complexity。
- 文件中要明定：未來若接 LangGraph，這些 internal tools 直接成為 graph nodes 或 wrapped tools。

---

### 4. Context Engineering

- 建立 `ContextEnvelope`，統一封裝：
  - activity summary
  - target groups
  - restrictions
  - existing plan summary
  - recent conversation turns
  - execution metadata
- 不再讓 prompt builder 直接吃散落的陣列與字串。
- 對 conversation history 設上限與裁切策略：
  - 僅保留最近 N 輪
  - 永遠保留最新 user turn
  - 知識與現有計畫摘要優先於舊對話
- 將 knowledge 分成固定區塊：
  - `background`
  - `restriction`
  - `character`
  - `faq`
- 為每種任務建立 prompt mode：
  - `plan_messages`
  - `extract_knowledge`
  - `general_chat`
- 每個 mode 都有獨立 output contract，避免同一 prompt 同時承擔太多責任。
- 文件中要明定：之後若引入 retrieval，替換的是 `ContextEnvelope` 生成器，不是 orchestration 本身。
- **[修正三] Firestore composite index**：`activityKnowledge` collection 需建立 composite index（`activityId` + `knowledgeType` + `createdAt`），讓 `load_activity_knowledge` 可用單一查詢取回所有所需條目，避免多個小查詢累積讀取次數。

---

### 5. State Persistence

- 將目前 `AgentSession` 升級為兩層 state：
  - `AgentSession`: 長期對話與活動關聯
  - `HarnessRun`: 單次執行狀態與 stage checkpoint
- `Activity.agentSessionId` 必須在 session 建立或切換時正確回寫，不能只存在前端 state。
- `HarnessRun` 至少保存：
  - run id
  - session id
  - activity id
  - user id
  - intent type
  - current stage（**在 stage 開始前寫入，見修正一**）
  - attempt count
  - llm call count（用於 maxLlmCallsPerRun 管控，見 §6）
  - status: `queued | running | needs_review | completed | failed`
  - last error summary
  - timestamps（createdAt、updatedAt）
  - **[修正五] `ttlExpiry`**：建立時設為 `createdAt + 30 天`，並在 Firestore console 對此欄位啟用 TTL policy。TTL 刪除本身免費，只計算刪除前的儲存費用，無需額外清理 job。
- `persist_effects` 階段的 Firestore 寫入改為 batch / transaction 邏輯，避免 message 或 knowledge 部分成功、部分失敗。
  - **[修正十] Batch 500 操作上限**：Firestore batched write 最多 499 operations。`persist_effects` 必須加入 chunk 邏輯，每批 ≤ 499 operations，超過時分批 commit。每批 commit 後更新 `HarnessRun.persistedBatches` 計數，確保分批寫入可被追蹤與重試。注意多批之間不具跨批原子性，因此每批應設計為可獨立重試的單元。
- generated message 與 knowledge 都寫入 `runId`，取代只靠 `agentSessionId` 追溯。
- 文件中要明定 checkpoint 邏輯：同一 `HarnessRun` 可在 `parse_output` 或 `validate_output` 失敗後重試，不新開 session。
- `rateLimits` collection 文件由 API 層管理，不由 harness pipeline 觸碰。

---

### 6. Error Recovery

- 建立分層錯誤分類：
  - `context_load_error`
  - `llm_provider_error`
  - `llm_rate_limit_error`（新增：provider 回 429）
  - `parse_error`
  - `validation_error`
  - `persistence_error`
  - `unexpected_error`
- 每一類錯誤都有明確行為：
  - 是否可重試
  - 最大重試次數
  - 是否需保留原始輸出
  - 對使用者顯示什麼訊息
- `run_planner` 對 transient LLM 錯誤加入 bounded retry + backoff。
- `parse_output` 與 `validate_output` 失敗時，不直接整體失敗；先進入一次 `repair` 流程：
  - 使用原始輸出
  - 加入 validation feedback
  - 再呼叫同一 planner 一次
- **[修正六] `maxLlmCallsPerRun` 上限**：在 `HarnessRun` 層加入 `llmCallCount` 計數器，每次呼叫 LLM 前遞增並檢查。上限建議值為 **3 次**（涵蓋初次呼叫 + 最多 2 次 repair/retry）。超過上限時直接標記 run 為 `failed`（`last_error: 'max_llm_calls_exceeded'`），不再繼續。此上限同時覆蓋 retry 內的 repair，不能只在 repair loop 自己計數。
- `persist_effects` 失敗時標記 run failed，保留待修復狀態，不回傳「已規劃成功」。
- **[修正八] Cloud Run SIGTERM handler**：Cloud Run 終止前會發 SIGTERM 並給 10 秒 graceful shutdown。必須在 Phase 1 就加入 SIGTERM handler，將所有 `status = running` 的 `HarnessRun` 標記為 `failed`（`last_error: 'cloud_run_terminated'`），防止產生永遠卡在 running 的 zombie run：
  ```typescript
  process.on('SIGTERM', async () => {
    await markActiveRunsAsFailed({ reason: 'cloud_run_terminated' })
    process.exit(0)
  })
  ```
- `llm_rate_limit_error`（provider 429）：不進入 repair loop，直接標記 run `failed` 並於 `last_error` 記錄 provider 回傳的 retry-after 時間，供後續人工或自動重試參考。
- Scheduler / send path 暫不重寫，但文件要列為 phase 2：之後同樣套入 retry + structured failure policy。

---

### 7. Safety Guardrails

- 保留既有 `reviewStatus` 人工審核閘門，視為 v1 的核心 safety rail。
- 新增 pre-persist guardrails：
  - `triggerValue` 必須為合法 ISO datetime
  - `sequenceOrder` 不可重複或倒退
  - `content` 不可為空，且長度需在 LINE 安全範圍內
  - `targetGroups` 只能為 activity 已綁定群組或 `all`
- 新增 context guardrails：
  - prompt 不帶入敏感憑證或 token
  - 對 log / trace 中的 user message 做長度截斷
- 新增 execution guardrails：
  - 每次 run 的最大 LLM 呼叫次數（`maxLlmCallsPerRun = 3`，見 §6）
  - 每次 run 的最大 persistence effect 數量
  - 單次 run 只允許一種 intent mode 生效
- **Rate limit guardrail**：LLM rate limit 檢查（每分鐘 10 次 per-user）必須在 Cloud Tasks enqueue 前於 API 層完成，不得讓已超限的請求進入 harness pipeline。
- 未來 keyword trigger / capture 上線時，也必須掛到同一 guardrail layer，而不是各自散落在 webhook route。

---

### 8. Verification Loops

- 建立 `PlanValidator`，在 `parse_output` 之後執行，不讓 parser 直接等於驗證。
- validator 至少檢查：
  - JSON schema 完整性
  - 時間格式與可解析性
  - sequenceOrder 連續性
  - 與既有 message 的排序衝突
  - targetGroups 合法性
  - 是否產生 0 則訊息但仍宣稱規劃成功
- 驗證失敗時回傳結構化 feedback，供 `repair` loop 使用。
- 對 knowledge extraction 也建立獨立 validator，檢查：
  - knowledgeType 合法
  - title / content 非空
  - 避免完全重複項目直接重寫入
- v1 不做第二模型 reviewer；verification loop 先用 deterministic validators。
- Phase 2 可再加入 `critic model` 或 rule+LLM hybrid review。

---

## 介面與型別變更

- 新增核心型別：
  - `ContextEnvelope`
  - `HarnessRun`
  - `HarnessStage`
  - `HarnessStepResult`
  - `ToolDefinition`
  - `ValidationIssue`
  - `AgentIntent`
  - `RateLimitResult`（新增：rate limit 檢查結果，含 `allowed`, `retryAfterSeconds`, `remaining`）
- `AgentChatResult` 新增或調整欄位：
  - `runId`
  - `status`：擴充為 `'queued' | 'completed' | 'failed' | 'rate_limited'`
  - `reply`
  - `generatedMessages`
  - `extractedKnowledge`
  - `sessionId`
  - `retryAfterSeconds`（rate_limited 時填入）
  - `rateLimitWarning`（接近上限時填入：`{ remaining, windowResetInSeconds }`）
- `activityMessages` 與 `activityKnowledge` 文件新增 `runId`。
- `agentSessions` 保留，但不再作為單次執行狀態唯一來源。
- **[修正七] 前端 sessionId 持久化**：`ActivityDetailPage` / `AgentChatPanel` 必須將 `sessionId` 存入 `localStorage`（key: `wippy_session_{activityId}`），不能只存 React component state。頁面載入時先從 localStorage 讀取，再與 Firestore `Activity.agentSessionId` 比對確認有效性；若不一致，以 Firestore 為準並更新 localStorage。`runId` 無需持久化，僅用於本次請求的 real-time 訂閱。
- 前端在收到 `status: 'queued'` 後，以 `runId` 訂閱 Firestore `harnessRuns/{runId}`（`onSnapshot`），顯示「正在思考中...」直到 status 變為 `completed` 或 `failed`。
- 前端在收到 `status: 'rate_limited'` 後，顯示倒數計時器，倒數結束後自動解鎖輸入框。

---

## 實作階段

### Phase 1: Harness 骨架落地

- 抽出 orchestrator、context builder、validator、persistence adapter。
- 保持現有 `/api/agent/chat` API 路徑不變，只替換內部實作。
- 修正 `agentSessionId` 未真正回寫 activity 的問題。
- 建立 `HarnessRun` collection，schema 含 `currentStage`（stage 開始前寫入）、`ttlExpiry`（30 天）、`llmCallCount`。
- **實作 Cloud Tasks 兩段式非同步架構**：webhook handler 立即回 200 + enqueue，harness worker 獨立執行。
- **實作 LLM rate limiting**：Firestore `rateLimits/{userId}` transaction，API 層攔截，前端倒數提示。
- **加入 SIGTERM handler**，防止 Cloud Run 終止產生 zombie HarnessRun。
- **統一 GCP structured log 格式**：所有 log 輸出為 JSON，必含 `severity`、`runId`、`activityId`、`stage`。直接輸出至 stdout，Cloud Run 自動轉送至 Cloud Logging。免費 tier 50 GB/月，搭配 Log-based Metrics 可做 Cloud Monitoring alerting，不需額外 APM 費用。範例：
  ```json
  { "severity": "ERROR", "runId": "...", "activityId": "...", "stage": "parse_output", "message": "JSON parse failed" }
  ```
- **建立 `activityKnowledge` composite index**：`activityId` + `knowledgeType` + `createdAt`，Phase 1 就建，避免 `load_context` 多個小查詢。

### Phase 2: Recovery 與 Safety 完整化

- 補 retry / repair / failure states。
- 將 `persist_effects` 改成 batch / transaction，加入 **chunk 邏輯（每批 ≤ 499 operations）**。
- 對 message plan 與 extracted knowledge 接上 validators。
- 補 execution limits（`maxLlmCallsPerRun`）與 structured error responses。
- Scheduler / send path 套入 retry + structured failure policy。

### Phase 3: LangGraph-ready 收斂

- 將 stage contract 與 tool contract 文件化。
- 明確標註哪些 stage 可直接對映為 graph nodes。
- 保持 domain service 與 orchestration 分離，避免未來框架綁死 Firestore schema。
- **[修正二] LangGraph 只跑 Cloud Run**：若要導入 LangGraph，先只替換 orchestrator runtime，不改 validator / repository / prompt mode。明確排除 LangGraph Cloud，LangGraph 僅作為跑在 Cloud Run 上的 library，不依賴任何付費的 LangSmith 或 LangGraph Cloud 服務。

---

## 測試計劃

- `agentChat` happy path：規劃成功、knowledge 提取成功、一般對話成功。
- parser 失敗：進入 repair loop，成功後可完成 run。
- validator 失敗：回傳結構化 issue，若 repair 仍失敗則 run 標記 failed。
- persistence 失敗：不得出現使用者看到成功但資料只寫一半。
- session continuity：同 activity 同 session 可延續，多 activity 不可錯接。
- activity 綁定：新 session 建立後，activity 必須正確保存 `agentSessionId`。
- review gate：未 approved 的 message 仍不可送出。
- traceability：message / knowledge 可由 `runId` 反查到單次執行。
- **rate limit**：第 10 次請求成功，第 11 次在同一 60 秒視窗內收到 `rate_limited` 回應與正確的 `retryAfterSeconds`；60 秒視窗重置後可再次發送。
- **rate limit 前端**：收到 `rate_limited` 後輸入框 disabled，倒數計時正確，倒數結束後自動解鎖。
- **接近上限警示**：第 8、9 次請求回應含 `rateLimitWarning`，前端顯示提示。
- **SIGTERM recovery**：模擬 Cloud Run 終止，確認 status=running 的 HarnessRun 被標記為 failed。
- **maxLlmCallsPerRun**：mock LLM 持續回傳 parse error，確認第 4 次 LLM 呼叫前 run 被標記 failed。
- **Batch chunk**：mock 500+ knowledge 條目，確認分批寫入成功且 persistedBatches 計數正確。
- 前端：送出訊息後保存 sessionId 至 localStorage、顯示「正在思考中...」、Firestore onSnapshot 觸發後刷新 plan / knowledge。
- 非回歸：scheduler 既有 approved-only 發送邏輯維持不變。

---

## 假設與預設

- 以 `單 Agent 強化` 為近期範圍，不在 v1 納入 multi-agent。
- 以 `LangGraph-ready` 為遷移方向，但 v1 不直接引入 LangGraph 套件。
- 先不開放自由式 LLM tool calling，tool layer 由 orchestrator 控制。
- 先不重構 scheduler / webhook 成同一 harness，只先讓 agent planning path 完整化。
- 人工審核仍是 WiPPY v1 的最終 safety gate，不用模型自動批准訊息。
- LLM rate limit 為 per-user 10 次/分鐘；若 provider 端調整上限，只需更新 `rateLimits` 檢查邏輯中的常數，不影響其他架構。
- Cloud Tasks 與 Firestore real-time listener 為 v1 的標準非同步通訊模式；v1 不導入 WebSocket 或 Server-Sent Events。
