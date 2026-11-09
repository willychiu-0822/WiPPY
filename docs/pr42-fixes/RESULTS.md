# PR42 Agent Hub 修復結果

時間：2026-11-10（Asia/Taipei）；基底：PR42 head `52edde3`。
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
| 獨立程式碼審查 | 無 Critical／Important；補上錯誤 message 冒充 code 的回歸測試並修復 |
| 瀏覽器 UI／實際 HTTP | 9 checks：9 pass / 0 fail；系統 Chrome，桌面 1280×900、Instinct 手機 390×844 |

新增回歸都先在原行為觀察到失敗，再修復為通過；樣式以真實瀏覽器計算色彩與 WCAG relative luminance 驗證。

P0 UI：將 Grok 設為兩個群組、每日 5、預警 48。停用 → 重新整理 → 啟用 → 重新整理後，兩個 checkbox 仍勾選，後端三欄也保持原值；MCP list_groups 前後結果一致。停用時 MCP 為 403 agent_disabled，錯 key 為 401。Instinct 時數設成 48、儲存、重新整理後仍是 48。

網路請求中斷時顯示「暫時連不上 WiPPY」並能重試成功；403 account_not_allowed 顯示 NoAccess。Instinct 真實 emulator 登入後 /api/hub/me 為 role=agent。錯 LINE 簽章在實際後端回 401，runtime log 沒有 ERROR。

對比量測涵蓋 input、textarea、select 共 9 個欄位：文字最低 **17.7466:1**、placeholder 最低 **4.8364:1**，皆 ≥ 4.5:1；修前最低約 1.0981:1。

## 證據

已提交：
- [P0 停用再啟用與重整](evidence/P0-1-toggle-reload.png)
- [Instinct 時數 48](evidence/P2-5-instinct-hours-48.png)
- [網路錯誤與重試](evidence/P2-1-network-retry.png)
- [Instinct 手機工作台](evidence/P1-1-instinct-agent-mobile.png)
- [9 項 UI 結果](evidence/ui-results.json)
- [對比計算](evidence/P2-4-after.json)

本機完整 logs 與 RED/GREEN 過程：`/workspace/codex-burn/uat-wippy/pr42-fix/run/evidence/`，含 backend-test.log、backend-build.log、frontend-test.log、frontend-lint.log、frontend-build.log、ui-verification.log、backend-runtime.log。

## P1-2 HTTPS 預覽：嘗試後跳過

建議的 8790 port 已被占用，故另用 8792 relay 與 20602 metrics，僅新建 pr42-preview-* 服務。Cloudflared 曾成功註冊；公開位址持續 HTTP 530／Cloudflare 1033，連線程序未能持續，因此沒有可交付的 HTTPS URL。紀錄在 run/evidence/preview-tunnel.log、preview-relay.log、preview-verification.log。未停止或改寫既有三條 tunnel、relay 或 deploy 服務。

另外已在本機驗證單一來源 API/Auth/Firestore proxy 可以讓 owner 登入並開啟 Agent Hub 八分頁；因公開 tunnel 不可用，最終恢復一般 Vite 啟動。pr42-backend 使用此 clone 的編譯 dist，pr42-frontend 使用此 clone 的 Vite；Auth/Firestore/mockline 仍沿用既有 pr42 堆疊。

P2-6 依要求不修；舊 UAT 旅程本輪維持擱置。真實 LINE/Grok/GCS/Cloud Tasks 不在此次本機修復重驗範圍。
