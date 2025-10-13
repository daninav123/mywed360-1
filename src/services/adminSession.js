const ADMIN_SESSION_TOKEN_KEY = 'MyWed360_admin_session_token';

export function getAdminSessionToken() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(ADMIN_SESSION_TOKEN_KEY) || null;
  } catch (error) {
    console.warn('[adminSession] No se pudo leer el token de sesión admin:', error);
    return null;
  }
}

export function getAdminHeaders(additional = {}) {
  const token = getAdminSessionToken();
  if (!token) return { ...(additional || {}) };
  return {
    ...(additional || {}),
    'X-Admin-Session': token,
  };
}

export function hasAdminSession() {
  return !!getAdminSessionToken();
}

export function getAdminFetchOptions(init = {}) {
  const base = init ? { ...init } : {};
  const headers = getAdminHeaders(base.headers || {});
  if (Object.keys(headers).length) {
    base.headers = headers;
  }
  return base;
}

