import express from 'express';
import logger from '../logger.js';

const router = express.Router();

router.post('/checkout', async (req, res) => {
  try {
    const { amount, currency = 'EUR', description = 'Pago', weddingId = null, metadata = {} } = req.body || {};
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
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: currency.toLowerCase(), product_data: { name: description }, unit_amount: cents }, quantity: 1 }],
      success_url: (process.env.FRONTEND_BASE_URL || 'http://localhost:5173') + '/proveedores?payment=success',
      cancel_url: (process.env.FRONTEND_BASE_URL || 'http://localhost:5173') + '/proveedores?payment=cancel',
      metadata: { ...metadata, weddingId: weddingId || metadata.weddingId || '' },
    });
    return res.json({ url: session.url });
  } catch (e) {
    logger.error('payments/checkout error', e);
    return res.status(500).json({ error: 'checkout-failed' });
  }
});

export default router;
