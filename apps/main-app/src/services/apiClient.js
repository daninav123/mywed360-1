// Lightweight API client with optional auth header
import { auth } from '../firebaseConfig';
import { performanceMonitor } from './PerformanceMonitor';


function backendBase() {
  try {
    if (typeof window !== 'undefined' && window.Cypress && window.Cypress.env) {
      const v = window.Cypress.env('BACKEND_BASE_URL');
      if (v && typeof v === 'string' && v.trim()) return v.trim();
    }
  } catch {}
  return import.meta.env.VITE_BACKEND_BASE_URL || '';
}

const TOKEN_STORAGE_KEY = 'mw360_auth_token';

function rememberToken(token) {
  if (!token || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {}
}

function readStoredToken() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

async function getAuthToken({ refresh = true } = {}) {
  const DEBUG = false; // Cambiar a true para debugging detallado
  
  try {
    // Verificar que auth esté disponible
    if (!auth) {
      // console.error('[apiClient] Firebase auth no está inicializado');
      return null;
    }
    
    const user = auth.currentUser;
    if (!user) {
      if (DEBUG) // console.log('[apiClient] No hay usuario autenticado');
      // Si no hay usuario, limpiar token almacenado
      try {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {}
      return null;
    }

    if (DEBUG) // console.log('[apiClient] Usuario encontrado:', user.uid);

    // Siempre intentar obtener token fresco de Firebase
    // No confiar en el token almacenado porque puede estar expirado
    if (user.getIdToken) {
      try {
        if (DEBUG) // console.log('[apiClient] Solicitando token fresco...');
        const token = await user.getIdToken(true); // Siempre refrescar
        if (token) {
          if (DEBUG) {
            // Decodificar y mostrar expiración
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const exp = new Date(payload.exp * 1000);
              // console.log('[apiClient] Token obtenido, expira:', exp.toLocaleString());
            } catch {}
          }
          rememberToken(token);
          return token;
        }
      } catch (err) {
        // console.error('[apiClient] Error refreshing auth token:', err.message || err);
        // Limpiar token expirado
        try {
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        } catch {}
        
        // Intentar obtener token sin refrescar (puede fallar si está expirado)
        try {
          if (DEBUG) // console.log('[apiClient] Intentando token sin refresh...');
          const fallbackToken = await user.getIdToken(false);
          if (fallbackToken) {
            rememberToken(fallbackToken);
            return fallbackToken;
          }
        } catch (fallbackErr) {
          // console.error('[apiClient] Error obtaining cached auth token:', fallbackErr.message || fallbackErr);
        }
      }
    }
  } catch (err) {
    // console.error('[apiClient] No se pudo obtener token de autenticación:', err);
  }
  return null;
}

async function buildHeaders(opts = {}) {
  const base = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  
  // Por defecto, intentar enviar token si hay usuario autenticado
  // Solo NO enviar si explícitamente se pasa auth: false
  const shouldAuth = opts.auth !== false;
  
  if (shouldAuth) {
    const token = await getAuthToken();
    if (token) {
      return { ...base, Authorization: `Bearer ${token}` };
    }
    // Si auth era explícitamente true (requerido) y no hay token, error
    if (opts.auth === true) {
      throw new Error('[apiClient] Authentication required to call this endpoint');
    }
  }
  
  return base;
}

function url(path) {
  if (!path) throw new Error('Empty path');
  if (path.startsWith('http')) return path;
  const BASE = backendBase();
  // Si hay BASE configurado (Render u otro), usarlo SIEMPRE para rutas relativas
  if (BASE) {
    if (path.startsWith('/')) return `${BASE}${path}`;
    return `${BASE}/${path}`;
  }
  // Sin BASE: usar mismo origen (Vite proxy gestiona /api en dev)
  return path.startsWith('/') ? path : `/${path}`;
}

const isCypressRuntime = () => typeof window !== 'undefined' && typeof window.Cypress !== 'undefined';

function remapLegacyEndpoint(path, method = 'GET', body) {
  if (!isCypressRuntime() || typeof path !== 'string') {
    return { path, method, body };
  }

  const [basePath, query = ''] = path.split('?');
  const params = new URLSearchParams(query);

  const mapListResponse = (folder) => {
    if (!folder || folder === 'inbox') return '/api/email/inbox';
    if (folder === 'sent') return '/api/email/sent';
    if (folder === 'trash') return '/api/email/trash';
    if (folder.startsWith('custom:')) {
      const customId = folder.slice(7);
      return `/api/email/folder/${encodeURIComponent(customId)}`;
    }
    return `/api/email/${encodeURIComponent(folder)}`;
  };

  try {
    if (method === 'GET' && basePath === '/api/mail') {
      const folder = params.get('folder') || 'inbox';
      return { path: mapListResponse(folder), method: 'GET', body: undefined };
    }

    if (method === 'GET' && basePath.startsWith('/api/mail/')) {
      const id = basePath.slice('/api/mail/'.length);
      if (id === 'templates') {
        return { path: '/api/email/templates', method: 'GET', body: undefined };
      }
      if (id === 'stats') {
        return { path: '/api/email/stats', method: 'GET', body: undefined };
      }
      return { path: `/api/email/${encodeURIComponent(id)}`, method: 'GET', body: undefined };
    }

    if (method === 'POST' && basePath === '/api/mail') {
      return { path: '/api/email/send', method: 'POST', body };
    }

    if (method === 'POST' && basePath.endsWith('/read')) {
      const parts = basePath.split('/');
      const id = parts[3] || parts[2];
      return { path: `/api/email/${encodeURIComponent(id)}/read`, method: 'PUT', body: undefined };
    }

    if (method === 'POST' && basePath.endsWith('/unread')) {
      const parts = basePath.split('/');
      const id = parts[3] || parts[2];
      return { path: `/api/email/${encodeURIComponent(id)}/unread`, method: 'PUT', body: undefined };
    }

    if (method === 'PUT' && basePath.startsWith('/api/mail/') && basePath.endsWith('/folder')) {
      const parts = basePath.split('/');
      const id = parts[3] || parts[2];
      const targetFolder = body?.folder || params.get('folder') || '';
      if (targetFolder) {
        return {
          path: `/api/email/${encodeURIComponent(id)}/folder/${encodeURIComponent(targetFolder)}`,
          method: 'PUT',
          body: undefined,
        };
      }
      return {
        path: `/api/email/${encodeURIComponent(id)}/folder`,
        method: 'PUT',
        body,
      };
    }

    if (method === 'DELETE' && basePath.startsWith('/api/mail/folders/')) {
      const folderId = basePath.slice('/api/mail/folders/'.length);
      return {
        path: `/api/email/folders/${encodeURIComponent(folderId)}`,
        method: 'DELETE',
        body: undefined,
      };
    }

    if (method === 'DELETE' && basePath === '/api/mail/trash/empty') {
      return {
        path: '/api/email/trash/empty',
        method: 'DELETE',
        body: undefined,
      };
    }

    if (method === 'DELETE' && basePath.startsWith('/api/mail/')) {
      const id = basePath.slice('/api/mail/'.length);
      return {
        path: `/api/email/${encodeURIComponent(id)}`,
        method: 'DELETE',
        body: undefined,
      };
    }

    if (method === 'POST' && basePath === '/api/mail/alias') {
      return { path: '/api/email/alias', method: 'POST', body };
    }

    if (method === 'POST' && basePath.endsWith('/tags')) {
      const parts = basePath.split('/');
      const id = parts[3] || parts[2];
      const addTags = Array.isArray(body?.add) ? body.add : [];
      if (addTags.length) {
        return {
          path: `/api/email/${encodeURIComponent(id)}/tag`,
          method: 'POST',
          body: { tag: addTags[0] },
        };
      }
      const removeTags = Array.isArray(body?.remove) ? body.remove : [];
      if (removeTags.length) {
        return {
          path: `/api/email/${encodeURIComponent(id)}/tag/${encodeURIComponent(removeTags[0])}`,
          method: 'DELETE',
          body: undefined,
        };
      }
    }

    if (method === 'DELETE' && basePath.endsWith('/tags')) {
      const parts = basePath.split('/');
      const id = parts[3] || parts[2];
      return {
        path: `/api/email/${encodeURIComponent(id)}/tag`,
        method: 'DELETE',
        body: undefined,
      };
    }

    if (method === 'GET' && basePath === '/api/mail/templates') {
      return { path: '/api/email/templates', method: 'GET', body: undefined };
    }

    if (method === 'POST' && basePath === '/api/mail/calendar-event') {
      return { path: '/api/email/calendar-event', method: 'POST', body };
    }
  } catch (err) {
    // console.warn('[apiClient] remap legacy endpoint falló', err);
  }

  return { path, method, body };
}

export async function get(path, opts = {}) {
  const remapped = remapLegacyEndpoint(path, 'GET', undefined);
  const silent = !!opts.silent;
  const u = url(remapped.path);
  const u2 = silent ? (u + (u.includes('?') ? '&' : '?') + 'x-suppress-error-logging=1') : u;
  const fetchOptions = {
    method: remapped.method || 'GET',
    headers: await buildHeaders(opts),
  };
  if (opts.credentials) {
    fetchOptions.credentials = opts.credentials;
  }
  const res = await fetch(u2, fetchOptions);
  return res;
}

export async function post(path, body, opts = {}) {
  const remapped = remapLegacyEndpoint(path, 'POST', body);
  const silent = !!opts.silent;
  const u = url(remapped.path);
  const u2 = silent ? (u + (u.includes('?') ? '&' : '?') + 'x-suppress-error-logging=1') : u;
  const hasRemappedBody = Object.prototype.hasOwnProperty.call(remapped, 'body');
  const finalMethod = remapped.method || 'POST';
  const finalBody =
    finalMethod === 'GET' || finalMethod === 'DELETE'
      ? undefined
      : hasRemappedBody
        ? remapped.body == null
          ? undefined
          : JSON.stringify(remapped.body)
        : body != null
          ? JSON.stringify(body)
          : undefined;
  const headers = await buildHeaders(opts);
  const fetchOptions = {
    method: finalMethod,
    headers,
  };
  if (finalBody !== undefined) {
    fetchOptions.body = finalBody;
  }
  if (opts.credentials) {
    fetchOptions.credentials = opts.credentials;
  }
  const res = await fetch(u2, fetchOptions);
  try {
    const isParseDialog = String(u2 || '').endsWith('/api/ai/parse-dialog') || String(path || '').includes('/api/ai/parse-dialog');
    if (isParseDialog && res && res.ok) {
      const seemsCommand = /\b(agrega|añade|anade|crea|programa|planifica|borra|elimina|actualiza|modifica|cambia|mueve|reprograma|marca|completa|asigna|busca|importa|env[ií]a|enviar)\b/i.test(
        (body && body.text) || ''
      );
      res
        .clone()
        .json()
        .then((data) => {
          try {
            const ex = data?.extracted || {};
            const hasAny = Boolean(
              (ex.commands && ex.commands.length) ||
                (ex.guests && ex.guests.length) ||
                (ex.tasks && ex.tasks.length) ||
                (ex.meetings && ex.meetings.length) ||
                (ex.movements && ex.movements.length) ||
                (ex.budgetMovements && ex.budgetMovements.length)
            );
            if (seemsCommand && !hasAny) {
              performanceMonitor.logError('chat_command_unhandled', 'No se encontró comando ejecutable', {
                text: (body && body.text) || '',
              });
              performanceMonitor.incrementCounter('chat_unhandled');
              performanceMonitor.logEvent('chat_alert', { reason: 'unhandled_command', text: (body && body.text) || '' });
              performanceMonitor.flushMetrics?.();
            }
          } catch {}
        })
        .catch(() => {});
    }
  } catch {}
  return res;
}

export async function put(path, body, opts = {}) {
  const remapped = remapLegacyEndpoint(path, 'PUT', body);
  const silent = !!opts.silent;
  const u = url(remapped.path);
  const u2 = silent ? (u + (u.includes('?') ? '&' : '?') + 'x-suppress-error-logging=1') : u;
  const hasRemappedBody = Object.prototype.hasOwnProperty.call(remapped, 'body');
  const finalMethod = remapped.method || 'PUT';
  const finalBody =
    finalMethod === 'GET' || finalMethod === 'DELETE'
      ? undefined
      : hasRemappedBody
        ? remapped.body == null
          ? undefined
          : JSON.stringify(remapped.body)
        : body != null
          ? JSON.stringify(body)
          : undefined;
  const headers = await buildHeaders(opts);
  const fetchOptions = {
    method: finalMethod,
    headers,
  };
  if (finalBody !== undefined) {
    fetchOptions.body = finalBody;
  }
  if (opts.credentials) {
    fetchOptions.credentials = opts.credentials;
  }
  const res = await fetch(u2, fetchOptions);
  return res;
}

export async function del(path, opts = {}) {
  const remapped = remapLegacyEndpoint(path, 'DELETE', undefined);
  const silent = !!opts.silent;
  const u = url(remapped.path);
  const u2 = silent ? (u + (u.includes('?') ? '&' : '?') + 'x-suppress-error-logging=1') : u;
  const hasRemappedBody = Object.prototype.hasOwnProperty.call(remapped, 'body');
  const finalMethod = remapped.method || 'DELETE';
  const finalBody =
    finalMethod === 'GET'
      ? undefined
      : hasRemappedBody
        ? remapped.body == null
          ? undefined
          : JSON.stringify(remapped.body)
        : undefined;
  const headers = await buildHeaders(opts);
  const fetchOptions = {
    method: finalMethod,
    headers,
  };
  if (finalBody !== undefined) {
    fetchOptions.body = finalBody;
  }
  if (opts.credentials) {
    fetchOptions.credentials = opts.credentials;
  }
  const res = await fetch(u2, fetchOptions);
  return res;
}

/**
 * Construye las opciones de cabecera para peticiones autenticadas.
 * Acepta objetos de usuario (Firebase, contexto propio o mocks de tests) y mergea opciones extra.
 *
 * - Si el usuario expone un token sin prefijo, se agrega como `Bearer`.
 * - Si no hay token explícito, fuerza auth=true para que buildHeaders obtenga el token actual.
 * - Permite aportar cabeceras adicionales mediante `extra.headers`.
 *
 * @param {Object|string|null} user Usuario actual o token directo.
 * @param {Object} extra Opciones adicionales (por ejemplo { silent: true }).
 * @returns {Object} Opciones compatibles con apiClient (auth, headers, silent, ...).
 */
export function buildAuthHeaders(user, extra = {}) {
  const opts = { ...(extra || {}) };
  const headers = { ...(opts.headers || {}) };

  let token = null;
  if (typeof user === 'string' && user.trim()) {
    token = user.trim();
  } else if (user && typeof user === 'object') {
    token =
      user.token ||
      user.accessToken ||
      user.idToken ||
      user.authToken ||
      user.bearerToken ||
      null;
    if (!token && typeof user.getIdToken === 'function') {
      // Guardar referencia para resolución lazy en buildHeaders mediante auth=true
      opts.auth = opts.auth !== undefined ? opts.auth : true;
    }
    if (user.uid) headers['X-User-Uid'] = String(user.uid);
    if (user.email) headers['X-User-Email'] = String(user.email);
  }

  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    // Cuando hay token explícito ya no necesitamos que buildHeaders resuelva auth automáticamente.
    if (opts.auth === undefined) opts.auth = false;
  } else if (opts.auth === undefined) {
    opts.auth = true;
  }

  if (Object.keys(headers).length) {
    opts.headers = headers;
  } else {
    delete opts.headers;
  }

  return opts;
}

export { get as apiGet, post as apiPost, put as apiPut, del as apiDel };
