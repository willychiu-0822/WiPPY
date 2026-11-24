// Firestore stays out of the login bundle. The profile write runs only after sign-in.
export async function createUserDoc(uid: string, data: { displayName: string | null; email: string | null }) {
  const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
  const { db } = await import('../firebaseDb');
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
