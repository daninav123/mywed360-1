import express from 'express';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../logger.js';
import { requireSupplierAuth } from './supplier-dashboard.js';

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

    return res.json({ success: true, blockedDates });
  } catch (error) {
    logger.error('Error getting availability:', error);
    return res.status(500).json({ error: 'internal_error' });
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

    return res.json({ success: true, blockedIds });
  } catch (error) {
    logger.error('Error blocking dates:', error);
    return res.status(500).json({ error: 'internal_error' });
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

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error unblocking date:', error);
    return res.status(500).json({ error: 'internal_error' });
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

    return res.json({
      success: true,
      available: !doc.exists,
      blockInfo: doc.exists ? doc.data() : null,
    });
  } catch (error) {
    logger.error('Error checking availability:', error);
    return res.status(500).json({ error: 'internal_error' });
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

    return res.json({
      success: true,
      message: 'Google Calendar connected. Sync will happen automatically.',
    });
  } catch (error) {
    logger.error('Error syncing Google Calendar:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
