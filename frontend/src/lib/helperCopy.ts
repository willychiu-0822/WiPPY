import { getErrorMessage } from './apiError';

/** What the owner sees. The raw code stays in `raw` for a collapsed detail and the console. */
export type HelperNotice = {
  message: string;
  raw: string | null;
};

export const PLAN_BUTTON_LABEL = '請小幫手安排第一則訊息';
export const OFFLINE_CHAT_MESSAGE = '沒有連上小幫手。請檢查網路後再按一次送出，剛才打的字還在。';

export function plain(message: string): HelperNotice {
  return { message, raw: null };
}

const CODE_HELP: Array<{ code: string; message: string }> = [
  { code: 'max_llm_calls_exceeded', message: '小幫手這次試太多次了。請把想說的話寫短一點，稍後再送出一次。' },
  { code: 'llm_rate_limit_error', message: '小幫手現在比較忙。請等一分鐘再送出。' },
  { code: 'llm_not_configured', message: '重點整理還沒設定好。請先看原來的對話，或請協助你安裝的人檢查設定。' },
  { code: 'llm_daily_limit', message: '今天的自動整理次數用完了。請先看原來的對話，明天會恢復。' },
  { code: 'cloud_run_terminated', message: '小幫手做到一半被中斷了。請再送出一次。' },
  { code: 'stuck_run_timeout', message: '小幫手等太久沒有完成。請再送出一次。' },
  { code: 'context_load_error', message: '讀不到這個活動的資料。請回到活動頁重新打開，再試一次。' },
  { code: 'persistence_error', message: '這次沒能存下來。請檢查網路後再送出一次。' },
  { code: 'no_intent_matched', message: '小幫手沒聽懂這句話。請用白話再說一次你想做的事。' },
  { code: 'url_requires_login', message: '這個連結要登入才打得開，群組裡的人會看不到。請改貼一個不用登入就能打開的連結。' },
  { code: 'url_private_address', message: '這個網址在內部網路，沒辦法幫你發送。請改用公開網址。' },
  { code: 'line_quota_exhausted', message: '這個月的 LINE 發送額度用完了。請等下個月，或到 LINE 官方帳號提高額度。' },
  { code: 'line_quota_reserve', message: '這個月的 LINE 額度快用完，剩下的要留給重要提醒。請減少發送，或等下個月。' },
  { code: 'line_not_configured', message: 'LINE 還沒有設定完成，所以發不出去。請聯絡幫你安裝 WiPPY 的人。' },
  { code: 'account_not_allowed', message: '這個帳號還沒有使用權限。請用擁有者建立的帳號登入。' },
  { code: 'owner_not_configured', message: 'WiPPY 還沒有設定擁有者。請聯絡幫你安裝的人。' },
  { code: 'alert_group_not_set', message: '還沒有指定提醒要發到哪個群組。請先到設定頁選好預警群組。' },
  { code: 'group_not_allowed', message: '這個群組還沒有交給小幫手。請先到群組頁打開，再試一次。' },
  { code: 'agent_daily_limit', message: '今天的發送次數用完了。請明天再發，或到小幫手名單調高每日上限。' },
  { code: 'retries_exhausted', message: '已經自動重試過，還是沒成功。請檢查內容後再手動送一次。' },
  { code: 'url_unreachable', message: '現在打不開這個網址。請確認連結正確，稍後再試。' },
  { code: 'url_wrong_type', message: '這個連結不是指定的檔案。請貼上直接打開檔案的網址。' },
  { code: 'preview_required', message: '圖片太大，需要另外一張較小的預覽圖。請補上預覽圖網址。' },
  { code: 'send_at_in_past', message: '發送時間已經過了。請改成未來的時間。' },
  { code: 'invalid_api_key', message: '連線金鑰不正確。請重新複製金鑰後再試。' },
  { code: 'retry_scheduled', message: '這次沒送成，系統會自動再試。你可以先做別的事。' },
  { code: 'account_disabled', message: '這個帳號已停用。請擁有者重新啟用後再登入。' },
  { code: 'agent_disabled', message: '這個小幫手已停用。請先重新啟用，再試一次。' },
  { code: 'invalid_request', message: '這次送出的內容不完整。請檢查必填欄位後再送一次。' },
  { code: 'invalid_params', message: '有欄位填得不對。請依欄位說明修正後再送一次。' },
  { code: 'invalid_output', message: '整理出來的內容無法使用。請先看原來的對話。' },
  { code: 'invalid_token', message: '登入已過期。請重新登入後再試。' },
  { code: 'internal_error', message: '系統暫時出錯。請稍後再試；若一直發生，請把下方細節轉給協助你的人。' },
  { code: 'unauthenticated', message: '登入狀態失效了。請重新登入後再試。' },
  { code: 'repair_failed', message: '小幫手沒能把回覆整理好。請換個說法再送出一次。' },
  { code: 'url_not_https', message: '連結必須以 https:// 開頭。請換一個安全連結再送一次。' },
  { code: 'url_too_long', message: '網址太長了。請改用較短的連結。' },
  { code: 'url_too_large', message: '檔案太大，沒辦法發送。請換一個較小的檔案。' },
  { code: 'url_timeout', message: '對方網站太久沒有回應。請稍後再試一次。' },
  { code: 'url_invalid', message: '網址格式不對。請貼上完整、以 https:// 開頭的連結。' },
  { code: 'line_error', message: 'LINE 暫時沒有收下這則訊息。請稍後再試一次。' },
  { code: 'auth_error', message: '登入沒有成功。請重新登入後再試。' },
  { code: 'llm_error', message: '這次沒能整理重點。請先看原來的對話，稍後再打開一次。' },
  { code: 'forbidden', message: '你沒有權限做這件事。請用擁有者帳號操作。' },
  { code: 'not_found', message: '找不到這一筆。請重新整理頁面後再試。' },
  { code: 'no_text', message: '這批訊息沒有文字，所以沒有整理重點。請直接看下面的對話。' },
].sort((a, b) => b.code.length - a.code.length);

const PHRASES: Array<{ test: RegExp; message: string }> = [
  { test: /missing authorization header|^not authenticated$/i, message: '登入狀態失效了。請重新登入後再試。' },
  { test: /invalid or expired token/i, message: '登入已過期。請重新登入後再試。' },
  { test: /invalid api key/i, message: '連線金鑰不正確。請重新複製金鑰後再試。' },
  { test: /authentication failed/i, message: '登入沒有成功。請重新登入後再試。' },
  { test: /^forbidden$/i, message: '你沒有權限做這件事。請用擁有者帳號操作。' },
  { test: /internal error/i, message: '系統暫時出錯。請稍後再試；若一直發生，請把下方細節轉給協助你的人。' },
  { test: /^HTTP \d+$/i, message: '連線沒有成功。請稍後再試一次。' },
  { test: /activity not found/i, message: '找不到這個活動。請回到活動列表重新打開。' },
];

const STATUS_LABEL: Record<string, string> = {
  queued: '排隊中',
  running: '處理中',
  failed: '沒成功',
  sent: '已送出',
  completed: '已完成',
  done: '已完成',
  pending: '等待中',
  retrying: '再試一次',
  blocked: '先暫停',
  invalid: '需要修正',
  delivered_to_inbox: '已放進待辦',
  skipped_too_large: '檔案太大，已略過',
  open: '待處理',
  success: '成功',
  info: '提醒',
  warning: '注意',
  critical: '緊急',
};

const MESSAGE_KIND: Record<string, string> = {
  text: '文字',
  image: '圖片',
  video: '影片',
  audio: '語音',
  file: '檔案',
  sticker: '貼圖',
  location: '位置',
};

export function explainKnownCode(text: string | null | undefined): string | null {
  if (!text) return null;
  const hit = CODE_HELP.find((item) => text.includes(item.code));
  return hit?.message ?? null;
}

export function isPlainChinese(text: string): boolean {
  if (!/[\u3400-\u9fff]/.test(text)) return false;
  if (/\b(https?:\/\/|HTTP|webhook|regex|mcp|api key|token|agent|llm)\b/i.test(text)) return false;
  if (/[a-z]+_[a-z0-9_]+/i.test(text)) return false;
  return true;
}

function remember(raw: string) {
  console.warn('[wippy] raw error', raw);
}

export function explainRaw(raw: string | null | undefined, fallback: string): HelperNotice {
  const text = (raw ?? '').replace(/^Error:\s*/i, '').trim();
  if (!text) return plain(fallback);
  const mapped = explainKnownCode(text);
  if (mapped) {
    remember(text);
    return { message: mapped, raw: text };
  }
  const phrase = PHRASES.find((item) => item.test.test(text));
  if (phrase) {
    remember(text);
    return { message: phrase.message, raw: text };
  }
  if (isPlainChinese(text)) return plain(text);
  remember(text);
  return { message: fallback, raw: text };
}

export function explainError(error: unknown, fallback: string): HelperNotice {
  const code = error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code
    : null;
  const message = getErrorMessage(error, '');
  if (code) {
    const mapped = explainKnownCode(code);
    if (mapped) {
      const raw = [code, message].filter(Boolean).join(' — ');
      remember(raw);
      return { message: mapped, raw };
    }
  }
  if (!message) return plain(fallback);
  return explainRaw(message, fallback);
}

/** Visible sentence for a thrown error. The raw value is logged, not returned. */
export function shownError(error: unknown, fallback: string): string {
  return explainError(error, fallback).message;
}

export function statusLabel(status: string | null | undefined): string {
  const value = (status ?? '').trim();
  if (!value) return '';
  if (STATUS_LABEL[value]) return STATUS_LABEL[value];
  if (isPlainChinese(value)) return value;
  return '需要看一下';
}

export function messageKindLabel(type: string | null | undefined): string {
  return MESSAGE_KIND[type ?? ''] ?? '檔案';
}
