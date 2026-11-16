import { Timestamp } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import type { Client } from '@line/bot-sdk';
import {
  appendRecentMessage,
  refreshMemberCount,
  updateGroupOnMessage,
  upsertGroupOnJoin,
} from '../services/groupService';

// Small in-memory stand-in for the bits of Firestore groupService touches.
function fakeDb() {
  const docs = new Map<string, Record<string, unknown>>();
  let autoId = 0;
  const docRef = (path: string) => ({
    get: async () => ({ data: () => docs.get(path) }),
    set: async (data: Record<string, unknown>, opts?: { merge?: boolean }) => {
      docs.set(path, opts?.merge ? { ...(docs.get(path) ?? {}), ...data } : { ...data });
    },
    update: async (data: Record<string, unknown>) => {
      if (!docs.has(path)) throw new Error('NOT_FOUND');
      docs.set(path, { ...docs.get(path), ...data });
    },
    collection: (name: string) => colRef(`${path}/${name}`),
  });
  const colRef = (path: string) => ({
    doc: (id?: string) => docRef(`${path}/${id ?? `auto-${++autoId}`}`),
  });
  return { db: { collection: colRef } as unknown as Firestore, docs };
}

function lineClient(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    getGroupSummary: jest.fn().mockResolvedValue({ groupName: '讀書會' }),
    getGroupMembersCount: jest.fn().mockResolvedValue({ count: 7 }),
    getGroupMemberProfile: jest.fn().mockResolvedValue({ displayName: '小美' }),
    ...overrides,
  } as unknown as Client;
}

const G = 'Cgroup';

describe('groupService retry safety (W-12)', () => {
  it('refreshMemberCount lets a LINE failure surface instead of swallowing it', async () => {
    const { db, docs } = fakeDb();
    const client = lineClient({ getGroupMembersCount: jest.fn().mockRejectedValue(new Error('429')) });

    await expect(refreshMemberCount(db, client, G)).rejects.toThrow('429');
    expect(docs.size).toBe(0);
  });

  it('refreshMemberCount stores the new head count', async () => {
    const { db, docs } = fakeDb();
    await refreshMemberCount(db, lineClient(), G);
    expect(docs.get(`groups/${G}`)?.memberCount).toBe(7);
  });

  it('upsertGroupOnJoin records the group but asks for a retry when the name lookup fails', async () => {
    const { db, docs } = fakeDb();
    const client = lineClient({ getGroupSummary: jest.fn().mockRejectedValue(new Error('timeout')) });

    await expect(upsertGroupOnJoin(db, client, G, 'owner', 'oa')).rejects.toThrow(/timeout/);

    const stored = docs.get(`groups/${G}`);
    expect(stored).toMatchObject({ groupId: G, userId: 'owner', name: G, memberCount: 7, isActive: true });
    expect(stored?.createdAt).toBeDefined();
  });

  it('upsertGroupOnJoin fills in the real name on the retry and keeps createdAt', async () => {
    const { db, docs } = fakeDb();
    const failing = lineClient({ getGroupSummary: jest.fn().mockRejectedValue(new Error('timeout')) });
    await expect(upsertGroupOnJoin(db, failing, G, 'owner', 'oa')).rejects.toThrow();
    const createdAt = docs.get(`groups/${G}`)?.createdAt;

    await upsertGroupOnJoin(db, lineClient(), G, 'owner', 'oa');

    expect(docs.get(`groups/${G}`)).toMatchObject({ name: '讀書會', memberCount: 7 });
    expect(docs.get(`groups/${G}`)?.createdAt).toBe(createdAt);
  });

  it('upsertGroupOnJoin does not wipe a known name or head count when LINE cannot answer', async () => {
    const { db, docs } = fakeDb();
    await upsertGroupOnJoin(db, lineClient(), G, 'owner', 'oa');
    const down = lineClient({
      getGroupSummary: jest.fn().mockRejectedValue(new Error('down')),
      getGroupMembersCount: jest.fn().mockRejectedValue(new Error('down')),
    });

    await expect(upsertGroupOnJoin(db, down, G, 'owner', 'oa')).rejects.toThrow();

    expect(docs.get(`groups/${G}`)).toMatchObject({ name: '讀書會', memberCount: 7 });
  });

  it('appendRecentMessage writes a redelivered event once', async () => {
    const { db, docs } = fakeDb();
    const client = lineClient();

    await appendRecentMessage(db, client, G, 'U1', 'hello', 'text', 1000, 'evt-1');
    await appendRecentMessage(db, client, G, 'U1', 'hello', 'text', 1000, 'evt-1');

    const messages = [...docs.keys()].filter((k) => k.startsWith(`groups/${G}/recentMessages/`));
    expect(messages).toEqual([`groups/${G}/recentMessages/evt-1`]);
    expect(docs.get(messages[0])).toMatchObject({ senderName: '小美', content: 'hello' });
  });

  it('updateGroupOnMessage does not let an older redelivered message replace the latest one', async () => {
    const { db, docs } = fakeDb();
    await updateGroupOnMessage(db, G, 'owner', 'oa', 'newer', 2000);
    await updateGroupOnMessage(db, G, 'owner', 'oa', 'older', 1000);

    const stored = docs.get(`groups/${G}`);
    expect(stored?.lastMessagePreview).toBe('newer');
    expect((stored?.lastMessageAt as Timestamp).toMillis()).toBe(2000);
    expect(stored?.createdAt).toBeDefined();
  });

  it('updateGroupOnMessage moves forward on a newer message', async () => {
    const { db, docs } = fakeDb();
    await updateGroupOnMessage(db, G, 'owner', 'oa', 'first', 1000);
    await updateGroupOnMessage(db, G, 'owner', 'oa', 'second', 2000);
    expect(docs.get(`groups/${G}`)?.lastMessagePreview).toBe('second');
  });
});
