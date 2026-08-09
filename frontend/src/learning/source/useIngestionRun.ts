import { useCallback, useEffect, useRef, useState } from 'react';
import { useLearningApi } from '../api/learningApiContextValue';
import type { LearningRunView } from '../api/types';
import { isActiveRunStatus } from './runStatus';

export function useIngestionRun(runId: string | null, onCompleted?: () => void) {
  const api = useLearningApi();
  const [run, setRun] = useState<LearningRunView | null>(null);
  const [transportError, setTransportError] = useState<string | null>(null);
  const [transportErrorCount, setTransportErrorCount] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const clearPoll = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!runId) return;
    try {
      const nextRun = await api.getRun(runId);
      setRun(nextRun);
      setTransportError(null);
      setTransportErrorCount(0);
      if (nextRun.status === 'completed' && !completedRef.current) {
        completedRef.current = true;
        onCompleted?.();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '無法讀取處理狀態';
      setTransportError(message);
      setTransportErrorCount((count) => count + 1);
    }
  }, [api, onCompleted, runId]);

  useEffect(() => {
    completedRef.current = false;
    const firstFetch = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => {
      window.clearTimeout(firstFetch);
      clearPoll();
    };
  }, [clearPoll, refresh]);

  useEffect(() => {
    clearPoll();
    if (!runId || !run || !isActiveRunStatus(run.status) || transportErrorCount >= 5) return;
    timeoutRef.current = window.setTimeout(() => {
      void refresh();
    }, 2000);
    return clearPoll;
  }, [clearPoll, refresh, run, runId, transportErrorCount]);

  const retry = useCallback(async () => {
    if (!runId) return;
    const nextRun = await api.retryRun(runId);
    setRun(nextRun);
    setTransportError(null);
    setTransportErrorCount(0);
  }, [api, runId]);

  return { run, transportError: transportErrorCount >= 5 ? transportError : null, refresh, retry };
}
