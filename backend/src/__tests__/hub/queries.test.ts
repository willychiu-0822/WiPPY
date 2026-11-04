import type { Actor } from '../../hub/core/types';
import { HubAccessError, getDigestFor, getDispatchFor, getMediaFor, getMessagesFor, getQuotaFor, listGroupsFor, listInboxFor, listRecordsFor, searchMessagesFor } from '../../hub/queries';
import { GROUP, GROUP_B, makeTestHub, seedGrokAgent, seedGroup, seedInstinctAgent, seedMessage, type TestHub } from './helpers';

const grok: Actor = { kind: 'agent', ownerId: 'owner_1', agentId: 'grok_1', via: 'rest' };
const instinct: Actor = { kind: 'agent', ownerId: 'owner_1', agentId: 'instinct_1', via: 'ui' };
const owner: Actor = { kind: 'owner', ownerId: 'owner_1', via: 'ui' };

describe('agent queries', () => {
  let hub: TestHub;
  beforeEach(async () => {
    hub = makeTestHub();
    await seedGroup(hub, GROUP, { name: 'Alpha' });
    await seedGroup(hub, GROUP_B, { name: 'Beta' });
    await seedGrokAgent(hub, { allowedGroupIds: [GROUP] });
    await seedInstinctAgent(hub, { allowedGroupIds: [GROUP, GROUP_B] });
    for (let i = 0; i < 3; i += 1) {
      hub.clock.now = new Date(hub.clock.now.getTime() + 60_000);
      await seedMessage(hub, { id: `a${i}`, text: i === 1 ? '退款 問題' : `hello ${i}` });
    }
    await seedMessage(hub, { id: 'b0', groupId: GROUP_B, text: '退款 B' });
  });

  it('lists only groups the agent is allowed to use', async () => {
    expect((await listGroupsFor(hub, grok)).map((g) => g.groupId)).toEqual([GROUP]);
    expect((await listGroupsFor(hub, owner)).map((g) => g.groupId).sort()).toEqual([GROUP, GROUP_B].sort());
  });

  it('returns messages chronologically within time and type filters, and denies other groups', async () => {
    const all = await getMessagesFor(hub, grok, GROUP, {});
    expect(all.map((m) => m.id)).toEqual(['a0', 'a1', 'a2']);
    const since = await getMessagesFor(hub, grok, GROUP, { since: new Date(hub.now().getTime() - 90_000), limit: 10 });
    expect(since.map((m) => m.id)).toEqual(['a1', 'a2']);
    expect(await getMessagesFor(hub, grok, GROUP, { types: ['image'] })).toEqual([]);
    await expect(getMessagesFor(hub, grok, GROUP_B, {})).rejects.toMatchObject({ code: 'group_not_allowed', status: 403 });
  });

  it('searches text across allowed groups only', async () => {
    expect((await searchMessagesFor(hub, grok, '退款', {})).map((m) => m.id)).toEqual(['a1']);
    expect((await searchMessagesFor(hub, instinct, '退款', {})).map((m) => m.id).sort()).toEqual(['a1', 'b0']);
  });

  it('checks group access for digests and media', async () => {
    await hub.store.set('digests', 'dg1', { ownerId: 'owner_1', groupId: GROUP_B, summary: 's' });
    await expect(getDigestFor(hub, grok, 'dg1')).rejects.toBeInstanceOf(HubAccessError);
    expect(await getDigestFor(hub, instinct, 'dg1')).toMatchObject({ id: 'dg1', summary: 's' });
    await hub.store.set('mediaAssets', 'm1', { ownerId: 'owner_1', groupId: GROUP, status: 'ready', storagePath: 'line-media/x/m1', contentType: 'image/jpeg', size: 3 });
    await hub.blobs.put('line-media/x/m1', Buffer.from('abc'), 'image/jpeg');
    expect(await getMediaFor(hub, grok, 'm1')).toMatchObject({ mediaAssetId: 'm1', url: expect.stringContaining('https://blobs.test/'), contentType: 'image/jpeg' });
  });

  it('shows records of allowed groups or without a group', async () => {
    await hub.store.set('agentRecords', 'r1', { ownerId: 'owner_1', agentId: 'grok_1', groupId: GROUP, category: '待辦', title: 'A', content: 'x', tags: [], createdAt: new Date(1) });
    await hub.store.set('agentRecords', 'r2', { ownerId: 'owner_1', agentId: 'instinct_1', groupId: GROUP_B, category: '待辦', title: 'B', content: 'y', tags: [], createdAt: new Date(2) });
    await hub.store.set('agentRecords', 'r3', { ownerId: 'owner_1', agentId: 'instinct_1', groupId: null, category: '筆記', title: 'C', content: '退款政策', tags: [], createdAt: new Date(3) });
    expect((await listRecordsFor(hub, grok, {})).map((r) => r.id)).toEqual(['r3', 'r1']);
    expect((await listRecordsFor(hub, owner, { q: '退款' })).map((r) => r.id)).toEqual(['r3']);
    expect((await listRecordsFor(hub, owner, { category: '待辦' })).map((r) => r.id)).toEqual(['r2', 'r1']);
  });

  it('reports quota with the agent daily remaining', async () => {
    hub.line.consumption = 50;
    expect(await getQuotaFor(hub, grok)).toMatchObject({ line: { limit: 200, used: 50, remaining: 150 }, agentDailyLimit: 20, agentDailyRemaining: 20 });
  });

  it('lists the agent own inbox and exposes dispatch payloads only to their agent', async () => {
    const base = { ownerId: 'owner_1', groupId: GROUP, groupName: 'Alpha', ruleName: 'r', instruction: 'i', messageIds: ['a0'], digestId: null, createdAt: hub.now(), status: 'open' };
    await hub.store.set('agentInbox', 'i1', { ...base, agentId: 'instinct_1', dispatchId: 'd1' });
    await hub.store.set('agentInbox', 'i2', { ...base, agentId: 'other', dispatchId: 'd2' });
    expect((await listInboxFor(hub, instinct, 'open')).map((i) => i.id)).toEqual(['i1']);
    await hub.store.set('agentDispatches', 'd1', { ownerId: 'owner_1', agentId: 'instinct_1', groupId: GROUP, ruleId: 'r', ruleName: 'r', trigger: 'schedule', messageIds: ['a0'], windowStart: null, windowEnd: hub.now(), instruction: 'i', include: { digest: false, raw: true, media: true, contextCount: 1 }, status: 'delivered_to_inbox', digestId: null, createdAt: hub.now() });
    expect((await getDispatchFor(hub, instinct, 'd1')).messages[0]).toMatchObject({ id: 'a0' });
    await expect(getDispatchFor(hub, grok, 'd1')).rejects.toMatchObject({ code: 'not_found' });
  });
});
