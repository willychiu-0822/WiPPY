import { acquireLlmSlot, getLlmUsage, recordLlmCall } from '../../hub/llmThrottle';
import { saveSettings } from '../../hub/settings';
import { makeTestHub } from './helpers';

describe('LLM throttle', () => {
  it('enforces the minimum interval between calls', async () => {
    const hub = makeTestHub();
    expect(await acquireLlmSlot(hub)).toEqual({ ok: true });
    hub.clock.now = new Date(hub.clock.now.getTime() + 2000);
    expect(await acquireLlmSlot(hub)).toEqual({ ok: false, reason: 'rate_limit', retryAfterMs: 4000 });
    hub.clock.now = new Date(hub.clock.now.getTime() + 4000);
    expect(await acquireLlmSlot(hub)).toEqual({ ok: true });
  });

  it('enforces calls per minute', async () => {
    const hub = makeTestHub();
    await saveSettings(hub, { llm: { maxRpm: 2, maxRpd: 100, minIntervalMs: 0 } });
    expect((await acquireLlmSlot(hub)).ok).toBe(true);
    expect((await acquireLlmSlot(hub)).ok).toBe(true);
    hub.clock.now = new Date(hub.clock.now.getTime() + 10_000);
    expect(await acquireLlmSlot(hub)).toEqual({ ok: false, reason: 'rate_limit', retryAfterMs: 50_000 });
    hub.clock.now = new Date(hub.clock.now.getTime() + 50_000);
    expect((await acquireLlmSlot(hub)).ok).toBe(true);
  });

  it('stops for the day at the daily limit and counts calls made elsewhere', async () => {
    const hub = makeTestHub();
    await saveSettings(hub, { llm: { maxRpm: 100, maxRpd: 3, minIntervalMs: 0 } });
    await recordLlmCall(hub);
    await recordLlmCall(hub);
    expect((await acquireLlmSlot(hub)).ok).toBe(true);
    expect(await acquireLlmSlot(hub)).toEqual({ ok: false, reason: 'daily_limit', retryAfterMs: expect.any(Number) });
    expect(await getLlmUsage(hub)).toEqual({ today: 3, maxRpd: 3 });
    hub.clock.now = new Date(hub.clock.now.getTime() + 24 * 3600_000);
    expect((await acquireLlmSlot(hub)).ok).toBe(true);
  });
});
