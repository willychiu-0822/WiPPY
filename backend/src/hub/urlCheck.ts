import { isIP } from 'net';
import type { HubContext } from './core/context';

export type UrlKind = 'page' | 'image' | 'preview' | 'video' | 'audio';

export type UrlCheckResult =
  | { ok: true; url: string; contentType: string | null; size: number | null }
  | { ok: false; code: UrlCheckCode; detail: string };

export type UrlCheckCode =
  | 'url_invalid'
  | 'url_not_https'
  | 'url_too_long'
  | 'url_private_address'
  | 'url_unreachable'
  | 'url_requires_login'
  | 'url_timeout'
  | 'url_wrong_type'
  | 'url_too_large';

const MB = 1024 * 1024;

// LINE Messaging API limits for each kind of URL.
const RULES: Record<UrlKind, { maxLength: number; types: string[] | null; maxBytes: number | null; label: string }> = {
  page: { maxLength: 1000, types: null, maxBytes: null, label: '網頁' },
  image: { maxLength: 2000, types: ['image/jpeg', 'image/png'], maxBytes: 10 * MB, label: '圖片' },
  preview: { maxLength: 2000, types: ['image/jpeg', 'image/png'], maxBytes: 1 * MB, label: '預覽圖' },
  video: { maxLength: 2000, types: ['video/mp4'], maxBytes: 200 * MB, label: '影片' },
  audio: { maxLength: 2000, types: ['audio/x-m4a', 'audio/m4a', 'audio/mp4', 'audio/aac'], maxBytes: 200 * MB, label: '語音' },
};

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8000;

function ipv4Private(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 192 && b === 0)
    || (a === 198 && (b === 18 || b === 19));
}

export function isPrivateAddress(address: string): boolean {
  const ip = address.replace(/^\[|\]$/g, '').toLowerCase();
  const family = isIP(ip);
  if (family === 4) return ipv4Private(ip);
  if (family === 6) {
    if (ip === '::' || ip === '::1') return true;
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return ipv4Private(mapped[1]);
    return /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip);
  }
  return true; // not an IP at all: treat as unsafe
}

function blockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal');
}

async function assertPublicHost(ctx: HubContext, url: URL): Promise<UrlCheckResult | null> {
  if (url.protocol !== 'https:') return { ok: false, code: 'url_not_https', detail: '網址必須是 https://' };
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (blockedHostname(host)) return { ok: false, code: 'url_private_address', detail: `不允許內部網址：${host}` };
  let addresses: string[];
  if (isIP(host)) {
    addresses = [host];
  } else {
    try {
      addresses = await ctx.resolveHost(host);
    } catch {
      return { ok: false, code: 'url_unreachable', detail: `找不到主機：${host}` };
    }
  }
  if (!addresses.length || addresses.some(isPrivateAddress)) {
    return { ok: false, code: 'url_private_address', detail: `不允許內部網址：${host}` };
  }
  return null;
}

async function request(ctx: HubContext, url: string, method: 'HEAD' | 'GET'): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await ctx.fetch(url, {
      method,
      redirect: 'manual',
      signal: controller.signal,
      headers: method === 'GET' ? { Range: 'bytes=0-0', 'User-Agent': 'WiPPY-LinkCheck/1.0' } : { 'User-Agent': 'WiPPY-LinkCheck/1.0' },
    });
    if (method === 'GET') res.body?.cancel().catch(() => undefined);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function sizeOf(res: Response): number | null {
  const range = res.headers.get('content-range')?.match(/\/(\d+)\s*$/);
  if (range) return Number(range[1]);
  const length = res.headers.get('content-length');
  if (res.status === 206 || length === null) return null;
  const n = Number(length);
  return Number.isFinite(n) ? n : null;
}

/**
 * Hard-flow check that a URL is publicly reachable without login and fits LINE's
 * rules for its kind. Never downloads the content and never rewrites the URL.
 */
export async function checkPublicUrl(ctx: HubContext, rawUrl: string, kind: UrlKind): Promise<UrlCheckResult> {
  const rule = RULES[kind];
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, code: 'url_invalid', detail: '網址格式不正確' };
  }
  if (rawUrl.length > rule.maxLength) {
    return { ok: false, code: 'url_too_long', detail: `${rule.label}網址不能超過 ${rule.maxLength} 字元` };
  }

  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const unsafe = await assertPublicHost(ctx, current);
    if (unsafe) return unsafe;

    let res: Response;
    try {
      res = await request(ctx, current.toString(), 'HEAD');
      if ([403, 405, 501].includes(res.status)) res = await request(ctx, current.toString(), 'GET');
    } catch (err) {
      const aborted = (err as { name?: string }).name === 'AbortError';
      return aborted
        ? { ok: false, code: 'url_timeout', detail: `${TIMEOUT_MS / 1000} 秒內沒有回應` }
        : { ok: false, code: 'url_unreachable', detail: `無法連線：${err instanceof Error ? err.message : String(err)}` };
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return { ok: false, code: 'url_unreachable', detail: `轉址缺少目的地（HTTP ${res.status}）` };
      current = new URL(location, current);
      continue;
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, code: 'url_requires_login', detail: `未登入無法開啟（HTTP ${res.status}）` };
    }
    if (res.status < 200 || res.status >= 300) {
      return { ok: false, code: 'url_unreachable', detail: `網址回應 HTTP ${res.status}` };
    }

    const contentType = res.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? null;
    const size = sizeOf(res);
    if (rule.types && (!contentType || !rule.types.includes(contentType))) {
      return { ok: false, code: 'url_wrong_type', detail: `${rule.label}必須是直接指向檔案的網址（${rule.types.join(' / ')}），目前是 ${contentType ?? '未知類型'}` };
    }
    if (rule.maxBytes !== null && size !== null && size > rule.maxBytes) {
      return { ok: false, code: 'url_too_large', detail: `${rule.label}不能超過 ${rule.maxBytes / MB}MB（目前 ${(size / MB).toFixed(1)}MB）` };
    }
    return { ok: true, url: rawUrl, contentType, size };
  }
  return { ok: false, code: 'url_unreachable', detail: `轉址超過 ${MAX_REDIRECTS} 次` };
}
