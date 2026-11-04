import { Readable } from 'stream';
import { Timestamp } from 'firebase-admin/firestore';
import { FirestoreDocStore, SdkLineGateway, fromFirestoreValue, toFirestoreValue } from '../../hub/core/adapters';
import { ContentTooLargeError, UpstreamError } from '../../hub/core/ports';

describe('Firestore value conversion', () => {
  it('converts Dates to Timestamps deeply and drops undefined', () => {
    const out = toFirestoreValue({ a: new Date(1000), nested: { b: [new Date(2000)], c: undefined }, n: null }) as Record<string, any>;
    expect(out.a).toBeInstanceOf(Timestamp);
    expect(out.nested.b[0].toMillis()).toBe(2000);
    expect('c' in out.nested).toBe(false);
    expect(out.n).toBeNull();
  });

  it('converts Timestamps back to Dates', () => {
    const out = fromFirestoreValue({ a: Timestamp.fromMillis(5000), list: [{ t: Timestamp.fromMillis(6000) }] }) as Record<string, any>;
    expect(out.a).toEqual(new Date(5000));
    expect(out.list[0].t).toEqual(new Date(6000));
  });
});

function fakeDb() {
  const calls: any[] = [];
  const docs = new Map<string, any>();
  const docRef = (path: string) => ({
    get: async () => ({ exists: docs.has(path), data: () => docs.get(path) }),
    set: async (data: any, opts: any) => { calls.push(['set', path, data, opts]); docs.set(path, data); },
    create: async (data: any) => {
      if (docs.has(path)) { const e: any = new Error('6 ALREADY_EXISTS'); e.code = 6; throw e; }
      docs.set(path, data);
    },
    update: async (data: any) => { calls.push(['update', path, data]); },
    delete: async () => { docs.delete(path); },
  });
  const query: any = {
    where: jest.fn((...a: any[]) => { calls.push(['where', ...a]); return query; }),
    orderBy: jest.fn((...a: any[]) => { calls.push(['orderBy', ...a]); return query; }),
    limit: jest.fn((n: number) => { calls.push(['limit', n]); return query; }),
    get: async () => ({ docs: [{ id: 'r1', data: () => ({ t: Timestamp.fromMillis(1) }) }] }),
  };
  const db: any = {
    collection: (name: string) => ({ ...query, doc: (id?: string) => ({ ...docRef(`${name}/${id}`), id: id ?? 'generated' }) }),
    runTransaction: async (fn: any) => fn({
      get: async (ref: any) => ref.get(),
      set: (ref: any, data: any) => ref.set(data, undefined),
    }),
  };
  return { db, calls, docs };
}

describe('FirestoreDocStore', () => {
  it('maps create conflicts to false and converts values on read/write', async () => {
    const { db, calls } = fakeDb();
    const store = new FirestoreDocStore(db);
    expect(await store.create('c', 'x', { at: new Date(10) })).toBe(true);
    expect(await store.create('c', 'x', { at: new Date(10) })).toBe(false);
    expect(await store.get('c', 'x')).toEqual({ at: new Date(10) });
    await store.set('c', 'y', { v: 1 }, { merge: true });
    expect(calls.find((c) => c[0] === 'set')[3]).toEqual({ merge: true });
  });

  it('builds queries from where/orderBy/limit', async () => {
    const { db, calls } = fakeDb();
    const store = new FirestoreDocStore(db);
    const rows = await store.query('m', { where: [{ field: 'g', op: '==', value: 'a' }, { field: 't', op: '>', value: new Date(5) }], orderBy: [{ field: 't', direction: 'desc' }], limit: 3 });
    expect(rows).toEqual([{ id: 'r1', data: { t: new Date(1) } }]);
    expect(calls.filter((c) => c[0] === 'where').map((c) => c.slice(1, 3))).toEqual([['g', '=='], ['t', '>']]);
    expect(calls.find((c) => c[0] === 'where' && c[1] === 't')[3]).toBeInstanceOf(Timestamp);
    expect(calls).toContainEqual(['orderBy', 't', 'desc']);
    expect(calls).toContainEqual(['limit', 3]);
  });

  it('runs mutate inside a transaction', async () => {
    const { db, docs } = fakeDb();
    const store = new FirestoreDocStore(db);
    const r = await store.mutate<{ n: number }, number>('k', 'c', (cur) => ({ next: { n: (cur?.n ?? 0) + 1 }, result: 1 }));
    expect(r).toBe(1);
    expect(docs.get('k/c')).toEqual({ n: 1 });
  });
});

describe('SdkLineGateway', () => {
  function gateway(overrides: { client?: any; blob?: any } = {}) {
    const client = { pushMessage: jest.fn().mockResolvedValue({}), getMessageQuota: jest.fn(), getMessageQuotaConsumption: jest.fn(), getGroupMemberCount: jest.fn(), getGroupMemberProfile: jest.fn(), ...overrides.client };
    const blob = { getMessageContentWithHttpInfo: jest.fn(), getMessageContentTranscodingByMessageId: jest.fn(), ...overrides.blob };
    return { gw: new SdkLineGateway(client, blob), client, blob };
  }

  it('pushes with the retry key and treats 409 (already accepted) as success', async () => {
    const { gw, client } = gateway();
    await gw.push('C1', [{ type: 'text', text: 'hi' }], 'rk-1');
    expect(client.pushMessage).toHaveBeenCalledWith({ to: 'C1', messages: [{ type: 'text', text: 'hi' }] }, 'rk-1');
    client.pushMessage.mockRejectedValueOnce(Object.assign(new Error('conflict'), { status: 409 }));
    await expect(gw.push('C1', [{ type: 'text', text: 'hi' }], 'rk-1')).resolves.toBeUndefined();
  });

  it('wraps SDK errors with their HTTP status', async () => {
    const { gw, client } = gateway();
    client.pushMessage.mockRejectedValueOnce(Object.assign(new Error('x'), { status: 429, body: 'rate' }));
    const err = await gw.push('C1', [], 'rk').catch((e) => e);
    expect(err).toBeInstanceOf(UpstreamError);
    expect(err.status).toBe(429);
  });

  it('downloads content with its content type and enforces the size limit while streaming', async () => {
    const headers = new Headers({ 'content-type': 'image/png' });
    const { gw, blob } = gateway();
    blob.getMessageContentWithHttpInfo.mockResolvedValueOnce({ httpResponse: { headers }, body: Readable.from([Buffer.from('ab'), Buffer.from('cd')]) });
    expect(await gw.getContent('m1', 10)).toEqual({ data: Buffer.from('abcd'), contentType: 'image/png' });
    blob.getMessageContentWithHttpInfo.mockResolvedValueOnce({ httpResponse: { headers }, body: Readable.from([Buffer.alloc(6), Buffer.alloc(6)]) });
    await expect(gw.getContent('m2', 10)).rejects.toBeInstanceOf(ContentTooLargeError);
    blob.getMessageContentWithHttpInfo.mockResolvedValueOnce({ httpResponse: { headers: new Headers({ 'content-length': '999' }) }, body: Readable.from([]) });
    await expect(gw.getContent('m3', 10)).rejects.toBeInstanceOf(ContentTooLargeError);
  });
});
