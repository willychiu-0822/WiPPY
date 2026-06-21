import { createContext } from 'react';
import type { Liff } from '@line/liff';

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LiffContextType {
  ready: boolean;
  loading: boolean;
  error: string | null;
  authRedirecting: boolean;
  profile: LiffProfile | null;
  context: ReturnType<Liff['getContext']>;
  idToken: string | null;
  groupId: string | null;
}

export const LiffContext = createContext<LiffContextType>({
  ready: false,
  loading: true,
  error: null,
  authRedirecting: false,
  profile: null,
  context: null,
  idToken: null,
  groupId: null,
});
