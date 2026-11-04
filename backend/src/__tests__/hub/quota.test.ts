import { checkQuota, estimateCost, getQuotaStatus, monitorQuota, recordSent } from '../../hub/quota';
import { saveSettings } from '../../hub/settings';
import { GROUP, makeTestHub, seedGroup, type TestHub } from './helpers';

describe('LINE quota', () => {
  let hub: TestHub;
  beforeEach(async () => {
    hub = makeTestHub();
    await seedGroup(hub, GROUP, { memberCount: 10 });
  });

  it('estimates the cost of a group push as its member count, cached for an hour', async () => {
    hub.line.memberCounts[GROUP] = 12;
    expect(await estimateCost(hub, GROUP)).toBe(12);
    hub.line.memberCounts[GROUP] = 30;
    expect(await estimateCost(hub, GROUP)).toBe(12);
    hub.clock.now = new Date(hub.clock.now.getTime() + 61 * 60_000);
    expect(await estimateCost(hub, GROUP)).toBe(30);
  });

  it('falls back to the stored member count, then 1, when LINE cannot tell', async () => {
    delete hub.line.memberCounts[GROUP];
    expect(await estimateCost(hub, GROUP)).toBe(10);
    expect(await estimateCost(hub, 'Cunknown')).toBe(1);
  });

  it('tracks usage from LINE plus sends since the last check', async () => {
    hub.line.consumption = 100;
    let status = await getQuotaStatus(hub);
    expect(status).toMatchObject({ type: 'limited', limit: 200, used: 100, remaining: 100, reserve: 10, percent: 50 });
    await recordSent(hub, 15);
    status = await getQuotaStatus(hub);
    expect(status).toMatchObject({ used: 115, remaining: 85 });
  });

  it('keeps 5% in reserve for alerts and blocks agents first', async () => {
    const status = { type: 'limited' as const, limit: 200, used: 180, remaining: 20, reserve: 10, percent: 90, checkedAt: new Date(), unknown: false };
    expect(checkQuota(status, 10, 'agent')).toEqual({ ok: true });
    expect(checkQuota(status, 11, 'agent')).toMatchObject({ ok: false, code: 'line_quota_reserve' });
    expect(checkQuota(status, 11, 'alert')).toEqual({ ok: true });
    expect(checkQuota(status, 21, 'alert')).toMatchObject({ ok: false, code: 'line_quota_exhausted' });
    expect(checkQuota({ ...status, type: 'none', limit: null }, 999, 'agent')).toEqual({ ok: true });
  });

  it('does not block sends when the quota cannot be read', async () => {
    jest.spyOn(hub.line, 'getQuota').mockRejectedValue(new Error('down'));
    const status = await getQuotaStatus(hub);
    expect(status.unknown).toBe(true);
    expect(checkQuota(status, 50, 'agent')).toEqual({ ok: true });
  });

  it('alerts once per threshold per month, using the highest crossed level', async () => {
    await saveSettings(hub, { alertGroupId: null });
    hub.line.consumption = 150;
    expect(await monitorQuota(hub)).toMatchObject({ percent: 75, alertedLevel: 70 });
    expect(await monitorQuota(hub)).toMatchObject({ alertedLevel: null });
    hub.line.consumption = 195;
    expect(await monitorQuota(hub)).toMatchObject({ percent: 97.5, alertedLevel: 90 });
    const alerts = Object.values(hub.store.dump('hubAlerts'));
    expect(alerts).toHaveLength(2);
    expect(alerts.map((a) => a['severity']).sort()).toEqual(['critical', 'warning']);
    expect(String(alerts.find((a) => a['severity'] === 'critical')!['text'])).toContain('97.5%');

    // New month: levels reset.
    hub.clock.now = new Date('2026-12-01T03:00:00.000Z');
    hub.line.consumption = 160;
    expect(await monitorQuota(hub)).toMatchObject({ alertedLevel: 70 });
  });

  it('jumping straight past 90% sends a single critical alert', async () => {
    hub.line.consumption = 190;
    expect(await monitorQuota(hub)).toMatchObject({ alertedLevel: 90 });
    expect(await monitorQuota(hub)).toMatchObject({ alertedLevel: null });
    expect(Object.values(hub.store.dump('hubAlerts'))).toHaveLength(1);
  });
});
