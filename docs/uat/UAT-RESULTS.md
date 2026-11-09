# WiPPY UAT 執行結果

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
