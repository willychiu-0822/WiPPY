import { describe, expect, it } from 'vitest';
import { getLiffEntryParam, getWaterEntryGroupId, hasWaterEntryGroup } from '../lib/liffEntry';

describe('liffEntry', () => {
  it('reads direct water group params from the current URL', () => {
    const search = '?wg=C36f826d26cf8adefe4d214993742c230&wgName=Team';

    expect(getWaterEntryGroupId(search, '')).toBe('C36f826d26cf8adefe4d214993742c230');
    expect(getLiffEntryParam(search, 'wgName', '')).toBe('Team');
    expect(hasWaterEntryGroup(search, '')).toBe(true);
  });

  it('reads water group params from LIFF state redirects', () => {
    const search = '?liff.state=%2Fliff%2Fwater%3Fwg%3DC36f826d26cf8adefe4d214993742c230%26wgName%3DOcean';

    expect(getWaterEntryGroupId(search, '')).toBe('C36f826d26cf8adefe4d214993742c230');
    expect(getLiffEntryParam(search, 'wgName', '')).toBe('Ocean');
    expect(hasWaterEntryGroup(search, '')).toBe(true);
  });

  it('reads water group params from hash-based LIFF redirects', () => {
    const hash = '#liff.state=%2Fliff%2Fwater%3Fwg%3DR36f826d26cf8adefe4d214993742c230%26wgName%3DRoom';

    expect(getWaterEntryGroupId('', hash)).toBe('R36f826d26cf8adefe4d214993742c230');
    expect(getLiffEntryParam('', 'wgName', hash)).toBe('Room');
    expect(hasWaterEntryGroup('', hash)).toBe(true);
  });

  it('reads water group params from routed hash URLs', () => {
    const hash = '#/liff/water?wg=C36f826d26cf8adefe4d214993742c230&wgName=HashRoute';

    expect(getWaterEntryGroupId('', hash)).toBe('C36f826d26cf8adefe4d214993742c230');
    expect(getLiffEntryParam('', 'wgName', hash)).toBe('HashRoute');
  });

  it('accepts state as a nested LIFF redirect alias', () => {
    const search = '?state=wg%3DC36f826d26cf8adefe4d214993742c230%26wgName%3DAlias';

    expect(getWaterEntryGroupId(search, '')).toBe('C36f826d26cf8adefe4d214993742c230');
    expect(getLiffEntryParam(search, 'wgName', '')).toBe('Alias');
  });
});
