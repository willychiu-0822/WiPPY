// Mock group id used by the LIFF dev fallback (VITE_LIFF_DEV=true).
export const LIFF_DEV_ENTRY_GROUP_ID = 'Cdev1';

// Context-level presets for the LIFF dev fallback, selected with ?mockPreset=<id>.
export const LIFF_MOCK_PRESET_IDS = [
  'default',
  'no_group',
  'share_unavailable',
] as const;

export type LiffMockPresetId = typeof LIFF_MOCK_PRESET_IDS[number];

export function isLiffMockPresetId(value: string | null | undefined): value is LiffMockPresetId {
  return LIFF_MOCK_PRESET_IDS.includes(value as LiffMockPresetId);
}

export function normalizeLiffMockPresetId(value: string | null | undefined): LiffMockPresetId {
  return isLiffMockPresetId(value) ? value : 'default';
}

export function getActiveLiffMockPresetId(): LiffMockPresetId {
  if (typeof window === 'undefined') {
    return 'default';
  }

  const params = new URLSearchParams(window.location.search);
  return normalizeLiffMockPresetId(params.get('mockPreset'));
}
