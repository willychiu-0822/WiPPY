import * as admin from 'firebase-admin';
import { getDb } from '../firebase';
import { learningCollections, learningSchemaVersion } from '../learning/adapters/firestore/documents';

async function main(): Promise<void> {
  const uid = process.argv[2];
  const enabledArg = process.argv[3] ?? 'true';
  if (!uid) {
    throw new Error('Usage: npm run learning:access -- <firebaseUid> [true|false]');
  }
  const enabled = enabledArg === 'true';
  await getDb().collection(learningCollections.access).doc(uid).set({
    schemaVersion: learningSchemaVersion,
    userId: uid,
    enabled,
    updatedAt: new Date().toISOString(),
  });
  console.log(`learningAccess/${uid} enabled=${enabled}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all(admin.apps.map((app) => app?.delete()));
  });
