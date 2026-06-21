import liff from '@line/liff';
import type { AchievementId, WaterMember } from './liffApi';
import { getErrorMessage } from './apiError';
import { getActiveLiffMockPresetId } from './liffDev';

type LineFlexMessage = {
  type: 'flex';
  altText: string;
  contents: Record<string, unknown>;
};

const ACHIEVEMENT_LABELS: Record<AchievementId, string> = {
  now_im_best: '現在我最棒 🏆',
  now_im_worst: '現在我最爛 😵',
  first_drink: '今日首杯 💧',
  hydration_master: '喝水狂人 🚰',
  '7_day_streak': '七日連線 🔥',
  '30_day_streak': '三十日連線 🏅',
};

export type ShareResult = 'sent' | 'shared' | 'cancelled';

export function buildWaterShareMessage(input: {
  member: WaterMember;
  taunt: string;
  surpassedCount?: number;
  achievement?: AchievementId | null;
}): LineFlexMessage {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const liffId = import.meta.env.VITE_LIFF_ID as string;
  const achievementLabel = input.achievement ? ACHIEVEMENT_LABELS[input.achievement] : null;

  return {
    type: 'flex',
    altText: `💧 ${timeStr} 喝水打卡！今日已喝 ${Math.round(input.member.todayMl)} ml`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          { type: 'text', text: `💧 ${timeStr} 喝水打卡`, weight: 'bold', size: 'lg', color: '#0ea5e9' },
          ...(achievementLabel ? [{ type: 'text', text: achievementLabel, size: 'sm', color: '#f59e0b' }] : []),
          { type: 'text', text: `今日已喝 ${Math.round(input.member.todayMl)} ml`, size: 'md', color: '#374151' },
          ...(input.surpassedCount && input.surpassedCount > 0
            ? [{ type: 'text', text: `超越了 ${input.surpassedCount} 人 🚀`, size: 'sm', color: '#6366f1' }]
            : []),
          { type: 'text', text: input.taunt, size: 'sm', color: '#6b7280', wrap: true },
          { type: 'button', action: { type: 'uri', label: '我也要記錄 💧', uri: `https://liff.line.me/${liffId}` }, style: 'primary', color: '#0ea5e9' },
        ],
      },
    },
  };
}

function isInLineClient(): boolean {
  try {
    return typeof liff.isInClient === 'function' && liff.isInClient();
  } catch {
    return false;
  }
}

export async function shareLineMessage(message: LineFlexMessage): Promise<ShareResult> {
  if (import.meta.env.VITE_USE_MOCK_API === 'true' && getActiveLiffMockPresetId() === 'share_unavailable') {
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
