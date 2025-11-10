import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isSupplierAuthenticated, getSupplierToken, getSupplierId } from '../../utils/supplierAuth';

/**
 * Componente que protege rutas que requieren autenticación de proveedor
 */
export default function SupplierProtectedRoute({ children }) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = getSupplierToken();
    const supplierId = getSupplierId();

    console.log('[SupplierProtectedRoute] Verificando autenticación...');
    console.log(
      '[SupplierProtectedRoute] Token:',
      token ? `${token.substring(0, 20)}...` : 'NO TOKEN'
    );
    console.log('[SupplierProtectedRoute] Supplier ID:', supplierId);
    console.log('[SupplierProtectedRoute] Location:', location.pathname);

    const authenticated = isSupplierAuthenticated();
    console.log('[SupplierProtectedRoute] Autenticado:', authenticated);

    setIsAuth(authenticated);
    setIsChecking(false);
  }, [location.pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    console.warn('[SupplierProtectedRoute] No autenticado, redirigiendo a /supplier/login');
    return <Navigate to="/supplier/login" state={{ from: location }} replace />;
  }

  return children;
}
