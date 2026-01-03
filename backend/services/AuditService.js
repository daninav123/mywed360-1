/**
 * Servicio de auditoría para acciones sensibles
 * Registra y monitoriza todas las acciones críticas del sistema
 */

import { db } from '../firebase-admin.js';
import logger from '../utils/logger.js';

class AuditService {
  constructor() {
    this.auditCollection = 'audit_logs';
    this.sensibleActions = [
      'delete_user',
      'delete_wedding',
      'delete_supplier',
      'modify_permissions',
      'access_sensitive_data',
      'export_data',
      'modify_payment',
      'modify_subscription',
      'admin_action',
      'security_event',
    ];
  }

  /**
   * Registrar acción de auditoría
   */
  async logAction(action, details = {}) {
    try {
      const auditEntry = {
        action,
        timestamp: new Date().toISOString(),
        userId: details.userId,
        userRole: details.userRole,
        userEmail: details.userEmail,
        resourceType: details.resourceType,
        resourceId: details.resourceId,
        changes: details.changes || {},
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        status: details.status || 'success',
        error: details.error || null,
        metadata: details.metadata || {},
      };

      // Guardar en Firestore
      const docRef = await db.collection(this.auditCollection).add(auditEntry);

      logger.info('Audit log created', {
        action,
        auditId: docRef.id,
        userId: details.userId,
      });

      // Si es acción sensible, registrar también en logs
      if (this.sensibleActions.includes(action)) {
        logger.warn(`🔐 SENSITIVE ACTION: ${action}`, {
          auditId: docRef.id,
          ...auditEntry,
        });
      }

      return {
        success: true,
        auditId: docRef.id,
      };
    } catch (error) {
      logger.error('Error logging audit action', {
        action,
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Registrar acceso a datos sensibles
   */
  async logDataAccess(userId, dataType, resourceId, details = {}) {
    return this.logAction('access_sensitive_data', {
      userId,
      resourceType: dataType,
      resourceId,
      ...details,
    });
  }

  /**
   * Registrar cambio de permisos
   */
  async logPermissionChange(userId, targetUserId, oldPermissions, newPermissions, details = {}) {
    return this.logAction('modify_permissions', {
      userId,
      resourceType: 'user_permissions',
      resourceId: targetUserId,
      changes: {
        old: oldPermissions,
        new: newPermissions,
      },
      ...details,
    });
  }

  /**
   * Registrar eliminación de usuario
   */
  async logUserDeletion(userId, deletedUserId, reason, details = {}) {
    return this.logAction('delete_user', {
      userId,
      resourceType: 'user',
      resourceId: deletedUserId,
      metadata: { reason },
      ...details,
    });
  }

  /**
   * Registrar eliminación de boda
   */
  async logWeddingDeletion(userId, weddingId, reason, details = {}) {
    return this.logAction('delete_wedding', {
      userId,
      resourceType: 'wedding',
      resourceId: weddingId,
      metadata: { reason },
      ...details,
    });
  }

  /**
   * Registrar cambio de pago
   */
  async logPaymentModification(userId, paymentId, changes, details = {}) {
    return this.logAction('modify_payment', {
      userId,
      resourceType: 'payment',
      resourceId: paymentId,
      changes,
      ...details,
    });
  }

  /**
   * Registrar evento de seguridad
   */
  async logSecurityEvent(eventType, severity, details = {}) {
    return this.logAction('security_event', {
      metadata: {
        eventType,
        severity,
      },
      ...details,
    });
  }

  /**
   * Registrar acción de administrador
   */
  async logAdminAction(userId, actionType, targetId, changes, details = {}) {
    return this.logAction('admin_action', {
      userId,
      resourceType: actionType,
      resourceId: targetId,
      changes,
      ...details,
    });
  }

  /**
   * Obtener logs de auditoría de un usuario
   */
  async getUserAuditLogs(userId, limit = 100) {
    try {
      const snapshot = await db
        .collection(this.auditCollection)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const logs = [];
      snapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return {
        success: true,
        logs,
        count: logs.length,
      };
    } catch (error) {
      logger.error('Error fetching user audit logs', {
        userId,
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener logs de auditoría de un recurso
   */
  async getResourceAuditLogs(resourceType, resourceId, limit = 100) {
    try {
      const snapshot = await db
        .collection(this.auditCollection)
        .where('resourceType', '==', resourceType)
        .where('resourceId', '==', resourceId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const logs = [];
      snapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return {
        success: true,
        logs,
        count: logs.length,
      };
    } catch (error) {
      logger.error('Error fetching resource audit logs', {
        resourceType,
        resourceId,
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener logs de acciones sensibles
   */
  async getSensitiveActionLogs(limit = 100) {
    try {
      const snapshot = await db
        .collection(this.auditCollection)
        .where('action', 'in', this.sensibleActions)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const logs = [];
      snapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return {
        success: true,
        logs,
        count: logs.length,
      };
    } catch (error) {
      logger.error('Error fetching sensitive action logs', {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener resumen de auditoría
   */
  async getAuditSummary(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const snapshot = await db
        .collection(this.auditCollection)
        .where('timestamp', '>=', startDate.toISOString())
        .get();

      const summary = {
        totalActions: 0,
        actionsByType: {},
        actionsByUser: {},
        sensitiveActions: 0,
        errors: 0,
      };

      snapshot.forEach((doc) => {
        const data = doc.data();
        summary.totalActions++;

        // Contar por tipo de acción
        summary.actionsByType[data.action] = (summary.actionsByType[data.action] || 0) + 1;

        // Contar por usuario
        if (data.userId) {
          summary.actionsByUser[data.userId] = (summary.actionsByUser[data.userId] || 0) + 1;
        }

        // Contar acciones sensibles
        if (this.sensibleActions.includes(data.action)) {
          summary.sensitiveActions++;
        }

        // Contar errores
        if (data.status === 'error') {
          summary.errors++;
        }
      });

      return {
        success: true,
        summary,
        period: `${days} days`,
      };
    } catch (error) {
      logger.error('Error generating audit summary', {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Detectar actividad anómala
   */
  async detectAnomalousActivity(userId, threshold = 10) {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const snapshot = await db
        .collection(this.auditCollection)
        .where('userId', '==', userId)
        .where('timestamp', '>=', oneHourAgo.toISOString())
        .get();

      const activityCount = snapshot.size;

      if (activityCount > threshold) {
        logger.warn('🚨 Anomalous activity detected', {
          userId,
          activityCount,
          threshold,
        });

        // Registrar evento de seguridad
        await this.logSecurityEvent('anomalous_activity', 'warning', {
          userId,
          activityCount,
          threshold,
        });

        return {
          anomalous: true,
          activityCount,
          threshold,
        };
      }

      return {
        anomalous: false,
        activityCount,
        threshold,
      };
    } catch (error) {
      logger.error('Error detecting anomalous activity', {
        userId,
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Exportar logs de auditoría
   */
  async exportAuditLogs(filters = {}, format = 'json') {
    try {
      let query = db.collection(this.auditCollection);

      // Aplicar filtros
      if (filters.userId) {
        query = query.where('userId', '==', filters.userId);
      }
      if (filters.action) {
        query = query.where('action', '==', filters.action);
      }
      if (filters.startDate) {
        query = query.where('timestamp', '>=', filters.startDate);
      }
      if (filters.endDate) {
        query = query.where('timestamp', '<=', filters.endDate);
      }

      const snapshot = await query.orderBy('timestamp', 'desc').get();

      const logs = [];
      snapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      if (format === 'csv') {
        return this.convertToCSV(logs);
      }

      return {
        success: true,
        logs,
        count: logs.length,
      };
    } catch (error) {
      logger.error('Error exporting audit logs', {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Convertir logs a CSV
   */
  convertToCSV(logs) {
    if (logs.length === 0) {
      return 'No logs to export';
    }

    const headers = Object.keys(logs[0]);
    const csv = [headers.join(',')];

    logs.forEach((log) => {
      const row = headers.map((header) => {
        const value = log[header];
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return `"${value}"`;
      });
      csv.push(row.join(','));
    });

    return csv.join('\n');
  }

  /**
   * Limpiar logs antiguos (retención de 90 días)
   */
  async cleanupOldLogs(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const snapshot = await db
        .collection(this.auditCollection)
        .where('timestamp', '<', cutoffDate.toISOString())
        .get();

      let deletedCount = 0;
      const batch = db.batch();

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();

      logger.info('Audit logs cleanup completed', {
        deletedCount,
        retentionDays,
      });

      return {
        success: true,
        deletedCount,
      };
    } catch (error) {
      logger.error('Error cleaning up audit logs', {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Singleton instance
let instance = null;

export function getAuditService() {
  if (!instance) {
    instance = new AuditService();
  }
  return instance;
}

export default AuditService;
