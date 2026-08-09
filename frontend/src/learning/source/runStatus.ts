import type { LearningRunStatus } from '../api/types';

export type ActiveLearningRunStatus = Extract<LearningRunStatus, 'pending_enqueue' | 'queued' | 'running' | 'publishing'>;

export function isActiveRunStatus(status: LearningRunStatus): status is ActiveLearningRunStatus {
  return status === 'pending_enqueue' || status === 'queued' || status === 'running' || status === 'publishing';
}
