// Lightweight API client with optional auth header
import { auth } from '../firebaseConfig';

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
  if (path.startsWith('/')) return `${BASE}${path}`;
  return `${BASE}/${path}`;
}

export async function get(path, opts = {}) {
  const res = await fetch(url(path), { method: 'GET', headers: await buildHeaders(opts) });
  return res;
}

export async function post(path, body, opts = {}) {
  const res = await fetch(url(path), { method: 'POST', headers: await buildHeaders(opts), body: body ? JSON.stringify(body) : undefined });
  return res;
}

export async function put(path, body, opts = {}) {
  const res = await fetch(url(path), { method: 'PUT', headers: await buildHeaders(opts), body: body ? JSON.stringify(body) : undefined });
  return res;
}

export async function del(path, opts = {}) {
  const res = await fetch(url(path), { method: 'DELETE', headers: await buildHeaders(opts) });
  return res;
}

