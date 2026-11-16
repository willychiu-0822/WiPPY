import { timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

// Missing, blank, or mismatched SCHEDULER_SECRET fails closed. An empty
// fallback would let a blank X-Scheduler-Secret header through.
function schedulerSecretMatches(header: string | string[] | undefined, expected: string | undefined): boolean {
  const secret = expected?.trim() ?? '';
  if (!secret || typeof header !== 'string') return false;

  const providedBuf = Buffer.from(header);
  const expectedBuf = Buffer.from(secret);
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}

export function requireSchedulerSecret(req: Request, res: Response, next: NextFunction): void {
  if (!schedulerSecretMatches(req.headers['x-scheduler-secret'], process.env.SCHEDULER_SECRET)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
