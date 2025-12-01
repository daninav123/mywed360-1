import admin from 'firebase-admin';
import logger from '../utils/logger.js';

if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    logger.warn(
      '[licenseMaintenance] Firebase Admin ya inicializado o no disponible',
      error?.message
    );
  }
}

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ALERT_MILESTONES = [30, 7, 1];

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof admin.firestore.Timestamp) return value.toDate();
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return null;
    return new Date(parsed);
  }
  return null;
};

const diffInDays = (futureDate, from = new Date()) => {
  const target = toDate(futureDate);
  if (!target) return null;
  return Math.ceil((target.getTime() - from.getTime()) / ONE_DAY_MS);
};

const queueNotification = async (docId, payload) => {
  try {
    const queueId = `${docId}_${payload.kind}_${payload.key || 'default'}`;
    await db
      .collection('notificationsQueue')
      .doc(queueId)
      .set(
        {
          ...payload,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  } catch (error) {
    logger.warn('[licenseMaintenance] No se pudo registrar notificación', error?.message);
  }
};

const processWeddingLicenses = async () => {
  const now = new Date();
  const snapshot = await db.collection('weddingLicenses').limit(500).get();
  if (snapshot.empty) return;

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const validUntil = toDate(data.validUntil);
    const status = String(data.status || 'active').toLowerCase();
    const alertsSent = Array.isArray(data.alertsSent) ? data.alertsSent.map(String) : [];

    const updates = {};
    const licenseId = doc.id;

    if (validUntil && validUntil.getTime() <= now.getTime() && status !== 'read_only') {
      updates.status = 'read_only';
      updates.expiredAt = FieldValue.serverTimestamp();
    }

    if (validUntil) {
      const remaining = diffInDays(validUntil, now);
      ALERT_MILESTONES.forEach((days) => {
        if (remaining !== null && remaining === days && !alertsSent.includes(String(days))) {
          updates.alertsSent = FieldValue.arrayUnion(String(days));
          queueNotification(licenseId, {
            kind: 'wedding_license_alert',
            key: `d${days}`,
            daysRemaining: days,
            weddingId: data.weddingId || licenseId,
            planKey: data.planKey || null,
            createdAt: FieldValue.serverTimestamp(),
            target: data.ownerUid || null,
          });
        }
      });
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = FieldValue.serverTimestamp();
      try {
        await doc.ref.set(updates, { merge: true });
      } catch (error) {
        logger.error('[licenseMaintenance] No se pudo actualizar weddingLicense', licenseId, error);
      }
    }
  }
};

const processPlannerPacks = async () => {
  const now = new Date();
  const snapshot = await db.collection('plannerPacks').limit(500).get();
  if (snapshot.empty) return;

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const status = String(data.status || 'active').toLowerCase();
    const trialEndsAt = toDate(data.trialEndsAt);
    const periodEnd = toDate(data.currentPeriodEnd);
    const quotaTotal = typeof data.quotaTotal === 'number' ? data.quotaTotal : null;
    const quotaUsed = typeof data.quotaUsed === 'number' ? data.quotaUsed : 0;
    const alertsSent = Array.isArray(data.alertsSent) ? data.alertsSent.map(String) : [];

    const updates = {};
    const packId = doc.id;

    if (status === 'trial' && trialEndsAt && trialEndsAt.getTime() <= now.getTime()) {
      updates.status = 'active';
      updates.trialEndedAt = FieldValue.serverTimestamp();
    }

    if (quotaTotal !== null && quotaUsed >= quotaTotal && status !== 'quota_exhausted') {
      updates.status = 'quota_exhausted';
    }

    if (periodEnd) {
      const remaining = diffInDays(periodEnd, now);
      ALERT_MILESTONES.forEach((days) => {
        if (remaining !== null && remaining === days && !alertsSent.includes(`renew_${days}`)) {
          updates.alertsSent = FieldValue.arrayUnion(`renew_${days}`);
          queueNotification(packId, {
            kind: 'planner_pack_alert',
            key: `renew_${days}`,
            daysRemaining: days,
            plannerId: data.plannerId || null,
            packKey: data.packKey || null,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      });

      if (remaining !== null && remaining < 0 && status === 'active') {
        updates.status = 'past_due';
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = FieldValue.serverTimestamp();
      try {
        await doc.ref.set(updates, { merge: true });
      } catch (error) {
        logger.error('[licenseMaintenance] No se pudo actualizar plannerPack', packId, error);
      }
    }
  }
};

let running = false;
const runMaintenanceCycle = async () => {
  if (running) return;
  running = true;
  try {
    await processWeddingLicenses();
    await processPlannerPacks();
  } catch (error) {
    logger.error('[licenseMaintenance] Error en ciclo de mantenimiento', error);
  } finally {
    running = false;
  }
};

export const runLicenseMaintenanceOnce = async () => {
  await runMaintenanceCycle();
};

let started = false;
export const startLicenseMaintenanceWorker = () => {
  if (started) return;
  if (String(process.env.DISABLE_LICENSE_MAINTENANCE || '').toLowerCase() === 'true') {
    logger.info('[licenseMaintenance] Worker deshabilitado por configuración');
    return;
  }
  if (String(process.env.NODE_ENV || '').toLowerCase() === 'test') return;
  started = true;

  const intervalMs = Number(process.env.LICENSE_WORKER_INTERVAL_MS || 6 * 60 * 60 * 1000);
  const initialDelay = Number(process.env.LICENSE_WORKER_INITIAL_DELAY_MS || 15000);

  setTimeout(() => {
    runMaintenanceCycle();
  }, initialDelay);

  setInterval(() => {
    runMaintenanceCycle();
  }, intervalMs);

  logger.info(`[licenseMaintenance] Worker iniciado. Intervalo: ${intervalMs} ms`);
};

export default {
  startLicenseMaintenanceWorker,
  runLicenseMaintenanceOnce,
};
