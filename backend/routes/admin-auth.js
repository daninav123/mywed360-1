import express from 'express';
import crypto from 'crypto';

import {
  generateSessionIdentifiers,
  registerAdminSession,
  revokeAdminSession,
} from '../services/adminSessions.js';
import { getCookie } from '../utils/cookies.js';

const ADMIN_SESSION_COOKIE = 'admin_session';
const isProductionEnv = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

// Router para autenticación de administrador
// Endpoints:
//  - POST /api/admin/login
//  - POST /api/admin/login/mfa
//  - POST /api/admin/logout
// Nota: implementación mínima con almacenamiento en memoria

const router = express.Router();

// Memoria temporal de desafíos MFA y bloqueos por intento
const challenges = new Map(); // challengeId -> { email, code, resumeToken, expiresAt }
const loginAttempts = new Map(); // email -> { count, firstAt, lockedUntil }

// Helpers
const now = () => Date.now();
const genId = (prefix = 'adm') => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;

function toBool(v, def = false) {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return def;
}

function minutes(ms) {
  return Math.max(0, Math.ceil(ms / 60000));
}

function getConfig() {
  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  const requireMfa = isProd ? toBool(process.env.ADMIN_REQUIRE_MFA, true) : true;
  const mfaWindowSec = Number(process.env.ADMIN_MFA_WINDOW_SECONDS || '90');
  const maxAttempts = Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS || '5');
  const windowMinutes = Number(process.env.ADMIN_LOGIN_WINDOW_MINUTES || '60');
  const lockMinutes = Number(process.env.ADMIN_LOGIN_LOCK_MINUTES || '15');
  const sessionTtlMinutes = Number(process.env.ADMIN_SESSION_TTL_MINUTES || '720');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lovenda.com';
  const adminName = process.env.ADMIN_NAME || 'Administrador Lovenda';
  // En desarrollo, si no hay contraseña definida, usar un valor por defecto compatible con E2E
  const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== 'production' ? 'AdminPass123!' : '');
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
  return {
    requireMfa,
    mfaWindowSec,
    maxAttempts,
    windowMinutes,
    lockMinutes,
    sessionTtlMinutes,
    adminEmail,
    adminName,
    adminPassword,
    adminPasswordHash,
  };
}

function setAdminSessionCookie(res, sessionToken, { sessionTtlMinutes }) {
  if (!res || !sessionToken) return;
  const ttlMinutes = Number(sessionTtlMinutes || 720);
  const maxAgeMs = Math.max(ttlMinutes, 1) * 60 * 1000;
  res.cookie(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: isProductionEnv,
    sameSite: isProductionEnv ? 'strict' : 'lax',
    path: '/',
    maxAge: maxAgeMs,
  });
}

function clearAdminSessionCookie(res) {
  if (!res) return;
  res.cookie(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: isProductionEnv,
    sameSite: isProductionEnv ? 'strict' : 'lax',
    path: '/',
    expires: new Date(0),
  });
}

function getAllowedDomains() {
  // Puede definirse en server (ADMIN_ALLOWED_DOMAINS) o heredarse de build (VITE_ADMIN_ALLOWED_DOMAINS)
  const csv = process.env.ADMIN_ALLOWED_DOMAINS || process.env.VITE_ADMIN_ALLOWED_DOMAINS || 'lovenda.com';
  return String(csv)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isDomainAllowed(email) {
  try {
    const parts = String(email || '').toLowerCase().split('@');
    const domain = parts.length > 1 ? parts.pop().trim() : '';
    const allowed = getAllowedDomains();
    if (!allowed.length) return true;
    return allowed.includes(domain);
  } catch {
    return false;
  }
}

function isLocked(stats) {
  return !!(stats && stats.lockedUntil && stats.lockedUntil > now());
}

function ensureAttemptStats(email) {
  const cur = loginAttempts.get(email) || { count: 0, firstAt: now(), lockedUntil: 0 };
  // Reset window si expiró
  const cfg = getConfig();
  if (cur.firstAt + cfg.windowMinutes * 60000 < now()) {
    return { count: 0, firstAt: now(), lockedUntil: 0 };
  }
  return cur;
}

function registerFailedAttempt(email) {
  const cfg = getConfig();
  const stats = ensureAttemptStats(email);
  stats.count += 1;
  if (stats.count >= cfg.maxAttempts) {
    stats.lockedUntil = now() + cfg.lockMinutes * 60000;
  }
  loginAttempts.set(email, stats);
  return stats;
}

function resetAttempts(email) {
  loginAttempts.set(email, { count: 0, firstAt: now(), lockedUntil: 0 });
}

function simplePasswordCheck(input, cfg) {
  // Preferimos ADMIN_PASSWORD en esta implementación mínima.
  // Si ADMIN_PASSWORD_HASH está definido, por ahora no lo verificamos para evitar dependencias adicionales.
  if (cfg.adminPassword) {
    return crypto.timingSafeEqual(Buffer.from(String(input || '')), Buffer.from(String(cfg.adminPassword)));
  }
  // Si no hay contraseña definida, rechazamos por seguridad.
  return false;
}

function buildProfile(email, cfg) {
  return {
    id: 'admin-local',
    email,
    name: cfg.adminName,
    role: 'admin',
    isAdmin: true,
    preferences: { theme: 'dark', emailNotifications: false },
  };
}

async function createAdminSession(profile) {
  const cfg = getConfig();
  const { sessionId, sessionToken } = generateSessionIdentifiers();
  const sessionExpiresAt = new Date(now() + cfg.sessionTtlMinutes * 60000);
  return await registerAdminSession({
    sessionId,
    sessionToken,
    profile,
    email: profile?.email,
    expiresAt: sessionExpiresAt,
  });
}

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body || {};
    const cfg = getConfig();
    const normalized = String(email || '').trim().toLowerCase();

    // Validación de dominio permitido
    if (!isDomainAllowed(normalized)) {
      registerFailedAttempt(normalized);
      return res.status(401).json({ code: 'domain_not_allowed', message: 'Dominio no autorizado' });
    }

    // Verificar bloqueos por intentos
    const stats = ensureAttemptStats(normalized);
    if (isLocked(stats)) {
      return res.status(429).json({ code: 'locked', message: 'Se han superado los intentos permitidos', lockedUntil: new Date(stats.lockedUntil).toISOString() });
    }

    // Usuario de dominio permitido pero sin rol admin
    if (normalized !== cfg.adminEmail) {
      registerFailedAttempt(normalized);
      return res.status(401).json({ code: 'role_mismatch', message: 'Tu cuenta no dispone de acceso administrador' });
    }

    // Verificación básica de credenciales
    if (!simplePasswordCheck(password, cfg)) {
      const after = registerFailedAttempt(normalized);
      const left = Math.max(0, cfg.maxAttempts - after.count);
      const msg = left > 0
        ? `Email o contraseña no válidos. Intentos restantes: ${left}`
        : `Se han superado los intentos permitidos. Bloqueo ${minutes(after.lockedUntil - now())} min.`;
      return res.status(401).json({ code: left > 0 ? 'invalid_credentials' : 'locked', message: msg, lockedUntil: after.lockedUntil ? new Date(after.lockedUntil).toISOString() : null });
    }

    // Credenciales correctas
    resetAttempts(normalized);

    if (cfg.requireMfa) {
      const challengeId = genId('mfa');
      const resumeToken = genId('res');
      // En desarrollo, si no se definió ADMIN_MFA_TEST_CODE, usar 123456 para pruebas E2E deterministas
      const testCode = (process.env.ADMIN_MFA_TEST_CODE || (process.env.NODE_ENV !== 'production' ? '123456' : '')).trim();
      const code = String(testCode || Math.floor(100000 + Math.random() * 900000)); // 6 dígitos (testCode si existe)
      const expiresAt = now() + (cfg.mfaWindowSec * 1000);
      challenges.set(challengeId, { email: normalized, code, resumeToken, expiresAt });
      return res.json({ requiresMfa: true, challengeId, resumeToken, expiresAt: new Date(expiresAt).toISOString() });
    }

    const profile = buildProfile(normalized, cfg);
    const adminUser = { uid: profile.id, email: profile.email, displayName: profile.name };
    const { sessionId, sessionToken, sessionExpiresAt } = await createAdminSession(profile);
    setAdminSessionCookie(res, sessionToken, cfg);
    return res.json({
      profile,
      adminUser,
      sessionId,
      sessionExpiresAt: sessionExpiresAt.toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ code: 'login_failed', message: 'No se pudo iniciar sesión' });
  }
});

// POST /api/admin/login/mfa
router.post('/login/mfa', async (req, res) => {
  try {
    const { challengeId, resumeToken, code = '' } = req.body || {};
    if (!challengeId || !resumeToken) {
      return res.status(400).json({ code: 'invalid_request', message: 'Faltan parámetros' });
    }
    const entry = challenges.get(challengeId);
    if (!entry) {
      return res.status(400).json({ code: 'challenge_not_found', message: 'Desafío no encontrado' });
    }
    if (entry.resumeToken !== resumeToken) {
      return res.status(400).json({ code: 'invalid_resume_token', message: 'Token inválido' });
    }
    if (entry.expiresAt < now()) {
      challenges.delete(challengeId);
      return res.status(400).json({ code: 'challenge_expired', message: 'El código ha expirado' });
    }
    const provided = String(code).trim();
    const testCode = (process.env.ADMIN_MFA_TEST_CODE || '').trim();
    const ok = provided === String(entry.code) || (testCode && provided === testCode);
    if (!ok) {
      return res.status(401).json({ code: 'invalid_code', message: 'Código inválido' });
    }

    // Éxito MFA
    const cfg = getConfig();
    const profile = buildProfile(entry.email, cfg);
    const adminUser = { uid: profile.id, email: profile.email, displayName: profile.name };
    const { sessionId, sessionToken, sessionExpiresAt } = await createAdminSession(profile);

    challenges.delete(challengeId);
    setAdminSessionCookie(res, sessionToken, cfg);
    return res.json({
      profile,
      adminUser,
      sessionId,
      sessionExpiresAt: sessionExpiresAt.toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ code: 'mfa_failed', message: 'No se pudo completar MFA' });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  try {
    const bodyToken = req.body?.sessionToken || req.body?.token;
    const headerToken =
      req.headers['x-admin-session'] ||
      req.headers['x-admin-session-token'] ||
      req.headers['x-admin-token'];
    const cookieToken = getCookie(req, ADMIN_SESSION_COOKIE);
    const token =
      (typeof bodyToken === 'string' && bodyToken.trim() ? bodyToken.trim() : null) ||
      (typeof headerToken === 'string' && headerToken.trim() ? headerToken.trim() : null) ||
      (typeof cookieToken === 'string' && cookieToken.trim() ? cookieToken.trim() : null);
    if (token) {
      revokeAdminSession(token);
    }
    clearAdminSessionCookie(res);
    return res.status(204).send();
  } catch {
    clearAdminSessionCookie(res);
    return res.json({ success: true });
  }
});

export default router;
