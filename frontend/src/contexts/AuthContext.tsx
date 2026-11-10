import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { createUserDoc } from '../lib/firestore';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      // Firebase identity controls login; optional profile persistence must not
      // block it or restore an earlier user after a later sign-out.
      setUser(u);
      setLoading(false);
      if (u) {
        void createUserDoc(u.uid, {
          displayName: u.displayName,
          email: u.email,
        }).catch(() => { console.warn('WiPPY 使用者資料暫時無法同步；登入狀態不受影響'); });
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
