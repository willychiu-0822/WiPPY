import { describe, expect, it } from 'vitest';
import { getLiffEntryParam } from '../lib/liffEntry';

describe('liffEntry', () => {
  it('reads direct entry params from the current URL', () => {
    const search = '?wg=C36f826d26cf8adefe4d214993742c230&wgName=Team';

    expect(getLiffEntryParam(search, 'wg', '')).toBe('C36f826d26cf8adefe4d214993742c230');
    expect(getLiffEntryParam(search, 'wgName', '')).toBe('Team');
  });

  it('reads entry params from LIFF state redirects', () => {
    const search = '?liff.state=%2Fliff%3Fwg%3DC36f826d26cf8adefe4d214993742c230%26wgName%3DOcean';

    expect(getLiffEntryParam(search, 'wg', '')).toBe('C36f826d26cf8adefe4d214993742c230');
    expect(getLiffEntryParam(search, 'wgName', '')).toBe('Ocean');
  });

  it('reads entry params from hash-based LIFF redirects', () => {
    const hash = '#liff.state=%2Fliff%3Fwg%3DR36f826d26cf8adefe4d214993742c230%26wgName%3DRoom';

    expect(getLiffEntryParam('', 'wg', hash)).toBe('R36f826d26cf8adefe4d214993742c230');
    expect(getLiffEntryParam('', 'wgName', hash)).toBe('Room');
  });

  it('reads entry params from routed hash URLs', () => {
    const hash = '#/liff?wg=C36f826d26cf8adefe4d214993742c230&wgName=HashRoute';

    expect(getLiffEntryParam('', 'wg', hash)).toBe('C36f826d26cf8adefe4d214993742c230');
    expect(getLiffEntryParam('', 'wgName', hash)).toBe('HashRoute');
  });

  it('accepts state as a nested LIFF redirect alias', () => {
    const search = '?state=wg%3DC36f826d26cf8adefe4d214993742c230%26wgName%3DAlias';

    expect(getLiffEntryParam(search, 'wg', '')).toBe('C36f826d26cf8adefe4d214993742c230');
    expect(getLiffEntryParam(search, 'wgName', '')).toBe('Alias');
  });
});
