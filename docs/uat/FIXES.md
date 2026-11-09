# 本輪提交狀態（2026-11-10）

已在目前目錄的 `.uat-tools/uat-commits.git` 建立依 UAT 編號拆分的本機提交，沒有遠端設定或 push。原 `.git` 仍為唯讀，所以原分支 refs/index 尚未套用，原工作區的預設 `git status` 仍有差異。完整提交清單、可搬移 bundle 與最終測試以 [UAT-RESULTS.md](UAT-RESULTS.md) 為準。

以下為之前輪次的歷史修復與唯讀 Git 阻擋紀錄。

# UAT 修復與本機提交紀錄

本機提交受環境阻擋：2026-11-09 執行 `git add ... && git commit ...`，Git 回覆 `Unable to create .../.git/index.lock: Read-only file system`。目前 `.git` 是唯讀掛載；沒有 push、修改 remote 或修改其他 checkout。下列是分開提交的修復單位與建議訊息，尚未實際 commit。程式、測試、證據均留在本工作目錄。

| 修復單位／建議 commit 訊息 | 根因與修復 | 驗證 |
| --- | --- | --- |
| `test(UAT-01): add local emulator stack and browser acceptance journeys` | 補本機 CLI/JRE 支援、demo emulators、隔離 LINE/LLM 邊界、雙 viewport、每批證據與報告；沿用原有 Playwright 依賴；API 單元測試伺服器限制 4129 | 24 次完整 E2E 通過；停止後重新啟動成功 |
| `fix(UAT-02): reflect target group selection while saving` | 原受控勾選須等 API 完成才更新，操作檢查讀到舊狀態；改為立即更新，失敗回復原活動 | 原桌面／手機重現；複測均通過 |
| `fix(UAT-09): show LINE send errors and preserve retry input` | 單群回覆與廣播流程缺 catch，失敗變未處理例外；顯示可讀提示、保留輸入、允許重試 | 雙 viewport LINE 失敗→重試與 AI 失敗→重試通過 |
| `fix(UAT-10): initialize mock LINE login and expose local LIFF checks` | provider 只提供假 profile，mock SDK 仍未登入，分享報需登入；mock init 後只在 `$mock` 存在時登入；新增限本機檢查頁與測試 | 三 preset 與巢狀 liff.state 雙 viewport 通過；前端新增 3 個單元測試 |
| `fix(UAT-11): authorize every broadcast group before side effects` | 廣播 preview/multi 沒驗證群組 owner；先驗證全部群組、拒絕越權，並擋空白或過長內容 | 原 200 越權重現；修後 404、無越權 sendLogs，雙 viewport 通過 |
| `fix(UAT-12): reject empty plans and invalid manual schedules` | 空群組／空企畫可核准、編輯內容時間未驗證；UI 與 API 擋無效資料，核准前驗證待發訊息 | 雙 viewport 通過；後端 185、前端 80 單元測試通過 |

完整結果與時間以 [UAT-RESULTS.md](UAT-RESULTS.md) 的批次紀錄為準。原始 12 案首輪為 14 pass / 10 fail，修復後完整重跑為 24 pass / 0 fail。後續探索案例及修復接續記於此檔。

## 探索與審查後補強

- `fix(UAT-13): restore persisted Agent conversation on revisit`：分頁卸載會重置本機 state；改讀取受 rules 保護的既有 agentSession，保留使用者可讀回覆（LLM context 仍保留原始內容），不覆蓋正在進行的對話。原兩 viewport 失敗→修後通過。
- `fix(UAT-14): retarget pending sends atomically and require reapproval`：活動群組改動原本只更新 activity；同步待發訊息並暫停重審。審查再補 processingAt 競態測試，改用 Firestore transaction，訊息發送中拒絕更改並回復勾選。
- `fix(UAT-15): compare schedule instants and claim sends transactionally`：原 ISO 字串排序使 Z 與 +08:00 比較錯誤；改比較 Date.parse 的實際時間。原去重只是 update，改 transaction 重新確認活動與訊息狀態後取得處理權，LINE 呼叫在 transaction 外，並檢查群組 owner。測試 UTC 未到期不送與同時四 tick 只送一次。
- `fix(UAT-11): prevent client ownership and schedule forgery`：唯讀審查找出既有 Firestore rules 可直接改 activity owner 並偽造核准訊息。UI 寫入均透過 API，故 activities 與其子集合改 backend-only 寫入；新增使用真實 Firebase SDK 的越權寫入測試（非字串規則模擬）。
- `fix(UAT-12): preserve keyword message editing compatibility`：審查發現新增時間防呆誤擋既有 keyword 訊息，改依 triggerType 驗證與顯示欄位。關鍵字編輯回歸單元測試先失敗後修復。
- `test(UAT-01): isolate dotenv and require exact viewport coverage`：啟動器指定空 env 檔，防止 dotenv 重新載入外部設定；報告要求每個案例 × desktop/mobile 各恰一筆，啟動新執行立即撤回舊 ready 狀態；五個工具回歸測試含重複 desktop 不得充當 mobile。

審查由一個唯讀 reviewer 執行；全部開發、瀏覽器操作與測試仍由 session C 執行。沒有修改第三方服務或發出任何訊息。以上修復仍受唯讀 `.git` 阻擋，尚未建立 commit。

## 第 2 輪（2026-11-10）

接續上一輪；原 15 案完整重跑 30/30 通過後，再補新手錯誤復原與中文輸入探索。本人開發與驗證，未另派代理。

| 建議 commit 訊息 | 根因與修復 | 先失敗後通過的驗證 |
| --- | --- | --- |
| `fix(UAT-16): reject empty knowledge edits and preserve valid content` | 知識新增有必填判斷、編輯卻沒有，API update 亦未驗證；編輯表單禁止空白儲存，後端對空白與非字串回 400，保留既有資料 | UI 與 API 回歸先失敗；修後雙 viewport 2/2，後端新增 4 項驗證測試通過 |
| `fix(UAT-17): preserve knowledge edits and recover history after network failures` | 知識新增／修改只有 finally、刪除無 catch，離線造成未處理例外；活動記錄未 catch、全域記錄把失敗當空清單。補可讀錯誤、保留輸入、刪除中禁重複、記錄重試按鈕 | 新增 3 項知識失敗單元測試先失敗，修後通過；E2E 接著重現記錄缺錯誤提示；全域記錄另有先失敗的單元測試。最終雙 viewport 真實 Chrome offline→online 重試 2/2 |
| `fix(UAT-18): prevent IME confirmation from submitting activities and messages` | 活動名稱、Agent、群組回覆把輸入法選字 Enter 當提交；加入 isComposing 與 229 判斷，保留一般 Enter | 兩個 viewport 均重現選字 Enter 提前建立活動；修後三個輸入位置均不提前提交，一般 Enter 各僅送一次，2/2 通過 |

三項各自執行本機 `git add ... && git commit -m '<UAT 編號訊息>'`，均在 add 階段被 `.git/index.lock: Read-only file system` 阻擋，未建立任何 commit。沒有 push、改 remote、部署或 tunnel，沒有嘗試繞過唯讀掛載。

回歸：backend 189、frontend 86、report tools 5 通過；兩端 build、frontend lint 通過。完整 E2E 結果以 UAT-RESULTS.md 最新批次為準。IME 為 Chrome 事件驗證，尚未使用實體手機輸入法。
