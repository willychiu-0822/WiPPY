import fs from 'node:fs';
import path from 'node:path';

describe('learning Firestore indexes', () => {
  let config: { indexes: Array<{ collectionGroup: string; queryScope: string; fields: Array<{ fieldPath: string; order?: string }> }> };

  beforeAll(() => {
    config = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../../firestore.indexes.json'), 'utf8'),
    ) as typeof config;
  });

  it('supports the paginated knowledge query with descending document tie-breaker', () => {
    expect(config.indexes).toContainEqual({
      collectionGroup: 'learningItems',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'updatedAt', order: 'DESCENDING' },
        { fieldPath: '__name__', order: 'DESCENDING' },
      ],
    });
  });

  it('supports loading a source with its segments in paragraph order', () => {
    expect(config.indexes).toContainEqual({
      collectionGroup: 'learningSegments',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'sourceId', order: 'ASCENDING' },
        { fieldPath: 'ordinal', order: 'ASCENDING' },
      ],
    });
  });
});
