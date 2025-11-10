import React, { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import LanguageSelector from '../../components/ui/LanguageSelector';

const SECTION_TITLES = {
  'momentos-especiales': 'Momentos Especiales',
  timing: 'Timing',
  checklist: 'Checklist',
  'ayuda-ceremonia': 'Ayuda ceremonia',
};

const DEFAULT_SECTION = 'momentos-especiales';

const ProtocoloLayout = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/protocolo' || location.pathname === '/protocolo/') {
      navigate(`/protocolo/${DEFAULT_SECTION}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  const currentTitle = useMemo(() => {
    const entry = Object.entries(SECTION_TITLES).find(([path]) =>
      location.pathname.startsWith(`/protocolo/${path}`)
    );
    return entry ? entry[1] : 'Protocolo';
  }, [location.pathname]);

  if (location.pathname === '/protocolo' || location.pathname === '/protocolo/') {
    return (
      <div className="p-4 md:p-6" role="status" aria-live="polite">
        Cargando...
      </div>
    );
  }

  return (
    <section className="p-4 md:p-6 flex flex-col gap-6" aria-labelledby="protocolo-heading">
      <div className="flex items-center justify-between gap-4">
        <h1 id="protocolo-heading" className="page-title">
          {currentTitle}
        </h1>
        <LanguageSelector variant="minimal" />
      </div>

      <div
        className="focus:outline-none focus-visible:ring-2 ring-primary"
        role="region"
        aria-label="Contenido de Protocolo"
      >
        <Outlet />
      </div>

      <p className="sr-only" data-testid="current-path">
        Ruta actual: {location.pathname}
      </p>
    </section>
  );
});

export default ProtocoloLayout;
