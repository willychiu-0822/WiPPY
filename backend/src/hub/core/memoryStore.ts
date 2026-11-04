import { randomUUID } from 'crypto';
import type { BlobStore, DocStore, QueryOptions, StoredDoc, WhereClause } from './ports';

function clone<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as unknown as T;
  if (Buffer.isBuffer(value)) return Buffer.from(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => clone(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = clone(v);
    }
    return out as T;
  }
  return value;
}

function comparable(value: unknown): unknown {
  return value instanceof Date ? value.getTime() : value;
}

function readField(doc: Record<string, unknown>, field: string): unknown {
  return field.split('.').reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), doc);
}

function matches(doc: Record<string, unknown>, clause: WhereClause): boolean {
  const actual = comparable(readField(doc, clause.field));
  const expected = comparable(clause.value);
  switch (clause.op) {
    case '==': return actual === expected || (actual === undefined && expected === null);
    case '!=': return actual !== expected;
    case '<': return actual !== undefined && actual !== null && (actual as number) < (expected as number);
    case '<=': return actual !== undefined && actual !== null && (actual as number) <= (expected as number);
    case '>': return actual !== undefined && actual !== null && (actual as number) > (expected as number);
    case '>=': return actual !== undefined && actual !== null && (actual as number) >= (expected as number);
    case 'in': return Array.isArray(clause.value) && clause.value.map(comparable).includes(actual);
    case 'array-contains': return Array.isArray(readField(doc, clause.field)) && (readField(doc, clause.field) as unknown[]).map(comparable).includes(expected);
    default: return false;
  }
}

/** In-memory DocStore used by tests and local fallbacks. Mirrors Firestore semantics we rely on. */
export class InMemoryDocStore implements DocStore {
  private readonly collections = new Map<string, Map<string, Record<string, unknown>>>();
  private chain: Promise<unknown> = Promise.resolve();

  private col(name: string): Map<string, Record<string, unknown>> {
    let c = this.collections.get(name);
    if (!c) {
      c = new Map();
      this.collections.set(name, c);
    }
    return c;
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const doc = this.col(collection).get(id);
    return doc ? (clone(doc) as T) : null;
  }

  async set(collection: string, id: string, data: object, opts?: { merge?: boolean }): Promise<void> {
    const existing = this.col(collection).get(id);
    const next = opts?.merge && existing ? { ...existing, ...clone(data) } : clone(data);
    this.col(collection).set(id, next as Record<string, unknown>);
  }

  async create(collection: string, id: string, data: object): Promise<boolean> {
    if (this.col(collection).has(id)) return false;
    this.col(collection).set(id, clone(data) as Record<string, unknown>);
    return true;
  }

  async update(collection: string, id: string, patch: object): Promise<void> {
    const existing = this.col(collection).get(id);
    if (!existing) throw new Error(`NOT_FOUND: ${collection}/${id}`);
    this.col(collection).set(id, { ...existing, ...clone(patch) });
  }

  async delete(collection: string, id: string): Promise<void> {
    this.col(collection).delete(id);
  }

  async query<T>(collection: string, opts: QueryOptions = {}): Promise<Array<StoredDoc<T>>> {
    let rows = [...this.col(collection).entries()].map(([id, data]) => ({ id, data }));
    for (const clause of opts.where ?? []) rows = rows.filter((r) => matches(r.data, clause));
    for (const order of [...(opts.orderBy ?? [])].reverse()) {
      const dir = order.direction === 'desc' ? -1 : 1;
      rows.sort((a, b) => {
        const av = comparable(readField(a.data, order.field)) as number | string;
        const bv = comparable(readField(b.data, order.field)) as number | string;
        if (av === bv) return 0;
        if (av === undefined || av === null) return 1;
        if (bv === undefined || bv === null) return -1;
        return av < bv ? -dir : dir;
      });
    }
    if (opts.limit !== undefined) rows = rows.slice(0, opts.limit);
    return rows.map((r) => ({ id: r.id, data: clone(r.data) as T }));
  }

  async mutate<T, R>(collection: string, id: string, fn: (current: T | null) => { next: T | null; result: R }): Promise<R> {
    const run = this.chain.then(async () => {
      const current = this.col(collection).get(id);
      const { next, result } = fn(current ? (clone(current) as T) : null);
      if (next !== null) this.col(collection).set(id, clone(next) as unknown as Record<string, unknown>);
      return result;
    });
    this.chain = run.catch(() => undefined);
    return run;
  }

  newId(): string {
    return randomUUID().replace(/-/g, '');
  }

  /** Test helper: every doc in a collection. */
  dump(collection: string): Record<string, Record<string, unknown>> {
    return Object.fromEntries([...this.col(collection).entries()].map(([id, d]) => [id, clone(d)]));
  }
}

export class InMemoryBlobStore implements BlobStore {
  readonly blobs = new Map<string, { data: Buffer; contentType: string }>();

  async put(path: string, data: Buffer, contentType: string): Promise<void> {
    this.blobs.set(path, { data, contentType });
  }

  async signedUrl(path: string, expiresAt: Date): Promise<string> {
    if (!this.blobs.has(path)) throw new Error(`blob not found: ${path}`);
    return `https://blobs.test/${path}?expires=${expiresAt.getTime()}`;
  }

  async delete(path: string): Promise<void> {
    this.blobs.delete(path);
  }
}
