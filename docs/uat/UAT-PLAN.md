# PR42 安裝路徑 UAT

目標：新手從 Owner 登入建立兩種 Agent，到讀取群組活動、執行動作、控制存取。
系統 Chrome；桌面 1280×800、手機 390×844。真實 WiPPY HTTP、Firebase Auth/Firestore emulator；LINE/Grok Routine 以本機 mock 取代。所有憑證只保存在測試程序記憶體，截圖前關閉憑證框，不開 trace/video。

## 執行計畫

- [x] 建立可獨立重跑的本機測試堆疊、API 測試與桌面/手機旅程。
- [x] 先重現文件/產品問題，記錄失敗；逐項修復，驗證後九項修復已分別提交（PR42-UAT-xx）；提交清單見 RESULTS。
- [x] 補新手指南、連回 README/既有文件，逐條驗證範例。
- [x] 全套回歸、探索式補測、更新結果與狀態，關閉本次服務。

## 前置與執行

預設連線 Auth 9299、Firestore 8285（demo-wippy-pr42）；可透過 `FIREBASE_AUTH_EMULATOR_HOST` 與 `FIRESTORE_EMULATOR_HOST` 指定隔離 emulator（例如 127.0.0.1:4144 與 127.0.0.1:4145）。每案例先清理 `pr42-install-owner` 專用測試資料與帳號，不清除其他使用者、不重設 emulator。`npm ci --cache /tmp/wippy-install-npm-cache` 後 `npm run test:e2e`（會先編譯 backend）。設定 `use.channel=chrome`，禁止下載瀏覽器。Playwright 自動啟停 frontend 4141、backend 4142、LINE/Routine mock 4143。`npm run test:api` 可只跑整合測試。每次結果由 reporter 更新；完整通過後執行 `npm run verify:uat` 驗證證據尺寸／副本／雜湊、對比數值與 patch；API 案例以對應 Owner 瀏覽器畫面截圖佐證，API 本身仍做狀態與副作用斷言。截圖為指定 viewport，另斷言頁面無水平溢出。

| 編號 | 前置 | 步驟 | 預期結果 | 對應需求 |
| --- | --- | --- | --- | --- |
| UAT-01 | Owner 已登入，群組未開放 | 開放測試群組，建立 Grok，取得一次性 key，關閉再重整 | key 不再顯示，REST me=agent、MCP 工具可列出，只見允許群組 | Owner 安裝 Grok |
| UAT-02 | Grok 已建立 | 設 Routine URL/key、測試 webhook、建關鍵字規則、送簽章事件、讀 dispatch、完成 | mock 收到 wippy.test / wippy.dispatch，指令與訊息正確，完成成功 | Routine 安裝與活動讀取 |
| UAT-03 | Grok 已授權群組 | 讀訊息/搜尋、發送文字（重送相同冪等鍵）、存紀錄、排程未來訊息 | 只發送一次，紀錄可讀，排程落地且立即核准 | 外部 Agent 操作 |
| UAT-04 | 已有 Grok、群組、每日額度 | 停用、重整、呼叫 API、啟用、重整、重新呼叫 | 停用 403 agent_disabled，啟用成功，原群組/額度保留 | 緊急開關 |
| UAT-05 | 開放與未授權群組並存 | 嘗試讀/寫未授權群組；關閉已授權群組再讀寫；額度歸零後發送 | 讀取 403；動作 blocked group_not_allowed / agent_daily_limit，沒有 LINE 副作用 | 群組與額度限制 |
| UAT-06 | Owner 可建立 Agent | 建立 Instinct，保存一次性 Email/密碼；無痕登入與 API me；嘗試後台 | role=agent；工作台/紀錄可用；admin 403；無 Grok key | Instinct 安裝 |
| UAT-07 | Instinct 登入、已建關鍵字規則 | 簽章事件產生收件匣，開啟、讀活動、發訊息、寫完成備註、標記完成 | 指令/訊息可見，發送完成，收件匣項目消失且 API done | Instinct 完整旅程 |
| UAT-08 | 兩種 Agent 已建立 | 輪替 Grok key；重設 Instinct 密碼；測舊/新憑證與停用/啟用 | 舊憑證失效，新憑證可用；Instinct 停用不能登入/呼叫 | 憑證復原與停用 |
| UAT-09 | API 可用 | 無/錯誤憑證、缺欄位、http URL、過去排程、錯誤工具、讀其他 Agent 工作 | 可辨識錯誤碼/原因；無副作用；跨 Agent 工作不可讀 | 新手錯誤與隔離 |
| UAT-10 | 安裝文件完整 | 直接擷取並執行指南全部 19 條 curl（只替換 placeholders 與本機 Auth 位址）；人工檢查入口、限制及機密名稱 | 範例皆 200 且成功；單次發送、紀錄、核准排程、派送及 inbox 完成落地；憑證不混用；不宣稱 draft/activities API | 文件驗收 |
| UAT-11 | 兩種 Agent 已收到派送，Instinct 已有收件匣 | 關閉群組、再恢復；移除允許群組、再恢復；讀既有 dispatch/inbox | REST 403 group_not_allowed；MCP isError；收件匣隱藏；Owner 仍可讀；重新授權恢復 | 探索式：撤權立即生效 |
| UAT-12 | 前 11 案已整套通過，Owner 可建 Agent | 新手填 HTTP Routine URL；修正後建立；另測重複 Instinct Email | 欄位錯誤可辨識、不建立半成品；輸入保留，修正後取得 key 可用；重複 Email 409 account_create_failed | 通過後探索式：錯誤復原 |
| UAT-13 | 新建 Instinct，Firestore 使用者 profile 尚未建立 | 阻斷瀏覽器 Firestore 連線，登入工作台、登出後再登入；API 不建 profile 直接驗 me | Firebase 登入不被 profile 寫入阻擋；工作台可見；登出不被舊 profile callback 還原；API 保持 agent 權限 | 探索式發現：登入/登出競態 |
| UAT-14 | 兩種 Agent 已收到工作，Instinct 瀏覽器已開啟項目 | Owner 關閉群組或移除允許群組；Agent 用舊畫面／REST／MCP 完成；重新授權後再完成 | 撤權後 blocked group_not_allowed，dispatch/inbox 原內容與狀態不變；Owner 仍可處理；恢復後新要求成功 | 本輪探索：撤權後不能修改舊工作 |
| UAT-15 | Instinct 已登入，Owner 保持另一個視窗 | Owner 停用；Instinct 重整後嘗試登入；Owner 啟用後重新登入 | Firebase 登出後登入頁明確顯示已停用及聯絡 Owner；API 403 且無發送；啟用後恢復工作台、群組與原設定 | 本輪探索：停用說明與瀏覽器復原 |
| UAT-16 | Instinct 有相同 ID 的 dispatch 與 inbox | 依序用 REST 完成兩者、重送；關閉群組以新鍵完成，恢復後用舊／新鍵再試 | 兩端點動作鍵互不碰撞；原鍵重播且不覆寫，新鍵可在授權恢復後成功；非法鍵 400；工作台清空 | 本輪探索：REST 完成捷徑冪等與復原 |
| UAT-17 | 新建 Instinct，已有一筆待處理工作 | 填寫登入 Email／密碼；登入後選取收件匣；Chrome 計算文字與背景對比，API 核對名稱來源 | 輸入值、placeholder、收件匣名稱及時間在選取前後皆 ≥4.5:1；名稱與指令內容正確，保存對比 JSON | 本輪視覺探索：新手登入與收件匣可讀性 |
| UAT-18 | Owner 已登入、可建兩種 Agent | UI 建 Grok／Instinct，讀一次性憑證；輪替 key／重設密碼，再檢查；關閉並重整；API 確認清單不含明文 | 新建及復原憑證共 8 個欄位對比皆 ≥4.5:1、憑證可登入；關閉後不可回查；不把內容寫入證據 | 本輪新手探索：一次性 key／帳密可讀性 |
| UAT-19 | Instinct 已登入並開啟待處理工作 | 完成工作／搜尋各注入一次 503，恢復後重試；搜尋無結果；API 測失效憑證及復原 | 明確錯誤提示、保留備註與查詢、不顯示舊搜尋結果、無未捕捉錯誤；重試後完成及搜尋成功；無結果有說明 | 本輪新手探索：網路失敗後繼續處理 |
| UAT-20 | Owner 已建立 Instinct 帳號 | 用錯誤密碼登入，再輸入正確密碼；API 檢查錯誤及成功憑證 | 顯示 Email 或密碼錯誤並保留 Email；正確密碼進入工作台，API 驗證 Agent 身分 | 新手探索：登入錯誤後復原 |
| UAT-21 | Owner 已開放測試群組 | 建立未分配群組的 Grok，查群組清單；之後分配群組、儲存並重整 | 清單先為空，授權後立即可見群組，重整保留設定 | 新手探索：建立後補授權 |
| UAT-22 | Owner 可建立 Agent | 建立時輸入負數上限；改正後建立；修改時輸入超過上限，再改正並重整 | 顯示可理解的中文範圍；無效輸入不建立或修改資料，修正後成功並保存 | 新手探索：額度輸入錯誤復原 |

每個案例在桌面與手機都執行；API project 額外執行深度斷言。探索焦點：停用後仍持有 token、空群組、零額度、重送、未知動作、撤回群組權限後讀舊派送資料。
