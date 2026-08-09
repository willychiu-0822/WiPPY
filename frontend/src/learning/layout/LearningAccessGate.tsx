import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useLearningAccess } from '../access/useLearningAccess';

export function LearningAccessGate({ children }: { children: ReactNode }) {
  const access = useLearningAccess();
  if (access.loading) {
    return <div className="py-12 text-center text-sm text-gray-500">正在確認使用權限…</div>;
  }
  if (access.error) {
    return (
      <div className="space-y-3 py-8">
        <p className="text-sm text-gray-600">暫時無法確認使用權限。</p>
        <button type="button" onClick={access.retry} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white">
          重新確認
        </button>
      </div>
    );
  }
  if (!access.enabled) {
    return <Navigate to="/groups" replace />;
  }
  return <>{children}</>;
}
