// Loaded only by browser UAT to verify the real emulator security rules.
import { disableNetwork, enableNetwork, doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase';
export function currentUid() { return auth.currentUser!.uid; }
export async function setFirestoreOnline(online: boolean) {
  await (online ? enableNetwork(db) : disableNetwork(db));
}
export async function attemptOwnershipForgery(activityId: string, victimUid: string, groupId: string) {
  const attempt = async (write: () => Promise<void>) => {
    try { await write(); return 'allowed'; }
    catch (error) { return (error as { code: string }).code; }
  };
  const message = await attempt(() => setDoc(doc(db, 'activities', activityId, 'activityMessages', 'forged'), {
    id: 'forged', activityId, userId: victimUid, content: 'forgery-fixture', targetGroups: [groupId],
    triggerType: 'scheduled', triggerValue: '2035-01-01T10:00:00+08:00', sequenceOrder: 1,
    status: 'pending', reviewStatus: 'approved', processingAt: null,
  }));
  const ownership = await attempt(() => updateDoc(doc(db, 'activities', activityId), {
    userId: victimUid, status: 'active', reviewStatus: 'approved',
  }));
  return { message, ownership };
}
