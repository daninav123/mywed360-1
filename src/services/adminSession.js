const ADMIN_SESSION_TOKEN_KEY = 'MyWed360_admin_session_token';
const ADMIN_SESSION_FLAG_KEY = 'isAdminAuthenticated';
const ADMIN_REMEMBER_ME_KEY = 'MyWed360_admin_remember_me';
const ADMIN_SESSION_EXPIRY_KEY = 'MyWed360_admin_session_expires'; // Cambio: 'expires' no 'expiry'
const ADMIN_PROFILE_KEY = 'MyWed360_admin_profile';
const ADMIN_SESSION_ID_KEY = 'MyWed360_admin_session_id';

export function getAdminSessionToken() {
  if (typeof window === 'undefined') return null;
  try {
    // Verificar si la sesión ha expirado
    const expiry = window.localStorage.getItem(ADMIN_SESSION_EXPIRY_KEY);
    if (expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() > expiryTime) {
        // Sesión expirada
        clearAdminSession();
        return null;
      }
    }
    return window.localStorage.getItem(ADMIN_SESSION_TOKEN_KEY) || null;
  } catch (error) {
    console.warn('[adminSession] No se pudo leer el token de sesión admin:', error);
    return null;
  }
}

export function setAdminSession(token, rememberMe = false, profile = null, sessionId = null, expiresAt = null) {
  if (typeof window === 'undefined' || !token) return;
  try {
    window.localStorage.setItem(ADMIN_SESSION_TOKEN_KEY, token);
    window.localStorage.setItem(ADMIN_SESSION_FLAG_KEY, 'true');
    window.localStorage.setItem(ADMIN_REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
    
    // Si "recordar sesión", expira en 30 días; si no, en 12 horas
    const expiryDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    const expiryTime = expiresAt ? new Date(expiresAt).getTime() : (Date.now() + expiryDuration);
    window.localStorage.setItem(ADMIN_SESSION_EXPIRY_KEY, String(expiryTime));
    
    // Guardar perfil si se proporciona
    if (profile) {
      window.localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
    }
    
    // Guardar sessionId si se proporciona
    if (sessionId) {
      window.localStorage.setItem(ADMIN_SESSION_ID_KEY, sessionId);
    }
    
    console.log(`[adminSession] Sesión guardada (recordar: ${rememberMe}, expira: ${new Date(expiryTime).toLocaleString()})`);
  } catch (error) {
    console.warn('[adminSession] No se pudo guardar la sesión admin:', error);
  }
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_SESSION_FLAG_KEY);
    window.localStorage.removeItem(ADMIN_REMEMBER_ME_KEY);
    window.localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
    window.localStorage.removeItem(ADMIN_PROFILE_KEY);
    window.localStorage.removeItem(ADMIN_SESSION_ID_KEY);
    console.log('[adminSession] Sesión admin eliminada');
  } catch (error) {
    console.warn('[adminSession] No se pudo eliminar la sesión admin:', error);
  }
}

export function isRememberMeEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ADMIN_REMEMBER_ME_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getAdminHeaders(additional = {}) {
  const token = getAdminSessionToken();
  return { 
    ...(token && { 'X-Admin-Token': token }),
    ...(additional || {}) 
  };
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
  
  // Agregar headers de admin si hay sesión
  const adminHeaders = getAdminHeaders();
  base.headers = { ...base.headers, ...adminHeaders };
  
  if (!base.credentials) {
    base.credentials = 'include';
  }
  if (base.auth === undefined) {
    base.auth = false;
  }
  return base;
}
