import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { requireSchedulerSecret } from '../../middleware/schedulerAuth';
import { monitorQuota } from '../quota';
import { getHub } from '../runtime';
import { asyncRoute } from './util';

type TickHandler = () => Promise<Record<string, unknown>>;
const tickHandlers: Record<string, TickHandler> = {
  'hub-quota': async () => ({ quota: await monitorQuota(getHub()) }),
};

/** Later phases add scheduler endpoints (hub-tick, hub-cleanup). */
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
      console.error(JSON.stringify({ severity: 'ERROR', event: 'hub_scheduler_error', task: req.params['task'], error: String(err) }));
      res.status(500).json({ ok: false, error: 'scheduler_failed' });
    }
  }));
}
