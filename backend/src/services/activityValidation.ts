export class ActivityInputError extends Error {}

export function validateMessageContent(content: unknown): void {
  if (typeof content !== 'string' || !content.trim()) throw new ActivityInputError('訊息內容不可為空');
  if (content.length > 5000) throw new ActivityInputError('訊息內容不可超過 5000 字');
}

export function validateScheduledTime(value: unknown): void {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(value)
    || !Number.isFinite(Date.parse(value))) throw new ActivityInputError('請輸入有效的 ISO 發送時間');
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) {
    throw new ActivityInputError('請輸入有效的 ISO 發送時間');
  }
}
