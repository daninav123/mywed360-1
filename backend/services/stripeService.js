/**
 * Servicio de gestión de pagos con Stripe
 */

import Stripe from 'stripe';
import { db } from '../db.js';
import logger from '../logger.js';
import { getProductById, getProductByPriceId } from '../config/stripe-products.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * Crear sesión de checkout para un producto
 */
export async function createCheckoutSession({
  productId,
  userId,
  userEmail,
  weddingId = null,
  successUrl,
  cancelUrl,
}) {
  try {
    const product = getProductById(productId);
    
    if (!product) {
      throw new Error(`Producto no encontrado: ${productId}`);
    }
    
    if (product.type === 'free') {
      throw new Error('No se puede crear checkout para plan gratuito');
    }
    
    if (!product.stripePriceId) {
      throw new Error(`Producto ${productId} no tiene stripePriceId configurado`);
    }
    
    const sessionConfig = {
      payment_method_types: ['card'],
      mode: product.type === 'subscription' ? 'subscription' : 'payment',
      customer_email: userEmail,
      line_items: [
        {
          price: product.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        productId,
        userId,
        weddingId: weddingId || '',
        environment: process.env.NODE_ENV || 'development',
      },
      subscription_data: product.type === 'subscription' ? {
        metadata: {
          productId,
          userId,
          weddingId: weddingId || '',
        },
      } : undefined,
    };
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    logger.info('[stripe] Checkout session created', {
      sessionId: session.id,
      productId,
      userId,
    });
    
    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    logger.error('[stripe] Error creating checkout session', error);
    throw error;
  }
}

/**
 * Crear portal de gestión de suscripciones
 */
export async function createCustomerPortalSession({ customerId, returnUrl }) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    
    return {
      url: session.url,
    };
  } catch (error) {
    logger.error('[stripe] Error creating portal session', error);
    throw error;
  }
}

/**
 * Procesar webhook de checkout completado
 */
export async function handleCheckoutCompleted(session) {
  try {
    const { productId, userId, weddingId } = session.metadata;
    
    if (!productId || !userId) {
      logger.warn('[stripe] Missing metadata in checkout session', { sessionId: session.id });
      return;
    }
    
    const product = getProductById(productId);
    const paymentIntent = session.payment_intent;
    
    // Guardar pago en Firestore
    const paymentData = {
      userId,
      weddingId: weddingId || null,
      productId,
      productName: product?.name || productId,
      amount: session.amount_total,
      currency: session.currency.toUpperCase(),
      status: 'paid',
      method: 'card',
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntent,
      stripeCustomerId: session.customer,
      type: product?.type || 'one_time',
      interval: product?.interval || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        test: false,
        source: 'stripe_webhook',
      },
    };
    
    await db.collection('_system').doc('config').collection('payments').add(paymentData);
    
    // Actualizar suscripción del usuario
    if (product?.type === 'subscription') {
      await updateUserSubscription({
        userId,
        productId,
        subscriptionId: session.subscription,
        customerId: session.customer,
        status: 'active',
      });
    }
    
    // Activar características del producto
    await activateProductFeatures({ userId, weddingId, productId });
    
    logger.info('[stripe] Checkout completed processed', {
      sessionId: session.id,
      userId,
      productId,
    });
  } catch (error) {
    logger.error('[stripe] Error handling checkout completed', error);
    throw error;
  }
}

/**
 * Procesar webhook de suscripción actualizada
 */
export async function handleSubscriptionUpdated(subscription) {
  try {
    const { productId, userId } = subscription.metadata;
    
    if (!userId) {
      logger.warn('[stripe] Missing userId in subscription metadata', {
        subscriptionId: subscription.id,
      });
      return;
    }
    
    await updateUserSubscription({
      userId,
      productId,
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
    });
    
    logger.info('[stripe] Subscription updated', {
      subscriptionId: subscription.id,
      userId,
      status: subscription.status,
    });
  } catch (error) {
    logger.error('[stripe] Error handling subscription updated', error);
    throw error;
  }
}

/**
 * Procesar webhook de suscripción cancelada
 */
export async function handleSubscriptionDeleted(subscription) {
  try {
    const { userId, productId } = subscription.metadata;
    
    if (!userId) {
      logger.warn('[stripe] Missing userId in subscription metadata', {
        subscriptionId: subscription.id,
      });
      return;
    }
    
    await updateUserSubscription({
      userId,
      productId,
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: 'canceled',
    });
    
    // Desactivar características premium
    await deactivateProductFeatures({ userId, productId });
    
    logger.info('[stripe] Subscription canceled', {
      subscriptionId: subscription.id,
      userId,
    });
  } catch (error) {
    logger.error('[stripe] Error handling subscription deleted', error);
    throw error;
  }
}

/**
 * Actualizar suscripción del usuario en Firestore
 */
async function updateUserSubscription({ userId, productId, subscriptionId, customerId, status }) {
  const userRef = db.collection('users').doc(userId);
  
  const subscriptionData = {
    productId,
    subscriptionId,
    customerId,
    status,
    updatedAt: new Date(),
  };
  
  await userRef.set(
    {
      subscription: subscriptionData,
      stripeCustomerId: customerId,
    },
    { merge: true }
  );
}

/**
 * Activar características del producto para un usuario
 */
async function activateProductFeatures({ userId, weddingId, productId }) {
  const product = getProductById(productId);
  const userRef = db.collection('users').doc(userId);
  
  const features = {
    plan: productId,
    maxWeddings: product?.maxWeddings || 1,
    maxGuests: product?.id === 'free' ? 80 : -1, // -1 = ilimitado
    whiteLabel: ['couple_plus', 'planner_unlimited'].includes(productId),
    prioritySupport: productId !== 'free',
    updatedAt: new Date(),
  };
  
  await userRef.set({ features }, { merge: true });
  
  // Si es para una boda específica
  if (weddingId) {
    const weddingRef = db.collection('weddings').doc(weddingId);
    await weddingRef.set(
      {
        subscription: {
          productId,
          active: true,
          activatedAt: new Date(),
        },
      },
      { merge: true }
    );
  }
}

/**
 * Desactivar características premium
 */
async function deactivateProductFeatures({ userId, productId }) {
  const userRef = db.collection('users').doc(userId);
  
  await userRef.set(
    {
      features: {
        plan: 'free',
        maxWeddings: 1,
        maxGuests: 80,
        whiteLabel: false,
        prioritySupport: false,
        updatedAt: new Date(),
      },
    },
    { merge: true }
  );
}

/**
 * Obtener suscripción activa de un usuario
 */
export async function getUserSubscription(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    return userData.subscription || null;
  } catch (error) {
    logger.error('[stripe] Error getting user subscription', error);
    return null;
  }
}

/**
 * Cancelar suscripción
 */
export async function cancelSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    
    logger.info('[stripe] Subscription set to cancel at period end', {
      subscriptionId,
    });
    
    return subscription;
  } catch (error) {
    logger.error('[stripe] Error canceling subscription', error);
    throw error;
  }
}

export { stripe };
