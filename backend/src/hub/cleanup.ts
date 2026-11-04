import type { HubContext } from './core/context';
import { COLLECTIONS } from './core/types';

const BATCH = 300;
const TTL_COLLECTIONS = [COLLECTIONS.groupMessages, COLLECTIONS.mediaAssets, COLLECTIONS.digests, COLLECTIONS.alerts, COLLECTIONS.audit] as const;

/**
 * Daily retention sweep (also safe alongside Firestore TTL policies): removes
 * docs whose `ttl` passed, and the media blobs they point to.
 */
export async function cleanupExpired(ctx: HubContext): Promise<Record<string, number>> {
  const now = ctx.now();
  const deleted: Record<string, number> = {};
  for (const collection of TTL_COLLECTIONS) {
    const rows = await ctx.store.query<{ storagePath?: string | null }>(collection, { where: [{ field: 'ttl', op: '<', value: now }], limit: BATCH });
    let count = 0;
    for (const row of rows) {
      if (collection === COLLECTIONS.mediaAssets && row.data.storagePath && ctx.blobs) {
        try {
          await ctx.blobs.delete(row.data.storagePath);
        } catch (err) {
          console.warn(JSON.stringify({ severity: 'WARNING', event: 'hub_cleanup_blob_failed', id: row.id, error: String(err) }));
          continue;
        }
      }
      await ctx.store.delete(collection, row.id);
      count += 1;
    }
    deleted[collection] = count;
  }
  return deleted;
}
