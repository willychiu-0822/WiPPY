import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLearningApi } from '../api/learningApiContextValue';
import { LearningAccessContext } from './learningAccessContextValue';

export function LearningAccessProvider({ children }: { children: ReactNode }) {
  const api = useLearningApi();
  const [state, setState] = useState<{ enabled: boolean; loading: boolean; error: Error | null }>({
    enabled: false,
    loading: true,
    error: null,
  });
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    api
      .getAccess()
      .then((access) => {
        if (!alive) return;
        setState({ enabled: access.enabled, loading: false, error: null });
      })
      .catch((err) => {
        if (!alive) return;
        setState({ enabled: false, loading: false, error: err instanceof Error ? err : new Error(String(err)) });
      });
    return () => {
      alive = false;
    };
  }, [api, version]);

  const value = useMemo(() => ({ ...state, retry }), [state, retry]);
  return <LearningAccessContext.Provider value={value}>{children}</LearningAccessContext.Provider>;
}
