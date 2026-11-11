# 第一次把 Grok Bot／Instinct 接上 WiPPY

先用自己的 Owner 帳號登入 WiPPY，準備一個可測試的 LINE 群組。這份指南使用目前 PR42 已實作的功能；不需要先學會部署。請向 Willy 取得 WiPPY 網站與後端網址。正式使用需可由外部 Agent 連上的 HTTPS；本輪本機 UAT 使用 emulator/mock，不能據此認定真實 Grok 或 Instinct 平台已完成安裝。

開始前，請 Willy 確認網站已包含 Agent Hub、Firebase 已開啟 Email/Password 登入，並已建立 Owner 帳號及設定 `OWNER_USER_ID`。WiPPY 沒有自行註冊入口；拿不到 Owner 帳號時，先請 Willy 提供，不要拿 Instinct 帳號建立其他 Agent。

## 先分清楚三種憑證

| 名稱 | 從哪裡取得 | 用在哪裡 |
| --- | --- | --- |
| WiPPY Agent API key | Owner 建立 Grok Bot，或按「重新產生 API Key」；完整值只顯示一次 | Grok → WiPPY REST/MCP 的 `Authorization: Bearer <YOUR_KEY>` |
| Routine Webhook key | Grok 平台建立 Routine 後提供 | WiPPY → Grok；填回 Agent 的 Routine Key，與 WiPPY key 不同 |
| Instinct Email／密碼 | Owner 建立 Instinct 後，一次顯示 | 登入工作台；程式使用時先換 Firebase ID token |

Instinct 不會取得 WiPPY API key，也不能把密碼直接填在 Bearer header。不要把 Owner 帳密交給外部 Agent。若完整憑證已關閉，無法再查看；請輪替 key 或重設密碼，再更新 Agent 端設定。

## 1. 先開放群組

1. 確認 WiPPY LINE bot 已加入測試群組，而且 WiPPY 的「群組」頁面已看得到它。若沒有，先在群組傳一則訊息，並請 Willy 檢查 LINE webhook。
2. 到「Agent Hub → 群組開放」，開啟要讀寫的群組。
3. 建立 Agent 時還要勾選該群組。**群組已開放 + Agent 允許清單勾選**必須同時成立。

驗收：Agent 列出的群組只有同時符合這兩個條件的群組。空清單通常是其中一個開關沒開，不是安裝成功後一定會看到所有群組。

## 2. 安裝 Grok Bot（先測 WiPPY，再接 Routine）

1. 「Agent Hub → Agent → 新增 Agent」，類型選「Grok Bot」，填名稱、每日發送上限並勾選測試群組。Routine 欄位可以先空白。
   每日發送上限須為 0 到 1000 的整數；0 代表不允許發送。Instinct 的收件匣逾時預警須為 1 到 720 的整數小時。
2. 按「建立 Agent」，保存黃色框中的 WiPPY API key 與 MCP 網址，然後按「我已保存」。勿把完整 key 放在截圖、git 或分享文件中。
3. 用下方 REST 自測。`<API_BASE_URL>` 是後端 origin，不含 `/api`；例如本輪本機是 `http://127.0.0.1:4142`。以下所有 `<...>` 都要替換；不要直接保留尖括號執行。

```bash
# 確認身分：預期 role=agent，agentName 是剛建立的名稱
curl -sS '<API_BASE_URL>/api/hub/me' \
  -H 'Authorization: Bearer <YOUR_KEY>'

# 取得群組 ID：下一步使用回傳的 groupId，不是 LINE 群組名稱
curl -sS '<API_BASE_URL>/api/hub/v1/groups' \
  -H 'Authorization: Bearer <YOUR_KEY>'

# 讀群組的近期活動訊息；只有開放後 WiPPY 實際收到的訊息會被保存
curl -sS '<API_BASE_URL>/api/hub/v1/groups/<GROUP_ID>/messages?limit=20' \
  -H 'Authorization: Bearer <YOUR_KEY>'

# 搜尋活動文字；用 --data-urlencode 處理中文
curl -sS -G '<API_BASE_URL>/api/hub/v1/messages/search' \
  --data-urlencode 'q=活動' -H 'Authorization: Bearer <YOUR_KEY>'

# 查今日剩餘次數及 LINE 本月額度
curl -sS '<API_BASE_URL>/api/hub/v1/quota' \
  -H 'Authorization: Bearer <YOUR_KEY>'
```

4. 在 Grok 平台建立 Webhook Routine，取得「POST to」網址及 Routine key。實際介面和能否加入自訂遠端 MCP 取決於你的平台/方案；WiPPY 不會代你建立 Routine。若平台不支援，先用 REST 整合，不要把普通聊天視為已接上 MCP。
5. 回 WiPPY Agent 清單，填「Routine 網址（名稱）」及「Routine Key（名稱，留空表示不變）」，按「儲存設定」後按「測試 Webhook」。預期「Webhook 測試成功（HTTP 2xx）」。只表示 WiPPY → Routine 可連線，還要測反向 REST/MCP。
6. 在外部 Agent 的遠端 MCP 設定填黃色框的完整網址，transport 使用 Streamable HTTP，header 是 `Authorization: Bearer <YOUR_KEY>`。不使用 SSE GET。若整合器只能輸入 URL、不能附 header，就不能用這種 key 驗證方式。

MCP 也能直接自測（JSON-RPC POST；工具參數是平的，與 REST 的 `params` 外層不同）：

```bash
curl -sS '<API_BASE_URL>/api/hub/mcp' \
  -H 'Authorization: Bearer <YOUR_KEY>' -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"Grok Bot","version":"1"}}}'

curl -sS '<API_BASE_URL>/api/hub/mcp' \
  -H 'Authorization: Bearer <YOUR_KEY>' -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

curl -sS '<API_BASE_URL>/api/hub/mcp' \
  -H 'Authorization: Bearer <YOUR_KEY>' -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_groups","arguments":{}}}'
```

驗收：`initialize` 回傳 `serverInfo.name=wippy-agent-hub`；工具清單包含 `list_groups`、`get_messages`、`send_message`，`list_groups` 的 `structuredContent.groups` 與 REST 相同。

## 3. 發送、記錄與排程

確認測試群組可以接收訊息，再執行：

```bash
curl -sS '<API_BASE_URL>/api/hub/v1/actions' \
  -H 'Authorization: Bearer <YOUR_KEY>' -H 'Content-Type: application/json' \
  -d '{"type":"send_message","idempotencyKey":"install-send-001","params":{"groupId":"<GROUP_ID>","text":"Grok Bot 已接上 WiPPY"}}'

curl -sS '<API_BASE_URL>/api/hub/v1/actions' \
  -H 'Authorization: Bearer <YOUR_KEY>' -H 'Content-Type: application/json' \
  -d '{"type":"record","idempotencyKey":"install-record-001","params":{"groupId":"<GROUP_ID>","category":"活動","title":"安裝驗收","content":"已讀活動並確認群組"}}'

curl -sS '<API_BASE_URL>/api/hub/v1/records' -H 'Authorization: Bearer <YOUR_KEY>'

# MCP 寫入範例：參數直接放在 arguments，不要再包 params
curl -sS '<API_BASE_URL>/api/hub/mcp' \
  -H 'Authorization: Bearer <YOUR_KEY>' -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"record","arguments":{"idempotencyKey":"install-mcp-record-001","groupId":"<GROUP_ID>","category":"活動","title":"MCP 安裝驗收","content":"MCP 寫入成功"}}}'

# <FUTURE_ISO_TIME> 換成未來的 ISO 8601 時間，必須包含時區
curl -sS '<API_BASE_URL>/api/hub/v1/actions' \
  -H 'Authorization: Bearer <YOUR_KEY>' -H 'Content-Type: application/json' \
  -d '{"type":"schedule_message","idempotencyKey":"install-schedule-001","params":{"groupId":"<GROUP_ID>","text":"活動提醒","sendAt":"<FUTURE_ISO_TIME>"}}'
```

每個新動作換新的 `idempotencyKey`。網路中斷重試同一要求才重用原鍵；成功重送會 `replayed=true` 且不再發送。修正被退回的內容或權限後，要用新鍵，舊鍵會回原結果。

**HTTP 200 不等於動作成功**：檢查 `status`。`done` 完成；`queued` 已排入重試，可用 `GET /api/hub/v1/actions/<ACTION_ID>` 查進度；`blocked` 看 `code/detail`；`invalid` 修正欄位。MCP 另檢查 `result.isError`。

Hub 沒有草稿 API，也不提供活動 CRUD（例如 `list_activities`）。「讀活動」在這裡是讀群組訊息、紀錄及派送內容。Owner 的活動管理在網站「活動」，不是給 Grok key 呼叫的 Hub API。`record` 是紀錄，不是待核准草稿；`schedule_message` **直接核准並建立排程**，會使用每日次數，請填你確定要發的內容。立即文字發送、未來排程都不是人工核准流程。

其他支援動作可用 `GET /api/hub/v1/tools` 查參數：`send_alert`（需 Owner 先設定預警群組）、`send_link`、`send_image`、`send_video`、`send_audio`（媒體由 Agent 自備 HTTPS、免登入可開啟的網址）。

## 4. 讓 Grok 自動接到群組工作

1. 「Agent Hub → 規則」建立規則，選剛建立的 Grok，勾選群組；條件選關鍵字，填「測試WiPPY」，指令填「讀活動並回覆收到」。
2. 可先不勾「附重點整理」以免依賴 LLM；勾「附原始訊息」。
3. Routine 的指令：收到 `kind=wippy.test` 只確認連線；收到 `kind=wippy.dispatch` 讀 `rule.instruction`、`messages`、`digest`（可能 null），以 WiPPY REST/MCP 執行需要的動作。
4. 在測試群組傳「測試WiPPY 請回覆收到」。「執行紀錄 → 派送」應出現 `sent`；這不是完成。
5. Agent 做完必須呼叫 `complete_dispatch`；REST 如下，或 MCP 同名工具帶 `jobId`、`summary`、新的 `idempotencyKey`：

```bash
curl -sS '<API_BASE_URL>/api/hub/v1/dispatches/<JOB_ID>' -H 'Authorization: Bearer <YOUR_KEY>'
curl -sS '<API_BASE_URL>/api/hub/v1/dispatches/<JOB_ID>/complete' \
  -H 'Authorization: Bearer <YOUR_KEY>' -H 'Content-Type: application/json' \
  -d '{"idempotencyKey":"install-complete-dispatch-001","summary":"已讀活動並回覆收到"}'
```

驗收：群組收到一則回覆，派送 `completed`，動作與稽核都有紀錄。若沒有真的接 Grok 平台，此步只能標示 mock 驗證。

兩個 `/complete` 捷徑端點都可在 JSON body 帶 `idempotencyKey`。同一要求重送時保留原鍵；若因撤權被擋，Owner 恢復授權後用新鍵重新送出。未帶鍵時依「端點類型 + 工作 ID」產生預設鍵，重複呼叫只重播原結果；派送和收件匣的預設鍵互不共用。

## 5. 安裝 Instinct

1. Owner 到「Agent Hub → Agent」，類型選「Instinct」，填名稱與專用 Email，勾選群組、設定每日上限及逾時預警時數，按「建立 Agent」。帳號由 Owner 建立，不是自行註冊；不會寄邀請信。
2. 保存黃色框的 Email／密碼，連同網站 `/login` 網址交給 Instinct。它只有工作台和紀錄權限。
3. 用無痕視窗登入。應直接進「工作台」，看不到 Owner 的 Agent Hub 設定；手動輸入 `/hub/agents` 會導回工作台。
4. Owner 建立另一條關鍵字規則，交給此 Instinct。群組傳關鍵字後，工作台收件匣應出現一筆。
5. Instinct 開啟項目，讀「擁有者的指令」、原始訊息／整理。在「執行動作」選動作、群組、填內容後按「送出動作」。確認「已完成」，再填「完成備註」按「標記完成」。項目應離開待處理清單。
6. 依需求讓 Instinct 定期登入，例如每 2 小時；WiPPY 不會主動呼叫它，也不會替外部平台設定登入排程。

工作台遇到「無法標記完成」或「搜尋失敗」時，先確認連線與登入狀態，再按原按鈕重試。完成備註與搜尋關鍵字會保留；只有成功完成才會離開待處理清單。搜尋失敗會清除舊結果，搜尋成功但無符合資料會顯示「沒有符合的訊息」。

如果你使用腳本模擬 Instinct：先透過 Firebase 的 `accounts:signInWithPassword` 以它的 Email/密碼取得 `idToken`（需要 Willy 的 Firebase Web API 設定），之後把上方範例的 Bearer 值換成 `<FIREBASE_ID_TOKEN>`。token 會過期；由 Firebase SDK 重新整理或再次登入。不要把 token／密碼寫入測試報告。

```bash
# 回傳的 idToken 是下一步的 <FIREBASE_ID_TOKEN>，expiresIn 是有效秒數
curl -sS 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<FIREBASE_WEB_API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"email":"<INSTINCT_EMAIL>","password":"<INSTINCT_PASSWORD>","returnSecureToken":true}'

curl -sS '<API_BASE_URL>/api/hub/me' -H 'Authorization: Bearer <FIREBASE_ID_TOKEN>'
curl -sS '<API_BASE_URL>/api/hub/v1/inbox?status=open' -H 'Authorization: Bearer <FIREBASE_ID_TOKEN>'
curl -sS '<API_BASE_URL>/api/hub/v1/inbox/<ITEM_ID>/complete' \
  -H 'Authorization: Bearer <FIREBASE_ID_TOKEN>' -H 'Content-Type: application/json' \
  -d '{"idempotencyKey":"install-complete-inbox-001","note":"已讀活動並處理完成"}'
```

驗收：`/api/hub/me` 為 `role=agent`；同一 token 呼叫 `/api/hub/admin/agents` 應 403。Instinct 可用相同的 `/api/hub/v1` 動作格式，限額與群組限制相同。

## 6. 停用、恢復與限制驗收

| 操作 | 預期 |
| --- | --- |
| Owner 按「停用」，拿原 key/token 呼叫 me | 403 `agent_disabled`；若 Firebase 先偵測到登入帳號停用則回 `account_disabled`。目前已登入的 Instinct 也不能繼續用 API |
| Owner 按「啟用」並重整 | 原群組／每日上限／Instinct 逾時時數保留，呼叫恢復 |
| 移除某群組的允許勾選或關閉群組開放 | Agent 看不到該群組與舊收件匣；舊派送與訊息直接讀取 403 `group_not_allowed`；發送、完成舊派送／收件匣回 `blocked`、`group_not_allowed`，不修改原工作。已交付給外部 Agent 的內容無法收回 |
| 每日上限設 0，或用完次數 | 動作 `blocked`、`agent_daily_limit`，不會送到 LINE |
| 重新產生 API Key | 舊 key 立刻 401 `invalid_api_key`，新 key 可用；記得更新外部 Agent |
| 重設 Instinct 密碼 | 舊密碼無法新登入；新密碼可登入。若要立刻擋住既有登入，請停用 Agent |

## 7. 常見卡關

| 回應／現象 | 下一步 |
| --- | --- |
| 401 `unauthenticated` | 補 `Authorization: Bearer ...` header |
| 401 `invalid_api_key` | 確認用 WiPPY key，且不是 Routine key、不是已輪替的舊 key |
| 「Webhook 測試失敗」且顯示 HTTP 401 | 確認 Routine URL／Routine Key 是同一個 Routine 提供的值，不要填 WiPPY key |
| 401 `invalid_token` | Instinct 重新登入取得 Firebase token；不要用密碼當 Bearer |
| 403 `agent_disabled` | 請 Owner 啟用 Agent |
| 403 `account_disabled`／網站「此帳號已停用」 | 請 Owner 啟用 Instinct。Firebase 可能在重整時自動登出，回登入頁後重新登入；若仍在停用提示畫面，按「重試」 |
| 403 `forbidden` | 正在用 Agent 身分打 Owner 專用 admin API |
| 403 `group_not_allowed`／群組清單空白 | 檢查群組開放、Agent 允許清單與 bot 是否仍在群組 |
| `agent_daily_limit` | 等台北時間隔日或由 Owner 調整每日上限 |
| `line_quota_reserve` | LINE 本月剩餘量已達預警保留值；不要反覆重試 |
| `invalid_params`／`invalid_request` | 查 `/api/hub/v1/tools` 的必填欄位；REST params 和 MCP arguments 格式不同 |
| `url_not_https`／`send_at_in_past` | 改用公開 HTTPS 網址／有時區的未來時間，換新冪等鍵 |
| 503 `owner_not_configured`／`encryption_key_missing` | 交給 Willy 補伺服器設定 |
| 網站「暫時連不上 WiPPY」 | 檢查後端網路，按「重試」；不代表帳號沒權限 |

## Willy 需自行提供的機密與設定（僅名稱）

機密：`LINE_CHANNEL_ACCESS_TOKEN`、`LINE_CHANNEL_SECRET`、`HUB_ENCRYPTION_KEY`、`SCHEDULER_SECRET`、`INTERNAL_HARNESS_SECRET`、Grok Routine Webhook Key、WiPPY Agent API Key、Instinct Password、Firebase Admin Service Account Credentials。

設定：`OWNER_USER_ID`、`FIREBASE_PROJECT_ID`、`HUB_PUBLIC_BASE_URL`、`HUB_MEDIA_BUCKET`、`HUB_TASKS_PROJECT`、`HUB_TASKS_LOCATION`、`HUB_TASKS_QUEUE`、`CLOUD_RUN_SERVICE_URL`、Firebase Web App Config、WiPPY Website URL、Grok Routine Webhook URL、LINE Webhook URL、LINE Group IDs、Alert Group ID、Agent Daily Send Limit、Instinct Email、Instinct Polling Schedule。

若勾選規則摘要，另需所選 LLM provider 的設定及 API key。部署人員依[雲端建置指引](../agent-hub-setup-guide.md)準備；本指南不執行部署。

本機開發者驗收：先備妥 Node.js 20+、系統 Google Chrome（`/usr/bin/google-chrome`）、Auth 9299／Firestore 8285 emulator（project `demo-wippy-pr42`）。在 repo 根目錄依序執行：

```bash
npm ci --cache /tmp/wippy-install-npm-cache
npm --prefix backend ci --cache /tmp/wippy-install-npm-cache
npm --prefix frontend ci --cache /tmp/wippy-install-npm-cache
npm run test:e2e
```

測試會先編譯 backend，再自動啟停 4141／4142／4143，不下載瀏覽器。若要親自用瀏覽器測 mock 版，先執行 `npm --prefix backend run build`，再執行 `node e2e/stack.cjs` 後開 `http://127.0.0.1:4141`。Owner 測試登入資料由 `e2e/stack.cjs` 的 emulator-only fixture 提供，請勿套用正式帳密；完成自動測試後留下的測試 Agent 憑證不可回查，可在 UI 新建或輪替。測完 Ctrl+C 關閉。這是本機 mock，沒有公開 HTTPS URL。
