import { Client, ClientConfig, MiddlewareConfig, messagingApi } from '@line/bot-sdk';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required LINE env: ${name}`);
  }
  return value;
}

export function hasLineAccessToken(): boolean {
  return !!process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
}

export function hasLineWebhookConfig(): boolean {
  return !!process.env.LINE_CHANNEL_SECRET?.trim() && hasLineAccessToken();
}

export function getLineClient(): Client {
  return new Client({
    channelAccessToken: requireEnv('LINE_CHANNEL_ACCESS_TOKEN'),
  });
}

export function getLineWebhookConfig(): ClientConfig {
  return {
    channelSecret: requireEnv('LINE_CHANNEL_SECRET'),
    channelAccessToken: requireEnv('LINE_CHANNEL_ACCESS_TOKEN'),
  };
}

export function getLineMiddlewareConfig(): MiddlewareConfig {
  return {
    channelSecret: requireEnv('LINE_CHANNEL_SECRET'),
    channelAccessToken: requireEnv('LINE_CHANNEL_ACCESS_TOKEN'),
  };
}

/**
 * Pushes one text message with LINE's retry key, so sending the same
 * (message, group) pair twice delivers it once. Returns the LINE message id,
 * or null when LINE says this retry key was already accepted (HTTP 409).
 */
export async function pushLineText(to: string, text: string, retryKey: string): Promise<string | null> {
  const client = new messagingApi.MessagingApiClient({
    channelAccessToken: requireEnv('LINE_CHANNEL_ACCESS_TOKEN'),
  });
  try {
    const resp = await client.pushMessage({ to, messages: [{ type: 'text', text }] }, retryKey);
    return resp?.sentMessages?.[0]?.id ?? null;
  } catch (err) {
    if ((err as { status?: number }).status === 409) return null;
    throw err;
  }
}
