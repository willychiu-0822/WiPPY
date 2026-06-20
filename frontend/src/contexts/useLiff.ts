import { useContext } from 'react';
import { LiffContext } from './liff-context';

export function useLiff() {
  return useContext(LiffContext);
}
