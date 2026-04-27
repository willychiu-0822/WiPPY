# LLM 訊息產出格式規範

## 目的
本文件定義 LLM 為活動排程系統產出推播訊息時應使用的 JSON 格式。

## 產出格式

當用戶要求產生排程訊息時，請輸出以下 JSON 陣列格式：

```json
[
  {
    "content": "訊息內容文字",
    "targetGroups": ["all"],
    "triggerValue": "2026-05-10T10:00:00+08:00",
    "sequenceOrder": 1
  },
  {
    "content": "第二則訊息",
    "targetGroups": ["group_id_1", "group_id_2"],
    "triggerValue": "2026-05-10T14:30:00+08:00",
    "sequenceOrder": 2
  }
]
```

## 欄位說明

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `content` | string | ✅ | 推播訊息的文字內容。應該簡潔、清楚、符合活動主題 |
| `targetGroups` | string[] | ✅ | 目標群組。`["all"]` 表示所有群組，或填入特定的 LINE group ID |
| `triggerValue` | string (ISO 8601) | ✅ | **排程執行時間**。格式必須是 `YYYY-MM-DDTHH:mm:ss+08:00`（含時區）。系統會在此時間或之後執行推播 |
| `sequenceOrder` | number | ✅ | 訊息順序編號。從 `1` 開始遞增。用於控制多則訊息的發送順序 |

## 觸發與執行條件

系統 Scheduler 會定時檢查資料庫，**只有同時符合以下條件**的訊息才會被執行：

1. ✅ `status` = `"pending"` — 尚未發送
2. ✅ `triggerType` = `"scheduled"` — 排程類型
3. ✅ `reviewStatus` = `"approved"` — **已通過審核**（關鍵）
4. ✅ `triggerValue` ≤ **現在時間** — 到達排程時間
5. ✅ `processingAt` = `null` — 未被佔用（去重鎖）

一旦條件符合，系統會：
- 推送訊息至 LINE 群組
- 更新 `status` → `"sent"` 或 `"failed"`
- 記錄日誌到 `sendLogs`

## 時間格式說明

**正確範例：**
- `2026-05-10T10:00:00+08:00` ✅ 東半球標準時間（台灣）
- `2026-05-10T10:00:00+09:00` ✅ 日本時間
- `2026-05-10T02:00:00Z` ✅ UTC

**錯誤範例：**
- `2026-05-10 10:00:00` ❌ 缺少時區資訊
- `2026-05-10T10:00:00` ❌ 缺少時區資訊
- `05/10/2026 10:00:00` ❌ 格式錯誤

## 約束與注意事項

1. **訊息內容** — 不超過 LINE 單則訊息的限制（通常 2000 字內）
2. **群組篩選** — 如果填入特定 group ID，請確保該群組存在且為活躍狀態
3. **時間順序** — 建議 `triggerValue` 遞增排列，以符合業務邏輯
4. **審核流程** — 產出後需待人工或自動流程將 `reviewStatus` 改為 `approved` 才會執行
5. **時區** — 務必確保時區正確，避免排程執行時間偏差

## 完整 Firestore 文件結構

訊息寫入到 Firestore 時的完整結構（自動設定的欄位會由 Backend 補上）：

```json
{
  "content": "訊息內容文字",
  "targetGroups": ["all"],
  "triggerType": "scheduled",
  "triggerValue": "2026-05-10T10:00:00+08:00",
  "sequenceOrder": 1,
  
  "status": "pending",
  "reviewStatus": "approved",
  "processingAt": null,
  
  "generatedByAgent": true,
  "agentSessionId": "session_xxx",
  
  "createdAt": "2026-04-27T12:00:00+08:00",
  "updatedAt": "2026-04-27T12:00:00+08:00"
}
```

**說明：**
- LLM 只需產出 `content`, `targetGroups`, `triggerValue`, `sequenceOrder`
- 其他欄位由 Backend 自動補上

## 集成流程

1. **LLM 產出** → 根據本規範輸出 JSON 陣列
2. **Backend 解析** → `agentPlanService.ts` 提取 JSON 並驗證
3. **Firestore 寫入** → 存入 `activities/{activityId}/activityMessages/`
4. **人工審核** → 更新 `reviewStatus` = `"approved"`
5. **自動推播** → Scheduler tick 時檢查條件，符合即推送至 LINE

## 範例場景

**場景：** 產出 7 天內的每日提醒訊息

```json
[
  {
    "content": "嗨！記得今天完成你的運動計畫喔 💪",
    "targetGroups": ["all"],
    "triggerValue": "2026-05-11T08:00:00+08:00",
    "sequenceOrder": 1
  },
  {
    "content": "明天也要加油！運動完後別忘記記錄感受 😊",
    "targetGroups": ["all"],
    "triggerValue": "2026-05-12T08:00:00+08:00",
    "sequenceOrder": 2
  },
  {
    "content": "已經堅持 3 天了！繼續保持 🔥",
    "targetGroups": ["all"],
    "triggerValue": "2026-05-13T08:00:00+08:00",
    "sequenceOrder": 3
  }
]
```

---

**最後更新：** 2026-04-27
