/**
 * Rutas para pagos de Google Play Billing
 * Maneja webhooks y verificación de compras
 */

import express from 'express';
import { verifyGooglePurchase, verifyGoogleSubscription } from '../services/googlePaymentService.js';
import { createOrUpdateSubscription } from '../services/subscriptionService.js';

const router = express.Router();

/**
 * POST /api/google/webhook
 * Recibe notificaciones de Google (Real-time Developer Notifications)
 */
router.post('/webhook', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.data) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Decodificar mensaje de Pub/Sub
    const notification = JSON.parse(
      Buffer.from(message.data, 'base64').toString()
    );

    console.log('🤖 Google Webhook recibido:', notification.notificationType);

    const { subscriptionNotification, oneTimeProductNotification } = notification;

    // Manejar notificación de suscripción
    if (subscriptionNotification) {
      await handleGoogleSubscriptionNotification(subscriptionNotification);
    }

    // Manejar notificación de producto único
    if (oneTimeProductNotification) {
      await handleGoogleOneTimeNotification(oneTimeProductNotification);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Error procesando webhook Google:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/verify
 * Verifica una compra de Android
 */
router.post('/verify', async (req, res) => {
  try {
    const { purchaseToken, productId, userId, type } = req.body;

    if (!purchaseToken || !productId || !userId || !type) {
      return res.status(400).json({ 
        error: 'purchaseToken, productId, userId y type son requeridos' 
      });
    }

    console.log(`🔍 Verificando compra Google para usuario: ${userId}`);

    let verification;

    // Verificar según tipo de producto
    if (type === 'subscription') {
      verification = await verifyGoogleSubscription(productId, purchaseToken);
    } else {
      verification = await verifyGooglePurchase(productId, purchaseToken);
    }

    if (!verification.valid) {
      console.error('❌ Compra Google inválida');
      return res.status(400).json({ 
        error: 'Invalid purchase',
        details: verification.error 
      });
    }

    // Crear/actualizar suscripción en Firestore
    const subscription = await createOrUpdateSubscription({
      userId,
      platform: 'google',
      productId,
      purchaseToken,
      orderId: verification.orderId,
      status: verification.paymentState === 1 ? 'active' : 'pending',
      currentPeriodEnd: verification.expiryTimeMillis 
        ? new Date(parseInt(verification.expiryTimeMillis))
        : null,
      metadata: {
        acknowledgementState: verification.acknowledgementState,
        kind: verification.kind,
        purchaseType: type
      }
    });

    console.log('✅ Suscripción Google creada/actualizada:', subscription.id);

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        productId,
        status: subscription.status,
        expiresAt: subscription.currentPeriodEnd
      }
    });

  } catch (error) {
    console.error('❌ Error verificando compra Google:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Maneja notificaciones de suscripción de Google
 */
async function handleGoogleSubscriptionNotification(notification) {
  const { 
    subscriptionId,
    purchaseToken,
    notificationType 
  } = notification;

  console.log(`📱 Notificación de suscripción Google: ${notificationType}`);

  // Verificar suscripción con Google API
  const verification = await verifyGoogleSubscription(subscriptionId, purchaseToken);

  if (!verification.valid) {
    console.error('❌ Suscripción Google inválida');
    return;
  }

  // Buscar usuario por purchaseToken
  const userId = await findUserByGooglePurchase(purchaseToken);

  if (!userId) {
    console.error('❌ Usuario no encontrado para purchase token:', purchaseToken);
    return;
  }

  // Mapear notificationType a status
  let status = 'active';
  
  switch (notificationType) {
    case 1: // SUBSCRIPTION_RECOVERED
    case 2: // SUBSCRIPTION_RENEWED
    case 4: // SUBSCRIPTION_PURCHASED
    case 7: // SUBSCRIPTION_RESTARTED
      status = 'active';
      break;
    
    case 3: // SUBSCRIPTION_CANCELED
      status = 'cancelled';
      break;
    
    case 5: // SUBSCRIPTION_ON_HOLD
      status = 'past_due';
      break;
    
    case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
      status = 'past_due';
      break;
    
    case 10: // SUBSCRIPTION_PAUSED
      status = 'paused';
      break;
    
    case 13: // SUBSCRIPTION_EXPIRED
      status = 'expired';
      break;
  }

  // Actualizar suscripción
  await createOrUpdateSubscription({
    userId,
    platform: 'google',
    productId: subscriptionId,
    purchaseToken,
    orderId: verification.orderId,
    status,
    currentPeriodEnd: new Date(parseInt(verification.expiryTimeMillis)),
    metadata: {
      notificationType,
      autoRenewing: verification.autoRenewing
    }
  });

  console.log(`✅ Suscripción Google actualizada: ${status}`);
}

/**
 * Maneja notificaciones de producto único de Google
 */
async function handleGoogleOneTimeNotification(notification) {
  const { 
    sku,
    purchaseToken,
    notificationType 
  } = notification;

  console.log(`📦 Notificación de producto Google: ${notificationType}`);

  // Verificar compra con Google API
  const verification = await verifyGooglePurchase(sku, purchaseToken);

  if (!verification.valid) {
    console.error('❌ Compra Google inválida');
    return;
  }

  // Buscar usuario
  const userId = await findUserByGooglePurchase(purchaseToken);

  if (!userId) {
    console.error('❌ Usuario no encontrado para purchase token:', purchaseToken);
    return;
  }

  // Mapear notificationType a status
  let status = 'active';
  
  switch (notificationType) {
    case 1: // ONE_TIME_PRODUCT_PURCHASED
      status = 'active';
      break;
    
    case 2: // ONE_TIME_PRODUCT_CANCELED
      status = 'refunded';
      break;
  }

  // Crear registro de compra
  await createOrUpdateSubscription({
    userId,
    platform: 'google',
    productId: sku,
    purchaseToken,
    orderId: verification.orderId,
    status,
    currentPeriodEnd: null, // Productos únicos no expiran
    metadata: {
      notificationType,
      purchaseState: verification.purchaseState
    }
  });

  console.log(`✅ Compra Google registrada: ${status}`);
}

/**
 * Busca un usuario por su purchaseToken de Google
 */
async function findUserByGooglePurchase(purchaseToken) {
  const { db } = await import('../config/firebase.js');
  
  const snapshot = await db.collectionGroup('subscriptions')
    .where('platform', '==', 'google')
    .where('purchaseToken', '==', purchaseToken)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  // Obtener userId desde la ruta del documento
  const docPath = snapshot.docs[0].ref.path;
  const userId = docPath.split('/')[1]; // users/{userId}/subscriptions/{subId}
  
  return userId;
}

export default router;
