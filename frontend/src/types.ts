export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  lineUserId?: string;
  lineLinkedAt?: Date;
  timezone: string;
  createdAt: Date;
  onboardingCompleted?: boolean;
}

export interface Foundation {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  color: string;
}

export interface Wish {
  id: string;
  name: string;
  emoji: string;
  priority: number;
  minDuration: number; // minutes
}

export type FeelEmoji = '😊' | '🟡' | '☁️';
export type SlotStatus = 'pending' | 'notified' | 'recorded' | 'skipped';

export interface Slot {
  id: string;
  wishId: string;
  wishName: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  status: SlotStatus;
  feelEmoji: FeelEmoji | null;
  notifiedAt: Date | null;
  recordedAt: Date | null;
}

export interface Record {
  id: string;
  slotId: string;
  wishId: string;
  wishName: string;
  date: string;
  feelEmoji: FeelEmoji;
  recordedAt: Date;
}

// For schedule display — merges foundations and slots into one timeline
export interface TimeBlock {
  type: 'foundation' | 'wish' | 'free';
  name: string;
  emoji?: string;
  startTime: string;
  endTime: string;
  color: string;
  slotId?: string;
  feelEmoji?: FeelEmoji | null;
  status?: SlotStatus;
}
