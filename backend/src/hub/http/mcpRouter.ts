import express, { type Request, type Response } from 'express';
import { HubAccessError } from '../queries';
import { getHub } from '../runtime';
import { isActionTool, listTools, runTool, ToolInputError } from '../tools';
import { asyncRoute } from './util';

// Minimal MCP server over Streamable HTTP (stateless, JSON responses only).
const SUPPORTED_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const DEFAULT_VERSION = '2025-06-18';
const INSTRUCTIONS = [
  'WiPPY Agent Hub：讀取 LINE 群組內容，並要求 WiPPY 代為執行動作。',
  '1) 先用 list_groups / get_messages / get_digest / get_dispatch 了解內容。',
  '2) 執行動作（send_message、send_alert、send_link、send_image、send_video、send_audio、record、schedule_message）時每次都要給新的 idempotencyKey。',
  '3) 網頁與媒體由你製作並提供 https 網址；WiPPY 只驗證後發送，不會修改。被退回時請依 code/detail 修正後用新的 idempotencyKey 重送。',
  '4) 派送工作處理完請呼叫 complete_dispatch。',
].join('\n');

interface RpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

function rpcError(id: RpcRequest['id'], code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

async function handle(req: Request, msg: RpcRequest): Promise<Record<string, unknown> | null> {
  const isNotification = msg.id === undefined;
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return rpcError(msg?.id, -32600, 'Invalid Request');
  if (isNotification) return null;

  switch (msg.method) {
    case 'initialize': {
      const requested = String(msg.params?.['protocolVersion'] ?? '');
      return {
        jsonrpc: '2.0',
        id: msg.id,
        result: {
          protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : DEFAULT_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'wippy-agent-hub', version: '1.0.0' },
          instructions: INSTRUCTIONS,
        },
      };
    }
    case 'ping':
      return { jsonrpc: '2.0', id: msg.id, result: {} };
    case 'tools/list':
      return { jsonrpc: '2.0', id: msg.id, result: { tools: listTools() } };
    case 'tools/call': {
      const name = String(msg.params?.['name'] ?? '');
      try {
        const result = await runTool(getHub(), req.hubActor!, name, msg.params?.['arguments'] ?? {});
        const status = (result as { status?: string })?.status;
        const isError = isActionTool(name) && status !== 'done' && status !== 'queued';
        return {
          jsonrpc: '2.0',
          id: msg.id,
          result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: result, isError },
        };
      } catch (err) {
        if (err instanceof HubAccessError || err instanceof ToolInputError) {
          const code = err instanceof HubAccessError ? err.code : 'invalid_request';
          return { jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text: `${code}: ${err.message}` }], isError: true } };
        }
        throw err;
      }
    }
    default:
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

export const mcpRouter = express.Router();

mcpRouter.post('/', asyncRoute(async (req: Request, res: Response) => {
  const body = req.body as RpcRequest | RpcRequest[];
  const batch = Array.isArray(body);
  const messages = batch ? body : [body];
  const responses = (await Promise.all(messages.map((m) => handle(req, m)))).filter((r): r is Record<string, unknown> => r !== null);
  if (!responses.length) {
    res.status(202).end();
    return;
  }
  res.json(batch ? responses : responses[0]);
}));

mcpRouter.get('/', (_req, res) => { res.status(405).set('Allow', 'POST').json({ error: 'SSE stream not supported; use POST' }); });
mcpRouter.delete('/', (_req, res) => { res.status(405).set('Allow', 'POST').json({ error: 'stateless server: no session to delete' }); });
