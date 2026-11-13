import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/hub', label: '總覽', end: true },
  { to: '/hub/groups', label: '群組開放' },
  { to: '/hub/agents', label: 'Agent' },
  { to: '/hub/rules', label: '規則' },
  { to: '/hub/records', label: '紀錄' },
  { to: '/hub/logs', label: '執行紀錄' },
  { to: '/hub/settings', label: '設定' },
  { to: '/hub/workbench', label: '工作台' },
];

export default function HubLayout() {
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-1" aria-label="Agent Hub">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `px-3 py-1.5 rounded-lg text-sm ${isActive ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
