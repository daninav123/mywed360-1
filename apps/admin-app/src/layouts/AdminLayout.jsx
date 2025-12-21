import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ADMIN_NAVIGATION } from '../config/adminNavigation';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [lastRefresh, setLastRefresh] = useState(() => new Date());
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = window.localStorage.getItem('maloveapp_admin_sidebar_collapsed');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const breadcrumbs = useMemo(() => {
    const parts = location.pathname
      .replace(/^\/admin\/?/, '')
      .split('/')
      .filter(Boolean);
    if (parts.length === 0) {
      return ['Administración', 'Dashboard'];
    }
    return ['Administración', ...parts];
  }, [location.pathname]);

  const formattedRefreshTime = useMemo(() => {
    try {
      return lastRefresh.toLocaleTimeString('es-ES', { hour12: false });
    } catch {
      return lastRefresh.toLocaleTimeString();
    }
  }, [lastRefresh]);

  useEffect(() => {
    setLastRefresh(new Date());
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión admin:', error);
    }
    navigate('/login', { replace: true });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('maloveapp_admin_sidebar_collapsed', String(next));
        } catch {}
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`hidden lg:flex flex-col border-r border-gray-200 bg-white transition-[width] duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-72'
          }`}
        >
          {!sidebarCollapsed && (
            <div className="flex h-full flex-col">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">MaLove.App Admin</h2>
                <p className="text-xs text-gray-500">Control del proyecto</p>
              </div>
              <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {ADMIN_NAVIGATION.map((section) => (
                  <div key={section.title}>
                    <p className="px-2 text-xs uppercase tracking-wide text-gray-500 mb-2">
                      {section.title}
                    </p>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                              isActive
                                ? 'block rounded-md px-3 py-2 text-sm transition-colors bg-blue-600 text-white'
                                : 'block rounded-md px-3 py-2 text-sm transition-colors text-gray-700 hover:bg-gray-100'
                            }
                          >
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
              <div className="px-6 py-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                <p>Version 1.0.0</p>
                <p>&copy; {new Date().getFullYear()} MaLove.App</p>
              </div>
            </div>
          )}
        </aside>

        {/* Toggle button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden lg:flex items-center justify-center absolute top-6 z-20 h-10 w-10 rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-50 transform -translate-x-1/2"
          style={{ left: sidebarCollapsed ? '2.5rem' : '18rem' }}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* Main content */}
        <main className="flex-1 flex flex-col">
          <header className="border-b border-gray-200 bg-white">
            <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb + '-' + index}>
                      {index > 0 && <span>/</span>}
                      <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}>
                        {crumb}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  Última actualización {formattedRefreshTime}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <span className="flex flex-col text-right text-xs text-gray-500">
                  <strong className="text-sm text-gray-900">
                    {user?.displayName || 'Administrador'}
                  </strong>
                  <span>{user?.email}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowHelp(true)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50"
                >
                  Ayuda
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 py-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Centro de ayuda</h2>
              <p className="text-sm text-gray-600">
                Si necesitas soporte, escribe a{' '}
                <a className="underline" href="mailto:soporte@maloveapp.com">
                  soporte@maloveapp.com
                </a>
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
