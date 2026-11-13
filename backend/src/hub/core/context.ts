import type { AuthAdmin, BlobStore, DocStore, FetchFn, LineGateway, LlmChat, ResolveHostFn } from './ports';
import type { JobQueue } from './jobs';

/** Everything Agent Hub services need. Built once in production, faked in tests. */
export interface HubContext {
  ownerId: string;
  store: DocStore;
  /** null until the media bucket is configured. */
  blobs: BlobStore | null;
  /** null when LINE credentials are missing. */
  line: LineGateway | null;
  queue: JobQueue;
  now(): Date;
  fetch: FetchFn;
  resolveHost: ResolveHostFn;
  /** null when no LLM is configured. */
  llm: LlmChat | null;
  authAdmin: AuthAdmin | null;
  env: {
    /** Public base URL used in callback links sent to agents. */
    publicBaseUrl: string;
    /** Key for encrypting agent secrets at rest; null when not configured. */
    encryptionKey: string | null;
  };
}
