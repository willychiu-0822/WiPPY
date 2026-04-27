import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, serverTimestamp, query, where,
  orderBy, writeBatch, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Foundation, Wish, Slot, Record as WRecord } from '../types';

// ── User ─────────────────────────────────────────────────────────────────────

export async function createUserDoc(uid: string, data: { displayName: string | null; email: string | null }) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      ...data,
      timezone: 'Asia/Taipei',
      onboardingCompleted: false,
      createdAt: serverTimestamp(),
    });
  }
}

export async function updateUserDoc(uid: string, data: Partial<{ lineUserId: string; onboardingCompleted: boolean }>) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function getUserDoc(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ── Foundations ───────────────────────────────────────────────────────────────

export async function getFoundations(uid: string): Promise<Foundation[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'foundations'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Foundation));
}

export async function addFoundation(uid: string, data: Omit<Foundation, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'foundations'), data);
  return ref.id;
}

export async function deleteFoundation(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'foundations', id));
}

// ── Wishes ────────────────────────────────────────────────────────────────────

export async function getWishes(uid: string): Promise<Wish[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'wishes'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Wish));
}

export async function addWish(uid: string, data: Omit<Wish, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'wishes'), data);
  return ref.id;
}

export async function deleteWish(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'wishes', id));
}

// ── Slots ─────────────────────────────────────────────────────────────────────

export async function getSlotsForDate(uid: string, date: string): Promise<Slot[]> {
  const q = query(
    collection(db, 'users', uid, 'slots'),
    where('date', '==', date),
    orderBy('startTime'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      notifiedAt: data.notifiedAt ? (data.notifiedAt as Timestamp).toDate() : null,
      recordedAt: data.recordedAt ? (data.recordedAt as Timestamp).toDate() : null,
    } as Slot;
  });
}

export async function saveSlotsForDate(uid: string, slots: Omit<Slot, 'id'>[]): Promise<void> {
  const batch = writeBatch(db);
  for (const slot of slots) {
    const ref = doc(collection(db, 'users', uid, 'slots'));
    batch.set(ref, slot);
  }
  await batch.commit();
}

// ── Records ───────────────────────────────────────────────────────────────────

export async function getRecords(uid: string): Promise<WRecord[]> {
  const q = query(
    collection(db, 'users', uid, 'records'),
    orderBy('recordedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      recordedAt: (data.recordedAt as Timestamp).toDate(),
    } as WRecord;
  });
}

// ── LINE Link Token ───────────────────────────────────────────────────────────

export async function createLinkToken(uid: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry
  await setDoc(doc(db, 'lineLinks', token), {
    userId: uid,
    expiresAt: Timestamp.fromDate(expiresAt),
  });
  return token;
}
