import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../contexts/useAuth';
import { HubApiError, hubApi, type HubMe } from './hubApi';
import { HubRoleContext, type HubRoleState } from './hub-role-context';

type Loaded = { uid: string; me: HubMe | null; error: string | null; errorStatus: number | null; attempt: number };

export function HubRoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    hubApi.me()
      .then((me) => { if (!cancelled) setLoaded({ uid, me, error: null, errorStatus: null, attempt }); })
      .catch((err: unknown) => {
        if (!cancelled) setLoaded({ uid, me: null, error: err instanceof HubApiError ? err.code ?? 'request_failed' : String(err), errorStatus: err instanceof HubApiError ? err.status : null, attempt });
      });
    return () => { cancelled = true; };
  }, [uid, attempt]);

  const state: HubRoleState = !uid
    ? { me: null, loading: false, error: null }
    : loaded?.uid === uid && loaded.attempt === attempt
      ? { me: loaded.me, loading: false, error: loaded.error, errorStatus: loaded.errorStatus }
      : { me: null, loading: true, error: null };

  return <HubRoleContext.Provider value={{ ...state, retry: () => setAttempt((n) => n + 1) }}>{children}</HubRoleContext.Provider>;
}
