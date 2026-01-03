/**
 * Servicio unificado para gestionar suscripciones de todas las plataformas
 * Sincroniza pagos de Stripe, Apple y Google en Firestore
 */

import { db, FieldValue } from '../config/firebase.js';

/**
 * Crea o actualiza una suscripción en Firestore
 * @param {Object} data - Datos de la suscripción
 * @returns {Promise<Object>} - Documento de suscripción creado/actualizado
 */
export async function createOrUpdateSubscription(data) {
  const {
    userId,
    platform, // 'stripe' | 'apple' | 'google'
    productId,
    status, // 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused' | 'refunded'
    currentPeriodEnd,
    metadata = {}
  } = data;

  try {
    // Buscar suscripción existente
    const existingSub = await findExistingSubscription(userId, platform, data);

    const subscriptionData = {
      platform,
      productId,
      status,
      currentPeriodEnd: currentPeriodEnd ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
      ...buildPlatformSpecificData(platform, data),
      metadata
    };

    if (existingSub) {
      // Actualizar existente
      await db.doc(`users/${userId}/subscriptions/${existingSub.id}`).update(subscriptionData);
      
      console.log(`✅ Suscripción ${platform} actualizada: ${existingSub.id}`);
      
      return {
        id: existingSub.id,
        ...subscriptionData
      };
    } else {
      // Crear nueva
      subscriptionData.createdAt = FieldValue.serverTimestamp();
      
      const docRef = await db.collection(`users/${userId}/subscriptions`).add(subscriptionData);
      
      console.log(`✅ Suscripción ${platform} creada: ${docRef.id}`);
      
      return {
        id: docRef.id,
        ...subscriptionData
      };
    }

  } catch (error) {
    console.error('❌ Error creando/actualizando suscripción:', error);
    throw error;
  }
}

/**
 * Busca una suscripción existente según la plataforma
 */
async function findExistingSubscription(userId, platform, data) {
  let query = db.collection(`users/${userId}/subscriptions`)
    .where('platform', '==', platform);

  // Buscar por identificador único de cada plataforma
  switch (platform) {
    case 'stripe':
      if (data.stripeSubscriptionId) {
        query = query.where('stripeSubscriptionId', '==', data.stripeSubscriptionId);
      }
      break;
    
    case 'apple':
      if (data.originalTransactionId) {
        query = query.where('originalTransactionId', '==', data.originalTransactionId);
      }
      break;
    
    case 'google':
      if (data.purchaseToken) {
        query = query.where('purchaseToken', '==', data.purchaseToken);
      }
      break;
  }

  const snapshot = await query.limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data()
  };
}

/**
 * Construye datos específicos de cada plataforma
 */
function buildPlatformSpecificData(platform, data) {
  switch (platform) {
    case 'stripe':
      return {
        stripeSubscriptionId: data.stripeSubscriptionId || null,
        stripeCustomerId: data.stripeCustomerId || null,
        stripePriceId: data.stripePriceId || null
      };
    
    case 'apple':
      return {
        transactionId: data.transactionId || null,
        originalTransactionId: data.originalTransactionId || null,
        webOrderLineItemId: data.webOrderLineItemId || null
      };
    
    case 'google':
      return {
        purchaseToken: data.purchaseToken || null,
        orderId: data.orderId || null
      };
    
    default:
      return {};
  }
}

/**
 * Obtiene todas las suscripciones activas de un usuario
 */
export async function getActiveSubscriptions(userId) {
  try {
    const snapshot = await db.collection(`users/${userId}/subscriptions`)
      .where('status', '==', 'active')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error('❌ Error obteniendo suscripciones activas:', error);
    return [];
  }
}

/**
 * Obtiene la suscripción de mayor nivel de un usuario (para planners)
 */
export async function getHighestTierSubscription(userId) {
  try {
    const subscriptions = await getActiveSubscriptions(userId);

    if (subscriptions.length === 0) {
      return null;
    }

    // Ordenar por tier (unlimited > teams40 > pack15 > pack5)
    const tierOrder = [
      'teams_unlimited_monthly',
      'teams_unlimited_annual',
      'teams40_monthly',
      'teams40_annual',
      'planner_pack15_monthly',
      'planner_pack15_annual',
      'planner_pack5_monthly',
      'planner_pack5_annual'
    ];

    subscriptions.sort((a, b) => {
      const indexA = tierOrder.indexOf(a.productId);
      const indexB = tierOrder.indexOf(b.productId);
      return indexA - indexB;
    });

    return subscriptions[0];

  } catch (error) {
    console.error('❌ Error obteniendo suscripción de mayor nivel:', error);
    return null;
  }
}

/**
 * Verifica si un usuario tiene una suscripción activa
 */
export async function hasActiveSubscription(userId) {
  const subscriptions = await getActiveSubscriptions(userId);
  return subscriptions.length > 0;
}

/**
 * Cancela una suscripción (marca como cancelada pero sigue activa hasta fin de periodo)
 */
export async function cancelSubscription(userId, subscriptionId) {
  try {
    await db.doc(`users/${userId}/subscriptions/${subscriptionId}`).update({
      status: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log(`✅ Suscripción cancelada: ${subscriptionId}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error cancelando suscripción:', error);
    throw error;
  }
}

/**
 * Expira suscripciones que han pasado su currentPeriodEnd
 * Debe ejecutarse periódicamente (ej: Cloud Function cada hora)
 */
export async function expireOldSubscriptions() {
  try {
    const now = new Date();
    
    // Buscar suscripciones activas que ya expiraron
    const snapshot = await db.collectionGroup('subscriptions')
      .where('status', 'in', ['active', 'cancelled'])
      .where('currentPeriodEnd', '<', now)
      .get();

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'expired',
        expiredAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`✅ ${count} suscripciones expiradas`);
    }

    return { expired: count };

  } catch (error) {
    console.error('❌ Error expirando suscripciones:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de suscripciones por plataforma
 */
export async function getSubscriptionStats() {
  try {
    const snapshot = await db.collectionGroup('subscriptions').get();

    const stats = {
      total: snapshot.size,
      byPlatform: {
        stripe: 0,
        apple: 0,
        google: 0
      },
      byStatus: {
        active: 0,
        cancelled: 0,
        expired: 0,
        past_due: 0,
        paused: 0,
        refunded: 0
      }
    };

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.platform) {
        stats.byPlatform[data.platform]++;
      }
      
      if (data.status) {
        stats.byStatus[data.status]++;
      }
    });

    return stats;

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return null;
  }
}
