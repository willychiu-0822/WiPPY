import type { NextFunction, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { ensureFirebaseApp } from '../../firebase';
import { AgentDisabledError, resolveApiKeyActor, resolveFirebaseActor } from '../accounts';
import type { Actor, ActorVia } from '../core/types';
import { getHub } from '../runtime';

declare global {
  namespace Express {
    interface Request {
      hubActor?: Actor;
    }
  }
}

export type IdTokenVerifier = (token: string) => Promise<{ uid: string }>;

let verifier: IdTokenVerifier = async (token) => {
  ensureFirebaseApp();
  return admin.auth().verifyIdToken(token);
};

/** Tests replace Firebase ID token verification. */
export function setIdTokenVerifier(fn: IdTokenVerifier): void {
  verifier = fn;
}

export function verifyIdToken(token: string): Promise<{ uid: string }> {
  return verifier(token);
}

/**
 * Authenticates owner (Firebase), agent accounts (Firebase, e.g. Instinct) and
 * agent API keys (`wpy_…`, e.g. Grok Bot), then enforces the allowed roles.
 */
export function hubAuth(opts: { allow: Array<'owner' | 'agent'>; via?: ActorVia }) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization ?? '';
    const apiKeyHeader = req.headers['x-api-key'];
    const token = header.startsWith('Bearer ')
      ? header.slice(7).trim()
      : typeof apiKeyHeader === 'string' ? apiKeyHeader.trim() : '';
    if (!token) {
      res.status(401).json({ error: 'Missing Authorization header', code: 'unauthenticated' });
      return;
    }
    try {
      const ctx = getHub();
      let actor: Actor | null;
      if (token.startsWith('wpy_')) {
        actor = await resolveApiKeyActor(ctx, token, opts.via ?? 'rest');
        if (!actor) {
          res.status(401).json({ error: 'Invalid API key', code: 'invalid_api_key' });
          return;
        }
      } else {
        let uid: string;
        try {
          uid = (await verifier(token)).uid;
        } catch (err) {
          if ((err as { code?: string })?.code === 'auth/user-disabled') {
            res.status(403).json({ error: '此登入帳號已停用，請聯絡擁有者重新啟用', code: 'account_disabled' });
            return;
          }
          res.status(401).json({ error: 'Invalid or expired token', code: 'invalid_token' });
          return;
        }
        actor = await resolveFirebaseActor(ctx, uid, process.env['OWNER_USER_ID']);
        if (!actor) {
          res.status(403).json({ error: '此帳號沒有 WiPPY 存取權限', code: 'account_not_allowed' });
          return;
        }
        if (opts.via && opts.via !== 'ui') actor = { ...actor, via: opts.via } as Actor;
      }
      if (actor.kind === 'system' || !opts.allow.includes(actor.kind)) {
        res.status(403).json({ error: 'Forbidden', code: 'forbidden' });
        return;
      }
      req.hubActor = actor;
      next();
    } catch (err) {
      if (err instanceof AgentDisabledError) {
        res.status(403).json({ error: err.message, code: 'agent_disabled' });
        return;
      }
      console.error(JSON.stringify({ severity: 'ERROR', event: 'hub_auth_error', error: String(err) }));
      res.status(500).json({ error: 'Authentication failed', code: 'auth_error' });
    }
  };
}
