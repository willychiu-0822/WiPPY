import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/hub', label: '總覽與設定', end: true },
  { to: '/hub/agents', label: '小幫手名單' },
  { to: '/hub/rules', label: '規則' },
];

export default function HubLayout() {
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-1" aria-label="小幫手">
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
