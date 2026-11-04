import type { HubContext } from './core/context';
import { addDays } from './core/time';
import { COLLECTIONS, type GroupDocLike, type GroupMessageDoc, type HubMessageType, type MediaAssetDoc } from './core/types';
import { getSettings } from './settings';

export type IngestResult =
  | { status: 'stored'; messageId: string; message: GroupMessageDoc }
  | { status: 'duplicate' }
  | { status: 'ignored'; reason: 'not_group_message' | 'group_not_enabled' };

type Raw = Record<string, unknown>;

const KNOWN_TYPES: HubMessageType[] = ['text', 'image', 'video', 'audio', 'file', 'sticker', 'location'];
const NAME_CACHE_TTL_MS = 60 * 60 * 1000;
const nameCache = new Map<string, { name: string; expiresAt: number }>();

export function resetSenderNameCache(): void {
  nameCache.clear();
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length ? value : null;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

async function resolveSenderName(ctx: HubContext, groupId: string, senderId: string): Promise<string> {
  if (!ctx.line || senderId === 'unknown') return senderId;
  const key = `${groupId}:${senderId}`;
  const cached = nameCache.get(key);
  const nowMs = ctx.now().getTime();
  if (cached && cached.expiresAt > nowMs) return cached.name;
  try {
    const profile = await ctx.line.getGroupMemberProfile(groupId, senderId);
    nameCache.set(key, { name: profile.displayName, expiresAt: nowMs + NAME_CACHE_TTL_MS });
    return profile.displayName;
  } catch {
    return senderId;
  }
}

/**
 * Stores one LINE webhook event for an agent-enabled group (hard flow, no model).
 * Media from LINE is queued for immediate download because LINE deletes it later.
 */
export async function ingestLineEvent(ctx: HubContext, event: Raw): Promise<IngestResult> {
  const source = (event['source'] ?? {}) as Raw;
  const message = (event['message'] ?? {}) as Raw;
  const groupId = str(source['groupId']);
  if (event['type'] !== 'message' || source['type'] !== 'group' || !groupId) {
    return { status: 'ignored', reason: 'not_group_message' };
  }

  const group = await ctx.store.get<GroupDocLike>(COLLECTIONS.groups, groupId);
  if (!group?.agentEnabled) return { status: 'ignored', reason: 'group_not_enabled' };

  const settings = await getSettings(ctx);
  const now = ctx.now();
  const ttl = addDays(now, settings.retentionDays);
  const webhookEventId = str(event['webhookEventId']) ?? `${groupId}_${str(message['id']) ?? ctx.store.newId()}`;
  const lineMessageId = str(message['id']) ?? webhookEventId;
  const rawType = str(message['type']) as HubMessageType | null;
  const type: HubMessageType = rawType && KNOWN_TYPES.includes(rawType) ? rawType : 'other';
  const senderId = str(source['userId']) ?? 'unknown';

  const mention = (message['mention'] ?? null) as { mentionees?: Raw[] } | null;
  const botUserId = process.env['LINE_BOT_USER_ID'];
  const mentionsBot = Array.isArray(mention?.mentionees)
    && mention!.mentionees!.some((m) => m['isSelf'] === true || (!!botUserId && m['userId'] === botUserId));

  const imageSetRaw = message['imageSet'] as Raw | undefined;
  const contentProvider = (message['contentProvider'] ?? { type: 'line' }) as Raw;
  const isMedia = type === 'image' || type === 'video' || type === 'audio' || type === 'file';
  const fileSize = num(message['fileSize']);

  const doc: GroupMessageDoc = {
    ownerId: ctx.ownerId,
    groupId,
    webhookEventId,
    lineMessageId,
    senderId,
    senderName: senderId,
    type,
    text: type === 'text' ? (str(message['text']) ?? '') : null,
    fileName: str(message['fileName']),
    fileSize,
    durationMs: num(message['duration']),
    mediaAssetId: isMedia ? lineMessageId : null,
    imageSet: imageSetRaw && str(imageSetRaw['id'])
      ? { id: str(imageSetRaw['id'])!, index: num(imageSetRaw['index']), total: num(imageSetRaw['total']) }
      : null,
    sticker: type === 'sticker'
      ? { packageId: String(message['packageId'] ?? ''), stickerId: String(message['stickerId'] ?? '') }
      : null,
    location: type === 'location'
      ? {
        title: str(message['title']),
        address: str(message['address']),
        latitude: num(message['latitude']) ?? 0,
        longitude: num(message['longitude']) ?? 0,
      }
      : null,
    mentionsBot,
    quotedMessageId: str(message['quotedMessageId']),
    timestamp: new Date(num(event['timestamp']) ?? now.getTime()),
    createdAt: now,
    ttl,
  };

  // Claim the event id first so a redelivery never double-processes.
  const created = await ctx.store.create(COLLECTIONS.groupMessages, webhookEventId, doc);
  if (!created) return { status: 'duplicate' };

  doc.senderName = await resolveSenderName(ctx, groupId, senderId);
  if (doc.senderName !== senderId) {
    await ctx.store.update(COLLECTIONS.groupMessages, webhookEventId, { senderName: doc.senderName });
  }

  if (isMedia) {
    const external = contentProvider['type'] === 'external';
    const tooLarge = fileSize !== null && fileSize > settings.mediaMaxBytes;
    const asset: MediaAssetDoc = {
      ownerId: ctx.ownerId,
      groupId,
      lineMessageId,
      messageType: type,
      status: external ? 'external' : tooLarge ? 'skipped_too_large' : 'pending',
      storagePath: null,
      contentType: null,
      size: fileSize,
      fileName: doc.fileName,
      externalUrl: external ? str(contentProvider['originalContentUrl']) : null,
      externalPreviewUrl: external ? str(contentProvider['previewImageUrl']) : null,
      attempts: 0,
      lastError: null,
      createdAt: now,
      updatedAt: now,
      ttl,
    };
    await ctx.store.set(COLLECTIONS.mediaAssets, lineMessageId, asset);
    if (asset.status === 'pending') {
      await ctx.queue.enqueue({ type: 'media_download', id: lineMessageId, attempt: 1, payload: { mediaAssetId: lineMessageId } });
    }
  }

  return { status: 'stored', messageId: webhookEventId, message: doc };
}
