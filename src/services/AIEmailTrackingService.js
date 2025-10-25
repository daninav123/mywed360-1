/**
 * Servicio especializado para el seguimiento y análisis de efectividad de correos
 * generados mediante búsqueda AI de proveedores.
 */
import i18n from '../i18n';
import { EMAIL_TAGS } from './EmailTrackingService';

class AIEmailTrackingService {
  /**
   * Constructor del servicio
   */
  constructor() {
    this.storageKeyActivities = 'aiEmailActivities';
    this.storageKeyMetrics = 'aiEmailMetricsi18n.t('common.registra_una_actividad_email_con_informacion')general',
        wasCustomized: options.wasCustomized || false,
        timestamp: new Date().toISOString(),
        status: 'sent',
        responseReceived: false,
        responseTime: null,
        effectivenessScore: null,
        emailId: options.emailId || null,
      };

      // Guardar en localStorage para desarrollo
      const activities = JSON.parse(localStorage.getItem(this.storageKeyActivities) || '[]');
      activities.push(activity);
      localStorage.setItem(this.storageKeyActivities, JSON.stringify(activities));

      return activityId;
    } catch (error) {
      console.error('Error registrando actividad de email AI:', error);
      return null;
    }
  }

  /**
   * Actualiza el estado de un correo AI cuando se recibe respuesta
   * @param {string} activityId - ID de la actividad AI
   * @param {Object} responseData - Datos de la respuesta
   * @returns {boolean} - Éxito de la operación
   */
  updateWithResponse(activityId, responseData) {
    try {
      const activities = JSON.parse(localStorage.getItem(this.storageKeyActivities) || '[]');
      const index = activities.findIndex((act) => act.id === activityId);

      if (index === -1) return false;

      const now = new Date();
      const sentDate = new Date(activities[index].timestamp);
      const responseTime = (now - sentDate) / (1000 * 60 * 60); // horas

      // Actualizar la actividad con datos de respuesta
      activities[index] = {
        ...activities[index],
        status: 'respondedi18n.t('common.responsereceived_true_responsetime_responsedate_nowtoisostring_effectivenessscore')Error actualizando actividad AI con respuesta:', error);
      return false;
    }
  }

  /**
   * Obtiene todas las actividades de email AI, opcionalmente filtradas
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} - Actividades que coinciden con los filtros
   */
  getActivities(filters = {}) {
    try {
      const activities = JSON.parse(localStorage.getItem(this.storageKeyActivities) || '[]');

      if (Object.keys(filters).length === 0) return activities;

      return activities.filter((activity) => {
        let incluir = true;

        if (filters.category) {
          incluir = incluir && activity.templateCategory === filters.category;
        }

        if (filters.status) {
          incluir = incluir && activity.status === filters.status;
        }

        if (filters.responded !== undefined) {
          incluir = incluir && activity.responseReceived === filters.responded;
        }

        if (filters.customized !== undefined) {
          incluir = incluir && activity.wasCustomized === filters.customized;
        }

        if (filters.providerName) {
          incluir =
            incluir &&
            activity.providerName &&
            activity.providerName.toLowerCase().includes(filters.providerName.toLowerCase());
        }

        return incluir;
      });
    } catch (error) {
      console.error('Error obteniendo actividades AI:', error);
      return [];
    }
  }

  /**
   * Calcula y actualiza métricas generales de efectividad
   * @private
   */
  updateOverallMetrics() {
    try {
      const activities = this.getActivities();
      const responded = activities.filter((act) => act.responseReceived);
      const customized = activities.filter((act) => act.wasCustomized);
      const customizedWithResponse = customized.filter((act) => act.responseReceived);

      // Calcular métricas por categoría
      const categoriesMap = {};
      activities.forEach((act) => {
        const cat = act.templateCategory || 'generali18n.t('common.categoriesmapcat_categoriesmapcat_total_responded_customized_totalresponsetime')Error actualizando métricas:', error);
      return null;
    }
  }

  /**
   * Obtiene las métricas actuales de efectividad
   * @returns {Object} - Métricas actuales
   */
  getMetrics() {
    try {
      const storedMetrics = localStorage.getItem(this.storageKeyMetrics);

      if (storedMetrics) {
        return JSON.parse(storedMetrics);
      }

      return this.updateOverallMetrics();
    } catch (error) {
      console.error('Error obteniendo métricas AI:', error);
      return null;
    }
  }

  /**
   * Obtiene datos para el panel de comparación de efectividad AI vs no-AI
   * @returns {Object} - Datos de comparación
   */
  getComparisonData() {
    try {
      // Obtener métricas AI
      const aiMetrics = this.getMetrics();

      // Obtener datos de correos no-AI desde localStorage (simulado)
      // En producción, esta información vendría de la base de datos
      const emailData = JSON.parse(localStorage.getItem('emailTrackings') || '[]i18n.t('common.const_nonaiemails_emaildatafiltere_eisaigenerated_const_nonairesponses')0.00',
          avgResponseTime: aiMetrics.categoryStats[cat].averageResponseTime.toFixed(1),
        })),
      };
    } catch (error) {
      console.error('Error obteniendo datos de comparación:', error);
      return {
        ai: { total: 0, responded: 0, responseRate: '0.00', avgResponseTime: '0.0' },
        nonAi: { total: 0, responded: 0, responseRate: '0.00', avgResponseTime: '0.0' },
        difference: { responseRate: '0.00', avgResponseTime: '0.0' },
        categoryBreakdown: [],
      };
    }
  }
}

export default AIEmailTrackingService;
