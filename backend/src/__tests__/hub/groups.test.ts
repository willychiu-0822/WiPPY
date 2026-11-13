import { listHubGroups, setGroupAgentAccess } from '../../hub/groups';
import { GROUP, GROUP_B, makeTestHub, seedGroup } from './helpers';

describe('group agent access', () => {
  it('defaults to closed and can be opened and closed by the owner', async () => {
    const hub = makeTestHub();
    await hub.store.set('groups', GROUP, { groupId: GROUP, name: 'Team', userId: hub.ownerId, isActive: true, memberCount: 4 });
    expect((await listHubGroups(hub))[0]).toMatchObject({ groupId: GROUP, agentEnabled: false });

    const opened = await setGroupAgentAccess(hub, GROUP, true);
    expect(opened).toMatchObject({ groupId: GROUP, agentEnabled: true });
    expect(hub.store.dump('groups')[GROUP]).toMatchObject({ agentEnabled: true, agentEnabledAt: hub.now() });

    await setGroupAgentAccess(hub, GROUP, false);
    expect(hub.store.dump('groups')[GROUP]).toMatchObject({ agentEnabled: false, agentEnabledAt: null });
  });

  it('refuses groups that belong to someone else or do not exist', async () => {
    const hub = makeTestHub();
    await hub.store.set('groups', GROUP_B, { groupId: GROUP_B, userId: 'other', isActive: true });
    expect(await setGroupAgentAccess(hub, GROUP_B, true)).toBeNull();
    expect(await setGroupAgentAccess(hub, 'missing', true)).toBeNull();
  });

  it('lists only the owner active groups', async () => {
    const hub = makeTestHub();
    await seedGroup(hub, GROUP, { agentEnabled: true, name: 'A' });
    await hub.store.set('groups', GROUP_B, { groupId: GROUP_B, userId: hub.ownerId, isActive: false, name: 'B' });
    await hub.store.set('groups', 'Cother', { groupId: 'Cother', userId: 'other', isActive: true, name: 'O' });
    expect((await listHubGroups(hub)).map((g) => g.groupId)).toEqual([GROUP]);
  });
});
