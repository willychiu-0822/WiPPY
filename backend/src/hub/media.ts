import { raiseAlert } from './alerts';
import type { HubContext } from './core/context';
import { errorMessage, toJobError } from './core/errors';
import { PermanentError, RetryableError } from './core/jobs';
import { ContentTooLargeError } from './core/ports';
import { COLLECTIONS, type MediaAssetDoc } from './core/types';
import { getSettings } from './settings';

const TRANSCODING_RETRY_SECONDS = 30;

export function mediaStoragePath(asset: Pick<MediaAssetDoc, 'groupId' | 'lineMessageId'>): string {
  return `line-media/${asset.groupId}/${asset.lineMessageId}`;
}

/** Downloads one pending LINE media asset into the private bucket (hard flow). */
export async function downloadMediaAsset(ctx: HubContext, mediaAssetId: string): Promise<void> {
  const asset = await ctx.store.get<MediaAssetDoc>(COLLECTIONS.mediaAssets, mediaAssetId);
  if (!asset || asset.status !== 'pending') return;
  if (!ctx.blobs) throw new PermanentError('media bucket is not configured (HUB_MEDIA_BUCKET)');
  if (!ctx.line) throw new PermanentError('LINE is not configured');

  await ctx.store.update(COLLECTIONS.mediaAssets, mediaAssetId, { attempts: asset.attempts + 1, updatedAt: ctx.now() });

  try {
    if (asset.messageType === 'video' || asset.messageType === 'audio') {
      const status = await ctx.line.getContentTranscoding(asset.lineMessageId);
      if (status === 'processing') throw new RetryableError('LINE is still transcoding the content', TRANSCODING_RETRY_SECONDS);
      if (status === 'failed') throw new PermanentError('LINE failed to transcode the content');
    }

    const settings = await getSettings(ctx);
    let content: { data: Buffer; contentType: string };
    try {
      content = await ctx.line.getContent(asset.lineMessageId, settings.mediaMaxBytes);
    } catch (err) {
      if (err instanceof ContentTooLargeError) {
        await ctx.store.update(COLLECTIONS.mediaAssets, mediaAssetId, { status: 'skipped_too_large', updatedAt: ctx.now() });
        return;
      }
      throw err;
    }

    const storagePath = mediaStoragePath(asset);
    await ctx.blobs.put(storagePath, content.data, content.contentType);
    await ctx.store.update(COLLECTIONS.mediaAssets, mediaAssetId, {
      status: 'ready',
      storagePath,
      contentType: content.contentType,
      size: content.data.length,
      lastError: null,
      updatedAt: ctx.now(),
    });
  } catch (err) {
    await ctx.store.update(COLLECTIONS.mediaAssets, mediaAssetId, { lastError: errorMessage(err), updatedAt: ctx.now() });
    throw toJobError(err, 'media download');
  }
}

export async function onMediaDownloadFailed(ctx: HubContext, mediaAssetId: string, error: Error): Promise<void> {
  const asset = await ctx.store.get<MediaAssetDoc>(COLLECTIONS.mediaAssets, mediaAssetId);
  if (asset) {
    await ctx.store.update(COLLECTIONS.mediaAssets, mediaAssetId, { status: 'failed', lastError: error.message, updatedAt: ctx.now() });
  }
  await raiseAlert(ctx, {
    severity: 'warning',
    source: 'media_download',
    text: `群組媒體下載失敗（${asset?.messageType ?? 'media'} ${mediaAssetId}）：${error.message}`,
  });
}
