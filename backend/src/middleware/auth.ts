import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { ensureFirebaseApp } from '../firebase';
import { isProduction } from '../hub/accounts';

// Extend Express Request to carry verified userId
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    ensureFirebaseApp();
    const decoded = await admin.auth().verifyIdToken(token);
    // Only the configured owner may use the back-office API. Agent accounts
    // (e.g. Instinct) and anyone who signs up are limited to /api/hub routes.
    // Production with no owner must fail closed; local dev may omit the variable.
    const ownerUserId = process.env.OWNER_USER_ID?.trim();
    if (!ownerUserId && isProduction()) {
      console.warn(JSON.stringify({ severity: 'WARNING', event: 'owner_not_configured' }));
      res.status(503).json({ error: 'WiPPY 尚未設定擁有者，請聯絡管理員', code: 'owner_not_configured' });
      return;
    }
    if (ownerUserId && decoded.uid !== ownerUserId) {
      res.status(403).json({ error: 'Forbidden', code: 'not_owner' });
      return;
    }
    req.userId = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
