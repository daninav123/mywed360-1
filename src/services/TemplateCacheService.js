/**
 * Servicio de caché para plantillas de email
 *
 * Este servicio proporciona una capa de caché para optimizar
 * el acceso a plantillas de email, reduciendo llamadas al backend
 * y mejorando el rendimiento general del sistema.
 *
 * Implementa:
 * - Caché en memoria para acceso rápido
 * - Almacenamiento en localStorage para persistencia entre sesiones
 * - Invalidación inteligente basada en tiempo y eventos
 * - Precarga de plantillas frecuentemente usadas
 */

import i18n from '../i18n';
import { performanceMonitor } from './PerformanceMonitor';

// Evitar timers globales durante tests para que el runner no quede colgado
const IS_TEST = (
  (typeof globalThis !== 'undefined' && (globalThis.vi || globalThis.vitest || globalThis.jest)) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITEST || process.env.NODE_ENV === 'test')) ||
  (typeof import.meta !== 'undefined' && (import.meta.vitest || (import.meta.env && import.meta.env.MODE === 'testi18n.t('common.constantes_para_configuracion_cache_const_cacheversion')1.0.0';
const CACHE_PREFIX = 'maloveapp_template_cachei18n.t('common.const_cacheexpiry_1000_horas_milisegundos_const')maloveapp_template_usagei18n.t('common.const_preloadthreshold_numero_minimo_usos_para')i18n.t('common.return_cacheprefixtypeidentifier_verifica_cache_esta_vencida')template_cache_statsi18n.t('common.cachestats_timestamp_datenow_guardar_localstorage_para')Error al guardar estadísticas de caché:', error);
  }
};

/**
 * Registra el uso de una plantilla para informar la precarga
 * @param {string} templateId - ID de la plantilla usada
 * @param {string} category - Categoría de la plantilla
 */
export const registerTemplateUsage = (templateId, category) => {
  try {
    // Obtener historial de uso existente o inicializar
    const usageData = JSON.parse(localStorage.getItem(TEMPLATE_USAGE_KEY) || '{}i18n.t('common.incrementar_contador_para_esta_plantilla_usagedatatemplateid')template_usage_tracked', {
      templateId,
      category,
      count: usageData[templateId].count,
    });

    return usageData[templateId].count;
  } catch (error) {
    console.error('Error al registrar uso de plantilla:', error);
    return 0;
  }
};

/**
 * Determina qué plantillas deben ser precargadas basado en su uso
 * @returns {Array} - IDs de plantillas a precargar
 */
export const getTemplatesToPreload = () => {
  try {
    const usageData = JSON.parse(localStorage.getItem(TEMPLATE_USAGE_KEY) || '{}');

    // Filtrar plantillas usadas frecuentemente
    return Object.entries(usageData)
      .filter(([_, data]) => data.count >= PRELOAD_THRESHOLD)
      .sort((a, b) => b[1].count - a[1].count) // Ordenar por uso (mayor primero)
      .map(([id, _]) => id);
  } catch (error) {
    console.error('Error al determinar plantillas para precargar:', error);
    return [];
  }
};

/**
 * Obtiene las categorías más usadas
 * @returns {Array} - Lista de categorías ordenadas por frecuencia de uso
 */
export const getMostUsedCategories = () => {
  try {
    const usageData = JSON.parse(localStorage.getItem(TEMPLATE_USAGE_KEY) || '{}i18n.t('common.contar_usos_por_categoria_const_categorycount')Sin categoríai18n.t('common.categorycountcategory_categorycountcategory_categorycountcategory_datacount_ordenar_categorias')Error al obtener categorías más usadas:', error);
    return [];
  }
};

/**
 * Limpia entradas antiguas de la caché
 */
const cleanupCache = () => {
  // Limpiar caché en memoria si es demasiado grande
  if (Object.keys(memoryCache.byId).length > CACHE_MAX_SIZE) {
    const templateIds = Object.keys(memoryCache.byId);

    // Obtener datos de uso para determinar qué eliminar
    const usageData = JSON.parse(localStorage.getItem(TEMPLATE_USAGE_KEY) || '{}i18n.t('common.ordenar_ids_por_uso_menos_usados')Error al limpiar caché:', error);
  }
};

/**
 * Inicializa o reinicia la caché
 */
export const initCache = () => {
  memoryCache = {
    allTemplates: null,
    byId: {},
    byCategory: {},
    lastFetched: 0,
  };

  cacheStats = {
    hits: 0,
    misses: 0,
    saves: 0,
    preloads: 0,
  };

  cleanupCache();

  performanceMonitor.logEvent('template_cache_initializedi18n.t('common.version_cacheversion_timestamp_datenow_guarda_todas')cacheAllTemplates: se esperaba un array', { templates });
    return;
  }
  // Guardar en caché de memoria
  memoryCache.allTemplates = templates;
  memoryCache.lastFetched = Date.now();

  // Organizar por ID para acceso rápido
  templates.forEach((template) => {
    memoryCache.byId[template.id] = template;

    // Organizar por categoría
    const category = template.category || i18n.t('common.sin_categoria');
    if (!memoryCache.byCategory[category]) {
      memoryCache.byCategory[category] = [];
    }
    memoryCache.byCategory[category].push(template);
  });

  // Actualizar localStorage si es necesario
  if (updateLocalStorage) {
    try {
      localStorage.setItem(
        getCacheKey('all'),
        JSON.stringify({
          data: templates,
          timestamp: Date.now(),
          version: CACHE_VERSION,
        })
      );

      cacheStats.saves++;
    } catch (error) {
      console.error('Error al guardar plantillas en localStorage:', error);
    }
  }

  performanceMonitor.logEvent('template_cache_updatedi18n.t('common.count_templateslength_timestamp_datenow_guarda_una')Sin categoría';
  if (!memoryCache.byCategory[category]) {
    memoryCache.byCategory[category] = [];
  }

  const categoryIndex = memoryCache.byCategory[category].findIndex((t) => t.id === template.id);
  if (categoryIndex >= 0) {
    memoryCache.byCategory[category][categoryIndex] = template;
  } else {
    memoryCache.byCategory[category].push(template);
  }

  // Guardar en localStorage
  try {
    localStorage.setItem(
      getCacheKey('id', template.id),
      JSON.stringify({
        data: template,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      })
    );

    cacheStats.saves++;
  } catch (error) {
    console.error('Error al guardar plantilla en localStorage:', error);
  }

  performanceMonitor.logEvent('template_cachedi18n.t('common.templateid_category_templatecategory_elimina_una_plantilla')Sin categoríai18n.t('common.eliminar_cache_por_delete_memorycachebyidtemplateid_eliminar')id', templateId));
  } catch (error) {
    console.error('Error al eliminar plantilla de localStorage:', error);
  }

  performanceMonitor.logEvent('template_cache_invalidatedi18n.t('common.templateid_timestamp_datenow_invalida_completamente_cache')Error al invalidar caché en localStorage:', error);
  }

  performanceMonitor.logEvent('template_cache_reseti18n.t('common.timestamp_datenow_obtiene_todas_las_plantillas')memory',
    };
  }

  // Verificar localStorage
  try {
    const cachedItem = localStorage.getItem(getCacheKey('alli18n.t('common.cacheditem_const_data_timestamp_version_jsonparsecacheditem')localStorage',
        };
      }
    }
  } catch (error) {
    console.error('Error al leer caché de localStorage:', error);
  }

  cacheStats.misses++;

  return {
    templates: null,
    fromCache: false,
  };
};

/**
 * Obtiene una plantilla específica de la caché
 * @param {string} templateId - ID de la plantilla
 * @param {boolean} bypassCache - Si es true, indica que se debe ignorar la caché
 * @returns {Object} - Objeto con la plantilla y el estado de la caché
 */
export const getCachedTemplate = (templateId, bypassCache = false) => {
  // Si se debe ignorar la caché, devolver null
  if (bypassCache) {
    cacheStats.misses++;
    return { template: null, fromCache: false };
  }

  // Verificar caché en memoria primero
  if (memoryCache.byId[templateId]) {
    cacheStats.hits++;

    return {
      template: memoryCache.byId[templateId],
      fromCache: true,
      source: 'memory',
    };
  }

  // Verificar localStorage
  try {
    const cachedItem = localStorage.getItem(getCacheKey('idi18n.t('common.templateid_cacheditem_const_data_timestamp_version')localStorage',
        };
      }
    }
  } catch (error) {
    console.error('Error al leer caché de plantilla de localStorage:', error);
  }

  cacheStats.misses++;

  return {
    template: null,
    fromCache: false,
  };
};

/**
 * Obtiene plantillas por categoría de la caché
 * @param {string} category - Categoría de las plantillas
 * @param {boolean} bypassCache - Si es true, indica que se debe ignorar la caché
 * @returns {Object} - Objeto con las plantillas y el estado de la caché
 */
export const getCachedTemplatesByCategory = (category, bypassCache = false) => {
  const categoryKey = category || 'Sin categoría';

  // Si se debe ignorar la caché, devolver null
  if (bypassCache) {
    cacheStats.misses++;
    return { templates: null, fromCache: false };
  }

  // Verificar caché en memoria primero
  if (
    memoryCache.byCategory[categoryKey] &&
    memoryCache.lastFetched &&
    !isCacheExpired(memoryCache.lastFetched)
  ) {
    cacheStats.hits++;

    return {
      templates: memoryCache.byCategory[categoryKey],
      fromCache: true,
      source: 'memoryi18n.t('common.para_categorias_tenemos_todas_las_plantillas')Sin categoríai18n.t('common.categorykey_guardar_cache_por_categoria_para')memory-filteredi18n.t('common.cachestatsmisses_return_templates_null_fromcache_false')function') return;

  try {
    const templatesToPreload = getTemplatesToPreload();

    if (templatesToPreload.length === 0) return;

    performanceMonitor.logEvent('template_preload_startedi18n.t('common.count_templatestopreloadlength_precargar_hasta_plantillas_populares')template_preloaded', {
            id: templateId,
            success: true,
          });
        }
      } catch (error) {
        console.error(`Error al precargar plantilla ${templateId}:`, error);
        performanceMonitor.logEvent('template_preload_error', {
          id: templateId,
          error: error.message,
        });
      }
    }

    performanceMonitor.logEvent('template_preload_completed', {
      preloaded: cacheStats.preloads,
    });
  } catch (error) {
    console.error('Error al precargar plantillas populares:', error);
  }
};

// Guardar estadísticas periódicamente
if (!IS_TEST) { setInterval(saveStats, 5 * 60 * 1000); // Cada 5 minutos

// Limpiar caché periódicamente
  setInterval(cleanupCache, 60 * 60 * 1000); } // Cada hora

// Inicializar caché al cargar
initCache();

const templateCache = {
  initCache,
  cacheAllTemplates,
  cacheTemplate,
  invalidateTemplate,
  invalidateAllTemplates,
  getCachedTemplates,
  getCachedTemplate,
  getCachedTemplatesByCategory,
  registerTemplateUsage,
  getTemplatesToPreload,
  getMostUsedCategories,
  preloadPopularTemplates,
};

export { templateCache };
export default templateCache;



