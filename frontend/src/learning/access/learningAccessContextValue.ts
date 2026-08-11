import { createContext, useContext } from 'react';

export interface LearningAccessState {
  enabled: boolean;
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

export const LearningAccessContext = createContext<LearningAccessState>({
  enabled: false,
  loading: true,
  error: null,
  retry: () => undefined,
});

export function useLearningAccess() {
  return useContext(LearningAccessContext);
}
