import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { ADMIN_ALLOWED_PATHS, ADMIN_NAVIGATION } from '../../config/adminNavigation';
import { useAuth } from '../../hooks/useAuth';
import LanguageSelector from '../../components/ui/LanguageSelector';

const normalizePath = (pathname) => {
  if (!pathname) return '/admin';
  if (pathname === '/admin') return '/admin';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
};

const REFRESH_INTERVAL_MS = 60_000;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userProfile } = useAuth();
  const lastAuditRef = useRef('');
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

  const supportEmail = useMemo(
    () =>
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_SUPPORT_EMAIL) ||
      'soporte@maloveapp.com',
    []
  );
  const supportPhone = useMemo(
    () =>
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_SUPPORT_PHONE) ||
      '+34 900 000 000',
    []
  );
  const securityLink = useMemo(
    () =>
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SECURITY_POLICY_URL) ||
      'https://lovenda.com/security',
    []
  );
  const adminVersion = useMemo(
    () => (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_VERSION) || 'v1.0.0',
    []
  );

  const breadcrumbs = useMemo(() => {
    const parts = location.pathname
      .replace(/^\/admin\/?/, '')
      .split('/')
      .filter(Boolean);
    if (parts.length === 0) {
      return ['Administracion', 'Dashboard'];
    }
    return ['Administracion', ...parts];
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      setLastRefresh(new Date());
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // console.error('Error al cerrar sesion admin:', error);
    }
    navigate('/admin/login', { replace: true });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('maloveapp_admin_sidebar_collapsed', String(next));
        } catch {
          // Ignorar errores de almacenamiento (modo incógnito, etc.)
        }
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg,#f4f5f7)] text-[var(--color-text,#111827)]">
      <div className="relative flex min-h-screen">
        <aside
          className={`hidden lg:flex flex-col border-r ${sidebarCollapsed ? 'border-transparent' : 'border-soft'} bg-surface transition-[width] duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-72'
          }`}
          aria-hidden={sidebarCollapsed}
        >
          {!sidebarCollapsed && (
            <div className="flex h-full flex-col">
              <div className="px-6 py-5 border-b border-soft">
                <h2 className="text-lg font-semibold">MaLove.App Admin</h2>
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
                  Control del proyecto
                </p>
              </div>
              <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {ADMIN_NAVIGATION.map((section) => (
                  <div key={section.title}>
                    <p className="px-2 text-xs uppercase tracking-wide text-[var(--color-text-soft,#6b7280)] mb-2">
                      {section.title}
                    </p>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                              isActive
                                ? 'block rounded-md px-3 py-2 text-sm transition-colors bg-[color:var(--color-primary,#6366f1)] text-[color:var(--color-on-primary,#ffffff)]'
                                : 'block rounded-md px-3 py-2 text-sm transition-colors text-[var(--color-text,#111827)] hover:bg-[var(--color-bg-soft,#f3f4f6)]'
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
              <div className="px-6 py-4 border-t border-soft text-xs text-[var(--color-text-soft,#6b7280)] space-y-1">
                <p>Version {adminVersion}</p>
                <a
                  href={securityLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[color:var(--color-primary,#6366f1)] hover:underline"
                >
                  Politicas de seguridad
                </a>
                <p>&copy; {new Date().getFullYear()} MaLove.App</p>
              </div>
            </div>
          )}
        </aside>

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          className="hidden lg:flex items-center justify-center absolute top-6 z-20 h-10 w-10 rounded-full border border-soft bg-surface text-[var(--color-text,#111827)] shadow-sm transition-all hover:bg-[var(--color-bg-soft,#f3f4f6)] transform -translate-x-1/2"
          style={{ left: sidebarCollapsed ? '2.5rem' : '18rem' }}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <main className="flex-1 flex flex-col">
          <header className="border-b border-soft bg-surface">
            <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-soft,#6b7280)]">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb + '-' + index}>
                      {index > 0 && <span>/</span>}
                      <span
                        className={
                          index === breadcrumbs.length - 1
                            ? 'text-[var(--color-text,#111827)] font-medium'
                            : ''
                        }
                      >
                        {crumb}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
                <div
                  className="text-xs text-[var(--color-text-soft,#6b7280)]"
                  data-testid="admin-last-refresh"
                >
                  Ultima actualizacion {formattedRefreshTime}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <span className="flex flex-col text-right text-xs text-[var(--color-text-soft,#6b7280)]">
                  <strong className="text-sm text-[var(--color-text,#111827)]">
                    {userProfile?.name || 'Administrador'}
                  </strong>
                  <span>{userProfile?.email}</span>
                </span>
                {/* Selector de idioma */}
                <LanguageSelector variant="minimal" />
                <button
                  type="button"
                  data-testid="admin-help-button"
                  onClick={() => setShowHelp(true)}
                  className="rounded-md border border-soft px-3 py-2 text-sm font-medium text-[color:var(--color-primary,#6366f1)] hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                >
                  Ayuda
                </button>
                <button
                  type="button"
                  data-testid="admin-logout-button"
                  onClick={handleLogout}
                  className="rounded-md border border-soft px-3 py-2 text-sm font-medium text-[var(--color-text,#111827)] hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                >
                  Cerrar sesion
                </button>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto bg-[var(--color-bg,#f4f5f7)]">
            <div className="mx-auto max-w-7xl px-4 py-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          data-testid="admin-help-modal"
        >
          <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Centro de ayuda</h2>
              <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
                Si necesitas soporte, escribe a{' '}
                <a className="underline" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>{' '}
                o llama al{' '}
                <a className="underline" href={`tel:${supportPhone}`}>
                  {supportPhone}
                </a>
                .
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href={`mailto:${supportEmail}`}
                className="rounded-md border border-soft px-3 py-2 text-center hover:bg-[var(--color-bg-soft,#f3f4f6)]"
              >
                Contactar por email
              </a>
              <a
                href={`tel:${supportPhone}`}
                className="rounded-md border border-soft px-3 py-2 text-center hover:bg-[var(--color-bg-soft,#f3f4f6)]"
              >
                Llamar a soporte
              </a>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] hover:bg-[color:var(--color-primary-dark,#4f46e5)]"
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
