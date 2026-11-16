import { Link } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import HubSettingsPage from './HubSettingsPage';

/** Landing tab of Agent Hub: how things are going, then the knobs, on one page. */
export default function HubOverviewPage() {
  return (
    <div className="space-y-4">
      <DashboardPage />
      <HubSettingsPage />
      <p className="text-xs text-gray-500">
        想親手走一遍 Agent 會做的事？
        <Link to="/hub/workbench" className="ml-1 text-blue-600 underline">打開試跑台</Link>
      </p>
    </div>
  );
}
