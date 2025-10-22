/**
 * Rutas para pagos de Apple In-App Purchases
 * Maneja webhooks y verificación de recibos
 */

import express from 'express';
import { verifyAppleReceipt, verifyAppleNotification } from '../services/applePaymentService.js';
import { createOrUpdateSubscription } from '../services/subscriptionService.js';

const router = express.Router();

/**
 * POST /api/apple/webhook
 * Recibe notificaciones de Apple (Server-to-Server Notifications V2)
 */
router.post('/webhook', async (req, res) => {
  try {
    const notification = req.body;
    
    console.log('📱 Apple Webhook recibido:', notification.notificationType);

    // Verificar firma JWT de Apple
    const isValid = await verifyAppleNotification(notification);
    
    if (!isValid) {
      console.error('❌ Firma de Apple inválida');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { notificationType, data } = notification;
    const { signedTransactionInfo, signedRenewalInfo } = data;

    // Procesar según tipo de notificación
    switch (notificationType) {
      case 'SUBSCRIBED':
        console.log('✅ Nueva suscripción Apple');
        await handleAppleSubscription(signedTransactionInfo, 'active');
        break;

      case 'DID_RENEW':
        console.log('🔄 Renovación de suscripción Apple');
        await handleAppleSubscription(signedTransactionInfo, 'active');
        break;

      case 'DID_FAIL_TO_RENEW':
        console.log('⚠️ Fallo en renovación Apple');
        await handleAppleSubscription(signedTransactionInfo, 'past_due');
        break;

      case 'DID_CHANGE_RENEWAL_STATUS':
        console.log('🔀 Cambio en estado de renovación Apple');
        const willRenew = signedRenewalInfo?.autoRenewStatus === 1;
        await handleAppleSubscription(
          signedTransactionInfo, 
          willRenew ? 'active' : 'cancelled'
        );
        break;

      case 'EXPIRED':
        console.log('⏰ Suscripción Apple expirada');
        await handleAppleSubscription(signedTransactionInfo, 'expired');
        break;

      case 'REFUND':
        console.log('💸 Reembolso Apple');
        await handleAppleSubscription(signedTransactionInfo, 'refunded');
        break;

      default:
        console.log(`ℹ️ Evento Apple no manejado: ${notificationType}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Error procesando webhook Apple:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/apple/verify
 * Verifica un recibo de compra de iOS
 */
router.post('/verify', async (req, res) => {
  try {
    const { receiptData, userId } = req.body;

    if (!receiptData || !userId) {
      return res.status(400).json({ 
        error: 'receiptData y userId son requeridos' 
      });
    }

    console.log(`🔍 Verificando recibo Apple para usuario: ${userId}`);

    // Verificar recibo con Apple
    const verification = await verifyAppleReceipt(receiptData);

    if (!verification.valid) {
      console.error('❌ Recibo Apple inválido');
      return res.status(400).json({ 
        error: 'Invalid receipt',
        details: verification.error 
      });
    }

    // Extraer información de la transacción
    const { productId, transactionId, expiresDate, originalTransactionId } = verification;

    // Crear/actualizar suscripción en Firestore
    const subscription = await createOrUpdateSubscription({
      userId,
      platform: 'apple',
      productId,
      transactionId,
      originalTransactionId,
      status: 'active',
      currentPeriodEnd: expiresDate,
      metadata: {
        environment: verification.environment,
        purchaseDate: verification.purchaseDate
      }
    });

    console.log('✅ Suscripción Apple creada/actualizada:', subscription.id);

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        productId,
        status: 'active',
        expiresAt: expiresDate
      }
    });

  } catch (error) {
    console.error('❌ Error verificando recibo Apple:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Procesa una transacción de Apple y actualiza Firestore
 */
async function handleAppleSubscription(signedTransactionInfo, status) {
  try {
    // Decodificar JWT de Apple (simplificado, en producción usar librería)
    const decoded = JSON.parse(
      Buffer.from(signedTransactionInfo.split('.')[1], 'base64').toString()
    );

    const {
      originalTransactionId,
      transactionId,
      productId,
      purchaseDate,
      expiresDate,
      webOrderLineItemId
    } = decoded;

    // Buscar usuario por originalTransactionId en Firestore
    const userId = await findUserByAppleTransaction(originalTransactionId);

    if (!userId) {
      console.error('❌ Usuario no encontrado para transacción Apple:', originalTransactionId);
      return;
    }

    // Actualizar suscripción
    await createOrUpdateSubscription({
      userId,
      platform: 'apple',
      productId,
      transactionId,
      originalTransactionId,
      status,
      currentPeriodEnd: new Date(expiresDate),
      metadata: {
        purchaseDate: new Date(purchaseDate),
        webOrderLineItemId
      }
    });

    console.log(`✅ Suscripción Apple actualizada: ${status}`);

  } catch (error) {
    console.error('❌ Error procesando transacción Apple:', error);
    throw error;
  }
}

/**
 * Busca un usuario por su originalTransactionId de Apple
 */
async function findUserByAppleTransaction(originalTransactionId) {
  const { db } = await import('../config/firebase.js');
  
  const snapshot = await db.collectionGroup('subscriptions')
    .where('platform', '==', 'apple')
    .where('originalTransactionId', '==', originalTransactionId)
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
