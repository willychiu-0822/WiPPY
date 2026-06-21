import { describe, expect, it, vi, afterEach } from 'vitest';
import { buildWaterShareMessage } from '../lib/liffShare';

describe('buildWaterShareMessage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the configured LIFF deep link with the explicit group id', () => {
    vi.stubEnv('VITE_LIFF_ID', 'test-liff-id');

    const message = buildWaterShareMessage({
      member: {
        lineUserId: 'U1',
        displayName: 'Amy',
        pictureUrl: '',
        todayMl: 900,
        weekMl: 2400,
        totalMl: 9800,
        streak: 3,
        achievements: [],
        lastDrinkAt: null,
      },
      taunt: '補水補起來',
      entryGroupId: 'Cgroup1',
    });

    const bodyContents = (message.contents.body as { contents: Array<Record<string, unknown>> }).contents;
    const cta = bodyContents.find((item) => item.type === 'button');

    expect(cta).toEqual(expect.objectContaining({
      action: expect.objectContaining({
        uri: 'https://liff.line.me/test-liff-id?wg=Cgroup1',
      }),
    }));
  });

  it('falls back to the default LIFF deep link when env is missing', () => {
    vi.stubEnv('VITE_LIFF_ID', '');

    const message = buildWaterShareMessage({
      member: {
        lineUserId: 'U1',
        displayName: 'Amy',
        pictureUrl: '',
        todayMl: 900,
        weekMl: 2400,
        totalMl: 9800,
        streak: 3,
        achievements: [],
        lastDrinkAt: null,
      },
      taunt: '補水補起來',
      entryGroupId: 'Cgroup1',
    });

    const bodyContents = (message.contents.body as { contents: Array<Record<string, unknown>> }).contents;
    const cta = bodyContents.find((item) => item.type === 'button');

    expect(cta).toEqual(expect.objectContaining({
      action: expect.objectContaining({
        uri: 'https://liff.line.me/2010457997-AsUbpde2?wg=Cgroup1',
      }),
    }));
  });
});
