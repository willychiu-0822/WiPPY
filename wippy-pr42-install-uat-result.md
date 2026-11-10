# WiPPY PR42 安裝路徑 UAT — session B

更新：2026-11-10 11:14（Asia/Taipei，11:05 接續）。本機驗收 **57/57 PASS**（19 案 × Chrome 桌面 1280×800／手機 390×844／API），零重試。

- 已接續原未提交修改，先重驗 51/51，再做新手探索，新增 UAT-18／19：一次性 key／帳密難以閱讀，以及完成／搜尋失敗沒有提示。各缺陷先 RED 再修，最終完整 57 次通過。
- 憑證新建／輪替／密碼重設的 16 筆文字對比從 1.098:1 改為 17.7466:1；憑證可用、關閉重整不可回查，讀取 API 不含明文。完成及搜尋失敗有提示並保留輸入，重試可復原，沒有未捕捉錯誤。
- 交付：新手指南（19 條 curl 實跑）、README 入口、Playwright/API 測試、57 張截圖（兩處相同副本）、32 筆對比量測、UAT 計畫／結果／JSON 狀態。`npm run verify:uat` 可重建證據 manifest。
- 回歸：backend 367/367、frontend 107/107；backend/frontend build、frontend lint 通過。九份獨立產品修復 patch 可反向檢查，也已由 HEAD 依序試套，18 檔案與工作樹一致。
- **未 commit／未 push**：本輪 `git add` 仍因 `.git/index.lock: Read-only file system` 失敗；HEAD 仍 `46b5eda`，新增 commit 0。沒有繞過保護。精確分組與九份 patch 見 `docs/pr42-fixes/COMMIT-HANDOFF.md`，由 Product Builder 在可寫 Git 環境提交；push 指示同時有允許唯一腳本及後段禁止 push，本輪沒有執行任何 push。沒有改 remote、merge、開 PR、部署或 tunnel。
- 指定 `/workspace/codex-burn/notes/wippy-pr42-install-uat-result.md` 超出本 session 可寫範圍，且任務要求只在目前目錄寫入；這是 repo 內副本，請 Product Builder 複製到指定位置。
- `ready_for_user_test=true` 僅指本機 emulator/mock。真實 Grok／Instinct／LINE／GCS／Tasks／HTTPS 未驗證；下次雲端部署須含兩個新 Firestore 索引。瀏覽器 profile 傳輸仍可能警告，已驗證不阻擋 Hub 登入。
- 自啟 4141–4143 已關閉；既有 Auth／Firestore emulator 及其他 lane／deploy／tunnel 保留。手動啟動本機瀏覽器驗收方式見新手指南末段。

完整報告：docs/pr42-fixes/RESULTS.md「安裝路徑 UAT」。
逐案結果與截圖：docs/uat/UAT-RESULTS.md。
新手指南：docs/agent-hub/INSTALL-GROK-BOT-AND-INSTINCT.md。

2026-11-10 16:05 接續驗證：完整桌面、手機、API 57/57 PASS，證據與九份 patch 檢查通過；後端 367/367、前端 107/107、lint/build 通過。前次桌面 UAT-08 此次通過，先前失敗根因未確定。`.git` 唯讀，無法建立 commit；遵照後段禁止 push 的規則未推送。真實外部服務與 HTTPS 尚未驗證。詳見 docs/uat/UAT-RESULTS.md 及 docs/pr42-fixes/RESULTS.md。

2026-11-10 16:08 再次完整驗證：57/57 PASS，57 張截圖、32 筆對比與九份 patch 檢查通過；後端 367/367、前端 107/107、前端 lint/build 均通過。`.git` 仍唯讀，沒有新增 commit 或 push；4141–4143 已關閉。真實外部服務及雲端同步仍待驗證。

2026-11-10 16:37 接續驗證：完整 57/57 PASS；證據驗證 57 張截圖、32 筆對比及九份 patch；後端 367/367、前端 107/107、前端 lint/build 通過。Git index 仍為唯讀，無新增 commit；遵照禁止 push 規則未推送。真實外部服務和 HTTPS 尚未驗證。

## 2026-11-10 接續

完整 Chrome 桌面、手機、API 57/57 通過；後端 367/367、前端 107/107，lint/build 通過。先前手機 UAT-19 逾時未重現，根因未確定。九項修復及安裝指南已分別 commit，清單見 `docs/pr42-fixes/RESULTS.md`。依後段指示未 push。真實外部平台、LINE、HTTPS 與雲端同步未驗證；Firestore 索引需隨日後部署。

2026-11-10 第 2 輪：兩次完整重跑均 56/57，分別是桌面 UAT-14 登入欄位逾時及手機 UAT-19 操作逾時，根因未明；兩次詳細報告保存在 docs/uat/。最新狀態以 docs/uat/UAT-STATUS.json 為準；本機 Firestore profile 連線仍有警告。未 push 或部署。
第三次完整重跑 18:42 為 56/57：桌面 UAT-11 截圖時逾時；最新狀態未達可供使用者測試。測試服務已關閉。

### 2026-11-11 00:39 接續

隔離 emulator／mock 的 Chrome 桌面、手機及 API 安裝旅程 57/57 通過；後端 367、前端 107 項測試，以及前端 lint/build 通過。57 張截圖、32 筆對比及 9 份 patch 已驗證。通過後新手探索限於兩種視窗切換 Grok／Instinct 建立表單。先前間歇逾時根因與 Firestore transport 警告仍未釐清；真實外部 Agent、LINE、雲端同步和 HTTPS 未驗證。測試服務已關閉。本輪依後段規則不 push，也不寫入工作目錄外。詳見 `docs/pr42-fixes/RESULTS.md`。

2026-11-11 04:16 接續：隔離 emulator 執行桌面、手機與 API 共 57/57 PASS；證據檢查通過。表單類型切換探索通過；Firestore transport 警告及先前間歇逾時根因仍待確認。未測真實外部服務、HTTPS 或雲端同步；未 push。詳見 docs/pr42-fixes/RESULTS.md。
