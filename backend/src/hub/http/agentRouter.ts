import express, { type Request, type Response } from 'express';
import { HubAccessError } from '../queries';
import { getHub } from '../runtime';
import { listTools, runTool, ToolInputError } from '../tools';
import { asyncRoute } from './util';

export const agentRouter = express.Router();

function list(value: unknown): string[] | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

function num(value: unknown): number | undefined {
  return typeof value === 'string' && value.trim() ? Number(value) : undefined;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function actionStatusCode(result: unknown): number {
  const status = (result as { status?: string })?.status;
  if (status === 'queued') return 202;
  if (status === 'invalid' && ['invalid_request', 'invalid_params'].includes((result as { code?: string }).code ?? '')) return 400;
  return 200;
}

/** Runs a tool and maps errors to HTTP responses. */
function tool(name: string, argsOf: (req: Request) => Record<string, unknown>) {
  return asyncRoute(async (req: Request, res: Response) => {
    try {
      const result = await runTool(getHub(), req.hubActor!, name, argsOf(req));
      res.status(actionStatusCode(result)).json(result);
    } catch (err) {
      if (err instanceof HubAccessError) {
        res.status(err.status).json({ error: err.message, code: err.code });
        return;
      }
      if (err instanceof ToolInputError) {
        res.status(400).json({ error: err.message, code: 'invalid_request' });
        return;
      }
      throw err;
    }
  });
}

agentRouter.get('/tools', (_req, res) => { res.json({ tools: listTools() }); });
agentRouter.get('/groups', tool('list_groups', () => ({})));
agentRouter.get('/groups/:groupId/messages', tool('get_messages', (req) => ({
  groupId: req.params['groupId'], since: str(req.query['since']), until: str(req.query['until']), types: list(req.query['types']), limit: num(req.query['limit']),
})));
agentRouter.get('/groups/:groupId/digests/latest', tool('get_digest', (req) => ({ groupId: req.params['groupId'] })));
agentRouter.get('/messages/search', tool('search_messages', (req) => ({
  query: str(req.query['q']) ?? '', groupIds: list(req.query['groupIds']), since: str(req.query['since']), limit: num(req.query['limit']),
})));
agentRouter.get('/digests/:id', tool('get_digest', (req) => ({ digestId: req.params['id'] })));
agentRouter.get('/media/:id', tool('get_media', (req) => ({ mediaAssetId: req.params['id'] })));
agentRouter.get('/records', tool('list_records', (req) => ({
  groupId: str(req.query['groupId']), category: str(req.query['category']), query: str(req.query['q']), limit: num(req.query['limit']),
})));
agentRouter.get('/quota', tool('get_quota', () => ({})));
agentRouter.get('/inbox', tool('list_inbox', (req) => ({ status: str(req.query['status']) })));
agentRouter.get('/dispatches/:id', tool('get_dispatch', (req) => ({ jobId: req.params['id'] })));
agentRouter.post('/dispatches/:id/complete', tool('complete_dispatch', (req) => ({
  idempotencyKey: (req.body as { idempotencyKey?: unknown })?.idempotencyKey ?? `complete-dispatch-${req.params['id']}`,
  jobId: req.params['id'], summary: (req.body as { summary?: string })?.summary,
})));
agentRouter.post('/inbox/:id/complete', tool('complete_inbox', (req) => ({
  idempotencyKey: (req.body as { idempotencyKey?: unknown })?.idempotencyKey ?? `complete-inbox-${req.params['id']}`,
  itemId: req.params['id'], note: (req.body as { note?: string })?.note,
})));
agentRouter.get('/actions/:id', tool('get_action', (req) => ({ actionId: req.params['id'] })));
agentRouter.post('/actions', asyncRoute(async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as { type?: unknown; idempotencyKey?: unknown; params?: Record<string, unknown> };
  const name = typeof body.type === 'string' ? body.type : '';
  const result = await runTool(getHub(), req.hubActor!, name, { idempotencyKey: body.idempotencyKey, ...(body.params ?? {}) }).catch((err) => {
    if (err instanceof ToolInputError) return { actionId: '', type: name, status: 'invalid', code: 'invalid_request', detail: err.message, result: null };
    throw err;
  });
  res.status(actionStatusCode(result)).json(result);
}));
