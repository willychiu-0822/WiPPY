import type { ReactNode } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useHubRole } from '../hub/hub-role-context';

/**
 * Owner accounts must not enter the back office until their profile document is
 * initialised (UAT-24 / UAT-32: understandable error + retry, never a silent
 * stall). Agent (Instinct) accounts are never gated by profile sync (PR42-UAT-13).
 * Must be rendered inside the HubRoleProvider so the role is known.
 */
export function ProfileGate({ children }: { children: ReactNode }) {
  const { error, retry } = useAuth();
  const { me } = useHubRole();
  if (error && me?.role === 'owner') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold text-blue-600">WiPPY</h1>
      <p role="alert" className="text-sm text-red-600">{error}</p>
      <button onClick={() => void retry()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">重試載入帳號</button>
    </div>
  );
  return <>{children}</>;
}
