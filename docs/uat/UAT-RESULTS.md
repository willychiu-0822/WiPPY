# 安裝路徑 UAT 結果

時間：2026-11-11 21:20（Asia/Taipei）。72/72 PASS。

真實 WiPPY + Auth/Firestore emulator，外部 LINE/Routine mock；Chrome 桌面 1280×800／手機 390×844。每次執行覆寫本表，完整驗收需 24 個案例 × 3 projects = 72 次且都有本次截圖；ready 僅表示可做本機瀏覽器 UAT。

完整回歸後，另在桌面及手機探索建立零額度 Grok：重整後額度仍為 0，管理 API 資料一致，key 可驗證且畫面無水平溢出（[桌面](evidence/exploration-zero-limit-desktop.png)、[手機](evidence/exploration-zero-limit-mobile.png)）。零額度禁止發送已由 UAT-05 驗證；本次未發現新缺陷。

| 案例 | 環境 | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-24 | desktop | PASS | — | [截圖](evidence/UAT-24-desktop.png) |
| UAT-23 | desktop | PASS | — | [截圖](evidence/UAT-23-desktop.png) |
| UAT-22 | desktop | PASS | — | [截圖](evidence/UAT-22-desktop.png) |
| UAT-21 | desktop | PASS | — | [截圖](evidence/UAT-21-desktop.png) |
| UAT-20 | desktop | PASS | — | [截圖](evidence/UAT-20-desktop.png) |
| UAT-01 | desktop | PASS | — | [截圖](evidence/UAT-01-desktop.png) |
| UAT-02 | desktop | PASS | — | [截圖](evidence/UAT-02-desktop.png) |
| UAT-03 | desktop | PASS | — | [截圖](evidence/UAT-03-desktop.png) |
| UAT-04 | desktop | PASS | — | [截圖](evidence/UAT-04-desktop.png) |
| UAT-05 | desktop | PASS | — | [截圖](evidence/UAT-05-desktop.png) |
| UAT-06 | desktop | PASS | — | [截圖](evidence/UAT-06-desktop.png) |
| UAT-07 | desktop | PASS | — | [截圖](evidence/UAT-07-desktop.png) |
| UAT-08 | desktop | PASS | — | [截圖](evidence/UAT-08-desktop.png) |
| UAT-11 | desktop | PASS | — | [截圖](evidence/UAT-11-desktop.png) |
| UAT-09 | desktop | PASS | — | [截圖](evidence/UAT-09-desktop.png) |
| UAT-10 | desktop | PASS | — | [截圖](evidence/UAT-10-desktop.png) |
| UAT-12 | desktop | PASS | — | [截圖](evidence/UAT-12-desktop.png) |
| UAT-13 | desktop | PASS | — | [截圖](evidence/UAT-13-desktop.png) |
| UAT-14 | desktop | PASS | — | [截圖](evidence/UAT-14-desktop.png) |
| UAT-15 | desktop | PASS | — | [截圖](evidence/UAT-15-desktop.png) |
| UAT-16 | desktop | PASS | — | [截圖](evidence/UAT-16-desktop.png) |
| UAT-17 | desktop | PASS | — | [截圖](evidence/UAT-17-desktop.png) |
| UAT-18 | desktop | PASS | — | [截圖](evidence/UAT-18-desktop.png) |
| UAT-19 | desktop | PASS | — | [截圖](evidence/UAT-19-desktop.png) |
| UAT-24 | mobile | PASS | — | [截圖](evidence/UAT-24-mobile.png) |
| UAT-23 | mobile | PASS | — | [截圖](evidence/UAT-23-mobile.png) |
| UAT-22 | mobile | PASS | — | [截圖](evidence/UAT-22-mobile.png) |
| UAT-21 | mobile | PASS | — | [截圖](evidence/UAT-21-mobile.png) |
| UAT-20 | mobile | PASS | — | [截圖](evidence/UAT-20-mobile.png) |
| UAT-01 | mobile | PASS | — | [截圖](evidence/UAT-01-mobile.png) |
| UAT-02 | mobile | PASS | — | [截圖](evidence/UAT-02-mobile.png) |
| UAT-03 | mobile | PASS | — | [截圖](evidence/UAT-03-mobile.png) |
| UAT-04 | mobile | PASS | — | [截圖](evidence/UAT-04-mobile.png) |
| UAT-05 | mobile | PASS | — | [截圖](evidence/UAT-05-mobile.png) |
| UAT-06 | mobile | PASS | — | [截圖](evidence/UAT-06-mobile.png) |
| UAT-07 | mobile | PASS | — | [截圖](evidence/UAT-07-mobile.png) |
| UAT-08 | mobile | PASS | — | [截圖](evidence/UAT-08-mobile.png) |
| UAT-11 | mobile | PASS | — | [截圖](evidence/UAT-11-mobile.png) |
| UAT-09 | mobile | PASS | — | [截圖](evidence/UAT-09-mobile.png) |
| UAT-10 | mobile | PASS | — | [截圖](evidence/UAT-10-mobile.png) |
| UAT-12 | mobile | PASS | — | [截圖](evidence/UAT-12-mobile.png) |
| UAT-13 | mobile | PASS | — | [截圖](evidence/UAT-13-mobile.png) |
| UAT-14 | mobile | PASS | — | [截圖](evidence/UAT-14-mobile.png) |
| UAT-15 | mobile | PASS | — | [截圖](evidence/UAT-15-mobile.png) |
| UAT-16 | mobile | PASS | — | [截圖](evidence/UAT-16-mobile.png) |
| UAT-17 | mobile | PASS | — | [截圖](evidence/UAT-17-mobile.png) |
| UAT-18 | mobile | PASS | — | [截圖](evidence/UAT-18-mobile.png) |
| UAT-19 | mobile | PASS | — | [截圖](evidence/UAT-19-mobile.png) |
| UAT-24 | api | PASS | — | [截圖](evidence/UAT-24-api.png) |
| UAT-23 | api | PASS | — | [截圖](evidence/UAT-23-api.png) |
| UAT-22 | api | PASS | — | [截圖](evidence/UAT-22-api.png) |
| UAT-21 | api | PASS | — | [截圖](evidence/UAT-21-api.png) |
| UAT-20 | api | PASS | — | [截圖](evidence/UAT-20-api.png) |
| UAT-01 | api | PASS | — | [截圖](evidence/UAT-01-api.png) |
| UAT-02 | api | PASS | — | [截圖](evidence/UAT-02-api.png) |
| UAT-03 | api | PASS | — | [截圖](evidence/UAT-03-api.png) |
| UAT-04 | api | PASS | — | [截圖](evidence/UAT-04-api.png) |
| UAT-05 | api | PASS | — | [截圖](evidence/UAT-05-api.png) |
| UAT-06 | api | PASS | — | [截圖](evidence/UAT-06-api.png) |
| UAT-07 | api | PASS | — | [截圖](evidence/UAT-07-api.png) |
| UAT-08 | api | PASS | — | [截圖](evidence/UAT-08-api.png) |
| UAT-11 | api | PASS | — | [截圖](evidence/UAT-11-api.png) |
| UAT-09 | api | PASS | — | [截圖](evidence/UAT-09-api.png) |
| UAT-10 | api | PASS | — | [截圖](evidence/UAT-10-api.png) |
| UAT-12 | api | PASS | — | [截圖](evidence/UAT-12-api.png) |
| UAT-13 | api | PASS | — | [截圖](evidence/UAT-13-api.png) |
| UAT-14 | api | PASS | — | [截圖](evidence/UAT-14-api.png) |
| UAT-15 | api | PASS | — | [截圖](evidence/UAT-15-api.png) |
| UAT-16 | api | PASS | — | [截圖](evidence/UAT-16-api.png) |
| UAT-17 | api | PASS | — | [截圖](evidence/UAT-17-api.png) |
| UAT-18 | api | PASS | — | [截圖](evidence/UAT-18-api.png) |
| UAT-19 | api | PASS | — | [截圖](evidence/UAT-19-api.png) |
