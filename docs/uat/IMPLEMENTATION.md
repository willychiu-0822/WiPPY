本檔包含歷史進度；最新交付狀態與 Git 限制以 [UAT-RESULTS.md](UAT-RESULTS.md) 為準。

## 第 7 輪：2026-11-10 執行計畫

由 session C 本人接續既有提交與驗收計畫。以 `0924283` 為增量 bundle 的前置版本；原 `.git` 唯讀，沿用 `.uat-tools/uat-commits.git`，不重建工作區、不修改原 refs。

- [x] 重跑原 24 個旅程前，檢查 status、diff、提交祖先與埠號；重跑 backend/frontend 單元、build、lint、報告工具。
- [x] `frontend/eslint.config.js` 排除 Playwright 產生／刪除的暫存產物，修正並行 lint 的 ENOENT；產品原始碼與 E2E 原始碼仍完整 lint。
- [x] UAT-25：`ReviewBanner` 的待審／重新審核兩種狀態，沒有目標群組時停用核准並說明要先在上方選群組。單元與真實瀏覽器先失敗；API 仍須回 400、不發送；選群後可核准與保存。
- [x] UAT-26：`AgentChatPanel` 的 fetch 斷線錯誤改用中文與 alert，保留輸入；單元及雙 viewport 先失敗；恢復連線後原文只送出一次、清除錯誤，重整後對話保留。
- [x] 本 checkout 缺少 `deployment/local/e2e.cjs`：補上相同路徑的本機測試入口，直接使用現有 Playwright 設定與全部 UAT 斷言，不能用替代斷言省略案例。不讀取其他部署目錄；原部署腳本未提供，這是新增的本機入口。
- [x] UAT-27：手機截圖發現舊版淺色全域字體使表單輸入幾乎不可見。雙 viewport 量測 1.10:1 先失敗，修正共用字色後六個欄位的 4.5:1 對比門檻均通過；不加重複的 CSS 單元測試。
- [x] 完整 27 旅程 × 2 viewport、所有單元及 build/lint；重新跑手機探索與核對截圖。每個修復獨立 commit；更新結果／狀態／提交清單，驗證增量 bundle 與交付庫乾淨，關閉自啟動服務。

設計沿用現有按鈕 disabled、錯誤 role=alert、保留輸入後重試的模式；不新增產品流程或外部依賴。重點複查空群組與群組更換、離線資料不遺失、審核前不發送、錯誤清除、桌面／手機各自完整覆蓋。

# 本機 UAT 執行計畫與進度

**Goal:** 現有 WiPPY 使用者旅程可用瀏覽器端到端試用。
**Architecture:** 真實 Auth/Firestore emulator + 原有 Express/Harness；e2e 入口替換 LINE/LLM provider；Vite 同源代理；Playwright 管理本機 stack 與證據。
**Tech Stack:** Node、Java 21、Firebase CLI、React/Vite、Playwright/system Chrome。
**Spec:** [UAT-PLAN.md](UAT-PLAN.md)。使用者已指定由 session C 全部開發與驗證，直接原地執行，不再要求設計核准、不另建 worktree。

## 全域限制

只在目前專案工作、只本機 commit，不 push、不修改 remote、不雲端部署、不 tunnel。伺服器埠只用 4121–4129；測試自動關閉自啟動伺服器。所有正式 env 只記名稱。

## Review focus

跨帳號讀寫／廣播；空白與無效時間；無目標群組／空企畫核准；外部 provider 失敗後重試；手機窄螢幕及重整持久保存。

## 任務

- [x] Task 1：`e2e/local-stack.mjs`、`e2e/backend.cjs`、`firebase.uat.json` 啟停 demo emulators 與 mock provider；`frontend/playwright.config.ts` 與 root/frontend scripts。驗收：全新帳號經真實 Auth token 呼叫 Express；僅 loopback demo Firestore；測試關閉所有子程序。
- [x] Task 2：`frontend/e2e/uat.spec.ts`、`e2e/report.mjs` 建立 12 案雙 viewport 測試與每批截圖/報告/狀態。先跑出真實失敗，精確定位根因後逐個修復；提交另列 Task 5。
- [x] Task 3：`frontend/src/uat/LiffCheck.tsx` 與限開發路由提供現有 LIFF 共用工具檢查。驗收：三 preset + liff.state，明確註明 mock。
- [x] Task 4：全部雙 viewport 重跑與新手探索補測，執行 frontend/backend unit/build/lint；自查差異與程序清理。
- [ ] Task 5：各修復分別建立含 UAT 編號的本機 commit。受 `.git` 唯讀掛載阻擋，未完成；提交單位與嘗試結果見 FIXES.md。

## 執行紀錄

- 2026-11-09：初始 HEAD 3135a4f，分支 codex/uat；無既有 UAT。保留 frontend 已安裝 Playwright 的 package 變更。Java/CLI 缺少，在 repo ignored `.uat-tools` 補齊。現有正式 LIFF 業務頁不存在，只驗證共用工具，不新增活動業務功能。

- 原 12 案 24 次 E2E 全通過後，手機 Chrome 新手探索發現對話遺失、收件群組未同步、UTC 時間提前發送。新增 UAT-13～15 並先全部重現失敗；修復對話還原、群組更換需重審、時間以 instant 比較與 transaction 去重，正在跑完整 30 次回歸。
- Git 提交遭唯讀 `.git/index.lock` 阻擋，詳 FIXES.md；不變更掛載、不建立另一個 repo、不接觸其他 checkout。

- 唯讀 reviewer 提出 6 項具體問題，均已處理：dotenv 重新讀 env、viewport 假完整、舊 ready 未清除、keyword 編輯回歸、發送中更換群組競態、Firestore 客戶端偽造 owner。UAT-11/14 新測試先失敗，修後重跑；UAT-12 新 keyword 單元測試先失敗再通過。群組保存期間審核按鈕暫停，避免核准讀到保存前的群組。

- 2026-11-09 23:57（台北）最終完整回歸：15 案 × 2 viewport = 30/30 pass；backend 185、frontend 81、report tools 5 全通過；兩端 build、frontend lint、git diff --check 通過。正式生產 build 不包含本機 LIFF 檢查 chunk。
- 首次執行既有 API 單元基準時沿用了 `listen(0)` 隨機埠；發現後已改為 4129，之後所有本機服務與測試伺服器均限制在 4121–4129。
- Finishing workflow：使用者已明確選擇只保留本機工作，不開 PR／不 push／不合併、不清除目前目錄。提交因唯讀 Git 未完成，所有差異留在原分支工作目錄。

## 第 2 輪：2026-11-10 新手錯誤復原

沿用既有 emulator、雙 viewport 與報告；本人執行，不另派代理。驗收依 R3/R5/R7，修復方式採既有表單必填防呆與 catch 提示，保留輸入後重試。

- [x] UAT-16：`frontend/e2e/uat.spec.ts` 先驗證知識編輯空白標題／內容不能儲存、API 拒絕無效 patch；再修改 `KnowledgeEditor.tsx` 與 `activityService.ts`，驗證原資料不被覆蓋、合法修改重整後保存。
- [x] UAT-17：以 Chrome 真實 offline 模擬（不攔截 API）重現知識新增／編輯／刪除失敗與活動記錄載入失敗；在 `KnowledgeEditor.tsx`、`ActivityDetailPage.tsx` 顯示錯誤、保留內容及允許恢復連線重試；不得產生 pageerror 或把載入失敗顯示成空記錄。全域記錄亦先用單元測試重現把失敗顯示成空清單，再同樣補 catch 與重試。
- [x] UAT-18：新手輸入中文時，選字 Enter 不得建立活動或發送 Agent／群組訊息；Chrome composition event 先重現提前建立，再於三個 handler 加 `isComposing`／229 判斷，普通 Enter 仍只送出一次。此為瀏覽器事件驗證，未做實機輸入法測試。
- [x] 新增案例先跑雙 viewport 失敗紀錄，再逐項修復與驗證、嘗試各自本機 commit（唯讀 Git 則記錄阻擋）。
- [x] 完整 E2E、兩端 unit/build、frontend lint、report tools；核對每案截圖與程序清理，更新結果、狀態、修復紀錄。

2026-11-10 00:10（台北）完整回歸 18 案 × 2 viewport = 36/36，36 張截圖逐一核對存在；backend 189、frontend 86、report tools 5 通過，兩端 build、frontend lint 與 diff --check 通過。00:11 再以全新手機帳號探索跨頁旅程：取消建立、第二群組與禁止事項知識、一般對話後按確認排程、修改第三則後重新核准與重整、取消廣播預覽，全部通過且無未處理例外或水平溢出。完整回歸後另重啟本機 stack 成功，探索後關閉全部自啟動服務。第 2 輪未另派代理；使用者已指定本人負責全部開發與驗證。修改保留目前分支；三項各自 commit 嘗試均受 Git 唯讀阻擋。

## 第 5 輪：2026-11-10

- 沿用 18 案，新增 UAT-19 日期時間選擇器、UAT-20 第一份企畫引導、UAT-21 LINE 空群組設定與離線重試，共 21 旅程 × 2 viewport。新增案例先重現 6/6 fail，修復後聚焦驗證含 UAT-12 共 8/8 pass。
- UAT-12 配合新手引導，改驗證空企畫不顯示核准操作，另以實際 API 明確驗證無群組／無訊息均回 400；原內容、時間與 keyword 回歸斷言全部保留。沒有增加重試或放寬 timeout。
- 原 `.git/index.lock` 仍無法建立；已通知 Product Builder。為使修復可攜，在原目錄已忽略的 `.uat-tools/uat-commits.git` 建立獨立本機提交與 bundle。原 `.git`、remote、分支 refs 均未變動，因此原預設 git status 乾淨這項驗收仍待 Product Builder 恢復寫入後匯入。
- 本輪未另派代理，未觸碰 PR42 子目錄、既有服務、部署或 tunnel。伺服器限 4121–4127，API 單元測試 4129。

## 第 6 輪：2026-11-10

接續既有 21 個旅程與已拆分的本機提交，不重建工作區。仍由 session C 本人完成開發與驗證。

- [x] 檢視原工作區 status/diff/log，確認 portable commit tree 與原有工作檔一致。原 `.git` 仍為唯讀掛載，`git add --dry-run .gitignore` 回覆 index.lock: Read-only file system；不變更掛載或 remote。
- [x] 完整重跑 backend unit/build、frontend lint/unit/build、報告工具；通過數分別 189、86、5。
- [x] 標準 `npm run test:e2e` 重跑既有 42 次桌面／手機案例，核對全部截圖與結果。
- [x] 完整綠燈後使用新手機帳號探索第一次活動與網路中斷操作；每個缺陷先補失敗案例，再作最小修復、雙 viewport 驗證並各自本機提交。
- [x] 完整重跑最終案例與受影響檢查；更新結果／狀態、提交清單與 bundle，核對交付樹無差異、無暫存／secret，關閉自啟動服務。

探索根因與修復規格：

- UAT-22：`ActivitiesPage` 把載入失敗保留為空陣列並顯示原始錯誤；`ActivityDetailPage` 在 catch 後仍以 null 判斷不存在。沿用發送紀錄頁的載入／錯誤／重試狀態，獨立保存 loadError；新增表單失敗保留既有 state、顯示中文提示並清除舊錯誤。API 真正的 404 仍顯示不存在／權限說明。驗收為手機與桌面完整離線→線上旅程，確認建立筆數與原活動未遺失。
- UAT-23：`MessagePlanTable` 刪除直接呼叫 async callback、沒有 catch；儲存則直接顯示瀏覽器 TypeError。沿用 `KnowledgeEditor` 的 deleting/catch/finally，請求中禁止重複刪除／編輯，網路錯誤用可讀中文、保留既有草稿與 API 驗證訊息。先加三個單元回歸與雙 viewport 端到端案例，驗收指定訊息才被刪除、原始時間／內容未被失敗操作覆蓋，重試後重整仍正確、無未處理例外。
- UAT-24：完整回歸追出 `AuthProvider` 在 profile 載入失敗後沒有 catch/finally，使用者停在處理中。以真實 Firebase SDK disableNetwork／enableNetwork 補首次登入復原案例，再加帳號失敗重試與舊請求不得恢復已登出使用者兩項單元回歸，先失敗後修復；以全域可讀錯誤畫面與唯一重試按鈕復原，profile 完成後才顯示主畫面。

原分支乾淨的驗收取決於原 `.git` 恢復可寫，目前不可宣稱完成。既有 `.uat-tools/uat-commits.git` 與 `.uat-tools/uat-delivery/` 僅作本機可搬移交付；原 refs/index 不變。

第 6 輪最終：2026-11-10 07:57，24 旅程 × 2 = 48/48 通過；backend 189、frontend 91、report tools 5，兩端 build、frontend lint 全通過。新帳號手機探索與重試主按鈕複查通過。全部工作檔封存至既有本機交付 Git／bundle，服務已關閉；原 `.git` 唯讀，原分支乾淨驗收仍未達成。完整提交清單見 UAT-RESULTS.md。


## 第 8 輪：2026-11-10 11:08 接續驗收

以既有 0924283 祖先之交付庫接續；原 .git 仍唯讀，保持原 index/refs 不變。本人執行與自查，不操作其他 session。

- [x] 全套單元、build、lint、報告工具與既有 54 次 E2E 重新通過。
- [x] 手機新帳號探索群組與廣播，保留實際錯誤截圖與觀察；未攔截 API。
- [ ] UAT-28：群組讀取失敗不得顯示空記錄；沿用群組列表的可讀錯誤與原地重試，分離讀取／發送失敗，保留回覆草稿。發送成功後讀取失敗須仍明確告知已送出，重載只讀記錄、不重送。
- [ ] UAT-29：廣播預覽／發送離線，以中文說明網路與內容保留；原地重試，分別檢查零發送及成功後每群僅一筆。
- [ ] UAT-30：沿用既有必填／5000 字 API 限制在微調頁及初始頁防呆，明確指出待修正的群組，修正後才可發送。
- [ ] 新增案例 RED→GREEN，各項修復分別提交；完整 30 旅程 × 雙 viewport、前端單元/lint/build、新手探索與截圖檢視；更新報告與增量 bundle，核對清理。

設計採既有 alert、停用按鈕與保留本地 state 模式；不加入背景自動重送，不改後端發送語意。驗收維持真實 emulator、系統 Chrome、0 retry 與原 timeout。原 .git 唯讀屬既有環境限制，無法宣稱預設 git status 乾淨。
