import { InMemoryDocStore } from '../../hub/core/memoryStore';

describe('InMemoryDocStore (DocStore contract)', () => {
  let store: InMemoryDocStore;
  beforeEach(() => { store = new InMemoryDocStore(); });

  it('sets, gets and isolates stored copies', async () => {
    const data = { a: 1, nested: { b: 2 }, at: new Date('2026-01-01T00:00:00Z') };
    await store.set('c', 'x', data);
    data.nested.b = 99;
    const got = await store.get<typeof data>('c', 'x');
    expect(got).toEqual({ a: 1, nested: { b: 2 }, at: new Date('2026-01-01T00:00:00Z') });
    expect(got!.at).toBeInstanceOf(Date);
    expect(await store.get('c', 'missing')).toBeNull();
  });

  it('merges on set with merge and on update; update throws for a missing doc', async () => {
    await store.set('c', 'x', { a: 1, b: 2 });
    await store.set('c', 'x', { b: 3 }, { merge: true });
    await store.update('c', 'x', { c: 4 });
    expect(await store.get('c', 'x')).toEqual({ a: 1, b: 3, c: 4 });
    await expect(store.update('c', 'nope', { a: 1 })).rejects.toThrow();
  });

  it('create refuses to overwrite an existing doc', async () => {
    expect(await store.create('c', 'x', { v: 1 })).toBe(true);
    expect(await store.create('c', 'x', { v: 2 })).toBe(false);
    expect(await store.get('c', 'x')).toEqual({ v: 1 });
  });

  it('queries with where, orderBy and limit', async () => {
    await store.set('m', '1', { g: 'a', t: new Date(1000), tags: ['x'] });
    await store.set('m', '2', { g: 'a', t: new Date(3000), tags: ['y'] });
    await store.set('m', '3', { g: 'b', t: new Date(2000), tags: ['x'] });
    const res = await store.query<{ g: string; t: Date }>('m', {
      where: [{ field: 'g', op: '==', value: 'a' }],
      orderBy: [{ field: 't', direction: 'desc' }],
    });
    expect(res.map((r) => r.id)).toEqual(['2', '1']);
    const after = await store.query('m', { where: [{ field: 't', op: '>', value: new Date(1500) }], orderBy: [{ field: 't' }], limit: 1 });
    expect(after.map((r) => r.id)).toEqual(['3']);
    const tagged = await store.query('m', { where: [{ field: 'tags', op: 'array-contains', value: 'x' }] });
    expect(tagged.map((r) => r.id).sort()).toEqual(['1', '3']);
    const inQ = await store.query('m', { where: [{ field: 'g', op: 'in', value: ['b'] }] });
    expect(inQ.map((r) => r.id)).toEqual(['3']);
  });

  it('keeps collections separate, including slash paths', async () => {
    await store.set('activities/a1/activityMessages', 'm1', { v: 1 });
    expect(await store.query('activityMessages')).toEqual([]);
    expect(await store.get('activities/a1/activityMessages', 'm1')).toEqual({ v: 1 });
  });

  it('mutate is an atomic read-modify-write', async () => {
    const inc = () => store.mutate<{ n: number }, number>('k', 'c', (cur) => {
      const n = (cur?.n ?? 0) + 1;
      return { next: { n }, result: n };
    });
    const results = await Promise.all([inc(), inc(), inc()]);
    expect(results.sort()).toEqual([1, 2, 3]);
    expect(await store.get('k', 'c')).toEqual({ n: 3 });
    const unchanged = await store.mutate<{ n: number }, string>('k', 'c', () => ({ next: null, result: 'kept' }));
    expect(unchanged).toBe('kept');
    expect(await store.get('k', 'c')).toEqual({ n: 3 });
  });

  it('deletes docs and generates unique ids', async () => {
    await store.set('c', 'x', { v: 1 });
    await store.delete('c', 'x');
    expect(await store.get('c', 'x')).toBeNull();
    expect(store.newId()).not.toEqual(store.newId());
  });
});
