import { createHash } from 'crypto';
import { formatInTimeZone } from 'date-fns-tz';
import type { HubContext } from './core/context';
import { RetryableError } from './core/jobs';
import { addDays, HUB_TZ } from './core/time';
import {
  COLLECTIONS,
  MEDIA_MESSAGE_TYPES,
  type DigestDoc,
  type GroupDocLike,
  type GroupMessageDoc,
  type MediaAssetDoc,
  type MediaListItem,
} from './core/types';
import { acquireLlmSlot } from './llmThrottle';
import { getSettings } from './settings';

type StoredMessage = GroupMessageDoc & { id: string };

const MAX_PROMPT_CHARS = 12_000;
const SYSTEM_PROMPT = [
  '你是 LINE 群組訊息的整理助手。只根據提供的訊息內容整理，不要捏造訊息中沒有的資訊。',
  '只輸出一個 JSON 物件，不要有任何其他文字：',
  '{"summary": "100 字內的摘要：這段時間大家在聊什麼", "points": ["重點：誰提了什麼問題、待辦，以及提到的日期、時間、地點、金額"], "tags": ["分類標籤，例如 活動、問題、抱怨、緊急"]}',
].join('\n');

export function parseDigestOutput(raw: string): { summary: string; points: string[]; tags: string[] } | null {
  const stripped = raw.replace(/```(?:json)?/gi, '').trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    if (typeof parsed['summary'] !== 'string') return null;
    const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
    return { summary: parsed['summary'], points: strings(parsed['points']), tags: strings(parsed['tags']) };
  } catch {
    return null;
  }
}

export function describeMessage(m: Pick<GroupMessageDoc, 'type' | 'text' | 'fileName' | 'location'>): string {
  switch (m.type) {
    case 'text': return m.text ?? '';
    case 'image': return '[圖片]';
    case 'video': return '[影片]';
    case 'audio': return '[語音]';
    case 'file': return `[檔案 ${m.fileName ?? ''}]`.replace(' ]', ']');
    case 'sticker': return '[貼圖]';
    case 'location': return `[位置 ${[m.location?.title, m.location?.address].filter(Boolean).join(' ')}]`;
    default: return '[其他訊息]';
  }
}

function digestId(groupId: string, messageIds: string[]): string {
  return `dg_${createHash('sha256').update(`${groupId}|${messageIds.join(',')}`).digest('hex').slice(0, 40)}`;
}

/**
 * The only model use in the hub: a short summary of a batch of messages.
 * Reused per message set; degrades to `skipped` instead of failing the dispatch.
 */
export async function ensureDigest(ctx: HubContext, groupId: string, messages: StoredMessage[]): Promise<DigestDoc & { id: string }> {
  const ids = messages.map((m) => m.id);
  const id = digestId(groupId, ids);
  const existing = await ctx.store.get<DigestDoc>(COLLECTIONS.digests, id);
  if (existing) return { id, ...existing };

  const settings = await getSettings(ctx);
  const now = ctx.now();
  const mediaList: MediaListItem[] = [];
  for (const m of messages) {
    if (!MEDIA_MESSAGE_TYPES.includes(m.type)) continue;
    const asset = m.mediaAssetId ? await ctx.store.get<MediaAssetDoc>(COLLECTIONS.mediaAssets, m.mediaAssetId) : null;
    mediaList.push({ messageId: m.id, sender: m.senderName, type: m.type, fileName: m.fileName, size: m.fileSize ?? asset?.size ?? null, mediaAssetId: m.mediaAssetId, status: asset?.status ?? 'unknown' });
  }
  const times = messages.map((m) => new Date(m.timestamp).getTime());
  const doc: DigestDoc = {
    ownerId: ctx.ownerId,
    groupId,
    messageIds: ids,
    from: times.length ? new Date(Math.min(...times)) : null,
    to: times.length ? new Date(Math.max(...times)) : null,
    summary: null,
    points: [],
    tags: [],
    imageNotes: [],
    mediaList,
    skipped: true,
    skipReason: null,
    createdAt: now,
    ttl: addDays(now, settings.retentionDays),
  };

  const save = async (patch: Partial<DigestDoc>) => {
    const full = { ...doc, ...patch };
    await ctx.store.set(COLLECTIONS.digests, id, full);
    return { id, ...full };
  };

  if (!messages.some((m) => m.type === 'text' && m.text)) return save({ skipReason: 'no_text' });
  if (!ctx.llm) return save({ skipReason: 'llm_not_configured' });

  const slot = await acquireLlmSlot(ctx);
  if (!slot.ok) {
    if (slot.reason === 'daily_limit') return save({ skipReason: 'llm_daily_limit' });
    throw new RetryableError('free model rate limit', Math.max(1, Math.ceil(slot.retryAfterMs / 1000)));
  }

  const group = await ctx.store.get<GroupDocLike>(COLLECTIONS.groups, groupId);
  let lines = messages.map((m) => `[${formatInTimeZone(new Date(m.timestamp), HUB_TZ, 'MM/dd HH:mm')}] ${m.senderName}: ${describeMessage(m)}`).join('\n');
  if (lines.length > MAX_PROMPT_CHARS) lines = lines.slice(lines.length - MAX_PROMPT_CHARS);

  let raw: string;
  try {
    raw = await ctx.llm.chat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `群組：${group?.name ?? groupId}\n訊息：\n${lines}` },
    ]);
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    if (/429|RESOURCE_EXHAUSTED|rate.?limit/i.test(text)) throw new RetryableError('free model returned 429', 60);
    return save({ skipReason: 'llm_error' });
  }

  const parsed = parseDigestOutput(raw);
  if (!parsed) return save({ skipReason: 'invalid_output' });
  return save({ ...parsed, skipped: false, skipReason: null });
}
