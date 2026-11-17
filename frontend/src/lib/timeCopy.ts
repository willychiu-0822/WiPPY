/** Shared wording so schedule fields stay consistent across the product. */
export const SEND_AT_LABEL = '發送時間（台北時間）';
export const SEND_AT_ISO_EXAMPLE = '例：明天上午 10 點';

const TAIPEI = 'Asia/Taipei';

/** Format an instant as a datetime-local value in Taipei time. */
export function taipeiDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TAIPEI,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
}

/** Read a datetime-local value as Taipei time and return an ISO string with +08:00. */
export function fromTaipeiLocal(value: string) {
  if (!value) return '';
  const iso = value.length === 16 ? `${value}:00` : value;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(iso)) return '';
  const stamped = `${iso}+08:00`;
  return Number.isFinite(Date.parse(stamped)) ? stamped : '';
}
