import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/useAuth';
import LoginPage from './pages/LoginPage';
import GroupsPage from './pages/GroupsPage';
import SendHistoryPage from './pages/SendHistoryPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import Layout from './components/Layout';

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
    <Routes>
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
  );
}
