import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/useAuth';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import { ProfileGate } from './components/ProfileGate';
import { HubRoleProvider } from './hub/HubRoleProvider';
import { RoleGate } from './hub/RoleGate';
import { useHubRole } from './hub/hub-role-context';

const localUat = import.meta.env.DEV && import.meta.env.VITE_UAT_MODE === 'true';
const LiffCheck = localUat ? lazy(() => import('./uat/LiffCheck')) : () => null;

// Same fallback already used for the local UAT lazy route.
const routeFallback = <p>載入中...</p>;

const GroupsSection = lazy(() => import('./pages/GroupsSection'));
const AllRecordsPage = lazy(() => import('./pages/AllRecordsPage'));
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage'));
const ActivityDetailPage = lazy(() => import('./pages/ActivityDetailPage'));
const HubLayout = lazy(() => import('./hub/pages/HubLayout'));
const HubOverviewPage = lazy(() => import('./hub/pages/HubOverviewPage'));
const AgentsPage = lazy(() => import('./hub/pages/AgentsPage'));
const RulesPage = lazy(() => import('./hub/pages/RulesPage'));
const RecordsPage = lazy(() => import('./hub/pages/RecordsPage'));
const WorkbenchPage = lazy(() => import('./hub/pages/WorkbenchPage'));

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={routeFallback}>{children}</Suspense>;
}

// Pages stay out of the login graph, but a signed-in session prefetches them so a
// later offline navigation still opens the page that was already one bundle.
function usePrefetchSignedInPages(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const loads = [
      import('./pages/GroupsSection'),
      import('./pages/AllRecordsPage'),
      import('./pages/ActivitiesPage'),
      import('./pages/ActivityDetailPage'),
      import('./hub/pages/HubLayout'),
      import('./hub/pages/HubOverviewPage'),
      import('./hub/pages/AgentsPage'),
      import('./hub/pages/RulesPage'),
      import('./hub/pages/RecordsPage'),
      import('./hub/pages/WorkbenchPage'),
      import('./hub/pages/GroupAccessPage'),
      import('./hub/pages/LogsPage'),
    ];
    for (const load of loads) void load.catch(() => {});
  }, [enabled]);
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">載入帳號中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <HubRoleProvider>{children}</HubRoleProvider>;
}

const owner = (node: ReactNode) => <RoleGate allow={['owner']}>{node}</RoleGate>;

function HomeRedirect() {
  const { me } = useHubRole();
  return <Navigate to={me?.role === 'agent' ? '/workbench' : '/groups'} replace />;
}

export default function App() {
  const { user, loading } = useAuth();
  usePrefetchSignedInPages(!!user);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">載入帳號中...</div>;
  }

  return (
    <>
      {localUat && <div className="bg-amber-100 text-amber-950 px-4 py-2 text-xs text-center">
        本機 UAT · Firebase emulator · LINE / AI 模擬，不會發送真實訊息 · <a className="underline" href="/uat/liff">LIFF 檢查</a>
      </div>}
    <Routes>
      {localUat && <Route path="/uat/liff" element={<LazyPage><LiffCheck /></LazyPage>} />}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute><RoleGate allow={['owner', 'agent']}><ProfileGate><Layout /></ProfileGate></RoleGate></ProtectedRoute>}>
        <Route index element={<HomeRedirect />} />
        {/* Owner back office */}
        <Route path="/groups" element={owner(<LazyPage><GroupsSection /></LazyPage>)} />
        <Route path="/records" element={owner(<LazyPage><AllRecordsPage /></LazyPage>)} />
        <Route path="/history" element={<Navigate to="/records" replace />} />
        <Route path="/activities" element={owner(<LazyPage><ActivitiesPage /></LazyPage>)} />
        <Route path="/activities/:id" element={owner(<LazyPage><ActivityDetailPage /></LazyPage>)} />
        <Route path="/hub" element={owner(<LazyPage><HubLayout /></LazyPage>)}>
          <Route index element={<LazyPage><HubOverviewPage /></LazyPage>} />
          <Route path="groups" element={<Navigate to="/groups?tab=agent" replace />} />
          <Route path="agents" element={<LazyPage><AgentsPage /></LazyPage>} />
          <Route path="rules" element={<LazyPage><RulesPage /></LazyPage>} />
          <Route path="records" element={<Navigate to="/records?type=notes" replace />} />
          <Route path="logs" element={<Navigate to="/records?type=runs" replace />} />
          <Route path="settings" element={<Navigate to="/hub?section=settings" replace />} />
          <Route path="workbench" element={<LazyPage><WorkbenchPage title="試跑台" /></LazyPage>} />
          <Route path="*" element={<Navigate to="/hub" replace />} />
        </Route>
        {/* Agent accounts (Instinct) */}
        <Route path="/workbench" element={<LazyPage><WorkbenchPage /></LazyPage>} />
        <Route path="/workbench/records" element={<LazyPage><RecordsPage /></LazyPage>} />
        <Route path="*" element={<HomeRedirect />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
    </>
  );
}
