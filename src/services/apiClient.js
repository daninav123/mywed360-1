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
const FORCE_MOCK_DEFAULT =
  (import.meta.env.VITE_AUTH_FORCE_MOCK ?? (import.meta.env.DEV ? 'true' : 'false')) === 'true';

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

function buildMockToken(user) {
  if (!user) return null;
  const email = user.email || 'user@local.dev';
  return `mock-${user.uid || 'anon'}-${email}`;
}

async function getAuthToken() {
  try {
    const stored = readStoredToken();
    if (stored) return stored;
  } catch {}

  try {
    const user = auth?.currentUser;
    if (!user) return null;

    const forceMock =
      (import.meta.env.VITE_AUTH_FORCE_MOCK ?? import.meta.env.VITE_AUTH_USE_MOCK) !== undefined
        ? (import.meta.env.VITE_AUTH_FORCE_MOCK ?? import.meta.env.VITE_AUTH_USE_MOCK) === 'true'
        : FORCE_MOCK_DEFAULT;

    if (forceMock) {
      const mockToken = buildMockToken(user);
      rememberToken(mockToken);
      return mockToken;
    }

    if (user.getIdToken) {
      const token = await user.getIdToken();
      if (token) rememberToken(token);
      return token;
    }
  } catch (err) {
    console.warn('[apiClient] No se pudo obtener token de autenticación:', err);
  }
  return null;
}

async function buildHeaders(opts = {}) {
  const base = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (opts.auth) {
    const token = await getAuthToken();
    if (token) return { ...base, Authorization: `Bearer ${token}` };
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

export async function get(path, opts = {}) {
  const silent = !!opts.silent;
  const u = url(path);
  const u2 = silent ? (u + (u.includes('?') ? '&' : '?') + 'x-suppress-error-logging=1') : u;
  const res = await fetch(u2, { method: 'GET', headers: await buildHeaders(opts) });
  return res;
}

export async function post(path, body, opts = {}) {
  const silent = !!opts.silent;
  const u = url(path);
  const u2 = silent ? (u + (u.includes('?') ? '&' : '?') + 'x-suppress-error-logging=1') : u;
  const res = await fetch(u2, {
    method: 'POST',
    headers: await buildHeaders(opts),
    body: body ? JSON.stringify(body) : undefined,
  });
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
  const silent = !!opts.silent;
  const u = url(path);
  const u2 = silent ? (u + (u.includes('?') ? '&' : '?') + 'x-suppress-error-logging=1') : u;
  const res = await fetch(u2, {
    method: 'PUT',
    headers: await buildHeaders(opts),
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

export async function del(path, opts = {}) {
  const silent = !!opts.silent;
  const u = url(path);
  const u2 = silent ? (u + (u.includes('?') ? '&' : '?') + 'x-suppress-error-logging=1') : u;
  const res = await fetch(u2, { method: 'DELETE', headers: await buildHeaders(opts) });
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
