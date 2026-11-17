import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import HubSettingsPage from './HubSettingsPage';

/** Landing tab of Agent Hub: how things are going, then the knobs, on one page. */
export default function HubOverviewPage() {
  const [params] = useSearchParams();
  const settingsRef = useRef<HTMLElement>(null);
  const showSettings = params.get('section') === 'settings';

  useEffect(() => {
    if (!showSettings) return;
    const node = settingsRef.current;
    if (!node || typeof node.scrollIntoView !== 'function') return;
    try {
      node.scrollIntoView({ block: 'start' });
    } catch {
      // jsdom does not implement scrolling; the section is still the landing target.
    }
  }, [showSettings]);

  return (
    <div className="space-y-4">
      <DashboardPage />
      <section ref={settingsRef} id="settings" aria-label="設定">
        <HubSettingsPage />
      </section>
      <p className="text-xs text-gray-500">
        想親手走一遍 Agent 會做的事？
        <Link to="/hub/workbench" className="ml-1 text-blue-600 underline">打開試跑台</Link>
      </p>
    </div>
  );
}
