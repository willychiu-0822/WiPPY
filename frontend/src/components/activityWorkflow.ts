import type { Activity } from '../lib/api';

/** 1 核准企畫 → 2 確認排程 → 3 送出 */
export type ActivityWorkflowStep = 'approve' | 'confirm' | 'send';

/**
 * Which control is the single solid action.
 * `plan` is the empty-plan state: 核准企畫 is not available until a pending message exists.
 */
export type ActivityWorkflowPrimary = ActivityWorkflowStep | 'plan';

export const ACTIVITY_WORKFLOW_STEPS: { id: ActivityWorkflowStep; label: string }[] = [
  { id: 'approve', label: '核准企畫' },
  { id: 'confirm', label: '確認排程' },
  { id: 'send', label: '送出' },
];

export function activityWorkflowStep(
  reviewStatus: Activity['reviewStatus'],
  scheduleConfirmed: boolean,
): ActivityWorkflowStep {
  if (reviewStatus !== 'approved') return 'approve';
  if (!scheduleConfirmed) return 'confirm';
  return 'send';
}

export function activityWorkflowPrimary(
  reviewStatus: Activity['reviewStatus'],
  scheduleConfirmed: boolean,
  hasPendingMessages: boolean,
): ActivityWorkflowPrimary {
  if (reviewStatus !== 'approved') return hasPendingMessages ? 'approve' : 'plan';
  return activityWorkflowStep(reviewStatus, scheduleConfirmed);
}

export function scheduleConfirmedStorageKey(activityId: string): string {
  return `wippy_schedule_confirmed_${activityId}`;
}

export function readScheduleConfirmed(
  activityId: string,
  storage: Pick<Storage, 'getItem'> = localStorage,
): boolean {
  return storage.getItem(scheduleConfirmedStorageKey(activityId)) === '1';
}

export function writeScheduleConfirmed(
  activityId: string,
  confirmed: boolean,
  storage: Pick<Storage, 'setItem' | 'removeItem'> = localStorage,
): void {
  const key = scheduleConfirmedStorageKey(activityId);
  if (confirmed) storage.setItem(key, '1');
  else storage.removeItem(key);
}
