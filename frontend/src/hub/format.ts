import type { ActionResult } from './hubApi';

export function describeResult(r: ActionResult): string {
  if (r.status === 'done') return r.replayed ? '已完成（重複的要求，未再執行）' : '已完成';
  if (r.status === 'queued') return '已排入自動重試';
  return `${r.status}：${r.code ?? ''}${r.detail ? ` — ${r.detail}` : ''}`;
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
