import express from 'express';

import logger from '../logger.js';

import admin from 'firebase-admin';

import { requireAuth } from '../middleware/authMiddleware.js';

import { sendWhatsAppText, updateDeliveryStatusFromTwilio, providerStatus, handleIncomingMessage, ensureTestSession, toE164 } from '../services/whatsappService.js';

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

// Healthcheck simple del módulo de WhatsApp

// Devuelve siempre 200 con información básica de estado y fallback

router.get('/health', (req, res) => {

  try {

    const status = providerStatus();

    res.status(200).json({

      success: true,

      service: 'whatsapp',

      time: new Date().toISOString(),

      status,

    });

  } catch (e) {

    res.status(200).json({

      success: false,

      service: 'whatsapp',

      time: new Date().toISOString(),

      error: e?.message || 'unknown',

      status: { configured: false, provider: process.env.WHATSAPP_PROVIDER || 'unknown', fallback: 'deeplink' },

    });

  }

});

// ----- MODO TEST (sin número verificado) -----

// Crea/actualiza sesión de invitación para un teléfono y guest concretos

// POST /api/whatsapp/test/session  { phone, weddingId, guestId }

router.post('/test/session', requireAuth, async (req, res) => {

  try {

    const { z } = await import('zod');

    const parsed = z.object({

      phone: z.string().min(5),

      weddingId: z.string().min(1),

      guestId: z.string().min(1),

    }).safeParse(req.body || {});

    if (!parsed.success) {

      return res.status(400).json({ success: false, error: parsed.error.issues });

    }

    const { phone, weddingId, guestId } = parsed.data;

    const e164 = toE164(phone, process.env.DEFAULT_COUNTRY_CODE || '');

    if (!e164) return res.status(400).json({ success: false, error: 'phone inválido' });

    const ok = await ensureTestSession({ phoneE164: e164, weddingId, guestId, rsvpFlow: true });

    if (!ok) return res.status(500).json({ success: false, error: 'no se pudo crear sesión' });

    res.json({ success: true, phoneE164: e164 });

  } catch (e) {

    logger.error('[whatsapp] /test/session error:', e);

    res.status(500).json({ success: false, error: e.message || 'error' });

  }

});

// Simula un mensaje entrante desde WhatsApp sin pasar por Twilio

// POST /api/whatsapp/test/inbound  { phone, body }

router.post('/test/inbound', requireAuth, async (req, res) => {

  try {

    const { z } = await import('zod');

    const parsed = z.object({ phone: z.string().min(5), body: z.string().min(1) }).safeParse(req.body || {});

    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues });

    const { phone, body } = parsed.data;

    const e164 = toE164(phone, process.env.DEFAULT_COUNTRY_CODE || '');

    if (!e164) return res.status(400).json({ success: false, error: 'phone inválido' });

    const replies = [];

    const replyFn = async (toE164, message) => {

      replies.push({ toE164, body: message });

      try {

        await admin.firestore().collection('mensajeria_test_replies').add({

          to: toE164,

          body: message,

          created_at: admin.firestore.FieldValue.serverTimestamp(),

        });

        const sessId = (toE164 || '').replace(/^\+/, '');

        await admin.firestore().collection('whatsapp_sessions').doc(sessId).set({ lastTestReply: message, lastReplyAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

      } catch {}

    };

    const payload = { From: `whatsapp:${e164}`, Body: String(body || '') }; // forma Twilio-like

    await handleIncomingMessage(payload, { replyFn });

    res.json({ success: true, replies });

  } catch (e) {

    logger.error('[whatsapp] /test/inbound error:', e);

    res.status(500).json({ success: false, error: e.message || 'error' });

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

    const { z } = await import('zod');

    const parsed = z.object({

      to: z.string().min(5),

      message: z.string().min(1),

      weddingId: z.string().optional(),

      guestId: z.string().optional(),

      templateId: z.string().optional(),

      scheduleAt: z.string().optional(),

      metadata: z.record(z.any()).optional(),

    }).safeParse(req.body || {});

    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues });

    const { to, message, weddingId, guestId, templateId, scheduleAt, metadata } = parsed.data;

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

// Envío masivo directo (procesa inmediatamente cada mensaje)

router.post('/send-batch', requireAuth, async (req, res) => {

  try {

    const { z } = await import('zod');

    const schema = z.object({

      weddingId: z.string().min(1).optional(),

      defaultMetadata: z.record(z.any()).optional(),

      items: z

        .array(

          z.object({

            to: z.string().min(5),

            message: z.string().min(1),

            weddingId: z.string().optional(),

            guestId: z.string().optional(),

            templateId: z.string().optional(),

            metadata: z.record(z.any()).optional(),

          })

        )

        .min(1),

    });

    const parsed = schema.safeParse(req.body || {});

    if (!parsed.success) {

      return res.status(400).json({ success: false, error: parsed.error.issues });

    }

    const { weddingId: fallbackWeddingId, defaultMetadata, items } = parsed.data;

    const results = [];

    let ok = 0;

    let fail = 0;

    for (const item of items) {

      try {

        const toNormalized = toE164(item.to, process.env.DEFAULT_COUNTRY_CODE || '');

        if (!toNormalized) {

          fail += 1;

          results.push({ success: false, to: item.to, error: 'invalid-phone' });

          continue;

        }

        const response = await sendWhatsAppText({

          to: toNormalized,

          message: item.message,

          weddingId: item.weddingId || fallbackWeddingId || null,

          guestId: item.guestId || null,

          templateId: item.templateId || null,

          metadata: { ...(defaultMetadata || {}), ...(item.metadata || {}) },

        });

        if (response?.success) {

          ok += 1;

          results.push({ success: true, to: toNormalized, guestId: item.guestId || null, sid: response.sid || null });

        } else {

          fail += 1;

          results.push({ success: false, to: toNormalized, guestId: item.guestId || null, error: response?.error || 'send-failed' });

        }

        await new Promise((resolve) => setTimeout(resolve, 150));

      } catch (err) {

        fail += 1;

        results.push({ success: false, to: item.to, guestId: item.guestId || null, error: err?.message || 'exception' });

      }

    }

    return res.json({ success: fail === 0, ok, fail, count: items.length, results });

  } catch (e) {

    logger.error('[whatsapp] Error en /send-batch:', e);

    res.status(500).json({ success: false, error: e.message || 'error' });

  }

});

// Crear lote de mensajes (no envía todavía)  

// POST /api/whatsapp/batch  { weddingId, guestIds:[], messageTemplate }

// Crear lote de mensajes (no env?a todav?a)  

// POST /api/whatsapp/batch  { weddingId, guestIds:[], messageTemplate }

router.post('/batch', requireAuth, async (req, res) => {

  try {

    const { z } = await import('zod');

    const parsed = z.object({

      weddingId: z.string().min(1),

      guestIds: z.array(z.string().min(1)).min(1),

      messageTemplate: z.string().optional(),

    }).safeParse(req.body || {});

    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues });

    const { weddingId, guestIds, messageTemplate = '' } = parsed.data;

    const defaultCountry = process.env.DEFAULT_COUNTRY_CODE || '+34';

    const guestsCollection = admin
      .firestore()
      .collection('weddings')
      .doc(weddingId)
      .collection('guests');

    const batchId = `wh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const results = [];
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const guestId of guestIds) {
      const entry = { guestId };

      const snapshot = await guestsCollection.doc(guestId).get();
      if (!snapshot.exists) {
        entry.skipped = true;
        entry.error = 'guest-not-found';
        skippedCount += 1;
        results.push(entry);
        continue;
      }

      const guest = snapshot.data() || {};
      const phone = toE164(guest.phone || '', defaultCountry);
      if (!phone) {
        entry.skipped = true;
        entry.error = 'invalid-phone';
        skippedCount += 1;
        results.push(entry);
        continue;
      }

      const guestName = guest.name || '';
      const renderedMessage = (messageTemplate || '').replace('{guestName}', guestName).trim();
      if (!renderedMessage) {
        entry.skipped = true;
        entry.error = 'empty-message';
        skippedCount += 1;
        results.push(entry);
        continue;
      }

      entry.phone = phone;
      entry.message = renderedMessage;

      let sendResult;
      try {
        sendResult = await sendWhatsAppText({
          to: phone,
          message: renderedMessage,
          weddingId,
          guestId,
          metadata: {
            origin: 'api.batch',
            batchId,
            guestName,
          },
        });
      } catch (sendError) {
        sendResult = { success: false, error: sendError?.message || 'send-error' };
      }

      entry.success = Boolean(sendResult?.success);
      entry.sid = sendResult?.sid || null;
      entry.providerStatus = sendResult?.status || null;
      entry.error = entry.success ? null : (sendResult?.error || entry.error || 'unknown-error');

      if (entry.success) {
        successCount += 1;
      } else if (entry.skipped) {
        // already counted
      } else {
        failCount += 1;
      }

      if (!entry.skipped) {
        const deliveryStatus = entry.success ? 'whatsapp_sent' : 'whatsapp_failed';
        try {
          await guestsCollection.doc(guestId).set(
            {
              deliveryChannel: 'whatsapp',
              deliveryStatus,
              whatsappLastMessage: {
                batchId,
                message: renderedMessage,
                sid: entry.sid,
                status: entry.providerStatus || (entry.success ? 'queued' : 'failed'),
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        } catch (updateError) {
          logger.warn('[whatsapp] No se pudo actualizar el invitado tras enviar WhatsApp', {
            guestId,
            error: updateError?.message,
          });
        }
      }

      results.push(entry);
    }

    if (results.length === 0) {
      return res.status(400).json({ success: false, error: 'No se pudo preparar ningún mensaje' });
    }

    try {
      await admin
        .firestore()
        .collection('whatsapp_batches')
        .doc(batchId)
        .set({
          weddingId,
          createdBy: req.user?.uid || 'unknown',
          total: results.length,
          success: successCount,
          fail: failCount,
          skipped: skippedCount,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (persistError) {
      logger.warn('[whatsapp] No se pudo registrar el batch en Firestore', persistError?.message);
    }

    return res.json({
      success: true,
      batchId,
      summary: {
        total: results.length,
        success: successCount,
        fail: failCount,
        skipped: skippedCount,
      },
      items: results,
    });

  } catch (e) {

    logger.error('[whatsapp] /batch error:', e);

    res.status(500).json({ success: false, error: e.message || 'error' });

  }

});

// Programación de envíos (en cola) — no envía inmediatamente

router.post('/schedule', requireAuth, async (req, res) => {

  try {

    const { z } = await import('zod');

    const parsed = z.object({

      items: z.array(z.object({

        to: z.string().min(5).optional(),

        message: z.string().min(1),

        weddingId: z.string().optional(),

        guestId: z.string().optional(),

        templateId: z.string().optional(),

        metadata: z.record(z.any()).optional(),

      })).min(1),

      scheduledAt: z.union([z.string(), z.date()]),

    }).safeParse(req.body || {});

    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues });

    const { items = [], scheduledAt } = parsed.data;

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

    // Verificación de firma Twilio (si está configurado TWILIO_AUTH_TOKEN)

    try {
      const authToken = process.env.TWILIO_AUTH_TOKEN || '';
      const enforce = String(process.env.TWILIO_SIGNATURE_CHECK || 'true').toLowerCase();
      const shouldVerify = !!authToken && (enforce === 'true' || enforce === '1' || enforce === 'yes');
      if (shouldVerify) {
        const signature = req.get('X-Twilio-Signature') || req.get('x-twilio-signature') || '';
        const absUrl = process.env.WHATSAPP_STATUS_CALLBACK_URL || `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const twModule = await import('twilio');
        const tw = twModule.default || twModule;
        const ok = tw.validateRequest(authToken, signature, absUrl, req.body || {});
        if (!ok) {
          logger.warn('[whatsapp] webhook/twilio: firma inválida', { absUrl });
          return res.status(403).send('Invalid signature');
        }
      }
    } catch (sigErr) {
      logger.warn('[whatsapp] Error verificando firma Twilio:', sigErr?.message || sigErr);
    }

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

