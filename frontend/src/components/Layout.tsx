import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Outlet, NavLink } from 'react-router-dom';
import { useHubRole } from '../hub/hub-role-context';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'
  }`;

export default function Layout() {
  const { me } = useHubRole();
  const isAgent = me?.role === 'agent';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 gap-2">
        <span className="text-xl font-bold text-blue-600 shrink-0">
          WiPPY
          {isAgent && me?.agentName && <span className="ml-2 text-xs font-medium text-gray-400">{me.agentName}</span>}
        </span>
        <nav className="flex gap-1 flex-wrap justify-end" aria-label="主選單">
          {isAgent ? (
            <>
              <NavLink to="/workbench" end className={linkClass}>工作台</NavLink>
              <NavLink to="/workbench/records" className={linkClass}>紀錄</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/groups" className={linkClass}>群組</NavLink>
              <NavLink to="/activities" className={linkClass}>活動</NavLink>
              <NavLink to="/history" className={linkClass}>記錄</NavLink>
              <NavLink to="/hub" className={linkClass}>Agent Hub</NavLink>
            </>
          )}
          <button
            onClick={() => signOut(auth)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 transition-colors"
          >
            登出
          </button>
        </nav>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
