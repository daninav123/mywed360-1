import React, { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

// Secciones disponibles dentro del módulo de protocolo.
// Se mantienen para resolver redirecciones y métricas, pero sin UI de pestañas.
const sections = [
  { path: 'momentos-especiales', label: 'Momentos Especiales' },
  { path: 'timing', label: 'Timing' },
  { path: 'checklist', label: 'Checklist' },
  { path: 'ayuda-ceremonia', label: 'Ayuda ceremonia' },
];

const ProtocoloLayout = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();

  // Redirigir a la primera sección si se accede a /protocolo sin subruta
  useEffect(() => {
    if (location.pathname === '/protocolo' || location.pathname === '/protocolo/') {
      navigate(`/protocolo/${sections[0].path}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  const isRoot = useMemo(
    () => location.pathname === '/protocolo' || location.pathname === '/protocolo/',
    [location.pathname]
  );

  if (isRoot) {
    return (
      <div className="p-4 md:p-6" role="status" aria-live="polite">
        Cargando...
      </div>
    );
  }

  return <Outlet />;
});

export default ProtocoloLayout;
