import { describe, expect, it } from 'vitest';
import { getLiffEntryParam, getWaterEntryGroupId, hasWaterEntryGroup } from '../lib/liffEntry';

describe('liffEntry', () => {
  it('reads direct water group params from the current URL', () => {
    const search = '?wg=C36f826d26cf8adefe4d214993742c230&wgName=Team';

    expect(getWaterEntryGroupId(search)).toBe('C36f826d26cf8adefe4d214993742c230');
    expect(getLiffEntryParam(search, 'wgName')).toBe('Team');
    expect(hasWaterEntryGroup(search)).toBe(true);
  });

  it('reads water group params from LIFF state redirects', () => {
    const search = '?liff.state=%2Fliff%2Fwater%3Fwg%3DC36f826d26cf8adefe4d214993742c230%26wgName%3DOcean';

    expect(getWaterEntryGroupId(search)).toBe('C36f826d26cf8adefe4d214993742c230');
    expect(getLiffEntryParam(search, 'wgName')).toBe('Ocean');
    expect(hasWaterEntryGroup(search)).toBe(true);
  });
});
