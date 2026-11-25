import { describe, expect, it } from 'vitest';
import {
  activityWorkflowPrimary,
  activityWorkflowStep,
  readScheduleConfirmed,
  writeScheduleConfirmed,
} from '../components/activityWorkflow';

describe('activityWorkflowStep', () => {
  it('maps review status and schedule confirmation onto the three steps', () => {
    expect(activityWorkflowStep('pending_review', false)).toBe('approve');
    expect(activityWorkflowStep('pending_review', true)).toBe('approve');
    expect(activityWorkflowStep('revision_requested', false)).toBe('approve');
    expect(activityWorkflowStep('approved', false)).toBe('confirm');
    expect(activityWorkflowStep('approved', true)).toBe('send');
  });
});

describe('activityWorkflowPrimary', () => {
  it.each([
    ['pending_review', false, false, 'plan'],
    ['pending_review', false, true, 'approve'],
    ['revision_requested', true, true, 'approve'],
    ['approved', false, true, 'confirm'],
    ['approved', false, false, 'confirm'],
    ['approved', true, true, 'send'],
    ['approved', true, false, 'send'],
  ] as const)('review=%s confirmed=%s pending=%s → %s', (review, confirmed, pending, primary) => {
    expect(activityWorkflowPrimary(review, confirmed, pending)).toBe(primary);
  });
});

describe('schedule confirmed storage', () => {
  it('writes and clears a per-activity flag', () => {
    const saved = new Map<string, string>();
    const storage = {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value); },
      removeItem: (key: string) => { saved.delete(key); },
    };
    expect(readScheduleConfirmed('act_1', storage)).toBe(false);
    writeScheduleConfirmed('act_1', true, storage);
    expect(readScheduleConfirmed('act_1', storage)).toBe(true);
    expect(readScheduleConfirmed('act_2', storage)).toBe(false);
    writeScheduleConfirmed('act_1', false, storage);
    expect(readScheduleConfirmed('act_1', storage)).toBe(false);
  });
});
