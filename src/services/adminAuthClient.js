import { apiPost } from './apiClient';

const LOGIN_PATH = '/api/admin/login';
const MFA_PATH = '/api/admin/login/mfa';
const LOGOUT_PATH = '/api/admin/logout';

function parseDate(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

async function request(path, body = {}) {
  const res = await apiPost(path, body, { auth: false });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const error = new Error(
      data?.message ||
        'No se pudo completar la operación administrativa.'
    );
    error.code = data?.code || 'admin_request_failed';
    if (data?.lockedUntil) {
      error.lockedUntil = parseDate(data.lockedUntil);
    }
    throw error;
  }
  return data || {};
}

export async function loginAdmin(payload) {
  const data = await request(LOGIN_PATH, payload);
  return {
    ...data,
    lockedUntil: parseDate(data.lockedUntil),
    expiresAt: parseDate(data.expiresAt),
    sessionExpiresAt: parseDate(data.sessionExpiresAt),
  };
}

export async function verifyAdminMfa(payload) {
  const data = await request(MFA_PATH, payload);
  return {
    ...data,
    sessionExpiresAt: parseDate(data.sessionExpiresAt),
  };
}

export async function logoutAdmin(sessionToken) {
  if (!sessionToken) return { success: true };
  try {
    await request(LOGOUT_PATH, { sessionToken });
  } catch (error) {
    // Si el backend ya invalidó la sesión, no es crítico para el frontend.
    if (error?.code !== 'admin_request_failed') {
      console.warn('[adminAuthClient] logout admin fallback:', error);
    }
  }
  return { success: true };
}

