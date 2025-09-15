import React, { useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';

// Pestañas iniciales para la sección Diseños
const tabs = [
  { path: 'invitaciones', label: 'Invitaciones' },
  { path: 'logo', label: 'Logo' },
  { path: 'menu', label: 'Menú' },
  { path: 'seating-plan', label: 'Seating Plan' },
  { path: 'menu-catering', label: 'Menú Catering' },
  { path: 'papeles-nombres', label: 'Papeles Nombres' },
  { path: 'mis-disenos', label: 'Mis diseños' },
];

const DisenosLayout = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();

  /* Redirección a la primera pestaña si el usuario está en /disenos */
  useEffect(() => {
    if (location.pathname === '/disenos' || location.pathname === '/disenos/') {
      navigate('/disenos/invitaciones', { replace: true });
    }
  }, [location.pathname, navigate]);

  const navTabs = useMemo(() => tabs.map(t => ({ ...t, href: `/disenos/${t.path}` })), []);

  if (location.pathname === '/disenos' || location.pathname === '/disenos/') {
    return <div className="p-6" role="status" aria-live="polite">Cargando...</div>;
  }

  return (
    <section className="p-6 flex flex-col gap-6" aria-labelledby="disenos-heading">
      <h1 id="disenos-heading" className="text-2xl font-bold text-gray-800">Diseños</h1>

      <nav role="tablist" aria-label="Secciones de Diseño" className="flex overflow-x-auto space-x-2 pb-2">
        {navTabs.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.href}
            role="tab"
            aria-current={location.pathname === tab.href ? 'page' : undefined}
            className={({ isActive }) =>
              `px-4 py-2 rounded-t-lg font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
                isActive
                  ? 'bg-white border-t-2 border-l-2 border-r-2 border-blue-500 text-blue-600 font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Card className="overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" role="region" aria-label="Contenido de Diseños">
        <div className="p-6">
          <Outlet />
        </div>
      </Card>
    </section>
  );
});

export default DisenosLayout;

