/**
 * Trusted Devices Service
 * Gestiona dispositivos confiables para skip MFA y remember me
 */

import crypto from 'crypto';
import admin from 'firebase-admin';
import { db } from '../db.js';

const COLLECTION = 'adminTrustedDevices';
const DEFAULT_DEVICE_TTL_DAYS = 30;
const MAX_DEVICES_PER_USER = 5;

const devicesCollection = () => db?.collection(COLLECTION);

// Memoria para cuando Firestore no está disponible
const memoryDevices = new Map();
let firestoreHealthy = !!devicesCollection();

/**
 * Genera un device ID único basado en user agent y otros datos
 */
export function generateDeviceId(userAgent, ipAddress) {
  const hash = crypto.createHash('sha256');
  hash.update(userAgent || 'unknown');
  hash.update(ipAddress || '127.0.0.1');
  hash.update(Date.now().toString());
  return `dev_${hash.digest('hex').slice(0, 32)}`;
}

/**
 * Extrae información del dispositivo desde la petición
 */
export function extractDeviceInfo(req) {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  
  // Parsear user agent para obtener navegador y OS
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                  userAgent.includes('Firefox') ? 'Firefox' :
                  userAgent.includes('Safari') ? 'Safari' :
                  userAgent.includes('Edge') ? 'Edge' : 'Unknown';
  
  const os = userAgent.includes('Windows') ? 'Windows' :
             userAgent.includes('Mac') ? 'macOS' :
             userAgent.includes('Linux') ? 'Linux' :
             userAgent.includes('Android') ? 'Android' :
             userAgent.includes('iOS') ? 'iOS' : 'Unknown';
  
  return {
    userAgent,
    ipAddress,
    browser,
    os,
    fingerprint: crypto.createHash('md5').update(`${userAgent}${ipAddress}`).digest('hex').slice(0, 16)
  };
}

/**
 * Registra un nuevo dispositivo confiable
 */
export async function registerTrustedDevice({ email, deviceId, deviceInfo, ttlDays = DEFAULT_DEVICE_TTL_DAYS }) {
  const now = Date.now();
  const expiresAt = new Date(now + ttlDays * 24 * 60 * 60 * 1000);

  const deviceData = {
    deviceId,
    email,
    userAgent: deviceInfo.userAgent || 'unknown',
    ipAddress: deviceInfo.ipAddress || 'unknown',
    browser: deviceInfo.browser || 'unknown',
    os: deviceInfo.os || 'unknown',
    fingerprint: deviceInfo.fingerprint || '',
    trusted: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    usageCount: 1,
  };

  if (!firestoreHealthy) {
    memoryDevices.set(deviceId, { ...deviceData, createdAt: now, lastUsedAt: now });
    return { deviceId, expiresAt };
  }

  try {
    const ref = devicesCollection().doc(deviceId);
    await ref.set(deviceData, { merge: true });

    // Limitar dispositivos por usuario
    await cleanupOldDevices(email);

    return { deviceId, expiresAt };
  } catch (error) {
    firestoreHealthy = false;
    console.warn('[trustedDevices] Firestore error, falling back to memory:', error.message);
    memoryDevices.set(deviceId, { ...deviceData, createdAt: now, lastUsedAt: now });
    return { deviceId, expiresAt };
  }
}

/**
 * Verifica si un dispositivo es confiable
 */
export async function isTrustedDevice(deviceId, email) {
  if (!deviceId || !email) return false;

  if (!firestoreHealthy) {
    const device = memoryDevices.get(deviceId);
    if (!device) return false;
    if (device.email !== email) return false;
    if (device.expiresAt && device.expiresAt < Date.now()) {
      memoryDevices.delete(deviceId);
      return false;
    }
    return device.trusted === true;
  }

  try {
    const ref = devicesCollection().doc(deviceId);
    const snap = await ref.get();

    if (!snap.exists) return false;

    const data = snap.data();
    if (data.email !== email) return false;
    if (!data.trusted) return false;

    // Verificar expiración
    const expiresAtMs = data.expiresAt?.toMillis?.() || data.expiresAt?.getTime?.() || 0;
    if (expiresAtMs && expiresAtMs < Date.now()) {
      await ref.delete();
      return false;
    }

    // Actualizar último uso
    await ref.update({
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
      usageCount: admin.firestore.FieldValue.increment(1),
    });

    return true;
  } catch (error) {
    console.warn('[trustedDevices] Error checking trust:', error.message);
    return false;
  }
}

/**
 * Revoca un dispositivo confiable
 */
export async function revokeTrustedDevice(deviceId) {
  if (!firestoreHealthy) {
    memoryDevices.delete(deviceId);
    return true;
  }

  try {
    await devicesCollection().doc(deviceId).delete();
    return true;
  } catch (error) {
    console.warn('[trustedDevices] Error revoking device:', error.message);
    return false;
  }
}

/**
 * Lista dispositivos confiables de un usuario
 */
export async function listTrustedDevices(email) {
  if (!firestoreHealthy) {
    return Array.from(memoryDevices.values())
      .filter(d => d.email === email)
      .map(d => ({
        deviceId: d.deviceId,
        browser: d.browser,
        os: d.os,
        ipAddress: d.ipAddress,
        createdAt: new Date(d.createdAt),
        lastUsedAt: new Date(d.lastUsedAt),
        usageCount: d.usageCount || 1,
      }));
  }

  try {
    const snap = await devicesCollection()
      .where('email', '==', email)
      .where('trusted', '==', true)
      .orderBy('lastUsedAt', 'desc')
      .limit(MAX_DEVICES_PER_USER)
      .get();

    return snap.docs.map(doc => {
      const data = doc.data();
      return {
        deviceId: doc.id,
        browser: data.browser || 'Unknown',
        os: data.os || 'Unknown',
        ipAddress: data.ipAddress || 'Unknown',
        createdAt: data.createdAt?.toDate?.() || new Date(),
        lastUsedAt: data.lastUsedAt?.toDate?.() || new Date(),
        usageCount: data.usageCount || 1,
      };
    });
  } catch (error) {
    console.warn('[trustedDevices] Error listing devices:', error.message);
    return [];
  }
}

/**
 * Limpia dispositivos antiguos de un usuario (mantiene solo los MAX_DEVICES_PER_USER más recientes)
 */
async function cleanupOldDevices(email) {
  if (!firestoreHealthy) return;

  try {
    const snap = await devicesCollection()
      .where('email', '==', email)
      .orderBy('lastUsedAt', 'desc')
      .get();

    if (snap.size <= MAX_DEVICES_PER_USER) return;

    // Eliminar los dispositivos más antiguos
    const toDelete = snap.docs.slice(MAX_DEVICES_PER_USER);
    const batch = db.batch();
    for (const doc of toDelete) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  } catch (error) {
    console.warn('[trustedDevices] Error cleaning up old devices:', error.message);
  }
}

/**
 * Limpia dispositivos expirados (cronjob)
 */
export async function cleanupExpiredDevices() {
  if (!firestoreHealthy) {
    const now = Date.now();
    for (const [deviceId, device] of memoryDevices.entries()) {
      if (device.expiresAt && device.expiresAt < now) {
        memoryDevices.delete(deviceId);
      }
    }
    return;
  }

  try {
    const now = admin.firestore.Timestamp.now();
    const snap = await devicesCollection()
      .where('expiresAt', '<', now)
      .limit(100)
      .get();

    if (snap.empty) return;

    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    
    console.log(`[trustedDevices] Cleaned up ${snap.size} expired devices`);
  } catch (error) {
    console.warn('[trustedDevices] Error cleaning up expired devices:', error.message);
  }
}
