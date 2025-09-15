import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader from '../components/ui/Loader';

// Páginas de usuario
// Rutas de email y proveedores centralizadas en App.jsx para evitar duplicados

// Carga perezosa (lazy loading) de componentes para mejor rendimiento
// const EmailSetupLazy = lazy(() => import('../pages/EmailSetup'));

// Componente para mostrar durante la carga
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader className="w-10 h-10" />
    <span className="ml-3 text-lg">Cargando...</span>
  </div>
);

/**
 * Rutas para la sección de usuario
 * Requiere autenticación
 */
const UserRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/user/dashboard" replace />} />
        {/** Rutas de email/proveedores se definen en App.jsx */}
        {/* Redirección rutas legado */}
        <Route path="/buzon/*" element={<Navigate to="/email" replace />} />
        <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default UserRoutes;
