# WiPPY Learning Production-First UAT 與發布設計

- 日期：2026-08-12
- 狀態：使用者已核准三段設計，等待書面規格審閱
- Production 入口：`https://wippy-mvp.web.app/learn`
- Production backend：`https://wippy-backend-ts2nxgrpfa-de.a.run.app`
- 發布基準：`origin/main`；Learning Core 已由 squash commit `5153c82`（PR #37）合併

## 1. 目的

本次工作以真實 production 瀏覽器操作驗證 WiPPY Learning private canary，發現可重現缺陷時直接以隔離 worktree 修復、測試、自我審查、建立 PR、合併並驗證自動部署。

使用者明確選擇 production-first。這比先跑 Emulator 的策略更快，但會接觸真實 Firebase Auth、Firestore、Cloud Tasks、Cloud Run 與 Firebase Hosting，因此測試資料、停止條件與 rollback 範圍必須明確限制。

## 2. 成功條件

本次 UAT 成功必須同時滿足：

1. 目前瀏覽器登入且已開通 learning access 的帳號可以進入 `/learn`。
2. Reviewed source 能從瀏覽器提交，經 production ingestion 完成並形成可練習知識。
3. 支援式作答、直接看答案、跳過、回饋、回合結束與知識證據符合低壓學習規則。
4. 知識與 evidence 重新整理後仍存在，排除出題不會刪除來源或證據。
5. 未經 review 的英文仍被收錄，但不會被錯誤包裝成可靠題目。
6. Mobile 與 desktop 沒有阻斷性 responsive 或鍵盤操作問題。
7. 全程沒有 XP、連勝、到期、欠題、排行榜、永久精通或不實延遲能力宣稱。
8. 若發現 bug，修復必須有能先失敗後通過的自動測試、完整本地驗證、通過 CI 的 PR、成功 merge 與部署後重驗。

若 production UAT 未發現 bug，工作以 UAT 證據與結果報告結束，不建立空修復 PR，也不觸發無意義的重複部署。

## 3. 範圍與非目標

### 3.1 本次範圍

- Production Firebase 登入與 UID canary gate。
- `/learn`、`/learn/sources/new`、`/learn/sources/:sourceId`、`/learn/round`、`/learn/knowledge`。
- Reviewed seed expression 的 production ingestion、練習與 evidence。
- 無 reviewed expression 的中性空狀態。
- 瀏覽器可觀察到的請求結果、狀態轉移、重新整理持久性、responsive 與鍵盤操作。
- 發現缺陷後的程式修復、測試、review、PR、merge、部署與 production 重驗。

### 3.2 非目標

- 不為 UAT 建立第二個 production 真實帳號。
- 不從瀏覽器讀取 cookie、local storage、密碼、token 或瀏覽器 profile。
- 不以 production 人工測試取代既有 owner isolation、Firestore rules、惡意 API 輸入與 Emulator E2E。
- 不擴大 canary access，也不執行 broad rollout。
- 不刪除既有私人來源、attempt、knowledge 或 evidence。
- 不在本次修復中重構與 UAT 根因無關的程式。

## 4. 執行架構與安全邊界

### 4.1 Production-first 流程

1. 以瀏覽器開啟 `https://wippy-mvp.web.app/learn`。
2. 若要求登入，暫停並請使用者在所選瀏覽器完成登入；不改用搜尋、另一網站或讀取憑證繞過驗證。
3. 若登入後被導回 `/groups`，將其判定為 canary access 未啟用或 access API 失敗，停止新增資料並保存證據。
4. 依第 6 節順序執行 P0，再執行 P1。
5. 可恢復錯誤只在 UI 中重試一次；第二次仍失敗便停止擴大 production 寫入。
6. 有 bug 時進入第 8 節的隔離修復流程；沒有 bug 時直接產出 UAT 報告。

### 4.2 Test data

所有 production 測試來源標題使用：

```text
UAT-20260812-<HHmmss>-<case>
```

其中 `<case>` 只使用 `reviewed-seed` 或 `unreviewed-source`。標題讓資料可追溯；時間採 Asia/Taipei。Learning API 目前沒有來源刪除能力，因此測試資料預期保留在該使用者的私人知識庫，不以直接修改 Firestore 的方式清除。

Reviewed source 內容固定為：

```text
Before building it, run the idea by a few users. Later, run the company with care.
```

Unreviewed source 內容固定為：

```text
Curious makers carefully listen before choosing.
```

### 4.3 立即停止條件

遇到以下任一狀況，不再新增 production 測試資料：

- 無法登入或登入狀態不屬於使用者允許的目前帳號。
- `/learn` 持續被導向 `/groups`。
- 任一學習 API 回傳未預期的 `5xx`。
- Reviewed source 在提交後 120 秒仍未完成 ingestion，且 UI 重試一次仍失敗。
- 畫面出現其他使用者的來源、knowledge 或 evidence。
- 重複提交、重試或重新整理造成不可控制的資料倍增。
- 操作可能修改全域 scheduler、queue、Firestore rules 或其他使用者 access。

## 5. Production 資料流

```text
Browser
  -> Firebase Hosting SPA
  -> same-origin /api/learning/* rewrite
  -> Cloud Run learning API
  -> Firestore source + ingestion run
  -> Cloud Tasks OIDC worker
  -> Firestore segments/items/occurrences/facet states
  -> reader polling
  -> round/challenge/attempt APIs
  -> knowledge + evidence UI
```

UAT 必須從瀏覽器觀察每個使用者可見狀態與對應 HTTP 結果。不能以 Emulator 成功推定 production queue、worker route 或環境設定正確。

## 6. UAT 測試矩陣

### 6.1 P0：登入、權限與導覽

步驟：

1. 開啟 `/learn`。
2. 確認頁面不是登入錯誤、`/groups` redirect 或無限 loading。
3. 確認「首頁／來源／來一輪／知識庫」導覽可見且可操作。

通過條件：已登入且 access-enabled 的帳號能穩定進入 learning shell。

### 6.2 P0：Reviewed source 與 production ingestion

步驟：

1. 建立 `reviewed-seed` UAT 來源。
2. 提交後觀察 reader 與 ingestion 狀態。
3. 等待最多 120 秒；若顯示可恢復錯誤，只按 UI retry 一次。
4. 重新整理 reader。

通過條件：來源與原文存在、ingestion 完成、可練習 CTA 出現，且重新整理後狀態不倒退或遺失。

### 6.3 P0：支援式改答與 evidence

步驟：

1. 進入來源限定回合。
2. 暫選第一個答案。
3. 要求一層提示，確認第一次選擇未被清除或自動提交。
4. 改選另一答案並確認。
5. 檢查語言證據與錯誤選項說明。

通過條件：提示後的正確答案不被宣稱為無提示能力或延遲記憶；回饋說明 decisive language evidence，而非只有對錯。

### 6.4 P0：直接看答案、跳過與回合結束

步驟：

1. 在後續 challenge 使用「直接看答案與證據」。
2. 若還有 challenge，使用「跳過」。
3. 完成回合並查看結果。

通過條件：兩個操作都不要求先猜、不以紅色失敗或懲罰呈現、不增加獨立能力宣稱、不形成欠題；結果只陳述實際 evidence。

### 6.5 P0：Knowledge、排除與持久性

步驟：

1. 開啟知識庫並找到 `run something by someone` 與 `run`。
2. 確認 meaning、chunk、syntax、pragmatics 分面分開呈現，沒有證據時顯示「尚無證據」。
3. 重新整理並確認資料仍在。
4. 將 reviewed item 設為「不要再出題」。
5. 建立新回合，確認該 item 不再入選，但知識卡仍存在。
6. 解除排除，確認卡片不再顯示排除，且 item 恢復為可出題候選；不要求排序器在單一回合中必然選中。

通過條件：排除只影響 scheduling，不刪除來源、occurrence、attempt 或 evidence。

### 6.6 P1：無 reviewed expression 的中性空狀態

步驟：

1. 建立 `unreviewed-source` UAT 來源。
2. 等待 ingestion 完成。
3. 檢查 reader 與 knowledge。

通過條件：所有 words 仍被收錄；reader 清楚表示沒有足夠可靠的可出題項目；不顯示誤導的練習 CTA。

### 6.7 P1：低壓文案、responsive 與鍵盤

檢查 mobile `390 × 844` 與 desktop viewport：

- 無水平溢出或遮蔽主要 action。
- 核心回合可只用鍵盤完成。
- focus 在 feedback 與下一題間有可辨識轉移。
- 沒有 `複習`、`到期`、`XP`、`連勝`、`排行榜`、`欠題`、`未完成`、`已學會`、`精通` 或錯誤的 delayed mastery 宣稱。

## 7. 證據與缺陷分級

每個失敗記錄：

- production URL 與頁面路徑；
- Asia/Taipei 時間；
- UAT source title；
- viewport；
- 使用者可見畫面；
- 相關 HTTP method、path、status；
- 最短重現步驟；
- 重新整理與一次 UI retry 的結果；
- 預期與實際行為。

分級：

- `P0`：核心旅程阻斷、資料越權、資料遺失、不可恢復 ingestion、未預期 `5xx` 或不實能力證據。
- `P1`：可完成但有錯誤狀態、排除失效、持久性問題、鍵盤阻斷、mobile layout 阻斷或高風險誤導文案。
- `P2`：不影響核心完成與資料正確性的輕微視覺或文案瑕疵；仍記錄，但不為了 P2 擴大本次 production 變更範圍。

## 8. Bug 修復與隔離 worktree

### 8.1 建立方式

只有出現可重現 bug 才建立修復 worktree。基準必須先更新到最新 `origin/main`，工作目錄位於：

```text
C:\Users\willy\Desktop\Side Project- WiPPY\WiPPY-worktrees\learning-uat-fix-<slug>
```

分支名稱：

```text
codex/fix/learning-uat-<slug>
```

同一 UAT session 中由同一根因造成的失敗放在同一分支；不同根因以獨立 commit 隔離。若多個根因會修改同一資料流，先以最上游根因修復並重跑 UAT，再判斷下游症狀是否仍存在。

### 8.2 修復紀律

1. 先以系統化除錯確認 production failure、程式路徑與根因。
2. 新增能穩定重現的最小測試，先確認測試因正確原因失敗。
3. 實作最小修復。
4. 確認目標測試通過，並執行相關回歸測試。
5. 不降低 assertion、不延長 timeout 來掩蓋 race、不吞掉錯誤、不輸出秘密、不繞過 UID ownership。
6. 不順帶重構 unrelated WiPPY 功能。

目前已知但尚未由 production 證實的疑點：

- `createInternalLearningRouter()` 定義 worker endpoints，但 production `app.ts` 可能未掛載對應 router。
- Learning infrastructure 文件中的環境變數名稱與 `container.ts` 實際讀取名稱不一致。
- Production deploy workflow 沒有顯式設定 learning queue 相關環境變數，可能依賴 Cloud Run 既有手動設定。

這些疑點只作調查起點；修復必須由 production 證據與測試支持。

## 9. 驗證、Review 與 PR Gate

每個修復至少執行：

1. 直接覆蓋根因的 backend 或 frontend 目標測試。
2. Backend build 與完整 Jest。
3. Learning Firestore emulator tests。
4. Frontend lint、build 與完整 Vitest。
5. Learning Playwright Emulator E2E。
6. Backend Docker image 與 `/health` readiness。

自我 review 必須檢查：

- UID ownership、private cache headers 與資料隔離沒有退化。
- Cloud Tasks OIDC audience、service URL 與 route mount 一致。
- 重試與 idempotency 不會複製 source、run、item、occurrence 或 attempt。
- 測試確實覆蓋 production 根因，而非只測 mock。
- diff 沒有秘密、debug endpoint、測試後門或無關變更。
- 文件中的實際環境變數名稱與程式一致。

PR 只有在所有 GitHub CI jobs 通過後才可 squash merge，包含 backend、backend container、frontend 與 learning emulator E2E。任何 required check 或 learning E2E 失敗都不得 merge。

## 10. 部署與部署後驗證

Merge 至 `main` 後由 `Deploy Production` workflow 自動部署 Cloud Run、Firebase Hosting、Firestore rules 與 indexes。部署完成後必須：

1. 確認 workflow 成功。
2. 確認 Cloud Run `/health` 成功且服務 revision healthy。
3. 確認 Firebase Hosting 可回應。
4. 用瀏覽器重跑原本失敗的 production 案例。
5. 重跑 reviewed source 的核心 happy path，確認修復未破壞登入、ingestion、round 與 knowledge。

若 production UAT 沒有發現 bug，以上 merge 與部署步驟不執行，因為 PR #37 已在 `main` 且 production 已有目標功能。

## 11. Rollback

部署後仍有 P0 時，允許的自動 rollback 僅限撤銷本次測試 UID 的 learning access；既有 learning 資料必須保留。若無法安全取得 UID，就停止並請使用者提供 UID 或自行撤銷 access。

以下操作需要再次取得使用者明確核准：

- 暫停 production reconcile scheduler；
- 修改 Cloud Tasks queue；
- 回退 Cloud Run revision 或 Firebase Hosting release；
- 修改其他使用者 access；
- 刪除任何 `learning*` collection 或文件。

## 12. 最終交付

最終回報包含：

- 已執行的 UAT cases 與逐項結果；
- production 測試資料標題；
- 發現缺陷、根因與修復摘要；
- 新增或修改的自動測試；
- 本地驗證命令與結果；
- PR、CI、merge commit 與 deployment run；
- 部署後 Cloud Run、Firebase Hosting 與瀏覽器 smoke 結果；
- 未解風險與未執行的高風險全域操作。
