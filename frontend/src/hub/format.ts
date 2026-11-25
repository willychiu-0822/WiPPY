import type { ActionResult } from './hubApi';
import { explainKnownCode, isPlainChinese, plain, type HelperNotice } from '../lib/helperCopy';

export function describeResult(r: ActionResult): HelperNotice {
  if (r.status === 'done') return plain(r.replayed ? '已完成（這次跟上次一樣，沒有再做一次）' : '已完成');
  if (r.status === 'queued') return plain('已先排好，系統會自動再試。你可以先做別的事。');
  const detail = r.detail?.trim() ?? '';
  const mapped = explainKnownCode(r.code);
  const message = mapped ?? (detail && isPlainChinese(detail) ? detail : '這次沒有完成。請檢查內容後再送一次。');
  const raw = [r.status, r.code, detail].filter(Boolean).join(' — ');
  if (mapped || r.code || (detail && !isPlainChinese(detail))) {
    console.warn('[wippy] raw error', raw);
    return { message, raw };
  }
  return plain(message);
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
}

export function mcpUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base.replace(/\/$/, '')}/api/hub/mcp`;
}
