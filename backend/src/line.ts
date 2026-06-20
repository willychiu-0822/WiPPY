import { Client, ClientConfig, MiddlewareConfig } from '@line/bot-sdk';

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
