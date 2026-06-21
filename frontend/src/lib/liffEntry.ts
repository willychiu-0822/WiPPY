export const LINE_GROUP_ID_PATTERN = /^[CR][0-9a-f]{32}$/i;

function paramsFromLiffState(rawState: string | null): URLSearchParams {
  if (!rawState) return new URLSearchParams();

  const state = rawState.trim();
  if (!state) return new URLSearchParams();

  const queryStart = state.indexOf('?');
  if (queryStart >= 0) {
    return new URLSearchParams(state.slice(queryStart + 1));
  }

  return new URLSearchParams(state);
}

export function getLiffEntryParam(search: string, key: string): string | null {
  const directParams = new URLSearchParams(search);
  const directValue = directParams.get(key);
  if (directValue) return directValue;

  const stateParams = paramsFromLiffState(directParams.get('liff.state'));
  return stateParams.get(key);
}

export function getWaterEntryGroupId(search: string): string {
  return getLiffEntryParam(search, 'wg')?.trim() || '';
}

export function hasWaterEntryGroup(search: string): boolean {
  const groupId = getWaterEntryGroupId(search);
  return LINE_GROUP_ID_PATTERN.test(groupId) || groupId.length > 0;
}
