import express from 'express';
import logger from '../logger.js';
import admin from 'firebase-admin';

const router = express.Router();

if (!admin.apps.length) {
  try { admin.initializeApp({ credential: admin.credential.applicationDefault() }); } catch {}
}
const db = admin.firestore();

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
    const STRIPE_WH_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
    if (!STRIPE_KEY || !STRIPE_WH_SECRET) {
      logger.warn('Stripe webhook no configurado');
      return res.status(503).send('not-configured');
    }
    let stripe;
    try {
      stripe = (await import('stripe')).default(STRIPE_KEY);
    } catch (e) {
      logger.warn('stripe pkg no instalado');
      return res.status(503).send('stripe-not-installed');
    }
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WH_SECRET);
    } catch (err) {
      logger.warn('Stripe sig error', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
      await db.collection('paymentsEvents').add({ type: event.type, data: event.data?.object || {}, receivedAt: admin.firestore.FieldValue.serverTimestamp() });
    } catch {}
    // Manejo simple: si es checkout.session.completed, guardar metadatos
    if (event.type === 'checkout.session.completed') {
      const obj = event.data.object || {};
      const providerId = obj.metadata?.providerId;
      const weddingId = obj.metadata?.weddingId;
      if (providerId) {
        try {
          // Guardar estado de proveedor (no sabemos weddingId; acción informativa)
          await db.collection('providerPayments').doc(providerId).set({ lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(), amount_total: obj.amount_total, currency: obj.currency }, { merge: true });
        } catch {}
        // Si recibimos weddingId, actualizar el proveedor en la colección de la boda
        if (weddingId) {
          try {
            await db.collection('weddings').doc(weddingId).collection('suppliers').doc(providerId).set({ status: 'Señal pagada', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
          } catch (e) {
            logger.warn('No se pudo actualizar proveedor tras pago', e?.message);
          }
        }
      }
    }
    res.status(200).send('ok');
  } catch (e) {
    res.status(500).send('error');
  }
});

export default router;
