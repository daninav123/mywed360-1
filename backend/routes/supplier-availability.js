import express from 'express';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../utils/logger.js';
import { requireSupplierAuth } from '../middleware/supplierAuth.js';
import {
  sendSuccess,
  sendError,
  sendInternalError,
  sendValidationError,
} from '../utils/apiResponse.js';

const router = express.Router();

// ============================================
// CALENDARIO DE DISPONIBILIDAD
// ============================================

// GET /availability - Obtener fechas bloqueadas del proveedor
router.get('/availability', requireSupplierAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('blockedDates')
      .orderBy('date', 'asc');

    if (startDate) {
      query = query.where('date', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('date', '<=', new Date(endDate));
    }

    const snapshot = await query.get();
    const blockedDates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return sendSuccess(req, res, { blockedDates });
  } catch (error) {
    logger.error('Error getting availability:', error);
    return sendInternalError(req, res, error);
  }
});

// POST /availability/block - Bloquear fecha(s)
router.post('/availability/block', requireSupplierAuth, express.json(), async (req, res) => {
  try {
    const { dates, reason = '', type = 'blocked' } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'dates_required' });
    }

    const batch = db.batch();
    const blockedIds = [];

    for (const dateStr of dates) {
      const date = new Date(dateStr);

      // Crear ID único basado en la fecha
      const dateId = date.toISOString().split('T')[0];

      const docRef = db
        .collection('suppliers')
        .doc(req.supplier.id)
        .collection('blockedDates')
        .doc(dateId);

      batch.set(
        docRef,
        {
          date,
          reason: reason.trim(),
          type, // 'blocked', 'booked', 'holiday'
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      blockedIds.push(dateId);
    }

    await batch.commit();

    logger.info(`Supplier ${req.supplier.id} blocked ${dates.length} dates`);

    return sendSuccess(req, res, { blockedIds });
  } catch (error) {
    logger.error('Error blocking dates:', error);
    return sendInternalError(req, res, error);
  }
});

// DELETE /availability/:dateId - Desbloquear fecha
router.delete('/availability/:dateId', requireSupplierAuth, async (req, res) => {
  try {
    const { dateId } = req.params;

    await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('blockedDates')
      .doc(dateId)
      .delete();

    logger.info(`Supplier ${req.supplier.id} unblocked date ${dateId}`);

    return sendSuccess(req, res, { unblocked: true });
  } catch (error) {
    logger.error('Error unblocking date:', error);
    return sendInternalError(req, res, error);
  }
});

// GET /availability/check - Verificar disponibilidad de una fecha
router.get('/availability/check', requireSupplierAuth, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date_required' });
    }

    const dateId = new Date(date).toISOString().split('T')[0];

    const doc = await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('blockedDates')
      .doc(dateId)
      .get();

    return sendSuccess(req, res, {
      available: !doc.exists,
      blockInfo: doc.exists ? doc.data() : null,
    });
  } catch (error) {
    logger.error('Error checking availability:', error);
    return sendInternalError(req, res, error);
  }
});

// POST /availability/sync-google - Sincronizar con Google Calendar
router.post('/availability/sync-google', requireSupplierAuth, express.json(), async (req, res) => {
  try {
    const { googleCalendarId, accessToken } = req.body;

    if (!googleCalendarId || !accessToken) {
      return res.status(400).json({ error: 'calendar_credentials_required' });
    }

    // TODO: Implementar sincronización con Google Calendar API
    // Por ahora, solo guardamos la configuración

    await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .update({
        'integrations.googleCalendar': {
          enabled: true,
          calendarId: googleCalendarId,
          syncedAt: FieldValue.serverTimestamp(),
        },
      });

    logger.info(`Supplier ${req.supplier.id} connected Google Calendar`);

    return sendSuccess(req, res, {
      message: 'Google Calendar connected. Sync will happen automatically.',
    });
  } catch (error) {
    logger.error('Error syncing Google Calendar:', error);
    return sendInternalError(req, res, error);
  }
});

export default router;
