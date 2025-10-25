/**
 * Servicio para generar recomendaciones inteligentes basadas en métricas
 * de efectividad de correos electrónicos
 */
import i18n from '../i18n';
import AIEmailTrackingService from './AIEmailTrackingService';
import { EMAIL_TAGS } from './EmailTrackingService';

class EmailRecommendationService {
  constructor() {
    this.trackingService = new AIEmailTrackingService();
    this.storageKeyRecommendations = 'emailRecommendationsi18n.t('common.genera_recomendaciones_personalizadas_basadas_metricas_historicas')Error generando recomendaciones:', error);
      return this._getDefaultRecommendations();
    }
  }

  /**
   * Calcula el mejor momento del día para enviar correos basado en tasas de respuesta históricas
   * @private
   * @param {Array} activities - Actividades históricas
   * @returns {Object} Objeto con recomendaciones de horario
   */
  _calculateBestTimeToSend(activities) {
    // Inicializar contadores por franja horaria
    const timeSlots = {
      morning: { sent: 0, responded: 0, rate: 0 }, // 8-12h
      afternoon: { sent: 0, responded: 0, rate: 0 }, // 12-16h
      evening: { sent: 0, responded: 0, rate: 0 }, // 16-20h
      night: { sent: 0, responded: 0, rate: 0 }, // 20-8h
    };

    // Analizar actividades
    activities.forEach((activity) => {
      const timestamp = new Date(activity.timestamp);
      const hour = timestamp.getHours();

      // Determinar franja horaria
      let timeSlot = 'night';
      if (hour >= 8 && hour < 12) timeSlot = 'morning';
      else if (hour >= 12 && hour < 16) timeSlot = 'afternoon';
      else if (hour >= 16 && hour < 20) timeSlot = 'evening';

      // Incrementar contadores
      timeSlots[timeSlot].sent++;
      if (activity.responseReceived) {
        timeSlots[timeSlot].responded++;
      }
    });

    // Calcular tasas y determinar mejor franja
    let bestTimeSlot = 'morning';
    let bestRate = 0;

    Object.keys(timeSlots).forEach((slot) => {
      const { sent, responded } = timeSlots[slot];
      const rate = sent > 0 ? (responded / sent) * 100 : 0;
      timeSlots[slot].rate = rate;

      if (sent >= 5 && rate > bestRate) {
        bestRate = rate;
        bestTimeSlot = slot;
      }
    });

    // Mappear nombres amigables
    const timeSlotNames = {
      morning: 'mañana (8-12h)',
      afternoon: i18n.t('common.mediodia_1216h'),
      evening: 'tarde (16-20h)',
      night: 'noche (20-8h)i18n.t('common.preparar_recomendacion_return_besttimeslot_besttimeslotname_timeslotnamesbesttimeslot')Consulta sobre [Servicio] para evento el [Fecha]',
        'Disponibilidad y presupuesto para [Evento]',
        i18n.t('common.interes_contratar_servicio_maloveapp'),
      ],
      avoidPatterns: ['Consulta', i18n.t('common.informacion'), 'Hola'],
      optimalLength: {
        min: 30,
        max: 60,
      },
      includeElements: ['Fecha del evento', 'Tipo de servicio', i18n.t('common.mencion_maloveapp')],
    };
  }

  /**
   * Genera recomendaciones para plantillas basadas en datos históricos
   * @private
   * @param {Array} activities - Actividades históricas
   * @param {string} category - Categoría de proveedor
   * @returns {Object} Objeto con recomendaciones de plantillas
   */
  _generateTemplateRecommendations(activities, category) {
    // Agrupar por plantilla/categoría
    const templateStats = {};

    activities.forEach((activity) => {
      const templateCat = activity.templateCategory || 'general';

      if (!templateStats[templateCat]) {
        templateStats[templateCat] = {
          total: 0,
          responded: 0,
          responseRate: 0,
          avgResponseTime: 0,
          totalResponseTime: 0,
        };
      }

      templateStats[templateCat].total++;

      if (activity.responseReceived) {
        templateStats[templateCat].responded++;

        if (activity.responseTime) {
          templateStats[templateCat].totalResponseTime += activity.responseTime;
        }
      }
    });

    // Calcular tasas y promedios
    Object.keys(templateStats).forEach((cat) => {
      const stats = templateStats[cat];
      stats.responseRate = stats.total > 0 ? (stats.responded / stats.total) * 100 : 0;
      stats.avgResponseTime = stats.responded > 0 ? stats.totalResponseTime / stats.responded : 0;
    });

    // Encontrar mejor plantilla general
    let bestTemplate = 'generali18n.t('common.let_bestrate_objectkeystemplatestatsforeachcat_solo_considerar_plantillas')24-48i18n.t('common.hassufficientdata_false_calcular_tiempo_promedio_general')fotografía':
        categoryRecommendations.recommendations = [
          i18n.t('common.mencionar_estilo_especifico_fotografias_que_buscas'),
          i18n.t('common.preguntar_por_disponibilidad_albumes_impresos'),
          'Consultar sobre el tiempo de entrega de las fotos editadas',
        ];
        break;

      case 'catering':
        categoryRecommendations.recommendations = [
          i18n.t('common.especificar_numero_aproximado_invitados'),
          'Mencionar restricciones alimentarias o preferencias',
          i18n.t('common.preguntar_por_opciones_menu_posibilidad_cata'),
        ];
        break;

      case 'música':
        categoryRecommendations.recommendations = [
          'Especificar el estilo musical preferido',
          'Consultar sobre el repertorio y posibilidad de peticiones',
          i18n.t('common.preguntar_por_necesidades_tecnicas_espacio_necesario'),
        ];
        break;

      case 'flores':
        categoryRecommendations.recommendations = [
          'Mencionar la paleta de colores del evento',
          i18n.t('common.especificar_las_areas_que_requieren_decoracion'),
          'Consultar sobre flores de temporada disponibles',
        ];
        break;

      default:
        categoryRecommendations.recommendations = [
          i18n.t('common.ser_especifico_sobre_tus_necesidades_para'),
          i18n.t('common.mencionar_fecha_ubicacion_numero_invitados'),
          'Consultar disponibilidad antes de entrar en detallesi18n.t('common.return_categoryrecommendations_genera_recomendaciones_especificas_basadas')Especificar la ubicación del evento en tu mensaje');
    }

    if (!hasDate) {
      recommendations.push('Mencionar la fecha del evento para confirmar disponibilidad');
    }

    if (!hasBudget) {
      recommendations.push('Indicar un rango de presupuesto para obtener propuestas ajustadas');
    }

    if (!hasSize) {
      recommendations.push(i18n.t('common.especificar_numero_aproximado_invitados_tamano_del'));
    }

    return {
      searchContext: {
        includesLocation: hasLocation,
        includesDate: hasDate,
        includesBudget: hasBudget,
        includesSize: hasSize,
      },
      recommendations,
    };
  }

  /**
   * Calcula la puntuación de confianza para las recomendaciones
   * @private
   * @param {Array} activities - Actividades históricas
   * @param {string} category - Categoría de proveedor
   * @returns {number} Puntuación de confianza (0-100)
   */
  _calculateConfidenceScore(activities, category) {
    // Base: cantidad de datos disponibles
    let baseScore = 0;

    // Por cantidad total de actividades
    if (activities.length >= 50) baseScore = 100;
    else if (activities.length >= 30) baseScore = 80;
    else if (activities.length >= 15) baseScore = 60;
    else if (activities.length >= 5) baseScore = 40;
    else baseScore = 20;

    // Ajustar por categoría específica si está disponible
    if (category) {
      const categoryActivities = activities.filter((a) => a.templateCategory === category);
      let categoryMultiplier = 1;

      if (categoryActivities.length >= 20) categoryMultiplier = 1.2;
      else if (categoryActivities.length >= 10) categoryMultiplier = 1.1;
      else if (categoryActivities.length >= 5) categoryMultiplier = 1.05;
      else if (categoryActivities.length < 3) categoryMultiplier = 0.8;

      baseScore = Math.min(100, baseScore * categoryMultiplier);
    }

    // Ajustar por distribución de respuestas
    const responded = activities.filter((a) => a.responseReceived).length;
    if (activities.length > 0) {
      const responseRate = responded / activities.length;

      // Penalizar si la tasa de respuesta es muy baja o muy alta (datos poco representativos)
      if (responseRate < 0.1 || responseRate > 0.9) {
        baseScore *= 0.9;
      }
    }

    return Math.round(baseScore);
  }

  /**
   * Guarda las recomendaciones generadas para referencia futura
   * @private
   * @param {Object} recommendations - Recomendaciones generadas
   * @param {string} category - Categoría de proveedor
   * @param {string} searchQuery - Consulta de búsqueda
   */
  _saveRecommendations(recommendations, category, searchQuery) {
    try {
      const savedRecommendations = JSON.parse(
        localStorage.getItem(this.storageKeyRecommendations) || '[]i18n.t('common.limitar_las_ultimas_recomendaciones_savedrecommendationslength_savedrecommendationspop')Error guardando recomendaciones:', error);
    }
  }

  /**
   * Retorna las recomendaciones por defecto cuando no hay datos suficientes
   * @private
   * @returns {Object} Recomendaciones por defecto
   */
  _getDefaultRecommendations() {
    return {
      bestTimeToSend: {
        bestTimeSlot: 'morning',
        bestTimeSlotName: 'mañana (8-12h)',
        hasSufficientData: false,
      },
      subjectLineRecommendations: {
        recommendedPatterns: [
          'Consulta sobre [Servicio] para evento el [Fecha]',
          'Disponibilidad y presupuesto para [Evento]',
          i18n.t('common.interes_contratar_servicio_maloveapp'),
        ],
        optimalLength: {
          min: 30,
          max: 60,
        },
      },
      templateRecommendations: {
        bestOverallTemplate: 'general',
        hasSufficientData: false,
      },
      customizationImpact: {
        recommendCustomization: true,
        hasSufficientData: false,
      },
      responseTimeExpectations: {
        averageTime: '24-48',
        hasSufficientData: false,
      },
      confidenceScore: 20,
    };
  }

  /**
   * Obtiene recomendaciones previamente generadas
   * @returns {Array} Historial de recomendaciones
   */
  getRecommendationsHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKeyRecommendations) || '[]');
    } catch (error) {
      console.error('Error obteniendo historial de recomendaciones:', error);
      return [];
    }
  }

  /**
   * Marca una recomendación como aplicada
   * @param {string} recommendationId - ID de la recomendación
   * @returns {boolean} Éxito de la operación
   */
  markRecommendationAsApplied(recommendationId) {
    try {
      const savedRecommendations = JSON.parse(
        localStorage.getItem(this.storageKeyRecommendations) || '[]'
      );
      const index = savedRecommendations.findIndex((r) => r.id === recommendationId);

      if (index === -1) return false;

      savedRecommendations[index].applied = true;
      savedRecommendations[index].appliedAt = new Date().toISOString();

      localStorage.setItem(this.storageKeyRecommendations, JSON.stringify(savedRecommendations));
      return true;
    } catch (error) {
      console.error('Error marcando recomendación como aplicada:', error);
      return false;
    }
  }
}

export default EmailRecommendationService;

