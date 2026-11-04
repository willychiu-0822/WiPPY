import { getDb } from '../firebase';
import { createLLMProvider, getLLMConfigStatus } from '../services/llmProvider';
import { FirebaseAuthAdmin, FirestoreDocStore, GcsBlobStore, SdkLineGateway, resolveHostAddresses } from './core/adapters';
import type { HubContext } from './core/context';
import { CloudTasksQueue, InlineQueue } from './core/jobs';
import type { LlmChat } from './core/ports';
import { runHubJob } from './jobHandlers';

let override: HubContext | null = null;
let cached: HubContext | null = null;

/** Tests inject a fully faked context; `null` restores the production one. */
export function setHubContext(ctx: HubContext | null): void {
  override = ctx;
}

export function getHub(): HubContext {
  if (override) return override;
  if (!cached) cached = buildProductionHub(process.env);
  return cached;
}

export function buildProductionHub(env: NodeJS.ProcessEnv): HubContext {
  const ownerId = env['OWNER_USER_ID']?.trim() || 'local-owner';
  const lineToken = env['LINE_CHANNEL_ACCESS_TOKEN']?.trim();
  const bucket = env['HUB_MEDIA_BUCKET']?.trim();
  const tasksQueue = env['HUB_TASKS_QUEUE']?.trim();
  const serviceUrl = env['CLOUD_RUN_SERVICE_URL']?.trim();

  let llm: LlmChat | null = null;
  if (getLLMConfigStatus(env).isConfigured) {
    let provider: LlmChat | null = null;
    llm = { chat: (messages) => (provider ??= createLLMProvider({ observe: false })).chat(messages) };
  }

  const inline = new InlineQueue();
  const queue = tasksQueue && serviceUrl
    ? new CloudTasksQueue({
      project: env['HUB_TASKS_PROJECT'] ?? env['CLOUD_TASKS_PROJECT'] ?? env['FIREBASE_PROJECT_ID'] ?? env['GCP_PROJECT_ID'] ?? '',
      location: env['HUB_TASKS_LOCATION'] ?? env['CLOUD_TASKS_LOCATION'] ?? 'asia-east1',
      queue: tasksQueue,
      serviceUrl,
      secret: env['INTERNAL_HARNESS_SECRET'] ?? '',
    })
    : inline;

  const ctx: HubContext = {
    ownerId,
    store: new FirestoreDocStore(getDb()),
    blobs: bucket ? new GcsBlobStore(bucket) : null,
    line: lineToken ? SdkLineGateway.fromToken(lineToken) : null,
    queue,
    now: () => new Date(),
    fetch: (url, init) => fetch(url, init),
    resolveHost: resolveHostAddresses,
    llm,
    authAdmin: new FirebaseAuthAdmin(),
    env: {
      publicBaseUrl: (env['HUB_PUBLIC_BASE_URL'] ?? env['FIREBASE_HOSTING_URL'] ?? serviceUrl ?? '').replace(/\/$/, ''),
      encryptionKey: env['HUB_ENCRYPTION_KEY']?.trim() || null,
    },
  };
  inline.setRunner((job) => runHubJob(ctx, job));
  return ctx;
}
