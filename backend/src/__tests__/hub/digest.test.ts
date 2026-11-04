import { RetryableError } from '../../hub/core/jobs';
import { ensureDigest, parseDigestOutput } from '../../hub/digest';
import { saveSettings } from '../../hub/settings';
import { GROUP, makeTestHub, seedGroup, seedMessage, type TestHub } from './helpers';

describe('parseDigestOutput', () => {
  it('accepts JSON with or without code fences and drops non-string items', () => {
    expect(parseDigestOutput('```json\n{"summary":"s","points":["a",1],"tags":["t"]}\n```')).toEqual({ summary: 's', points: ['a'], tags: ['t'] });
    expect(parseDigestOutput('前言 {"summary":"x","points":[],"tags":[]} 後記')).toEqual({ summary: 'x', points: [], tags: [] });
    expect(parseDigestOutput('not json')).toBeNull();
    expect(parseDigestOutput('{"points":[]}')).toBeNull();
  });
});

describe('ensureDigest', () => {
  let hub: TestHub;
  beforeEach(async () => {
    hub = makeTestHub();
    await seedGroup(hub);
    await saveSettings(hub, { llm: { maxRpm: 100, maxRpd: 100, minIntervalMs: 0 } });
  });

  async function messages() {
    const a = await seedMessage(hub, { id: 'a', text: '明天 10:00 在台北開會，預算 5000 元' });
    hub.clock.now = new Date(hub.clock.now.getTime() + 1000);
    const b = await seedMessage(hub, { id: 'b', type: 'file', text: null, fileName: 'plan.pdf', fileSize: 1200, mediaAssetId: 'line_b' });
    await hub.store.set('mediaAssets', 'line_b', { status: 'ready' });
    return [a, b];
  }

  it('summarises text with the free model and lists media by hard flow', async () => {
    hub.llmMock.chat.mockResolvedValue('{"summary":"討論明天開會","points":["10:00 台北","預算 5000"],"tags":["活動"]}');
    const digest = await ensureDigest(hub, GROUP, await messages());
    expect(digest).toMatchObject({
      skipped: false,
      summary: '討論明天開會',
      points: ['10:00 台北', '預算 5000'],
      tags: ['活動'],
      imageNotes: [],
      mediaList: [{ messageId: 'b', sender: 'Alice', type: 'file', fileName: 'plan.pdf', size: 1200, mediaAssetId: 'line_b', status: 'ready' }],
    });
    const prompt = hub.llmMock.chat.mock.calls[0][0];
    expect(prompt[0].role).toBe('system');
    expect(prompt[1].content).toContain('Alice: 明天 10:00 在台北開會');
    expect(prompt[1].content).toContain('[檔案 plan.pdf]');
  });

  it('reuses an existing digest for the same messages instead of calling the model again', async () => {
    hub.llmMock.chat.mockResolvedValue('{"summary":"s","points":[],"tags":[]}');
    const msgs = await messages();
    const first = await ensureDigest(hub, GROUP, msgs);
    const second = await ensureDigest(hub, GROUP, msgs);
    expect(second.id).toBe(first.id);
    expect(hub.llmMock.chat).toHaveBeenCalledTimes(1);
  });

  it('skips (without retrying) on invalid output, model errors, missing model or no text', async () => {
    hub.llmMock.chat.mockResolvedValueOnce('nonsense');
    expect(await ensureDigest(hub, GROUP, await messages())).toMatchObject({ skipped: true, skipReason: 'invalid_output', summary: null });
    expect(hub.llmMock.chat).toHaveBeenCalledTimes(1);

    hub.llmMock.chat.mockRejectedValueOnce(new Error('model exploded'));
    const m = await seedMessage(hub, { id: 'c', text: 'hi' });
    expect(await ensureDigest(hub, GROUP, [m])).toMatchObject({ skipped: true, skipReason: 'llm_error' });

    const noModel = makeTestHub({ llm: null });
    await seedGroup(noModel as TestHub);
    expect(await ensureDigest(noModel, GROUP, [m])).toMatchObject({ skipped: true, skipReason: 'llm_not_configured' });

    const sticker = await seedMessage(hub, { id: 'st', type: 'sticker', text: null });
    expect(await ensureDigest(hub, GROUP, [sticker])).toMatchObject({ skipped: true, skipReason: 'no_text' });
  });

  it('degrades to skipped when the daily budget is used up, and retries later on per-minute limits or 429', async () => {
    await saveSettings(hub, { llm: { maxRpm: 100, maxRpd: 0, minIntervalMs: 0 } });
    const m = await seedMessage(hub, { id: 'd', text: 'hi' });
    expect(await ensureDigest(hub, GROUP, [m])).toMatchObject({ skipped: true, skipReason: 'llm_daily_limit' });

    await saveSettings(hub, { llm: { maxRpm: 100, maxRpd: 100, minIntervalMs: 0 } });
    hub.llmMock.chat.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'));
    const e = await seedMessage(hub, { id: 'e', text: 'hey' });
    await expect(ensureDigest(hub, GROUP, [e])).rejects.toBeInstanceOf(RetryableError);

    await saveSettings(hub, { llm: { maxRpm: 1, maxRpd: 100, minIntervalMs: 0 } });
    hub.clock.now = new Date(hub.clock.now.getTime() + 61_000);
    hub.llmMock.chat.mockResolvedValue('{"summary":"ok","points":[],"tags":[]}');
    const f = await seedMessage(hub, { id: 'f', text: 'one' });
    await ensureDigest(hub, GROUP, [f]);
    const g = await seedMessage(hub, { id: 'g', text: 'two' });
    const err = await ensureDigest(hub, GROUP, [g]).catch((x) => x);
    expect(err).toBeInstanceOf(RetryableError);
    expect(err.delaySeconds).toBeGreaterThan(0);
  });
});
