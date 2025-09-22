import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import logger from '../logger.js';
import { db } from '../db.js';
import admin from 'firebase-admin';
import { Buffer } from 'buffer';

// Asegura que variables estén disponibles
dotenv.config();

const router = express.Router();

function verifyMailgunSignature(signingKey, timestamp, token, signature) {
  try {
    if (!signingKey || !timestamp || !token || !signature) return false;

    // Protección contra replay (15 minutos)
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (!Number.isFinite(ts)) return false;
    const tooOld = Math.abs(now - ts) > 15 * 60;

    const hmac = crypto
      .createHmac('sha256', signingKey)
      .update(timestamp + token)
      .digest('hex');

    const sigValid = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
    if (!sigValid) return false;
    if (tooOld) {
      logger.warn('Webhook Mailgun: firma válida pero fuera de ventana (replay)');
      return false;
    }
    return true;
  } catch (e) {
    logger.error('Error verificando firma de Mailgun:', e);
    return false;
  }
}

// Mailgun envía application/json con {signature: {timestamp, token, signature}, event-data: {...}}
// También podría enviar form-urlencoded en algunos casos. Ya tenemos urlencoded/json habilitados en index.js
router.post('/', async (req, res) => {
  try {
    // Validar tipo de contenido permitido
    const ct = String(req.headers['content-type'] || '').toLowerCase();
    if (ct && !(ct.includes('application/json') || ct.includes('application/x-www-form-urlencoded'))) {
      return res.status(415).json({ success: false, message: 'Unsupported content type' });
    }

    // Límite de tamaño específico de webhook (aproximado sobre body ya parseado)
    const maxBytes = Number(process.env.WEBHOOK_MAX_BYTES || 262144); // 256KB por defecto
    let approxSize = 0;
    try {
      if (req.body) {
        approxSize = Buffer.byteLength(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      } else {
        approxSize = Number(req.headers['content-length'] || 0);
      }
    } catch {}
    if (Number.isFinite(maxBytes) && approxSize > maxBytes) {
      return res.status(413).json({ success: false, message: 'Payload too large' });
    }

    const signingKey = process.env.MAILGUN_SIGNING_KEY;

    // Intentar extraer firma de body JSON (event-data)
    const sig = req.body?.signature || {
      timestamp: req.body?.timestamp,
      token: req.body?.token,
      signature: req.body?.signature,
    };

    const timestamp = sig?.timestamp;
    const token = sig?.token;
    const signature = sig?.signature;

    const isVerified = signingKey
      ? verifyMailgunSignature(signingKey, timestamp, token, signature)
      : false;

    if (signingKey && !isVerified) {
      logger.warn('Webhook Mailgun: firma inválida', { timestamp, token });
      return res.status(403).json({ success: false, message: 'Invalid signature' });
    }

    // Normalizar evento
    const event = req.body['event-data'] || req.body;

    logger.info('Webhook Mailgun recibido', {
      verified: Boolean(isVerified || !signingKey),
      event: event?.event || event?.eventName || 'unknown',
      recipient: event?.recipient,
      messageId: event?.message?.headers?.['message-id'] || event?.MessageId,
    });

    // Persistencia de evento (auditoría)
    try {
      await db.collection('mailgunEvents').add({
        receivedAt: new Date().toISOString(),
        verified: Boolean(isVerified || !signingKey),
        event: event?.event || event?.eventName || 'unknown',
        recipient: event?.recipient || null,
        messageId: event?.message?.headers?.['message-id'] || event?.MessageId || null,
        raw: event || {},
      });
    } catch (e) { logger.warn('No se pudo persistir mailgunEvents', e?.message || e); }

    // Actualizar mails por Message-Id si aplica
    try {
      const hdrMid = (event?.message && (event.message['message-id'] || (event.message.headers && event.message.headers['message-id']))) || event?.MessageId || null;
      const normalize = (s) => String(s || '').trim().toLowerCase().replace(/^<|>$/g, '');
      const mid = normalize(hdrMid);
      if (mid) {
        const snap = await db.collection('mails').where('messageId', '==', mid).limit(5).get();
        const kind = String(event?.event || event?.eventName || '').toLowerCase();
        const ts = Number(event?.timestamp || Math.floor(Date.now()/1000));
        const dateIso = new Date(ts * 1000).toISOString();
        const updates = { lastEvent: kind, lastEventAt: dateIso };
        if (kind === 'delivered') updates.deliveredAt = dateIso;
        if (kind === 'opened' || kind === 'open') updates.openedAt = dateIso, updates.openCount = admin.firestore.FieldValue.increment(1);
        if (kind === 'clicked' || kind === 'click') updates.clickCount = admin.firestore.FieldValue.increment(1);
        if (kind === 'failed') {
          updates.failedAt = dateIso;
          updates.failedReason = (event['delivery-status'] && (event['delivery-status'].message || event['delivery-status'].description)) || event.reason || null;
        }
        for (const doc of snap.docs) {
          await db.collection('mails').doc(doc.id).set(updates, { merge: true });
          try {
            const ev = { at: dateIso, kind };
            await db.collection('mails').doc(doc.id).collection('events').add(ev);
          } catch {}
        }
      }
    } catch (linkErr) {
      logger.warn('No se pudo vincular evento a mail por Message-Id', linkErr?.message || linkErr);
    }

    // Agregación básica a emailMetrics
    try {
      const recipient = String(event?.recipient || '').toLowerCase();
      if (recipient) {
        let userSnap = await db.collection('users').where('myWed360Email', '==', recipient).limit(1).get();
        if (userSnap.empty) {
          const legacy = recipient.replace(/@mywed360\.com$/i, '@mywed360');
          userSnap = await db.collection('users').where('myWed360Email', '==', legacy).limit(1).get();
        }
        if (!userSnap.empty) {
          const uid = userSnap.docs[0].id;
          const ts = Number(event?.timestamp || Math.floor(Date.now()/1000));
          const date = new Date(ts * 1000);
          const dayKey = date.toISOString().slice(0,10);
          const kind = String(event?.event || event?.eventName || '').toLowerCase();
          const inc = admin.firestore.FieldValue.increment(1);
          const zero = admin.firestore.FieldValue.increment(0);
          const totals = {};
          if (kind === 'delivered') totals.totalDelivered = inc;
          else if (kind === 'opened' || kind === 'open') totals.totalOpened = inc;
          else if (kind === 'failed') totals.totalFailed = inc;
          else if (kind === 'accepted') totals.totalAccepted = inc;
          else if (kind === 'clicked' || kind === 'click') totals.totalClicked = inc;
          if (Object.keys(totals).length) {
            await db.collection('emailMetrics').doc(uid).set({ updatedAt: new Date().toISOString(), ...totals }, { merge: true });
            await db.collection('emailMetrics').doc(uid).collection('daily').doc(dayKey).set({
              date: dayKey,
              delivered: totals.totalDelivered || zero,
              opened: totals.totalOpened || zero,
              failed: totals.totalFailed || zero,
              accepted: totals.totalAccepted || zero,
              clicked: totals.totalClicked || zero,
            }, { merge: true });
          }
        }
      }
    } catch (e) {
      logger.warn('Aggregación Mailgun falló', e?.message || e);
    }

    // Aquí podrías persistir en BD si se requiere
    // await db.collection('mailgun_events').insertOne({ receivedAt: new Date(), verified: isVerified, event });

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('Error en webhook Mailgun:', err);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

export default router;

