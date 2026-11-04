import type { HubContext } from './core/context';
import { addDays } from './core/time';
import { COLLECTIONS, type AlertSeverity, type HubAlertDoc } from './core/types';
import { getSettings } from './settings';

export interface AlertInput {
  severity: AlertSeverity;
  source: string;
  text: string;
}

export type AlertDeliverer = (ctx: HubContext, text: string, alertId: string) => Promise<{ delivered: boolean; error: string | null }>;

let deliverer: AlertDeliverer | null = null;

/** The LINE send layer registers how alerts reach the alert group. */
export function setAlertDeliverer(fn: AlertDeliverer | null): void {
  deliverer = fn;
}

/**
 * Records an alert (always visible on the dashboard) and tries to deliver it to
 * the alert group. Never throws: alerting must not break the caller.
 */
export async function raiseAlert(ctx: HubContext, input: AlertInput): Promise<HubAlertDoc & { id: string }> {
  const now = ctx.now();
  const settings = await getSettings(ctx).catch(() => null);
  const id = ctx.store.newId();
  const doc: HubAlertDoc = {
    ownerId: ctx.ownerId,
    severity: input.severity,
    source: input.source,
    text: input.text,
    delivered: false,
    deliveryError: null,
    createdAt: now,
    ttl: addDays(now, settings?.retentionDays ?? 180),
  };
  try {
    if (!settings?.alertGroupId) {
      doc.deliveryError = 'alert_group_not_set';
    } else if (!deliverer) {
      doc.deliveryError = 'alert_delivery_unavailable';
    } else {
      const label = input.severity === 'critical' ? '🚨' : input.severity === 'warning' ? '⚠️' : 'ℹ️';
      const result = await deliverer(ctx, `${label} WiPPY 預警\n${input.text}`, id);
      doc.delivered = result.delivered;
      doc.deliveryError = result.error;
    }
  } catch (err) {
    doc.deliveryError = err instanceof Error ? err.message : String(err);
  }
  try {
    await ctx.store.set(COLLECTIONS.alerts, id, doc);
  } catch (err) {
    console.error(JSON.stringify({ severity: 'ERROR', event: 'hub_alert_store_failed', error: String(err), text: input.text }));
  }
  return { id, ...doc };
}
