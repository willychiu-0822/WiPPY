import { raiseAlert, setAlertDeliverer } from '../../hub/alerts';
import { deliverAlertDirect } from '../../hub/alertDelivery';
import { UpstreamError } from '../../hub/core/ports';
import { saveSettings } from '../../hub/settings';
import { makeTestHub, seedGroup } from './helpers';

const ALERT_GROUP = 'C9999999999abcdef0123456789abcdef';

describe('raiseAlert', () => {
  afterEach(() => setAlertDeliverer(null));

  it('records the alert even when no alert group is configured', async () => {
    const hub = makeTestHub();
    setAlertDeliverer(deliverAlertDirect);
    const alert = await raiseAlert(hub, { severity: 'warning', source: 'test', text: 'disk' });
    expect(alert).toMatchObject({ delivered: false, deliveryError: 'alert_group_not_set' });
    expect(hub.store.dump('hubAlerts')[alert.id]).toMatchObject({ text: 'disk', severity: 'warning' });
    expect(hub.line.pushes).toHaveLength(0);
  });

  it('delivers to the alert group with a severity label, using the alert reserve', async () => {
    const hub = makeTestHub();
    await seedGroup(hub, ALERT_GROUP, { memberCount: 1 });
    await saveSettings(hub, { alertGroupId: ALERT_GROUP });
    hub.line.consumption = 199; // only the reserve is left
    setAlertDeliverer(deliverAlertDirect);
    const alert = await raiseAlert(hub, { severity: 'critical', source: 'test', text: 'Grok 派送失敗' });
    expect(alert.delivered).toBe(true);
    expect(hub.line.pushes[0].to).toBe(ALERT_GROUP);
    expect(hub.line.pushes[0].messages[0]).toEqual({ type: 'text', text: '🚨 WiPPY 預警\nGrok 派送失敗' });
  });

  it('never throws when delivery fails', async () => {
    const hub = makeTestHub();
    await seedGroup(hub, ALERT_GROUP, { memberCount: 1 });
    await saveSettings(hub, { alertGroupId: ALERT_GROUP });
    hub.line.pushError = new UpstreamError('down', 503);
    setAlertDeliverer(deliverAlertDirect);
    const alert = await raiseAlert(hub, { severity: 'info', source: 'test', text: 'x' });
    expect(alert).toMatchObject({ delivered: false, deliveryError: 'line_error' });
    setAlertDeliverer(async () => { throw new Error('boom'); });
    await expect(raiseAlert(hub, { severity: 'info', source: 'test', text: 'y' })).resolves.toMatchObject({ delivered: false, deliveryError: 'boom' });
  });
});
