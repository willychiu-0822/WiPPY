import type { Request, Response } from 'express';
import { liffAuthMiddleware } from '../middleware/liffAuth';

function makeResponse() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json } as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
}

describe('liffAuthMiddleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv, LIFF_CHANNEL_ID: '1234567890', NODE_ENV: 'test' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('verifies a valid LIFF ID token and attaches the user to the request', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: 'U123',
        aud: '1234567890',
        exp: Math.floor(Date.now() / 1000) + 3600,
        name: 'Dev User',
        picture: 'https://example.com/p.png',
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    const req = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request;
    const res = makeResponse();
    const next = jest.fn();

    await liffAuthMiddleware(req, res, next);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.line.me/oauth2/v2.1/verify',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      })
    );
    expect(req.liffUserId).toBe('U123');
    expect(req.liffDisplayName).toBe('Dev User');
    expect(req.liffPictureUrl).toBe('https://example.com/p.png');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when the Authorization header is missing', async () => {
    global.fetch = jest.fn() as typeof fetch;

    const req = { headers: {} } as Request;
    const res = makeResponse();
    const next = jest.fn();

    await liffAuthMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when LINE verify fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as typeof fetch;

    const req = {
      headers: {
        authorization: 'Bearer bad-token',
      },
    } as Request;
    const res = makeResponse();
    const next = jest.fn();

    await liffAuthMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the LIFF channel id does not match', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: 'U123',
        aud: 'other-channel',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    }) as typeof fetch;

    const req = {
      headers: {
        authorization: 'Bearer wrong-aud',
      },
    } as Request;
    const res = makeResponse();
    const next = jest.fn();

    await liffAuthMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the LIFF token is expired', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: 'U123',
        aud: '1234567890',
        exp: Math.floor(Date.now() / 1000) - 10,
      }),
    }) as typeof fetch;

    const req = {
      headers: {
        authorization: 'Bearer expired-token',
      },
    } as Request;
    const res = makeResponse();
    const next = jest.fn();

    await liffAuthMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('uses the dev bypass outside production when LIFF_DEV_BYPASS_USER is configured', async () => {
    process.env.LIFF_DEV_BYPASS_USER = JSON.stringify({
      userId: 'Udev1',
      displayName: 'Dev',
      pictureUrl: '',
    });
    global.fetch = jest.fn() as typeof fetch;

    const req = {
      headers: {
        authorization: 'Bearer anything',
      },
    } as Request;
    const res = makeResponse();
    const next = jest.fn();

    await liffAuthMiddleware(req, res, next);

    expect(req.liffUserId).toBe('Udev1');
    expect(next).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not allow the dev bypass in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.LIFF_DEV_BYPASS_USER = JSON.stringify({
      userId: 'Udev1',
      displayName: 'Dev',
      pictureUrl: '',
    });
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as typeof fetch;

    const req = {
      headers: {
        authorization: 'Bearer anything',
      },
    } as Request;
    const res = makeResponse();
    const next = jest.fn();

    await liffAuthMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
