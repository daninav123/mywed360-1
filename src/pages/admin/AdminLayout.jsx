import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

const NAV_SECTIONS = [
  {
    title: 'Panel',
    items: [{ label: 'Resumen', to: '/admin/dashboard' }],
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Portfolio', to: '/admin/portfolio' },
      { label: 'Usuarios', to: '/admin/users' },
      { label: 'Broadcast', to: '/admin/broadcast' },
    ],
  },
  {
    title: 'Analítica',
    items: [
      { label: 'Métricas', to: '/admin/metrics' },
      { label: 'Reportes', to: '/admin/reports' },
    ],
  },
  {
    title: 'Infraestructura',
    items: [
      { label: 'Integraciones', to: '/admin/integrations' },
      { label: 'Alertas', to: '/admin/alerts' },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { label: 'Global', to: '/admin/settings' },
      { label: 'Auditoría', to: '/admin/audit' },
      { label: 'Soporte', to: '/admin/support' },
    ],
  },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userProfile } = useAuth();

  const breadcrumbs = React.useMemo(() => {
    const parts = location.pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
    if (parts.length === 0) {
      return ['Administración', 'Dashboard'];
    }
    return ['Administración', ...parts];
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión admin:', error);
    }
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg,#f4f5f7)] text-[var(--color-text,#111827)]">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex lg:w-72 flex-col border-r border-soft bg-surface">
          <div className="px-6 py-5 border-b border-soft">
            <h2 className="text-lg font-semibold">Lovenda Admin</h2>
            <p className="text-xs text-[var(--color-text-soft,#6b7280)]">Control del proyecto</p>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="px-2 text-xs uppercase tracking-wide text-[var(--color-text-soft,#6b7280)] mb-2">
                  {section.title}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
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
          <div className="px-6 py-4 border-t border-soft text-xs text-[var(--color-text-soft,#6b7280)]">
            <p>Versión v1.0.0</p>
            <p>© {new Date().getFullYear()} Lovenda</p>
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          <header className="border-b border-soft bg-surface">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-soft,#6b7280)]">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb + '-' + index}>
                    {index > 0 && <span>/</span>}
                    <span className={index === breadcrumbs.length - 1 ? 'text-[var(--color-text,#111827)] font-medium' : ''}>
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex flex-col text-right text-xs text-[var(--color-text-soft,#6b7280)]">
                  <strong className="text-sm text-[var(--color-text,#111827)]">
                    {userProfile?.name || 'Administrador'}
                  </strong>
                  <span>{userProfile?.email}</span>
                </span>
                <button
                  type="button"
                  data-testid="admin-logout-button"
                  onClick={handleLogout}
                  className="rounded-md border border-soft px-3 py-2 text-sm font-medium text-[var(--color-text,#111827)] hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                >
                  Cerrar sesión
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
    </div>
  );
};

export default AdminLayout;