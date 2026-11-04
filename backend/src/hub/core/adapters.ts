import { promises as dns } from 'dns';
import type { Readable } from 'stream';
import * as admin from 'firebase-admin';
import { FieldValue, Firestore, Timestamp, type Query } from 'firebase-admin/firestore';
import { messagingApi } from '@line/bot-sdk';
import {
  ContentTooLargeError,
  UpstreamError,
  type AuthAdmin,
  type BlobStore,
  type DocStore,
  type LineGateway,
  type LineMessage,
  type LineTranscodingStatus,
  type QueryOptions,
  type StoredDoc,
} from './ports';

// ─── Firestore ────────────────────────────────────────────────────────────────

/** Dates → Timestamps (deep); `undefined` fields are dropped. */
export function toFirestoreValue(value: unknown): unknown {
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (value === null || value instanceof Timestamp || Buffer.isBuffer(value)) return value;
  if (value instanceof FieldValue) return value;
  if (Array.isArray(value)) return value.map(toFirestoreValue);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = toFirestoreValue(v);
    }
    return out;
  }
  return value;
}

/** Timestamps → Dates (deep). */
export function fromFirestoreValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (value === null || Buffer.isBuffer(value)) return value;
  if (Array.isArray(value)) return value.map(fromFirestoreValue);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = fromFirestoreValue(v);
    return out;
  }
  return value;
}

export class FirestoreDocStore implements DocStore {
  constructor(private readonly db: Firestore) {}

  async get<T>(collection: string, id: string): Promise<T | null> {
    const snap = await this.db.collection(collection).doc(id).get();
    return snap.exists ? (fromFirestoreValue(snap.data()) as T) : null;
  }

  async set(collection: string, id: string, data: object, opts?: { merge?: boolean }): Promise<void> {
    await this.db.collection(collection).doc(id).set(toFirestoreValue(data) as Record<string, unknown>, { merge: !!opts?.merge });
  }

  async create(collection: string, id: string, data: object): Promise<boolean> {
    try {
      await this.db.collection(collection).doc(id).create(toFirestoreValue(data) as Record<string, unknown>);
      return true;
    } catch (err) {
      const code = (err as { code?: number | string }).code;
      if (code === 6 || code === 'already-exists' || /ALREADY_EXISTS/.test(String(err))) return false;
      throw err;
    }
  }

  async update(collection: string, id: string, patch: object): Promise<void> {
    await this.db.collection(collection).doc(id).update(toFirestoreValue(patch) as Record<string, unknown>);
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.db.collection(collection).doc(id).delete();
  }

  async query<T>(collection: string, opts: QueryOptions = {}): Promise<Array<StoredDoc<T>>> {
    let q: Query = this.db.collection(collection);
    for (const w of opts.where ?? []) q = q.where(w.field, w.op, toFirestoreValue(w.value));
    for (const o of opts.orderBy ?? []) q = q.orderBy(o.field, o.direction ?? 'asc');
    if (opts.limit !== undefined) q = q.limit(opts.limit);
    const snap = await q.get();
    return snap.docs.map((d) => ({ id: d.id, data: fromFirestoreValue(d.data()) as T }));
  }

  async mutate<T, R>(collection: string, id: string, fn: (current: T | null) => { next: T | null; result: R }): Promise<R> {
    const ref = this.db.collection(collection).doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const { next, result } = fn(snap.exists ? (fromFirestoreValue(snap.data()) as T) : null);
      if (next !== null) tx.set(ref, toFirestoreValue(next) as Record<string, unknown>);
      return result;
    });
  }

  newId(): string {
    return this.db.collection('_ids').doc().id;
  }
}

// ─── Cloud Storage ────────────────────────────────────────────────────────────

export class GcsBlobStore implements BlobStore {
  constructor(private readonly bucketName: string) {}

  private bucket() {
    return admin.storage().bucket(this.bucketName);
  }

  async put(path: string, data: Buffer, contentType: string): Promise<void> {
    await this.bucket().file(path).save(data, { contentType, resumable: false });
  }

  async signedUrl(path: string, expiresAt: Date): Promise<string> {
    const [url] = await this.bucket().file(path).getSignedUrl({ version: 'v4', action: 'read', expires: expiresAt });
    return url;
  }

  async delete(path: string): Promise<void> {
    await this.bucket().file(path).delete({ ignoreNotFound: true });
  }
}

// ─── LINE ─────────────────────────────────────────────────────────────────────

type MessagingClient = Pick<messagingApi.MessagingApiClient,
  'pushMessage' | 'getMessageQuota' | 'getMessageQuotaConsumption' | 'getGroupMemberCount' | 'getGroupMemberProfile'>;
type BlobClient = Pick<messagingApi.MessagingApiBlobClient,
  'getMessageContentWithHttpInfo' | 'getMessageContentTranscodingByMessageId'>;

function toUpstream(err: unknown, what: string): Error {
  if (err instanceof UpstreamError || err instanceof ContentTooLargeError) return err;
  const status = (err as { status?: unknown }).status;
  const body = (err as { body?: unknown }).body;
  const message = `${what} failed${body ? `: ${String(body).slice(0, 300)}` : `: ${err instanceof Error ? err.message : String(err)}`}`;
  return new UpstreamError(message, typeof status === 'number' ? status : null);
}

async function readLimited(stream: Readable, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    total += buf.length;
    if (total > maxBytes) {
      stream.destroy();
      throw new ContentTooLargeError(maxBytes);
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

export class SdkLineGateway implements LineGateway {
  constructor(private readonly client: MessagingClient, private readonly blob: BlobClient) {}

  static fromToken(channelAccessToken: string): SdkLineGateway {
    return new SdkLineGateway(
      new messagingApi.MessagingApiClient({ channelAccessToken }),
      new messagingApi.MessagingApiBlobClient({ channelAccessToken }),
    );
  }

  async push(to: string, messages: LineMessage[], retryKey: string): Promise<void> {
    try {
      await this.client.pushMessage({ to, messages: messages as messagingApi.Message[] }, retryKey);
    } catch (err) {
      // 409 = LINE already accepted a request with this retry key.
      if ((err as { status?: number }).status === 409) return;
      throw toUpstream(err, 'LINE push');
    }
  }

  async getQuota(): Promise<{ type: 'none' | 'limited'; value?: number }> {
    try {
      const q = await this.client.getMessageQuota();
      return { type: q.type, value: q.value };
    } catch (err) { throw toUpstream(err, 'LINE quota'); }
  }

  async getConsumption(): Promise<number> {
    try {
      return (await this.client.getMessageQuotaConsumption()).totalUsage;
    } catch (err) { throw toUpstream(err, 'LINE quota consumption'); }
  }

  async getGroupMemberCount(groupId: string): Promise<number> {
    try {
      return (await this.client.getGroupMemberCount(groupId)).count;
    } catch (err) { throw toUpstream(err, 'LINE group member count'); }
  }

  async getGroupMemberProfile(groupId: string, userId: string): Promise<{ displayName: string }> {
    try {
      const p = await this.client.getGroupMemberProfile(groupId, userId);
      return { displayName: p.displayName };
    } catch (err) { throw toUpstream(err, 'LINE group member profile'); }
  }

  async getContentTranscoding(messageId: string): Promise<LineTranscodingStatus> {
    try {
      return (await this.blob.getMessageContentTranscodingByMessageId(messageId)).status;
    } catch (err) { throw toUpstream(err, 'LINE transcoding status'); }
  }

  async getContent(messageId: string, maxBytes: number): Promise<{ data: Buffer; contentType: string }> {
    try {
      const res = await this.blob.getMessageContentWithHttpInfo(messageId);
      const length = Number(res.httpResponse.headers.get('content-length') ?? NaN);
      if (Number.isFinite(length) && length > maxBytes) {
        res.body.destroy();
        throw new ContentTooLargeError(maxBytes);
      }
      const data = await readLimited(res.body, maxBytes);
      return { data, contentType: res.httpResponse.headers.get('content-type') ?? 'application/octet-stream' };
    } catch (err) {
      throw toUpstream(err, 'LINE content download');
    }
  }
}

// ─── Firebase Auth / DNS ──────────────────────────────────────────────────────

export class FirebaseAuthAdmin implements AuthAdmin {
  async createUser(input: { email: string; password: string; displayName: string }): Promise<{ uid: string }> {
    const user = await admin.auth().createUser({ ...input, emailVerified: true });
    return { uid: user.uid };
  }

  async updatePassword(uid: string, password: string): Promise<void> {
    await admin.auth().updateUser(uid, { password });
  }

  async setDisabled(uid: string, disabled: boolean): Promise<void> {
    await admin.auth().updateUser(uid, { disabled });
  }
}

export async function resolveHostAddresses(hostname: string): Promise<string[]> {
  const results = await dns.lookup(hostname, { all: true, verbatim: true });
  return results.map((r) => r.address);
}
