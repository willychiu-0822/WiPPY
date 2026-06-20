import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;

export function ensureFirebaseApp(): void {
  if (!admin.apps.length) {
    admin.initializeApp({
      ...(process.env.FIREBASE_PROJECT_ID ? { projectId: process.env.FIREBASE_PROJECT_ID } : {}),
    });
  }
}

export function getDb(): Firestore {
  if (!db) {
    ensureFirebaseApp();
    db = admin.firestore();
  }
  return db;
}
