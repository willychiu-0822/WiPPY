const DEFAULT_CORS_ORIGINS = [
  'https://wippy-mvp.web.app',
  'https://wippy-mvp.firebaseapp.com',
  'http://localhost:5173',
];

/** Comma-separated CORS_ORIGINS, or the current production and local defaults if unset. */
export function parseCorsOrigins(raw = process.env.CORS_ORIGINS): string[] {
  const list = (raw ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return list.length ? list : [...DEFAULT_CORS_ORIGINS];
}
