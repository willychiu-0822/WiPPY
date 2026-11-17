import { describe, expect, it } from 'vitest';
import { SEND_AT_ISO_EXAMPLE, SEND_AT_LABEL, fromTaipeiLocal, taipeiDateTime } from '../lib/timeCopy';

describe('timeCopy', () => {
  it('reads and writes the datetime picker as Taipei time', () => {
    expect(fromTaipeiLocal('2035-11-12T18:30:17')).toBe('2035-11-12T18:30:17+08:00');
    expect(fromTaipeiLocal('2035-11-12T18:30')).toBe('2035-11-12T18:30:00+08:00');
    expect(taipeiDateTime('2035-11-12T18:30:17+08:00')).toBe('2035-11-12T18:30:17');
    expect(taipeiDateTime('2035-11-12T10:30:17.000Z')).toBe('2035-11-12T18:30:17');
  });

  it('keeps a shared Taipei label and a year-free example', () => {
    expect(SEND_AT_LABEL).toBe('發送時間（台北時間）');
    expect(SEND_AT_ISO_EXAMPLE).toBe('例：明天上午 10 點');
    expect(SEND_AT_ISO_EXAMPLE).not.toMatch(/\d{4}/);
  });
});
