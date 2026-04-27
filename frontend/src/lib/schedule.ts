import type { Foundation, Wish, Slot, TimeBlock } from '../types';

/**
 * Convert "HH:mm" to total minutes since midnight.
 */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert total minutes back to "HH:mm".
 */
export function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Get the day-of-week index (0=Sun…6=Sat) for a date string "YYYY-MM-DD".
 */
export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay();
}

/**
 * Given foundations and wishes for a specific date, generate Slot candidates.
 * This is the auto-scheduling logic (MVP version: fill empty gaps by priority).
 */
export function generateSlots(
  dateStr: string,
  foundations: Foundation[],
  wishes: Wish[],
): Omit<Slot, 'id'>[] {
  const dayOfWeek = getDayOfWeek(dateStr);

  // Active foundations for this day
  const activeFounds = foundations
    .filter((f) => f.daysOfWeek.includes(dayOfWeek))
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  // Build occupied intervals from foundations
  type Interval = { start: number; end: number };
  const occupied: Interval[] = activeFounds.map((f) => ({
    start: toMinutes(f.startTime),
    end: toMinutes(f.endTime),
  }));

  // Merge overlapping/adjacent intervals
  occupied.sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];
  for (const iv of occupied) {
    if (merged.length && iv.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, iv.end);
    } else {
      merged.push({ ...iv });
    }
  }

  // Find free gaps between 06:00 and 23:59
  const DAY_START = 6 * 60;
  const DAY_END = 24 * 60;
  const freeGaps: Interval[] = [];
  let cursor = DAY_START;
  for (const iv of merged) {
    if (iv.start > cursor) freeGaps.push({ start: cursor, end: iv.start });
    cursor = Math.max(cursor, iv.end);
  }
  if (cursor < DAY_END) freeGaps.push({ start: cursor, end: DAY_END });

  // Sort wishes by priority
  const sortedWishes = [...wishes].sort((a, b) => a.priority - b.priority);

  // Assign wishes to gaps
  const slots: Omit<Slot, 'id'>[] = [];
  const remainingGaps = [...freeGaps];

  for (const wish of sortedWishes) {
    const minMins = wish.minDuration;

    for (let i = 0; i < remainingGaps.length; i++) {
      const gap = remainingGaps[i];
      const gapDuration = gap.end - gap.start;

      if (gapDuration >= minMins) {
        const slotEnd = Math.min(gap.start + minMins * 2, gap.end); // use up to 2x min duration
        slots.push({
          wishId: wish.id,
          wishName: wish.name,
          date: dateStr,
          startTime: fromMinutes(gap.start),
          endTime: fromMinutes(slotEnd),
          status: 'pending',
          feelEmoji: null,
          notifiedAt: null,
          recordedAt: null,
        });

        // Update gap
        if (slotEnd < gap.end) {
          remainingGaps[i] = { start: slotEnd, end: gap.end };
        } else {
          remainingGaps.splice(i, 1);
        }
        break;
      }
    }
  }

  return slots;
}

/**
 * Merge foundations and slots into a sorted visual timeline for a day.
 */
export function buildTimeline(
  dateStr: string,
  foundations: Foundation[],
  slots: Slot[],
): TimeBlock[] {
  const dayOfWeek = getDayOfWeek(dateStr);
  const blocks: TimeBlock[] = [];

  for (const f of foundations) {
    if (!f.daysOfWeek.includes(dayOfWeek)) continue;
    blocks.push({
      type: 'foundation',
      name: f.name,
      startTime: f.startTime,
      endTime: f.endTime,
      color: f.color,
    });
  }

  for (const s of slots) {
    blocks.push({
      type: 'wish',
      name: s.wishName,
      startTime: s.startTime,
      endTime: s.endTime,
      color: '#1A73E8',
      slotId: s.id,
      feelEmoji: s.feelEmoji,
      status: s.status,
    });
  }

  return blocks.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
}
