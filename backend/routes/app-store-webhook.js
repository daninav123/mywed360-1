/**
 * App Store Server Notifications (v2) Webhook
 * Recibe notificaciones de Apple cuando hay cambios en suscripciones iOS
 * Documentación: https://developer.apple.com/documentation/appstoreservernotifications
 */

import express from 'express';
import crypto from 'crypto';
import admin from 'firebase-admin';
import logger from '../logger.js';
import { seenOrMark } from '../utils/idempotency.js';

const router = express.Router();
const db = admin.firestore();

// Tipos de notificación de Apple
const NOTIFICATION_TYPES = {
  SUBSCRIBED: 'SUBSCRIBED',
  DID_RENEW: 'DID_RENEW',
  DID_CHANGE_RENEWAL_STATUS: 'DID_CHANGE_RENEWAL_STATUS',
  DID_CHANGE_RENEWAL_PREF: 'DID_CHANGE_RENEWAL_PREF',
  EXPIRED: 'EXPIRED',
  DID_FAIL_TO_RENEW: 'DID_FAIL_TO_RENEW',
  GRACE_PERIOD_EXPIRED: 'GRACE_PERIOD_EXPIRED',
  PRICE_INCREASE: 'PRICE_INCREASE_CONSENT',
  REFUND: 'REFUND',
  REFUND_DECLINED: 'REFUND_DECLINED',
  CONSUMPTION_REQUEST: 'CONSUMPTION_REQUEST',
  RENEWAL_EXTENDED: 'RENEWAL_EXTENDED',
  REVOKE: 'REVOKE',
  TEST: 'TEST'
};

// Mapeo de product IDs a planes internos
const PRODUCT_ID_TO_PLAN = {
  'com.mywed360.premium.monthly': { plan: 'premium', interval: 'month', amount: 9.99 },
  'com.mywed360.premium.yearly': { plan: 'premium', interval: 'year', amount: 99.99 },
  'com.mywed360.premium_plus.monthly': { plan: 'premium_plus', interval: 'month', amount: 19.99 },
  'com.mywed360.premium_plus.yearly': { plan: 'premium_plus', interval: 'year', amount: 199.99 },
};

/**
 * Valida el receipt con los servidores de Apple
 */
async function verifyReceiptWithApple(receiptData, isProduction = true) {
  const sharedSecret = process.env.APP_STORE_SHARED_SECRET;
  
  if (!sharedSecret) {
    logger.warn('[app-store] APP_STORE_SHARED_SECRET no configurado');
    return null;
  }

  // Intentar primero con producción, luego sandbox
  const urls = isProduction 
    ? ['https://buy.itunes.apple.com/verifyReceipt', 'https://sandbox.itunes.apple.com/verifyReceipt']
    : ['https://sandbox.itunes.apple.com/verifyReceipt'];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receiptData,
          'password': sharedSecret,
          'exclude-old-transactions': true
        })
      });

      const result = await response.json();
      
      // Status codes: https://developer.apple.com/documentation/appstorereceipts/status
      if (result.status === 0) {
        logger.info('[app-store] Receipt verificado exitosamente', { url });
        return result;
      }
      
      if (result.status === 21007) {
        // Receipt es de sandbox pero estamos en producción
        logger.info('[app-store] Receipt es de sandbox, reintentando...');
        continue;
      }
      
      logger.warn('[app-store] Verificación falló', { status: result.status, url });
      
    } catch (error) {
      logger.error('[app-store] Error verificando receipt', { error: error.message, url });
    }
  }
  
  return null;
}

/**
 * Parsea la transacción de la notificación v2
 */
function parseTransactionInfo(signedTransactionInfo) {
  // En v2, viene como JWT firmado
  // Para simplificar, asumimos que ya viene decodificado en data
  // En producción, deberías verificar la firma JWT con la clave pública de Apple
  
  if (!signedTransactionInfo) return null;
  
  try {
    // Si viene como string JWT, decodificarlo
    if (typeof signedTransactionInfo === 'string') {
      const parts = signedTransactionInfo.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return payload;
      }
    }
    return signedTransactionInfo;
  } catch (error) {
    logger.error('[app-store] Error parseando transactionInfo', error);
    return signedTransactionInfo;
  }
}

/**
 * Actualiza o crea una suscripción en Firestore
 */
async function upsertSubscription(transactionInfo, notificationType, userId = null) {
  try {
    const {
      transactionId,
      originalTransactionId,
      productId,
      purchaseDate,
      expiresDate,
      webOrderLineItemId,
      bundleId,
      environment
    } = transactionInfo;

    const planInfo = PRODUCT_ID_TO_PLAN[productId] || {
      plan: 'premium',
      interval: 'month',
      amount: 9.99
    };

    // Calcular el monthly amount (normalizar a mensual)
    const monthlyAmount = planInfo.interval === 'year' 
      ? planInfo.amount / 12 
      : planInfo.amount;

    // Determinar el estado según el tipo de notificación
    let status = 'active';
    if ([NOTIFICATION_TYPES.EXPIRED, NOTIFICATION_TYPES.GRACE_PERIOD_EXPIRED].includes(notificationType)) {
      status = 'expired';
    } else if (notificationType === NOTIFICATION_TYPES.DID_FAIL_TO_RENEW) {
      status = 'past_due';
    } else if (notificationType === NOTIFICATION_TYPES.REFUND) {
      status = 'refunded';
    } else if (notificationType === NOTIFICATION_TYPES.REVOKE) {
      status = 'canceled';
    }

    const subscriptionData = {
      platform: 'ios',
      status,
      plan: planInfo.plan,
      interval: planInfo.interval,
      
      // IDs de Apple
      transactionId,
      originalTransactionId: originalTransactionId || transactionId,
      productId,
      webOrderLineItemId: webOrderLineItemId || null,
      
      // Fechas (convertir de milliseconds)
      purchaseDate: admin.firestore.Timestamp.fromMillis(purchaseDate),
      expiresDate: expiresDate ? admin.firestore.Timestamp.fromMillis(expiresDate) : null,
      
      // Financiero
      monthlyAmount,
      amount: planInfo.amount,
      currency: 'EUR', // Ajustar según tu región
      
      // Metadata
      bundleId: bundleId || 'com.maloveapp.app',
      environment: environment || 'Production',
      lastNotificationType: notificationType,
      lastNotificationAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Si tenemos userId, agregarlo
    if (userId) {
      subscriptionData.userId = userId;
    }

    // Usar originalTransactionId como document ID para evitar duplicados
    const docId = originalTransactionId || transactionId;
    const docRef = db.collection('subscriptions').doc(docId);
    
    // Si es la primera vez, agregar createdAt
    const existingDoc = await docRef.get();
    if (!existingDoc.exists) {
      subscriptionData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await docRef.set(subscriptionData, { merge: true });
    
    // Si tenemos userId, actualizar también el perfil del usuario
    if (userId) {
      await db.collection('users').doc(userId).set({
        subscription: planInfo.plan,
        subscriptionStatus: status,
        subscriptionPlatform: 'ios',
        subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    logger.info('[app-store] Suscripción actualizada', {
      docId,
      productId,
      status,
      userId: userId || 'unknown'
    });

    return docId;
  } catch (error) {
    logger.error('[app-store] Error actualizando suscripción', error);
    throw error;
  }
}

/**
 * Registra el evento en Firestore para auditoría
 */
async function logAppStoreEvent(notificationType, data) {
  try {
    await db.collection('appStoreEvents').add({
      notificationType,
      data,
      receivedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    logger.warn('[app-store] Error logging event', error);
  }
}

/**
 * POST /api/app-store/webhook
 * Recibe notificaciones de Apple App Store Server Notifications v2
 */
router.post('/webhook', express.json({ limit: '1mb' }), async (req, res) => {
  try {
    const notification = req.body;
    
    // Validación básica
    if (!notification || !notification.notificationType) {
      logger.warn('[app-store] Webhook sin notificationType');
      return res.status(400).json({ error: 'invalid_payload' });
    }

    const { notificationType, data, notificationUUID } = notification;
    
    // Idempotencia: evitar procesar la misma notificación dos veces
    if (notificationUUID) {
      const isDuplicate = await seenOrMark(`appstore:${notificationUUID}`, 24 * 60 * 60);
      if (isDuplicate) {
        logger.info('[app-store] Notificación duplicada ignorada', { notificationUUID });
        return res.status(200).json({ status: 'ok', message: 'duplicate' });
      }
    }

    // Registrar evento para auditoría
    await logAppStoreEvent(notificationType, data);

    // Parsear la información de la transacción
    const transactionInfo = parseTransactionInfo(data?.signedTransactionInfo);
    
    if (!transactionInfo) {
      logger.warn('[app-store] No se pudo parsear transactionInfo');
      return res.status(200).json({ status: 'ok', message: 'no_transaction_info' });
    }

    // Intentar obtener el userId desde el metadata o el appAccountToken
    let userId = null;
    if (data?.appAccountToken) {
      // El appAccountToken puede contener el userId
      userId = data.appAccountToken;
    }

    logger.info('[app-store] Procesando notificación', {
      type: notificationType,
      transactionId: transactionInfo.transactionId,
      productId: transactionInfo.productId,
      userId: userId || 'unknown'
    });

    // Procesar según el tipo de notificación
    switch (notificationType) {
      case NOTIFICATION_TYPES.SUBSCRIBED:
      case NOTIFICATION_TYPES.DID_RENEW:
      case NOTIFICATION_TYPES.DID_CHANGE_RENEWAL_PREF:
        await upsertSubscription(transactionInfo, notificationType, userId);
        break;

      case NOTIFICATION_TYPES.DID_CHANGE_RENEWAL_STATUS:
        // Usuario activó/desactivó la renovación automática
        await upsertSubscription(transactionInfo, notificationType, userId);
        break;

      case NOTIFICATION_TYPES.EXPIRED:
      case NOTIFICATION_TYPES.GRACE_PERIOD_EXPIRED:
        await upsertSubscription(transactionInfo, notificationType, userId);
        break;

      case NOTIFICATION_TYPES.DID_FAIL_TO_RENEW:
        await upsertSubscription(transactionInfo, notificationType, userId);
        break;

      case NOTIFICATION_TYPES.REFUND:
      case NOTIFICATION_TYPES.REVOKE:
        await upsertSubscription(transactionInfo, notificationType, userId);
        break;

      case NOTIFICATION_TYPES.TEST:
        logger.info('[app-store] Test notification recibida');
        break;

      default:
        logger.warn('[app-store] Tipo de notificación desconocido', { notificationType });
    }

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    logger.error('[app-store] Error procesando webhook', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * POST /api/app-store/verify-receipt
 * Permite al cliente iOS validar un receipt manualmente
 */
router.post('/verify-receipt', express.json(), async (req, res) => {
  try {
    const { receiptData, userId } = req.body;

    if (!receiptData) {
      return res.status(400).json({ error: 'receipt_data_required' });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const result = await verifyReceiptWithApple(receiptData, isProduction);

    if (!result) {
      return res.status(400).json({ error: 'invalid_receipt' });
    }

    // Obtener la última transacción del receipt
    const latestReceipt = result.latest_receipt_info?.[0];
    
    if (latestReceipt) {
      // Convertir formato de Apple a nuestro formato
      const transactionInfo = {
        transactionId: latestReceipt.transaction_id,
        originalTransactionId: latestReceipt.original_transaction_id,
        productId: latestReceipt.product_id,
        purchaseDate: parseInt(latestReceipt.purchase_date_ms),
        expiresDate: parseInt(latestReceipt.expires_date_ms),
        bundleId: result.receipt?.bundle_id,
        environment: result.environment
      };

      await upsertSubscription(transactionInfo, 'MANUAL_VERIFICATION', userId);

      res.json({
        valid: true,
        subscription: {
          productId: transactionInfo.productId,
          expiresDate: new Date(transactionInfo.expiresDate).toISOString()
        }
      });
    } else {
      res.json({ valid: false });
    }

  } catch (error) {
    logger.error('[app-store] Error verificando receipt', error);
    res.status(500).json({ error: 'verification_failed' });
  }
});

/**
 * GET /api/app-store/subscription/:userId
 * Obtiene la suscripción activa de un usuario
 */
router.get('/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .where('platform', '==', 'ios')
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'subscription_not_found' });
    }

    const doc = snapshot.docs[0];
    const subscription = { id: doc.id, ...doc.data() };

    // Convertir timestamps a ISO strings
    if (subscription.purchaseDate?.toDate) {
      subscription.purchaseDate = subscription.purchaseDate.toDate().toISOString();
    }
    if (subscription.expiresDate?.toDate) {
      subscription.expiresDate = subscription.expiresDate.toDate().toISOString();
    }

    res.json({ subscription });

  } catch (error) {
    logger.error('[app-store] Error obteniendo suscripción', error);
    res.status(500).json({ error: 'fetch_failed' });
  }
});

export default router;
