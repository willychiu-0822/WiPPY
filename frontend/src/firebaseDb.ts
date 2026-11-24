import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { app } from './firebase';

export const db = getFirestore(app);

const emulatorState = globalThis as typeof globalThis & {
  __wippyFirestoreEmulatorConnected?: boolean;
};

const firestoreEmulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST as string | undefined;
const firestoreEmulatorPort = import.meta.env.VITE_FIRESTORE_EMULATOR_PORT as string | undefined;
if (firestoreEmulatorHost && firestoreEmulatorPort && !emulatorState.__wippyFirestoreEmulatorConnected) {
  connectFirestoreEmulator(db, firestoreEmulatorHost, Number(firestoreEmulatorPort));
  emulatorState.__wippyFirestoreEmulatorConnected = true;
}
