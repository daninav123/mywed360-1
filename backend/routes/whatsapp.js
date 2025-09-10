import express from 'express';
import logger from '../logger.js';
import admin from 'firebase-admin';
import { requireAuth } from '../middleware/authMiddleware.js';
import { sendWhatsAppText, updateDeliveryStatusFromTwilio, providerStatus, handleIncomingMessage } from '../services/whatsappService.js';

const router = express.Router();

// Estado de proveedor
router.get('/provider-status', (req, res) => {
  try {
    const status = providerStatus();
    res.json({ success: true, ...status });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Métricas agregadas de WhatsApp por boda y rango de fechas
// GET /api/whatsapp/metrics?weddingId=...&from=ISO&to=ISO&groupBy=day
router.get('/metrics', requireAuth, async (req, res) => {
  try {
    const weddingId = req.query.weddingId || null;
    const fromIso = req.query.from || null;
    const toIso = req.query.to || null;
    const groupBy = (req.query.groupBy || 'day').toLowerCase();

    const toDate = (iso) => {
      try { if (!iso) return null; const d = new Date(iso); if (isNaN(d.getTime())) return null; return d; } catch { return null; }
    };
    const createdFromDate = toDate(fromIso);
    const createdToDate = toDate(toIso);

    // Evitar índices compuestos aplicando solo filtros básicos en Firestore
    let q = admin.firestore().collection('mensajeria_log').where('canal', '==', 'whatsapp');
    if (weddingId) q = q.where('weddingId', '==', weddingId);

    const snap = await q.limit(2000).get();

    const byStatus = {
      scheduled: 0, processing: 0, queued: 0, sent: 0, delivered: 0, read: 0,
      failed: 0, undelivered: 0, error: 0, other: 0,
    };
    const errors = {};
    const seriesByDay = {};
    let total = 0;

    const getDayKey = (data) => {
      const ts = data.created_at || data.scheduled_at || data.sent_at || data.updated_at || null;
      const d = ts && ts.toDate ? ts.toDate() : null;
      if (!d) return 'unknown';
      return d.toISOString().slice(0, 10);
    };

    snap.forEach((doc) => {
      const data = doc.data() || {};
      // Filtrado por rango temporal en memoria para evitar índice compuesto
      const createdAt = data.created_at && data.created_at.toDate ? data.created_at.toDate() : null;
      if (createdFromDate && createdAt && createdAt < createdFromDate) return;
      if (createdToDate && createdAt && createdAt > createdToDate) return;
      total += 1;
      const st = (data.estado || 'other').toLowerCase();
      if (byStatus[st] !== undefined) byStatus[st] += 1; else byStatus.other += 1;
      if (data.error_code) errors[data.error_code] = (errors[data.error_code] || 0) + 1;
      const day = getDayKey(data);
      if (!seriesByDay[day]) seriesByDay[day] = { total: 0, scheduled: 0, queued: 0, sent: 0, delivered: 0, read: 0, failed: 0, undelivered: 0, error: 0 };
      seriesByDay[day].total += 1;
      if (seriesByDay[day][st] !== undefined) seriesByDay[day][st] += 1;
    });

    const totalAttempted = total - byStatus.scheduled - byStatus.processing; // intentados (cola/emitidos)
    const deliveredBase = byStatus.delivered;
    const readBase = byStatus.read;
    const deliveryRate = totalAttempted > 0 ? deliveredBase / totalAttempted : 0;
    const readRate = totalAttempted > 0 ? readBase / totalAttempted : 0;

    // Series ordenada
    const series = Object.keys(seriesByDay)
      .sort()
      .map((k) => ({ day: k, ...seriesByDay[k] }));

    return res.json({
      success: true,
      timeRange: { from: fromIso || null, to: toIso || null },
      total,
      byStatus,
      rates: {
        deliveryRate,
        readRate,
      },
      series,
      errors,
    });
  } catch (e) {
    logger.error('[whatsapp] metrics error:', e);
    res.status(500).json({ success: false, error: e.message || 'error' });
  }
});

// Cron: procesa mensajes programados (requiere token)
router.post('/cron-run', async (req, res) => {
  try {
    const provided = req.headers['x-cron-token'] || req.query.token;
    const expected = process.env.WHATSAPP_CRON_TOKEN || '';
    if (!expected || provided !== expected) {
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    const now = admin.firestore.Timestamp.now();
    const col = admin.firestore().collection('mensajeria_log');
    const snap = await col
      .where('canal', '==', 'whatsapp')
      .where('estado', '==', 'scheduled')
      .where('scheduled_at', '<=', now)
      .orderBy('scheduled_at', 'asc')
      .limit(25)
      .get();

    let processed = 0, queued = 0, failed = 0;
    for (const doc of snap.docs) {
      const ref = doc.ref;
      // Lock via transaction
      const ok = await admin.firestore().runTransaction(async (tx) => {
        const current = await tx.get(ref);
        if (!current.exists) return false;
        const data = current.data();
        if (data.estado !== 'scheduled') return false;
        if (!data.to || !data.message) {
          tx.update(ref, { estado: 'error', error_code: 'invalid-payload', updated_at: admin.firestore.FieldValue.serverTimestamp() });
          return false;
        }
        tx.update(ref, { estado: 'processing', locked_at: admin.firestore.FieldValue.serverTimestamp(), updated_at: admin.firestore.FieldValue.serverTimestamp() });
        return true;
      });
      if (!ok) continue;

      processed++;
      try {
        const data = (await ref.get()).data();
        const result = await sendWhatsAppText({ to: data.to, message: data.message, weddingId: data.weddingId, guestId: data.invitado_id, templateId: data.plantilla_id, metadata: data.metadata || {} });
        if (result?.success) {
          queued++;
          await ref.set({ estado: 'queued', triggered_sid: result.sid || null, updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        } else {
          failed++;
          await ref.set({ estado: 'error', error_code: result?.error || 'send-failed', updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        }
        // backoff suave
        await new Promise(r => setTimeout(r, 250));
      } catch (e) {
        failed++;
        await ref.set({ estado: 'error', error_code: e.message || 'exception', updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
    }

    return res.json({ success: true, processed, queued, failed });
  } catch (e) {
    logger.error('[whatsapp] cron-run error:', e);
    res.status(500).json({ success: false, error: e.message || 'error' });
  }
});

// Envío de mensaje WhatsApp via API (número de la app)
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { to, message, weddingId, guestId, templateId, scheduleAt, metadata } = req.body || {};
    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'Parámetros requeridos: to, message' });
    }

    const result = await sendWhatsAppText({ to, message, weddingId, guestId, templateId, scheduleAt, metadata });
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (e) {
    logger.error('[whatsapp] Error en /send:', e);
    res.status(500).json({ success: false, error: e.message || 'error' });
  }
});

// Crear lote de mensajes (no envía todavía)  
// POST /api/whatsapp/batch  { weddingId, guestIds:[], messageTemplate }
router.post('/batch', requireAuth, async (req, res) => {
  try {
    const { weddingId, guestIds = [], messageTemplate = '' } = req.body || {};
    if (!weddingId || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({ success: false, error: 'weddingId y guestIds requeridos' });
    }

    // Helper simple → E.164 (solo España por demo)
    const toE164 = (num = '') => {
      try {
        let n = String(num).replace(/[^0-9]/g, '');
        if (n.startsWith('34')) n = n; // ya incluye país
        else if (n.length === 9) n = '34' + n;
        return '+' + n;
      } catch { return null; }
    };

    // Fetch guests en lote
    const col = admin.firestore().collection('weddings').doc(weddingId).collection('guests');
    const items = [];
    for (const gid of guestIds) {
      const snap = await col.doc(gid).get();
      if (!snap.exists) continue;
      const g = snap.data() || {};
      const phone = toE164(g.phone || '');
      if (!phone) continue;
      const msg = (messageTemplate || '').replace('{guestName}', g.name || '');
      items.push({ guestId: gid, phone, message: msg });
    }

    if (!items.length) return res.status(400).json({ success: false, error: 'No hay teléfonos válidos' });

    const batchId = 'wh-' + Date.now();
    // Opcional: guardar colección batch resumen
    await admin.firestore().collection('whatsapp_batches').doc(batchId).set({
      weddingId,
      createdBy: req.user?.uid || 'unknown',
      count: items.length,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ success: true, batchId, items });
  } catch (e) {
    logger.error('[whatsapp] /batch error:', e);
    res.status(500).json({ success: false, error: e.message || 'error' });
  }
});

// Programación de envíos (en cola) — no envía inmediatamente
router.post('/schedule', requireAuth, async (req, res) => {
  try {
    const { items = [], scheduledAt } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items requerido (array)' });
    }
    if (!scheduledAt) {
      return res.status(400).json({ success: false, error: 'scheduledAt requerido' });
    }

    const batch = admin.firestore().batch();
    const scheduledTs = new Date(scheduledAt);
    const col = admin.firestore().collection('mensajeria_log');
    for (const it of items) {
      const ref = col.doc();
      batch.set(ref, {
        canal: 'whatsapp',
        modo: 'api',
        estado: 'scheduled',
        proveedor: 'twilio',
        weddingId: it.weddingId || null,
        invitado_id: it.guestId || null,
        plantilla_id: it.templateId || null,
        message: it.message || '',
        mensaje_preview: (it.message || '').slice(0, 500),
        scheduled_at: admin.firestore.Timestamp.fromDate(scheduledTs),
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        to: it.to || null,
        metadata: it.metadata || {},
      }, { merge: true });
    }
    await batch.commit();
    res.json({ success: true, count: items.length });
  } catch (e) {
    logger.error('[whatsapp] Error en /schedule:', e);
    res.status(500).json({ success: false, error: e.message || 'error' });
  }
});

// Webhook de estados Twilio (statusCallback)
// Twilio envía application/x-www-form-urlencoded por defecto; index.js ya tiene express.urlencoded
router.post('/webhook/twilio', async (req, res) => {
  try {
    const payload = req.body || {};
    logger.info(`[whatsapp] webhook/twilio: ${JSON.stringify(payload)}`);
    // Procesar en paralelo sin bloquear la respuesta a Twilio
    try { updateDeliveryStatusFromTwilio(payload).catch(() => {}); } catch {}
    try {
      const hasBody = typeof payload.Body === 'string' || typeof payload.body === 'string';
      if (hasBody) {
        handleIncomingMessage(payload).catch(() => {});
      }
    } catch {}
    res.status(200).send('OK');
  } catch (e) {
    logger.error('[whatsapp] Error en webhook Twilio:', e);
    res.status(200).send('OK'); // Responder 200 para evitar reintentos agresivos del proveedor
  }
});

export default router;
