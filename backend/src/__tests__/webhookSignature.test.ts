import express, { type ErrorRequestHandler } from 'express';
import { createHmac } from 'crypto';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

jest.mock('../line', () => ({
  hasLineWebhookConfig: () => true,
  getLineMiddlewareConfig: () => ({ channelSecret: 'test-webhook-secret' }),
}));

import { webhookRouter } from '../routes/webhook';
import { setHubContext } from '../hub/runtime';
import { makeTestHub } from './hub/helpers';

describe('LINE webhook signature responses', () => {
  let server: Server;
  let url: string;
  let errorLog: jest.SpyInstance;

  beforeAll(async () => {
    setHubContext(makeTestHub());
    const app = express();
    app.use('/webhook', webhookRouter);
    const fallback: ErrorRequestHandler = (_err, _req, res, _next) => {
      console.error('unexpected webhook error');
      res.sendStatus(500);
    };
    app.use(fallback);
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/webhook/line`;
  });
  beforeEach(() => { errorLog = jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => {
    setHubContext(null);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it.each([undefined, 'invalid-signature'])('returns 401 without ERROR logging for signature=%s', async (signature) => {
    const res = await fetch(url, { method: 'POST', headers: {
      'Content-Type': 'application/json', ...(signature ? { 'x-line-signature': signature } : {}),
    }, body: '{"events":[]}' });
    expect(res.status).toBe(401);
    expect(errorLog).not.toHaveBeenCalled();
  });

  it('continues to accept a correctly signed webhook', async () => {
    const body = '{"events":[]}';
    const signature = createHmac('sha256', 'test-webhook-secret').update(body).digest('base64');
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-line-signature': signature }, body });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
