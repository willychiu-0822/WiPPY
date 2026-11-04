import express, { type Express, type Request, type Response } from 'express';
import { COLLECTIONS, type AgentDoc } from '../core/types';
import { getHub } from '../runtime';
import { adminRouter } from './adminRouter';
import { hubAuth } from './auth';
import { internalHubRouter } from './internalRouter';
import { mountSchedulerRoutes } from './schedulerRoutes';
import { asyncRoute } from './util';

const extraMounts: Array<(app: Express) => void> = [];

/** Later phases (agent API, MCP) add their routers here. */
export function registerHubMount(fn: (app: Express) => void): void {
  extraMounts.push(fn);
}

export function mountHubRoutes(app: Express): void {
  app.get('/api/hub/me', hubAuth({ allow: ['owner', 'agent'] }), asyncRoute(async (req: Request, res: Response) => {
    const actor = req.hubActor!;
    let agentName: string | null = null;
    if (actor.kind === 'agent') {
      agentName = (await getHub().store.get<AgentDoc>(COLLECTIONS.agents, actor.agentId))?.name ?? null;
    }
    res.json({
      role: actor.kind,
      agentId: actor.kind === 'agent' ? actor.agentId : null,
      agentName,
      ownerConfigured: !!process.env['OWNER_USER_ID']?.trim(),
    });
  }));
  app.use('/api/hub/admin', express.json({ limit: '256kb' }), hubAuth({ allow: ['owner'] }), adminRouter);
  app.use('/api/internal/hub', express.json({ limit: '256kb' }), internalHubRouter);
  mountSchedulerRoutes(app);
  for (const mount of extraMounts) mount(app);
}
