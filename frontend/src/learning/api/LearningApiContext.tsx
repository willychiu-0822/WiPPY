import type { ReactNode } from 'react';
import { LearningApiContext } from './learningApiContextValue';
import type { LearningApi } from './types';

export function LearningApiProvider({ api, children }: { api: LearningApi; children: ReactNode }) {
  return <LearningApiContext.Provider value={api}>{children}</LearningApiContext.Provider>;
}
