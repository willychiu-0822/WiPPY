import fs from 'node:fs';
import path from 'node:path';

describe('learning Firestore indexes', () => {
  it('supports the paginated knowledge query with descending document tie-breaker', () => {
    const config = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../../firestore.indexes.json'), 'utf8'),
    ) as { indexes: Array<{ collectionGroup: string; fields: Array<{ fieldPath: string; order?: string }> }> };

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
});
