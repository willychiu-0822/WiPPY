import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { createUserDoc } from '../lib/firestore';
import { AuthContext } from './auth-context';

const PROFILE_TIMEOUT_MS = 5000;
const PROFILE_ERROR = '無法載入帳號資料，請檢查網路連線後重試';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Profile-sync status. It never blocks authentication itself (PR42-UAT-13:
  // Instinct agent accounts must sign in even when the browser profile cannot be
  // written); owner screens decide whether to block on it (see ProfileGate).
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  const initializeUser = useCallback(async (u: User | null) => {
    const attempt = ++generation.current;
    setError(null);
    setUser(u);
    setLoading(false);
    if (!u) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        createUserDoc(u.uid, { displayName: u.displayName, email: u.email }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Account initialization timed out')), PROFILE_TIMEOUT_MS);
        }),
      ]);
    } catch {
      console.warn('WiPPY 使用者資料暫時無法同步；登入狀態不受影響');
      // A later sign-in/sign-out or retry supersedes this attempt.
      if (attempt === generation.current) setError(PROFILE_ERROR);
    } finally {
      clearTimeout(timer);
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
