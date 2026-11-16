import { timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * The only shared-secret check in the backend. Cloud Scheduler and Cloud Tasks
 * callers (activity push and Agent Hub alike) all go through it, so the rule
 * lives in one place: a missing, blank or mismatched secret fails closed, and
 * the comparison is constant-time.
 */
export function secretMatches(header: string | string[] | undefined, expected: string | undefined): boolean {
  const secret = expected?.trim() ?? '';
  if (!secret || typeof header !== 'string') return false;

  const providedBuf = Buffer.from(header.trim());
  const expectedBuf = Buffer.from(secret);
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}

/** `header` is the lower-case request header; `envName` is read per request so tests and rotations apply. */
export function requireSecret(header: string, envName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!secretMatches(req.headers[header], process.env[envName])) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  };
}

/** Cloud Scheduler → /scheduler/* */
export const requireSchedulerSecret = requireSecret('x-scheduler-secret', 'SCHEDULER_SECRET');
/** Cloud Tasks → /api/internal/harness/* (activity planning) */
export const requireHarnessSecret = requireSecret('x-harness-secret', 'INTERNAL_HARNESS_SECRET');
/** Cloud Tasks → /api/internal/hub/* (Agent Hub jobs) */
export const requireHubJobSecret = requireSecret('x-hub-job-secret', 'INTERNAL_HARNESS_SECRET');
