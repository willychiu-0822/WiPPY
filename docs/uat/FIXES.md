# 本輪提交狀態（2026-11-10）

第 6 輪新增 UAT-22/23/24，修復與驗證紀錄見文末；最新完整結果及原 Git 唯讀限制以 UAT-RESULTS.md 為準。

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

## 第 6 輪（2026-11-10）

本輪先完整重跑既有 21 旅程 × desktop/mobile，42/42 通過，再以全新手機帳號探索。原始觀察與截圖位於 [手機網路中斷探索](evidence/connectivity-2026-11-09T21-05-49-662Z/findings.json)。下列提交仍在本目錄既有的 ignored 本機 Git 交付庫；原 `.git` 為唯讀，原分支/index 不變。

| 本機提交 | 根因與修復 | 驗證 |
| --- | --- | --- |
| `93058f6` UAT-22 | 活動載入失敗與空資料共用畫面；詳細頁把 null 一律顯示不存在，列表顯示原始 TypeError。改為獨立載入錯誤與重試；新增活動失敗保留名稱與群組、重試清除舊錯誤；真正 404 保留權限／不存在說明 | 桌面／手機先失敗，修後均通過；檢查原活動保留、新活動只建立一次、404 文案與返回列表 |
| `95fd3b6` UAT-23 | 企畫刪除直接呼叫 async callback 而未處理 reject；編輯失敗直接顯示瀏覽器 TypeError。補 catch/finally、請求中禁止重複刪除／編輯，網路失敗中文提示並保留內容／時間 | 3 項單元回歸先失敗後通過；雙 viewport 離線刪除、編輯、恢復後重試與重整通過，訊息數與指定 ID 正確，無 pageerror |
| `2f5b2a4` UAT-01/11/14 | 固定測試埠上的短生命週期 HTTP server 避免共享全域 agent socket；跨帳號案例同步新的完整權限文案，保留全部 API 404／禁止寫入／禁止廣播斷言；LINE mock 改由明確的釋放控制取代 2.5 秒觀察窗 | backend 189 通過；UAT-09/11/14 共 6/6 通過；原 timeout、0 retry、所有發送中拒絕／復原／只發一次斷言保留 |

過程中保留一批 Auth emulator 啟動逾時、一批完整回歸 42/46（UAT-09 載入逾時、UAT-11 兩個 viewport 舊文案、UAT-14 觀察窗），以及本機控制端點初版未通過 Vite 代理造成的兩次失敗。控制端點改走既有 `/api` 代理後，聚焦 6/6 通過；以上批次均未刪除，最終完整結果見 UAT-RESULTS.md。沒有為通過而增加 timeout、retry 或移除斷言。

### UAT-22 最終畫面複查

手機截圖發現載入失敗畫面的「重試」與「返回活動列表」緊貼在一起。新增唯一重試及操作區間隔至少 8px 的實際位置斷言，雙 viewport 先失敗；改成獨立藍色主按鈕及分開的返回連結，UAT-22 雙 viewport 通過。獨立提交 `fd938af`。

### UAT-24 首次登入帳號資料失敗

完整回歸的 UAT-09 在註冊階段出現 Firestore offline 未處理例外與「處理中」停滯。追到 `AuthProvider` 的 async onAuthStateChanged callback 直接 await createUserDoc，沒有 catch/finally，載入失敗後 user/loading 不更新。新增 UAT-24：只用真實 Firebase SDK disableNetwork 停止 Firestore、Auth emulator 照常註冊，先於兩個 viewport 重現沒有錯誤提示與 pageerror，再修為明確錯誤畫面／唯一重試、資料建立完成才進入系統；enableNetwork 後驗證 users 文件、重整與第一個活動。

兩項單元回歸亦先失敗：錯誤保護／重試，以及較早的 profile 請求完成時不得還原已登出的使用者。修後 frontend 11 files / 91 tests、build、獨立 lint 通過，UAT-24 雙 viewport 2/2 通過。獨立提交 `f4657f0`。另一次 lint 與 Playwright 暫存清理同時執行出現 ENOENT，改於 Playwright 結束後單獨執行即通過，未更改 lint 規則。

手機最終視覺複查再補 UAT-22：原「重試」與「返回活動列表」是相鄰 inline 按鈕，讀成一串文字；補位置斷言先於雙 viewport 失敗，再改獨立藍色主按鈕與分開的返回連結。最終完整 48/48 通過，backend 189、frontend 91、報告工具 5 與兩端 build／frontend lint 通過。精確 commit 與證據見最新 UAT-RESULTS.md。
