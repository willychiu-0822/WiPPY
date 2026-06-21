import type { LiffContextType } from '../contexts/liff-context';

export const LIFF_DEV_ENTRY_GROUP_ID = 'Cdev1';

export const LIFF_MOCK_PRESET_IDS = [
  'default',
  'new_user',
  'rank_behind',
  'rank_first',
  'no_group',
  'share_unavailable',
  'api_401',
  'api_500',
  // ★ M1~M6 gamification presets
  'overtaken',
  'streak_risk',
  'group_near_goal',
  'combo',
  'cold_start',
] as const;

export type LiffMockPresetId = typeof LIFF_MOCK_PRESET_IDS[number];

export interface LiffDevDiagnostics {
  ready: boolean;
  loading: boolean;
  error: string | null;
  profile: LiffContextType['profile'];
  context: LiffContextType['context'];
  groupId: string | null;
  hasIdToken: boolean;
  activePreset: LiffMockPresetId;
  isInClient: boolean;
  canSendMessages: boolean;
  canShareTargetPicker: boolean;
  lastMockError: string | null;
}

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

export function shouldExposeLiffDevTools(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_LIFF_DEV === 'true';
}

export function buildLiffWaterUrl(presetId: LiffMockPresetId): string {
  return `/liff/water?wg=${encodeURIComponent(LIFF_DEV_ENTRY_GROUP_ID)}&mockPreset=${encodeURIComponent(presetId)}`;
}

export function buildLiffPlaygroundUrl(presetId: LiffMockPresetId): string {
  return `/dev/liff-playground?mockPreset=${encodeURIComponent(presetId)}`;
}
