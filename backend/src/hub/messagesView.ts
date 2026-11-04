import type { HubContext } from './core/context';
import { addDays } from './core/time';
import { COLLECTIONS, MEDIA_MESSAGE_TYPES, type GroupMessageDoc, type MediaAssetDoc } from './core/types';
import { chronological } from './rules';
import { getSettings } from './settings';

export type StoredMessage = GroupMessageDoc & { id: string };

export interface MessageView {
  id: string;
  groupId: string;
  at: string;
  sender: string;
  senderId: string;
  type: GroupMessageDoc['type'];
  text: string | null;
  fileName: string | null;
  fileSize: number | null;
  durationMs: number | null;
  sticker: GroupMessageDoc['sticker'];
  location: GroupMessageDoc['location'];
  mentionsBot: boolean;
  media: null | { mediaAssetId: string; status: string; contentType: string | null; size: number | null; url: string | null; urlExpiresAt: string | null };
}

export async function loadMessages(ctx: HubContext, ids: string[]): Promise<StoredMessage[]> {
  const docs = await Promise.all(ids.map(async (id) => {
    const data = await ctx.store.get<GroupMessageDoc>(COLLECTIONS.groupMessages, id);
    return data ? { id, data } : null;
  }));
  return chronological(docs.filter((d): d is { id: string; data: GroupMessageDoc } => !!d)).map((d) => ({ id: d.id, ...d.data }));
}

/** Agent-facing view of messages; media get short-lived signed links when allowed. */
export async function toMessageViews(ctx: HubContext, messages: StoredMessage[], includeMediaLinks: boolean): Promise<MessageView[]> {
  const settings = await getSettings(ctx);
  const expiresAt = addDays(ctx.now(), settings.signedUrlDays);
  return Promise.all(messages.map(async (m) => {
    let media: MessageView['media'] = null;
    if (MEDIA_MESSAGE_TYPES.includes(m.type) && m.mediaAssetId) {
      const asset = await ctx.store.get<MediaAssetDoc>(COLLECTIONS.mediaAssets, m.mediaAssetId);
      let url: string | null = null;
      if (includeMediaLinks && asset?.status === 'ready' && asset.storagePath && ctx.blobs) {
        url = await ctx.blobs.signedUrl(asset.storagePath, expiresAt).catch(() => null);
      } else if (includeMediaLinks && asset?.status === 'external') {
        url = asset.externalUrl;
      }
      media = {
        mediaAssetId: m.mediaAssetId,
        status: asset?.status ?? 'unknown',
        contentType: asset?.contentType ?? null,
        size: asset?.size ?? m.fileSize ?? null,
        url,
        urlExpiresAt: url && asset?.status === 'ready' ? expiresAt.toISOString() : null,
      };
    }
    return {
      id: m.id,
      groupId: m.groupId,
      at: new Date(m.timestamp).toISOString(),
      sender: m.senderName,
      senderId: m.senderId,
      type: m.type,
      text: m.text,
      fileName: m.fileName,
      fileSize: m.fileSize,
      durationMs: m.durationMs,
      sticker: m.sticker,
      location: m.location,
      mentionsBot: m.mentionsBot,
      media,
    };
  }));
}
