# WiPPY

LINE 群組 × AI Agent 中樞。WiPPY 收下 LINE 群組的訊息與媒體，依你設定的規則交給外部 Agent（xAI Grok Bot、Instinct）判斷；Agent 再透過 WiPPY 發訊息、發預警、記錄重點，或把它們做好的網頁和媒體發到群組。另外保留原本的「AI 規劃活動推播」。

---

## Overview

- **Agent Hub**（`backend/src/hub`、`frontend/src/hub`）
  - 收訊：開放的群組才會保存文字、圖片、影片、語音、檔案（媒體立刻下載到私有 bucket）
  - 規則：關鍵字、訊息類型、@機器人、訊息量、定時；可附免費模型做的重點整理
  - 派送：Grok Bot 走 Routine webhook，Instinct 進工作台收件匣
  - 執行：Agent 透過 REST `/api/hub/v1` 或 MCP `/api/hub/mcp` 要求 WiPPY 發送、記錄、排程；WiPPY 只做硬流程驗證（https、免登入可開、LINE 規格、額度），不製作也不修改內容
  - 保護：群組預設關閉、每日發送上限、LINE 額度保留 5% 給預警、70%/90% 額度預警、冪等鍵、稽核紀錄、失敗自動重試
- **活動推播**（Harness Pipeline）：用自然語言規劃訊息，核准後排程推送
- 規格：`docs/specs/2026-11-04-agent-hub.md`；上線步驟：`docs/agent-hub-setup-guide.md`

新手接上自己的 AI 助手：請從 [Grok Bot／Instinct 安裝指南](docs/agent-hub/INSTALL-GROK-BOT-AND-INSTINCT.md) 開始（含 REST/MCP 範例、憑證與限額驗收）。

### Agent Hub 架構

```
LINE webhook ─▶ 收訊（去重、存檔、媒體下載佇列）
                  │
                  ▼
              規則引擎 ◀── /scheduler/hub-tick（定時規則、收件匣逾時）
                  │
         ┌────────┴─────────┐
         ▼                  ▼
  Grok Routine webhook   Instinct 收件匣（工作台）
         │                  │
         ▼                  ▼
  MCP / REST ──▶ Hub 動作：權限 → 冪等 → 驗證 → 額度 → LINE 發送 → 稽核
                  │
                  └─ 失敗 → Cloud Tasks 退避重試 → 最後失敗發預警
```

## Architecture

```
User (Chat UI)
     │
     ▼
POST /api/agent/chat
     │
     ▼
HarnessRun (Firestore, status: queued)
     │
     ├── Cloud Tasks (prod) ──► POST /internal/harness
     └── Direct call (dev)  ──┐
                               ▼
              ┌─────────────────────────────────┐
              │      Harness Orchestrator        │
              │                                 │
              │  1. load_context                │
              │  2. build_prompt                │
              │  3. run_planner  ──► LLM        │
              │  4. parse_output                │
              │  5. validate_output             │
              │  6. persist_effects ──► Firestore│
              │  7. finalize_response           │
              └─────────────────────────────────┘
```

### Output Intent

| Intent | 說明 |
|---|---|
| `plan_messages` | 產生訊息排程，寫入 Firestore 並準備推播 |
| `extract_knowledge` | 從對話中萃取知識，更新群組知識庫 |
| `general_chat` | 一般問答，不觸發副作用 |

每次執行都建立一筆 `harnessRuns/{runId}`，記錄 `currentStage`、`llmCallCount`、`status` 供觀測與重試。

---

## Harness Pipeline — v0.5 (preview)

> 目前版本為 **v0.5 (preview)**。Pipeline 已具備基本可觀測性、自動修復與非同步執行能力，已知限制與後續方向見 [Roadmap](#roadmap)。

### 7-Stage 總表

| # | Stage | 檔案 | 做什麼 |
|---|---|---|---|
| 1 | `load_context` | `contextBuilder.ts` | 平行查詢 Firestore，撈活動資料、知識庫、現有排程、歷史對話，組成 `ContextEnvelope` |
| 2 | `build_prompt` | `harnessOrchestrator.ts` | 將 `ContextEnvelope` 注入 system prompt（知識庫、目標群組、現有排程、JSON 落地規則），拼接最近 10 輪對話，組成送給 LLM 的 messages 陣列 |
| 3 | `run_planner` | `llmProvider.ts` | 呼叫 LLM；每次 run 最多 3 次 LLM 呼叫（含 repair），捕捉 429 轉為結構化 `llm_rate_limit_error` |
| 4 | `parse_output` | `harnessOrchestrator.ts` | 從 raw reply 推斷 intent：能解析 JSON 陣列 → `plan_messages`；含 `EXTRACTED_KNOWLEDGE:` 區塊 → `extract_knowledge`；否則 → `general_chat` |
| 5 | `validate_output` | `planValidator.ts` | 驗證 `plan_messages` 的欄位合法性（ISO datetime、sequenceOrder 不重複、content 非空等）；失敗時送回 LLM 進行一次 repair，repair 後仍失敗則整個 run 標記 failed |
| 6 | `persist_effects` | `persistenceAdapter.ts` | 批次寫入訊息排程與知識庫（每批 ≤ 499 ops）；所有寫入帶 `runId` 確保可追溯；session history 保留最近 20 筆 |
| 7 | `finalize_response` | `harnessOrchestrator.ts` | 截掉回覆中的 `EXTRACTED_KNOWLEDGE` 區塊；若成功寫入排程則替換為固定確認文案；將 `HarnessRun` 寫為 `completed` |

### LLM Prompt 組成方式

`load_context` 撈到的資料透過兩個管道進入 LLM：

**管道一：system prompt（靜態背景）**

```
### 活動知識庫
[BACKGROUND] 曾在某處發生，像這樣- 漂書活動企劃書
五本書，五種情境，五次還沒被命名的體驗...
（完整活動企劃、氛圍調性、選書哲學）

### 目標群組
{line_group_id_1}, {line_group_id_2}

### 現有推播企畫
[1] 2026-04-27T18:30:00+08:00 — 整理書架時，看著那些讀過的書...
[2] 2026-04-28T20:30:00+08:00 — 讀書最美的時候，往往不是在書封上...
```

**管道二：message history（對話記憶）**

```
[
  { role: "system",    // ↑ 上方組好的 system prompt           },
  { role: "user",      // 歷史對話 turn -4                      },
  { role: "assistant", // 歷史對話 turn -4 回覆                  },
  ...                  // 最多保留最近 10 輪                     
  { role: "user",      // 本次使用者輸入                         }
]
```

`activityId`、`userId`、`sessionId` 只在 orchestrator 層使用，不進入 LLM。

### HarnessRun 可觀測性

每次執行都在 `harnessRuns/{runId}` 留下完整紀錄：

```
status       : queued → running → completed | failed
currentStage : load_context → build_prompt → ... → finalize_response
llmCallCount : 1–3
intentType   : plan_messages | extract_knowledge | general_chat
lastError    : (失敗時填入，如 repair_failed / max_llm_calls_exceeded)
```

---

## Roadmap

### v0.5 (preview) 已知限制（程式碼已驗證）

| 限制 | 說明 |
|---|---|
| Knowledge validator 未接入 | `validateExtractedKnowledge()` 已實作並有測試，但 orchestrator 只 import `validateMessagePlan`，knowledge 寫入前僅做 type 白名單過濾，不檢查 title / content 是否為空 |
| 單一 prompt 承擔三種 intent | `buildSystemPrompt()` 只有一個，三種 intent 共用同一組 system prompt，intent 在 `parse_output` 事後推斷，而非事前分流 |
| 跨批寫入無原子性 | `persistEffects()` 分批 `batch.commit()`，若第一批成功、第二批失敗，資料部分寫入，目前無補償邏輯，僅靠 `runId` 事後追溯 |

### Phase 2：Recovery 與 Safety 強化

- 將 `validateExtractedKnowledge()` 接進 orchestrator 的 `validate_output` stage
- 建立分層錯誤分類（`context_load_error` / `llm_rate_limit_error` / `persistence_error` 等），每類有明確 retry 策略
- `persist_effects` 多批寫入加補償邏輯（依 `runId` 重試未完成的批次）
- Scheduler / send path 套入相同的 retry + structured failure policy

### Phase 3：LangGraph-ready

- 每種 intent 有獨立 prompt mode（`plan_messages` / `extract_knowledge` / `general_chat` 各自的 system prompt），不共用單一 prompt
- 將每個 stage 顯式化為 tool contract（name、input/output schema、timeout、retry policy），為接 LangGraph 做準備
- `ContextEnvelope` 生成器替換為 retrieval-augmented 版本（召回相關知識，而非全量載入）
- 明確標註 pause hook（`pause_before_persist`、`pause_after_validate`）對應 LangGraph human-in-the-loop 中斷點

---

## Tech Stack

**Backend**
- Node.js 18+ / Express / TypeScript
- Firebase Admin SDK + Firestore
- Google Genai SDK (`@google/genai`)
- LINE Bot SDK (`@line/bot-sdk`)
- Cloud Tasks（非同步 job queue）
- date-fns / date-fns-tz

**Frontend**
- React 19 / TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Firebase SDK 12

**Infrastructure**
- Google Cloud Run（backend）
- Firebase Hosting（frontend）
- Firestore（database）

---

## Project Structure

```
WiPPY/
├── backend/
│   └── src/
│       ├── routes/
│       │   ├── api/          # 對外 API（agent chat、activities 等）
│       │   ├── internal/     # Cloud Tasks worker（harness）
│       │   ├── webhook.ts    # LINE Bot webhook
│       │   └── scheduler.ts  # 定時推播觸發
│       ├── hub/                # Agent Hub（收訊、規則、派送、動作、MCP、後台 API）
│       │   ├── core/           # ports、adapters（Firestore/GCS/LINE）、佇列與重試
│       │   └── http/           # /api/hub/admin、/api/hub/v1、/api/hub/mcp、排程
│       ├── services/
│       │   ├── harnessOrchestrator.ts  # 7-stage pipeline 核心
│       │   ├── llmProvider.ts          # LLM 抽象層
│       │   ├── contextBuilder.ts       # Stage 1：載入 context
│       │   ├── planValidator.ts        # Stage 5：驗證輸出
│       │   ├── persistenceAdapter.ts   # Stage 6：寫回 Firestore
│       │   └── cloudTasksService.ts    # Cloud Tasks enqueue
│       └── middleware/
│           └── auth.ts
├── frontend/
│   └── src/
│       ├── hub/                # Agent Hub 後台頁面與 Agent 工作台
│       ├── components/
│       │   ├── AgentChatPanel.tsx
│       │   ├── MessagePlanTable.tsx
│       │   └── KnowledgeEditor.tsx
│       ├── pages/
│       │   ├── Activities.tsx
│       │   ├── ActivityDetail.tsx
│       │   └── Groups.tsx
│       ├── contexts/
│       │   └── AuthContext.tsx
│       └── lib/              # API client、Firestore helpers、scheduling
├── firebase.json
├── firestore.rules
└── firestore.indexes.json
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Firebase CLI：`npm install -g firebase-tools`
- Google Cloud 專案（已啟用 Firestore、Cloud Run、Cloud Tasks）
- LINE Messaging API channel

### Installation

```bash
# Clone repo
git clone <repo-url>
cd WiPPY

# 安裝 backend 依賴
cd backend && npm install

# 安裝 frontend 依賴
cd ../frontend && npm install
```

### Environment Variables

在 `backend/` 建立 `.env`：

```env
# Firebase
GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json
FIREBASE_PROJECT_ID=your-project-id

# Google Genai
GOOGLE_GENAI_API_KEY=your-api-key

# LINE Bot
LINE_CHANNEL_ACCESS_TOKEN=your-token
LINE_CHANNEL_SECRET=your-secret

# Cloud Tasks（prod 用，本機留空則走同步模式）
CLOUD_TASKS_QUEUE=your-queue-name
CLOUD_TASKS_LOCATION=asia-east1
HARNESS_SECRET=your-internal-secret

# Server
PORT=8080
```

### Running Locally

```bash
# Terminal 1：啟動 Firebase Emulator
firebase emulators:start --only firestore

# Terminal 2：啟動 backend（同步模式，不需 Cloud Tasks）
cd backend
npm run dev

# Terminal 3：啟動 frontend
cd frontend
npm run dev
```

Frontend 預設跑在 `http://localhost:5173`，backend 在 `http://localhost:8080`。

---

## Scripts

**Backend**

| 指令 | 說明 |
|---|---|
| `npm run dev` | 以 ts-node 啟動（單次） |
| `npm run dev:watch` | nodemon 熱重載 |
| `npm run build` | 編譯 TypeScript → dist/ |
| `npm start` | 執行編譯後的 dist/index.js |
| `npm test` | Jest 跑一次 |
| `npm run test:watch` | Jest watch 模式 |

**Frontend**

| 指令 | 說明 |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | TypeScript 編譯 + Vite build |
| `npm run lint` | ESLint 檢查 |
| `npm test` | Vitest 跑一次 |
| `npm run test:watch` | Vitest watch 模式 |

---

## Key Files

| 檔案 | 說明 |
|---|---|
| `backend/src/services/harnessOrchestrator.ts` | Harness 7-stage pipeline 主邏輯 |
| `backend/src/services/llmProvider.ts` | LLM 呼叫抽象（支援切換模型） |
| `backend/src/routes/api/agent.ts` | `POST /api/agent/chat` 進入點 |
| `backend/src/services/contextBuilder.ts` | Stage 1：組裝 LLM context |
| `backend/src/services/planValidator.ts` | Stage 5：驗證訊息排程合理性 |
| `backend/src/services/persistenceAdapter.ts` | Stage 6：寫回 Firestore |
| `frontend/src/components/AgentChatPanel.tsx` | 對話 UI 元件 |
| `firestore.rules` | Firestore 安全規則 |

---

## Testing

```bash
# Backend（Jest + ts-jest）
cd backend && npm test

# Frontend（Vitest + Testing Library）
cd frontend && npm test
```

測試檔案位於各自的 `src/__tests__/` 目錄。

---

## Deployment

**Backend → Cloud Run**

```bash
cd backend
npm run build
gcloud run deploy wippy-backend \
  --source . \
  --region asia-east1 \
  --allow-unauthenticated
```

**Frontend → Firebase Hosting**

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

**Firestore Rules & Indexes**

```bash
firebase deploy --only firestore
```

---

## Documentation

- [`AGENT_HARNESS_ARCHITECTURE.md`](AGENT_HARNESS_ARCHITECTURE.md) — Harness pipeline 完整實作說明
- [`LLM_OUTPUT_FORMAT.md`](LLM_OUTPUT_FORMAT.md) — LLM 輸出格式規格

---

## License

MIT
