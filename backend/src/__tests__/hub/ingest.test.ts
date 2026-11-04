import { ingestLineEvent, resetSenderNameCache } from '../../hub/ingest';
import { GROUP, makeTestHub, seedGroup, textEvent, type TestHub } from './helpers';

describe('ingestLineEvent', () => {
  let hub: TestHub;
  beforeEach(async () => {
    resetSenderNameCache();
    hub = makeTestHub();
    hub.line.profiles['U1'] = 'Alice';
    await seedGroup(hub);
  });

  it('ignores non-message events and non-group sources', async () => {
    expect(await ingestLineEvent(hub, { type: 'join', webhookEventId: 'e', source: { type: 'group', groupId: GROUP } })).toEqual({ status: 'ignored', reason: 'not_group_message' });
    const dm = { ...textEvent(), source: { type: 'user', userId: 'U1' } };
    expect(await ingestLineEvent(hub, dm)).toEqual({ status: 'ignored', reason: 'not_group_message' });
    expect(hub.store.dump('groupMessages')).toEqual({});
  });

  it('does not store anything for groups that are not opened to agents', async () => {
    await seedGroup(hub, GROUP, { agentEnabled: false });
    expect(await ingestLineEvent(hub, textEvent())).toEqual({ status: 'ignored', reason: 'group_not_enabled' });
    expect(await ingestLineEvent(hub, textEvent({ groupId: 'Cunknown' }))).toEqual({ status: 'ignored', reason: 'group_not_enabled' });
    expect(hub.store.dump('groupMessages')).toEqual({});
  });

  it('stores a text message with sender name, bot mention flag and retention ttl', async () => {
    const result = await ingestLineEvent(hub, textEvent({ text: '@WiPPY 明天幾點？', mentionSelf: true }));
    expect(result.status).toBe('stored');
    const doc = hub.store.dump('groupMessages')['evt1'];
    expect(doc).toMatchObject({
      ownerId: 'owner_1',
      groupId: GROUP,
      lineMessageId: 'msg_evt1',
      senderId: 'U1',
      senderName: 'Alice',
      type: 'text',
      text: '@WiPPY 明天幾點？',
      mentionsBot: true,
      mediaAssetId: null,
    });
    expect(doc['timestamp']).toEqual(new Date('2026-11-04T01:59:00.000Z'));
    expect(doc['ttl']).toEqual(new Date('2027-05-03T02:00:00.000Z'));
  });

  it('deduplicates LINE redeliveries by webhookEventId', async () => {
    await ingestLineEvent(hub, textEvent());
    expect(await ingestLineEvent(hub, textEvent({ text: 'changed' }))).toEqual({ status: 'duplicate' });
    expect(hub.store.dump('groupMessages')['evt1']['text']).toBe('hello');
  });

  it('falls back to the user id when the profile lookup fails, and caches names', async () => {
    await ingestLineEvent(hub, textEvent({ id: 'a', userId: 'U_unknown' }));
    expect(hub.store.dump('groupMessages')['a']['senderName']).toBe('U_unknown');
    await ingestLineEvent(hub, textEvent({ id: 'b' }));
    await ingestLineEvent(hub, textEvent({ id: 'c' }));
    expect(hub.line.profileCalls).toBe(2);
  });

  it('creates a pending media asset and queues a download for LINE-hosted images', async () => {
    const event = {
      ...textEvent({ id: 'img' }),
      message: { id: 'line_img', type: 'image', contentProvider: { type: 'line' }, imageSet: { id: 'set1', index: 1, total: 3 } },
    };
    await ingestLineEvent(hub, event);
    const msg = hub.store.dump('groupMessages')['img'];
    expect(msg).toMatchObject({ type: 'image', mediaAssetId: 'line_img', imageSet: { id: 'set1', index: 1, total: 3 } });
    expect(hub.store.dump('mediaAssets')['line_img']).toMatchObject({ status: 'pending', groupId: GROUP, messageType: 'image', attempts: 0 });
    expect(hub.queue.jobs).toEqual([{ job: { type: 'media_download', id: 'line_img', attempt: 1, payload: { mediaAssetId: 'line_img' } }, delaySeconds: 0 }]);
  });

  it('records externally hosted media without downloading it', async () => {
    const event = {
      ...textEvent({ id: 'ext' }),
      message: { id: 'line_ext', type: 'image', contentProvider: { type: 'external', originalContentUrl: 'https://cdn.example/a.jpg', previewImageUrl: 'https://cdn.example/a_s.jpg' } },
    };
    await ingestLineEvent(hub, event);
    expect(hub.store.dump('mediaAssets')['line_ext']).toMatchObject({ status: 'external', externalUrl: 'https://cdn.example/a.jpg', externalPreviewUrl: 'https://cdn.example/a_s.jpg' });
    expect(hub.queue.jobs).toHaveLength(0);
  });

  it('skips downloading files above the size limit but keeps their metadata', async () => {
    const big = { ...textEvent({ id: 'big' }), message: { id: 'line_big', type: 'file', fileName: 'deck.pdf', fileSize: 60 * 1024 * 1024 } };
    await ingestLineEvent(hub, big);
    expect(hub.store.dump('groupMessages')['big']).toMatchObject({ type: 'file', fileName: 'deck.pdf', fileSize: 62914560 });
    expect(hub.store.dump('mediaAssets')['line_big']).toMatchObject({ status: 'skipped_too_large', fileName: 'deck.pdf', size: 62914560 });
    expect(hub.queue.jobs).toHaveLength(0);

    const small = { ...textEvent({ id: 'small' }), message: { id: 'line_small', type: 'file', fileName: 'a.txt', fileSize: '120' } };
    await ingestLineEvent(hub, small);
    expect(hub.store.dump('mediaAssets')['line_small']).toMatchObject({ status: 'pending', size: 120 });
    expect(hub.queue.jobs).toHaveLength(1);
  });

  it('stores video/audio duration, stickers and locations', async () => {
    await ingestLineEvent(hub, { ...textEvent({ id: 'v' }), message: { id: 'lv', type: 'video', duration: 6000, contentProvider: { type: 'line' } } });
    await ingestLineEvent(hub, { ...textEvent({ id: 's' }), message: { id: 'ls', type: 'sticker', packageId: '1', stickerId: '2' } });
    await ingestLineEvent(hub, { ...textEvent({ id: 'l' }), message: { id: 'll', type: 'location', title: 'Office', address: 'Taipei', latitude: 25.03, longitude: 121.56 } });
    const docs = hub.store.dump('groupMessages');
    expect(docs['v']).toMatchObject({ type: 'video', durationMs: 6000, mediaAssetId: 'lv' });
    expect(docs['s']).toMatchObject({ type: 'sticker', sticker: { packageId: '1', stickerId: '2' }, mediaAssetId: null });
    expect(docs['l']).toMatchObject({ type: 'location', location: { title: 'Office', address: 'Taipei', latitude: 25.03, longitude: 121.56 } });
  });
});
