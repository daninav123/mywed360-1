import React, { lazy, Suspense } from 'react';

import Loader from '../ui/Loader';

// Carga perezosa con fallback y manejo de error simple
const LazyComponentLoader = ({
  importFunction,
  fallback = <Loader />,
  errorFallback = <div className="p-4 text-center text-red-500">Error cargando componente</div>,
  ...props
}) => {
  const LazyComponent = lazy(() =>
    importFunction().catch((error) => {
      console.error('Error cargando componente lazy:', error);
      return { default: () => errorFallback };
    })
  );

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};
LazyComponentLoader.displayName = 'LazyComponentLoader';

// HOC para crear componentes lazy con opciones
export const createLazyComponent = (importFunction, options = {}) => {
  const {
    fallback = <Loader />,
    errorFallback = <div className="p-4 text-center text-red-500">Error cargando componente</div>,
  } = options;

  const Wrapped = (props) => (
    <LazyComponentLoader
      importFunction={importFunction}
      fallback={fallback}
      errorFallback={errorFallback}
      {...props}
    />
  );
  Wrapped.displayName = 'LazyComponentLoaderWrapped';
  return Wrapped;
};

// Componentes lazy pre-configurados
export const LazyTasks = createLazyComponent(() => import('../../pages/Tasks'));
export const LazyFinance = createLazyComponent(() => import('../../pages/Finance'));
export const LazyGestionProveedores = createLazyComponent(
  () => import('../../pages/GestionProveedores')
);
export const LazySeatingPlan = () => null;
export const LazyInvitationDesigner = createLazyComponent(
  () => import('../../pages/InvitationDesigner')
);
export const LazyChecklist = createLazyComponent(() => import('../../pages/Checklist'));

// Módulos de email
export const LazyEmailInbox = createLazyComponent(() => import('../../pages/user/EmailInbox'));
export const LazyEmailStatistics = createLazyComponent(
  () => import('../../pages/user/EmailStatistics')
);

// Administración
export const LazyAdminDashboard = createLazyComponent(
  () => import('../../components/admin/AdminDashboard')
);
export const LazyUserManagement = createLazyComponent(
  () => import('../../components/admin/UserManagement')
);
export const LazyMetricsDashboard = createLazyComponent(
  () => import('../../components/admin/MetricsDashboard')
);

export default LazyComponentLoader;
