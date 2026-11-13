import { formatInTimeZone } from 'date-fns-tz';

export const HUB_TZ = 'Asia/Taipei';

export function taipeiDateKey(date: Date): string {
  return formatInTimeZone(date, HUB_TZ, 'yyyyMMdd');
}

export function taipeiMonthKey(date: Date): string {
  return formatInTimeZone(date, HUB_TZ, 'yyyyMM');
}

/** Same string format the activity scheduler compares against (e.g. 2026-11-04T18:30:00+08:00). */
export function taipeiIso(date: Date): string {
  return formatInTimeZone(date, HUB_TZ, "yyyy-MM-dd'T'HH:mm:ssxxx");
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}
