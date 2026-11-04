import express, { type Request, type Response } from 'express';
import { listHubGroups, setGroupAgentAccess } from '../groups';
import { getHub } from '../runtime';
import { asyncRoute } from './util';

export const adminRouter = express.Router();

adminRouter.get('/groups', asyncRoute(async (_req: Request, res: Response) => {
  res.json({ groups: await listHubGroups(getHub()) });
}));

adminRouter.patch('/groups/:groupId/agent-access', asyncRoute(async (req: Request, res: Response) => {
  const enabled = (req.body as { enabled?: unknown })?.enabled;
  if (typeof enabled !== 'boolean') {
    res.status(400).json({ error: 'enabled must be a boolean', code: 'invalid_request' });
    return;
  }
  const group = await setGroupAgentAccess(getHub(), String(req.params['groupId']), enabled);
  if (!group) {
    res.status(404).json({ error: 'Group not found', code: 'not_found' });
    return;
  }
  res.json({ group });
}));
