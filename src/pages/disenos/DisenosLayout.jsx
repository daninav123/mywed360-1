import React, { useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import Card from '../../components/ui/Card';
import { useTranslations } from '../../hooks/useTranslations';

// Pestañas iniciales para la sección Diseños
const tabs = [
  {
  const { t } = useTranslations();
 path: 'invitaciones', label: 'Invitaciones' },
  { path: 'logo', label: 'Logo' },
  { path: 'menu', label: {t('common.menu')} },
  { path: 'seating-plan', label: 'Seating Plan' },
  { path: 'menu-catering', label: {t('common.menu_catering')} },
  { path: 'papeles-nombres', label: 'Papeles Nombres' },
  { path: 'mis-disenos', label: {t('common.mis_disenos')} },
];

const DiseñosLayout = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();

  /* Redirección a la primera pestaña si el usuario está en /disenos */
  useEffect(() => {
    if (location.pathname === '/disenos' || location.pathname === '/disenos/') {
      navigate('/disenos/invitaciones', { replace: true });
    }
  }, [location.pathname, navigate]);

  const navTabs = useMemo(() => tabs.map((t) => ({ ...t, href: `/disenos/${t.path}` })), []);

  if (location.pathname === '/disenos' || location.pathname === '/disenos/') {
    return (
      <div className="p-6" role="status" aria-live="polite">
        Cargando...
      </div>
    );
  }

  return (
    <section className="p-6 flex flex-col gap-6" aria-labelledby="disenos-heading">
      <h1 id="disenos-heading" className="text-2xl font-bold text-body">
        Diseños
      </h1>

      <nav
        role="tablist"
        aria-label="Secciones de Diseño"
        className="flex overflow-x-auto space-x-2 pb-2"
      >
        {navTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.href}
            role="tab"
            aria-current={location.pathname === tab.href ? 'page' : undefined}
            className={({ isActive }) =>
              `px-4 py-2 rounded-t-lg font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-primary ${
                isActive
                  ? 'bg-surface border-t-2 border-l-2 border-r-2 border-primary text-primary font-semibold'
                  : 'bg-surface text-muted hover:bg-primary-soft'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Card
        className="overflow-hidden focus:outline-none focus-visible:ring-2 ring-primary"
        role="region"
        aria-label="Contenido de Diseños"
      >
        <div className="p-6">
          <Outlet />
        </div>
      </Card>
    </section>
  );
});

export default DiseñosLayout;
