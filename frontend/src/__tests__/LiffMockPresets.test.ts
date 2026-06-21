import { beforeEach, describe, expect, it } from 'vitest';
import {
  getActiveLiffMockPresetId,
  normalizeLiffMockPresetId,
} from '../lib/liffDev';
import { mockWaterApi, resetActiveLiffMockState } from '../lib/liffMockPresets';

function setSearch(search: string) {
  window.history.replaceState(null, '', `/${search}`);
  resetActiveLiffMockState();
}

describe('LIFF mock presets', () => {
  beforeEach(() => {
    setSearch('');
  });

  it('falls back to default for unknown presets', () => {
    expect(normalizeLiffMockPresetId('unknown')).toBe('default');
    setSearch('?mockPreset=unknown');
    expect(getActiveLiffMockPresetId()).toBe('default');
  });

  it('returns new user session data for new_user', async () => {
    setSearch('?mockPreset=new_user');

    const session = await mockWaterApi.session('Cdev1');
    expect(session.status).toBe('ready');
    if (session.status !== 'ready') throw new Error('unexpected session status');

    expect(session.isNewUser).toBe(true);
    expect(session.member.todayMl).toBe(0);
    expect(session.member.achievements).toEqual([]);
  });

  it('returns a trailing rank for rank_behind', async () => {
    setSearch('?mockPreset=rank_behind');

    const session = await mockWaterApi.session('Cdev1');
    expect(session.status).toBe('ready');
    if (session.status !== 'ready') throw new Error('unexpected session status');

    expect(session.today.me.rank).toBe(3);
    expect(session.today.me.gapToAbove).toBeGreaterThan(0);
  });

  it('throws readable 401 and 500 preset errors', async () => {
    setSearch('?mockPreset=api_401');
    await expect(mockWaterApi.session('Cdev1')).rejects.toThrow('401: LIFF ID token expired');

    setSearch('?mockPreset=api_500');
    await expect(mockWaterApi.session('Cdev1')).rejects.toThrow('500: Water API unavailable');
  });
});
