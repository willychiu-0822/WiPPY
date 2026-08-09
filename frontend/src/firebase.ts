import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

const emulatorState = globalThis as typeof globalThis & {
  __wippyAuthEmulatorConnected?: boolean;
  __wippyFirestoreEmulatorConnected?: boolean;
};

const authEmulatorUrl = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL as string | undefined;
if (authEmulatorUrl && !emulatorState.__wippyAuthEmulatorConnected) {
  connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
  emulatorState.__wippyAuthEmulatorConnected = true;
}

const firestoreEmulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST as string | undefined;
const firestoreEmulatorPort = import.meta.env.VITE_FIRESTORE_EMULATOR_PORT as string | undefined;
if (firestoreEmulatorHost && firestoreEmulatorPort && !emulatorState.__wippyFirestoreEmulatorConnected) {
  connectFirestoreEmulator(db, firestoreEmulatorHost, Number(firestoreEmulatorPort));
  emulatorState.__wippyFirestoreEmulatorConnected = true;
}
