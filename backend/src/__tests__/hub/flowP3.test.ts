import '../../hub/register';
import { runHubJob } from '../../hub/jobHandlers';
import { resetSenderNameCache } from '../../hub/ingest';
import { setHubContext } from '../../hub/runtime';
import { saveSettings } from '../../hub/settings';
import { processHubWebhookEvents } from '../../hub/webhook';
import { GROUP, jsonResponse, makeTestHub, seedGrokAgent, seedGroup, seedInstinctAgent, seedRule, textEvent, type TestHub } from './helpers';
import { startHubServer } from './httpHelpers';

describe('P3 end-to-end: LINE message → rule → agent', () => {
  let hub: TestHub;
  beforeEach(async () => {
    resetSenderNameCache();
    hub = makeTestHub();
    setHubContext(hub);
    hub.line.profiles['U1'] = 'Alice';
    await seedGroup(hub);
    await saveSettings(hub, { llm: { maxRpm: 100, maxRpd: 100, minIntervalMs: 0 } });
  });
  afterEach(() => setHubContext(null));

  it('a keyword message reaches the Grok routine with a digest, after one transient failure', async () => {
    await seedGrokAgent(hub);
    await seedRule(hub, 'r1', { include: { digest: true, raw: true, media: true, contextCount: 10 } });
    hub.llmMock.chat.mockResolvedValue('{"summary":"有人回報停電","points":["停電"],"tags":["緊急"]}');
    hub.fetchMock.mockResolvedValueOnce(jsonResponse(502, 'bad gateway')).mockResolvedValueOnce(jsonResponse(200, {}));

    await processHubWebhookEvents(hub, [textEvent({ id: 'e1', text: '緊急！大樓停電' })]);
    const outcomes = await hub.queue.drain((job) => runHubJob(hub, job));
    expect(outcomes).toEqual(['retry_scheduled', 'done']);

    const body = JSON.parse(hub.fetchMock.mock.calls[1][1].body);
    expect(body.digest.summary).toBe('有人回報停電');
    expect(body.messages.map((m: any) => m.text)).toEqual(['緊急！大樓停電']);
    expect(Object.values(hub.store.dump('agentDispatches'))[0]).toMatchObject({ status: 'sent', attempts: 2 });
  });

  it('a schedule rule for Instinct lands in its inbox via /scheduler/hub-tick', async () => {
    await seedInstinctAgent(hub);
    await seedRule(hub, 'daily', { agentId: 'instinct_1', trigger: { type: 'schedule', intervalMinutes: 30 } });
    const previousSecret = process.env.SCHEDULER_SECRET;
    process.env.SCHEDULER_SECRET = 'sched';
    const server = await startHubServer(hub);
    const schedulerHeaders = { 'X-Scheduler-Secret': 'sched' };
    try {
      expect((await server.call('POST', '/scheduler/hub-tick', { headers: schedulerHeaders })).body).toEqual({ ok: true, dispatched: 0, overdueAlerts: 0 });
      hub.clock.now = new Date(hub.clock.now.getTime() + 60_000);
      await processHubWebhookEvents(hub, [textEvent({ id: 'e2', ts: hub.now().getTime(), text: '今天的進度如何？' })]);
      hub.clock.now = new Date(hub.clock.now.getTime() + 30 * 60_000);
      expect((await server.call('POST', '/scheduler/hub-tick', { headers: schedulerHeaders })).body).toEqual({ ok: true, dispatched: 1, overdueAlerts: 0 });
      await hub.queue.drain((job) => runHubJob(hub, job));
      expect(Object.values(hub.store.dump('agentInbox'))[0]).toMatchObject({ agentId: 'instinct_1', status: 'open', messageIds: ['e2'] });
    } finally {
      await server.close();
      if (previousSecret === undefined) delete process.env.SCHEDULER_SECRET;
      else process.env.SCHEDULER_SECRET = previousSecret;
    }
  });
});
