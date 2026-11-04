import type { AlertDeliverer } from './alerts';
import { retryKeyFor, sendToLine } from './send';
import { getSettings } from './settings';

/** Pushes an alert straight to the alert group (may use the quota reserve). */
export const deliverAlertDirect: AlertDeliverer = async (ctx, text, alertId) => {
  const settings = await getSettings(ctx);
  if (!settings.alertGroupId) return { delivered: false, error: 'alert_group_not_set' };
  const result = await sendToLine(ctx, {
    to: settings.alertGroupId,
    messages: [{ type: 'text', text: text.slice(0, 5000) }],
    retryKey: retryKeyFor(`alert:${alertId}`),
    purpose: 'alert',
  });
  return result.ok ? { delivered: true, error: null } : { delivered: false, error: result.code };
};
