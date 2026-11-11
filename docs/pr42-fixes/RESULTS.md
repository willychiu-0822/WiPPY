# PR42 Agent Hub 修復結果

時間：2026-11-10 00:54:31（Asia/Taipei，第 4 輪重驗）；基底：PR42 head `52edde3`。
工作目錄：`/workspace/codex-burn/uat-wippy/pr42-fix`。
遠端分支：[codex/wippy-pr42-fixes](https://github.com/willychiu-0822/WiPPY/tree/codex/wippy-pr42-fixes)。僅推此新分支，不合併、不開 PR、不更動 PR42 既有 head。

| 項目 | 結果 | 修復 commit |
| --- | --- | --- |
| P0-1 | create 才套預設值；PATCH enabled/name 保留三欄，明確空群組與零額度仍可更新 | `b013efa` |
| P1-1 | production 或存在 K_SERVICE 且缺／空白 OWNER 時，所有 hub 路徑 503 owner_not_configured 並告警；hubAccounts 優先，Instinct 永不升成 owner | `064a85b` |
| P2-2 | 有效 key 的 Agent 停用回 403 agent_disabled 中文說明；錯誤／其他 owner 的 key 仍 401 | `7f87ec3` |
| P2-3 | LINE SDK SignatureValidationFailed 回 401，不打 ERROR log；有效簽章仍通過 | `e818fd6` |
| P2-1 | 僅明確 403 + account_not_allowed 顯示 NoAccess；其他錯誤顯示暫時連不上 WiPPY並可重新取得 role | `a09e42e`, `40bc76c` |
| P2-4 | TextField（input/textarea）、SelectField 白底，gray-900 值、gray-500 placeholder | `f9d66f5` |
| P2-5 | 既有 Instinct 可修改 inboxAlertHours，寫入 settingsPatch | `53e77f5` |

## 驗證

| 檢查 | 結果 |
| --- | --- |
| backend npm test -- --runInBand | 39 suites，359 tests：359 pass / 0 fail |
| backend npm run build | PASS |
| frontend npm run lint | PASS |
| frontend npm test | 11 files，100 tests：100 pass / 0 fail |
| frontend npm run build | PASS；既有超過 500 kB chunk 提示仍存在 |
| 瀏覽器 UI／實際 HTTP | 9 checks：9 pass / 0 fail；系統 Chrome，桌面 1280×900、Instinct 手機 390×844 |

本輪重新執行上述全部測試、lint/build、9 項實際 HTTP／瀏覽器檢查及對比量測，全部通過。樣式以真實瀏覽器計算色彩與 WCAG relative luminance 驗證。

P0 UI：將 Grok 設為兩個群組、每日 5、預警 48。停用 → 重新整理 → 啟用 → 重新整理後，兩個 checkbox 仍勾選，後端三欄也保持原值；MCP list_groups 前後結果一致。停用時 MCP 為 403 agent_disabled，錯 key 為 401。Instinct 時數設成 48、儲存、重新整理後仍是 48。

網路請求中斷時顯示「暫時連不上 WiPPY」並能重試成功；403 account_not_allowed 顯示 NoAccess。Instinct 真實 emulator 登入後 /api/hub/me 為 role=agent。錯 LINE 簽章在實際後端回 401，runtime log 沒有 ERROR。

對比量測涵蓋 input、textarea、select 共 9 個欄位：文字最低 **17.7466:1**、placeholder 最低 **4.8364:1**，皆 ≥ 4.5:1；修前最低約 1.0981:1。

## 證據

本輪重驗證據（隨結果提交）：
- [P0 停用再啟用與重整](evidence/P0-1-toggle-reload.png)
- [Instinct 時數 48](evidence/P2-5-instinct-hours-48.png)
- [網路錯誤與重試](evidence/P2-1-network-retry.png)
- [Instinct 手機工作台](evidence/P1-1-instinct-agent-mobile.png)
- [9 項 UI 結果](evidence/ui-results.json)
- [對比計算](evidence/P2-4-after.json)

本機完整 logs 與 RED/GREEN 過程：`/workspace/codex-burn/uat-wippy/pr42-fix/run/evidence/`，本輪 logs：r4-backend-test.log、r4-backend-build.log、r4-frontend-test.log、r4-frontend-lint.log、r4-frontend-build.log、r4-ui-verification.log、r4-contrast.log、r4-backend-runtime.log。錯誤簽章檢查後 backend runtime ERROR entries = 0。

## P1-2 HTTPS 預覽：TUNNELS_OFF，延後

已確認 `/workspace/codex-burn/TUNNELS_OFF` 存在。本輪沒有啟動任何 cloudflared tunnel／relay，僅在本機埠驗證；待 Willy 起床且解除禁止後再處理預覽，沒有本輪可交付的 HTTPS URL。此狀態取代前輪 tunnel 嘗試記錄。

只重啟 pr42-backend／pr42-frontend：backend 使用此 clone 編譯後的 dist，frontend 使用此 clone 的 Vite；Auth/Firestore/mockline 沿用既有 pr42 堆疊。沒有變更其他 lane、deploy、公開 tunnel、主工作樹或既有 PR42 head。較舊的 DEPLOY_STATUS／restart-tunnels 運維要求與最高優先範圍衝突，本輪未執行。

P2-6 依要求不修；舊 UAT 旅程本輪維持擱置。真實 LINE/Grok/GCS/Cloud Tasks 不在此次本機修復重驗範圍。

## 指定結果檔路徑限制

嘗試寫入 `/workspace/codex-burn/notes/wippy-pr42-fixes-result.md` 時，環境回覆 `OSError: [Errno 30] Read-only file system`；該目錄不在本 session 的可寫範圍。完整報告保存在本檔，另提供 clone 根目錄同名檔供外部工作程序複製。

## 安裝路徑 UAT

更新：2026-11-10 11:14（Asia/Taipei，11:05 接續）；session B，基於 `46b5eda` 的工作樹。**19 個案例 × 桌面／手機／API = 57/57 PASS，0 FAIL，零重試**。本輪接續上一輪工作樹，先重新驗證 51/51，再以新手視角探索並新增 UAT-18／19；兩項缺陷先重現失敗，修復後完整重跑通過。

驗收以新手可見流程為中心：Owner 建 Grok 與 Instinct、保存一次性憑證、REST/MCP 身分與活動訊息讀取、瀏覽器建立關鍵字規則、有效 LINE 簽章觸發、Routine／工作台處理工作、發送／紀錄／排程、停用與復原、群組撤權與每日限制。真實 WiPPY HTTP + Firebase Auth/Firestore emulator（demo-wippy-pr42）；外部 LINE／Routine 使用 mock，不讀取真實 key。

| 案例 | 驗收流程 | 桌面 | 手機 | API |
| --- | --- | --- | --- | --- |
| UAT-01 | Owner 建立 Grok／一次性 key | PASS | PASS | PASS |
| UAT-02 | Routine 驗證／UI 規則／簽章派送 | PASS | PASS | PASS |
| UAT-03 | 讀活動訊息／冪等發送／紀錄／排程 | PASS | PASS | PASS |
| UAT-04 | 停用啟用／設定保留 | PASS | PASS | PASS |
| UAT-05 | 群組限制／零額度及用完額度 | PASS | PASS | PASS |
| UAT-06 | Instinct 建立／登入／Owner 權限隔離 | PASS | PASS | PASS |
| UAT-07 | Instinct 收件匣／發送／完成 | PASS | PASS | PASS |
| UAT-08 | key 輪替／密碼重設／既有 token 停用 | PASS | PASS | PASS |
| UAT-09 | 錯誤輸入／跨 Agent 隔離 | PASS | PASS | PASS |
| UAT-10 | 指南 19 條 curl／REST 與 MCP | PASS | PASS | PASS |
| UAT-11 | 舊派送／收件匣撤權及恢復 | PASS | PASS | PASS |
| UAT-12 | 錯誤輸入復原／重複 Email | PASS | PASS | PASS |
| UAT-13 | profile 斷線下登入登出／防止競態 | PASS | PASS | PASS |
| UAT-14 | 撤權後禁止完成既有工作／恢復後完成 | PASS | PASS | PASS |
| UAT-15 | 停用後重新登入指引／Owner 啟用復原 | PASS | PASS | PASS |
| UAT-16 | REST 完成端點冪等隔離／新鍵復原 | PASS | PASS | PASS |
| UAT-17 | 登入欄位及收件匣文字對比／名稱來源 | PASS | PASS | PASS |
| UAT-18 | 一次性憑證新建／復原可讀性及保密 | PASS | PASS | PASS |
| UAT-19 | 完成／搜尋失敗提示、輸入保留及重試 | PASS | PASS | PASS |

Chrome 桌面 1280×800、手機 390×844（`channel: chrome`）。57 張本次截圖保存在 `docs/uat/evidence/` 與本目錄 `evidence/`，已逐一驗尺寸、SHA-256 與副本一致性。每個頁面另斷言無水平溢出。一次性憑證區／密碼欄位遮罩，不保存 trace、video 或 auth storage；API 截圖是相應 Owner 畫面，API 結果另有 HTTP、Firestore 與 mock 發送次數／內容斷言。UAT-17／18 的 32 筆桌機／手機色彩量測也有兩份 JSON 副本。

- [完整計畫](../uat/UAT-PLAN.md)、[逐案例結果與截圖](../uat/UAT-RESULTS.md)、[機器狀態](../uat/UAT-STATUS.json)
- [新手安裝指南](../agent-hub/INSTALL-GROK-BOT-AND-INSTINCT.md)：只有 placeholders；19 條 curl 實跑，含 Instinct Firebase 換 token、MCP initialize/tools/list、發送、紀錄、排程、完成工作及復原。區分 WiPPY key、Routine key、Instinct 帳密；不宣稱有草稿或 activities CRUD，排程會直接核准；Willy 的機密與設定僅列名稱。
- [驗證統計及截圖 SHA-256](evidence/install-uat-verification.json)、[登入／工作台對比](evidence/UAT-17-desktop-contrast.json)、[憑證桌面對比](evidence/UAT-18-desktop-contrast.json)、[憑證手機對比](evidence/UAT-18-mobile-contrast.json)；`npm run verify:uat` 可重建 manifest。

### 發現及修復

| 編號 | 原失敗／原因 | 最終驗證 |
| --- | --- | --- |
| PR42-UAT-11 | 關閉／撤回群組後仍能讀舊 dispatch/inbox；先 limit 再過濾會漏掉合法工作 | 依目前授權限制 dispatch 及 inbox；分批查詢再合併最新 100；保留 100 筆撤權遮蔽、31 群組／102 筆單元測試；REST/MCP、桌機手機通過；新增兩個 Firestore 索引 |
| PR42-UAT-08 | 停用 Instinct 的有效 token 被誤回 401 invalid_token 或網站誤顯示網路故障 | Firebase 停用回 403 account_disabled，Agent 停用回 403 agent_disabled；網站提示聯絡 Owner 啟用；Auth emulator 驗收通過 |
| PR42-UAT-13 | 等待 profile 寫入會卡住登入；舊非同步完成回呼可能還原已登出者 | 三個單元測試 RED→GREEN；身分立即更新、profile 背景同步；瀏覽器阻斷 Firestore 時登入→登出→重新登入通過 |
| PR42-UAT-14 | 本輪重現：已開啟的舊工作在撤權後仍能完成，改寫 inbox/dispatch | 完成前檢查目前群組授權；關閉群組／移除允許名單都 blocked group_not_allowed；原工作逐欄不變，Owner 仍可處理，恢復授權後新要求成功；單元、REST、MCP、桌機手機先 RED 後 GREEN |
| PR42-UAT-15 | 本輪探索：Firebase 停用後重整會登出；登入頁只寫已停用，沒有復原步驟 | 登入錯誤加 role=alert，明確要求聯絡 Owner 啟用後重登；停用登入被拒、既有 token 403 無副作用、啟用後回工作台並保留群組及時數 |
| PR42-UAT-16 | 本輪重現：dispatch/inbox ID 相同時，兩個 REST complete 共用固定鍵，回傳錯誤動作且 inbox 未完成；blocked 結果固定重播而不能復原 | 預設鍵按端點類型隔離；JSON 可提供新 idempotencyKey；兩工作皆正確完成，同鍵重播且不覆寫，新鍵恢復成功，非法鍵 400；REST 與桌機手機先 RED 後 GREEN |
| PR42-UAT-17 | 本輪視覺探索：登入值、placeholder、收件匣標題繼承淺色文字；實測最低 1.009:1，時間也不足 | 明確設定深色文字／placeholder／時間；Chrome 實際色彩與 alpha 合成計算，8 個狀態 × 2 viewport 全部 ≥4.5:1，最低 4.8364:1；登入值 17.7466:1；先 RED 後 GREEN |
| PR42-UAT-18 | 本輪新手探索：新建及復原的一次性 API key／MCP URL／Instinct Email／密碼繼承 body 淺色，白底對比僅 1.098:1，難以確認憑證 | 憑證區明確指定深色文字；兩種 Agent 新建／復原共 8 欄位 × 2 viewport 均 17.7466:1；新憑證可用、關閉重整不可回查、讀取 API 不含明文；桌面先 RED 後完整 GREEN |
| PR42-UAT-19 | 本輪新手探索：工作台完成／搜尋收到 503 時沒有提示，造成未捕捉 promise rejection，搜尋還留下舊結果 | 加上錯誤提示及重試狀態，保留備註／查詢、清除舊結果，無結果顯示說明；兩個單元測試及 E2E 先 RED 後 GREEN，HTTP 拒絕不改工作、復原重試成功且無未捕捉錯誤 |
| PR42-UAT-10 | 文件缺 REST／Instinct token 步驟，假設聊天要求等同安裝 MCP，缺依賴與錯誤復原說明 | 新手指南、README 入口及既有文件修訂；寫清平台支援性、無草稿 API、群組雙重授權、額度、停用及新冪等鍵復原；19 條 curl 實跑通過 |

沒有弱化產品斷言或開啟重試。本輪修正新單元測試的 Testing Library 型別寫法（精確名稱改用正規表示式），並加強截圖前等待清單載入／結果進入 viewport，避免拍到載入中的空白畫面。前輪修正兩個測試前提：Firebase 會在停用帳號重整時登出，應測拒絕登入後復原；既有 Agent 列表的逾時欄位 label 包含 Agent 名稱，定位須完整匹配。UAT-14 的 REST 復原要求改帶新的鍵，並由 UAT-16 額外斷言原鍵仍重播 blocked、新鍵才可成功。

測試只清理 `pr42-install-owner` fixture，不重設共用 emulator；mock quota 使用專用 ID。Routine mock 拒絕缺／錯 Bearer；錯 key 401→修正成功另有驗證。仍有本機 Firebase profile transport 警告；UAT-13 刻意注入斷線且證明不阻擋登入/API，沒有視為真實雲端 profile 同步已驗證。

### 回歸檢查

| 指令 | 最後結果 |
| --- | --- |
| `npm run test:e2e` | 57/57 PASS（19×3），零重試；57 張本次截圖 |
| `npm --prefix backend test -- --runInBand` | 39 suites，367/367 PASS |
| `npm --prefix backend run build` | PASS（test:e2e 前置編譯） |
| `npm --prefix frontend test` | 12 files，107/107 PASS |
| `npm --prefix frontend run lint` | PASS |
| `npm --prefix frontend run build` | PASS；既有 >500 kB chunk 提示 |
| `npm run verify:uat`、`git diff --check`、九份 patch 順序套用比對 | PASS；57 張截圖、32 筆對比、九份 patch；18 檔案一致 |

最後完整 E2E log：本機忽略目錄 `run/install-uat/r6-final-evidence-e2e.log`；先前完整通過 `r6-final-e2e.log`，基準重驗 `r6-initial-e2e.log`。回歸：`r6-backend-test.log`、`r6-final-frontend-test.log`、`r6-final-frontend-lint.log`、`r6-final-frontend-build.log`。本輪缺陷重現：`r6-uat18-19-red.log`、`r6-uat19-unit-red.log`；修復驗證：`r6-uat18-19-green.log`、`r6-uat19-unit-green.log`。九份 patch 已從 HEAD 依提交順序套用到本機驗證副本，18 個檔案與最終工作樹逐檔一致。

### Commit 清單與交付限制

**本輪新增 commit：0，未 push。** `.git` 實際掛載為唯讀，`git add` 回覆 `.git/index.lock: Read-only file system`；沒有繞過保護。HEAD 仍為 `46b5eda`。九項修復都有獨立 patch，驗證可反向套用；工作樹完整保留。

| 項目 | 待提交訊息／備援 | 狀態 |
| --- | --- | --- |
| PR42-UAT-11 | `fix(PR42-UAT-11): enforce current group access before limiting saved work`；[patch](patches/PR42-UAT-11.patch) | 待可寫 Git 環境提交 |
| PR42-UAT-08 | `fix(PR42-UAT-08): explain disabled Instinct accounts consistently`；[patch](patches/PR42-UAT-08.patch) | 同上 |
| PR42-UAT-13 | `fix(PR42-UAT-13): keep login state independent of profile writes`；[patch](patches/PR42-UAT-13.patch) | 同上 |
| PR42-UAT-14 | `fix(PR42-UAT-14): deny saved work completion after group access is revoked`；[patch](patches/PR42-UAT-14.patch) | 同上 |
| PR42-UAT-15 | `fix(PR42-UAT-15): explain how to recover a disabled Instinct login`；[patch](patches/PR42-UAT-15.patch) | 同上 |
| PR42-UAT-16 | `fix(PR42-UAT-16): isolate completion keys and allow explicit recovery keys`；[patch](patches/PR42-UAT-16.patch) | 同上 |
| PR42-UAT-17 | `fix(PR42-UAT-17): make login fields and inbox work labels readable`；[patch](patches/PR42-UAT-17.patch) | 同上 |
| PR42-UAT-18 | `fix(PR42-UAT-18): make one-time Grok and Instinct credentials readable`；[patch](patches/PR42-UAT-18.patch) | 同上 |
| PR42-UAT-19 | `fix(PR42-UAT-19): explain workbench failures and preserve retry inputs`；[patch](patches/PR42-UAT-19.patch) | 同上 |
| PR42-UAT-10 | `docs(PR42-UAT-10): document verified Grok and Instinct installation` | 同上 |
| PR42-UAT-01 | `test(PR42-UAT-01): automate installation journeys and preserve UAT evidence` | 同上 |

[精確提交分組及交接](COMMIT-HANDOFF.md)，包含 LoginPage／WorkbenchPage 多項修復的分別暫存方式。無法建立可推的新提交，因此沒有執行 push 腳本；本訊息也同時含唯一腳本 push 授權與後段禁止 push 規則，未自行推送。請 Product Builder 在可寫 Git 環境提交並依最終授權補推。沒有 merge、開 PR、修改 remote、雲端部署或 tunnel。

指定摘要 `/workspace/codex-burn/notes/wippy-pr42-install-uat-result.md` 在可寫範圍外，且任務要求只在目前目錄寫入；摘要保存在 [repo 內副本](../../wippy-pr42-install-uat-result.md)，請 Product Builder 複製。

`ready_for_user_test=true` 只代表本機 emulator/mock 的瀏覽器流程可驗收。指南附手動啟動 `node e2e/stack.cjs` 及 Owner fixture 來源；沒有留下正在跑的測試服務。真實 Grok／Instinct 平台、LINE 推播、GCS、Cloud Tasks、HTTPS 仍待後續驗證；雲端部署須包含兩個新 Firestore agentInbox 索引。本輪自啟 4141／4142／4143 均已關閉，沿用的 emulator 與原有堆疊／其他 lane 保留。

### 2026-11-10 16:05 接續驗證

接續先前未提交的工作樹，重新執行完整 `npm run test:e2e`：桌面、手機、API 共 57/57 PASS，無重試；前次桌面 UAT-08 失敗本次通過，僅憑重跑不能確定前次失敗根因。最新逐項結果和狀態見 [UAT 結果](../uat/UAT-RESULTS.md)與 [狀態](../uat/UAT-STATUS.json)。`npm run verify:uat` 驗證 57 張截圖、32 筆對比值與九份可反向檢查的 patch，`git diff --check` 通過。後端 367/367、前端 107/107 測試及前端 lint/build 通過；瀏覽器 profile transport 警告仍存在，真實雲端同步未驗證。本次啟動的 4141–4143 已關閉。

再次執行 `git add backend/src/hub/queries.ts`，因 `.git/index.lock: Read-only file system` 失敗；本次沒有新增 commit。依後段明確禁止 push 的指示，沒有執行 push；摘要仍保留於 repo 內，沒有寫入目錄外的 notes。

### 2026-11-10 16:08 接續驗證

重新執行完整旅程，桌面、手機及 API 共 57/57 PASS，沒有重試；`npm run verify:uat` 核對 57 張截圖、32 筆對比與九份修復 patch。後端 367/367、前端 107/107 測試，以及前端 lint/build、`git diff --check` 均通過。測試後 4141–4143 已關閉。Firebase profile 傳輸警告仍有出現；真實雲端同步及外部服務未驗證。

再次確認 `git add -n README.md` 因 `.git/index.lock: Read-only file system` 失敗；修復仍在工作樹，沒有新增 commit。遵照後段禁止 push 規則，未執行 push；提交分組及目錄外摘要限制仍見上方交接。

### 2026-11-10 16:37 接續驗證

完整 `npm run test:e2e` 57/57 PASS（桌面、手機、API，各 19 案），包含指南 curl 範例；`npm run verify:uat` 驗證 57 張截圖、32 筆對比和九份修復 patch。後端 367/367、前端 107/107，前端 lint/build 通過。測試使用本機 emulator 與 mock；真實外部平台、LINE 和 HTTPS 尚未驗證。

`git add backend/src/hub/queries.ts` 再次因 `.git/index.lock: Read-only file system` 失敗，沒有新 commit；遵循後段禁止 push 的指示，沒有 push。提交分組見 [交接](COMMIT-HANDOFF.md)；目錄外摘要仍保留在 repo 副本。

### 2026-11-10 17:51 接續驗證與提交

本次完整 `npm run test:e2e` 57/57 PASS（桌面、手機、API 各 19）；先前手機 UAT-19 前置逾時未再重現，根因未確定。`npm run verify:uat` 核對 57 張截圖及 32 筆對比；後端 367/367、前端 107/107，前端 lint/build 與 `git diff --check` 通過。Firefox 未測；Chrome 使用本機 emulator/mock，真實 Grok、Instinct、LINE、HTTPS 與雲端 profile 同步仍待驗證。

Git 已可寫，以下修復已分別提交（上方唯讀與待提交資訊為歷史紀錄）：

| 案例 | Commit |
| --- | --- |
| PR42-UAT-11 | a1dc0e3 |
| PR42-UAT-08 | d1fad90 |
| PR42-UAT-13 | f49c50e |
| PR42-UAT-14 | b52bd60 |
| PR42-UAT-15 | 960c8f2 |
| PR42-UAT-16 | 5c36b0a |
| PR42-UAT-17 | 738b48d |
| PR42-UAT-18 | 0bed4ae |
| PR42-UAT-19 | f8023a6 |
| PR42-UAT-10 指南 | c921a7b |

測試、證據與報告另以 `test(PR42-UAT-01)` 提交。依後段明確禁止 push 的指示未 push；目錄外摘要由 Product Builder 使用 repo 副本。部署前需要新增的 Firestore 索引。

### 2026-11-10 第 2 輪接續驗證

接續已提交的工作，桌面、手機與 API 完整測試兩次均為 56/57。第一輪桌面 UAT-14 在新視窗等待登入欄位逾時；第二輪此案例通過，但手機 UAT-19 發生操作逾時，錯誤未指出步驟。兩者根因尚未確定，不能將重跑通過當成修復；瀏覽器亦出現 Firestore profile transport 警告。每輪結果存於 [17:58 報告](../uat/UAT-RESULTS-2026-11-10-1758.md)及 [18:15 報告](../uat/UAT-RESULTS-2026-11-10-1815.md)，最新結果見 [UAT 結果](../uat/UAT-RESULTS.md)及 [狀態](../uat/UAT-STATUS.json)。修正證據驗證程式過時的 Git 唯讀／無 commit 敘述。依指示沒有 push、部署或操作其他 lane。

第三輪完整重跑 18:42 為 56/57：桌面 UAT-11 截圖時逾時，前兩輪該案例通過。最新 `ready_for_user_test` 為 false；證據 manifest 標記為未驗證，`npm run verify:uat` 只在完整通過後重建雜湊。前兩輪保存的是結果表，表中截圖連結指向最新執行的證據，不是當時截圖的歷史副本。4141–4143 測試服務已關閉。真實 Grok、Instinct、LINE 與 HTTPS 仍未驗證。

### 2026-11-10 19:46 第 3 輪接續驗證

19:26 完整執行為 56/57：API UAT-17 在 `beforeEach` 前置階段逾時，產品斷言未執行；同輪桌面 UAT-11 通過。19:46 再次完整執行為 **57/57 PASS**，桌面、手機及 API 各 19 案，無測試重試；指南的 19 條 curl 也由 API 案例執行。`npm run verify:uat` 驗證 57 張截圖、32 筆對比與 9 份修復 patch；`git diff --check` 通過。最新逐項結果與證據見 [UAT 結果](../uat/UAT-RESULTS.md) 和 [狀態](../uat/UAT-STATUS.json)。

本輪逾時與前輪瀏覽器截圖逾時發生在不同階段，根因仍未釐清；重跑成功不是根因修復。測試期間瀏覽器仍出現 Firestore transport 警告。`ready_for_user_test` 指本機 emulator/mock 瀏覽器旅程已通過，真實 Grok、Instinct、LINE、HTTPS 與雲端同步仍未驗證。未進行新一輪完整通過後的人工探索；現有 UAT-11～19 為先前探索結果。本輪沒有產品修復；既有修復 commit 列於上表。本輪啟動的 4141–4143 已關閉；依後段指示不 push、不部署，不寫入工作目錄外的摘要。

### 2026-11-11 00:39 接續驗證

既有服務未運行，本次在隔離的 Auth／Firestore emulator 和 LINE／Routine mock 上，使用系統 Chrome 完整執行 19 案 × 桌面、手機、API：**57/57 PASS，無重試**；指南範例包含於 API 案例。驗證證據為 57 張截圖、32 筆對比數值及 9 份修復 patch。後端單元測試 367/367、前端 107/107，前端 lint/build 通過；build 提示大型 chunk。最新案例及證據見 [UAT 結果](../uat/UAT-RESULTS.md)與 [狀態](../uat/UAT-STATUS.json)。

完整通過後以桌面及手機視窗探索建立表單，可切換 Grok Bot／Instinct 並顯示相應欄位；未發現新缺陷，此次探索範圍僅限表單切換。此前數輪間歇逾時根因仍未釐清，本輪未重現；瀏覽器 Firestore transport 警告仍存在，真實雲端同步未驗證。真實 Grok、Instinct、LINE 與 HTTPS 均未驗證，`ready_for_user_test` 僅指本機 mock/emulator 流程。

本輪測試暫時將既有腳本的 emulator 連線改至 4144／4145，測後已還原；本次啟動服務已關閉。Firestore 首次啟動短暫佔用預設 9150，立即停止並改用 4148。既有產品修復的 commit 清單見上方「2026-11-10 17:51 接續驗證與提交」；本輪沒有產品修復。依後段規則未 push、部署或寫入工作目錄外的摘要。

### 2026-11-11 04:16 接續驗證

在隔離的 Auth 4144／Firestore 4145 emulator，以系統 Chrome 執行完整 `npm run test:e2e`：桌面、手機及 API 各 19 案，**57/57 PASS**，無重試；`npm run verify:uat` 核對 57 張截圖、32 筆對比與 9 份修復 patch。API 案例包含安裝指南 curl 範例。完整逐項結果及最新證據見 [UAT 結果](../uat/UAT-RESULTS.md)。

完整通過後，以兩種視窗探索新增 Agent 表單的 Grok Bot／Instinct 類型切換，欄位可見；探索範圍僅限此表單。測試仍出現 Firestore transport 警告，以往間歇逾時根因亦未確認。真實 Grok、Instinct、LINE、HTTPS 與雲端同步未驗證，狀態僅代表本機 mock/emulator 旅程。

接續既有未提交的測試設定，使 emulator host 可由環境變數指定（`4628965`）。本輪沒有產品修復；先前修復 commit 清單見上方「2026-11-10 17:51 接續驗證與提交」。依後段規則沒有 push、部署或寫入工作目錄外的摘要。

### 2026-11-11 05:22 接續驗證

隔離 Auth 4144／Firestore 4145、Chrome 桌面與手機及 API 全套重跑 **57/57 PASS**；`npm run verify:uat` 核對 57 張截圖、32 筆對比與 9 份 patch。此前 04:22 的執行為 56/57：手機 UAT-07 登入後等待收件匣項目逾時，畫面中群組及收件匣尚未載入；根因未確認，後續通過不代表已修復。前次結果保留於 `docs/uat/UAT-RESULTS-2026-11-11-0422.md`，其截圖已被重跑覆寫。瀏覽器 Firestore transport 警告仍存在。

通過後在兩種視窗探索新增 Agent 表單切換 Grok／Instinct，欄位正常；本次探索限於表單切換。真實外部 Agent、LINE、雲端同步及 HTTPS 未驗證；ready 僅指本機 mock/emulator。沒有產品修復，本次服務已停止；依後段指示不 push 或寫入工作目錄外。

### 2026-11-11 06:19 接續驗證

隔離 Auth 4144／Firestore 4145 emulator，系統 Chrome 桌面與手機及 API 全套 **57/57 PASS**，無重試；指南範例包含在 API 案例中。`npm run verify:uat` 驗證 57 張截圖、32 筆對比及 9 份修復 patch。逐項結果、狀態與本次截圖見 [UAT 結果](../uat/UAT-RESULTS.md)及 [狀態](../uat/UAT-STATUS.json)。完整通過後以兩種視窗探索新增 Agent 表單類型切換，正常；探索範圍僅限此表單。

本輪沒有產品修復；先前修復 commit 見上方清單。先前間歇逾時的根因仍未確認，Firestore transport 警告仍出現。真實 Grok、Instinct、LINE、HTTPS 與雲端同步尚未驗證；ready 僅指本機 emulator/mock 流程。此次啟動的服務已停止，依最新規則未 push、部署或寫入工作目錄外。

### 2026-11-11 第 6 輪接續驗證

隔離 Auth 4144／Firestore 4145、系統 Chrome 全套為 **56/57**：手機 UAT-02 在選擇「觸發條件」時超過 60 秒，桌面與 API 共 38 案及其餘手機案例通過。單獨診斷相同手機案例連跑三次通過（33.6、2.7、2.4 秒），但不足以確定根因或宣稱修復；既有間歇逾時仍待調查。失敗畫面被診斷覆寫，結果表已明示，證據 manifest 標記未驗證。詳見 [UAT 結果](../uat/UAT-RESULTS.md)及[狀態](../uat/UAT-STATUS.json)。

本次瀏覽器仍有 Firestore transport 警告，真實外部 Agent、LINE、HTTPS 與雲端同步未驗證。完整測試未通過，未執行通過後的探索式測試。本輪沒有產品修復；既有修復 commit 見上方清單。依最後的規則未 push、部署或寫入工作目錄外的摘要。

### 2026-11-11 10:19 第 8 輪接續驗證

隔離 Auth 4144／Firestore 4145，以系統 Chrome 執行完整 `npm run test:e2e`：桌面、手機及 API 各 19 案，**57/57 PASS**，無重試；包含指南 curl 範例。`npm run verify:uat` 核對 57 張截圖、32 筆對比度及 9 份 patch。詳細結果見 [UAT 結果](../uat/UAT-RESULTS.md)。完整通過後另以桌面和手機探索空白名稱與 Instinct 空白 Email：表單阻止提交，後端 Agent 數仍為零。第一次探索的清理程式報錯，修正清理後兩個 viewport 的檢查重新通過。

先前手機 UAT-02 間歇逾時本輪未重現，根因仍未確認；本輪持續出現瀏覽器 Firestore transport 警告，真實雲端 profile 同步尚未驗證。`ready_for_user_test` 僅指本機 emulator/mock 旅程，不代表真實 Grok、Instinct、LINE 或 HTTPS 已驗證。本輪沒有產品修復；既有修復 commit 見前述清單。依後段規則未 push，目錄外摘要未寫入，repo 內摘要保留。測試服務已關閉。

### 2026-11-11 11:09 第 9 輪

隔離 Auth 4144／Firestore 4145，以系統 Chrome 執行完整桌面、手機與 API 旅程 **57/57 PASS**，無重試；包含新手指南範例。`npm run verify:uat` 核對 57 張截圖、32 筆對比與 9 份修復 patch。通過後另外在兩種視窗探索 Grok／Instinct 建立表單切換，均正常。逐案結果見 [UAT 結果](../uat/UAT-RESULTS.md)。

先前間歇逾時根因仍未確認，Firestore transport 警告仍在；本次通過不代表問題已修復。真實 Grok／Instinct／LINE、雲端同步及 HTTPS 未驗證。測試服務已停止；依後段規則未 push、未寫工作目錄外。

### 2026-11-11 第 10 輪

隔離 Auth 4144／Firestore 4145 emulator，系統 Chrome 桌面、手機及 API：先有 57/57 PASS；探索 Instinct 錯誤密碼後修正登入，新增 UAT-20，再完整執行 **60/60 PASS**、無重試。`npm run verify:uat` 核對 60 張截圖、32 筆對比及 9 份修復 patch。首次探索腳本使用錯誤回傳欄位而中止，修正後兩種視窗均通過。完整通過後再次探索新增 Agent 表單的類型切換，兩種視窗均正常。逐項結果見 [UAT 結果](../uat/UAT-RESULTS.md)。

先前間歇逾時根因仍未確認，瀏覽器 Firestore transport 警告仍在；真實 Grok／Instinct／LINE、雲端同步與 HTTPS 未驗證。此輪沒有產品修復；既有修復 commit 清單見上方。測試服務已停止；依後段規則未 push、未寫工作目錄外的摘要。

### 2026-11-11 第 11 輪接續驗證

隔離 Auth 4144／Firestore 4145、系統 Chrome 桌面、手機及 API 執行完整 `npm run test:e2e`：**59/60 PASS，1 FAIL**，無重試。桌面 UAT-08 前置導向 Agent 管理頁時，畫面停在 Loading...，測試於 60 秒逾時；未進入憑證輪替斷言。手機及 API UAT-08 均通過。Loading 可能來自身分初始化或 Hub 角色載入，現有證據不足以確定是哪個階段，也不能確定與先前逾時是否同因；尚未修復。逐項結果及失敗畫面見 [UAT 結果](../uat/UAT-RESULTS.md)，狀態為 `ready_for_user_test=false`。

本輪截圖已覆寫前次截圖，既有 manifest 的雜湊不再代表目前證據，已標註無效；完整通過後才能重新執行 `npm run verify:uat`。瀏覽器 Firestore transport 警告仍出現，真實 Grok／Instinct／LINE、雲端同步與 HTTPS 未驗證。完整測試未通過，未進行通過後探索；沒有產品修復。此輪啟動的 4141–4148 服務已停止；依後段規則未 push、部署或寫入工作目錄外摘要。既有修復 commit 清單見上方「2026-11-10 17:51 接續驗證與提交」，新增 UAT-20 測試 commit 為 `6899038`。

### 2026-11-11 第 12 輪接續驗證

隔離 Auth 4144／Firestore 4145，以系統 Chrome 執行完整 `npm run test:e2e`：桌面、手機及 API 各 20 案，**60/60 PASS**，無重試；`npm run verify:uat` 核對 60 張截圖、32 筆對比與 9 份修復 patch。最新逐案結果與截圖見 [UAT 結果](../uat/UAT-RESULTS.md)；先前桌面 UAT-08 逾時本輪未重現，根因仍未確定。Firestore transport 警告仍出現，不能推論它是逾時原因。

完整通過後另以桌面及手機探索 Instinct 錯誤 Email 格式：瀏覽器阻止提交，資料庫沒有新增 Agent；修正 Email 後成功建立並顯示一次性憑證。探索腳本第一次使用相對網址而中止，修正網址後兩種視窗皆通過。本輪沒有產品修復。既有修復 commit 見「2026-11-10 17:51 接續驗證與提交」，UAT-20 測試為 `6899038`。

`ready_for_user_test` 僅代表本機 emulator/mock 路徑；真實 Grok、Instinct、LINE、雲端同步及 HTTPS 尚未驗證。此次啟動服務已停止；依後段規則未 push、部署或寫入工作目錄外的摘要。

### 2026-11-11 第 13 輪接續驗證

隔離 Auth 4144／Firestore 4145，以系統 Chrome 執行完整 `npm run test:e2e`：桌面、手機及 API 各 20 案，**60/60 PASS**，無重試；`npm run verify:uat` 核對 60 張截圖、32 筆對比與 9 份修復 patch。逐項結果與本次證據見 [UAT 結果](../uat/UAT-RESULTS.md)。完整通過後，另以桌面與手機操作新增 Agent 表單，切換 Grok／Instinct 並確認對應欄位可見；此次探索僅限表單切換，沒有新增缺陷或產品修復。

先前間歇逾時根因仍未確定；本輪仍出現 Firestore transport 警告，不能推論警告是逾時原因。`ready_for_user_test` 僅代表本機 emulator/mock 路徑，真實 Grok、Instinct、LINE、雲端同步及 HTTPS 尚未驗證。既有修復 commit 見「2026-11-10 17:51 接續驗證與提交」，UAT-20 測試為 `6899038`。依最後的規則未 push、部署或寫入工作目錄外摘要。

## 2026-11-11 13:46 接續安裝路徑 UAT

隔離 Auth 4144／Firestore 4145，以系統 Chrome 完整執行桌面、手機及 API 共 **60/60 PASS**，沒有重試；包括安裝指南的 curl 範例。`npm run verify:uat` 驗證 60 張截圖、32 筆對比值與 9 份修復 patch。逐案結果及證據見 [UAT 結果](../uat/UAT-RESULTS.md)。先前間歇逾時本次未重現，根因仍未知；Firestore transport 警告仍出現，無法據此判斷是否相關。

完整通過後另以桌面和手機探索新增 Agent 表單切換 Grok／Instinct，兩種 viewport 均可顯示對應欄位；本次探索未新增缺陷。測試使用 emulator 與 LINE／Routine mock，真實平台、LINE、雲端同步及 HTTPS 未驗證；自啟服務已關閉。本輪沒有產品修復，既有修復 commit 清單見上文。依後段指示未 push，目錄外摘要未寫入。

## 2026-11-11 13:51 第 15 輪安裝路徑 UAT

以隔離 Auth 4144／Firestore 4145 emulator 和系統 Chrome 完整執行桌面、手機及 API：**60/60 PASS**，無重試；API 測試包含安裝指南的 curl 範例。`npm run verify:uat` 驗證 60 張截圖、32 筆對比及 9 份修復 patch；逐案結果與證據見 [UAT 結果](../uat/UAT-RESULTS.md)。完整通過後以兩種視窗探索新增 Agent 表單切換：Instinct 顯示登入 Email，切回 Grok 顯示 Routine 網址，均通過。探索腳本首次使用錯誤的選項值而逾時，修正腳本後兩種視窗均通過；未發現產品缺陷，本輪沒有產品修復。既有修復 commit 清單見前文。

歷次間歇逾時根因仍未知，本輪仍有 Firestore transport 警告；真實 Grok、Instinct、LINE、雲端同步及 HTTPS 尚未驗證，狀態僅表示可進行本機 emulator/mock 瀏覽器測試。本輪啟動服務已關閉；依最後指示未 push、部署或寫入目錄外摘要。
