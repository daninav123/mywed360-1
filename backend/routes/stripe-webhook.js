/**
 * Webhook de Stripe para procesar eventos de pago
 */

import express from 'express';
import { stripe } from '../services/stripeService.js';
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from '../services/stripeService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Webhook endpoint (requiere raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'webhook_not_configured' });
  }

  let event;

  try {
    // Verificar firma del webhook
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('[stripe-webhook] Webhook signature verification failed', {
      error: err.message,
    });
    return res.status(400).json({ error: 'webhook_signature_invalid' });
  }

  // Procesar evento
  try {
    logger.info('[stripe-webhook] Event received', {
      type: event.type,
      id: event.id,
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        logger.info('[stripe-webhook] Invoice payment succeeded', {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          amount: invoice.amount_paid,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        logger.warn('[stripe-webhook] Invoice payment failed', {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          customerId: invoice.customer,
        });
        // TODO: Notificar al usuario por email
        break;
      }

      default:
        logger.info('[stripe-webhook] Unhandled event type', {
          type: event.type,
        });
    }

    // Responder a Stripe
    res.json({ received: true });
  } catch (error) {
    logger.error('[stripe-webhook] Error processing event', {
      type: event.type,
      error: error.message,
    });
    res.status(500).json({ error: 'webhook_processing_failed' });
  }
});

// Endpoint de test para verificar configuración
router.get('/test', (_req, res) => {
  const configured = {
    webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    secretKey: !!process.env.STRIPE_SECRET_KEY,
    publishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
  };

  const allConfigured = Object.values(configured).every(Boolean);

  res.json({
    status: allConfigured ? 'configured' : 'incomplete',
    configured,
    message: allConfigured
      ? 'Stripe está completamente configurado'
      : 'Faltan variables de entorno de Stripe',
  });
});

export default router;
