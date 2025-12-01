/**
 * API de Stripe para checkout y gestión de suscripciones
 */

import express from 'express';
import { z } from 'zod';
import {
  createCheckoutSession,
  createCustomerPortalSession,
  getUserSubscription,
  cancelSubscription,
} from '../services/stripeService.js';
import { getProductsByType } from '../config/stripe-products.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Schema de validación para checkout
const CreateCheckoutSchema = z.object({
  productId: z.string().min(1),
  weddingId: z.string().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

/**
 * POST /api/stripe/create-checkout-session
 * Crear sesión de checkout
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    // Obtener usuario autenticado
    const userId = req.user?.uid || req.userProfile?.uid;
    const userEmail = req.user?.email || req.userProfile?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    // Validar request
    const validation = CreateCheckoutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'invalid_request',
        details: validation.error.errors,
      });
    }

    const { productId, weddingId, successUrl, cancelUrl } = validation.data;

    // Crear sesión
    const session = await createCheckoutSession({
      productId,
      userId,
      userEmail,
      weddingId,
      successUrl,
      cancelUrl,
    });

    logger.info('[stripe-api] Checkout session created', {
      userId,
      productId,
      sessionId: session.sessionId,
    });

    res.json(session);
  } catch (error) {
    logger.error('[stripe-api] Error creating checkout session', error);
    res.status(500).json({
      error: 'checkout_failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/stripe/create-portal-session
 * Crear sesión del portal de cliente
 */
router.post('/create-portal-session', async (req, res) => {
  try {
    const userId = req.user?.uid || req.userProfile?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { returnUrl } = req.body;

    if (!returnUrl) {
      return res.status(400).json({ error: 'return_url_required' });
    }

    // Obtener customer ID del usuario
    const subscription = await getUserSubscription(userId);

    if (!subscription || !subscription.customerId) {
      return res.status(404).json({ error: 'no_subscription_found' });
    }

    const session = await createCustomerPortalSession({
      customerId: subscription.customerId,
      returnUrl,
    });

    res.json(session);
  } catch (error) {
    logger.error('[stripe-api] Error creating portal session', error);
    res.status(500).json({
      error: 'portal_failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/stripe/subscription
 * Obtener suscripción activa del usuario
 */
router.get('/subscription', async (req, res) => {
  try {
    const userId = req.user?.uid || req.userProfile?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const subscription = await getUserSubscription(userId);

    res.json({
      subscription,
      hasSubscription: !!subscription,
    });
  } catch (error) {
    logger.error('[stripe-api] Error getting subscription', error);
    res.status(500).json({
      error: 'subscription_fetch_failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/stripe/cancel-subscription
 * Cancelar suscripción al final del período
 */
router.post('/cancel-subscription', async (req, res) => {
  try {
    const userId = req.user?.uid || req.userProfile?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const userSubscription = await getUserSubscription(userId);

    if (!userSubscription || !userSubscription.subscriptionId) {
      return res.status(404).json({ error: 'no_subscription_found' });
    }

    const subscription = await cancelSubscription(userSubscription.subscriptionId);

    res.json({
      message: 'subscription_canceled',
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: subscription.current_period_end,
    });
  } catch (error) {
    logger.error('[stripe-api] Error canceling subscription', error);
    res.status(500).json({
      error: 'cancel_failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/stripe/products
 * Obtener lista de productos disponibles
 */
router.get('/products/:type', (req, res) => {
  try {
    const { type } = req.params;

    if (!['couples', 'planners'].includes(type)) {
      return res.status(400).json({ error: 'invalid_type' });
    }

    const products = getProductsByType(type);

    // Filtrar stripePriceId por seguridad
    const publicProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      type: product.type,
      interval: product.interval,
      features: product.features,
      maxWeddings: product.maxWeddings,
      maxUsers: product.maxUsers,
    }));

    res.json({ products: publicProducts });
  } catch (error) {
    logger.error('[stripe-api] Error getting products', error);
    res.status(500).json({
      error: 'products_fetch_failed',
      message: error.message,
    });
  }
});

export default router;
