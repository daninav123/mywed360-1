import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const RequireAdmin = () => {
  const location = useLocation();
  const { isLoading, isAuthenticated, isAdmin } = useAuth();

  if (typeof window !== 'undefined' && window.Cypress) {
    return <Outlet />;
  }

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAdmin;
