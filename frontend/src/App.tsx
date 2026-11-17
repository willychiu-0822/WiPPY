import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/useAuth';
import LoginPage from './pages/LoginPage';
import GroupsSection from './pages/GroupsSection';
import AllRecordsPage from './pages/AllRecordsPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import Layout from './components/Layout';
import { ProfileGate } from './components/ProfileGate';
import { HubRoleProvider } from './hub/HubRoleProvider';
import { RoleGate } from './hub/RoleGate';
import { useHubRole } from './hub/hub-role-context';
import HubLayout from './hub/pages/HubLayout';
import HubOverviewPage from './hub/pages/HubOverviewPage';
import AgentsPage from './hub/pages/AgentsPage';
import RulesPage from './hub/pages/RulesPage';
import RecordsPage from './hub/pages/RecordsPage';
import WorkbenchPage from './hub/pages/WorkbenchPage';

const localUat = import.meta.env.DEV && import.meta.env.VITE_UAT_MODE === 'true';
const LiffCheck = localUat ? lazy(() => import('./uat/LiffCheck')) : () => null;

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">載入帳號中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <HubRoleProvider>{children}</HubRoleProvider>;
}

const owner = (node: React.ReactNode) => <RoleGate allow={['owner']}>{node}</RoleGate>;

function HomeRedirect() {
  const { me } = useHubRole();
  return <Navigate to={me?.role === 'agent' ? '/workbench' : '/groups'} replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">載入帳號中...</div>;
  }

  return (
    <>
      {localUat && <div className="bg-amber-100 text-amber-950 px-4 py-2 text-xs text-center">
        本機 UAT · Firebase emulator · LINE / AI 模擬，不會發送真實訊息 · <a className="underline" href="/uat/liff">LIFF 檢查</a>
      </div>}
    <Routes>
      {localUat && <Route path="/uat/liff" element={<Suspense fallback={<p>載入中...</p>}><LiffCheck /></Suspense>} />}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute><RoleGate allow={['owner', 'agent']}><ProfileGate><Layout /></ProfileGate></RoleGate></ProtectedRoute>}>
        <Route index element={<HomeRedirect />} />
        {/* Owner back office */}
        <Route path="/groups" element={owner(<GroupsSection />)} />
        <Route path="/records" element={owner(<AllRecordsPage />)} />
        <Route path="/history" element={<Navigate to="/records" replace />} />
        <Route path="/activities" element={owner(<ActivitiesPage />)} />
        <Route path="/activities/:id" element={owner(<ActivityDetailPage />)} />
        <Route path="/hub" element={owner(<HubLayout />)}>
          <Route index element={<HubOverviewPage />} />
          <Route path="groups" element={<Navigate to="/groups?tab=agent" replace />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="rules" element={<RulesPage />} />
          <Route path="records" element={<Navigate to="/records?type=notes" replace />} />
          <Route path="logs" element={<Navigate to="/records?type=runs" replace />} />
          <Route path="settings" element={<Navigate to="/hub?section=settings" replace />} />
          <Route path="workbench" element={<WorkbenchPage title="試跑台" />} />
          <Route path="*" element={<Navigate to="/hub" replace />} />
        </Route>
        {/* Agent accounts (Instinct) */}
        <Route path="/workbench" element={<WorkbenchPage />} />
        <Route path="/workbench/records" element={<RecordsPage />} />
        <Route path="*" element={<HomeRedirect />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
    </>
  );
}
