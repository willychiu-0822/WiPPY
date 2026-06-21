import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/useAuth';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import TodayPage from './pages/TodayPage';
import SettingsPage from './pages/SettingsPage';
import ReportPage from './pages/ReportPage';
import GroupsPage from './pages/GroupsPage';
import SendHistoryPage from './pages/SendHistoryPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import Layout from './components/Layout';
import { LiffProvider } from './contexts/LiffContext';
import WaterTrackerPage from './pages/liff/WaterTrackerPage';
import LiffDevPlaygroundPage from './pages/liff/LiffDevPlaygroundPage';
import { hasWaterEntryGroup } from './lib/liffEntry';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function FallbackRoute({ user }: { user: unknown }) {
  const location = useLocation();
  if (hasWaterEntryGroup(location.search)) {
    return <Navigate to={`/liff/water${location.search}`} replace />;
  }
  return <Navigate to={user ? '/groups' : '/login'} replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  }

  return (
    <Routes>
      {/* LIFF routes — independent of Firebase Auth */}
      <Route path="/liff/water" element={<LiffProvider><WaterTrackerPage /></LiffProvider>} />
      <Route path="/dev/liff-playground" element={<LiffProvider><LiffDevPlaygroundPage /></LiffProvider>} />

      <Route path="/login" element={user ? <Navigate to="/groups" replace /> : <LoginPage />} />
      <Route path="/onboarding/*" element={
        <ProtectedRoute><OnboardingPage /></ProtectedRoute>
      } />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* V2 pages */}
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/history" element={<SendHistoryPage />} />
        {/* Activities */}
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/activities/:id" element={<ActivityDetailPage />} />
        {/* V1 pages kept under settings */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/report" element={<ReportPage />} />
      </Route>
      <Route path="*" element={<FallbackRoute user={user} />} />
    </Routes>
  );
}
