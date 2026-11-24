import { createHmac } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

const upsertGroupOnJoin = jest.fn();
const updateGroupOnMessage = jest.fn();
const refreshMemberCount = jest.fn();
const appendRecentMessage = jest.fn();

jest.mock('../services/groupService', () => ({
  upsertGroupOnJoin: (...args: unknown[]) => upsertGroupOnJoin(...args),
  setGroupInactive: jest.fn(),
  refreshMemberCount: (...args: unknown[]) => refreshMemberCount(...args),
  updateGroupOnMessage: (...args: unknown[]) => updateGroupOnMessage(...args),
  appendRecentMessage: (...args: unknown[]) => appendRecentMessage(...args),
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
    refreshMemberCount.mockReset();
    appendRecentMessage.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
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

    expect(res.status).toBe(200);
    expect(upsertGroupOnJoin).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      joinEvent.source.groupId,
      'owner_uid',
      expect.any(String),
    );
  });

  // W-12: nothing may be left running after the acknowledgement.
  function post(events: unknown[]) {
    const body = JSON.stringify({ events });
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-line-signature': signedBody(body) },
      body,
    });
  }

  const memberJoinedEvent = {
    type: 'memberJoined',
    timestamp: 2,
    mode: 'active',
    webhookEventId: 'event-2',
    deliveryContext: { isRedelivery: false },
    replyToken: 'reply',
    source: { type: 'group', groupId: joinEvent.source.groupId },
    joined: { members: [{ type: 'user', userId: 'U1' }] },
  };

  const textEvent = {
    type: 'message',
    timestamp: 3,
    mode: 'active',
    webhookEventId: 'event-3',
    deliveryContext: { isRedelivery: false },
    replyToken: 'reply',
    source: { type: 'group', groupId: joinEvent.source.groupId, userId: 'U1' },
    message: { type: 'text', id: 'm1', text: 'hello', quoteToken: 'q' },
  };

  it('holds the acknowledgement until the group update has finished', async () => {
    process.env.OWNER_USER_ID = 'owner_uid';
    let finishUpdate: () => void = () => {};
    let updateFinished = false;
    upsertGroupOnJoin.mockImplementation(
      () => new Promise<void>((resolve) => {
        finishUpdate = () => { updateFinished = true; resolve(); };
      }),
    );

    let responded = false;
    const pending = post([joinEvent]).then((res) => { responded = true; return res; });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(upsertGroupOnJoin).toHaveBeenCalledTimes(1);
    expect(responded).toBe(false);

    finishUpdate();
    const res = await pending;
    expect(res.status).toBe(200);
    expect(updateFinished).toBe(true);
  });

  it('answers 500 so LINE redelivers when a group update fails', async () => {
    process.env.OWNER_USER_ID = 'owner_uid';
    refreshMemberCount.mockRejectedValue(new Error('line api down'));

    const res = await post([memberJoinedEvent]);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false });
  });

  it('still runs the other events of a batch when one of them fails', async () => {
    process.env.OWNER_USER_ID = 'owner_uid';
    refreshMemberCount.mockRejectedValue(new Error('line api down'));
    updateGroupOnMessage.mockResolvedValue(undefined);
    appendRecentMessage.mockResolvedValue(undefined);

    const res = await post([memberJoinedEvent, textEvent]);

    expect(res.status).toBe(500);
    expect(updateGroupOnMessage).toHaveBeenCalledTimes(1);
    // The event id travels along so a redelivery overwrites instead of duplicating.
    expect(appendRecentMessage.mock.calls[0][7]).toBe('event-3');
  });

  it('keeps no work scheduled after the response', () => {
    const source = readFileSync(path.join(__dirname, '../routes/webhook.ts'), 'utf8');
    expect(source).not.toMatch(/setImmediate|setTimeout|process\.nextTick/);
  });
});
