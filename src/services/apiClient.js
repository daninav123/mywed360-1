// Lightweight API client with optional auth header
import { auth } from '../firebaseConfig';
import { performanceMonitor } from './PerformanceMonitor';

const BASE = import.meta.env.VITE_BACKEND_BASE_URL || '';

async function getAuthToken() {
  try {
    const user = auth?.currentUser;
    if (user?.getIdToken) return await user.getIdToken();
  } catch {}
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
