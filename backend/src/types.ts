import { Timestamp } from 'firebase-admin/firestore';

// ─── User & Official Account ──────────────────────────────────────────────────

export interface OfficialAccount {
  id: string;
  lineChannelId: string;
  lineChannelSecret: string;       // Never expose in API responses
  lineChannelAccessToken: string;  // Never expose in API responses
  displayName: string;
  createdAt: Timestamp;
}

export interface User {
  id: string;
  email: string;
  officialAccounts: OfficialAccount[];  // Embedded array — supports multi-account
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Group ────────────────────────────────────────────────────────────────────

export interface Group {
  groupId: string;                 // Document ID = LINE groupId
  officialAccountId: string;
  userId: string;
  name: string;
  memberCount: number;
  lastMessageAt: Timestamp;
  lastMessagePreview: string;      // First 80 chars of last message
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RecentMessage {
  senderId: string;
  senderName: string;
  content: string;
  messageType: string;             // 'text' | 'image' | 'sticker' | 'file'
  timestamp: Timestamp;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export type ActivityStatus = 'draft' | 'active' | 'completed';
export type ActivityReviewStatus = 'pending_review' | 'approved' | 'revision_requested';

export interface Activity {
  id: string;
  userId: string;
  name: string;
  targetGroups: string[];          // Array of groupIds
  status: ActivityStatus;
  reviewStatus: ActivityReviewStatus;
  approvedAt: Timestamp | null;
  agentSessionId: string | null;   // FK to current AgentSession
  eventStartAt: Timestamp | null;  // For lifecycle binding (optional)
  eventEndAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Activity Message ─────────────────────────────────────────────────────────

export type TriggerType = 'scheduled' | 'keyword';
export type MessageStatus = 'pending' | 'sent' | 'failed';
export type MessageReviewStatus = 'pending_review' | 'approved' | 'rejected';

export interface ActivityMessage {
  id: string;
  activityId: string;              // Denormalized for collectionGroup queries
  userId: string;                  // Denormalized for collectionGroup queries
  content: string;
  targetGroups: string[];
  triggerType: TriggerType;
  triggerValue: string;            // ISO datetime (scheduled) or keyword string (keyword)
  cooldownMinutes: number | null;
  status: MessageStatus;
  reviewStatus: MessageReviewStatus;
  generatedByAgent: boolean;
  agentSessionId: string | null;   // Traceable to which AgentSession produced this
  sequenceOrder: number;           // Ordering within a campaign
  sendWindowStart: Timestamp | null; // Do not send before this time (lifecycle binding)
  sendWindowEnd: Timestamp | null;   // Do not send after this time
  sentAt: Timestamp | null;
  processingAt: Timestamp | null;  // Set during send to prevent double-send
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Activity Knowledge ───────────────────────────────────────────────────────

export type KnowledgeType = 'background' | 'restriction' | 'character' | 'faq';
export type KnowledgeSourceType = 'manual' | 'upload' | 'agent_generated';

export interface ActivityKnowledge {
  id: string;
  activityId: string;
  userId: string;
  knowledgeType: KnowledgeType;
  title: string;
  content: string;
  sourceType: KnowledgeSourceType;
  targetGroupId: string | null;    // null = activity-wide; groupId = group-specific tone override (future)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Agent Session ────────────────────────────────────────────────────────────

export type AgentSessionStatus = 'active' | 'closed';

export interface AgentSessionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
}

export interface AgentSession {
  id: string;
  activityId: string;
  userId: string;
  messages: AgentSessionMessage[];
  lastGeneratedPlanAt: Timestamp | null;
  status: AgentSessionStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Capture Rule ─────────────────────────────────────────────────────────────

export type CaptureRuleTriggerType = 'time_window' | 'keyword';
export type CaptureRuleStatus = 'pending' | 'active' | 'completed';
export type ProcessorType = null; // V1: always null. Future: 'llm_summarize' | 'llm_reply'

export interface CaptureRule {
  id: string;
  activityId: string;              // Denormalized
  userId: string;                  // Denormalized
  targetGroup: string;             // Single groupId
  triggerType: CaptureRuleTriggerType;
  triggerValue: string;            // ISO datetime (time_window start) or keyword
  durationMinutes: number | null;
  messageLimit: number | null;
  processor: ProcessorType;        // V1: always null — LLM hook placeholder
  status: CaptureRuleStatus;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Captured Message ─────────────────────────────────────────────────────────

export interface CapturedMessage {
  id: string;
  captureRuleId: string;
  activityId: string;              // Denormalized
  userId: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: string;
  timestamp: Timestamp;            // Original LINE message timestamp
  capturedAt: Timestamp;           // When written to Firestore
}

// ─── Send Log ─────────────────────────────────────────────────────────────────

export type SendLogStatus = 'success' | 'failed';
export type SendTriggerType = 'scheduled' | 'keyword' | 'manual' | 'broadcast';

export interface SendLog {
  id: string;
  userId: string;
  activityId: string | null;
  activityMessageId: string | null;
  groupId: string;
  content: string;                 // Message content snapshot
  status: SendLogStatus;
  errorMessage: string | null;
  lineMessageId: string | null;    // LINE's returned message ID
  triggerType: SendTriggerType;
  sentAt: Timestamp;
}

// ─── Harness ──────────────────────────────────────────────────────────────────

export type HarnessStage =
  | 'load_context'
  | 'build_prompt'
  | 'run_planner'
  | 'parse_output'
  | 'validate_output'
  | 'persist_effects'
  | 'finalize_response';

export type HarnessStatus = 'queued' | 'running' | 'completed' | 'failed';
export type AgentIntent = 'plan_messages' | 'extract_knowledge' | 'general_chat' | 'unknown';

export interface HarnessRun {
  id: string;
  sessionId: string;
  activityId: string;
  userId: string;
  intentType: AgentIntent;
  currentStage: HarnessStage | null;
  status: HarnessStatus;
  llmCallCount: number;
  persistedBatches: number;
  lastError: string | null;
  reply: string | null;
  generatedMessageCount: number;
  extractedKnowledgeCount: number;
  ttlExpiry: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  windowResetInSeconds: number;
}

export interface AgentChatApiResponse {
  status: 'queued' | 'rate_limited' | 'completed';
  runId: string;
  sessionId: string;
  retryAfterSeconds?: number;
  rateLimitWarning?: { remaining: number; windowResetInSeconds: number };
  reply?: string;
  generatedMessageCount?: number;
  extractedKnowledgeCount?: number;
}

// ─── V1 Legacy Types (WiPPY 1.0 — Habit Scheduler) ──────────────────────────
// Kept for backwards compatibility with existing webhook/scheduler handlers.

export interface V1Slot {
  wishId: string;
  wishName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'notified' | 'recorded' | 'skipped';
  feelEmoji?: string;
  notifiedAt?: Timestamp;
  recordedAt?: Timestamp;
}

export interface V1Record {
  slotId: string;
  wishId: string;
  wishName: string;
  date: string;
  feelEmoji: string;
  recordedAt: Timestamp;
}
