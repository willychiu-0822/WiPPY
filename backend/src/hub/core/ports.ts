// Ports (interfaces) the Agent Hub depends on. Production adapters live next to
// this file; tests use the in-memory implementations so business rules can be
// verified without Firestore, Cloud Storage, LINE or the network.

export type WhereOp = '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains';

export interface WhereClause {
  field: string;
  op: WhereOp;
  value: unknown;
}

export interface QueryOptions {
  where?: WhereClause[];
  orderBy?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
  limit?: number;
}

export interface StoredDoc<T> {
  id: string;
  data: T;
}

/**
 * Minimal document store. Values may contain JS `Date`s; adapters convert them
 * to their native timestamp type and back.
 */
export interface DocStore {
  get<T = Record<string, unknown>>(collection: string, id: string): Promise<T | null>;
  set(collection: string, id: string, data: object, opts?: { merge?: boolean }): Promise<void>;
  /** Creates the doc; returns false (and writes nothing) when it already exists. */
  create(collection: string, id: string, data: object): Promise<boolean>;
  /** Shallow-merges fields into an existing doc; throws when it does not exist. */
  update(collection: string, id: string, patch: object): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  query<T = Record<string, unknown>>(collection: string, opts?: QueryOptions): Promise<Array<StoredDoc<T>>>;
  /** Atomic read-modify-write of one doc. Return `next: null` to leave it unchanged. */
  mutate<T, R>(
    collection: string,
    id: string,
    fn: (current: T | null) => { next: T | null; result: R },
  ): Promise<R>;
  newId(): string;
}

export interface BlobStore {
  put(path: string, data: Buffer, contentType: string): Promise<void>;
  signedUrl(path: string, expiresAt: Date): Promise<string>;
  delete(path: string): Promise<void>;
}

export type LineTranscodingStatus = 'processing' | 'succeeded' | 'failed';

export type LineMessage =
  | { type: 'text'; text: string }
  | { type: 'image'; originalContentUrl: string; previewImageUrl: string }
  | { type: 'video'; originalContentUrl: string; previewImageUrl: string }
  | { type: 'audio'; originalContentUrl: string; duration: number }
  | { type: 'flex'; altText: string; contents: Record<string, unknown> };

export interface LineGateway {
  push(to: string, messages: LineMessage[], retryKey: string): Promise<void>;
  getQuota(): Promise<{ type: 'none' | 'limited'; value?: number }>;
  getConsumption(): Promise<number>;
  getGroupMemberCount(groupId: string): Promise<number>;
  getGroupMemberProfile(groupId: string, userId: string): Promise<{ displayName: string }>;
  getContentTranscoding(messageId: string): Promise<LineTranscodingStatus>;
  /** Downloads LINE content; throws `ContentTooLargeError` past `maxBytes`. */
  getContent(messageId: string, maxBytes: number): Promise<{ data: Buffer; contentType: string }>;
}

export interface AuthAdmin {
  createUser(input: { email: string; password: string; displayName: string }): Promise<{ uid: string }>;
  updatePassword(uid: string, password: string): Promise<void>;
  setDisabled(uid: string, disabled: boolean): Promise<void>;
}

export interface LlmChat {
  chat(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<string>;
}

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
export type ResolveHostFn = (hostname: string) => Promise<string[]>;

export class ContentTooLargeError extends Error {
  constructor(readonly maxBytes: number) {
    super(`content exceeds ${maxBytes} bytes`);
    this.name = 'ContentTooLargeError';
  }
}

/** Error from an outbound HTTP call that carries the HTTP status (if any). */
export class UpstreamError extends Error {
  constructor(message: string, readonly status: number | null) {
    super(message);
    this.name = 'UpstreamError';
  }
}
