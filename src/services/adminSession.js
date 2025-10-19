const ADMIN_SESSION_TOKEN_KEY = 'MyWed360_admin_session_token';
const ADMIN_SESSION_FLAG_KEY = 'isAdminAuthenticated';

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
  return { ...(additional || {}) };
}

export function hasAdminSession() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ADMIN_SESSION_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getAdminFetchOptions(init = {}) {
  const base = init ? { ...init } : {};
  if (!base.headers) {
    base.headers = {};
  } else {
    base.headers = { ...base.headers };
  }
  if (!base.credentials) {
    base.credentials = 'include';
  }
  if (base.auth === undefined) {
    base.auth = false;
  }
  return base;
}
