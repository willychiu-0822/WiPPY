import { validateMessageContent, validateScheduledTime } from '../services/activityValidation';

describe('UAT-12 manual schedule validation', () => {
  test.each(['', '   ', null, 123])('rejects empty or non-string content %p', value => {
    expect(() => validateMessageContent(value)).toThrow('訊息內容不可為空');
  });
  test.each(['不是時間', '2026-02-30T10:00:00+08:00', '2026-13-01T10:00:00Z', '2026-11-12', '2026-11-12T99:00:00Z'])('rejects invalid datetime %p', value => {
    expect(() => validateScheduledTime(value)).toThrow('請輸入有效的 ISO 發送時間');
  });
  test('accepts a real leap day and valid content', () => {
    expect(() => validateScheduledTime('2028-02-29T10:00:00+08:00')).not.toThrow();
    expect(() => validateMessageContent('合法訊息')).not.toThrow();
  });
});
