# Agent Hub 雲端建置與上線指引

照著順序做。每一步都寫了：**做什麼**、**為什麼**、**怎麼確認做對了**、**這招還能用在哪**。

> **安全網**
> - 群組預設全部「未開放」，Agent 也還沒建立，所以部署本身不會讓任何訊息送到外部 AI。
> - 出事時的緊急開關：後台「Agent Hub → Agent」按「停用」，或在「群組開放」把群組關掉，立刻生效。

下面的指令都在你自己的電腦執行（PowerShell 或 bash 都可以），需要已登入 `gcloud`，專案是 `wippy-mvp`。

```bash
gcloud config set project wippy-mvp
```

---

## 0. 確認擁有者身分 `OWNER_USER_ID`

- **做什麼**：
  1. 到 Firebase Console → Authentication → 使用者，找到你自己帳號的「使用者 UID」。
  2. 確認 Cloud Run 上的 `OWNER_USER_ID` 就是這個值：

     ```bash
     gcloud run services describe wippy-backend --region asia-east1 --format="value(spec.template.spec.containers[0].env)"
     ```

  3. 如果沒有，或值不同，設定它：

     ```bash
     gcloud run services update wippy-backend --region asia-east1 --update-env-vars OWNER_USER_ID=<你的UID>
     ```

- **為什麼**：
  - 新版後台只允許這個 UID 使用。其他人就算能登入 Firebase，也進不了後台。
  - Instinct 的帳號只能進「工作台」。
  - 沒設定的話，任何登入的人都會被當成擁有者（只適合本機開發）。
- **怎麼確認**：上線後用你的帳號登入，上方選單看得到「Agent Hub」。
- **其他用途**：用「伺服器端白名單」決定誰是管理者，而不是相信前端。只要是單一管理者的內部系統都適用。

## 1. 設定兩個 GitHub Secrets

- **做什麼**：
  1. 到 GitHub repo → Settings → Secrets and variables → Actions → New repository secret，新增：
     - `HUB_ENCRYPTION_KEY`：一串隨機字串
     - `SCHEDULER_SECRET`：另一串隨機字串
  2. 產生隨機字串：

     ```bash
     openssl rand -base64 32
     ```

- **為什麼**：
  - `HUB_ENCRYPTION_KEY` 用來加密保存 Grok Routine 的 key。資料庫外洩時，對方也拿不到明文 key。
  - `SCHEDULER_SECRET` 讓只有你的排程器能呼叫 `/scheduler/hub-*`。
  - 部署流程每次都會用 Secrets 覆蓋 Cloud Run 的值，所以**不要只在 Cloud Run 手動設定**，否則下次部署會被清空。
  - `HUB_ENCRYPTION_KEY` 設定後**不要更換**；換了的話，已存的 Routine key 要重新輸入一次。
- **怎麼確認**：Secrets 頁面看得到這兩個名稱（值看不到是正常的）。
- **其他用途**：任何「機密放在 CI 的 Secret、設定檔只放非機密值」的部署都這樣做。

## 2. 建立私有媒體 bucket

- **做什麼**：

  ```bash
  gcloud storage buckets create gs://wippy-mvp-hub-media --location=asia-east1 --uniform-bucket-level-access --public-access-prevention
  ```

  設定 180 天自動刪除。先建一個 `lifecycle.json`：

  ```json
  {"rule":[{"action":{"type":"Delete"},"condition":{"age":180}}]}
  ```

  套用：

  ```bash
  gcloud storage buckets update gs://wippy-mvp-hub-media --lifecycle-file=lifecycle.json
  ```

  查出 Cloud Run 使用的服務帳號（下面記為 `<RUNTIME_SA>`）：

  ```bash
  gcloud run services describe wippy-backend --region asia-east1 --format="value(spec.template.spec.serviceAccountName)"
  ```

  授權它讀寫這個 bucket：

  ```bash
  gcloud storage buckets add-iam-policy-binding gs://wippy-mvp-hub-media --member="serviceAccount:<RUNTIME_SA>" --role="roles/storage.objectAdmin"
  ```

  允許它替自己簽名，用來產生給 Agent 的 7 天下載連結：

  ```bash
  gcloud iam service-accounts add-iam-policy-binding <RUNTIME_SA> --member="serviceAccount:<RUNTIME_SA>" --role="roles/iam.serviceAccountTokenCreator"
  ```

- **為什麼**：
  - LINE 會在一段時間後刪除使用者傳的圖片和檔案，所以 WiPPY 一收到就要存下來。
  - bucket 不公開，只透過有期限的簽名連結給 Agent，避免群組內容外流。
  - 180 天自動刪除可以控制成本和隱私風險。
- **怎麼確認**：上線後，在開放的群組傳一張圖，到「Agent Hub → 執行紀錄 → 媒體」不會出現失敗；bucket 裡會出現 `line-media/<群組>/<訊息>` 檔案。
- **其他用途**：「私有 bucket + 簽名網址 + 生命週期規則」適合任何需要暫時分享檔案的場景。

## 3. 建立 Cloud Tasks 佇列

- **做什麼**：

  ```bash
  gcloud tasks queues create wippy-hub-jobs --location=asia-east1 --max-attempts=3 --min-backoff=10s --max-dispatches-per-second=5
  ```

  授權服務帳號把工作放進佇列（以前做過的話可以跳過）：

  ```bash
  gcloud projects add-iam-policy-binding wippy-mvp --member="serviceAccount:<RUNTIME_SA>" --role="roles/cloudtasks.enqueuer"
  ```

- **為什麼**：
  - 下載媒體、呼叫 Grok、重試發送都需要「失敗後幾分鐘再試」。
  - Cloud Run 回應完請求後，程式可能被暫停；放進 Cloud Tasks 才能保證工作一定會被執行。
  - WiPPY 自己控制重試次數（最多 8 次，間隔越拉越長），佇列的 3 次只是機器當掉時的保險。
- **怎麼確認**：Console → Cloud Tasks 看得到 `wippy-hub-jobs`；上線後傳圖片時，佇列會短暫出現工作再消失。
- **其他用途**：任何「不能卡住使用者請求、但一定要完成」的背景工作，例如寄信、呼叫第三方 API。

## 4. 合併 PR 並確認部署

- **做什麼**：
  1. Merge PR。
  2. 等 GitHub Actions 的「Deploy Production」跑完。部署會自動套用 Firestore 規則和索引，以及第 1 步的 Secrets。
- **為什麼**：程式、索引、規則要一起上線，否則查詢會因為缺索引而失敗。
- **怎麼確認**：
  - 打開 `https://wippy-backend-ts2nxgrpfa-de.a.run.app/health`，應該回 `{"status":"ok"}`。
  - 用你的帳號登入 `https://wippy-mvp.web.app`，點得到「Agent Hub」。
  - 新索引可能要建置幾分鐘，這段時間 Hub 頁面報錯是正常的，可以在 Console → Firestore → 索引看進度。
- **其他用途**：基礎設施跟程式一起放在版本控制裡，一起部署（Infrastructure as Code）。

## 5.（建議）開啟 Firestore TTL

- **做什麼**：

  ```bash
  gcloud firestore fields ttls update ttl --collection-group=groupMessages --enable-ttl
  ```

  再對 `mediaAssets`、`digests`、`hubAlerts`、`hubAuditLogs` 各執行一次，只要把 `--collection-group` 換掉。
- **為什麼**：讓 Firestore 自己刪除過期資料。下一步的每日清理排程也會刪，兩者並存沒問題，TTL 只是多一層保險。
- **怎麼確認**：Console → Firestore → TTL 看到這 5 個 collection group。
- **其他用途**：任何「保存 N 天後自動刪除」的資料，例如 session、log、暫存。

## 6. 建立 3 個 Cloud Scheduler 排程

- **做什麼**：把 `<SECRET>` 換成第 1 步的 `SCHEDULER_SECRET`。

  每 5 分鐘：定時規則、Instinct 收件匣逾時預警。

  ```bash
  gcloud scheduler jobs create http wippy-hub-tick --location=asia-east1 --schedule="*/5 * * * *" --uri="https://wippy-backend-ts2nxgrpfa-de.a.run.app/scheduler/hub-tick" --http-method=POST --headers="X-Scheduler-Secret=<SECRET>"
  ```

  每小時第 7 分：LINE 額度檢查與預警。

  ```bash
  gcloud scheduler jobs create http wippy-hub-quota --location=asia-east1 --schedule="7 * * * *" --uri="https://wippy-backend-ts2nxgrpfa-de.a.run.app/scheduler/hub-quota" --http-method=POST --headers="X-Scheduler-Secret=<SECRET>"
  ```

  每天 03:17（台北時間）：清除超過保存期限的資料。

  ```bash
  gcloud scheduler jobs create http wippy-hub-cleanup --location=asia-east1 --schedule="17 3 * * *" --time-zone="Asia/Taipei" --uri="https://wippy-backend-ts2nxgrpfa-de.a.run.app/scheduler/hub-cleanup" --http-method=POST --headers="X-Scheduler-Secret=<SECRET>"
  ```

  順便關掉上一個 PR 移除的舊排程（`/scheduler/notify`、`/scheduler/water-reset`、learning reconcile）。先列出所有排程：

  ```bash
  gcloud scheduler jobs list --location=asia-east1
  ```

  對每個舊排程執行：

  ```bash
  gcloud scheduler jobs pause <舊排程名稱> --location=asia-east1
  ```

- **為什麼**：「定時規則」「額度預警」「保存期限」都需要有人定時敲門，Cloud Run 不會自己醒來。
- **怎麼確認**：在 Console → Cloud Scheduler 對 `wippy-hub-quota` 按「立即執行」，結果是成功；Agent Hub 總覽會出現本月額度。
- **其他用途**：任何定時任務（日報、對帳、清理），在 serverless 環境都用「排程器打 HTTP」的模式。

## 7. LINE Developers Console 設定

- **做什麼**：在 Messaging API channel：
  - Webhook settings → 開啟 **Use webhook** 和 **Webhook redelivery**。
  - 「Allow bot to join group chats」設為允許。
  - （選填）把 bot 的 user ID 設成 Cloud Run 環境變數 `LINE_BOT_USER_ID`，作為「@機器人」偵測的備援。
- **為什麼**：
  - WiPPY 寫入失敗時會回 500。開啟重送後 LINE 會再送一次，WiPPY 依事件 ID 去重，不會重複處理。
  - bot 必須在群組裡才收得到訊息。
- **怎麼確認**：Webhook 頁面按「Verify」成功。
- **其他用途**：接任何 webhook 時都應該做到「失敗回錯誤碼讓對方重送，自己用事件 ID 去重」，這樣才不會掉資料。

## 8. 在 WiPPY 設定預警群組與開放群組

- **做什麼**：
  1. 在 LINE 建一個只有你和 WiPPY bot 的群組，例如「WiPPY 預警」。
  2. Agent Hub → 設定 → 預警群組，選這個群組，按「儲存設定」。
  3. Agent Hub → 群組開放，打開要給 Agent 讀的群組。
- **為什麼**：
  - 發到群組時按人數扣額度，只有你一人的群組每則預警只扣 1 則。
  - 只有開放的群組才會被保存、交給 Agent，也才能被 Agent 發訊息。
- **怎麼確認**：
  - 在 Cloud Scheduler 手動執行 `wippy-hub-quota`。額度超過門檻時，預警群組會收到訊息；沒超過就不會。
  - 開放的群組有新訊息時，Agent Hub 總覽不會出錯。
- **其他用途**：先預設關閉、再逐一開啟（opt-in），是處理個資與第三方 AI 的基本做法。

## 9. 接上 Grok Bot

1. **在 WiPPY 建立 Agent**：
   - 操作：Agent Hub → Agent → 類型選「Grok Bot」→ 填名稱、勾選允許的群組 → 先不用填 Webhook → 按「建立 Agent」。
   - 黃色框會顯示 **API Key** 和 **MCP 網址**，只顯示一次，請立刻存好。
2. **在 Grok Bot 建立 Routine**：
   - 觸發方式選 **Webhook**，複製它顯示的「POST to」網址和 key。
   - Routine 指令貼上第 11 節的「Grok Routine 指令範本」。
3. **把 Routine 填回 WiPPY**：
   - 在 WiPPY 的 Agent 清單找到這個 Agent，填入「Routine 網址（名稱）」和「Routine Key（名稱，留空表示不變）」，按「儲存設定」。
   - 按「測試 Webhook」，應該顯示「Webhook 測試成功」。
4. **讓 Grok Bot 能呼叫 WiPPY**：在 Grok Bot 對話中說：
   > 請幫我加入一個遠端 MCP server，網址是 `<MCP 網址>`，header 是 `Authorization: Bearer <API Key>`。

   它應該能列出 `list_groups`、`send_message` 等工具。
5. **為什麼**：
   - WiPPY 用 Routine webhook 主動通知 Grok。
   - Grok 用 MCP 回頭查資料、要求 WiPPY 執行動作。
   - API Key 只存 hash，外洩時可以按「重新產生 API Key」讓舊的立刻失效。
6. **怎麼確認**：叫 Grok Bot「用 list_groups 看看有哪些群組」，它應該列出你開放並允許的群組。

## 10. 接上 Instinct

1. **在 WiPPY 建立帳號**：
   - 操作：Agent Hub → Agent → 類型選「Instinct」→ 填名稱、登入 Email（可以用你另外的信箱，只是帳號名稱）、允許的群組、逾時預警時數 → 按「建立 Agent」。
   - 黃色框會顯示 **Email 和密碼**，只顯示一次。
2. **交給 Instinct**：把登入網址 `https://wippy-mvp.web.app/login`、Email、密碼，以及第 11 節的「Instinct 指令範本」傳給 Instinct。
3. **為什麼**：
   - Instinct 沒有可以讓 WiPPY 主動呼叫的 API，所以改成讓它定時登入「工作台」。
   - 這個帳號只能進工作台和紀錄，看不到你的後台設定。
4. **怎麼確認**：
   - 用無痕視窗以那組帳密登入，畫面上方應該只有「工作台」「紀錄」「登出」。
   - 密碼外洩時，按「重設密碼」或「停用」即可。

## 11. 指令範本

**Grok Routine 指令範本**：

```text
你會收到 WiPPY 傳來的 JSON。
- 如果 kind 是 "wippy.test"：這是連線測試，什麼都不用做。
- 如果 kind 是 "wippy.dispatch"：
  1. 讀 rule.instruction（擁有者的指令）、digest（重點整理，可能是 null）、messages（群組訊息）。
  2. 依指令判斷要做什麼。需要動作時，使用已加入的 WiPPY MCP 工具：
     send_message、send_alert、send_link、send_image、send_video、send_audio、record、schedule_message。
     每個動作都要給新的 idempotencyKey，建議用「jobId-序號」，例如 "<jobId>-1"。
  3. 網頁、圖片、影片由你自己做好，提供 https、不需要登入就能打開的網址。
     WiPPY 只會驗證後發送，不會修改；被退回時，依回傳的 code 和 detail 修正，再用新的 idempotencyKey 重送。
  4. 注意額度：quota.agentDailyRemaining 是今天還能發幾次；發到群組會按人數扣 LINE 額度。
  5. 最後一定要呼叫 complete_dispatch，帶 jobId 和一句話的 summary。
```

**Instinct 指令範本**：

```text
請每 2 小時登入一次 https://wippy-mvp.web.app/login（Email：<email>，密碼：<password>）。
1. 打開「工作台」，依序點開「收件匣（待處理）」的每個項目。
2. 讀「擁有者的指令」「重點整理」和訊息，判斷要做什麼。
3. 需要時在「執行動作」選擇動作、群組並填寫內容，按「送出動作」：
   發訊息、發預警、發連結卡片、發圖片/影片/語音、存紀錄、排程訊息。
   網頁或媒體請先自己做好，貼上 https、不需要登入就能打開的網址。
   如果結果顯示被退回，請依原因修正後再送一次。
4. 處理完一個項目，在「完成備註」寫一句話，按「標記完成」。
```

## 12. 建立規則並做一次完整驗收

- **做什麼**：
  1. Agent Hub → 規則，建一條測試規則：關鍵字「測試WiPPY」，交給 Grok Bot，套用一個開放的群組。
  2. 在那個群組傳「測試WiPPY 請回覆收到」。
- **怎麼確認**：
  - 「執行紀錄 → 派送」出現一筆，狀態 `sent`。Grok 處理完後狀態會變成 `completed`。
  - Grok 回覆的訊息出現在群組裡；「執行紀錄 → 動作」和「稽核」都看得到這次動作。
  - 換成交給 Instinct 再測一次：收件匣會出現項目，Instinct 處理後狀態變成 done。
- **為什麼**：每一段（收訊 → 規則 → 派送 → Agent → 執行 → 稽核）都實際跑過一次，之後出問題才知道要看哪裡。

---

## 疑難排解

| 現象 | 先看哪裡 |
|---|---|
| Hub 頁面顯示「requires an index」 | Firestore 索引還在建置，等幾分鐘 |
| 媒體一直失敗 | 第 2 步的 bucket 權限，以及 `HUB_MEDIA_BUCKET` 環境變數 |
| 派送失敗、HTTP 401 | Grok Routine 的 key 填錯，在 Agent 頁重新填入後按「測試 Webhook」 |
| 「HUB_ENCRYPTION_KEY is not configured」 | 第 1 步的 GitHub Secret 沒設，或設了之後還沒重新部署 |
| 動作被擋 `line_quota_reserve` | 本月 LINE 額度只剩保留量；升級方案或等下個月 |
| 動作被擋 `agent_daily_limit` | 調高該 Agent 的「每日發送上限」 |
| 預警沒收到 | 「設定 → 預警群組」是否已選，bot 是否還在那個群組 |
