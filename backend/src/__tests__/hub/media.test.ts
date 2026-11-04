import { PermanentError, RetryableError } from '../../hub/core/jobs';
import { ContentTooLargeError, UpstreamError } from '../../hub/core/ports';
import { downloadMediaAsset, onMediaDownloadFailed } from '../../hub/media';
import { GROUP, makeTestHub, seedGroup, type TestHub } from './helpers';

async function seedAsset(hub: TestHub, id: string, messageType: string, status = 'pending') {
  await hub.store.set('mediaAssets', id, {
    ownerId: hub.ownerId, groupId: GROUP, lineMessageId: id, messageType, status,
    storagePath: null, contentType: null, size: null, fileName: messageType === 'file' ? 'a.pdf' : null,
    externalUrl: null, externalPreviewUrl: null, attempts: 0, lastError: null,
    createdAt: hub.now(), updatedAt: hub.now(), ttl: hub.now(),
  });
}

describe('downloadMediaAsset', () => {
  let hub: TestHub;
  beforeEach(async () => {
    hub = makeTestHub();
    await seedGroup(hub);
  });

  it('downloads LINE content into the private bucket and marks the asset ready', async () => {
    await seedAsset(hub, 'img1', 'image');
    hub.line.contents['img1'] = { data: Buffer.from('jpegbytes'), contentType: 'image/jpeg' };
    await downloadMediaAsset(hub, 'img1');
    expect(hub.blobs.blobs.get(`line-media/${GROUP}/img1`)).toEqual({ data: Buffer.from('jpegbytes'), contentType: 'image/jpeg' });
    expect(hub.store.dump('mediaAssets')['img1']).toMatchObject({ status: 'ready', storagePath: `line-media/${GROUP}/img1`, contentType: 'image/jpeg', size: 9, attempts: 1 });
  });

  it('waits for LINE transcoding of video/audio before downloading', async () => {
    await seedAsset(hub, 'v1', 'video');
    hub.line.transcoding['v1'] = 'processing';
    await expect(downloadMediaAsset(hub, 'v1')).rejects.toThrow(RetryableError);
    hub.line.transcoding['v1'] = 'failed';
    await expect(downloadMediaAsset(hub, 'v1')).rejects.toThrow(PermanentError);
  });

  it('marks oversized content as skipped instead of failing', async () => {
    await seedAsset(hub, 'big', 'video');
    hub.line.contentError = new ContentTooLargeError(10);
    await downloadMediaAsset(hub, 'big');
    expect(hub.store.dump('mediaAssets')['big']).toMatchObject({ status: 'skipped_too_large' });
  });

  it('is a no-op for assets that are no longer pending', async () => {
    await seedAsset(hub, 'done', 'image', 'ready');
    await downloadMediaAsset(hub, 'done');
    await downloadMediaAsset(hub, 'missing');
    expect(hub.blobs.blobs.size).toBe(0);
  });

  it('classifies LINE errors: 404 is permanent, 5xx and network errors are retryable', async () => {
    await seedAsset(hub, 'x', 'image');
    hub.line.contentError = new UpstreamError('gone', 404);
    await expect(downloadMediaAsset(hub, 'x')).rejects.toThrow(PermanentError);
    hub.line.contentError = new UpstreamError('oops', 503);
    await expect(downloadMediaAsset(hub, 'x')).rejects.toThrow(RetryableError);
    hub.line.contentError = new Error('ECONNRESET');
    await expect(downloadMediaAsset(hub, 'x')).rejects.toThrow(RetryableError);
    expect(hub.store.dump('mediaAssets')['x']).toMatchObject({ attempts: 3, lastError: 'ECONNRESET', status: 'pending' });
  });

  it('fails permanently when no media bucket is configured', async () => {
    const bare = makeTestHub({ blobs: null });
    await seedAsset(bare as TestHub, 'img', 'image');
    await expect(downloadMediaAsset(bare, 'img')).rejects.toThrow(/bucket/);
  });

  it('marks the asset failed and raises an alert after the final attempt', async () => {
    await seedAsset(hub, 'img', 'image');
    await onMediaDownloadFailed(hub, 'img', new Error('still failing'));
    expect(hub.store.dump('mediaAssets')['img']).toMatchObject({ status: 'failed', lastError: 'still failing' });
    const alerts = Object.values(hub.store.dump('hubAlerts'));
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ severity: 'warning', source: 'media_download' });
  });
});
