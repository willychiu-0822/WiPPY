import { processHubWebhookEvents, setMessageStoredHook } from '../../hub/webhook';
import { resetSenderNameCache } from '../../hub/ingest';
import { GROUP, makeTestHub, seedGroup, textEvent } from './helpers';

describe('processHubWebhookEvents', () => {
  beforeEach(() => resetSenderNameCache());
  afterEach(() => setMessageStoredHook(null));

  it('ingests every event and runs the stored-message hook for new messages only', async () => {
    const hub = makeTestHub();
    await seedGroup(hub);
    const hook = jest.fn().mockResolvedValue(undefined);
    setMessageStoredHook(hook);
    const summary = await processHubWebhookEvents(hub, [textEvent({ id: 'a' }), textEvent({ id: 'a' }), textEvent({ id: 'b' }), { type: 'follow' }]);
    expect(summary).toEqual({ stored: 2, duplicate: 1, ignored: 1 });
    expect(hook).toHaveBeenCalledTimes(2);
    expect(hook.mock.calls[0][1]).toMatchObject({ id: 'a', groupId: GROUP, text: 'hello' });
  });

  it('propagates storage failures so LINE can redeliver, but tolerates hook failures', async () => {
    const hub = makeTestHub();
    await seedGroup(hub);
    setMessageStoredHook(jest.fn().mockRejectedValue(new Error('rules broke')));
    await expect(processHubWebhookEvents(hub, [textEvent({ id: 'x' })])).resolves.toEqual({ stored: 1, duplicate: 0, ignored: 0 });

    jest.spyOn(hub.store, 'create').mockRejectedValueOnce(new Error('firestore down'));
    await expect(processHubWebhookEvents(hub, [textEvent({ id: 'y' })])).rejects.toThrow('firestore down');
  });
});
