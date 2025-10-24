import admin from 'firebase-admin';
import { randomBytes } from 'crypto';

import { db } from '../db.js';

const COLLECTION = 'adminSessions';
const DEFAULT_TTL_MINUTES = Number(process.env.ADMIN_SESSION_TTL_MINUTES || '720');

const sessionsCollection = () => db?.collection(COLLECTION);

const memorySessions = new Map();
let firestoreHealthy = !!sessionsCollection();
let warnedOnce = false;

const warnOnce = (message) => {
  if (warnedOnce) return;
  warnedOnce = true;
  console.warn(`[adminSessions] ${message}`);
};

const toMillis = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (value?.toDate) {
    const asDate = value.toDate();
    return Number.isNaN(asDate.getTime()) ? null : asDate.getTime();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const normalizeProfile = (profile = {}, emailFallback = 'admin@maloveapp.com') => ({
  id: profile.id || 'admin-local',
  email: profile.email || emailFallback,
  name: profile.name || 'Administrador MaLoveApp',
  role: 'admin',
  isAdmin: true,
  preferences: profile.preferences || { theme: 'dark', emailNotifications: false },
});

const registerInMemory = ({ sessionId, sessionToken, profile, email, expiresAt }) => {
  const ttlMinutes = DEFAULT_TTL_MINUTES > 0 ? DEFAULT_TTL_MINUTES : 720;
  const expirationDate =
    expiresAt instanceof Date
      ? expiresAt
      : expiresAt
      ? new Date(expiresAt)
      : new Date(Date.now() + ttlMinutes * 60 * 1000);

  const normalizedProfile = normalizeProfile(profile, email);
  memorySessions.set(sessionToken, {
    sessionId,
    sessionToken,
    email: normalizedProfile.email,
    profile: normalizedProfile,
    expiresAt: expirationDate.getTime(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return {
    sessionId,
    sessionToken,
    sessionExpiresAt: expirationDate,
  };
};

const getFromMemory = (sessionToken) => {
  const entry = memorySessions.get(sessionToken);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    memorySessions.delete(sessionToken);
    return null;
  }
  return entry;
};

const revokeInMemory = (sessionToken) => memorySessions.delete(sessionToken);

const touchInMemory = (sessionToken, { ttlMinutes } = {}) => {
  const entry = getFromMemory(sessionToken);
  if (!entry) return null;
  const ttl = typeof ttlMinutes === 'number' && ttlMinutes > 0 ? ttlMinutes : DEFAULT_TTL_MINUTES;
  const newExpiration = Date.now() + ttl * 60 * 1000;
  memorySessions.set(sessionToken, { ...entry, expiresAt: newExpiration, updatedAt: Date.now() });
  return { ...entry, expiresAt: newExpiration };
};

const listMemorySessions = () => Array.from(memorySessions.values());

async function withFirestore(fn, fallback) {
  if (!firestoreHealthy) return fallback();
  try {
    return await fn();
  } catch (error) {
    firestoreHealthy = false;
    warnOnce(
      'No se pudo persistir sesiones admin en Firestore. Se utilizará almacenamiento en memoria. ' +
        'Configura FIREBASE_SERVICE_ACCOUNT_JSON o GOOGLE_APPLICATION_CREDENTIALS para habilitar persistencia.'
    );
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[adminSessions] Firestore error:', error?.message || error);
    }
    return fallback();
  }
}

export function generateSessionIdentifiers() {
  const sessionId = `sess_${randomBytes(8).toString('hex')}`;
  const sessionToken = `adm_${randomBytes(16).toString('hex')}`;
  return { sessionId, sessionToken };
}

export async function registerAdminSession({ sessionId, sessionToken, profile, email, expiresAt }) {
  return withFirestore(async () => {
    const ttlMinutes = DEFAULT_TTL_MINUTES > 0 ? DEFAULT_TTL_MINUTES : 720;
    const expirationDate =
      expiresAt instanceof Date
        ? expiresAt
        : expiresAt
        ? new Date(expiresAt)
        : new Date(Date.now() + ttlMinutes * 60 * 1000);

    const docRef = sessionsCollection().doc(sessionToken);
    const normalizedProfile = normalizeProfile(profile, email);

    await docRef.set(
      {
        sessionId,
        sessionToken,
        email: normalizedProfile.email,
        profile: normalizedProfile,
        expiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      sessionId,
      sessionToken,
      sessionExpiresAt: expirationDate,
    };
  }, () => registerInMemory({ sessionId, sessionToken, profile, email, expiresAt }));
}

export async function getAdminSession(sessionToken) {
  if (!sessionToken) return null;
  return withFirestore(async () => {
    const snap = await sessionsCollection().doc(sessionToken).get();
    if (!snap.exists) return null;

    const data = snap.data() || {};
    const expiresAtMs = toMillis(data.expiresAt);

    if (expiresAtMs && expiresAtMs <= Date.now()) {
      await sessionsCollection().doc(sessionToken).delete().catch(() => {});
      return null;
    }

    return {
      sessionId: data.sessionId,
      sessionToken,
      email: data.email || 'admin@maloveapp.com',
      profile: normalizeProfile(data.profile, data.email),
      expiresAt: expiresAtMs,
      createdAt: toMillis(data.createdAt),
      updatedAt: toMillis(data.updatedAt),
    };
  }, () => getFromMemory(sessionToken));
}

export async function revokeAdminSession(sessionToken) {
  if (!sessionToken) return false;
  return withFirestore(async () => {
    await sessionsCollection().doc(sessionToken).delete();
    return true;
  }, () => revokeInMemory(sessionToken));
}

export async function touchAdminSession(sessionToken, { ttlMinutes } = {}) {
  if (!sessionToken) return null;
  return withFirestore(async () => {
    const entry = await getAdminSession(sessionToken);
    if (!entry) return null;

    const ttl = typeof ttlMinutes === 'number' && ttlMinutes > 0 ? ttlMinutes : DEFAULT_TTL_MINUTES;
    const newExpiration = new Date(Date.now() + ttl * 60 * 1000);

    await sessionsCollection()
      .doc(sessionToken)
      .set(
        {
          expiresAt: admin.firestore.Timestamp.fromDate(newExpiration),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return { ...entry, expiresAt: newExpiration.getTime() };
  }, () => touchInMemory(sessionToken, { ttlMinutes }));
}

export async function getActiveAdminSessions() {
  return withFirestore(async () => {
    const now = Date.now();
    const snap = await sessionsCollection().get();
    const result = [];
    for (const doc of snap.docs) {
      const data = doc.data() || {};
      const expiresAtMs = toMillis(data.expiresAt);
      if (expiresAtMs && expiresAtMs <= now) {
        await doc.ref.delete().catch(() => {});
        continue;
      }
      result.push({
        sessionId: data.sessionId,
        sessionToken: doc.id,
        email: data.email,
        expiresAt: expiresAtMs,
        createdAt: toMillis(data.createdAt),
        updatedAt: toMillis(data.updatedAt),
      });
    }
    return result;
  }, () => listMemorySessions());
}
