# WiPPY Learning Production UAT Fix Addendum

**Root cause:** `FirestoreLearningRepository.getSource()` reads `learningSegments` with equality filters on `userId` and `sourceId`, then orders by `ordinal`. Production has no matching composite index. The checked-in index instead covers the separate `listSourceSegments()` query using `userId`, `sourceVersionId`, and `ordinal`. The Firestore emulator does not enforce production composite-index availability, so its owner-scope test passed while the production reader returned HTTP 500.

**Production evidence:** On deployed commit `48ccc38d5414f8b712c2dbe6c849313a2a3be042`, source `6c6f2d63370f309d323206d49e4fd06f1ab55dde` completed ingestion, but every `GET /api/learning/sources/{sourceId}` returned 500. The repository currently issues:

```ts
async getSource(userId: string, sourceIdValue: string): Promise<LearningSourceView | null> {
  const segments = await this.db
    .collection(learningCollections.segments)
    .where('userId', '==', userId)
    .where('sourceId', '==', sourceIdValue)
    .orderBy('ordinal', 'asc')
    .get();
```

## Exact files

- Test: `backend/src/__tests__/learningIndexes.test.ts`
- Production configuration: `firestore.indexes.json`
- Documentation: this addendum, `docs/superpowers/plans/2026-08-12-learning-production-uat.md`, and `docs/uat/2026-08-12-learning-production-uat-report.md`

No repository or route code changes are required.

## RED test

Hoist the parsed config into `beforeAll` in `backend/src/__tests__/learningIndexes.test.ts`, then add:

```ts
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
```

The production mutation caught is omitting or changing a field/order required by `getSource()`. Run `npm test -- --runInBand src/__tests__/learningIndexes.test.ts` from `backend`. Expected RED: the `learningSegments` object containing `sourceId` is absent; the existing object contains `sourceVersionId`.

## Minimal GREEN implementation

Append this separate index to `firestore.indexes.json`, retaining the existing `sourceVersionId` index because `listSourceSegments()` still requires it:

```json
{
  "collectionGroup": "learningSegments",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "sourceId", "order": "ASCENDING" },
    { "fieldPath": "ordinal", "order": "ASCENDING" }
  ]
}
```

Re-run the targeted test and require exit 0.

## Full verification

```powershell
cd backend
npm run build
npm test -- --runInBand
npm run test:learning:emulator

cd ../frontend
npm run lint
npm run build
npm test
npm run test:e2e:learning

cd ..
git diff --check
git status --short
```

The deployment workflow already deploys `firestore:indexes`; after merge, wait for deployment and replay the exact production reader URL before continuing the happy path.
