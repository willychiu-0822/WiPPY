export const LINE_GROUP_ID_PATTERN = /^[CR][0-9a-f]{32}$/i;

function paramsFromLiffState(rawState: string | null): URLSearchParams[] {
  if (!rawState) return [];

  const state = rawState.trim();
  if (!state) return [];

  const queryStart = state.indexOf('?');
  if (queryStart >= 0) {
    return [new URLSearchParams(state.slice(queryStart + 1))];
  }

  return [new URLSearchParams(state)];
}

function normalizeQuerySource(source: string): string {
  const raw = source.trim();
  if (!raw) return '';
  if (raw.startsWith('?') || raw.startsWith('#')) return raw.slice(1);
  return raw;
}

function collectParams(search: string, hash = ''): URLSearchParams[] {
  const sources = [search, hash]
    .map(normalizeQuerySource)
    .filter(Boolean);
  const roots = sources.map((source) => new URLSearchParams(source));
  const routed = sources.flatMap((source) => paramsFromLiffState(source));

  const nested = [...roots, ...routed].flatMap((params) => [
    ...paramsFromLiffState(params.get('liff.state')),
    ...paramsFromLiffState(params.get('state')),
  ]);

  return [...roots, ...routed, ...nested];
}

export function getLiffEntryParam(search: string, key: string, hash = typeof window === 'undefined' ? '' : window.location.hash): string | null {
  for (const params of collectParams(search, hash)) {
    const value = params.get(key);
    if (value) return value;
  }
  return null;
}

export function getWaterEntryGroupId(search: string, hash?: string): string {
  return getLiffEntryParam(search, 'wg', hash)?.trim() || '';
}

export function hasWaterEntryGroup(search: string, hash?: string): boolean {
  const groupId = getWaterEntryGroupId(search, hash);
  return LINE_GROUP_ID_PATTERN.test(groupId) || groupId.length > 0;
}
