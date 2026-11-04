import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { ensureFirebaseApp } from '../firebase';

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
    const ownerUserId = process.env.OWNER_USER_ID?.trim();
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
