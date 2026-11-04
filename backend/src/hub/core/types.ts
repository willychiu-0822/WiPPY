// Firestore document shapes for the Agent Hub. Dates are JS Dates in code;
// the Firestore adapter converts them to Timestamps.

export type HubMessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'location' | 'other';
export const MEDIA_MESSAGE_TYPES: HubMessageType[] = ['image', 'video', 'audio', 'file'];

export interface GroupMessageDoc {
  ownerId: string;
  groupId: string;
  webhookEventId: string;
  lineMessageId: string;
  senderId: string;
  senderName: string;
  type: HubMessageType;
  text: string | null;
  fileName: string | null;
  fileSize: number | null;
  durationMs: number | null;
  mediaAssetId: string | null;
  imageSet: { id: string; index: number | null; total: number | null } | null;
  sticker: { packageId: string; stickerId: string } | null;
  location: { title: string | null; address: string | null; latitude: number; longitude: number } | null;
  mentionsBot: boolean;
  quotedMessageId: string | null;
  timestamp: Date;
  createdAt: Date;
  ttl: Date;
}

export type MediaStatus = 'pending' | 'ready' | 'skipped_too_large' | 'external' | 'failed';

export interface MediaAssetDoc {
  ownerId: string;
  groupId: string;
  lineMessageId: string;
  messageType: HubMessageType;
  status: MediaStatus;
  storagePath: string | null;
  contentType: string | null;
  size: number | null;
  fileName: string | null;
  externalUrl: string | null;
  externalPreviewUrl: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
  ttl: Date;
}

export interface HubSettings {
  alertGroupId: string | null;
  quotaWarnPercents: number[];
  quotaReservePercent: number;
  retentionDays: number;
  mediaMaxBytes: number;
  signedUrlDays: number;
  llm: { maxRpm: number; maxRpd: number; minIntervalMs: number };
}

export type AgentKind = 'grok_bot' | 'instinct';

export interface AgentDoc {
  ownerId: string;
  name: string;
  kind: AgentKind;
  enabled: boolean;
  allowedGroupIds: string[];
  dailySendLimit: number;
  inboxAlertHours: number;
  routineUrl: string | null;
  routineKeyEnc: string | null;
  apiKeyHash: string | null;
  apiKeyPrefix: string | null;
  accountUid: string | null;
  accountEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HubAccountDoc {
  role: 'agent';
  ownerId: string;
  agentId: string;
  disabled: boolean;
  createdAt: Date;
}

export type ActorVia = 'rest' | 'mcp' | 'ui' | 'system';

export type Actor =
  | { kind: 'owner'; ownerId: string; via: ActorVia }
  | { kind: 'agent'; ownerId: string; agentId: string; via: ActorVia }
  | { kind: 'system'; ownerId: string; via: 'system' };

export function actorId(actor: Actor): string {
  return actor.kind === 'agent' ? actor.agentId : actor.kind;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface HubAlertDoc {
  ownerId: string;
  severity: AlertSeverity;
  source: string;
  text: string;
  delivered: boolean;
  deliveryError: string | null;
  createdAt: Date;
  ttl: Date;
}

export interface GroupDocLike {
  groupId?: string;
  name?: string;
  userId?: string;
  memberCount?: number;
  isActive?: boolean;
  agentEnabled?: boolean;
}

export const COLLECTIONS = {
  groups: 'groups',
  groupMessages: 'groupMessages',
  mediaAssets: 'mediaAssets',
  agents: 'agents',
  agentRules: 'agentRules',
  ruleState: 'hubRuleState',
  dispatches: 'agentDispatches',
  inbox: 'agentInbox',
  digests: 'digests',
  actions: 'hubActions',
  records: 'agentRecords',
  settings: 'hubSettings',
  counters: 'hubCounters',
  quota: 'hubQuota',
  alerts: 'hubAlerts',
  audit: 'hubAuditLogs',
  accounts: 'hubAccounts',
  groupStats: 'hubGroupStats',
} as const;
