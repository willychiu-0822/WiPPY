import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { createUserDoc } from '../lib/firestore';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  const initializeUser = useCallback(async (u: User | null) => {
    const attempt = ++generation.current;
    setLoading(true);
    setError(null);
    try {
      if (u) {
        await createUserDoc(u.uid, {
          displayName: u.displayName,
          email: u.email,
        });
      }
      if (attempt === generation.current) setUser(u);
    } catch {
      if (attempt === generation.current) {
        setUser(null);
        setError('無法載入帳號資料，請檢查網路連線後重試');
      }
    } finally {
      if (attempt === generation.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => { void initializeUser(u); });
    return () => { generation.current++; unsubscribe(); };
  }, [initializeUser]);

  const retry = useCallback(() => initializeUser(auth.currentUser), [initializeUser]);

  return (
    <AuthContext.Provider value={{ user, loading, error, retry }}>
      {children}
    </AuthContext.Provider>
  );
}
