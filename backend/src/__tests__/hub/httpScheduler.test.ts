import { makeTestHub, type TestHub } from './helpers';
import { startHubServer, type HubServer } from './httpHelpers';

describe('hub scheduler endpoints', () => {
  let hub: TestHub;
  let server: HubServer;
  const prev = process.env.SCHEDULER_SECRET;
  beforeEach(async () => {
    process.env.SCHEDULER_SECRET = 'sched';
    hub = makeTestHub();
    server = await startHubServer(hub);
  });
  afterEach(async () => {
    await server.close();
    process.env.SCHEDULER_SECRET = prev;
  });

  it('requires the scheduler secret when configured', async () => {
    const paths = ['/scheduler/hub-tick', '/scheduler/hub-quota', '/scheduler/hub-cleanup'];
    for (const path of paths) {
      const missing = await server.call('POST', path);
      const empty = await server.call('POST', path, { headers: { 'X-Scheduler-Secret': '' } });
      const wrong = await server.call('POST', path, { headers: { 'X-Scheduler-Secret': 'not-sched' } });
      expect(missing.status).toBe(401);
      expect(empty.status).toBe(401);
      expect(wrong.status).toBe(401);
      expect(missing.body).toEqual({ error: 'Unauthorized' });
    }
  });

  it('rejects hub scheduler routes when SCHEDULER_SECRET is unset or blank', async () => {
    for (const secret of [undefined, '', '   '] as const) {
      if (secret === undefined) delete process.env.SCHEDULER_SECRET;
      else process.env.SCHEDULER_SECRET = secret;
      for (const path of ['/scheduler/hub-tick', '/scheduler/hub-quota', '/scheduler/hub-cleanup']) {
        const missing = await server.call('POST', path);
        const empty = await server.call('POST', path, { headers: { 'X-Scheduler-Secret': '' } });
        const arbitrary = await server.call('POST', path, { headers: { 'X-Scheduler-Secret': 'sched' } });
        expect(missing.status).toBe(401);
        expect(empty.status).toBe(401);
        expect(arbitrary.status).toBe(401);
        expect(JSON.stringify(arbitrary.body)).not.toContain('sched');
      }
    }
  });

  it('runs the quota monitor', async () => {
    hub.line.consumption = 150;
    const res = await server.call('POST', '/scheduler/hub-quota', { headers: { 'X-Scheduler-Secret': 'sched' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, quota: { percent: 75, used: 150, limit: 200, alertedLevel: 70 } });
  });

  it('returns 500 when LINE cannot be reached', async () => {
    jest.spyOn(hub.line, 'getQuota').mockRejectedValue(new Error('LINE down'));
    const res = await server.call('POST', '/scheduler/hub-quota', { headers: { 'X-Scheduler-Secret': 'sched' } });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: 'scheduler_failed' });
    expect(JSON.stringify(res.body)).not.toContain('LINE down');
  });

  it('passes unknown tasks through (404)', async () => {
    expect((await server.call('POST', '/scheduler/nope', { headers: { 'X-Scheduler-Secret': 'sched' } })).status).toBe(404);
  });
});
