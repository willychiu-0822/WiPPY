# WiPPY 本機端到端 UAT 計畫

本次目標：在沒有真實金鑰的環境，讓產品負責人用瀏覽器完成現有活動管理旅程。所有案例均使用系統 Chrome，在桌面 1280×800、手機 390×844 各跑一次；通過只代表本機 emulator/mock 範圍可供試用，不代表真實 LINE 或雲端部署已驗收。

## 實際需求與範圍

- R1：Email 註冊、登入、登出、登入保護（`LoginPage`、Firebase Auth）。
- R2：活動建立、列表、詳細頁、目標群組修改與資料保存（activities API）。目前 UI 沒有活動刪除、重新命名或活動日期編輯，不捏造這些功能。
- R3：知識條目新增、修改、刪除；AI 一般對話、知識萃取、推播排程（真實 Harness pipeline）。
- R4：排程編輯、刪除、審核、要求修改暫停、重新核准、排程發送與活動記錄。
- R5：群組近期訊息、單群回覆、多群廣播與個別微調、全域發送記錄、失敗回饋。
- R6：現有 LIFF provider、entry parser、share helper 的 mock 驗證。main 路由目前沒有 LIFF 業務頁；`/uat/liff` 是限本機開啟的驗證頁，不宣稱有正式 LIFF 活動入口。
- R7：錯誤復原、必填防呆、行動版可操作、使用者資料隔離。

## 環境

### 啟動與試用

1. 已有 backend/frontend 依賴；根目錄 `npm ci` 安裝 Firebase CLI。需 Node 22+、Java 21+，`JAVA_HOME` 可指向本機 JRE；本次在忽略追蹤的 `.uat-tools/` 安裝 JRE（無需管理員）。不下載 Playwright 瀏覽器。
2. 根目錄 `npm run uat:start`。程式只啟動 localhost：4121 前端、4122 後端、4123 Auth emulator、4124 Firestore emulator、4125 emulator hub、4126 logging、4127 Firestore websocket。emulator UI 關閉。
3. 瀏覽器開 `http://127.0.0.1:4121`，免費註冊任意測試 Email 與自選測試密碼。每個 emulator 使用者自動配置兩個 mock LINE 群組與一則近期訊息。不得使用真實密碼或個資。
4. 新增活動，選擇群組，輸入一般問題、含「萃取知識」的敘述，或「幫我規劃三則活動前的暖場推播訊息」。mock LLM 回傳固定可辨識的本機內容，仍經過實際 parser、validator、Firestore persistence。
5. 發送時間可改為過去時間，再核准企畫；本機 scheduler 每秒檢查，LINE mock 接收後寫入真實 sendLogs。內容含 `[模擬失敗]` 可測 LINE/LLM 失敗。沒有真的 LINE 收件人。
6. Ctrl+C 關閉整個本機 stack；Playwright 自動啟停自己啟動的 stack。資料預設只在 emulator 記憶體，重啟清空。
7. `npm run test:e2e` 跑所有案例。可用 `npm --prefix frontend run test:e2e -- --grep UAT-xx` 聚焦；結果會明確記錄該次只跑部分案例，不把未跑項目算通過。

### 缺少的正式環境設定（僅名稱，不含值）

| 名稱 | 缺少的影響／本機替代 |
| --- | --- |
| `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_PROJECT_ID` | 無法連真實 Firestore/Admin/Auth；本機 demo project + Auth/Firestore emulator，保留正式安全規則與 token 驗證 |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | 無法初始化真實 Firebase web app；本機啟動器提供公開的 demo 設定 |
| `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, `LINE_OFFICIAL_ACCOUNT_ID` | 無法呼叫真實 LINE、接收簽章 webhook 或加入真實群組；本機只替換 getLineClient，群組資料為 emulator fixture，webhook 未經真實 LINE 驗證 |
| `VITE_LIFF_ID`, `LIFF_CHANNEL_ID`, `LIFF_ID` | 無法驗證真實 LINE 登入、ID token、群組 context、分享或關閉 WebView；使用 `VITE_LIFF_DEV` 與既有 @line/liff-mock；目前沒有使用 liffAuthMiddleware 的業務路由 |
| `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` | 無法使用 OpenAI 相容等外部 LLM；僅在 e2e backend 入口替換 provider，使用固定 mock |
| `GEMINI_API_KEY` | Gemini provider 不可用；同上 |
| `GCP_PROJECT_ID`, `GCP_LOCATION` | Vertex AI 不可用；同上 |
| `CLOUD_TASKS_QUEUE_NAME`, `CLOUD_TASKS_LOCATION`, `CLOUD_TASKS_SERVICE_URL`, `INTERNAL_HARNESS_SECRET` | 無法驗證 Cloud Tasks 非同步流程；本次使用現有同步 Harness 路徑 |

啟動器強制使用空的 dotenv 設定檔（`DOTENV_CONFIG_PATH`），不繼承外部 provider 設定。報告只接受每個案例在 desktop/mobile 各恰一次通過，重複桌面執行不能代替手機；新執行開始立即撤回舊 ready 狀態。

本機設定名稱：`VITE_API_BASE_URL`（同源 Vite proxy）、`VITE_FIREBASE_AUTH_EMULATOR_URL`、`VITE_FIRESTORE_EMULATOR_HOST`、`VITE_FIRESTORE_EMULATOR_PORT`、`FIREBASE_AUTH_EMULATOR_HOST`、`FIRESTORE_EMULATOR_HOST`、`PORT`、`VITE_LIFF_DEV`、`VITE_UAT_MODE`。`LIFF_DEV_BYPASS_USER` 是既有開發選項，本次不繞過 Firebase Auth。本機入口拒絕非 demo project 與非 loopback emulator，避免誤接真實資料。沒有將任何真實 secret 寫入檔案。

### 明確排除與後續驗收

真實 Google OAuth、LINE Developers Console 設定、LINE API Status、Webhook 簽章／群組加入、LIFF scopes 與手機 LINE WebView、真實 LLM 品質、Cloud Tasks、正式 indexes 效能、HTTPS 部署均未完成。本次不部署、不建 tunnel、不推送 Git。這些不算本機案例被阻擋，但正式上線前需另行驗收。

## 案例

UAT-21 只透過 loopback Firestore emulator 的管理 REST API 準備／還原該帳號的空群組 fixture；產品 API 與畫面沒有攔截或假造回覆。

UAT-14 以本機 LINE mock 暫停外部發送，先觀察真實 Firestore transaction 的 processingAt、驗證改群組被拒絕，再由同帳號的測試控制端點明確釋放發送並驗證只有一筆紀錄。控制端點只存在於 `e2e/backend.cjs`，沿用既有 `/api` 本機代理、驗證 token 與群組 owner；不進入正式 app。30 秒釋放上限用於失敗清理；Playwright timeout、0 retry 與原有驗收斷言不變。

共同前置：本機 stack 運行、使用全新 emulator 測試帳號；非登入案例先經 UI 註冊。每案例證據為 `docs/uat/evidence/<執行批次>/<desktop|mobile>/UAT-xx.png`，API 驗證只補充 UI 操作，不攔截或偽造產品 API 回覆。

| 編號 | 前置 | 步驟 | 預期結果／驗收標準 | 對應需求 |
| --- | --- | --- | --- | --- |
| UAT-01 | 未登入 | 開活動深連結；Email 註冊；重新整理；登出；錯誤密碼再正確登入 | 未登入跳登入頁；註冊成功；重新整理保持登入；錯誤清楚且可重試；登出後不能讀活動 | R1,R7 |
| UAT-02 | 已登入 | 活動列表新增；空白名稱；選群組建立；加選第二群、取消第一群；重新整理及返回列表 | 空白不能建立；名稱、目標群組正確保存；列表能重新開啟同一活動 | R2,R7 |
| UAT-03 | 新活動 | 知識庫新增背景；修改標題內容；重新整理；刪除 | 必填有防呆；所有變更持久保存；刪除後不再顯示 | R3 |
| UAT-04 | 新活動，有目標群組 | Agent 一般對話；請萃取知識；切知識庫；重新整理；要求三則排程 | 有可讀回覆；知識條目與三則訊息經真實 pipeline 寫入；排程均待審核、群組正確 | R3,R4 |
| UAT-05 | AI 已產生三則 | 修改第一則內容時間；刪除第二則；核准；要求修改；編輯；重新核准；重新整理 | 保存內容與數量；核准後編輯鎖定；要求修改後待發訊息暫停；重新核准恢復 | R4 |
| UAT-06 | 新活動與 AI 排程 | 把一則時間改為過去；未核准先 tick；核准；tick；看活動記錄及全域記錄；再 tick | 未核准不發；核准後只發到選定群組；sendLogs 為成功；再次 tick 不重複 | R4,R5 |
| UAT-07 | 兩個 mock 群組 | 開群組；讀近期訊息；手動回覆；全域記錄 | 能讀到近期訊息；回覆成功；記錄有正確內容、手動來源 | R5 |
| UAT-08 | 兩個 mock 群組 | 廣播選兩群；輸入內容；預覽；個別微調；確認送出；查看記錄 | 未選群不能進行；預覽能微調；各群成功；兩則內容各自保存且來源廣播 | R5 |
| UAT-09 | 新活動與 mock 群組 | LINE 回覆含失敗標記；移除標記重試；Agent 含失敗標記；重試正常問題 | 顯示可讀錯誤且保留輸入；重試成功；失敗 LINE 記錄可查；無未處理例外 | R3,R5,R7 |
| UAT-10 | 不需 Firebase 登入 | 開 `/uat/liff`；依序 default、no_group、share_unavailable；嘗試分享；帶 liff.state 參數 | 顯示 mock profile/context；無群組有提示；分享不可用有錯誤；entry parser 取到巢狀活動參數；無真實 LINE 呼叫 | R6 |
| UAT-11 | 兩個不同測試帳號 | A 建活動；B 直接開 A 活動；讀 A 群組與廣播請求；用 Firebase SDK 偽造 owner 與核准訊息；未登入 API 呼叫 | B 不得讀取／修改／發送 A 資料；API 404/401，Firestore 寫入 permission-denied；畫面可返回列表；不產生越權 sendLogs | R1,R7 |
| UAT-12 | 新活動 | 探索式：清空排程內容、時間填無效值；嘗試核准無群組／無訊息活動；手機操作分頁；編輯既有關鍵字訊息 | 防呆阻止無效儲存與無法發送的核准；顯示可修正提示；頁面不水平溢出、主要操作可見，keyword 編輯相容 | R4,R7 |
| UAT-13 | 新活動、已有 AI 對話 | 探索式：切換知識庫再返回 Agent；重新整理；接著問問題 | 前後對話保留，重新整理可接續，不重複回覆 | R3,R7 |
| UAT-14 | 已產生並核准排程 | 探索式：更換目標群組；看排程；重新核准與重整；延遲發送中嘗試改收件人 | 所有待發訊息同步新群組；更換收件人必須暫停並重審；不會發給已移除群組；發送中拒絕更改並回復勾選 | R2,R4,R7 |
| UAT-15 | 已產生排程 | 探索式：貼入一小時後 UTC 時間並核准、tick；改成過去時間、重新核准；同時四次 tick | UTC 未到期不發送；同時觸發僅送一次且只有一筆成功紀錄 | R4,R7 |
| UAT-16 | 已有知識條目 | 探索式：編輯時清空標題、內容；直接 API 送空白／無效型別；再填合法內容保存並重整 | UI 禁止空白儲存；API 回 400、不改動原資料；合法編輯持久保存 | R3,R7 |
| UAT-17 | 已登入活動頁 | Chrome 切換離線後新增、編輯、刪除知識；每次恢復連線重試；離線開活動與全域發送紀錄再恢復重試 | 每次失敗顯示可讀錯誤、保留輸入與已存資料；重試成功且不重複；記錄載入失敗不得誤顯示空清單；無未處理例外 | R3,R5,R7 |
| UAT-18 | 全新測試帳號 | 在活動名稱、Agent、群組回覆輸入中文；模擬輸入法選字 Enter；再按一般 Enter | 選字 Enter 不建立活動、不清空輸入、不送訊息或產生 sendLogs；一般 Enter 仍正常送出且僅一次 | R2,R3,R5,R7 |

| UAT-19 | 新活動且 AI 已產生排程 | 用日期時間選擇器設定未來時間（含秒）；儲存、重整再開編輯；清空時間嘗試儲存 | 手機可選日期時間、不必輸入 ISO；裝置時區清楚；實際保存時間正確且重整保留秒；空值被阻止且原資料不變；進階含時區輸入仍相容 UAT-12/15 | R4,R7 |
| UAT-20 | 新活動、尚無訊息 | 看初始畫面；點唯一「請 AI 規劃第一份推播」；檢視產生訊息與核准按鈕 | 未產生企畫前不顯示核准；下一步清楚；AI 產生三則待審訊息後才顯示核准；全程不發送 | R2,R3,R4,R7 |
| UAT-21 | 全新帳號；只移除該帳號 emulator 群組 fixture | 看 LINE 空狀態；由新增活動表單及活動詳細頁前往設定；離線重新載入；恢復網路、還原 fixture 再重試；回活動選群組 | 邀請官方帳號、群組傳訊與重新載入步驟可讀；無群組不能廣播；不宣稱有不存在的同步功能；載入錯誤可重試且錯誤會清除；還原群組可選取保存 | R2,R5,R7 |
| UAT-22 | 全新帳號、已有第一個活動；Chrome 真實 offline/online | 斷線開啟活動；恢復網路重試；斷線進活動列表；恢復重試；斷線建立活動再重試；另開不存在的活動 | 連線失敗不冒充資料不存在或空列表；可讀提示與唯一重試主操作，與返回連結間隔至少 8px；建立失敗保留名稱／群組，重試只建立一次並清除錯誤；真正不存在另有說明 | R1,R2,R7 |
| UAT-23 | 已由 AI 建立三則待審訊息；Chrome 真實 offline/online | 斷線刪除第一則；恢復網路後再刪；斷線編輯另一則內容與時間，恢復後原地儲存 | 刪除失敗可讀且保留三則；沒有 pageerror；重試只刪指定訊息；儲存失敗保留草稿／時間並能重試，重整後保存；請求處理中禁重複刪除 | R3,R4,R7 |
| UAT-24 | 新帳號；僅以真實 Firebase SDK disableNetwork 暫停 Firestore，Auth emulator 保持在線 | 註冊、等待帳號資料失敗；看錯誤與唯一重試；enableNetwork 恢復後重試；確認資料保存、重整並建立活動 | 不停在處理中，不拋未處理例外；中文提示與重試；資料完成前不進主畫面，成功後錯誤清除且 users 文件存在；登入狀態與第一個活動可接續 | R1,R2,R7 |

## 執行與修復方式

採原地執行（使用者指定目前目錄），保留已有分支與依賴，不切換、不 fetch。依序：本機 stack 與案例 → 跑出失敗 → 找根因 → 每項修復獨立 commit（含 UAT 編號）→ 完整雙 viewport 重跑 → 以新手方式探索補案例。`UAT-RESULTS.md` 逐批記錄時間、結果、原因與證據；`UAT-STATUS.json` 只在完整當次全通過且沒有阻擋時標為可試用。證據包含 UI 截圖；輔助 API 斷言檢查真實 emulator 中的結果。
