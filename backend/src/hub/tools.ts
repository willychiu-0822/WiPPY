import { z } from 'zod';
import { ACTION_SCHEMAS, ACTION_TYPES, executeAction, getActionView, type ActionType } from './actions';
import type { HubContext } from './core/context';
import type { Actor } from './core/types';
import {
  HubAccessError,
  getDigestFor,
  getDispatchFor,
  getLatestDigestFor,
  getMediaFor,
  getMessagesFor,
  getQuotaFor,
  listGroupsFor,
  listInboxFor,
  listRecordsFor,
  searchMessagesFor,
} from './queries';

export class ToolInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolInputError';
  }
}

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'must be an ISO 8601 date-time').transform((v) => new Date(v));
const MESSAGE_TYPES = ['text', 'image', 'video', 'audio', 'file', 'sticker', 'location', 'other'] as const;

interface ToolDef {
  description: string;
  schema: z.ZodType;
  run(ctx: HubContext, actor: Actor, args: any): Promise<unknown>;
}

const READ_TOOLS: Record<string, ToolDef> = {
  list_groups: {
    description: '列出這個 Agent 可以讀取、發送的 LINE 群組（已開放且在允許清單內）。',
    schema: z.object({}),
    run: (ctx, actor) => listGroupsFor(ctx, actor).then((groups) => ({ groups })),
  },
  get_messages: {
    description: '取得群組訊息（依時間排序，最多 200 則）。媒體附 7 天有效的下載連結。',
    schema: z.object({
      groupId: z.string().min(1),
      since: isoDate.optional(),
      until: isoDate.optional(),
      types: z.array(z.enum(MESSAGE_TYPES)).optional(),
      limit: z.number().int().min(1).max(200).optional(),
    }),
    run: (ctx, actor, a) => getMessagesFor(ctx, actor, a.groupId, a).then((messages) => ({ messages })),
  },
  search_messages: {
    description: '在可讀取的群組中搜尋文字（不分大小寫的包含比對，不使用模型）。',
    schema: z.object({
      query: z.string().min(1).max(200),
      groupIds: z.array(z.string()).optional(),
      since: isoDate.optional(),
      limit: z.number().int().min(1).max(200).optional(),
    }),
    run: (ctx, actor, a) => searchMessagesFor(ctx, actor, a.query, a).then((messages) => ({ messages })),
  },
  get_digest: {
    description: '讀取已產生的重點整理：給 digestId，或給 groupId 取該群組最新一份。不會觸發模型。',
    schema: z.object({ digestId: z.string().optional(), groupId: z.string().optional() })
      .refine((a) => !!a.digestId || !!a.groupId, 'digestId or groupId is required'),
    run: async (ctx, actor, a) => ({ digest: a.digestId ? await getDigestFor(ctx, actor, a.digestId) : await getLatestDigestFor(ctx, actor, a.groupId) }),
  },
  get_media: {
    description: '取得群組媒體（圖片/影片/語音/檔案）的下載連結與資訊。',
    schema: z.object({ mediaAssetId: z.string().min(1) }),
    run: (ctx, actor, a) => getMediaFor(ctx, actor, a.mediaAssetId),
  },
  list_records: {
    description: '查詢已記錄的重點資訊（可依群組、分類、關鍵字篩選）。',
    schema: z.object({
      groupId: z.string().optional(),
      category: z.string().optional(),
      query: z.string().optional(),
      limit: z.number().int().min(1).max(500).optional(),
    }),
    run: (ctx, actor, a) => listRecordsFor(ctx, actor, { ...a, q: a.query }).then((records) => ({ records })),
  },
  get_quota: {
    description: 'LINE 本月推播額度與這個 Agent 今天剩餘的發送次數。發到群組時按群組人數扣額度。',
    schema: z.object({}),
    run: (ctx, actor) => getQuotaFor(ctx, actor),
  },
  list_inbox: {
    description: '列出這個 Agent 的收件匣項目（規則觸發、等待處理的工作）。',
    schema: z.object({ status: z.enum(['open', 'done', 'all']).optional() }),
    run: (ctx, actor, a) => listInboxFor(ctx, actor, a.status ?? 'open').then((items) => ({ items })),
  },
  get_dispatch: {
    description: '取得一次派送工作的完整內容（規則指令、群組、摘要、訊息）。',
    schema: z.object({ jobId: z.string().min(1) }),
    run: (ctx, actor, a) => getDispatchFor(ctx, actor, a.jobId),
  },
  get_action: {
    description: '查詢先前送出的執行要求的狀態（queued 代表正在自動重試）。',
    schema: z.object({ actionId: z.string().min(1) }),
    run: async (ctx, actor, a) => {
      const action = await getActionView(ctx, actor, a.actionId);
      if (!action) throw new HubAccessError('not_found', '找不到這個執行要求', 404);
      return action;
    },
  },
};

const ACTION_DESCRIPTIONS: Record<ActionType, string> = {
  send_message: '發文字訊息到群組。不需核准，但受每日上限與 LINE 額度限制。',
  send_alert: '發預警到擁有者的預警群組（可動用保留額度）。',
  send_link: '把你做好的網頁或檔案網址以連結卡片發到群組。網址必須 https 且未登入可開啟，否則會退回原因。',
  send_image: '用你提供的直接圖片網址（jpeg/png ≤10MB）發圖片；原圖 >1MB 時要另給 ≤1MB 的 previewUrl。',
  send_video: '用直接影片網址（mp4 ≤200MB）與預覽圖網址發影片。',
  send_audio: '用直接語音網址（m4a）與長度（毫秒）發語音。',
  record: '把重點資訊存成一筆紀錄（分類、標題、內容、標籤、來源訊息）。',
  schedule_message: '排程在未來某個時間發文字到群組（ISO 8601，例如 2026-11-05T09:30:00+08:00），直接生效。',
  complete_dispatch: '回報一次派送工作已處理完（可附摘要）。',
  complete_inbox: '把收件匣項目標記為完成（可附備註）。',
};

export interface ToolListing {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const out = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>;
  delete out['$schema'];
  return out;
}

export function listTools(): ToolListing[] {
  const reads = Object.entries(READ_TOOLS).map(([name, def]) => ({ name, description: def.description, inputSchema: jsonSchema(def.schema) }));
  const actions = ACTION_TYPES.map((type) => {
    const schema = jsonSchema(ACTION_SCHEMAS[type]);
    const properties = { idempotencyKey: { type: 'string', pattern: '^[A-Za-z0-9_.:-]{1,100}$', description: '每個新要求用一個新的唯一字串；重送相同字串只會執行一次。' }, ...(schema['properties'] as object) };
    const required = ['idempotencyKey', ...((schema['required'] as string[]) ?? [])];
    return { name: type, description: ACTION_DESCRIPTIONS[type], inputSchema: { ...schema, properties, required } };
  });
  return [...reads, ...actions];
}

export function isActionTool(name: string): name is ActionType {
  return (ACTION_TYPES as string[]).includes(name);
}

export async function runTool(ctx: HubContext, actor: Actor, name: string, args: unknown): Promise<unknown> {
  const input = (args ?? {}) as Record<string, unknown>;
  if (isActionTool(name)) {
    const { idempotencyKey, ...params } = input;
    return executeAction(ctx, actor, { type: name, idempotencyKey, params });
  }
  const def = READ_TOOLS[name];
  if (!def) throw new ToolInputError(`unknown tool: ${name}`);
  const parsed = def.schema.safeParse(input);
  if (!parsed.success) throw new ToolInputError(parsed.error.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; '));
  return def.run(ctx, actor, parsed.data);
}
