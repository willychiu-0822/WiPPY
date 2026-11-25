import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';
import icon from '../../public/favicon.svg?raw';

describe('document branding', () => {
  it('sets Traditional Chinese and the WiPPY title', () => {
    expect(html).toMatch(/<html lang="zh-Hant">/);
    expect(html).toMatch(/<title>WiPPY<\/title>/);
    expect(html).not.toMatch(/<title>frontend<\/title>/);
    expect(html).not.toMatch(/lang="en"/);
  });

  it('points the favicon at the WiPPY mark, not the Vite default', () => {
    expect(html).toContain('href="/favicon.svg"');
    expect(icon).toContain('#2563eb');
    expect(icon).not.toContain('#863bff');
  });
});
