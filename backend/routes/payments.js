import express from 'express';
import logger from '../logger.js';
import { z, validate } from '../utils/validation.js';

const router = express.Router();

// GET /api/payments (placeholder: lista básica desde Firestore si existe)
router.get('/', async (req, res) => {
  try {
    const { default: admin } = await import('firebase-admin');
    if (!admin?.firestore) return res.json({ items: [] });
    const { contractId } = req.query || {};
    let q = admin.firestore().collection('_system').doc('config').collection('payments');
    if (contractId) q = q.where('contractId', '==', String(contractId));
    const snap = await q.limit(200).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ items });
  } catch (e) {
    res.status(200).json({ items: [] });
  }
});

const checkoutSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().regex(/^[A-Za-z]{3}$/).default('EUR'),
  description: z.string().min(1).default('Pago'),
  weddingId: z.string().min(1).nullable().optional(),
  metadata: z.record(z.any()).default({}),
});
router.post('/checkout', validate(checkoutSchema), async (req, res) => {
  try {
    const { amount, currency = 'EUR', description = 'Pago', weddingId = null, metadata = {} } = req.body;
    const cents = Math.max(100, Math.floor(Number(amount) * 100));
    const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_KEY) {
      logger.warn('Stripe no configurado; devolviendo 503');
      return res.status(503).json({ error: 'stripe-not-configured' });
    }
    let Stripe;
    try {
      Stripe = (await import('stripe')).default;
    } catch (e) {
      logger.warn('stripe pkg no instalado');
      return res.status(503).json({ error: 'stripe-not-installed' });
    }
    const stripe = new Stripe(STRIPE_KEY);
    // Añadir providerId/amount a la URL de retorno para poder marcar estado en el frontend
    const base = (process.env.FRONTEND_BASE_URL || 'http://localhost:5173');
    const providerId = (metadata && (metadata.providerId || metadata.provider_id)) || '';
    const amountParam = String(amount || '');
    const successPath = `/proveedores?payment=success${providerId ? `&providerId=${encodeURIComponent(String(providerId))}` : ''}${amountParam ? `&amount=${encodeURIComponent(amountParam)}` : ''}`;
    const cancelPath = `/proveedores?payment=cancel${providerId ? `&providerId=${encodeURIComponent(String(providerId))}` : ''}${amountParam ? `&amount=${encodeURIComponent(amountParam)}` : ''}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: currency.toLowerCase(), product_data: { name: description }, unit_amount: cents }, quantity: 1 }],
      success_url: base + successPath,
      cancel_url: base + cancelPath,
      metadata: { ...metadata, weddingId: weddingId || metadata.weddingId || '' },
    });
    return res.json({ url: session.url });
  } catch (e) {
    logger.error('payments/checkout error', e);
    return res.status(500).json({ error: 'checkout-failed' });
  }
});

// POST /api/payments/intent (placeholder)
const intentSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().regex(/^[A-Za-z]{3}$/).default('EUR'),
  contractId: z.string().min(1).nullable().optional(),
});
router.post('/intent', validate(intentSchema), async (req, res) => {
  try {
    const { amount, currency = 'EUR', contractId = null } = req.body;
    const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_KEY) {
      return res.status(503).json({ error: 'stripe-not-configured' });
    }
    let Stripe;
    try {
      Stripe = (await import('stripe')).default;
    } catch (e) {
      return res.status(503).json({ error: 'stripe-not-installed' });
    }
    const stripe = new Stripe(STRIPE_KEY);
    const pi = await stripe.paymentIntents.create({
      amount: Math.max(100, Math.floor(Number(amount) * 100)),
      currency: currency.toLowerCase(),
      metadata: { contractId: contractId || '' },
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: pi.client_secret });
  } catch (e) {
    res.status(500).json({ error: 'intent-failed' });
  }
});

export default router;
