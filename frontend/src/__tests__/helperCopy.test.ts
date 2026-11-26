import { describe, expect, it, vi } from 'vitest';
import { explainError, explainRaw, shownError, statusLabel } from '../lib/helperCopy';
import { describeResult } from '../hub/format';

describe('helper copy', () => {
  it('turns harness and action codes into a next step and keeps the raw code out of the sentence', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cases = [
      ['max_llm_calls_exceeded', '試太多次'],
      ['Error: llm_rate_limit_error', '比較忙'],
      ['repair_failed: 無法解析修正後的輸出', '沒能把回覆整理好'],
      ['cloud_run_terminated', '被中斷'],
      ['stuck_run_timeout', '等太久'],
      ['persistence_error', '沒能存下來'],
      ['no_text', '沒有文字'],
      ['llm_daily_limit', '次數用完了'],
    ] as const;
    for (const [raw, snippet] of cases) {
      const notice = explainRaw(raw, '這次沒有完成。請再送出一次。');
      expect(notice.message).toContain(snippet);
      expect(notice.message).not.toContain(raw.replace(/^Error:\s*/, ''));
      expect(notice.raw).toBe(raw.replace(/^Error:\s*/, ''));
    }
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('keeps an already plain sentence and hides English or HTTP text', () => {
    expect(explainRaw('請先選擇群組', '失敗').message).toBe('請先選擇群組');
    expect(explainRaw('請先選擇群組', '失敗').raw).toBeNull();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const http = explainRaw('未登入無法開啟（HTTP 401）', '請改貼不用登入的連結。');
    expect(http.message).toBe('請改貼不用登入的連結。');
    expect(http.message).not.toMatch(/HTTP/);
    expect(http.raw).toContain('HTTP 401');

    const english = explainError(new Error('Agent request failed'), '沒能送出。請再試一次。');
    expect(english.message).toBe('沒能送出。請再試一次。');
    expect(english.raw).toBe('Agent request failed');

    const coded = explainError({ message: 'Missing Authorization header', code: 'unauthenticated' }, '失敗');
    expect(coded.message).toContain('重新登入');
    expect(coded.message).not.toMatch(/Authorization|unauthenticated/);
    expect(shownError(new Error('暫時無法完成，請再試一次'), '失敗')).toBe('暫時無法完成，請再試一次');
    warn.mockRestore();
  });

  it('describes an action result without the status code in the sentence', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rejected = describeResult({
      actionId: '', type: 'send_link', status: 'invalid', code: 'url_requires_login', detail: '未登入無法開啟（HTTP 401）', result: null,
    });
    expect(rejected.message).toContain('不用登入');
    expect(rejected.message).not.toContain('url_requires_login');
    expect(rejected.raw).toContain('url_requires_login');
    expect(describeResult({ actionId: 'a', type: 'send_message', status: 'done', code: null, detail: null, result: {} }).message).toBe('已完成');
    expect(statusLabel('failed')).toBe('沒成功');
    expect(statusLabel('mystery_status')).toBe('需要看一下');
    warn.mockRestore();
  });
});
