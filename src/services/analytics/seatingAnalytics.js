/**
 * Seating Analytics Service
 * Sistema de métricas y analytics para Seating Plan
 * Sprint 2 - Completar Seating Plan
 */

import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

/**
 * Eventos de analytics para Seating
 */
export const SEATING_EVENTS = {
  // Canvas interactions
  CANVAS_ZOOM: 'seating_canvas_zoom',
  CANVAS_PAN: 'seating_canvas_pan',
  CANVAS_RESET: 'seating_canvas_reset',
  
  // Table operations
  TABLE_CREATED: 'seating_table_created',
  TABLE_EDITED: 'seating_table_edited',
  TABLE_DELETED: 'seating_table_deleted',
  TABLE_MOVED: 'seating_table_moved',
  TABLE_ROTATED: 'seating_table_rotated',
  TABLE_DUPLICATED: 'seating_table_duplicated',
  
  // Guest operations
  GUEST_ASSIGNED: 'seating_guest_assigned',
  GUEST_MOVED: 'seating_guest_moved',
  GUEST_REMOVED: 'seating_guest_removed',
  GUEST_BULK_ASSIGN: 'seating_guest_bulk_assign',
  
  // Layout operations
  LAYOUT_CREATED: 'seating_layout_created',
  LAYOUT_LOADED: 'seating_layout_loaded',
  LAYOUT_SAVED: 'seating_layout_saved',
  LAYOUT_EXPORTED: 'seating_layout_exported',
  LAYOUT_RESET: 'seating_layout_reset',
  
  // Export operations
  EXPORT_PDF_GENERATED: 'seating_export_pdf',
  EXPORT_IMAGE_GENERATED: 'seating_export_image',
  EXPORT_EXCEL_GENERATED: 'seating_export_excel',
  EXPORT_CHECKIN_LIST: 'seating_export_checkin',
  
  // Collaboration
  COLLAB_SESSION_STARTED: 'seating_collab_started',
  COLLAB_SESSION_ENDED: 'seating_collab_ended',
  COLLAB_CONFLICT_RESOLVED: 'seating_collab_conflict',
  
  // Guest Sidebar
  GUEST_SIDEBAR_OPENED: 'seating_guest_sidebar_opened',
  GUEST_SIDEBAR_CLOSED: 'seating_guest_sidebar_closed',
  GUEST_SIDEBAR_ALERTS_VIEWED: 'seating_guest_sidebar_alerts',
  GUEST_SIDEBAR_RECOMMENDATIONS_VIEWED: 'seating_guest_sidebar_recommendations',
  GUEST_SIDEBAR_STAFF_VIEWED: 'seating_guest_sidebar_staff',
  
  // Mobile interactions
  MOBILE_FAB_OPENED: 'seating_mobile_fab_opened',
  MOBILE_PANEL_OPENED: 'seating_mobile_panel_opened',
  MOBILE_GESTURE_PINCH: 'seating_mobile_gesture_pinch',
  MOBILE_GESTURE_DOUBLE_TAP: 'seating_mobile_gesture_double_tap',
  
  // Recommendations
  RECOMMENDATION_ACCEPTED: 'seating_recommendation_accepted',
  RECOMMENDATION_REJECTED: 'seating_recommendation_rejected',
  RECOMMENDATION_GENERATED: 'seating_recommendation_generated',
  
  // Validation
  VALIDATION_RUN: 'seating_validation_run',
  VALIDATION_ERROR_FIXED: 'seating_validation_error_fixed',
  
  // Performance
  PERFORMANCE_SLOW_RENDER: 'seating_performance_slow_render',
  PERFORMANCE_LAG_DETECTED: 'seating_performance_lag',
};

/**
 * SeatingAnalytics Class
 */
class SeatingAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.eventQueue = [];
    this.flushInterval = null;
    this.isEnabled = true;
  }

  /**
   * Genera un ID único de sesión
   */
  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Habilita o deshabilita analytics
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Registra un evento
   */
  async trackEvent(eventName, properties = {}, userId = null, weddingId = null) {
    if (!this.isEnabled) return;

    try {
      const event = {
        eventName,
        properties: {
          ...properties,
          sessionId: this.sessionId,
          sessionDuration: Date.now() - this.sessionStartTime,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          platform: navigator.platform,
          language: navigator.language,
        },
        userId,
        weddingId,
        timestamp: serverTimestamp(),
        date: new Date().toISOString(),
      };

      // Añadir a cola
      this.eventQueue.push(event);

      // Flush si la cola es grande
      if (this.eventQueue.length >= 10) {
        await this.flush();
      }

      return event;
    } catch (error) {
      console.error('Error tracking event:', error);
      return null;
    }
  }

  /**
   * Flush eventos en cola
   */
  async flush() {
    if (this.eventQueue.length === 0) return;

    try {
      const batch = [...this.eventQueue];
      this.eventQueue = [];

      // Guardar en Firestore
      const promises = batch.map(event =>
        addDoc(collection(db, 'analytics', 'seating', 'events'), event)
      );

      await Promise.all(promises);
      
      console.log(`Flushed ${batch.length} analytics events`);
    } catch (error) {
      console.error('Error flushing analytics:', error);
      // Restaurar eventos si falló
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  /**
   * Inicia flush automático
   */
  startAutoFlush(intervalMs = 30000) {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    this.flushInterval = setInterval(() => {
      this.flush();
    }, intervalMs);
  }

  /**
   * Detiene flush automático
   */
  stopAutoFlush() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Trackea tiempo de ejecución de una función
   */
  async trackTiming(eventName, fn, properties = {}) {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      await this.trackEvent(eventName, {
        ...properties,
        duration,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      await this.trackEvent(eventName, {
        ...properties,
        duration,
        success: false,
        error: error.message,
      });
      
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de eventos
   */
  async getEventStats(weddingId, startDate, endDate) {
    try {
      const eventsRef = collection(db, 'analytics', 'seating', 'events');
      const q = query(
        eventsRef,
        where('weddingId', '==', weddingId),
        where('date', '>=', startDate.toISOString()),
        where('date', '<=', endDate.toISOString())
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => doc.data());

      // Calcular estadísticas
      const stats = {
        totalEvents: events.length,
        uniqueSessions: new Set(events.map(e => e.properties.sessionId)).size,
        eventsByType: {},
        averageDuration: 0,
        peakHours: {},
      };

      // Contar por tipo
      events.forEach(event => {
        stats.eventsByType[event.eventName] = 
          (stats.eventsByType[event.eventName] || 0) + 1;
        
        // Hora pico
        const hour = new Date(event.date).getHours();
        stats.peakHours[hour] = (stats.peakHours[hour] || 0) + 1;
      });

      // Calcular duración promedio de sesión
      const sessions = {};
      events.forEach(event => {
        const sessionId = event.properties.sessionId;
        if (!sessions[sessionId]) {
          sessions[sessionId] = [];
        }
        sessions[sessionId].push(event.properties.sessionDuration || 0);
      });

      const totalDuration = Object.values(sessions).reduce((sum, durations) => {
        return sum + Math.max(...durations);
      }, 0);
      
      stats.averageDuration = totalDuration / stats.uniqueSessions;

      return stats;
    } catch (error) {
      console.error('Error getting event stats:', error);
      return null;
    }
  }

  // ===== Métodos de conveniencia para eventos comunes =====

  trackTableCreated(userId, weddingId, tableType, capacity) {
    return this.trackEvent(SEATING_EVENTS.TABLE_CREATED, {
      tableType,
      capacity,
    }, userId, weddingId);
  }

  trackGuestAssigned(userId, weddingId, guestId, tableId, method = 'drag') {
    return this.trackEvent(SEATING_EVENTS.GUEST_ASSIGNED, {
      guestId,
      tableId,
      method, // 'drag', 'click', 'auto'
    }, userId, weddingId);
  }

  trackLayoutSaved(userId, weddingId, layoutType, tableCount, guestCount) {
    return this.trackEvent(SEATING_EVENTS.LAYOUT_SAVED, {
      layoutType,
      tableCount,
      guestCount,
    }, userId, weddingId);
  }

  trackExport(userId, weddingId, exportType, success = true) {
    return this.trackEvent(
      exportType === 'pdf' ? SEATING_EVENTS.EXPORT_PDF_GENERATED :
      exportType === 'image' ? SEATING_EVENTS.EXPORT_IMAGE_GENERATED :
      exportType === 'excel' ? SEATING_EVENTS.EXPORT_EXCEL_GENERATED :
      SEATING_EVENTS.EXPORT_CHECKIN_LIST,
      { exportType, success },
      userId,
      weddingId
    );
  }

  trackGesture(userId, weddingId, gestureType, device = 'mobile') {
    return this.trackEvent(
      gestureType === 'pinch' ? SEATING_EVENTS.MOBILE_GESTURE_PINCH :
      SEATING_EVENTS.MOBILE_GESTURE_DOUBLE_TAP,
      { gestureType, device },
      userId,
      weddingId
    );
  }

  trackSidebarAction(userId, weddingId, action, tab) {
    const eventName = 
      action === 'open' ? SEATING_EVENTS.GUEST_SIDEBAR_OPENED :
      action === 'close' ? SEATING_EVENTS.GUEST_SIDEBAR_CLOSED :
      tab === 'alerts' ? SEATING_EVENTS.GUEST_SIDEBAR_ALERTS_VIEWED :
      tab === 'recommendations' ? SEATING_EVENTS.GUEST_SIDEBAR_RECOMMENDATIONS_VIEWED :
      SEATING_EVENTS.GUEST_SIDEBAR_STAFF_VIEWED;

    return this.trackEvent(eventName, { action, tab }, userId, weddingId);
  }

  trackPerformance(userId, weddingId, metric, value) {
    return this.trackEvent(SEATING_EVENTS.PERFORMANCE_SLOW_RENDER, {
      metric,
      value,
    }, userId, weddingId);
  }
}

// Instancia singleton
const seatingAnalytics = new SeatingAnalytics();

// Auto-flush cada 30 segundos
seatingAnalytics.startAutoFlush(30000);

// Flush al cerrar la página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    seatingAnalytics.flush();
  });
}

export default seatingAnalytics;

/**
 * Hook de React para usar analytics
 */
export function useSeatingAnalytics(userId, weddingId) {
  const trackEvent = React.useCallback((eventName, properties = {}) => {
    return seatingAnalytics.trackEvent(eventName, properties, userId, weddingId);
  }, [userId, weddingId]);

  const trackTableCreated = React.useCallback((tableType, capacity) => {
    return seatingAnalytics.trackTableCreated(userId, weddingId, tableType, capacity);
  }, [userId, weddingId]);

  const trackGuestAssigned = React.useCallback((guestId, tableId, method) => {
    return seatingAnalytics.trackGuestAssigned(userId, weddingId, guestId, tableId, method);
  }, [userId, weddingId]);

  const trackLayoutSaved = React.useCallback((layoutType, tableCount, guestCount) => {
    return seatingAnalytics.trackLayoutSaved(userId, weddingId, layoutType, tableCount, guestCount);
  }, [userId, weddingId]);

  const trackExport = React.useCallback((exportType, success) => {
    return seatingAnalytics.trackExport(userId, weddingId, exportType, success);
  }, [userId, weddingId]);

  return {
    trackEvent,
    trackTableCreated,
    trackGuestAssigned,
    trackLayoutSaved,
    trackExport,
    seatingAnalytics,
  };
}
