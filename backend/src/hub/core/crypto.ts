import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from 'crypto';

export function generateApiKey(): string {
  return `wpy_${randomBytes(32).toString('base64url')}`;
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function apiKeyPrefix(key: string): string {
  return key.slice(0, 10);
}

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

/** AES-256-GCM; output `v1.<iv>.<tag>.<ciphertext>` (base64url). */
export function encryptSecret(plain: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}

export function decryptSecret(encoded: string, secret: string): string {
  const [version, iv, tag, data] = encoded.split('.');
  if (version !== 'v1' || !iv || !tag || !data) throw new Error('unsupported secret format');
  const decipher = createDecipheriv('aes-256-gcm', deriveKey(secret), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}

const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '-_.!';

export function generatePassword(length = 20): string {
  const all = LOWER + UPPER + DIGITS + SYMBOLS;
  const required = [LOWER, UPPER, DIGITS, SYMBOLS].map((set) => set[randomInt(set.length)]);
  const rest = Array.from({ length: length - required.length }, () => all[randomInt(all.length)]);
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
