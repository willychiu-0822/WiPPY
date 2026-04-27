import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;

export function getDb(): Firestore {
  if (!db) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
    db = admin.firestore();
  }
  return db;
}
