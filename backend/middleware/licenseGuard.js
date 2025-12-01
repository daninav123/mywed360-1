import admin from 'firebase-admin';
import logger from '../utils/logger.js';

if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    logger.warn('[licenseGuard] Firebase Admin ya inicializado o no disponible', error?.message);
  }
}

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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

const isExpired = (value, graceMs = 0) => {
  const date = toDate(value);
  if (!date) return false;
  return date.getTime() + graceMs < Date.now();
};

const getWeddingIdFromRequest = (req, paramHint) => {
  const hints = [paramHint, 'weddingId', 'wId', 'id'].filter(Boolean);

  for (const key of hints) {
    if (req.params?.[key]) return String(req.params[key]);
    if (req.body?.[key]) return String(req.body[key]);
    if (req.query?.[key]) return String(req.query[key]);
  }

  if (req.body?.wedding?.id) return String(req.body.wedding.id);
  return null;
};

const fetchWeddingLicense = async (weddingId) => {
  if (!weddingId) return null;
  try {
    const snap = await db.collection('weddingLicenses').doc(String(weddingId)).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    logger.error('[licenseGuard] Error consultando weddingLicenses', error);
    return null;
  }
};

const fetchPlannerPack = async (plannerId) => {
  if (!plannerId) return null;
  try {
    const snap = await db
      .collection('plannerPacks')
      .where('plannerId', '==', String(plannerId))
      .limit(10)
      .get();
    if (snap.empty) return null;
    const packs = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aDate = toDate(a.updatedAt) || toDate(a.createdAt) || new Date(0);
        const bDate = toDate(b.updatedAt) || toDate(b.createdAt) || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
    return packs[0] || null;
  } catch (error) {
    logger.error('[licenseGuard] Error consultando plannerPacks', error);
    return null;
  }
};

export const requireActiveWeddingLicense = (options = {}) => {
  const {
    allowMissing = true,
    allowReadOnly = false,
    weddingParam = 'weddingId',
    attach = true,
  } = options;

  return async (req, res, next) => {
    try {
      if (req.userProfile?.role === 'admin') return next();

      const weddingId = getWeddingIdFromRequest(req, weddingParam);
      if (!weddingId) {
        if (allowMissing) return next();
        return res.status(400).json({
          success: false,
          error: {
            code: 'wedding-id-missing',
            message: 'No se pudo determinar la boda solicitada.',
          },
        });
      }

      const license = await fetchWeddingLicense(weddingId);
      if (!license) {
        if (allowMissing) return next();
        return res.status(403).json({
          success: false,
          error: {
            code: 'wedding-license-required',
            message: 'La boda requiere una licencia activa.',
          },
        });
      }

      const validUntil = toDate(license.validUntil);
      const expired = validUntil ? validUntil.getTime() < Date.now() : false;
      const licenseStatus = String(license.status || '').toLowerCase();

      if (expired && licenseStatus !== 'read_only') {
        try {
          await db.collection('weddingLicenses').doc(license.id).set(
            {
              status: 'read_only',
              expiredAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          license.status = 'read_only';
        } catch (error) {
          logger.warn('[licenseGuard] No se pudo marcar licencia como read_only', error?.message);
        }
      }

      if (license.status === 'read_only' && !allowReadOnly) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'wedding-license-read-only',
            message: 'La licencia de la boda expiró. Solo lectura.',
          },
        });
      }

      if (
        license.status &&
        !['active', 'trial', 'read_only'].includes(String(license.status).toLowerCase())
      ) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'wedding-license-invalid',
            message: 'La licencia de la boda no está activa.',
          },
        });
      }

      if (attach) {
        req.weddingLicense = license;
      }
      return next();
    } catch (error) {
      logger.error('[licenseGuard] Error validando licencia de boda', error);
      return res.status(500).json({
        success: false,
        error: { code: 'license-validation-error', message: 'No se pudo validar la licencia.' },
      });
    }
  };
};

export const requirePlannerPackAccess = (options = {}) => {
  const {
    allowTrial = true,
    allowMissing = false,
    requireQuota = false,
    plannerParam = 'plannerId',
    attach = true,
  } = options;

  return async (req, res, next) => {
    try {
      if (req.userProfile?.role === 'admin') return next();

      const plannerId =
        (plannerParam &&
          (req.params?.[plannerParam] || req.body?.[plannerParam] || req.query?.[plannerParam])) ||
        req.user?.uid ||
        null;

      if (!plannerId) {
        if (allowMissing) return next();
        return res.status(400).json({
          success: false,
          error: {
            code: 'planner-id-missing',
            message: 'No se pudo determinar el planner solicitado.',
          },
        });
      }

      const pack = await fetchPlannerPack(plannerId);
      if (!pack) {
        if (allowMissing) return next();
        return res.status(403).json({
          success: false,
          error: {
            code: 'planner-pack-required',
            message: 'Se requiere un paquete de planner activo.',
          },
        });
      }

      const status = String(pack.status || '').toLowerCase();
      if (status === 'trial' && !allowTrial) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'planner-pack-trial',
            message: 'El período de prueba no permite esta acción.',
          },
        });
      }

      if (['canceled', 'past_due', 'read_only', 'quota_exhausted'].includes(status)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'planner-pack-inactive',
            message: 'Tu paquete de planner no está activo.',
          },
        });
      }

      if (
        requireQuota &&
        typeof pack.quotaTotal === 'number' &&
        typeof pack.quotaUsed === 'number'
      ) {
        if (pack.quotaUsed >= pack.quotaTotal) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'planner-pack-quota-exhausted',
              message: 'Has alcanzado el límite de bodas activas de tu paquete.',
            },
          });
        }
      }

      if (attach) req.plannerPack = pack;
      return next();
    } catch (error) {
      logger.error('[licenseGuard] Error validando pack de planner', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'planner-pack-validation-error',
          message: 'No se pudo validar el paquete del planner.',
        },
      });
    }
  };
};

export default {
  requireActiveWeddingLicense,
  requirePlannerPackAccess,
};
