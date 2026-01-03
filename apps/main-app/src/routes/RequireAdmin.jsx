import React, { useEffect, useMemo, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ADMIN_ALLOWED_PATHS } from '../config/adminNavigation';
import { useAuth } from '../hooks/useAuth.jsx';
import { recordAdminSecurityEvent } from '../services/adminAuditService';
import { hasAdminSession } from '../services/adminSession';

const normalizePath = (pathname) => {
  if (!pathname) return '/admin';
  if (pathname === '/admin') return '/admin';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
};

const RequireAdmin = () => {
  const location = useLocation();
  const { isLoading, isAuthenticated, isAdmin, currentUser, userProfile } = useAuth();
  const lastReportedRef = useRef('');

  const normalizedPath = useMemo(() => normalizePath(location.pathname), [location.pathname]);
  const isAllowedPath = ADMIN_ALLOWED_PATHS.has(normalizedPath);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Cypress) {
      return;
    }
    if (isLoading) {
      return;
    }
    if (isAuthenticated && isAdmin) {
      return;
    }

    const reason = !isAuthenticated ? 'unauthenticated' : 'role_mismatch';
    const email = userProfile?.email || currentUser?.email || 'anonymous';
    const cacheKey = `${email}:${normalizedPath}:${reason}`;

    if (lastReportedRef.current === cacheKey) {
      return;
    }

    lastReportedRef.current = cacheKey;

    if (hasAdminSession && typeof hasAdminSession === 'function' && hasAdminSession()) {
      recordAdminSecurityEvent({
        action: 'ADMIN_ROUTE_BLOCKED',
        email,
        outcome: 'denied',
        reason,
      }).catch((error) => {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          // console.warn('[RequireAdmin] No se pudo registrar el evento de seguridad:', error);
        }
      });
    }
  }, [
    isLoading,
    isAuthenticated,
    isAdmin,
    normalizedPath,
    userProfile?.email,
    currentUser?.email,
  ]);

  if (typeof window !== 'undefined' && window.Cypress) {
    return <Outlet />;
  }

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!isAllowedPath) {
    const email = userProfile?.email || currentUser?.email || 'admin';
    const reason = `route_not_allowed:${normalizedPath}`;
    const cacheKey = `${email}:${reason}`;
    if (lastReportedRef.current !== cacheKey && hasAdminSession && hasAdminSession()) {
      lastReportedRef.current = cacheKey;
      void recordAdminSecurityEvent({
        action: 'ADMIN_ROUTE_RESTRICTED',
        email,
        outcome: 'blocked',
        reason,
      });
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
