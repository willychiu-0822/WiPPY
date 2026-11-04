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
    expect((await server.call('POST', '/scheduler/hub-quota')).status).toBe(401);
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
  });

  it('passes unknown tasks through (404)', async () => {
    expect((await server.call('POST', '/scheduler/nope', { headers: { 'X-Scheduler-Secret': 'sched' } })).status).toBe(404);
  });
});
