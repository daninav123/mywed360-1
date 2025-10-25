import i18n from '../i18n';
import { useEffect } from "react";

import { post as apiPost } from './apiClient';

// Guardar referencia al console.error original antes de que sea interceptado
const originalConsoleError = console.error;

// Detectar entorno de tests para evitar timers que mantengan vivo el proceso
const IS_TEST = (
  (typeof globalThis !== 'undefined' && (globalThis.vi || globalThis.vitest || globalThis.jest)) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITEST || process.env.NODE_ENV === 'test')) ||
  (typeof import.meta !== 'undefined' && (import.meta.vitest || (import.meta.env && import.meta.env.MODE === 'testi18n.t('common.servicio_monitoreo_rendimiento_para_aplicacion_maloveapp')i18n.t('common.tamano_maximo_cola_eventos_antes_enviar')monitor_init', {
      version: import.meta.env.VITE_APP_VERSION || 'dev',
      metrics_enabled: this.config.metrics,
      log_level: this.config.logLevel,
    });

    console.info("[perfmon] Monitor de rendimiento inicializado");
    // Try to derive user context from localStorage (best-effort)
    try {
      const raw = localStorage.getItem('authUser');
      if (raw) {
        const u = JSON.parse(raw);
        if (u && (u.uid || u.email)) this.user = { uid: u.uid || null, email: u.email || null };
      }
    } catch {}
  }

  /**
   * Activar o desactivar el monitoreo
   * @param {boolean} state - Estado del monitoreo
   */
  setEnabled(state) {
    this.enabled = state;

    if (this.enabled && this.config.reportInterval && !this.reportingTimer) {
      this.scheduleReporting();
    } else if (!this.enabled && this.reportingTimer) {
      clearTimeout(this.reportingTimer);
      this.reportingTimer = null;
    }

    this.logEvent('monitor_state_changei18n.t('common.enabled_state_setusercontextuser_try_user_useruid')functioni18n.t('common.originalconsoleerror_error_errortype_error_enviar_inmediatamente')criticali18n.t('common.thisflushmetrics_iniciar_medicion_tiempo_para_una')slow_operationi18n.t('common.operation_metricname_duration_durationms_metadata_incrementar')POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: Date.now(),
            appVersion: import.meta.env.VITE_APP_VERSION || 'dev',
            metrics: metricsToSend,
          }),
        });

        if (!response.ok) {
          console.warn('Error al enviar métricas:', response.statusText);
        }
      } else {
        // Si no hay URL, guardar localmente para desarrollo
        if (this.config.logLevel >= 2) {
          console.info("[perfmon] Monitor de rendimiento inicializado");
        }

        // Almacenar últimas métricas en localStorage para debugging
        try {
          localStorage.setItem('MaLoveApp_last_metrics', JSON.stringify(metricsToSend));
        } catch (e) {
          // Ignorar errores de localStorage
        }
      }
    } catch (error) {
      console.error('Error al procesar métricas:', error);

      // Restaurar eventos y errores no enviados
      this.metrics.events = [...metricsToSend.events, ...this.metrics.events];
      this.metrics.errors = [...metricsToSend.errors, ...this.metrics.errors];
    } finally {
      this.pendingFlush = false;
    }
  }

  /**
   * Monitorear específicamente operaciones del sistema de emails
   * @param {string} operation - Operación específica (enviar, recibir, etc.)
   * @param {Function} fn - Función a monitorear
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<any>} Resultado de la función
   */
  async monitorEmailOperation(operation, fn, metadata = {}) {
    if (!this.enabled || !this.config.metrics.emailProcessing) {
      return fn();
    }

    // Registrar el evento de operación de email
    this.logEvent(`email_operation_${operation}`, {
      ...metadata,
      timestamp: Date.now(),
    });

    // Incrementar contador de operaciones por tipo
    this.incrementCounter(`email_operation_${operation}`);

    return this.measureAsync(`email_${operation}`, fn, metadata);
  }

  /**
   * Monitorear el uso de plantillas de email
   * @param {string} templateId - ID o nombre de la plantilla
   * @param {string} category - Categoría de la plantilla
   * @param {string} action - Acción realizada (view, edit, use, create)
   * @param {Function} fn - Función a monitorear
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<any>} Resultado de la función
   */
  async monitorTemplateUsage(templateId, category, action, fn, metadata = {}) {
    if (!this.enabled || !this.config.metrics.emailProcessing) {
      return fn();
    }

    // Registrar el evento de uso de plantilla
    this.logEvent('template_usagei18n.t('common.templateid_category_action_metadata_incrementar_contadores')template_renderingi18n.t('common.templateid_datasize_timestamp_datenow_monitorear_proceso')email_delivery_attempt', {
      emailId,
      recipientType,
      ...metadata,
    });

    // Incrementar contador de intentos por tipo de destinatario
    this.incrementCounter(`email_delivery_${recipientType}`);

    try {
      const result = await this.measureAsync('email_deliveryi18n.t('common.emailid_recipienttype_metadata_registrar_exito_entrega')email_delivery_success', {
        emailId,
        recipientType,
        ...metadata,
      });

      return result;
    } catch (error) {
      // Registrar fallo de entrega
      this.logEvent('email_delivery_failure', {
        emailId,
        recipientType,
        errorMessage: error.message,
        ...metadata,
      });

      // Incrementar contador de fallos
      this.incrementCounter('email_delivery_failuresi18n.t('common.throw_error_monitorear_interacciones_con_emails')email_interactioni18n.t('common.emailid_interactiontype_timestamp_datenow_metadata_incrementar')email_interactions_totali18n.t('common.monitorear_busqueda_global_param_string_query')searchi18n.t('common.query_querylength_querylength_monitorear_renderizado_notificaciones')notification_renderingi18n.t('common.count_monitorear_deteccion_eventos_emails_param')event_detection', fn, {
      emailId,
      contentLength,
    });
  }
}

// Instancia singleton para uso en toda la aplicación
export const performanceMonitor = new PerformanceMonitor();

// Hooks para facilitar el uso en componentes React
export function usePerformanceMonitor() {
  return performanceMonitor;
}

// Hook específico para medir el tiempo de carga de un componente
export function useComponentLoadTime(componentName) {
  const mountTime = performance.now();

  useEffect(() => {
    if (!performanceMonitor.enabled) return;

    const loadTime = performance.now() - mountTime;
    performanceMonitor.recordTiming(`component_load_${componentName}`, loadTime, {
      component: componentName,
    });

    // Medir tiempo de desmontar al limpiar el efecto
    return () => {
      const unmountStart = performance.now();

      // Usamos setTimeout para medir después de que el componente se haya desmontado
      setTimeout(() => {
        const unmountTime = performance.now() - unmountStart;
        performanceMonitor.recordTiming(`component_unmount_${componentName}`, unmountTime, {
          component: componentName,
        });
      }, 0);
    };
  }, [componentName]);
}








