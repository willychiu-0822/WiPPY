import { cleanupExpired } from '../../hub/cleanup';
import { GROUP, makeTestHub } from './helpers';

describe('cleanupExpired', () => {
  it('deletes expired messages, media (and their blobs), digests, alerts and audit logs only', async () => {
    const hub = makeTestHub();
    const past = new Date(hub.now().getTime() - 1000);
    const future = new Date(hub.now().getTime() + 1000);
    await hub.store.set('groupMessages', 'old', { groupId: GROUP, ttl: past });
    await hub.store.set('groupMessages', 'new', { groupId: GROUP, ttl: future });
    await hub.store.set('mediaAssets', 'mOld', { ttl: past, storagePath: 'line-media/x/mOld' });
    await hub.store.set('mediaAssets', 'mNoBlob', { ttl: past, storagePath: null });
    await hub.blobs.put('line-media/x/mOld', Buffer.from('x'), 'image/jpeg');
    await hub.store.set('digests', 'd', { ttl: past });
    await hub.store.set('hubAlerts', 'a', { ttl: past });
    await hub.store.set('hubAuditLogs', 'l', { ttl: past });

    expect(await cleanupExpired(hub)).toEqual({ groupMessages: 1, mediaAssets: 2, digests: 1, hubAlerts: 1, hubAuditLogs: 1 });
    expect(Object.keys(hub.store.dump('groupMessages'))).toEqual(['new']);
    expect(hub.store.dump('mediaAssets')).toEqual({});
    expect(hub.blobs.blobs.size).toBe(0);
    expect(await cleanupExpired(hub)).toEqual({ groupMessages: 0, mediaAssets: 0, digests: 0, hubAlerts: 0, hubAuditLogs: 0 });
  });

  it('keeps going when a blob delete fails', async () => {
    const hub = makeTestHub();
    await hub.store.set('mediaAssets', 'm', { ttl: new Date(0), storagePath: 'p' });
    jest.spyOn(hub.blobs, 'delete').mockRejectedValueOnce(new Error('gcs down'));
    expect((await cleanupExpired(hub)).mediaAssets).toBe(0);
    expect(hub.store.dump('mediaAssets')['m']).toBeDefined();
  });
});
