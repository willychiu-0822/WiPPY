import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import GroupsPage from './GroupsPage';

const GroupAccessPage = lazy(() => import('../hub/pages/GroupAccessPage'));

const TABS = [
  { id: 'chat', label: '聊天與廣播' },
  { id: 'agent', label: '交給 Agent' },
] as const;

/**
 * The one "群組" entry in the app: chatting/broadcasting and deciding which
 * groups an Agent may read live side by side, instead of in two menus.
 */
export default function GroupsSection() {
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') === 'agent' ? 'agent' : 'chat';

  return (
    <div className="space-y-4">
      <div className="flex gap-1" role="tablist" aria-label="群組">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setParams(t.id === 'chat' ? {} : { tab: t.id }, { replace: true })}
            className={`px-3 py-1.5 rounded-lg text-sm ${active === t.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {active === 'agent' ? (
        <Suspense fallback={<p>載入中...</p>}>
          <GroupAccessPage />
        </Suspense>
      ) : <GroupsPage />}
    </div>
  );
}
