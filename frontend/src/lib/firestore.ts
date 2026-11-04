import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// ── User ─────────────────────────────────────────────────────────────────────

export async function createUserDoc(uid: string, data: { displayName: string | null; email: string | null }) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      ...data,
      timezone: 'Asia/Taipei',
      createdAt: serverTimestamp(),
    });
  }
}
