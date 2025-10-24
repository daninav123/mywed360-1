// backend/services/FallbackMonitor.js
// Sistema de monitoreo de fallbacks para detectar problemas en servicios externos

import { db } from '../db.js';
import logger from '../logger.js';

/**
 * Configuración de umbrales por servicio
 * maxPerHour: Máximo de fallbacks permitidos por hora antes de generar alerta
 * severity: Nivel de severidad de la alerta (critical, high, medium, low)
 */
const DEFAULT_THRESHOLDS = {
  'ai-suppliers': { maxPerHour: 5, severity: 'medium', category: 'AI Services' },
  'firebase-auth': { maxPerHour: 1, severity: 'critical', category: 'Authentication' },
  'firebase-firestore': { maxPerHour: 3, severity: 'high', category: 'Database' },
  'email-service': { maxPerHour: 10, severity: 'medium', category: 'Email' },
  'mailgun-api': { maxPerHour: 8, severity: 'medium', category: 'Email' },
  'openai-api': { maxPerHour: 3, severity: 'high', category: 'AI Services' },
  'image-generation': { maxPerHour: 5, severity: 'medium', category: 'AI Services' },
  'whatsapp-api': { maxPerHour: 10, severity: 'medium', category: 'Messaging' },
  'payment-gateway': { maxPerHour: 2, severity: 'critical', category: 'Payments' },
  'default': { maxPerHour: 10, severity: 'medium', category: 'System' },
};

class FallbackMonitor {
  constructor() {
    this.thresholds = DEFAULT_THRESHOLDS;
  }

  /**
   * Registra activación de fallback y verifica si debe generar alerta
   * @param {string} service - Nombre del servicio que activó fallback
   * @param {object} context - Contexto del error
   */
  async logFallback(service, context = {}) {
    const timestamp = new Date();
    const fallbackDoc = {
      service,
      timestamp,
      userId: context.userId || 'anonymous',
      error: context.error || 'unknown',
      errorMessage: context.errorMessage || '',
      userAgent: context.userAgent || '',
      location: context.location || '',
      endpoint: context.endpoint || '',
      metadata: context.metadata || {},
      createdAt: timestamp,
    };

    try {
      // Guardar en colección de logs de fallback
      await db.collection('fallbackLogs').add(fallbackDoc);
      logger.info(`[FallbackMonitor] Fallback logged: ${service}`, {
        userId: fallbackDoc.userId,
        error: fallbackDoc.error,
      });

      // Verificar si excede umbral y debe generar alerta
      const recentCount = await this.getRecentFallbackCount(service, 60);
      const threshold = this.thresholds[service] || this.thresholds.default;

      if (recentCount >= threshold.maxPerHour) {
        await this.createOrUpdateAlert(service, recentCount, threshold);
      }

      return { success: true, count: recentCount };
    } catch (error) {
      logger.error('[FallbackMonitor] Failed to log fallback', {
        service,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Obtiene número de fallbacks recientes para un servicio
   * @param {string} service - Nombre del servicio
   * @param {number} minutes - Ventana de tiempo en minutos
   */
  async getRecentFallbackCount(service, minutes = 60) {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000);
      const snapshot = await db
        .collection('fallbackLogs')
        .where('service', '==', service)
        .where('timestamp', '>=', since)
        .get();

      return snapshot.size;
    } catch (error) {
      logger.error('[FallbackMonitor] Failed to get recent count', {
        service,
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Crea o actualiza alerta en panel de admin
   * @param {string} service - Nombre del servicio
   * @param {number} count - Número de fallbacks
   * @param {object} threshold - Configuración de umbral
   */
  async createOrUpdateAlert(service, count, threshold) {
    try {
      const alertId = `fallback-${service}`;
      const threshold_config = this.thresholds[service] || this.thresholds.default;

      // Buscar si ya existe alerta activa para este servicio
      const existingAlerts = await db
        .collection('adminAlerts')
        .where('alertId', '==', alertId)
        .where('resolved', '==', false)
        .limit(1)
        .get();

      const actions = this.getRecommendedActions(service);
      const now = new Date();

      if (!existingAlerts.empty) {
        // Actualizar alerta existente
        const doc = existingAlerts.docs[0];
        await doc.ref.update({
          count,
          lastOccurrence: now,
          message: `Servicio "${service}" ha activado fallback ${count} veces en la última hora (umbral: ${threshold.maxPerHour})`,
          updatedAt: now,
        });

        logger.info(`[FallbackMonitor] Alert updated: ${service}`, { count });
      } else {
        // Crear nueva alerta
        const alert = {
          alertId,
          type: 'fallback',
          service,
          module: threshold_config.category || 'System',
          severity: threshold.severity,
          message: `Servicio "${service}" ha activado fallback ${count} veces en la última hora`,
          count,
          threshold: threshold.maxPerHour,
          timestamp: now.toISOString(),
          lastOccurrence: now,
          resolved: false,
          actions,
          metadata: {
            service,
            category: threshold_config.category,
          },
          createdAt: now,
          updatedAt: now,
        };

        await db.collection('adminAlerts').add(alert);
        logger.warn(`[FallbackMonitor] New alert created: ${service}`, {
          severity: threshold.severity,
          count,
        });
      }

      // Notificación crítica adicional
      if (threshold.severity === 'critical') {
        await this.notifyCriticalAlert(service, count);
      }
    } catch (error) {
      logger.error('[FallbackMonitor] Failed to create/update alert', {
        service,
        error: error.message,
      });
    }
  }

  /**
   * Obtiene acciones recomendadas según el servicio
   * @param {string} service - Nombre del servicio
   */
  getRecommendedActions(service) {
    const actionsByService = {
      'ai-suppliers': [
        'Verificar estado de OpenAI API en status.openai.com',
        'Revisar logs del backend para errores de API key',
        'Verificar cuota disponible en OpenAI dashboard',
        'Comprobar conectividad: curl https://api.openai.com',
        'Considerar aumentar rate limits o cambiar a plan superior',
      ],
      'firebase-auth': [
        '🚨 CRÍTICO: Verificar configuración Firebase inmediatamente',
        'Revisar reglas de seguridad en Firebase Console',
        'Verificar cuotas de Firebase (Authentication usage)',
        'Comprobar service account credentials en servidor',
        'Revisar logs de Firebase Console para errores',
      ],
      'firebase-firestore': [
        'Verificar reglas de Firestore en Firebase Console',
        'Revisar cuotas y límites de Firestore',
        'Comprobar índices compuestos requeridos',
        'Verificar conectividad con Firestore',
      ],
      'email-service': [
        'Verificar estado de Mailgun en status.mailgun.com',
        'Revisar API key de Mailgun en configuración',
        'Comprobar cuotas de envío en Mailgun dashboard',
        'Verificar configuración de dominio y DNS',
      ],
      'openai-api': [
        'Verificar estado del servicio en status.openai.com',
        'Revisar límites de rate limit alcanzados',
        'Comprobar validez de API key',
        'Verificar cuota disponible en cuenta OpenAI',
      ],
      'payment-gateway': [
        '🚨 CRÍTICO: Pagos afectados, atención inmediata',
        'Verificar estado de Stripe/gateway de pago',
        'Revisar configuración de webhook de pagos',
        'Comprobar credenciales de API del gateway',
      ],
    };

    return (
      actionsByService[service] || [
        'Revisar logs del servicio en backend',
        'Verificar configuración y credenciales',
        'Comprobar conectividad de red',
        'Revisar documentación del servicio externo',
      ]
    );
  }

  /**
   * Notifica alertas críticas al equipo
   * @param {string} service - Nombre del servicio
   * @param {number} count - Número de fallbacks
   */
  async notifyCriticalAlert(service, count) {
    // TODO: Implementar notificación Slack
    // TODO: Implementar email al equipo técnico
    logger.error(`[FallbackMonitor] 🚨 CRITICAL ALERT: ${service}`, {
      count,
      message: `Servicio crítico ${service} ha fallado ${count} veces`,
    });
  }

  /**
   * Obtiene estadísticas de fallbacks para dashboard
   * @param {number} hours - Ventana de tiempo en horas
   */
  async getStats(hours = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const snapshot = await db
        .collection('fallbackLogs')
        .where('timestamp', '>=', since)
        .orderBy('timestamp', 'desc')
        .get();

      const stats = {};
      const usersByService = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const service = data.service;

        if (!stats[service]) {
          stats[service] = {
            count: 0,
            users: new Set(),
            errors: {},
            lastError: null,
            lastTimestamp: null,
          };
        }

        stats[service].count++;

        // Rastrear usuarios únicos
        if (data.userId && data.userId !== 'anonymous') {
          stats[service].users.add(data.userId);
        }

        // Contar errores por tipo
        const errorKey = data.error || 'unknown';
        stats[service].errors[errorKey] = (stats[service].errors[errorKey] || 0) + 1;

        // Guardar último error
        if (
          !stats[service].lastTimestamp ||
          data.timestamp > stats[service].lastTimestamp
        ) {
          stats[service].lastError = data.errorMessage || data.error;
          stats[service].lastTimestamp = data.timestamp;
        }
      });

      // Convertir Sets a números para serialización
      const result = {};
      Object.keys(stats).forEach((service) => {
        result[service] = {
          ...stats[service],
          uniqueUsers: stats[service].users.size,
          users: undefined, // Eliminar Set
          threshold: this.thresholds[service]?.maxPerHour || this.thresholds.default.maxPerHour,
          severity: this.thresholds[service]?.severity || this.thresholds.default.severity,
        };
        delete result[service].users;
      });

      return result;
    } catch (error) {
      logger.error('[FallbackMonitor] Failed to get stats', {
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Resuelve alerta de fallback
   * @param {string} alertId - ID de la alerta
   * @param {string} notes - Notas de resolución
   */
  async resolveAlert(alertId, notes = '') {
    try {
      const snapshot = await db
        .collection('adminAlerts')
        .where('alertId', '==', alertId)
        .where('resolved', '==', false)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return { success: false, error: 'Alert not found' };
      }

      const doc = snapshot.docs[0];
      await doc.ref.update({
        resolved: true,
        resolvedAt: new Date(),
        resolvedNotes: notes,
        updatedAt: new Date(),
      });

      logger.info(`[FallbackMonitor] Alert resolved: ${alertId}`, { notes });
      return { success: true };
    } catch (error) {
      logger.error('[FallbackMonitor] Failed to resolve alert', {
        alertId,
        error: error.message,
      });
      throw error;
    }
  }
}

// Singleton
export const fallbackMonitor = new FallbackMonitor();
export default fallbackMonitor;
