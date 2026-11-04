import express from 'express';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { setIdTokenVerifier } from '../../hub/http/auth';
import { mountHubRoutes } from '../../hub/http/routes';
import { setHubContext } from '../../hub/runtime';
import type { TestHub } from './helpers';

export interface HubServer {
  url: string;
  call(method: string, path: string, opts?: { token?: string; body?: unknown; headers?: Record<string, string> }): Promise<{ status: number; body: any }>;
  close(): Promise<void>;
}

/** Tokens map to uids: `token-<uid>` verifies as that uid; anything else is invalid. */
export async function startHubServer(hub: TestHub): Promise<HubServer> {
  setHubContext(hub);
  setIdTokenVerifier(async (token) => {
    if (!token.startsWith('token-')) throw new Error('invalid');
    return { uid: token.slice('token-'.length) };
  });
  const app = express();
  mountHubRoutes(app);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    url,
    async call(method, path, opts = {}) {
      const res = await fetch(`${url}${path}`, {
        method,
        headers: {
          ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
          ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(opts.headers ?? {}),
        },
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      });
      const text = await res.text();
      let body: unknown = text;
      try { body = text ? JSON.parse(text) : null; } catch { /* keep text */ }
      return { status: res.status, body };
    },
    async close() {
      setHubContext(null);
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
