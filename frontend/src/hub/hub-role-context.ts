import { createContext, useContext } from 'react';
import type { HubMe } from './hubApi';

export interface HubRoleState {
  me: HubMe | null;
  loading: boolean;
  /** `account_not_allowed` when the signed-in user has no WiPPY access. */
  error: string | null;
}

export const HubRoleContext = createContext<HubRoleState>({ me: null, loading: true, error: null });

export function useHubRole(): HubRoleState {
  return useContext(HubRoleContext);
}
