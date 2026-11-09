import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useHubRole } from './hub-role-context';

export function NoAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm text-center space-y-3">
        <p className="text-lg font-semibold text-gray-900">此帳號沒有 WiPPY 存取權限</p>
        <p className="text-sm text-gray-500">WiPPY 不開放註冊。請使用擁有者帳號，或擁有者為 Agent 建立的帳號登入。</p>
        <button type="button" onClick={() => signOut(auth)} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">改用其他帳號登入</button>
      </div>
    </div>
  );
}

/** Waits for the role; strangers see NoAccess; agent accounts only reach `agentHome`. */
export function RoleGate({ children, allow, agentHome = '/workbench' }: { children: ReactNode; allow: Array<'owner' | 'agent'>; agentHome?: string }) {
  const { me, loading, error, errorStatus, retry } = useHubRole();
  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-gray-400">Loading...</div>;
  if (errorStatus === 403 && error === 'account_not_allowed') return <NoAccess />;
  if (error || !me) return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-sm text-center space-y-3" role="alert">
        <p className="text-lg font-semibold text-gray-900">暫時連不上 WiPPY</p>
        <button type="button" onClick={retry} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">重試</button>
      </div>
    </div>
  );
  if (!allow.includes(me.role)) return <Navigate to={me.role === 'agent' ? agentHome : '/groups'} replace />;
  return <>{children}</>;
}
