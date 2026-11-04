import { createHash } from 'crypto';
import type { HubContext } from './core/context';
import { toJobError } from './core/errors';
import { PermanentError } from './core/jobs';
import type { LineMessage } from './core/ports';
import { checkQuota, estimateCost, getQuotaStatus, recordSent } from './quota';

export type SendResult =
  | { ok: true; cost: number }
  | { ok: false; code: 'line_not_configured' | 'line_quota_reserve' | 'line_quota_exhausted' | 'line_error'; detail: string; retryable: boolean };

/** Stable UUID-format retry key so LINE de-duplicates a re-sent request. */
export function retryKeyFor(seed: string): string {
  const h = createHash('sha256').update(seed).digest('hex');
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function linkCard(input: { url: string; title: string; description?: string | null; imageUrl?: string | null }): Extract<LineMessage, { type: 'flex' }> {
  const body: Array<Record<string, unknown>> = [
    { type: 'text', text: truncate(input.title, 100), weight: 'bold', size: 'md', wrap: true },
  ];
  if (input.description) body.push({ type: 'text', text: truncate(input.description, 300), size: 'sm', color: '#555555', wrap: true, margin: 'md' });
  const bubble: Record<string, unknown> = {
    type: 'bubble',
    body: { type: 'box', layout: 'vertical', contents: body },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [{ type: 'button', style: 'primary', action: { type: 'uri', label: '開啟', uri: input.url } }],
    },
  };
  if (input.imageUrl) bubble['hero'] = { type: 'image', url: input.imageUrl, size: 'full', aspectMode: 'cover', aspectRatio: '20:13' };
  return { type: 'flex', altText: truncate(input.title, 400), contents: bubble };
}

/** Pushes to LINE after the quota guard. Never throws for expected failures. */
export async function sendToLine(
  ctx: HubContext,
  input: { to: string; messages: LineMessage[]; retryKey: string; purpose: 'agent' | 'alert' },
): Promise<SendResult> {
  if (!ctx.line) return { ok: false, code: 'line_not_configured', detail: 'LINE channel access token is not configured', retryable: false };
  const cost = await estimateCost(ctx, input.to);
  const check = checkQuota(await getQuotaStatus(ctx), cost, input.purpose);
  if (!check.ok) return { ok: false, code: check.code, detail: check.detail, retryable: false };
  try {
    await ctx.line.push(input.to, input.messages, input.retryKey);
  } catch (err) {
    const jobErr = toJobError(err, 'LINE push');
    return { ok: false, code: 'line_error', detail: jobErr.message, retryable: !(jobErr instanceof PermanentError) };
  }
  await recordSent(ctx, cost);
  return { ok: true, cost };
}
