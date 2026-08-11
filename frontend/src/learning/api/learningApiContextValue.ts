import { createContext, useContext } from 'react';
import { learningApi } from './learningApi';
import type { LearningApi } from './types';

export const LearningApiContext = createContext<LearningApi>(learningApi);

export function useLearningApi(): LearningApi {
  return useContext(LearningApiContext);
}
