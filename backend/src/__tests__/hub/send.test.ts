import { UpstreamError } from '../../hub/core/ports';
import { linkCard, retryKeyFor, sendToLine } from '../../hub/send';
import { GROUP, makeTestHub, seedGroup, type TestHub } from './helpers';

describe('retryKeyFor', () => {
  it('derives a stable UUID-shaped LINE retry key from any seed', () => {
    const key = retryKeyFor('action:abc');
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(retryKeyFor('action:abc')).toBe(key);
    expect(retryKeyFor('action:abd')).not.toBe(key);
  });
});

describe('linkCard', () => {
  it('builds a Flex bubble with title, description, optional hero image and an open button', () => {
    const card = linkCard({ url: 'https://grok.example/p', title: '活動報告', description: '本週重點', imageUrl: 'https://cdn.example/h.png' });
    expect(card.type).toBe('flex');
    expect(card.altText).toBe('活動報告');
    const json = JSON.stringify(card);
    expect(json).toContain('"uri":"https://grok.example/p"');
    expect(json).toContain('"url":"https://cdn.example/h.png"');
    expect(json).toContain('本週重點');
    const plain = linkCard({ url: 'https://grok.example/p', title: 't'.repeat(500) });
    expect(plain.altText.length).toBeLessThanOrEqual(400);
    expect(JSON.stringify(plain)).not.toContain('"hero"');
  });
});

describe('sendToLine', () => {
  let hub: TestHub;
  beforeEach(async () => {
    hub = makeTestHub();
    await seedGroup(hub, GROUP, { memberCount: 8 });
  });

  it('pushes with a retry key and counts the cost against the quota', async () => {
    const result = await sendToLine(hub, { to: GROUP, messages: [{ type: 'text', text: 'hi' }], retryKey: 'rk', purpose: 'agent' });
    expect(result).toEqual({ ok: true, cost: 8 });
    expect(hub.line.pushes).toEqual([{ to: GROUP, messages: [{ type: 'text', text: 'hi' }], retryKey: 'rk' }]);
    expect(Object.values(hub.store.dump('hubQuota'))[0]).toMatchObject({ sentSinceCheck: 8 });
  });

  it('blocks agent sends that would dip into the alert reserve, without calling LINE', async () => {
    hub.line.consumption = 185;
    const result = await sendToLine(hub, { to: GROUP, messages: [{ type: 'text', text: 'hi' }], retryKey: 'rk', purpose: 'agent' });
    expect(result).toMatchObject({ ok: false, code: 'line_quota_reserve', retryable: false });
    expect(hub.line.pushes).toHaveLength(0);
  });

  it('classifies LINE failures as retryable or not', async () => {
    hub.line.pushError = new UpstreamError('server', 500);
    expect(await sendToLine(hub, { to: GROUP, messages: [{ type: 'text', text: 'x' }], retryKey: 'a', purpose: 'agent' })).toMatchObject({ ok: false, code: 'line_error', retryable: true });
    hub.line.pushError = new UpstreamError('bad request', 400);
    expect(await sendToLine(hub, { to: GROUP, messages: [{ type: 'text', text: 'x' }], retryKey: 'b', purpose: 'agent' })).toMatchObject({ ok: false, code: 'line_error', retryable: false });
  });

  it('reports a missing LINE configuration', async () => {
    const bare = makeTestHub({ line: null });
    expect(await sendToLine(bare, { to: GROUP, messages: [], retryKey: 'k', purpose: 'agent' })).toMatchObject({ ok: false, code: 'line_not_configured' });
  });
});
