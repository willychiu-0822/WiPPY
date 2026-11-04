import liff from '@line/liff';
import { getErrorMessage } from './apiError';
import { getActiveLiffMockPresetId } from './liffDev';

export type LineFlexMessage = {
  type: 'flex';
  altText: string;
  contents: Record<string, unknown>;
};

export type ShareResult = 'sent' | 'shared' | 'cancelled';

function isInLineClient(): boolean {
  try {
    return typeof liff.isInClient === 'function' && liff.isInClient();
  } catch {
    return false;
  }
}

export function closeLineWindow(): boolean {
  try {
    if (isInLineClient() && typeof liff.closeWindow === 'function') {
      liff.closeWindow();
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function shareLineMessage(message: LineFlexMessage): Promise<ShareResult> {
  if (import.meta.env.VITE_LIFF_DEV === 'true' && getActiveLiffMockPresetId() === 'share_unavailable') {
    throw new Error('Mock preset share_unavailable: LINE 分享功能不可用');
  }
  const errors: string[] = [];

  if (isInLineClient() && typeof liff.sendMessages === 'function') {
    try {
      await liff.sendMessages([message] as Parameters<typeof liff.sendMessages>[0]);
      return 'sent';
    } catch (error) {
      errors.push(`sendMessages: ${getErrorMessage(error)}`);
    }
  }

  if (typeof liff.shareTargetPicker === 'function') {
    try {
      const result = await liff.shareTargetPicker([message] as Parameters<typeof liff.shareTargetPicker>[0]);
      return result ? 'shared' : 'cancelled';
    } catch (error) {
      errors.push(`shareTargetPicker: ${getErrorMessage(error)}`);
    }
  }

  const detail = errors.length > 0 ? ` (${errors.join('; ')})` : '';
  throw new Error(`LINE 分享功能不可用，請確認 LIFF 權限、LINE 版本，並在 LINE App 內開啟${detail}`);
}
