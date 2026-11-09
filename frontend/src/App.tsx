import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/useAuth';
import LoginPage from './pages/LoginPage';
import GroupsPage from './pages/GroupsPage';
import SendHistoryPage from './pages/SendHistoryPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import Layout from './components/Layout';

const localUat = import.meta.env.DEV && import.meta.env.VITE_UAT_MODE === 'true';
const LiffCheck = localUat ? lazy(() => import('./uat/LiffCheck')) : () => null;

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  }

  return (
    <>
      {localUat && <div className="bg-amber-100 text-amber-950 px-4 py-2 text-xs text-center">
        本機 UAT · Firebase emulator · LINE / AI 模擬，不會發送真實訊息 · <a className="underline" href="/uat/liff">LIFF 檢查</a>
      </div>}
    <Routes>
      {localUat && <Route path="/uat/liff" element={<Suspense fallback={<p>載入中...</p>}><LiffCheck /></Suspense>} />}
      <Route path="/login" element={user ? <Navigate to="/groups" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* V2 pages */}
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/history" element={<SendHistoryPage />} />
        {/* Activities */}
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/activities/:id" element={<ActivityDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/groups' : '/login'} replace />} />
    </Routes>
    </>
  );
}
