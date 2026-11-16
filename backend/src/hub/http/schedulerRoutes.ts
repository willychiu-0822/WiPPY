import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { processScheduledActivityMessages } from '../../services/activityScheduler';
import { monitorQuota } from '../quota';
import { getHub } from '../runtime';
import { requireSchedulerSecret } from './secretAuth';
import { asyncRoute } from './util';

type TickHandler = () => Promise<Record<string, unknown>>;
// The only scheduler entry in the backend: activity push (`tick`) and Agent Hub
// tasks are all `POST /scheduler/:task` behind the same secret check.
const tickHandlers: Record<string, TickHandler> = {
  // Cloud Scheduler, every minute: send due, approved activity messages.
  tick: async () => ({ sent: await processScheduledActivityMessages() }),
  'hub-quota': async () => ({ quota: await monitorQuota(getHub()) }),
};

/** Other modules add tasks here (hub-tick, hub-cleanup) instead of mounting their own route. */
export function registerSchedulerTask(name: string, handler: TickHandler): void {
  tickHandlers[name] = handler;
}

export function mountSchedulerRoutes(app: Express): void {
  app.post('/scheduler/:task', express.json(), requireSchedulerSecret, asyncRoute(async (req: Request, res: Response, next: NextFunction) => {
    const handler = tickHandlers[String(req.params['task'])];
    if (!handler) {
      next();
      return;
    }
    try {
      res.json({ ok: true, ...(await handler()) });
    } catch (err) {
      console.error(JSON.stringify({ severity: 'ERROR', event: 'scheduler_error', task: req.params['task'], error: String(err) }));
      res.status(500).json({ ok: false, error: 'scheduler_failed' });
    }
  }));
}
