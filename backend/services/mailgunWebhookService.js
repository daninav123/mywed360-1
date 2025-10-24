/**
 * Servicio de Procesamiento de Webhooks de Mailgun
 * 
 * Maneja eventos de entregabilidad: delivered, failed, opened, clicked, etc.
 * Actualiza métricas y dispara alertas cuando es necesario.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../db.js';

const DELIVERABILITY_COLLECTION = 'emailDeliverability';
const ALERTS_COLLECTION = 'emailAlerts';
const BOUNCE_RATE_THRESHOLD = 0.05; // 5%
const COMPLAINT_RATE_THRESHOLD = 0.005; // 0.5%

/**
 * Encuentra un email por su messageId de Mailgun
 */
async function findEmailByMessageId(messageId) {
  if (!messageId) return null;
  
  const normalized = String(messageId).trim().toLowerCase().replace(/^<|>$/g, '');
  
  try {
    // Buscar en colección global mails
    const snapshot = await db.collection('mails')
      .where('messageId', '==', normalized)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    
    // Si no está en global, buscar en subcolecciones de usuarios
    // (esto es más lento, solo como fallback)
    const usersSnapshot = await db.collection('users').limit(100).get();
    
    for (const userDoc of usersSnapshot.docs) {
      const mailsSnapshot = await db.collection('users')
        .doc(userDoc.id)
        .collection('mails')
        .where('messageId', '==', normalized)
        .limit(1)
        .get();
      
      if (!mailsSnapshot.empty) {
        const doc = mailsSnapshot.docs[0];
        return { id: doc.id, uid: userDoc.id, ...doc.data() };
      }
    }
  } catch (error) {
    console.error('[mailgunWebhookService] Error buscando email:', error);
  }
  
  return null;
}

/**
 * Marca un email como entregado correctamente
 */
export async function markEmailDelivered(messageId, recipient, timestamp, metadata = {}) {
  try {
    const normalizedId = String(messageId).trim().toLowerCase().replace(/^<|>$/g, '');
    
    console.log('[mailgunWebhookService] markEmailDelivered', {
      messageId: normalizedId,
      recipient,
      timestamp,
    });

    // Actualizar colección de entregabilidad
    await db.collection(DELIVERABILITY_COLLECTION).doc(normalizedId).set({
      messageId: normalizedId,
      status: 'delivered',
      recipient,
      deliveredAt: timestamp,
      events: FieldValue.arrayUnion({
        type: 'delivered',
        timestamp,
        recipient,
        ...metadata,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Actualizar analytics del email original
    const email = await findEmailByMessageId(normalizedId);
    
    if (email) {
      const updates = {
        'analytics.delivered': true,
        'analytics.deliveredAt': timestamp,
        'analytics.lastEventAt': timestamp,
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      // Actualizar en colección global
      await db.collection('mails').doc(email.id).update(updates);
      
      // Si tiene uid, actualizar también en subcolección
      if (email.uid || email.ownerUid) {
        const uid = email.uid || email.ownerUid;
        try {
          await db.collection('users').doc(uid).collection('mails').doc(email.id).update(updates);
        } catch (err) {
          console.warn('[mailgunWebhookService] No se pudo actualizar subcolección:', err.message);
        }
      }
      
      console.log('[mailgunWebhookService] Email analytics actualizado:', email.id);
    }

    return { success: true, messageId: normalizedId };
  } catch (error) {
    console.error('[mailgunWebhookService] Error en markEmailDelivered:', error);
    throw error;
  }
}

/**
 * Marca un email como rebotado (bounce)
 */
export async function markEmailBounced(messageId, recipient, reason, severity = 'temporary', metadata = {}) {
  try {
    const normalizedId = String(messageId).trim().toLowerCase().replace(/^<|>$/g, '');
    
    console.log('[mailgunWebhookService] markEmailBounced', {
      messageId: normalizedId,
      recipient,
      reason,
      severity,
    });

    // Actualizar colección de entregabilidad
    await db.collection(DELIVERABILITY_COLLECTION).doc(normalizedId).set({
      messageId: normalizedId,
      status: severity === 'permanent' ? 'failed_permanent' : 'failed_temporary',
      recipient,
      bouncedAt: metadata.timestamp || new Date().toISOString(),
      bounceReason: reason,
      bounceSeverity: severity,
      events: FieldValue.arrayUnion({
        type: 'bounced',
        timestamp: metadata.timestamp || new Date().toISOString(),
        recipient,
        reason,
        severity,
        ...metadata,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Actualizar analytics del email original
    const email = await findEmailByMessageId(normalizedId);
    
    if (email) {
      const updates = {
        'analytics.bounces': FieldValue.increment(1),
        'analytics.lastEventAt': metadata.timestamp || new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      if (severity === 'permanent') {
        updates['analytics.failed'] = true;
        updates['analytics.failureReason'] = reason;
      }
      
      await db.collection('mails').doc(email.id).update(updates);
      
      if (email.uid || email.ownerUid) {
        const uid = email.uid || email.ownerUid;
        try {
          await db.collection('users').doc(uid).collection('mails').doc(email.id).update(updates);
        } catch (err) {
          console.warn('[mailgunWebhookService] No se pudo actualizar subcolección:', err.message);
        }
      }
    }

    // Verificar si necesitamos crear alerta
    await checkBounceRateAlert();

    return { success: true, messageId: normalizedId };
  } catch (error) {
    console.error('[mailgunWebhookService] Error en markEmailBounced:', error);
    throw error;
  }
}

/**
 * Marca un email como abierto (opened)
 */
export async function markEmailOpened(messageId, recipient, timestamp, metadata = {}) {
  try {
    const normalizedId = String(messageId).trim().toLowerCase().replace(/^<|>$/g, '');
    
    console.log('[mailgunWebhookService] markEmailOpened', {
      messageId: normalizedId,
      recipient,
    });

    // Actualizar colección de entregabilidad
    await db.collection(DELIVERABILITY_COLLECTION).doc(normalizedId).set({
      messageId: normalizedId,
      events: FieldValue.arrayUnion({
        type: 'opened',
        timestamp,
        recipient,
        ...metadata,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Actualizar analytics del email original
    const email = await findEmailByMessageId(normalizedId);
    
    if (email) {
      const updates = {
        'analytics.opens': FieldValue.increment(1),
        'analytics.lastEventAt': timestamp,
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await db.collection('mails').doc(email.id).update(updates);
      
      if (email.uid || email.ownerUid) {
        const uid = email.uid || email.ownerUid;
        try {
          await db.collection('users').doc(uid).collection('mails').doc(email.id).update(updates);
        } catch (err) {
          // Ignorar si no existe
        }
      }
    }

    return { success: true, messageId: normalizedId };
  } catch (error) {
    console.error('[mailgunWebhookService] Error en markEmailOpened:', error);
    throw error;
  }
}

/**
 * Marca un email con click en algún enlace
 */
export async function markEmailClicked(messageId, recipient, url, timestamp, metadata = {}) {
  try {
    const normalizedId = String(messageId).trim().toLowerCase().replace(/^<|>$/g, '');
    
    // Actualizar colección de entregabilidad
    await db.collection(DELIVERABILITY_COLLECTION).doc(normalizedId).set({
      messageId: normalizedId,
      events: FieldValue.arrayUnion({
        type: 'clicked',
        timestamp,
        recipient,
        url,
        ...metadata,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Actualizar analytics del email original
    const email = await findEmailByMessageId(normalizedId);
    
    if (email) {
      const updates = {
        'analytics.clicks': FieldValue.increment(1),
        'analytics.lastEventAt': timestamp,
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await db.collection('mails').doc(email.id).update(updates);
      
      if (email.uid || email.ownerUid) {
        const uid = email.uid || email.ownerUid;
        try {
          await db.collection('users').doc(uid).collection('mails').doc(email.id).update(updates);
        } catch (err) {
          // Ignorar
        }
      }
    }

    return { success: true, messageId: normalizedId };
  } catch (error) {
    console.error('[mailgunWebhookService] Error en markEmailClicked:', error);
    throw error;
  }
}

/**
 * Marca un email como queja/spam (complained)
 */
export async function markEmailComplained(messageId, recipient, timestamp, metadata = {}) {
  try {
    const normalizedId = String(messageId).trim().toLowerCase().replace(/^<|>$/g, '');
    
    console.log('[mailgunWebhookService] markEmailComplained', {
      messageId: normalizedId,
      recipient,
    });

    // Actualizar colección de entregabilidad
    await db.collection(DELIVERABILITY_COLLECTION).doc(normalizedId).set({
      messageId: normalizedId,
      status: 'complained',
      complainedAt: timestamp,
      events: FieldValue.arrayUnion({
        type: 'complained',
        timestamp,
        recipient,
        ...metadata,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Actualizar analytics del email original
    const email = await findEmailByMessageId(normalizedId);
    
    if (email) {
      const updates = {
        'analytics.complaints': FieldValue.increment(1),
        'analytics.lastEventAt': timestamp,
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await db.collection('mails').doc(email.id).update(updates);
      
      if (email.uid || email.ownerUid) {
        const uid = email.uid || email.ownerUid;
        try {
          await db.collection('users').doc(uid).collection('mails').doc(email.id).update(updates);
        } catch (err) {
          // Ignorar
        }
      }
    }

    // Verificar si necesitamos crear alerta
    await checkComplaintRateAlert();

    return { success: true, messageId: normalizedId };
  } catch (error) {
    console.error('[mailgunWebhookService] Error en markEmailComplained:', error);
    throw error;
  }
}

/**
 * Calcula la tasa de rebotes de las últimas 24h
 */
async function calculateBounceRate() {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // Contar total de emails enviados
    const sentSnapshot = await db.collection('mails')
      .where('folder', '==', 'sent')
      .where('createdAt', '>=', oneDayAgo.toISOString())
      .count()
      .get();
    
    const totalSent = sentSnapshot.data().count || 0;
    
    if (totalSent === 0) return 0;
    
    // Contar bounces
    const bouncedSnapshot = await db.collection(DELIVERABILITY_COLLECTION)
      .where('bouncedAt', '>=', oneDayAgo.toISOString())
      .count()
      .get();
    
    const totalBounced = bouncedSnapshot.data().count || 0;
    
    return totalBounced / totalSent;
  } catch (error) {
    console.error('[mailgunWebhookService] Error calculando bounce rate:', error);
    return 0;
  }
}

/**
 * Calcula la tasa de quejas de las últimas 24h
 */
async function calculateComplaintRate() {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const sentSnapshot = await db.collection('mails')
      .where('folder', '==', 'sent')
      .where('createdAt', '>=', oneDayAgo.toISOString())
      .count()
      .get();
    
    const totalSent = sentSnapshot.data().count || 0;
    
    if (totalSent === 0) return 0;
    
    const complainedSnapshot = await db.collection(DELIVERABILITY_COLLECTION)
      .where('complainedAt', '>=', oneDayAgo.toISOString())
      .count()
      .get();
    
    const totalComplained = complainedSnapshot.data().count || 0;
    
    return totalComplained / totalSent;
  } catch (error) {
    console.error('[mailgunWebhookService] Error calculando complaint rate:', error);
    return 0;
  }
}

/**
 * Verifica si la tasa de rebotes excede el umbral y crea alerta
 */
async function checkBounceRateAlert() {
  try {
    const bounceRate = await calculateBounceRate();
    
    if (bounceRate > BOUNCE_RATE_THRESHOLD) {
      console.warn('[mailgunWebhookService] ⚠️ ALERTA: Tasa de rebotes alta:', bounceRate);
      
      await createAlert({
        type: 'high_bounce_rate',
        severity: 'warning',
        value: bounceRate,
        threshold: BOUNCE_RATE_THRESHOLD,
        message: `Tasa de rebotes (${(bounceRate * 100).toFixed(2)}%) excede el umbral (${(BOUNCE_RATE_THRESHOLD * 100)}%)`,
        recommendedAction: 'Revisar lista de destinatarios y calidad de emails',
      });
    }
  } catch (error) {
    console.error('[mailgunWebhookService] Error verificando bounce rate alert:', error);
  }
}

/**
 * Verifica si la tasa de quejas excede el umbral y crea alerta
 */
async function checkComplaintRateAlert() {
  try {
    const complaintRate = await calculateComplaintRate();
    
    if (complaintRate > COMPLAINT_RATE_THRESHOLD) {
      console.warn('[mailgunWebhookService] ⚠️ ALERTA: Tasa de quejas alta:', complaintRate);
      
      await createAlert({
        type: 'high_complaint_rate',
        severity: 'critical',
        value: complaintRate,
        threshold: COMPLAINT_RATE_THRESHOLD,
        message: `Tasa de quejas (${(complaintRate * 100).toFixed(3)}%) excede el umbral (${(COMPLAINT_RATE_THRESHOLD * 100)}%)`,
        recommendedAction: 'URGENTE: Revisar contenido de emails y lista de opt-out. Riesgo de bloqueo de dominio.',
      });
    }
  } catch (error) {
    console.error('[mailgunWebhookService] Error verificando complaint rate alert:', error);
  }
}

/**
 * Crea una alerta en Firestore
 */
async function createAlert(alertData) {
  try {
    const alert = {
      ...alertData,
      createdAt: FieldValue.serverTimestamp(),
      status: 'active',
      acknowledgedAt: null,
      resolvedAt: null,
    };
    
    await db.collection(ALERTS_COLLECTION).add(alert);
    
    console.log('[mailgunWebhookService] Alerta creada:', alertData.type);
    
    // TODO: Enviar notificación a Slack/Email/etc.
    // await sendSlackNotification(alert);
    // await sendEmailNotification(alert);
    
    return alert;
  } catch (error) {
    console.error('[mailgunWebhookService] Error creando alerta:', error);
  }
}

/**
 * Obtiene estadísticas de entregabilidad
 */
export async function getDeliverabilityStats(days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const snapshot = await db.collection(DELIVERABILITY_COLLECTION)
      .where('updatedAt', '>=', startDate)
      .get();
    
    const stats = {
      total: snapshot.size,
      delivered: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      complained: 0,
      failed: 0,
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.status === 'delivered') stats.delivered++;
      if (data.status === 'complained') stats.complained++;
      if (data.status && data.status.startsWith('failed')) {
        stats.failed++;
        stats.bounced++;
      }
      
      if (data.events && Array.isArray(data.events)) {
        data.events.forEach(event => {
          if (event.type === 'opened') stats.opened++;
          if (event.type === 'clicked') stats.clicked++;
        });
      }
    });
    
    return {
      period: `${days} days`,
      ...stats,
      rates: {
        deliveryRate: stats.total > 0 ? stats.delivered / stats.total : 0,
        bounceRate: stats.total > 0 ? stats.bounced / stats.total : 0,
        openRate: stats.delivered > 0 ? stats.opened / stats.delivered : 0,
        clickRate: stats.delivered > 0 ? stats.clicked / stats.delivered : 0,
        complaintRate: stats.total > 0 ? stats.complained / stats.total : 0,
      },
    };
  } catch (error) {
    console.error('[mailgunWebhookService] Error obteniendo stats:', error);
    throw error;
  }
}

export default {
  markEmailDelivered,
  markEmailBounced,
  markEmailOpened,
  markEmailClicked,
  markEmailComplained,
  getDeliverabilityStats,
};
