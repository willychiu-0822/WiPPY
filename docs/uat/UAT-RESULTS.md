# WiPPY UAT 執行結果

最新結果：**64/64 pass，ready_for_user_test=true（本機 emulator/mock）**。第八輪結果與增量提交清單見文末。

每次執行保留紀錄；pass 只代表 emulator/mock 範圍。案例與正式環境限制見 [計畫](UAT-PLAN.md)。

## 2026-11-09 23:37 ～ 2026-11-09 23:37（台北）

批次：`2026-11-09T15-37-21-604Z`。0 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |


## 2026-11-09 23:37 ～ 2026-11-09 23:39（台北）

批次：`2026-11-09T15-37-47-928Z`。14 pass / 10 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/desktop/UAT-01.png) |
| UAT-02 | desktop | fail | Error: locator.check: Clicking the checkbox did not change its state Call log:   - waiting for getByRole('checkbox', { name: 'UAT 工作坊' })     - locator resolved to <input type="checkbox"/>   - attempting click action     2 × waiting for element to be visible, enabled and stable | [截圖](evidence/2026-11-09T15-37-47-928Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/desktop/UAT-08.png) |
| UAT-09 | desktop | fail | Error: expect(locator).toBeVisible() failed Locator: getByText(/本機模擬：LINE 暫時無法發送/) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-37-47-928Z/desktop/UAT-09.png) |
| UAT-10 | desktop | fail | Error: expect(locator).toBeVisible() failed Locator: getByRole('heading', { name: 'LIFF 本機檢查' }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-37-47-928Z/desktop/UAT-10.png) |
| UAT-11 | desktop | fail | Error: expect(received).toBe(expected) // Object.is equality Expected: 404 Received: 200 | [截圖](evidence/2026-11-09T15-37-47-928Z/desktop/UAT-11.png) |
| UAT-12 | desktop | fail | Error: expect(locator).toBeVisible() failed Locator: getByText(/請至少選擇一個目標群組/) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-37-47-928Z/desktop/UAT-12.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/mobile/UAT-01.png) |
| UAT-02 | mobile | fail | Error: locator.check: Clicking the checkbox did not change its state Call log:   - waiting for getByRole('checkbox', { name: 'UAT 工作坊' })     - locator resolved to <input type="checkbox"/>   - attempting click action     2 × waiting for element to be visible, enabled and stable | [截圖](evidence/2026-11-09T15-37-47-928Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T15-37-47-928Z/mobile/UAT-08.png) |
| UAT-09 | mobile | fail | Error: expect(locator).toBeVisible() failed Locator: getByText(/本機模擬：LINE 暫時無法發送/) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-37-47-928Z/mobile/UAT-09.png) |
| UAT-10 | mobile | fail | Error: expect(locator).toBeVisible() failed Locator: getByRole('heading', { name: 'LIFF 本機檢查' }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-37-47-928Z/mobile/UAT-10.png) |
| UAT-11 | mobile | fail | Error: expect(received).toBe(expected) // Object.is equality Expected: 404 Received: 200 | [截圖](evidence/2026-11-09T15-37-47-928Z/mobile/UAT-11.png) |
| UAT-12 | mobile | fail | Error: expect(locator).toBeVisible() failed Locator: getByText(/請至少選擇一個目標群組/) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-37-47-928Z/mobile/UAT-12.png) |

## 2026-11-09 23:40 ～ 2026-11-09 23:40（台北）

批次：`2026-11-09T15-40-42-441Z`。0 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |


## 2026-11-09 23:41 ～ 2026-11-09 23:41（台北）

批次：`2026-11-09T15-41-41-798Z`。0 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |


## 2026-11-09 23:41 ～ 2026-11-09 23:42（台北）

批次：`2026-11-09T15-41-10-978Z`。5 pass / 3 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T15-41-10-978Z/desktop/UAT-02.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T15-41-10-978Z/desktop/UAT-09.png) |
| UAT-10 | desktop | fail | Error: expect(locator).toContainText(expected) failed Locator: getByRole('status') Expected pattern: /sent/shared/cancelled/ Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-41-10-978Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T15-41-10-978Z/desktop/UAT-11.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T15-41-10-978Z/mobile/UAT-02.png) |
| UAT-09 | mobile | fail | Error: browserContext.close: ENOENT: no such file or directory, open '/workspace/codex-burn/uat-wippy/frontend/test-results/.playwright-artifacts-2/traces/1a03e548f9e0bb01674e-3d906bee34574feb7c65-recording2.network' | [截圖](evidence/2026-11-09T15-41-10-978Z/mobile/UAT-09.png) |
| UAT-10 | mobile | fail | Error: expect(locator).toContainText(expected) failed Locator: getByRole('status') Expected pattern: /sent/shared/cancelled/ Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-41-10-978Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T15-41-10-978Z/mobile/UAT-11.png) |

## 2026-11-09 23:43 ～ 2026-11-09 23:43（台北）

批次：`2026-11-09T15-43-21-920Z`。0 pass / 0 fail / 24 blocked；可試用：false。 啟動／執行錯誤：Error: http://127.0.0.1:4121 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |


## 2026-11-09 23:43 ～ 2026-11-09 23:44（台北）

批次：`2026-11-09T15-43-39-035Z`。24 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/desktop/UAT-12.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T15-43-39-035Z/mobile/UAT-12.png) |

## 2026-11-09 23:45 新手探索（手機 Chrome）

原 24 次全通過後，從新帳號實際操作「第一次辦活動」，發現三個額外問題：切換分頁後對話消失；更換活動群組未同步待發訊息；貼入一小時後的 UTC 時間卻立即發送。新增 UAT-13～15，各兩 viewport，目前不可交付試用。

證據：[探索截圖](evidence/exploration-2026-11-09T15-45-29-493Z/novice-mobile.png)、[觀察結果](evidence/exploration-2026-11-09T15-45-29-493Z/findings.json)。

## 2026-11-09 23:47 ～ 2026-11-09 23:48（台北）

批次：`2026-11-09T15-47-13-062Z`。0 pass / 6 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-13 | desktop | fail | Error: expect(locator).toBeVisible() failed Locator: getByText('第一次辦活動，請問有什麼建議？', { exact: true }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-47-13-062Z/desktop/UAT-13.png) |
| UAT-14 | desktop | fail | Error: expect(locator).toBeVisible() failed Locator: getByText('修改中 — 待發訊息已暫停', { exact: true }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-47-13-062Z/desktop/UAT-14.png) |
| UAT-15 | desktop | fail | Error: expect(received).toHaveLength(expected) Expected length: 0 Received length: 1 Received array:  [{"activityId": "sO6YQx2UW1ibEQNXOeqK", "activityMessageId": "xFNgiTmvnRkryljkjcZL", "content": "一小時後才發送", "errorMessage": null, "groupId": "C99f8d4b55d7a79ca1a4c2f710c1f48e3", "id": "ogJZVILxHBUgmqCRFRTq", "lineMessageId": "mock-1794239265272", "sentAt": {"_nanoseconds": 272000000, "_seconds": 1794239265}, "status": "success", "triggerType": "scheduled", "userId": "LRbHmzJYoQgaB2xb5FwTlOS2XurY"}] | [截圖](evidence/2026-11-09T15-47-13-062Z/desktop/UAT-15.png) |
| UAT-13 | mobile | fail | Error: expect(locator).toBeVisible() failed Locator: getByText('第一次辦活動，請問有什麼建議？', { exact: true }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-47-13-062Z/mobile/UAT-13.png) |
| UAT-14 | mobile | fail | Error: expect(locator).toBeVisible() failed Locator: getByText('修改中 — 待發訊息已暫停', { exact: true }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-47-13-062Z/mobile/UAT-14.png) |
| UAT-15 | mobile | fail | Error: expect(received).toHaveLength(expected) Expected length: 0 Received length: 1 Received array:  [{"activityId": "F43EbRC5qmgMaep28v3D", "activityMessageId": "DQDDlOPA9xFqYNDeQ22x", "content": "一小時後才發送", "errorMessage": null, "groupId": "C2d4f995d55a6319e0a69cbdbe74da997", "id": "Uvmhhk2fFutg5g6mcvSs", "lineMessageId": "mock-1794239297049", "sentAt": {"_nanoseconds": 49000000, "_seconds": 1794239297}, "status": "success", "triggerType": "scheduled", "userId": "Ids4H7nLouVjHluxW3G7EkQb73xu"}] | [截圖](evidence/2026-11-09T15-47-13-062Z/mobile/UAT-15.png) |

## 2026-11-09 23:49 ～ 2026-11-09 23:49（台北）

批次：`2026-11-09T15-49-23-999Z`。6 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T15-49-23-999Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T15-49-23-999Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T15-49-23-999Z/desktop/UAT-15.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T15-49-23-999Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T15-49-23-999Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T15-49-23-999Z/mobile/UAT-15.png) |

## 2026-11-09 23:50 ～ 2026-11-09 23:52（台北）

批次：`2026-11-09T15-50-38-733Z`。30 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/desktop/UAT-15.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T15-50-38-733Z/mobile/UAT-15.png) |

## 2026-11-09 23:53 ～ 2026-11-09 23:54（台北）

批次：`2026-11-09T15-53-25-097Z`。0 pass / 4 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-11 | desktop | fail | Error: expect(received).toEqual(expected) // deep equality - Expected  - 2 + Received  + 2   Object { -   "message": "permission-denied", -   "ownership": "permission-denied", | [截圖](evidence/2026-11-09T15-53-25-097Z/desktop/UAT-11.png) |
| UAT-14 | desktop | fail | Error: expect(locator).toBeVisible() failed Locator: getByText(/訊息正在發送，請稍後再修改群組/) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-53-25-097Z/desktop/UAT-14.png) |
| UAT-11 | mobile | fail | Error: expect(received).toEqual(expected) // deep equality - Expected  - 2 + Received  + 2   Object { -   "message": "permission-denied", -   "ownership": "permission-denied", | [截圖](evidence/2026-11-09T15-53-25-097Z/mobile/UAT-11.png) |
| UAT-14 | mobile | fail | Error: expect(locator).toBeVisible() failed Locator: getByText(/訊息正在發送，請稍後再修改群組/) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-53-25-097Z/mobile/UAT-14.png) |

## 2026-11-09 23:54 ～ 2026-11-09 23:55（台北）

批次：`2026-11-09T15-54-30-251Z`。5 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T15-54-30-251Z/desktop/UAT-11.png) |
| UAT-12 | desktop | fail | Error: expect(locator).toBeVisible() failed Locator: getByText(/請先建立推播訊息/) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T15-54-30-251Z/desktop/UAT-12.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T15-54-30-251Z/desktop/UAT-14.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T15-54-30-251Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T15-54-30-251Z/mobile/UAT-12.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T15-54-30-251Z/mobile/UAT-14.png) |

## 2026-11-09 23:55 ～ 2026-11-09 23:57（台北）

批次：`2026-11-09T15-55-47-552Z`。30 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/desktop/UAT-15.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T15-55-47-552Z/mobile/UAT-15.png) |

## 最終驗證與交付（2026-11-09 23:57 台北）

- `npm run test:e2e`：15 個旅程、桌面 1280×800 與手機 390×844，共 30/30 pass；每案例均有截圖，最後批次為 `2026-11-09T15-55-47-552Z`。
- `npm --prefix backend test -- --runInBand`：185/185 pass；`npm --prefix frontend test`：81/81 pass；`npm run test:uat-tools`：5/5 pass。
- `npm --prefix backend run build`、`npm --prefix frontend run build`、`npm --prefix frontend run lint`、`git diff --check`：通過。Vite 仍有既有主 bundle 大於 500 kB 的建置提示。
- 已完成手機新手探索、補案例及唯讀程式審查；修復細節與提交障礙見 [FIXES.md](FIXES.md)。
- 本機可試用。LINE presets：default、no_group、share_unavailable 全通過；真實 LINE App、LINE API Status、LINE Developers Console 均未驗證，也未進行 HTTPS／雲端部署。
- 自動測試會停止自己啟動的所有服務；產品負責人可在根目錄 `npm run uat:start` 後開 `http://127.0.0.1:4121`，使用自選測試帳號。

## 2026-11-09 23:59 ～ 2026-11-10 00:00（台北）

批次：`2026-11-09T15-59-23-686Z`。30 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/desktop/UAT-15.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T15-59-23-686Z/mobile/UAT-15.png) |

## 2026-11-10 00:02 ～ 2026-11-10 00:03（台北）

批次：`2026-11-09T16-02-14-276Z`。0 pass / 4 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-16 | desktop | fail | Error: expect(locator).toBeDisabled() failed Locator:  getByRole('button', { name: '儲存', exact: true }) Expected: disabled Received: enabled Timeout:  10000ms Call log: | [截圖](evidence/2026-11-09T16-02-14-276Z/desktop/UAT-16.png) |
| UAT-17 | desktop | fail | Error: expect(locator).toContainText(expected) failed Locator: getByRole('alert') Expected substring: "新增失敗" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T16-02-14-276Z/desktop/UAT-17.png) |
| UAT-16 | mobile | fail | Error: expect(locator).toBeDisabled() failed Locator:  getByRole('button', { name: '儲存', exact: true }) Expected: disabled Received: enabled Timeout:  10000ms Call log: | [截圖](evidence/2026-11-09T16-02-14-276Z/mobile/UAT-16.png) |
| UAT-17 | mobile | fail | Error: expect(locator).toContainText(expected) failed Locator: getByRole('alert') Expected substring: "新增失敗" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T16-02-14-276Z/mobile/UAT-17.png) |

## 2026-11-10 00:03 ～ 2026-11-10 00:03（台北）

批次：`2026-11-09T16-03-37-462Z`。2 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-09T16-03-37-462Z/desktop/UAT-16.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-09T16-03-37-462Z/mobile/UAT-16.png) |

## 2026-11-10 00:05 ～ 2026-11-10 00:05（台北）

批次：`2026-11-09T16-05-03-406Z`。0 pass / 4 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-17 | desktop | fail | Error: expect(locator).toContainText(expected) failed Locator: getByRole('alert') Expected substring: "無法載入發送紀錄" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T16-05-03-406Z/desktop/UAT-17.png) |
| UAT-18 | desktop | fail | Error: expect(locator).toBeEnabled() failed Locator: getByRole('button', { name: '建立', exact: true }) Expected: enabled Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T16-05-03-406Z/desktop/UAT-18.png) |
| UAT-17 | mobile | fail | Error: expect(locator).toContainText(expected) failed Locator: getByRole('alert') Expected substring: "無法載入發送紀錄" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T16-05-03-406Z/mobile/UAT-17.png) |
| UAT-18 | mobile | fail | Error: expect(locator).toBeEnabled() failed Locator: getByRole('button', { name: '建立', exact: true }) Expected: enabled Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T16-05-03-406Z/mobile/UAT-18.png) |

## 2026-11-10 00:06 ～ 2026-11-10 00:06（台北）

批次：`2026-11-09T16-06-40-522Z`。2 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-09T16-06-40-522Z/desktop/UAT-17.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-09T16-06-40-522Z/mobile/UAT-17.png) |

## 2026-11-10 00:07 ～ 2026-11-10 00:07（台北）

批次：`2026-11-09T16-07-42-681Z`。2 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-09T16-07-42-681Z/desktop/UAT-18.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-09T16-07-42-681Z/mobile/UAT-18.png) |

## 2026-11-10 00:08 ～ 2026-11-10 00:10（台北）

批次：`2026-11-09T16-08-18-557Z`。36 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/desktop/UAT-18.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-09T16-08-18-557Z/mobile/UAT-18.png) |

## 2026-11-10 00:11（台北）完整回歸後新手探索

手機 390×844 系統 Chrome，沿用真實 emulator 與 mock provider；pass。既有 UAT-02/03/04/05/08/13 的交叉旅程，未攔截 API，檢查頁面無水平溢出與未處理例外。

- 取消建立可返回；第二群組建立活動，新增禁止事項知識：[截圖](evidence/exploration-2026-11-09T16-11-10-281Z/01.png)
- 由一般對話進入「討論好了，確認排程」可建立三則待審訊息：[截圖](evidence/exploration-2026-11-09T16-11-10-281Z/02.png)
- 核准、要求修改第三則、重新核准、重整仍保存且鎖定：[截圖](evidence/exploration-2026-11-09T16-11-10-281Z/03.png)
- 取消廣播預覽不發送；未到期排程亦沒有發送記錄：[截圖](evidence/exploration-2026-11-09T16-11-10-281Z/04.png)

[探索紀錄](evidence/exploration-2026-11-09T16-11-10-281Z/findings.json)。 未發現新缺陷。

## 2026-11-10 02:13 ～ 2026-11-10 02:22（台北）

批次：`2026-11-09T18-13-34-762Z`。35 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-05.png) |
| UAT-06 | desktop | fail | Test timeout of 45000ms exceeded while running "afterEach" hook. | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/desktop/UAT-18.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-09T18-13-34-762Z/mobile/UAT-18.png) |

## 2026-11-10 02:28 ～ 2026-11-10 02:28（台北）

批次：`2026-11-09T18-28-20-594Z`。0 pass / 0 fail / 42 blocked；可試用：false。 啟動／執行錯誤：Error: Timed out waiting 180000ms from config.webServer.

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |


## 2026-11-10 02:29 ～ 2026-11-10 02:40（台北）

批次：`2026-11-09T18-29-03-047Z`。0 pass / 6 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-19 | desktop | fail | Error: expect(locator).toHaveAttribute(expected) failed Locator: getByLabel('發送日期與時間') Expected: "datetime-local" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T18-29-03-047Z/desktop/UAT-19.png) |
| UAT-20 | desktop | fail | Error: expect(locator).toHaveCount(expected) failed Locator:  getByRole('button', { name: '核准企畫', exact: true }) Expected: 0 Received: 1 Timeout:  10000ms Call log: | [截圖](evidence/2026-11-09T18-29-03-047Z/desktop/UAT-20.png) |
| UAT-21 | desktop | fail | Error: expect(locator).toBeVisible() failed Locator: getByRole('heading', { name: '連結 LINE 群組', exact: true }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T18-29-03-047Z/desktop/UAT-21.png) |
| UAT-19 | mobile | fail | Error: expect(locator).toHaveAttribute(expected) failed Locator: getByLabel('發送日期與時間') Expected: "datetime-local" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T18-29-03-047Z/mobile/UAT-19.png) |
| UAT-20 | mobile | fail | Error: expect(locator).toHaveCount(expected) failed Locator:  getByRole('button', { name: '核准企畫', exact: true }) Expected: 0 Received: 1 Timeout:  10000ms Call log: | [截圖](evidence/2026-11-09T18-29-03-047Z/mobile/UAT-20.png) |
| UAT-21 | mobile | fail | Error: expect(locator).toBeVisible() failed Locator: getByRole('heading', { name: '連結 LINE 群組', exact: true }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T18-29-03-047Z/mobile/UAT-21.png) |

## 2026-11-10 03:09 ～ 2026-11-10 03:23（台北）

批次：`2026-11-09T19-09-50-781Z`。6 pass / 2 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T19-09-50-781Z/desktop/UAT-12.png) |
| UAT-19 | desktop | fail | Error: expect(locator).toHaveValue(expected) failed Locator:  getByLabel('發送日期與時間') Expected: "2035-11-12T18:30:00" Received: "2035-11-12T18:30" Timeout:  10000ms Call log: | [截圖](evidence/2026-11-09T19-09-50-781Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-09T19-09-50-781Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-09T19-09-50-781Z/desktop/UAT-21.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T19-09-50-781Z/mobile/UAT-12.png) |
| UAT-19 | mobile | fail | Error: expect(locator).toHaveValue(expected) failed Locator:  getByLabel('發送日期與時間') Expected: "2035-11-12T18:30:00" Received: "2035-11-12T18:30" Timeout:  10000ms Call log: | [截圖](evidence/2026-11-09T19-09-50-781Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-09T19-09-50-781Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-09T19-09-50-781Z/mobile/UAT-21.png) |

## 2026-11-10 04:02 ～ 2026-11-10 04:02（台北）

批次：`2026-11-09T20-02-15-346Z`。8 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T20-02-15-346Z/desktop/UAT-12.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-09T20-02-15-346Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-09T20-02-15-346Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-09T20-02-15-346Z/desktop/UAT-21.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T20-02-15-346Z/mobile/UAT-12.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-09T20-02-15-346Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-09T20-02-15-346Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-09T20-02-15-346Z/mobile/UAT-21.png) |

## 2026-11-10 04:08 ～ 2026-11-10 04:15（台北）

批次：`2026-11-09T20-08-24-162Z`。41 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/desktop/UAT-21.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-03.png) |
| UAT-04 | mobile | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-09T20-08-24-162Z/mobile/UAT-21.png) |

## 第 5 輪手機新手探索與修復（2026-11-10）

原始探索證據：[第一次活動](evidence/exploration-2026-11-09T18-21-25-383Z/01-first-activity.png)、[原 ISO 時間表單](evidence/exploration-2026-11-09T18-21-25-383Z/02-schedule-editor.png)、[原空群組](evidence/exploration-2026-11-09T18-21-25-383Z/03-empty-groups.png)、[觀察](evidence/exploration-2026-11-09T18-21-25-383Z/findings.json)。

- UAT-19：原表單要求第一次使用者手填 ISO。新增裝置時區的日期時間選擇器；進階 ISO 輸入保留。驗證到秒的時間保存、重新整理、空值防呆與未覆寫原資料。
- UAT-20：原新活動還沒有訊息就顯示核准。改為先說明建立企畫、提供唯一「請 AI 規劃第一份推播」主按鈕，產生待審訊息後才顯示核准。UAT-12 保留且加強 API 的無群組／空訊息拒絕驗證。
- UAT-21：原空群組只寫加入 bot，活動頁指向不存在的同步。新增邀請官方帳號、傳訊與重新載入步驟、管理員求助提示、表單與詳細頁連結、無群組禁止廣播；載入失敗後重試會清除舊錯誤。

三項先於雙 viewport 重現 6/6 fail，修後含 UAT-12 聚焦 8/8 pass。日期欄位曾因 Chrome 省略零秒導致測試字串不符；改用非零秒精確驗證，仍核對保存的實際 instant，未放寬斷言。每批結果與截圖見上方自動報告。

本輪曾有兩次完整執行未全通過（35/36、41/42）：收尾截圖超時，以及 UAT-04 等待訊息時約五分鐘的執行停頓。後者 trace 的失敗畫面已出現正確三則訊息；保留失敗紀錄，沒有改 timeout 或重試設定，完整重跑作為最終依據。另一次 Auth emulator 未就緒亦保留啟動失敗紀錄；獨立啟動確認成功後再使用標準 npm script 全跑。

## 2026-11-10 04:15 ～ 2026-11-10 04:31（台北）

批次：`2026-11-09T20-15-58-658Z`。42 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/desktop/UAT-21.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-09T20-15-58-658Z/mobile/UAT-21.png) |

## 2026-11-10 04:37 第 5 輪驗收與本機提交交付（台北）

**瀏覽器 UAT：21 旅程 × 桌面／手機 = 42/42 pass，0 fail、0 blocked，ready_for_user_test=true。** [完整批次](evidence/2026-11-09T20-15-58-658Z/results.json)、[本機檢查摘要](evidence/2026-11-09T20-15-58-658Z/local-checks.json)。所有案例截圖已逐一核對存在。

backend 15 suites / 189 tests、frontend 10 files / 86 tests、報告工具 5 tests 均通過；backend/frontend build、frontend lint 通過。production bundle 不包含本機 LIFF 檢查頁；只剩既有 bundle 大小建議警告。測試維持 0 retry 與原 timeout，未以部分執行替代完整驗收。

完整綠燈後，以全新手機帳號重走註冊、第一個活動、AI 產生企畫、時間編輯、LINE 空狀態：[初始畫面](evidence/exploration-2026-11-09T20-36-08-730Z/01-first-activity.png)、[時間編輯](evidence/exploration-2026-11-09T20-36-08-730Z/02-schedule-editor.png)、[LINE 指引](evidence/exploration-2026-11-09T20-36-08-730Z/03-empty-groups.png)、[探索紀錄](evidence/exploration-2026-11-09T20-36-08-730Z/findings.json)。確認初始核准數量 0、第一份推播主按鈕 1、日期時間選擇器 1，無 pageerror。探索後 4121–4127 全部關閉。

LIFF mock presets default、no_group、share_unavailable 均通過。試用入口為 `npm run uat:start` 後的 http://127.0.0.1:4121，LIFF 為 http://127.0.0.1:4121/uat/liff?mockPreset=default（另可換兩 preset）；交付時服務已關閉。真實 LINE App、ID token/scopes、分享與群組 webhook、LINE API Status／Developers Console、真實 LLM、Google OAuth、HTTPS 仍未驗證。本輪未 push、未改 remote、未部署、未開 tunnel，未碰 PR42 或其他服務。

**Git 驗收仍有環境阻擋。** 原工作區 `.git` 為唯讀，`git add` 無法建立 `.git/index.lock`。原分支仍停在 `3135a4f`，預設 `git status` 有差異，不能宣稱已乾淨。已在目前目錄被忽略的 `.uat-tools/uat-commits.git` 拆分 14 個功能／測試提交，最後再以文件提交封存本報告與全部剩餘證據；此獨立提交樹涵蓋目前工作檔，但不會改寫原分支 refs/index。

可搬移檔位於 `.uat-tools/uat-delivery/uat-commits.bundle`、`.uat-tools/uat-delivery/patches/` 與 `.uat-tools/uat-delivery/commits.txt`。bundle 以目前原始 HEAD `3135a4f` 為 prerequisite，不含 remote；Product Builder 恢復原 `.git` 可寫後可匯入這些本機提交，再處理原分支/index。沒有另建 checkout 或修改其他目錄。bundle 與 patch 是交付產物，保持 ignored，避免把封存檔遞迴加入提交。

| 本機 commit | 修復／測試 |
| --- | --- |
| `45493a0` | test(UAT-01–18): preserve emulator journeys and dual viewport evidence |
| `ed314ce` | fix(UAT-10): initialize local LIFF mock login and verify share presets |
| `e388c05` | fix(UAT-11): enforce backend-only activity writes and broadcast ownership |
| `7b4a149` | fix(UAT-12): reject empty plans, invalid messages and scheduled times |
| `8f1154d` | fix(UAT-13): restore finalized chat history after navigation and reload |
| `006a2e9` | fix(UAT-14): synchronize recipients and pause pending messages for review |
| `fc11625` | fix(UAT-15): compare schedule instants and claim sends transactionally |
| `0b76ffc` | fix(UAT-16): validate knowledge edits before replacing saved data |
| `232994e` | fix(UAT-17): retain knowledge drafts and offer retries for failed history loads |
| `21ff50d` | fix(UAT-09): show recoverable LINE reply and broadcast errors |
| `3c2b019` | fix(UAT-18): ignore composition Enter in activity, chat and reply inputs |
| `0b2514a` | fix(UAT-19): offer local date and time picker while preserving ISO schedule edits |
| `dd0d2c3` | fix(UAT-20): guide first-time hosts to generate a plan before approval |
| `d211a41` | fix(UAT-21): explain LINE group setup and recover failed group refreshes |
| `0924283` | docs(UAT-01–21): record verified 42-case acceptance and portable local commits |

文件提交的精確 hash 記於交付目錄 `commits.txt`，避免文件自引用 hash。

## 2026-11-10 05:03 ～ 2026-11-10 05:05（台北）

批次：`2026-11-09T21-03-37-405Z`。42 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/desktop/UAT-21.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-09T21-03-37-405Z/mobile/UAT-21.png) |

## 2026-11-10 05:07 ～ 2026-11-10 05:08（台北）

批次：`2026-11-09T21-07-08-658Z`。0 pass / 4 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-22 | desktop | fail | Error: expect(locator).toContainText(expected) failed Locator: getByRole('alert') Expected substring: "無法載入活動，請檢查網路連線後重試" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T21-07-08-658Z/desktop/UAT-22.png) |
| UAT-23 | desktop | fail | Error: expect(locator).toContainText(expected) failed Locator: getByRole('alert') Expected substring: "刪除失敗，請檢查網路連線後重試" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T21-07-08-658Z/desktop/UAT-23.png) |
| UAT-22 | mobile | fail | Error: expect(locator).toContainText(expected) failed Locator: getByRole('alert') Expected substring: "無法載入活動，請檢查網路連線後重試" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T21-07-08-658Z/mobile/UAT-22.png) |
| UAT-23 | mobile | fail | Error: expect(locator).toContainText(expected) failed Locator: getByRole('alert') Expected substring: "刪除失敗，請檢查網路連線後重試" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T21-07-08-658Z/mobile/UAT-23.png) |

## 2026-11-10 05:08 ～ 2026-11-10 05:08（台北）

批次：`2026-11-09T21-08-43-170Z`。2 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-09T21-08-43-170Z/desktop/UAT-22.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-09T21-08-43-170Z/mobile/UAT-22.png) |

## 2026-11-10 05:12 ～ 2026-11-10 05:12（台北）

批次：`2026-11-09T21-12-52-482Z`。0 pass / 0 fail / 46 blocked；可試用：false。 啟動／執行錯誤：Error: Timed out waiting 180000ms from config.webServer.

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |


## 2026-11-10 05:13 ～ 2026-11-10 05:14（台北）

批次：`2026-11-09T21-13-48-428Z`。4 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-09T21-13-48-428Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-09T21-13-48-428Z/desktop/UAT-23.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-09T21-13-48-428Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-09T21-13-48-428Z/mobile/UAT-23.png) |

## 2026-11-10 05:48 ～ 2026-11-10 06:02（台北）

批次：`2026-11-09T21-48-50-878Z`。42 pass / 4 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-08.png) |
| UAT-09 | desktop | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-10.png) |
| UAT-11 | desktop | fail | Error: expect(locator).toBeVisible() failed Locator: getByText('找不到活動', { exact: true }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-13.png) |
| UAT-14 | desktop | fail | Error: Timeout 10000ms exceeded while waiting on the predicate | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/desktop/UAT-23.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-10.png) |
| UAT-11 | mobile | fail | Error: expect(locator).toBeVisible() failed Locator: getByText('找不到活動', { exact: true }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-09T21-48-50-878Z/mobile/UAT-23.png) |

## 2026-11-10 06:07 ～ 2026-11-10 06:07（台北）

批次：`2026-11-09T22-07-22-706Z`。4 pass / 2 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T22-07-22-706Z/desktop/UAT-09.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T22-07-22-706Z/desktop/UAT-11.png) |
| UAT-14 | desktop | fail | Error: page.evaluate: SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input     at eval (eval at evaluate (:370:30), <anonymous>:26:23)     at async <anonymous>:381:23 | [截圖](evidence/2026-11-09T22-07-22-706Z/desktop/UAT-14.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T22-07-22-706Z/mobile/UAT-09.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T22-07-22-706Z/mobile/UAT-11.png) |
| UAT-14 | mobile | fail | Error: page.evaluate: SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input     at eval (eval at evaluate (:370:30), <anonymous>:26:23)     at async <anonymous>:381:23 | [截圖](evidence/2026-11-09T22-07-22-706Z/mobile/UAT-14.png) |

## 2026-11-10 06:11 ～ 2026-11-10 06:11（台北）

批次：`2026-11-09T22-11-01-915Z`。6 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-01-915Z/desktop/UAT-09.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-01-915Z/desktop/UAT-11.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-01-915Z/desktop/UAT-14.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-01-915Z/mobile/UAT-09.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-01-915Z/mobile/UAT-11.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-01-915Z/mobile/UAT-14.png) |

## 2026-11-10 06:11 ～ 2026-11-10 06:27（台北）

批次：`2026-11-09T22-11-50-171Z`。46 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/desktop/UAT-23.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-09T22-11-50-171Z/mobile/UAT-23.png) |

## 2026-11-10 07:07 ～ 2026-11-10 07:07（台北）

批次：`2026-11-09T23-07-24-900Z`。0 pass / 2 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-22 | desktop | fail | Error: 重試與返回活動列表必須分開，讓新手可辨認主要操作 expect(received).toBe(expected) // Object.is equality Expected: true Received: false | [截圖](evidence/2026-11-09T23-07-24-900Z/desktop/UAT-22.png) |
| UAT-22 | mobile | fail | Error: 重試與返回活動列表必須分開，讓新手可辨認主要操作 expect(received).toBe(expected) // Object.is equality Expected: true Received: false | [截圖](evidence/2026-11-09T23-07-24-900Z/mobile/UAT-22.png) |

## 2026-11-10 07:07 ～ 2026-11-10 07:21（台北）

批次：`2026-11-09T23-07-53-352Z`。45 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-08.png) |
| UAT-09 | desktop | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/desktop/UAT-23.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-09T23-07-53-352Z/mobile/UAT-23.png) |

## 2026-11-10 07:28 ～ 2026-11-10 07:32（台北）

批次：`2026-11-09T23-28-11-094Z`。0 pass / 2 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-24 | desktop | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-09T23-28-11-094Z/desktop/UAT-24.png) |
| UAT-24 | mobile | fail | Error: expect(locator).toHaveText(expected) failed Locator: getByRole('alert') Expected: "無法載入帳號資料，請檢查網路連線後重試" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-09T23-28-11-094Z/mobile/UAT-24.png) |

## 2026-11-10 07:33 ～ 2026-11-10 07:33（台北）

批次：`2026-11-09T23-33-00-024Z`。2 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-09T23-33-00-024Z/desktop/UAT-24.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-09T23-33-00-024Z/mobile/UAT-24.png) |

## 2026-11-10 07:49 ～ 2026-11-10 07:51（台北）

批次：`2026-11-09T23-49-04-646Z`。48 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/desktop/UAT-24.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-09T23-49-04-646Z/mobile/UAT-24.png) |

## 2026-11-10 07:57 第 6 輪最終驗收與交付（台北）

**瀏覽器 UAT：24 旅程 × 桌面／手機 = 48/48 pass，0 fail、0 blocked，ready_for_user_test=true。** [完整批次](evidence/2026-11-09T23-49-04-646Z/results.json)、[本機檢查摘要](evidence/2026-11-09T23-49-04-646Z/local-checks.json)，48 張案例截圖均已核對存在。backend 189、frontend 91、報告工具 5 通過，兩端 build 與 frontend lint 通過；Playwright 維持系統 Chrome、0 retry、45 秒案例／10 秒斷言上限，未弱化測試。

本輪先複驗既有 42/42，再新增 UAT-22 活動載入／建立斷線復原、UAT-23 企畫刪除／編輯斷線復原。新增案例雙 viewport 先失敗再修復，三項單元回歸亦 RED→GREEN。完整回歸另發現首次登入的 Firestore 資料建立失敗未 catch、處理中不結束；新增 UAT-24 真實 SDK 停網復原與兩項單元回歸，先失敗再修復，保留資料完成前的登入保護並阻止舊請求還原已登出使用者。完整綠燈後，手機截圖發現「重試」與返回連結相連；在 UAT-22 新增唯一重試與至少 8px 分隔斷言，兩 viewport 先失敗，再改為獨立主按鈕／返回連結，最後完整重跑 48/48。所有歷史失敗、啟動阻擋與修復原因保留於前述批次及 [修復紀錄](FIXES.md)。

最終新帳號手機探索：[首次活動](evidence/exploration-2026-11-09T23-57-01-084Z/01-first-activity.png)、[日期選擇](evidence/exploration-2026-11-09T23-57-01-084Z/02-schedule-editor.png)、[LINE 空狀態](evidence/exploration-2026-11-09T23-57-01-084Z/03-empty-groups.png)、[刪除失敗](evidence/connectivity-2026-11-09T23-57-06-270Z/01-delete-offline.png)、[活動重試主按鈕](evidence/connectivity-2026-11-09T23-57-06-270Z/02-open-activity-offline.png)、[列表重試](evidence/connectivity-2026-11-09T23-57-06-270Z/03-activity-list-offline.png)。首次核准按鈕 0、第一份企畫主按鈕 1、日期選擇器 1；兩份探索紀錄的 pageerror 均為空。沒有新增未處理發現。

交付時 session C 啟動的 4121–4127 app/emulator 與 4129 測試伺服器全部關閉。未 push、未改 remote、未部署、未開 tunnel，未觸碰 PR42、deploy 或其他服務。試用方式：根目錄 `npm run uat:start` 後開啟 http://127.0.0.1:4121；僅本機 emulator/mock，真實 LINE App、webhook、分享、LLM、Google OAuth 與 HTTPS 仍未驗證。

**原分支 Git 驗收尚未達成：環境把原 `.git` 掛載為唯讀，連 `git add --dry-run` 都無法建立 index.lock。** 原 HEAD 仍是 `3135a4f`，原分支/index 未變，預設 `git status` 仍有差異；不能宣稱原分支已 commit 或乾淨。已接續既有 ignored `.uat-tools/uat-commits.git` 完成本輪獨立提交，並更新 `.uat-tools/uat-delivery/uat-commits.bundle`、`patches/`、`commits.txt`。這些是本機可攜交付，待 Product Builder 在原 Git 可寫後匯入；不以隱藏追蹤差異或改 remote 來迴避驗收。

交付提交清單（含前輪，全部以 `3135a4f` 為基底；不含 pr42-fix、依賴、測試暫存或金鑰）：

| 本機 commit | 修復／測試 |
| --- | --- |
| `45493a0` | test(UAT-01–18): preserve emulator journeys and dual viewport evidence |
| `ed314ce` | fix(UAT-10): initialize local LIFF mock login and verify share presets |
| `e388c05` | fix(UAT-11): enforce backend-only activity writes and broadcast ownership |
| `7b4a149` | fix(UAT-12): reject empty plans, invalid messages and scheduled times |
| `8f1154d` | fix(UAT-13): restore finalized chat history after navigation and reload |
| `006a2e9` | fix(UAT-14): synchronize recipients and pause pending messages for review |
| `fc11625` | fix(UAT-15): compare schedule instants and claim sends transactionally |
| `0b76ffc` | fix(UAT-16): validate knowledge edits before replacing saved data |
| `232994e` | fix(UAT-17): retain knowledge drafts and offer retries for failed history loads |
| `21ff50d` | fix(UAT-09): show recoverable LINE reply and broadcast errors |
| `3c2b019` | fix(UAT-18): ignore composition Enter in activity, chat and reply inputs |
| `0b2514a` | fix(UAT-19): offer local date and time picker while preserving ISO schedule edits |
| `dd0d2c3` | fix(UAT-20): guide first-time hosts to generate a plan before approval |
| `d211a41` | fix(UAT-21): explain LINE group setup and recover failed group refreshes |
| `0924283` | docs(UAT-01–21): record verified 42-case acceptance and portable local commits |
| `93058f6` | fix(UAT-22): distinguish activity load failures and preserve creation drafts for retry |
| `95fd3b6` | fix(UAT-23): recover failed message deletions and retain offline schedule edits |
| `2f5b2a4` | test(UAT-01,UAT-11,UAT-14): isolate server sockets and hold LINE sends until assertions finish |
| `fd938af` | fix(UAT-22): separate the primary retry action from the return link |
| `f4657f0` | fix(UAT-24): recover first-login profile failures and reject stale auth completions |
| `HEAD`（本文件封存） | docs(UAT-01–24): record 48-case acceptance and refresh portable delivery |

文件提交的完整 hash 記於交付目錄 `commits.txt`，避免自引用 hash。交付庫 status 與 bundle 完整性另行驗證；原分支的唯讀阻擋不影響此處已驗證的本機瀏覽器測試結果。

## 2026-11-10 08:06 ～ 2026-11-10 08:10（台北）

批次：`2026-11-10T00-06-35-360Z`。47 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-16.png) |
| UAT-17 | desktop | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/desktop/UAT-24.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T00-06-35-360Z/mobile/UAT-24.png) |

## 2026-11-10 10:50 ～ 2026-11-10 10:51（台北）

批次：`2026-11-10T02-50-32-913Z`。0 pass / 4 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-25 | desktop | fail | Error: expect(locator).toBeDisabled() failed Locator:  getByRole('button', { name: '核准企畫', exact: true }) Expected: disabled Received: enabled Timeout:  10000ms Call log: | [截圖](evidence/2026-11-10T02-50-32-913Z/desktop/UAT-25.png) |
| UAT-26 | desktop | fail | Error: expect(locator).toHaveText(expected) failed Locator: getByRole('alert') Expected: "無法連線至 AI 助理，請檢查網路連線後重新送出；輸入內容已保留" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-10T02-50-32-913Z/desktop/UAT-26.png) |
| UAT-25 | mobile | fail | Error: expect(locator).toBeDisabled() failed Locator:  getByRole('button', { name: '核准企畫', exact: true }) Expected: disabled Received: enabled Timeout:  10000ms Call log: | [截圖](evidence/2026-11-10T02-50-32-913Z/mobile/UAT-25.png) |
| UAT-26 | mobile | fail | Error: expect(locator).toHaveText(expected) failed Locator: getByRole('alert') Expected: "無法連線至 AI 助理，請檢查網路連線後重新送出；輸入內容已保留" Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-10T02-50-32-913Z/mobile/UAT-26.png) |

## 2026-11-10 10:52 ～ 2026-11-10 10:52（台北）

批次：`2026-11-10T02-52-11-650Z`。0 pass / 0 fail / 52 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |


## 2026-11-10 10:52 ～ 2026-11-10 10:52（台北）

批次：`2026-11-10T02-52-06-673Z`。6 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-06-673Z/desktop/UAT-17.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-06-673Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-06-673Z/desktop/UAT-26.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-06-673Z/mobile/UAT-17.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-06-673Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-06-673Z/mobile/UAT-26.png) |

## 2026-11-10 10:52 ～ 2026-11-10 10:55（台北）

批次：`2026-11-10T02-52-59-513Z`。52 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/desktop/UAT-26.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T02-52-59-513Z/mobile/UAT-26.png) |

## 2026-11-10 10:57 ～ 2026-11-10 10:57（台北）

批次：`2026-11-10T02-57-37-120Z`。0 pass / 2 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-27 | desktop | fail | Error: 輸入文字與實際背景的對比至少 4.5:1 expect(received).toBeGreaterThanOrEqual(expected) Expected: >= 4.5 Received:    1.0980511636379169 | [截圖](evidence/2026-11-10T02-57-37-120Z/desktop/UAT-27.png) |
| UAT-27 | mobile | fail | Error: 輸入文字與實際背景的對比至少 4.5:1 expect(received).toBeGreaterThanOrEqual(expected) Expected: >= 4.5 Received:    1.0980511636379169 | [截圖](evidence/2026-11-10T02-57-37-120Z/mobile/UAT-27.png) |

## 2026-11-10 10:58 ～ 2026-11-10 10:58（台北）

批次：`2026-11-10T02-58-15-780Z`。2 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-15-780Z/desktop/UAT-27.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-15-780Z/mobile/UAT-27.png) |

## 2026-11-10 10:58 ～ 2026-11-10 11:01（台北）

批次：`2026-11-10T02-58-46-996Z`。53 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-18.png) |
| UAT-19 | desktop | fail | Error: expect(received).toBe(expected) // Object.is equality Expected: 2078476217000 Received: 1794365980000 | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/desktop/UAT-27.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T02-58-46-996Z/mobile/UAT-27.png) |

## 2026-11-10 11:01 ～ 2026-11-10 11:03（台北）

批次：`2026-11-10T03-01-37-171Z`。54 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/desktop/UAT-27.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T03-01-37-171Z/mobile/UAT-27.png) |

## 2026-11-10 11:06 本輪驗收與增量交付（台北）

**27 個旅程 × 桌面／手機 = 54/54 pass，0 fail、0 blocked，ready_for_user_test=true。** 透過 `node deployment/local/e2e.cjs` 完整執行；[完整結果](evidence/2026-11-10T03-01-37-171Z/results.json)、[本機檢查摘要](evidence/2026-11-10T03-01-37-171Z/local-checks.json)。54 組案例／viewport 與 54 張截圖已核對存在。backend 189、frontend 94、報告工具 5 通過；backend/frontend build 與 frontend lint 通過。lint 保留既有 AuthContext ref cleanup 的 1 個 warning（0 errors），build 保留既有 chunk size warning；沒有停用規則。系統 Chrome、0 retry、45 秒案例／10 秒斷言上限維持不變。

新增 UAT-25 無目標群組時禁止核准並引導選群、UAT-26 AI 斷線中文說明／保留草稿／單次重試；單元與桌面／手機均先失敗後修復通過。52/52 綠燈後手機視覺複查再發現輸入文字幾乎不可見，補 UAT-27，兩 viewport 實測 1.098:1 先失敗，修正舊深色頁面遺留的全域字色後六個輸入欄位皆通過至少 4.5:1 對比。詳 [修復紀錄](FIXES.md)。

歷史失敗保留：接續時 47/48 的 UAT-17 逾時，本輪聚焦與後續完整執行均通過；新增案例的 RED 批次保留。另一次完整執行 53/54，UAT-19 的持久資料 GET 早於儲存 PATCH 完成；trace 確認後先等待 PATCH 200 與編輯器關閉，再做原有精確時間／秒數／時區／重整／防呆斷言，最終全綠。[請求時序](evidence/2026-11-10T02-58-46-996Z/schedule-save-race.json)。10:52 的 0/52 blocked 是 `--list` 案例列舉觸發報告器，沒有執行測試；不當作通過或產品失敗。

最終全綠後再次以全新手機帳號操作，三份探索腳本均 exit 0、pageerror 0，並檢視實際截圖：

- [第一次建立活動](evidence/first-plan-2026-11-10T03-03-56-558Z/00-first-activity.png)：核准按鈕 0、第一份推播主操作 1。
- [未選群組的企畫](evidence/first-plan-2026-11-10T03-03-56-558Z/01-plan-without-group.png)：明確指引、核准停用。
- [AI 斷線草稿](evidence/first-plan-2026-11-10T03-03-56-558Z/02-ai-offline.png)、[恢復後對話](evidence/first-plan-2026-11-10T03-03-56-558Z/03-ai-recovered.png)：中文提示、深色草稿可讀、重試無重複。
- [手機日期選擇器](evidence/exploration-2026-11-10T03-03-56-481Z/02-schedule-editor.png)、[LINE 空群組步驟](evidence/exploration-2026-11-10T03-03-56-481Z/03-empty-groups.png)。
- [活動斷線重試主操作](evidence/connectivity-2026-11-10T03-03-56-493Z/02-open-activity-offline.png)、[觀察紀錄](evidence/connectivity-2026-11-10T03-03-56-493Z/findings.json)。沒有新增未處理發現。

`deployment/local/e2e.cjs` 在本工作目錄與 `0924283` 均不存在，未取得原部署腳本內容；本輪是在指定路徑新增本機驗收入口，共用完整 Playwright 測試，涵蓋新空群組文案及無群組不能核准。未存取 `/workspace/deploy`，不宣稱已比對未知原腳本的額外檢查。

本輪沿用 ignored `.uat-tools/uat-commits.git`；以下全部提交以 **0924283** 為祖先，不重送已匯入的 15 個提交。增量 bundle：`.uat-tools/uat-delivery/uat-since-0924283.bundle`；完整 hash、匯入驗證與 SHA256 見同目錄的 `commits-since-0924283.txt`、`manifest-since-0924283.json`。提交清單：

| 本機 commit | 修復／測試 |
| --- | --- |
| `93058f6` | fix(UAT-22): distinguish activity load failures and preserve creation drafts for retry |
| `95fd3b6` | fix(UAT-23): recover failed message deletions and retain offline schedule edits |
| `2f5b2a4` | test(UAT-01,UAT-11,UAT-14): isolate server sockets and hold LINE sends until assertions finish |
| `fd938af` | fix(UAT-22): separate the primary retry action from the return link |
| `f4657f0` | fix(UAT-24): recover first-login profile failures and reject stale auth completions |
| `ab495ab` | docs(UAT-01–24): record 48-case acceptance and refresh portable delivery |
| `1cf1084` | test(UAT-01–24): exclude generated Playwright artifacts from source lint |
| `595f592` | fix(UAT-25): guide ungrouped plans before approval and reapproval |
| `f24a9a6` | fix(UAT-26): explain AI connection failures and preserve drafts for a single retry |
| `9954352` | test(UAT-21,UAT-25): add local acceptance entrypoint for group setup and approval guards |
| `e461e71` | fix(UAT-27): make organizer input text readable on light forms |
| `2b9cc5f` | test(UAT-25,UAT-26): capture first-plan approval and offline AI recovery exploration |
| `51bd822` | test(UAT-19): await successful schedule save before checking persisted time |
| `HEAD`（本文件封存） | docs(UAT-01–27): record 54-case acceptance and incremental delivery |

**原工作目錄的乾淨 Git 驗收仍受阻：`.git/index.lock` 回報 Read-only file system，原 HEAD 仍為 3135a4f，預設 git status 仍有差異。** 交付庫的提交與乾淨狀態、bundle 的獨立匯入驗證記錄在交付 manifest；不能把它當作原分支已乾淨。所有本輪來源改動、計畫、歷史結果與證據均封存於交付庫；不含 pr42-fix、依賴、測試暫存或 secret。

session C 啟動的 app／emulator 均已關閉，只使用 4121–4127 與 backend 測試的 4129。未 push、未改 remote、未部署、未開 tunnel，未操作 PR42、deploy、其他服務或目錄。可由 Product Builder 匯入 bundle 後自行推送。瀏覽器試用：`npm run uat:start` 後開啟 http://127.0.0.1:4121；本次僅本機 Firebase emulator + LINE/AI mock，真實 LINE／LLM／OAuth／HTTPS 仍需另行驗收。

## 2026-11-10 11:08 ～ 2026-11-10 11:11（台北）

批次：`2026-11-10T03-08-57-394Z`。54 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/desktop/UAT-27.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T03-08-57-394Z/mobile/UAT-27.png) |

## 2026-11-10 11:12 ～ 2026-11-10 11:13（台北）

批次：`2026-11-10T03-12-17-722Z`。0 pass / 6 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-28 | desktop | fail | Error: expect(locator).toHaveCount(expected) failed Locator:  getByText('尚無訊息記錄', { exact: true }) Expected: 0 Received: 1 Timeout:  10000ms Call log: | [截圖](evidence/2026-11-10T03-12-17-722Z/desktop/UAT-28.png) |
| UAT-29 | desktop | fail | Error: expect(locator).toContainText(expected) failed Locator: getByRole('alert') Expected pattern: /無法連線.*內容已保留/ Received string:  "Failed to fetch" Timeout: 10000ms Call log: | [截圖](evidence/2026-11-10T03-12-17-722Z/desktop/UAT-29.png) |
| UAT-30 | desktop | fail | Error: expect(locator).toBeDisabled() failed Locator:  getByRole('button', { name: '下一步：各群組微調 →', exact: true }) Expected: disabled Received: enabled Timeout:  10000ms Call log: | [截圖](evidence/2026-11-10T03-12-17-722Z/desktop/UAT-30.png) |
| UAT-28 | mobile | fail | Error: expect(locator).toHaveCount(expected) failed Locator:  getByText('尚無訊息記錄', { exact: true }) Expected: 0 Received: 1 Timeout:  10000ms Call log: | [截圖](evidence/2026-11-10T03-12-17-722Z/mobile/UAT-28.png) |
| UAT-29 | mobile | fail | Error: expect(locator).toContainText(expected) failed Locator: getByRole('alert') Expected pattern: /無法連線.*內容已保留/ Received string:  "Failed to fetch" Timeout: 10000ms Call log: | [截圖](evidence/2026-11-10T03-12-17-722Z/mobile/UAT-29.png) |
| UAT-30 | mobile | fail | Error: expect(locator).toBeDisabled() failed Locator:  getByRole('button', { name: '下一步：各群組微調 →', exact: true }) Expected: disabled Received: enabled Timeout:  10000ms Call log: | [截圖](evidence/2026-11-10T03-12-17-722Z/mobile/UAT-30.png) |

## 2026-11-10 11:14 ～ 2026-11-10 11:14（台北）

批次：`2026-11-10T03-14-08-901Z`。2 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T03-14-08-901Z/desktop/UAT-28.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T03-14-08-901Z/mobile/UAT-28.png) |

## 2026-11-10 11:14 ～ 2026-11-10 11:15（台北）

批次：`2026-11-10T03-14-57-398Z`。2 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T03-14-57-398Z/desktop/UAT-29.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T03-14-57-398Z/mobile/UAT-29.png) |

## 2026-11-10 11:15 ～ 2026-11-10 11:15（台北）

批次：`2026-11-10T03-15-37-360Z`。2 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T03-15-37-360Z/desktop/UAT-30.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T03-15-37-360Z/mobile/UAT-30.png) |

## 2026-11-10 11:16 ～ 2026-11-10 11:18（台北）

批次：`2026-11-10T03-16-08-438Z`。59 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-05.png) |
| UAT-06 | desktop | fail | Error: expect(received).toBe(expected) // Object.is equality Expected: 1 Received: 0 Call Log: - Timeout 10000ms exceeded while waiting on the predicate | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/desktop/UAT-27.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T03-16-08-438Z/mobile/UAT-27.png) |

## 2026-11-10 16:03 ～ 2026-11-10 16:05（台北）

批次：`2026-11-10T08-03-53-255Z`。60 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/desktop/UAT-27.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T08-03-53-255Z/mobile/UAT-27.png) |

## 2026-11-10 16:03 本輪驗證與交付

`node deployment/local/e2e.cjs` 完整執行桌面與手機 60/60 通過，詳細每案結果及截圖見上一批次。上次桌面 UAT-06 逾時，本次桌面及手機通過；其偶發原因尚未確認。backend 15 suites / 189 tests、frontend 12 files / 97 tests、報告工具 5 tests 通過；兩端 build 及 frontend lint 通過，lint 有一項 AuthContext Hook 警告。

新手手機複查使用全新模擬帳號：[首次活動、AI 與 LINE 空群組](evidence/exploration-2026-11-10T08-06-14-323Z/findings.json)、[群組斷線、廣播草稿及恢復](evidence/groups-2026-11-10T08-06-14-316Z/findings.json)。首次活動有一個 AI 規劃入口且沒有提前核准按鈕；空群組列出連結 LINE 的步驟及重新載入操作；斷線重試保留草稿。未發現新的阻塞問題。實體手機輸入法、真實 LINE、AI、OAuth 與 HTTPS 未驗證。

以下為以 0924283 為基底的既有增量提交；本報告提交的 hash 另見交付清單，避免自引用。

```text
93058f6 fix(UAT-22): distinguish activity load failures and preserve creation drafts for retry
95fd3b6 fix(UAT-23): recover failed message deletions and retain offline schedule edits
2f5b2a4 test(UAT-01,UAT-11,UAT-14): isolate server sockets and hold LINE sends until assertions finish
fd938af fix(UAT-22): separate the primary retry action from the return link
f4657f0 fix(UAT-24): recover first-login profile failures and reject stale auth completions
ab495ab docs(UAT-01–24): record 48-case acceptance and refresh portable delivery
1cf1084 test(UAT-01–24): exclude generated Playwright artifacts from source lint
595f592 fix(UAT-25): guide ungrouped plans before approval and reapproval
f24a9a6 fix(UAT-26): explain AI connection failures and preserve drafts for a single retry
9954352 test(UAT-21,UAT-25): add local acceptance entrypoint for group setup and approval guards
e461e71 fix(UAT-27): make organizer input text readable on light forms
2b9cc5f test(UAT-25,UAT-26): capture first-plan approval and offline AI recovery exploration
51bd822 test(UAT-19): await successful schedule save before checking persisted time
8d1fdee docs(UAT-01–27): record 54-case acceptance and incremental delivery
46e9d00 fix(UAT-28): recover LINE conversation loads and preserve reply delivery state
9de1592 fix(UAT-29): explain broadcast connection failures while preserving group drafts
def69fa fix(UAT-30): validate per-group broadcast drafts before sending
```

原工作目錄 `.git` 為唯讀，原 HEAD 仍為 3135a4f，原始 git status 未乾淨；可攜交付庫與增量 bundle 供 Product Builder 匯入，不能視為原分支已提交。未 push、修改 remote 或部署。

## 2026-11-10 16:15 ～ 2026-11-10 16:29（台北）

批次：`2026-11-10T08-15-35-801Z`。60 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/desktop/UAT-27.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T08-15-35-801Z/mobile/UAT-27.png) |

## 2026-11-10 16:38 本輪驗證與交付

`node deployment/local/e2e.cjs` 完整通過 60/60；上表為本輪逐案結果。backend 15 suites／189 tests、frontend 12 files／97 tests、報告工具 5 tests 通過；兩端 build 與 frontend lint 通過，lint 仍有一項 AuthContext Hook 警告。桌面 UAT-11 此次耗時 31.6 秒但通過，先前偶發逾時的 UAT-06 兩種 viewport 均通過。

以新模擬帳號重新執行手機探索：[首次活動與 LINE 空狀態](evidence/exploration-2026-11-10T08-37-58-142Z/findings.json)、[無群組核准與 AI 斷線](evidence/first-plan-2026-11-10T08-38-01-642Z/findings.json)、[LINE 群組與廣播斷線](evidence/groups-2026-11-10T08-38-04-949Z/findings.json)。首次企畫只有一個 AI 規劃入口；未選群組時不能核准；斷線後輸入保留且可以重試。探索未發現需新增案例的問題。使用 Firebase emulator 與 LINE／AI mock，真實服務、OAuth、HTTPS 與實體手機輸入法未驗證。測試程序已關閉。

以 0924283 為基底的提交清單見上一節；其後另有 `82aa38f docs(UAT-01-30): record full acceptance and mobile exploration`。本次報告提交不列自身 hash，交付 bundle 的 HEAD 即為本次報告提交。

原工作目錄 `.git` 受唯讀限制，原分支仍停在 3135a4f，原始 `git status` 仍不乾淨；增量 bundle 供 Product Builder 匯入，不能宣稱原分支已提交。未 push、修改 remote 或部署。

## 2026-11-10 17:49 ～ 2026-11-10 17:51（台北）

批次：`2026-11-10T09-49-41-794Z`。60 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/desktop/UAT-27.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T09-49-41-794Z/mobile/UAT-27.png) |

## 2026-11-10 17:52 本輪驗證與交付（台北）

本輪完整執行 `node deployment/local/e2e.cjs`，桌面與手機共 60/60 通過，逐案結果與截圖見上一節；`UAT-STATUS.json` 為 ready。backend 15 suites／189 tests、frontend 12 files／97 tests、報告工具 5 tests 均通過；backend 與 frontend build 通過。frontend lint 0 error、1 項既有 AuthContext Hook 警告；build 有既有 bundle 大小警告。

手機新帳號探索：[首次活動及 LINE 空狀態](evidence/exploration-2026-11-10T09-52-13-297Z/findings.json)、[未選群組的企畫及 AI 斷線](evidence/first-plan-2026-11-10T09-52-16-439Z/findings.json)、[LINE 群組與廣播斷線](evidence/groups-2026-11-10T09-52-19-232Z/findings.json)。首次活動有一個 AI 規劃入口，未選群組時核准停用；斷線提示與重試保留草稿。本次未觀察到需新增案例的問題。

以 0924283 為基底的功能和測試提交清單見「2026-11-10 16:03 本輪驗證與交付」，後續文件提交為 `82aa38f`、`06c10c1`，本次報告提交不列自身 hash。僅使用本機 Firebase emulator、LINE／AI mock 和系統 Chrome；真實 LINE、AI、OAuth、HTTPS 與實體手機輸入法尚未驗證。測試啟動的服務已關閉，未 push、部署或開 tunnel。

## 2026-11-10 17:54 ～ 2026-11-10 18:02（台北）

批次：`2026-11-10T09-54-40-902Z`。58 pass / 2 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-05.png) |
| UAT-06 | desktop | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/desktop/UAT-27.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-10.png) |
| UAT-11 | mobile | fail | Error: expect(locator).toBeVisible() failed Locator: getByRole('heading', { name: '群組', exact: true }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T09-54-40-902Z/mobile/UAT-27.png) |

## 2026-11-10 18:10 ～ 2026-11-10 18:28（台北）

批次：`2026-11-10T10-10-06-942Z`。58 pass / 2 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-15.png) |
| UAT-16 | desktop | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/desktop/UAT-27.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-05.png) |
| UAT-06 | mobile | fail | Error: expect(locator).toBeVisible() failed Locator: getByText('本機活動提醒 1：歡迎參加活動！', { exact: true }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T10-10-06-942Z/mobile/UAT-27.png) |

## 2026-11-10 18:40 ～ 2026-11-10 18:49（台北）

批次：`2026-11-10T10-40-38-098Z`。58 pass / 2 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-29.png) |
| UAT-30 | desktop | fail | Error: expect(locator).toBeVisible() failed Locator: getByRole('heading', { name: '群組', exact: true }) Expected: visible Error: element(s) not found Call log:   - Expect "toBeVisible" getByRole('heading', { name: '群組', exact: true }) with timeout 10000ms | [截圖](無截圖（啟動失敗）) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/desktop/UAT-27.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-18.png) |
| UAT-19 | mobile | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T10-40-38-098Z/mobile/UAT-27.png) |

## 本輪重新驗收補充（2026-11-10）

本輪三次完整執行均為 58/60，狀態維持不開放使用者驗收。第一次桌面 UAT-06 和手機 UAT-11 等待帳號載入逾時；第二次桌面 UAT-16 在超過四分鐘停頓後逾時，手機 UAT-06 等待 AI 回應逾時；第三次桌面 UAT-30 的 Chrome 記錄 D-Bus 連線中斷而退出，手機 UAT-19 在超過七分鐘停頓後等待帳號載入逾時。失敗原因尚未完全釐清，不應僅以後續單次通過認定問題解決。逐案截圖與結果見上述批次。

本輪 backend 15 suites／189 tests、frontend 12 files／97 tests、報告工具 5 tests 通過；兩端 build 通過，frontend lint 零錯誤、一項既有 Hook 警告。尚待穩定環境下重新完整驗收、完成新手探索並確認所有缺陷；本輪未宣稱 ready。執行使用本機 emulator 與 LINE／AI mock，未驗證真實服務。服務已結束。

0924283 之後的功能與測試提交清單見 16:03 交付段落；後續報告提交為 `82aa38f`、`06c10c1`、`5b4c540`。本報告提交不列自身 hash。

## 2026-11-10 19:22 ～ 2026-11-10 19:45（台北）

批次：`2026-11-10T11-22-13-781Z`。59 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-18.png) |
| UAT-19 | desktop | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/desktop/UAT-27.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T11-22-13-781Z/mobile/UAT-27.png) |

## 2026-11-10 19:51 ～ 2026-11-10 20:02（台北）

批次：`2026-11-10T11-51-35-831Z`。60 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/desktop/UAT-27.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T11-51-35-831Z/mobile/UAT-27.png) |

## 2026-11-11 00:35 ～ 2026-11-11 00:37（台北）

批次：`2026-11-10T16-35-12-885Z`。60 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/desktop/UAT-27.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T16-35-12-885Z/mobile/UAT-27.png) |

## 2026-11-11 00:39 ～ 2026-11-11 00:39（台北）

批次：`2026-11-10T16-39-16-173Z`。0 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | mobile | fail | Error: expect(locator).toHaveCount(expected) failed Locator:  getByText('群組：UAT 讀書會', { exact: true }) Expected: 3 Received: 0 Timeout:  10000ms Call log: | [截圖](evidence/2026-11-10T16-39-16-173Z/mobile/UAT-31.png) |

## 2026-11-11 00:40 ～ 2026-11-11 01:19（台北）

批次：`2026-11-10T16-40-12-654Z`。60 pass / 2 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-03.png) |
| UAT-04 | desktop | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-30.png) |
| UAT-01 | mobile | fail | Error: expect(locator).toBeVisible() failed Locator: getByRole('heading', { name: '群組', exact: true }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T16-40-12-654Z/mobile/UAT-27.png) |

## 2026-11-11 01:41 ～ 2026-11-11 03:14（台北）

批次：`2026-11-10T17-41-03-870Z`。60 pass / 2 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-29.png) |
| UAT-30 | desktop | fail | Test timeout of 45000ms exceeded while running "afterEach" hook. | [截圖](無截圖（啟動失敗）) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-14.png) |
| UAT-15 | mobile | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T17-41-03-870Z/mobile/UAT-27.png) |

## 2026-11-11 04:14 ～ 2026-11-11 04:16（台北）

批次：`2026-11-10T20-14-01-609Z`。62 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T20-14-01-609Z/mobile/UAT-27.png) |

## 2026-11-11 04:16 完整驗收及手機新手探索

透過 `node deployment/local/e2e.cjs` 完整執行 31 個旅程的桌面與手機版本，62 pass / 0 fail / 0 blocked。UAT-21 檢查 LINE 空群組的新指引及復原；UAT-25 檢查未選目標群組時 UI 停用核准、API 拒絕，選取後可核准。後端 15 suites / 189 tests、前端 12 files / 98 tests、報告工具 5 tests 均通過；兩端 build 通過；前端 lint 零錯誤、一項既有 Hook 警告。

完整綠燈後，以新手機模擬帳號重走首次活動、AI、LINE 空狀態和斷線復原；首次企畫主要按鈕唯一，未選群組不可核准，錯誤可理解且草稿保留，沒有新增需修復問題，未處理瀏覽器例外為零。證據：[首次活動與 LINE 空狀態](evidence/exploration-2026-11-10T20-16-48-160Z/findings.json)、[首次企畫與 AI](evidence/first-plan-2026-11-10T20-16-51-423Z/findings.json)、[LINE 群組及廣播](evidence/groups-2026-11-10T20-16-54-868Z/findings.json)、[斷線復原](evidence/connectivity-2026-11-10T20-16-57-624Z/findings.json)。

僅本機 Firebase emulator 與 LINE / AI mock；真實 LINE、AI、OAuth、HTTPS 和實體手機輸入法未驗證。測試服務已關閉。

以 `0924283` 為基底的增量提交：

- `93058f6` fix(UAT-22): distinguish activity load failures and preserve creation drafts for retry
- `95fd3b6` fix(UAT-23): recover failed message deletions and retain offline schedule edits
- `2f5b2a4` test(UAT-01,UAT-11,UAT-14): isolate server sockets and hold LINE sends until assertions finish
- `fd938af` fix(UAT-22): separate the primary retry action from the return link
- `f4657f0` fix(UAT-24): recover first-login profile failures and reject stale auth completions
- `ab495ab` docs(UAT-01–24): record 48-case acceptance and refresh portable delivery
- `1cf1084` test(UAT-01–24): exclude generated Playwright artifacts from source lint
- `595f592` fix(UAT-25): guide ungrouped plans before approval and reapproval
- `f24a9a6` fix(UAT-26): explain AI connection failures and preserve drafts for a single retry
- `9954352` test(UAT-21,UAT-25): add local acceptance entrypoint for group setup and approval guards
- `e461e71` fix(UAT-27): make organizer input text readable on light forms
- `2b9cc5f` test(UAT-25,UAT-26): capture first-plan approval and offline AI recovery exploration
- `51bd822` test(UAT-19): await successful schedule save before checking persisted time
- `8d1fdee` docs(UAT-01–27): record 54-case acceptance and incremental delivery
- `46e9d00` fix(UAT-28): recover LINE conversation loads and preserve reply delivery state
- `9de1592` fix(UAT-29): explain broadcast connection failures while preserving group drafts
- `def69fa` fix(UAT-30): validate per-group broadcast drafts before sending
- `82aa38f` docs(UAT-01-30): record full acceptance and mobile exploration
- `06c10c1` docs(UAT-01-30): record repeat acceptance and mobile exploration
- `5b4c540` docs(UAT-01-30): record repeat acceptance and novice exploration
- `fa0b60a` docs(UAT-01-30): record unsuccessful repeat acceptance
- `529322e` chore(UAT-01-30): ignore local delivery bundles
- `5c8bc55` fix(UAT-31): show recognizable group names in message plans

本次驗收記錄與截圖另以最後一個文件提交交付（不列自身 hash）；交付 bundle 的 HEAD 包含該提交。

## 2026-11-11 04:19 ～ 2026-11-11 05:21（台北）

批次：`2026-11-10T20-19-06-997Z`。61 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-01.png) |
| UAT-02 | desktop | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T20-19-06-997Z/mobile/UAT-27.png) |

## 2026-11-11 06:16 ～ 2026-11-11 06:18（台北）

批次：`2026-11-10T22-16-34-309Z`。62 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T22-16-34-309Z/mobile/UAT-27.png) |

## 2026-11-11 06:19 本輪驗證及手機新手探索

後端 15 suites / 189 tests、前端 12 files / 98 tests、報告工具 5 tests 均通過；兩端 build 通過，前端 lint 零錯誤、一項既有 Hook 警告。完整 E2E 首次為 61 pass / 1 fail：桌面 UAT-02 在點擊新增活動時等待按鈕穩定逾時，原因未確定；手機版通過。未修改測試或產品程式，隨後完整重跑為 62 pass / 0 fail，見上方兩次批次紀錄。

手機新手流程再次檢查註冊、第一個活動、AI、未選群組核准、LINE 空狀態及斷線重試，未發現新的待修問題，未處理瀏覽器例外為零。證據：[首次活動和空群組](evidence/exploration-2026-11-10T22-19-06-205Z/findings.json)、[首次企畫和 AI](evidence/first-plan-2026-11-10T22-19-09-220Z/findings.json)、[群組和廣播](evidence/groups-2026-11-10T22-19-12-099Z/findings.json)、[斷線復原](evidence/connectivity-2026-11-10T22-19-14-758Z/findings.json)。本機服務已關閉；真實 LINE、AI、OAuth、HTTPS 和實體手機輸入法未驗證。

以 `0924283` 為基底的提交清單列於前一輪驗收紀錄；其後新增 `34b5b82`（完整驗收與手機探索），以及本次驗收紀錄提交（不列自身 hash）。

## 2026-11-11 06:21 ～ 2026-11-11 06:28（台北）

批次：`2026-11-10T22-21-15-882Z`。61 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-14.png) |
| UAT-15 | mobile | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T22-21-15-882Z/mobile/UAT-27.png) |

## 2026-11-11 07:15 ～ 2026-11-11 07:21（台北）

批次：`2026-11-10T23-15-39-095Z`。61 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-23.png) |
| UAT-24 | mobile | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-10T23-15-39-095Z/mobile/UAT-27.png) |

## 2026-11-11 08:08 ～ 2026-11-11 08:13（台北）

批次：`2026-11-11T00-08-16-739Z`。61 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-10.png) |
| UAT-11 | mobile | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T00-08-16-739Z/mobile/UAT-27.png) |

## 2026-11-11 09:16 ～ 2026-11-11 09:18（台北）

批次：`2026-11-11T01-16-32-215Z`。62 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T01-16-32-215Z/mobile/UAT-27.png) |

## 2026-11-11 10:17 ～ 2026-11-11 10:19（台北）

批次：`2026-11-11T02-17-34-167Z`。62 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T02-17-34-167Z/mobile/UAT-27.png) |

## 2026-11-11 10:20 完整驗收與手機新手探索

`node deployment/local/e2e.cjs`：桌面及手機 62/62 通過，逐案截圖見上一節。backend 15 suites / 189 tests、frontend 12 files / 98 tests、報告工具 5 tests 與兩端 build 通過；frontend lint 零錯誤、一項既有 Hook 警告。

新手機模擬帳號探索首次活動、AI、LINE 空群組、無群組核准及斷線復原，未發現新的待修問題，未處理瀏覽器例外為零。證據：[首次活動](evidence/exploration-2026-11-11T02-20-00-289Z/findings.json)、[企畫及 AI](evidence/first-plan-2026-11-11T02-20-03-345Z/findings.json)、[群組及廣播](evidence/groups-2026-11-11T02-20-06-093Z/findings.json)、[斷線復原](evidence/connectivity-2026-11-11T02-20-08-689Z/findings.json)。使用 emulator 與 LINE/AI mock；真實 LINE、AI、OAuth、HTTPS 及實體手機尚未驗證。本輪啟動服務已關閉。

以 `0924283` 為基底的提交清單如下；本驗收紀錄提交不列自身 hash。

- `93058f6` fix(UAT-22): distinguish activity load failures and preserve creation drafts for retry
- `95fd3b6` fix(UAT-23): recover failed message deletions and retain offline schedule edits
- `2f5b2a4` test(UAT-01,UAT-11,UAT-14): isolate server sockets and hold LINE sends until assertions finish
- `fd938af` fix(UAT-22): separate the primary retry action from the return link
- `f4657f0` fix(UAT-24): recover first-login profile failures and reject stale auth completions
- `ab495ab` docs(UAT-01–24): record 48-case acceptance and refresh portable delivery
- `1cf1084` test(UAT-01–24): exclude generated Playwright artifacts from source lint
- `595f592` fix(UAT-25): guide ungrouped plans before approval and reapproval
- `f24a9a6` fix(UAT-26): explain AI connection failures and preserve drafts for a single retry
- `9954352` test(UAT-21,UAT-25): add local acceptance entrypoint for group setup and approval guards
- `e461e71` fix(UAT-27): make organizer input text readable on light forms
- `2b9cc5f` test(UAT-25,UAT-26): capture first-plan approval and offline AI recovery exploration
- `51bd822` test(UAT-19): await successful schedule save before checking persisted time
- `8d1fdee` docs(UAT-01–27): record 54-case acceptance and incremental delivery
- `46e9d00` fix(UAT-28): recover LINE conversation loads and preserve reply delivery state
- `9de1592` fix(UAT-29): explain broadcast connection failures while preserving group drafts
- `def69fa` fix(UAT-30): validate per-group broadcast drafts before sending
- `82aa38f` docs(UAT-01-30): record full acceptance and mobile exploration
- `06c10c1` docs(UAT-01-30): record repeat acceptance and mobile exploration
- `5b4c540` docs(UAT-01-30): record repeat acceptance and novice exploration
- `fa0b60a` docs(UAT-01-30): record unsuccessful repeat acceptance
- `529322e` chore(UAT-01-30): ignore local delivery bundles
- `5c8bc55` fix(UAT-31): show recognizable group names in message plans
- `34b5b82` docs(UAT-01-31): record complete acceptance and mobile exploration
- `8f7ce0e` docs(UAT-01-31): record repeat acceptance and novice exploration

## 2026-11-11 10:21 ～ 2026-11-11 11:09（台北）

批次：`2026-11-11T02-21-56-983Z`。60 pass / 2 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-13.png) |
| UAT-14 | desktop | fail | Error: expect(locator).toBeChecked() failed Locator: getByRole('checkbox', { name: 'UAT 工作坊' }) Expected: checked Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-24.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-06.png) |
| UAT-07 | mobile | fail | Error: expect(locator).toBeVisible() failed Locator: getByRole('heading', { name: '群組', exact: true }) Expected: visible Timeout: 10000ms Error: element(s) not found Call log: | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-24.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T02-21-56-983Z/mobile/UAT-27.png) |

## 2026-11-11 11:17 ～ 2026-11-11 11:17（台北）

批次：`2026-11-11T03-17-07-141Z`。2 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T03-17-07-141Z/desktop/UAT-32.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T03-17-07-141Z/mobile/UAT-32.png) |

## 2026-11-11 11:19 ～ 2026-11-11 11:21（台北）

批次：`2026-11-11T03-19-02-493Z`。64 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-24.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T03-19-02-493Z/mobile/UAT-27.png) |

## 2026-11-11 11:22 完整驗收與新手探索

本輪先有 60/62：桌面 UAT-14 重整及手機 UAT-07 註冊時卡在「載入帳號中」。追蹤顯示 Auth 已回應，Firestore 帳號初始化尚未結束；未能確認此次 emulator 停滯的底層原因。新增 UAT-32 模擬帳號資料請求無回應，驗證使用者收到重試提示，恢復後正常進入。修復後 `node deployment/local/e2e.cjs` 完整 64/64 通過，逐案截圖見上一節；UAT-32 雙 viewport 單獨驗證亦通過。

backend 15 suites / 189 tests、frontend 12 files / 99 tests、報告工具 5 tests、兩端 build 通過；frontend lint 無錯誤、既有 Hook 警告一項；前端 build 有既有大型 bundle 警告。

手機新帳號探索：首次活動唯一 AI 規劃入口、LINE 空群組指引、未選群組無法核准、AI 與廣播離線草稿保留及重試均符合預期；未發現新問題，未處理瀏覽器例外為零。證據：[首次活動](evidence/exploration-2026-11-11T03-22-07-173Z/findings.json)、[首次企畫及 AI](evidence/first-plan-2026-11-11T03-22-10-440Z/findings.json)、[群組及廣播](evidence/groups-2026-11-11T03-22-13-424Z/findings.json)、[斷線復原](evidence/connectivity-2026-11-11T03-22-16-142Z/findings.json)。

僅驗證 Firebase emulator、LINE / AI mock 與 Chrome 手機模擬；真實 LINE、AI、OAuth、HTTPS 與實體手機尚未驗證。自啟動服務已停止。

以 `0924283` 為基底的提交清單如下，本次報告提交不列自身 hash：

- `93058f6` fix(UAT-22): distinguish activity load failures and preserve creation drafts for retry
- `95fd3b6` fix(UAT-23): recover failed message deletions and retain offline schedule edits
- `2f5b2a4` test(UAT-01,UAT-11,UAT-14): isolate server sockets and hold LINE sends until assertions finish
- `fd938af` fix(UAT-22): separate the primary retry action from the return link
- `f4657f0` fix(UAT-24): recover first-login profile failures and reject stale auth completions
- `ab495ab` docs(UAT-01–24): record 48-case acceptance and refresh portable delivery
- `1cf1084` test(UAT-01–24): exclude generated Playwright artifacts from source lint
- `595f592` fix(UAT-25): guide ungrouped plans before approval and reapproval
- `f24a9a6` fix(UAT-26): explain AI connection failures and preserve drafts for a single retry
- `9954352` test(UAT-21,UAT-25): add local acceptance entrypoint for group setup and approval guards
- `e461e71` fix(UAT-27): make organizer input text readable on light forms
- `2b9cc5f` test(UAT-25,UAT-26): capture first-plan approval and offline AI recovery exploration
- `51bd822` test(UAT-19): await successful schedule save before checking persisted time
- `8d1fdee` docs(UAT-01–27): record 54-case acceptance and incremental delivery
- `46e9d00` fix(UAT-28): recover LINE conversation loads and preserve reply delivery state
- `9de1592` fix(UAT-29): explain broadcast connection failures while preserving group drafts
- `def69fa` fix(UAT-30): validate per-group broadcast drafts before sending
- `82aa38f` docs(UAT-01-30): record full acceptance and mobile exploration
- `06c10c1` docs(UAT-01-30): record repeat acceptance and mobile exploration
- `5b4c540` docs(UAT-01-30): record repeat acceptance and novice exploration
- `fa0b60a` docs(UAT-01-30): record unsuccessful repeat acceptance
- `529322e` chore(UAT-01-30): ignore local delivery bundles
- `5c8bc55` fix(UAT-31): show recognizable group names in message plans
- `34b5b82` docs(UAT-01-31): record complete acceptance and mobile exploration
- `8f7ce0e` docs(UAT-01-31): record repeat acceptance and novice exploration
- `f2aba13` docs(UAT-01-31): record acceptance and novice exploration
- `65fa401` fix(UAT-32): recover stalled account initialization

## 2026-11-11 11:26 ～ 2026-11-11 12:18（台北）

批次：`2026-11-11T03-26-33-427Z`。63 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-13.png) |
| UAT-14 | desktop | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-24.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T03-26-33-427Z/mobile/UAT-27.png) |

## 2026-11-11 12:23 ～ 2026-11-11 12:23（台北）

批次：`2026-11-11T04-23-06-789Z`。2 pass / 0 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-06-789Z/desktop/UAT-14.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-06-789Z/mobile/UAT-14.png) |

## 2026-11-11 12:23 ～ 2026-11-11 13:12（台北）

批次：`2026-11-11T04-23-35-990Z`。64 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-24.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T04-23-35-990Z/mobile/UAT-27.png) |

## 2026-11-11 13:19 第七輪驗收與手機探索

本輪完整執行 `node deployment/local/e2e.cjs`：首次 63/64，桌面 UAT-14 等待發送中狀態逾時；trace 中測試執行有約 235 秒間斷，finally 成功釋放被保留的 LINE 模擬請求，原因未確定。未變更或弱化測試；UAT-14 隨後桌面與手機各一次通過，再完整重跑 64/64 通過。各次結果及截圖保留於前述逐案紀錄。

backend 15 suites / 189 tests、frontend 12 files / 99 tests、報告工具 5 tests 通過，兩端 build 通過；frontend lint 無錯誤、有既有 Hook 警告，前端 build 有既有大型 bundle 警告。

手機 390×844 新帳號探索：首次活動唯一 AI 規劃入口、空群組說明、未選群組不可核准、AI 和群組／廣播斷線後草稿保留及重試，均符合既有驗收；未捕獲瀏覽器例外，未發現新的待修問題。證據：[首次活動與空群組](evidence/exploration-2026-11-11T05-19-27-525Z/findings.json)、[首次企畫與 AI](evidence/first-plan-2026-11-11T05-19-30-892Z/findings.json)、[群組與廣播](evidence/groups-2026-11-11T05-19-33-982Z/findings.json)、[離線復原](evidence/connectivity-2026-11-11T05-19-36-747Z/findings.json)。

本機 Firebase emulator、LINE / AI mock 與 Chrome 手機模擬；真實 LINE、AI、OAuth、HTTPS 和實體手機未驗證。自啟服務已停止。增量提交清單沿用上一節，另有 `0088a53` docs(UAT-01-32): record acceptance and account recovery；本報告提交不列自身 hash。

## 2026-11-11 13:21 ～ 2026-11-11 13:23（台北）

批次：`2026-11-11T05-21-23-966Z`。64 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-24.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T05-21-23-966Z/mobile/UAT-27.png) |

## 2026-11-11 第八輪驗收與手機探索

完整執行 `node deployment/local/e2e.cjs`，桌面及手機共 64/64 通過；逐案結果與證據見上一節。UAT-21 的空群組指引、UAT-25 的未選群組禁止核准均在兩個 viewport 通過。backend 15 suites／189 tests、frontend 12 files／99 tests、報告工具 5 tests 通過，兩端 build 通過；frontend lint 0 errors、1 項既有 Hook 警告，build 有大型 bundle 警告。

手機 390×844 使用獨立新帳號探索首次活動、AI 規劃、未選群組、LINE 空狀態，以及活動、AI、群組與廣播斷線的回饋及重試；未捕獲瀏覽器例外，未發現新的待修問題。證據：[首次活動及空群組](evidence/exploration-2026-11-11T05-24-01-850Z/findings.json)、[企畫與 AI](evidence/first-plan-2026-11-11T05-24-04-658Z/findings.json)、[群組與廣播](evidence/groups-2026-11-11T05-24-07-331Z/findings.json)、[離線復原](evidence/connectivity-2026-11-11T05-24-09-887Z/findings.json)。

僅本機 Firebase emulator、LINE／AI mock 與系統 Chrome 模擬手機；真實 LINE、AI、OAuth、HTTPS 與實體手機尚未驗證。LIFF 的 default、no_group、share_unavailable 模擬情境涵蓋於 UAT-10；未檢查 LINE API Status 或 Developers Console。自行啟動的服務已關閉。

以 `0924283` 為基底的增量提交如下；本報告提交不列自身 hash，bundle HEAD 即包含它。

- `93058f6` fix(UAT-22): distinguish activity load failures and preserve creation drafts for retry
- `95fd3b6` fix(UAT-23): recover failed message deletions and retain offline schedule edits
- `2f5b2a4` test(UAT-01,UAT-11,UAT-14): isolate server sockets and hold LINE sends until assertions finish
- `fd938af` fix(UAT-22): separate the primary retry action from the return link
- `f4657f0` fix(UAT-24): recover first-login profile failures and reject stale auth completions
- `ab495ab` docs(UAT-01–24): record 48-case acceptance and refresh portable delivery
- `1cf1084` test(UAT-01–24): exclude generated Playwright artifacts from source lint
- `595f592` fix(UAT-25): guide ungrouped plans before approval and reapproval
- `f24a9a6` fix(UAT-26): explain AI connection failures and preserve drafts for a single retry
- `9954352` test(UAT-21,UAT-25): add local acceptance entrypoint for group setup and approval guards
- `e461e71` fix(UAT-27): make organizer input text readable on light forms
- `2b9cc5f` test(UAT-25,UAT-26): capture first-plan approval and offline AI recovery exploration
- `51bd822` test(UAT-19): await successful schedule save before checking persisted time
- `8d1fdee` docs(UAT-01–27): record 54-case acceptance and incremental delivery
- `46e9d00` fix(UAT-28): recover LINE conversation loads and preserve reply delivery state
- `9de1592` fix(UAT-29): explain broadcast connection failures while preserving group drafts
- `def69fa` fix(UAT-30): validate per-group broadcast drafts before sending
- `82aa38f` docs(UAT-01-30): record full acceptance and mobile exploration
- `06c10c1` docs(UAT-01-30): record repeat acceptance and mobile exploration
- `5b4c540` docs(UAT-01-30): record repeat acceptance and novice exploration
- `fa0b60a` docs(UAT-01-30): record unsuccessful repeat acceptance
- `529322e` chore(UAT-01-30): ignore local delivery bundles
- `5c8bc55` fix(UAT-31): show recognizable group names in message plans
- `34b5b82` docs(UAT-01-31): record complete acceptance and mobile exploration
- `8f7ce0e` docs(UAT-01-31): record repeat acceptance and novice exploration
- `f2aba13` docs(UAT-01-31): record acceptance and novice exploration
- `65fa401` fix(UAT-32): recover stalled account initialization
- `0088a53` docs(UAT-01-32): record acceptance and account recovery
- `9e66460` docs(UAT-01-32): record repeat acceptance and novice exploration

## 2026-11-11 13:25 ～ 2026-11-11 13:35（台北）

批次：`2026-11-11T05-25-58-896Z`。62 pass / 2 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-05.png) |
| UAT-06 | desktop | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-18.png) |
| UAT-19 | desktop | fail | Error: locator.click: Target page, context or browser has been closed Browser logs: <launching> /opt/google/chrome/chrome --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,DestroyProfileOnBrowserClose,HttpsUpgrades,HttpsFirstBalancedModeAutoEnable,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,AvoidCorsURLLoaderRestartOnRedirect,TcpPortRandomizationWin,OptimizationHints,NetworkTimeServiceQuerying,AimEnabled,PreconnectToSearch,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface,SkipListAccountsWithoutGaiaCookies --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --disable-updater-scheduler --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --enable-unsafe-swiftshader --edge-skip-compat-layer-relaunch --disable-stack-profiler --disable-infobars --disable-sync --do-not-de-elevate --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-s0gnoy --remote-debugging-pipe --no-startup-window <launched> pid=867 [pid=867][err] [1111/132729.867695:WARNING:chrome/app/chrome_main_linux.cc:84] Read channel stable from /opt/google/chrome/CHROME_VERSION_EXTRA [pid=867][err] [867:867:1111/132729.871079:ERROR:third_party/crashpad/crashpad/util/file/file_io_posix.cc:208] open /home/box/.config/google-chrome/Crash Reports/settings.dat: Read-only file system (30) | [截圖](無截圖（啟動失敗）) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-24.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T05-25-58-896Z/mobile/UAT-27.png) |

## 2026-11-11 13:39 ～ 2026-11-11 13:41（台北）

批次：`2026-11-11T05-39-45-518Z`。64 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-24.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T05-39-45-518Z/mobile/UAT-27.png) |

## 2026-11-11 第九輪驗收與手機探索

完整重跑 `node deployment/local/e2e.cjs`：32 旅程 × 桌面、手機，共 64/64 通過，UAT-21 空群組與 UAT-25 無群組不得核准均通過。前一輪 62/64：桌面 UAT-06 註冊等待逾時，UAT-19 的 Chrome 在 D-Bus 中斷後退出；未修改測試，完整重跑兩者均通過。逐案結果與截圖見上兩節。

backend 15 suites／189 tests、frontend 12 files／99 tests、報告工具 5 tests 與兩端 build 均通過；frontend lint 0 errors、1 項既有 Hook 警告，build 有大型 bundle 警告。

以獨立帳號及 390×844 手機 viewport 探索首次活動、AI 企畫、未選群組、LINE 空狀態與斷線重試，沒有新的待修發現或瀏覽器例外。證據：[首次活動及空群組](evidence/exploration-2026-11-11T05-42-16-392Z/findings.json)、[企畫與 AI](evidence/first-plan-2026-11-11T05-42-19-407Z/findings.json)、[群組與廣播](evidence/groups-2026-11-11T05-42-22-106Z/findings.json)、[離線復原](evidence/connectivity-2026-11-11T05-42-24-836Z/findings.json)。

使用 Firebase emulator、LINE／AI mock 與系統 Chrome 模擬手機；真實 LINE、AI、OAuth、HTTPS 與實體手機尚未驗證。自行啟動的服務已關閉。本輪以 `0924283` 為基底的既有增量提交清單見第八輪，另包含 `610e416`（第八輪驗收紀錄）；本報告提交本身的 hash 由 bundle HEAD 識別。

## 2026-11-11 13:44 ～ 2026-11-11 13:46（台北）

批次：`2026-11-11T05-44-22-888Z`。64 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-24.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T05-44-22-888Z/mobile/UAT-27.png) |

## 2026-11-11 第十輪驗收與手機探索

完整執行 `node deployment/local/e2e.cjs`：32 個旅程在桌面及手機共 64/64 通過，逐案結果與證據見上一節；UAT-21 空群組指引與 UAT-25 未選群組不可核准均通過。backend 15 suites／189 tests、frontend 12 files／99 tests、報告工具 5 tests 和兩端 build 通過。frontend lint 0 errors、1 項既有 Hook 警告；前端 build 有大型 bundle 警告。

使用 390×844 手機 viewport 與新帳號探索首次活動、AI 規劃、LINE 空群組、無群組核准、斷線訊息及草稿保留，未發現新的待修問題或未處理瀏覽器例外。證據：[首次活動及空群組](evidence/exploration-2026-11-11T05-46-55-927Z/findings.json)、[企畫及 AI](evidence/first-plan-2026-11-11T05-46-59-036Z/findings.json)、[群組與廣播](evidence/groups-2026-11-11T05-47-01-646Z/findings.json)、[斷線復原](evidence/connectivity-2026-11-11T05-47-04-049Z/findings.json)。

使用 Firebase emulator、LINE／AI mock 與系統 Chrome 模擬手機；真實 LINE、AI、OAuth、HTTPS 與實體手機尚未驗證。本輪啟動的服務已關閉。

以 `0924283` 為基底的增量提交如下；本驗收報告提交本身由 bundle HEAD 識別。

- `93058f6` fix(UAT-22): distinguish activity load failures and preserve creation drafts for retry
- `95fd3b6` fix(UAT-23): recover failed message deletions and retain offline schedule edits
- `2f5b2a4` test(UAT-01,UAT-11,UAT-14): isolate server sockets and hold LINE sends until assertions finish
- `fd938af` fix(UAT-22): separate the primary retry action from the return link
- `f4657f0` fix(UAT-24): recover first-login profile failures and reject stale auth completions
- `ab495ab` docs(UAT-01–24): record 48-case acceptance and refresh portable delivery
- `1cf1084` test(UAT-01–24): exclude generated Playwright artifacts from source lint
- `595f592` fix(UAT-25): guide ungrouped plans before approval and reapproval
- `f24a9a6` fix(UAT-26): explain AI connection failures and preserve drafts for a single retry
- `9954352` test(UAT-21,UAT-25): add local acceptance entrypoint for group setup and approval guards
- `e461e71` fix(UAT-27): make organizer input text readable on light forms
- `2b9cc5f` test(UAT-25,UAT-26): capture first-plan approval and offline AI recovery exploration
- `51bd822` test(UAT-19): await successful schedule save before checking persisted time
- `8d1fdee` docs(UAT-01–27): record 54-case acceptance and incremental delivery
- `46e9d00` fix(UAT-28): recover LINE conversation loads and preserve reply delivery state
- `9de1592` fix(UAT-29): explain broadcast connection failures while preserving group drafts
- `def69fa` fix(UAT-30): validate per-group broadcast drafts before sending
- `82aa38f` docs(UAT-01-30): record full acceptance and mobile exploration
- `06c10c1` docs(UAT-01-30): record repeat acceptance and mobile exploration
- `5b4c540` docs(UAT-01-30): record repeat acceptance and novice exploration
- `fa0b60a` docs(UAT-01-30): record unsuccessful repeat acceptance
- `529322e` chore(UAT-01-30): ignore local delivery bundles
- `5c8bc55` fix(UAT-31): show recognizable group names in message plans
- `34b5b82` docs(UAT-01-31): record complete acceptance and mobile exploration
- `8f7ce0e` docs(UAT-01-31): record repeat acceptance and novice exploration
- `f2aba13` docs(UAT-01-31): record acceptance and novice exploration
- `65fa401` fix(UAT-32): recover stalled account initialization
- `0088a53` docs(UAT-01-32): record acceptance and account recovery
- `9e66460` docs(UAT-01-32): record repeat acceptance and novice exploration
- `610e416` docs(UAT-01-32): record eighth acceptance and mobile exploration
- `6403c1d` docs(UAT-01-32): record ninth acceptance and mobile exploration

## 2026-11-11 13:48 ～ 2026-11-11 13:50（台北）

批次：`2026-11-11T05-48-45-453Z`。64 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-24.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T05-48-45-453Z/mobile/UAT-27.png) |

## 2026-11-11 第十一輪驗收與手機探索

完整執行 `node deployment/local/e2e.cjs`：32 個旅程在桌面及手機共 64/64 通過，逐案結果及截圖見上一節；UAT-21 群組空狀態及 UAT-25 未選群組不可核准均在兩種尺寸通過。backend 15 suites／189 tests、frontend 12 files／99 tests、報告工具 5 tests、兩端 build 與 frontend lint 通過；lint 有一項既有 Hook 警告，frontend build 有大型 bundle 警告。

以 390×844 手機尺寸及新帳號操作首次註冊、建立活動、AI 規劃、LINE 群組空狀態、企畫核准與斷線復原。檢視空群組及未選群組畫面，指引和下一步可辨識；未發現新增待修問題或未處理瀏覽器例外。證據：[首次活動與群組](evidence/exploration-2026-11-11T05-51-09-519Z/findings.json)、[企畫與 AI](evidence/first-plan-2026-11-11T05-51-12-634Z/findings.json)、[群組與廣播](evidence/groups-2026-11-11T05-51-15-304Z/findings.json)、[斷線復原](evidence/connectivity-2026-11-11T05-51-29-879Z/findings.json)。

本輪使用 Firebase emulator、LINE／AI mock 與系統 Chrome 模擬手機；真實 LINE、AI、OAuth、HTTPS 與實體手機尚未驗證。自啟動服務均已關閉。上一輪提交清單以 `0924283` 為基底，本輪之前另有 `9b982d6` docs(UAT-01-32): record tenth acceptance and mobile exploration；本報告提交由 bundle HEAD 識別。

## 2026-11-11 17:20 ～ 2026-11-11 17:22（台北）

批次：`2026-11-11T09-20-23-088Z`。64 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-24.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T09-20-23-088Z/mobile/UAT-27.png) |

## 2026-11-11 17:20–17:23 驗收與手機新手探索（台北）

`node deployment/local/e2e.cjs` 完整執行 32 個旅程於桌面及手機，共 64/64 通過；逐案結果與截圖見上一節。UAT-21 空群組指引、UAT-25 未選群組禁止核准與重新核准兩種尺寸均通過。backend 15 suites／189 tests、frontend 12 files／99 tests、報告工具 5 tests、兩端 build 與 frontend lint 通過；lint 有一項既有 Hook 警告，前端 build 有大型 bundle 警告。

以 390×844 手機 viewport 和新帳號探索註冊、第一個活動、AI 規劃、LINE 空群組、未選群組核准、錯誤訊息與草稿重試；未發現新增待修問題或未處理瀏覽器例外。證據：[首次活動及空群組](evidence/exploration-2026-11-11T09-22-51-487Z/findings.json)、[企畫與 AI](evidence/first-plan-2026-11-11T09-22-54-305Z/findings.json)、[群組與廣播](evidence/groups-2026-11-11T09-22-56-864Z/findings.json)、[斷線復原](evidence/connectivity-2026-11-11T09-22-59-374Z/findings.json)。

本輪採 Firebase emulator、LINE／AI mock、系統 Chrome 模擬手機；真實 LINE、AI、OAuth、HTTPS 與實體手機未驗證。LIFF default、no_group、share_unavailable 模擬情境由 UAT-10 涵蓋；未檢查 LINE API Status 或 Developers Console。自啟服務已關閉。

以 `0924283` 為基底的既有增量提交如下；本報告提交本身由 bundle HEAD 識別。

- `93058f6` fix(UAT-22): distinguish activity load failures and preserve creation drafts for retry
- `95fd3b6` fix(UAT-23): recover failed message deletions and retain offline schedule edits
- `2f5b2a4` test(UAT-01,UAT-11,UAT-14): isolate server sockets and hold LINE sends until assertions finish
- `fd938af` fix(UAT-22): separate the primary retry action from the return link
- `f4657f0` fix(UAT-24): recover first-login profile failures and reject stale auth completions
- `ab495ab` docs(UAT-01–24): record 48-case acceptance and refresh portable delivery
- `1cf1084` test(UAT-01–24): exclude generated Playwright artifacts from source lint
- `595f592` fix(UAT-25): guide ungrouped plans before approval and reapproval
- `f24a9a6` fix(UAT-26): explain AI connection failures and preserve drafts for a single retry
- `9954352` test(UAT-21,UAT-25): add local acceptance entrypoint for group setup and approval guards
- `e461e71` fix(UAT-27): make organizer input text readable on light forms
- `2b9cc5f` test(UAT-25,UAT-26): capture first-plan approval and offline AI recovery exploration
- `51bd822` test(UAT-19): await successful schedule save before checking persisted time
- `8d1fdee` docs(UAT-01–27): record 54-case acceptance and incremental delivery
- `46e9d00` fix(UAT-28): recover LINE conversation loads and preserve reply delivery state
- `9de1592` fix(UAT-29): explain broadcast connection failures while preserving group drafts
- `def69fa` fix(UAT-30): validate per-group broadcast drafts before sending
- `82aa38f` docs(UAT-01-30): record full acceptance and mobile exploration
- `06c10c1` docs(UAT-01-30): record repeat acceptance and mobile exploration
- `5b4c540` docs(UAT-01-30): record repeat acceptance and novice exploration
- `fa0b60a` docs(UAT-01-30): record unsuccessful repeat acceptance
- `529322e` chore(UAT-01-30): ignore local delivery bundles
- `5c8bc55` fix(UAT-31): show recognizable group names in message plans
- `34b5b82` docs(UAT-01-31): record complete acceptance and mobile exploration
- `8f7ce0e` docs(UAT-01-31): record repeat acceptance and novice exploration
- `f2aba13` docs(UAT-01-31): record acceptance and novice exploration
- `65fa401` fix(UAT-32): recover stalled account initialization
- `0088a53` docs(UAT-01-32): record acceptance and account recovery
- `9e66460` docs(UAT-01-32): record repeat acceptance and novice exploration
- `610e416` docs(UAT-01-32): record eighth acceptance and mobile exploration
- `6403c1d` docs(UAT-01-32): record ninth acceptance and mobile exploration
- `9b982d6` docs(UAT-01-32): record tenth acceptance and mobile exploration
- `7195688` docs(UAT-01-32): record eleventh acceptance and novice exploration

## 2026-11-11 17:24 ～ 2026-11-11 17:29（台北）

批次：`2026-11-11T09-24-39-340Z`。63 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-23.png) |
| UAT-24 | desktop | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-24.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T09-24-39-340Z/mobile/UAT-27.png) |

## 2026-11-11 18:12 ～ 2026-11-11 18:15（台北）

批次：`2026-11-11T10-12-50-088Z`。63 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | fail | Error: locator.click: Target page, context or browser has been closed Browser logs: <launching> /opt/google/chrome/chrome --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,DestroyProfileOnBrowserClose,HttpsUpgrades,HttpsFirstBalancedModeAutoEnable,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,AvoidCorsURLLoaderRestartOnRedirect,TcpPortRandomizationWin,OptimizationHints,NetworkTimeServiceQuerying,AimEnabled,PreconnectToSearch,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface,SkipListAccountsWithoutGaiaCookies --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --disable-updater-scheduler --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --enable-unsafe-swiftshader --edge-skip-compat-layer-relaunch --disable-stack-profiler --disable-infobars --disable-sync --do-not-de-elevate --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-SMDiuB --remote-debugging-pipe --no-startup-window <launched> pid=152 [pid=152][err] [1111/181253.239758:WARNING:chrome/app/chrome_main_linux.cc:84] Read channel stable from /opt/google/chrome/CHROME_VERSION_EXTRA [pid=152][err] [152:152:1111/181253.268656:ERROR:third_party/crashpad/crashpad/util/file/file_io_posix.cc:208] open /home/box/.config/google-chrome/Crash Reports/settings.dat: Read-only file system (30) | [截圖](無截圖（啟動失敗）) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-24.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T10-12-50-088Z/mobile/UAT-27.png) |

## 2026-11-11 18:17 ～ 2026-11-11 18:21（台北）

批次：`2026-11-11T10-17-47-131Z`。63 pass / 1 fail / 0 blocked；可試用：false。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-24.png) |
| UAT-32 | mobile | fail | Test timeout of 45000ms exceeded. | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T10-17-47-131Z/mobile/UAT-27.png) |

## 2026-11-11 18:21 ～ 2026-11-11 18:28（台北）

批次：`2026-11-11T10-21-43-408Z`。64 pass / 0 fail / 0 blocked；可試用：true。

| 案例 | Viewport | 結果 | 失敗原因 | 證據 |
| --- | --- | --- | --- | --- |
| UAT-31 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-31.png) |
| UAT-28 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-28.png) |
| UAT-29 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-29.png) |
| UAT-30 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-30.png) |
| UAT-01 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-01.png) |
| UAT-02 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-02.png) |
| UAT-03 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-03.png) |
| UAT-04 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-04.png) |
| UAT-05 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-05.png) |
| UAT-06 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-06.png) |
| UAT-07 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-07.png) |
| UAT-08 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-08.png) |
| UAT-09 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-09.png) |
| UAT-10 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-10.png) |
| UAT-11 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-11.png) |
| UAT-12 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-12.png) |
| UAT-13 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-13.png) |
| UAT-14 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-14.png) |
| UAT-15 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-15.png) |
| UAT-16 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-16.png) |
| UAT-17 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-17.png) |
| UAT-18 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-18.png) |
| UAT-19 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-19.png) |
| UAT-20 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-20.png) |
| UAT-21 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-21.png) |
| UAT-22 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-22.png) |
| UAT-23 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-23.png) |
| UAT-24 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-24.png) |
| UAT-32 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-32.png) |
| UAT-25 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-25.png) |
| UAT-26 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-26.png) |
| UAT-27 | desktop | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/desktop/UAT-27.png) |
| UAT-31 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-31.png) |
| UAT-28 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-28.png) |
| UAT-29 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-29.png) |
| UAT-30 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-30.png) |
| UAT-01 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-01.png) |
| UAT-02 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-02.png) |
| UAT-03 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-03.png) |
| UAT-04 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-04.png) |
| UAT-05 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-05.png) |
| UAT-06 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-06.png) |
| UAT-07 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-07.png) |
| UAT-08 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-08.png) |
| UAT-09 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-09.png) |
| UAT-10 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-10.png) |
| UAT-11 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-11.png) |
| UAT-12 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-12.png) |
| UAT-13 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-13.png) |
| UAT-14 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-14.png) |
| UAT-15 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-15.png) |
| UAT-16 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-16.png) |
| UAT-17 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-17.png) |
| UAT-18 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-18.png) |
| UAT-19 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-19.png) |
| UAT-20 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-20.png) |
| UAT-21 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-21.png) |
| UAT-22 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-22.png) |
| UAT-23 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-23.png) |
| UAT-24 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-24.png) |
| UAT-32 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-32.png) |
| UAT-25 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-25.png) |
| UAT-26 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-26.png) |
| UAT-27 | mobile | pass | — | [截圖](evidence/2026-11-11T10-21-43-408Z/mobile/UAT-27.png) |

## 2026-11-11 本輪重跑與手機新手探索（台北）

完整 `node deployment/local/e2e.cjs` 最終 64/64 通過，32 個旅程各於桌面及手機執行；逐案截圖見上一節。先前三次完整執行均為 63/64：桌面 UAT-24 重試後等待群組頁超時、桌面 UAT-31 的 Chrome D-Bus 中斷、手機 UAT-32 等待帳號錯誤提示時整體測試超時；後續完整重跑各案例均通過，逾時的根因未確定。逐次失敗與證據保留於本報告。

後端 15 suites／189 tests 和 build、前端 12 files／99 tests、lint 和 build、報告工具 5 tests 均通過；lint 有既有 Hook 警告，build 有大型 bundle 警告。使用 Firebase emulator、LINE／AI mock 和系統 Chrome 模擬手機；真實 LINE、AI、OAuth、HTTPS 與實體手機未驗證。

390×844 新帳號探索首次活動、AI 企畫、無群組核准提示、LINE 空狀態與斷線復原，沒有新增待修問題或未處理瀏覽器例外。證據：[首次活動與空群組](evidence/exploration-2026-11-11T10-32-59-883Z/findings.json)、[首次企畫與 AI](evidence/first-plan-2026-11-11T10-33-04-708Z/findings.json)、[群組與廣播](evidence/groups-2026-11-11T10-33-07-648Z/findings.json)、[斷線復原](evidence/connectivity-2026-11-11T10-33-10-267Z/findings.json)。自啟服務已關閉。

以 `0924283` 為基底的提交清單如下；本報告提交以 bundle HEAD 識別。

- 93058f6 fix(UAT-22): distinguish activity load failures and preserve creation drafts for retry
- 95fd3b6 fix(UAT-23): recover failed message deletions and retain offline schedule edits
- 2f5b2a4 test(UAT-01,UAT-11,UAT-14): isolate server sockets and hold LINE sends until assertions finish
- fd938af fix(UAT-22): separate the primary retry action from the return link
- f4657f0 fix(UAT-24): recover first-login profile failures and reject stale auth completions
- ab495ab docs(UAT-01–24): record 48-case acceptance and refresh portable delivery
- 1cf1084 test(UAT-01–24): exclude generated Playwright artifacts from source lint
- 595f592 fix(UAT-25): guide ungrouped plans before approval and reapproval
- f24a9a6 fix(UAT-26): explain AI connection failures and preserve drafts for a single retry
- 9954352 test(UAT-21,UAT-25): add local acceptance entrypoint for group setup and approval guards
- e461e71 fix(UAT-27): make organizer input text readable on light forms
- 2b9cc5f test(UAT-25,UAT-26): capture first-plan approval and offline AI recovery exploration
- 51bd822 test(UAT-19): await successful schedule save before checking persisted time
- 8d1fdee docs(UAT-01–27): record 54-case acceptance and incremental delivery
- 46e9d00 fix(UAT-28): recover LINE conversation loads and preserve reply delivery state
- 9de1592 fix(UAT-29): explain broadcast connection failures while preserving group drafts
- def69fa fix(UAT-30): validate per-group broadcast drafts before sending
- 82aa38f docs(UAT-01-30): record full acceptance and mobile exploration
- 06c10c1 docs(UAT-01-30): record repeat acceptance and mobile exploration
- 5b4c540 docs(UAT-01-30): record repeat acceptance and novice exploration
- fa0b60a docs(UAT-01-30): record unsuccessful repeat acceptance
- 529322e chore(UAT-01-30): ignore local delivery bundles
- 5c8bc55 fix(UAT-31): show recognizable group names in message plans
- 34b5b82 docs(UAT-01-31): record complete acceptance and mobile exploration
- 8f7ce0e docs(UAT-01-31): record repeat acceptance and novice exploration
- f2aba13 docs(UAT-01-31): record acceptance and novice exploration
- 65fa401 fix(UAT-32): recover stalled account initialization
- 0088a53 docs(UAT-01-32): record acceptance and account recovery
- 9e66460 docs(UAT-01-32): record repeat acceptance and novice exploration
- 610e416 docs(UAT-01-32): record eighth acceptance and mobile exploration
- 6403c1d docs(UAT-01-32): record ninth acceptance and mobile exploration
- 9b982d6 docs(UAT-01-32): record tenth acceptance and mobile exploration
- 7195688 docs(UAT-01-32): record eleventh acceptance and novice exploration
- 238c2ab docs(UAT-01-32): record acceptance and mobile novice exploration
