import express from 'express';
import logger from '../logger.js';
import admin from 'firebase-admin';
import { seenOrMark } from '../utils/idempotency.js';

const router = express.Router();

if (!admin.apps.length) {
  try { admin.initializeApp({ credential: admin.credential.applicationDefault() }); } catch {}
}
const db = admin.firestore();

const WEBHOOK_MAX_BYTES = Number(process.env.WEBHOOK_MAX_BYTES || 262144);

router.post('/webhook', express.raw({ type: 'application/json', limit: WEBHOOK_MAX_BYTES }), async (req, res) => {
  try {
    const disableSig = String(process.env.STRIPE_TEST_DISABLE_SIGNATURE || '').toLowerCase() === 'true';
    const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
    const STRIPE_WH_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    if (disableSig) {
      try {
        if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
          event = req.body;
        } else {
          const json = JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '{}'));
          event = json;
        }
      } catch (e) {
        return res.status(400).send('invalid-json');
      }
    } else {
      if (!STRIPE_KEY || !STRIPE_WH_SECRET) {
        logger.warn('Stripe webhook no configurado');
        return res.status(503).send('not-configured');
      }
      let stripe;
      try { stripe = (await import('stripe')).default(STRIPE_KEY); } catch { return res.status(503).send('stripe-not-installed'); }
      const sig = req.headers['stripe-signature'];
      if (!sig) return res.status(400).send('missing-signature');
      if (Buffer.isBuffer(req.body) && req.body.length > WEBHOOK_MAX_BYTES) return res.status(413).send('payload-too-large');
      try { event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WH_SECRET); }
      catch (err) { logger.warn('Stripe sig error', err.message); return res.status(400).send(`Webhook Error: ${err.message}`); }
    }

    // Idempotencia: usar event.id si existe (Stripe garantiza unicidad)
    try {
      if (event?.id) {
        const duplicate = await seenOrMark(`stripe:${String(event.id)}`, 6 * 60 * 60);
        if (duplicate) return res.status(200).send('ok');
      }
    } catch {}

    // Registrar evento
    try {
      const ts = (() => { try { return admin.firestore.FieldValue.serverTimestamp(); } catch { try { return admin.firestore().FieldValue.serverTimestamp(); } catch { return new Date(); } } })();
      await db.collection('paymentsEvents').add({ type: event.type, data: event.data?.object || {}, receivedAt: ts });
    } catch {}

    // Lógica de actualización
    const obj = event.data?.object || {};
    const tsNow = (() => { try { return admin.firestore.FieldValue.serverTimestamp(); } catch { try { return admin.firestore().FieldValue.serverTimestamp(); } catch { return new Date(); } } })();

    if (event.type === 'checkout.session.completed') {
      const providerId = obj.metadata?.providerId;
      const weddingId = obj.metadata?.weddingId;
      const contractId = obj.metadata?.contractId || null;
      const amountTotal = obj.amount_total || null;
      const currency = (obj.currency || 'eur').toUpperCase();
      try { await db.collection('_system').doc('config').collection('payments').add({ kind: 'checkout_session', sessionId: obj.id || null, contractId, providerId, weddingId, amount: typeof amountTotal === 'number' ? amountTotal / 100 : null, currency, status: 'paid', createdAt: tsNow, updatedAt: tsNow }); } catch {}
      if (contractId) { try { await db.collection('contracts').doc(contractId).set({ paymentStatus: 'paid', amountPaid: typeof amountTotal === 'number' ? amountTotal / 100 : null, currency, lastPaymentAt: tsNow, updatedAt: tsNow }, { merge: true }); } catch {} }
      if (providerId) {
        try { await db.collection('providerPayments').doc(providerId).set({ lastPaymentAt: tsNow, amount_total: amountTotal, currency }, { merge: true }); } catch {}
        if (weddingId) { try { await db.collection('weddings').doc(weddingId).collection('suppliers').doc(providerId).set({ status: 'Señal pagada', updatedAt: tsNow }, { merge: true }); } catch (e) { logger.warn('No se pudo actualizar proveedor tras pago', e?.message); } }
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const contractId = obj.metadata?.contractId || null;
      try { await db.collection('_system').doc('config').collection('payments').doc(obj.id || 'pi_unknown').set({ kind: 'payment_intent', status: 'succeeded', amount: typeof obj.amount === 'number' ? obj.amount / 100 : null, currency: (obj.currency || 'eur').toUpperCase(), contractId, updatedAt: tsNow }, { merge: true }); } catch {}
      if (contractId) { try { await db.collection('contracts').doc(contractId).set({ paymentStatus: 'paid', lastPaymentAt: tsNow, updatedAt: tsNow }, { merge: true }); } catch {} }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const contractId = obj.metadata?.contractId || null;
      try { await db.collection('_system').doc('config').collection('payments').doc(obj.id || 'pi_unknown').set({ kind: 'payment_intent', status: 'failed', error: obj.last_payment_error || null, updatedAt: tsNow, contractId }, { merge: true }); } catch {}
      if (contractId) { try { await db.collection('contracts').doc(contractId).set({ paymentStatus: 'failed', updatedAt: tsNow }, { merge: true }); } catch {} }
    }

    res.status(200).send('ok');
  } catch (e) {
    res.status(500).send('error');
  }
});

export default router;
