import express, { type NextFunction, type Request, type Response } from 'express';
import { dashboard, createRule, deleteRule, isLogName, listLog, listRules, replaceRule, retryFailed, updateSettings } from '../adminViews';
import { AdminInputError, createAgent, listAgents, resetAgentPassword, rotateApiKey, testAgentRoutine, updateAgent } from '../agentsAdmin';
import { listHubGroups, setGroupAgentAccess } from '../groups';
import { getHub } from '../runtime';
import { getSettings } from '../settings';
import { asyncRoute } from './util';

export const adminRouter = express.Router();

/** asyncRoute + AdminInputError → JSON error with its status. */
function route(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return asyncRoute(async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      if (err instanceof AdminInputError) {
        res.status(err.status).json({ error: err.message, code: err.code });
        return;
      }
      throw err;
    }
  });
}

const id = (req: Request) => String(req.params['id']);

adminRouter.get('/groups', route(async (_req, res) => {
  res.json({ groups: await listHubGroups(getHub()) });
}));

adminRouter.patch('/groups/:groupId/agent-access', route(async (req, res) => {
  const enabled = (req.body as { enabled?: unknown })?.enabled;
  if (typeof enabled !== 'boolean') throw new AdminInputError('enabled must be a boolean');
  const group = await setGroupAgentAccess(getHub(), String(req.params['groupId']), enabled);
  if (!group) throw new AdminInputError('Group not found', 404, 'not_found');
  res.json({ group });
}));

// Agents
adminRouter.get('/agents', route(async (_req, res) => { res.json({ agents: await listAgents(getHub()) }); }));
adminRouter.post('/agents', route(async (req, res) => { res.status(201).json(await createAgent(getHub(), req.body)); }));
adminRouter.patch('/agents/:id', route(async (req, res) => { res.json({ agent: await updateAgent(getHub(), id(req), req.body) }); }));
adminRouter.post('/agents/:id/api-key', route(async (req, res) => { res.json(await rotateApiKey(getHub(), id(req))); }));
adminRouter.post('/agents/:id/reset-password', route(async (req, res) => { res.json(await resetAgentPassword(getHub(), id(req))); }));
adminRouter.post('/agents/:id/test', route(async (req, res) => { res.json(await testAgentRoutine(getHub(), id(req))); }));

// Rules
adminRouter.get('/rules', route(async (_req, res) => { res.json({ rules: await listRules(getHub()) }); }));
adminRouter.post('/rules', route(async (req, res) => { res.status(201).json({ rule: await createRule(getHub(), req.body) }); }));
adminRouter.put('/rules/:id', route(async (req, res) => { res.json({ rule: await replaceRule(getHub(), id(req), req.body) }); }));
adminRouter.delete('/rules/:id', route(async (req, res) => {
  await deleteRule(getHub(), id(req));
  res.status(204).end();
}));

// Settings and dashboard
adminRouter.get('/settings', route(async (_req, res) => { res.json({ settings: await getSettings(getHub()) }); }));
adminRouter.put('/settings', route(async (req, res) => { res.json({ settings: await updateSettings(getHub(), req.body) }); }));
adminRouter.get('/dashboard', route(async (_req, res) => { res.json(await dashboard(getHub())); }));

// Logs and manual retry
adminRouter.get('/:log', route(async (req, res, next) => {
  const name = String(req.params['log']);
  if (!isLogName(name)) {
    next();
    return;
  }
  const status = typeof req.query['status'] === 'string' ? req.query['status'] : undefined;
  const limit = typeof req.query['limit'] === 'string' ? Number(req.query['limit']) : undefined;
  res.json({ items: await listLog(getHub(), name, { status, limit }) });
}));

adminRouter.post('/:kind/:id/retry', route(async (req, res, next) => {
  const kind = String(req.params['kind']);
  if (kind !== 'dispatches' && kind !== 'actions' && kind !== 'media') {
    next();
    return;
  }
  await retryFailed(getHub(), kind, id(req));
  res.status(202).json({ ok: true });
}));
