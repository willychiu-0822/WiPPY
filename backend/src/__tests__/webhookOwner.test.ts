import { createHmac } from 'crypto';
import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

const upsertGroupOnJoin = jest.fn();
const updateGroupOnMessage = jest.fn();

jest.mock('../services/groupService', () => ({
  upsertGroupOnJoin: (...args: unknown[]) => upsertGroupOnJoin(...args),
  setGroupInactive: jest.fn(),
  refreshMemberCount: jest.fn(),
  updateGroupOnMessage: (...args: unknown[]) => updateGroupOnMessage(...args),
  appendRecentMessage: jest.fn(),
}));

jest.mock('../line', () => ({
  hasLineWebhookConfig: () => true,
  getLineMiddlewareConfig: () => ({ channelSecret: 'test-webhook-secret' }),
  getLineClient: () => ({}),
}));

jest.mock('../firebase', () => ({
  getDb: () => ({}),
}));

jest.mock('../hub/webhook', () => ({
  processHubWebhookEvents: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../hub/runtime', () => ({
  getHub: () => ({}),
}));

import { webhookRouter } from '../routes/webhook';

const joinEvent = {
  type: 'join',
  timestamp: 1,
  mode: 'active',
  webhookEventId: 'event-1',
  deliveryContext: { isRedelivery: false },
  replyToken: 'reply',
  source: { type: 'group', groupId: 'C00000000000000000000000000000000' },
};

function signedBody(body: string) {
  return createHmac('sha256', 'test-webhook-secret').update(body).digest('base64');
}

async function flushWebhookWork(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

describe('legacy webhook owner id', () => {
  let server: Server;
  let url: string;
  const previousOwner = process.env.OWNER_USER_ID;

  beforeAll(async () => {
    const app = express();
    app.use('/webhook', webhookRouter);
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/webhook/line`;
  });

  beforeEach(() => {
    upsertGroupOnJoin.mockReset();
    updateGroupOnMessage.mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (previousOwner === undefined) delete process.env.OWNER_USER_ID;
    else process.env.OWNER_USER_ID = previousOwner;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('does not store a group under an undefined owner when OWNER_USER_ID is unset', async () => {
    delete process.env.OWNER_USER_ID;
    const body = JSON.stringify({ events: [joinEvent] });
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-line-signature': signedBody(body) },
      body,
    });
    await flushWebhookWork();

    expect(res.status).toBe(200);
    expect(upsertGroupOnJoin).not.toHaveBeenCalled();
    expect(updateGroupOnMessage).not.toHaveBeenCalled();
  });

  it('stores a joined group under the configured owner', async () => {
    process.env.OWNER_USER_ID = 'owner_uid';
    upsertGroupOnJoin.mockResolvedValue(undefined);
    const body = JSON.stringify({ events: [joinEvent] });
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-line-signature': signedBody(body) },
      body,
    });
    await flushWebhookWork();

    expect(res.status).toBe(200);
    expect(upsertGroupOnJoin).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      joinEvent.source.groupId,
      'owner_uid',
      expect.any(String),
    );
  });
});
