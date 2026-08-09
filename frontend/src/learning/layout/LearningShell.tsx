import { NavLink, Outlet } from 'react-router-dom';

export function LearningShell() {
  return (
    <section className="space-y-4">
      <nav className="flex gap-2 text-sm">
        <NavLink to="/learn" end className={({ isActive }) => (isActive ? 'text-blue-700' : 'text-gray-500')}>
          首頁
        </NavLink>
      </nav>
      <Outlet />
    </section>
  );
}
