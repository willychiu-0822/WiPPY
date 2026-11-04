import type { HubContext } from './core/context';
import type { GroupMessageDoc } from './core/types';
import { ingestLineEvent } from './ingest';

export type StoredMessage = GroupMessageDoc & { id: string };
export type MessageStoredHook = (ctx: HubContext, message: StoredMessage) => Promise<void>;

let storedHook: MessageStoredHook | null = null;

/** The rules engine subscribes here to evaluate real-time triggers. */
export function setMessageStoredHook(hook: MessageStoredHook | null): void {
  storedHook = hook;
}

/**
 * Stores LINE webhook events for agent-enabled groups. Storage errors propagate
 * (the route answers 5xx so LINE redelivers; event ids dedupe the retry).
 */
export async function processHubWebhookEvents(ctx: HubContext, events: unknown[]): Promise<{ stored: number; duplicate: number; ignored: number }> {
  const summary = { stored: 0, duplicate: 0, ignored: 0 };
  for (const event of events) {
    const result = await ingestLineEvent(ctx, (event ?? {}) as Record<string, unknown>);
    summary[result.status] += 1;
    if (result.status === 'stored' && storedHook) {
      try {
        await storedHook(ctx, { id: result.messageId, ...result.message });
      } catch (err) {
        console.error(JSON.stringify({ severity: 'ERROR', event: 'hub_message_hook_error', messageId: result.messageId, error: String(err) }));
      }
    }
  }
  return summary;
}
