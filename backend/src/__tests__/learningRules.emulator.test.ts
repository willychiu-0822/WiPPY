import * as admin from 'firebase-admin';
import {
  assertFails,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import fs from 'fs';
import path from 'path';

const EMULATOR = !!process.env['FIRESTORE_EMULATOR_HOST'];
const d = EMULATOR ? describe : describe.skip;

const learningCollections = [
  'learningAccess',
  'learningSources',
  'learningSourceVersions',
  'learningSegments',
  'learningItems',
  'learningSourceItems',
  'learningOccurrences',
  'learningFacetStates',
  'learningSessions',
  'learningRoundUnits',
  'learningChallenges',
  'learningChallengeReports',
  'learningAttempts',
  'learningIngestionRuns',
  'learningIngestionBatches',
];

d('learning Firestore rules', () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: process.env['FIREBASE_PROJECT_ID'] ?? 'demo-wippy-learning',
      firestore: {
        rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await env.clearFirestore();
  });

  afterAll(async () => {
    await env.cleanup();
    await Promise.all(admin.apps.map((app) => app?.delete()));
  });

  it.each(learningCollections)('denies direct client reads and writes for %s', async (collection) => {
    const ownerDb = env.authenticatedContext('owner').firestore();
    const otherDb = env.authenticatedContext('other').firestore();
    const anonDb = env.unauthenticatedContext().firestore();
    const ownerRef = ownerDb.collection(collection).doc('doc-1');

    await assertFails(ownerRef.get());
    await assertFails(ownerRef.set({ userId: 'owner' }));
    await assertFails(otherDb.collection(collection).doc('doc-1').get());
    await assertFails(otherDb.collection(collection).doc('doc-1').set({ userId: 'other' }));
    await assertFails(anonDb.collection(collection).doc('doc-1').get());
    await assertFails(anonDb.collection(collection).doc('doc-1').set({ userId: 'anon' }));
  });
});
