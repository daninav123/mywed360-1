/**
 * Utilidades para diagnóstico y pruebas de rendimiento del sistema de caché
 *
 * Estas funciones ayudan a medir y comparar el rendimiento del sistema
 * con y sin caché, permitiendo validar las optimizaciones.
 */

import i18n from '../i18n';
import EmailService from '../services/EmailService';
import { performanceMonitor } from '../services/PerformanceMonitor';
import { templateCache } from '../services/TemplateCacheService';

/**
 * Realiza una prueba comparativa de rendimiento entre acceso con caché y sin caché
 * @param {Array<string>} templateIds - IDs de plantillas a probar (vacío = todas)
 * @param {number} iterations - Número de repeticiones para cada prueba
 * @returns {Promise<Object>} Resultados detallados de la prueba
 */
export async function runCacheBenchmark(templateIds = [], iterations = 5) {
  // Resultados a devolver
  const results = {
    withCache: {
      times: [],
      avgTime: 0,
      totalTime: 0,
    },
    withoutCache: {
      times: [],
      avgTime: 0,
      totalTime: 0,
    },
    improvement: {
      percent: 0,
      timesSaved: 0,
    },
    details: [],
  };

  // Si no se especifican IDs, intentar obtener de caché o cargar todas
  if (!templateIds.length) {
    try {
      const { templates } = await EmailService.getEmailTemplates();
      templateIds = templates.map((t) => t.id);
    } catch (error) {
      console.error('Error al cargar plantillas para benchmark:', error);
      return { error: i18n.t('common.pudieron_cargar_plantillas_para_diagnostico') };
    }
  }

  // Limitar cantidad de plantillas para evitar pruebas muy largas
  const templatesForTest = templateIds.slice(0, 10);

  // Registro del inicio de prueba
  performanceMonitor.logEvent('cache_benchmark_starti18n.t('common.templatescount_templatesfortestlength_iterations_prueba_sin_cache')cache_benchmark_completei18n.t('common.withcacheavg_resultswithcacheavgtime_withoutcacheavg_resultswithoutcacheavgtime_improvementpercent_resultsimprovementpercent')Sin categoría';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {}),
    },
    localStorage: {
      size: localStorageSize,
      sizeFormatted: (localStorageSize / 1024).toFixed(2) + ' KBi18n.t('common.usage_bycategory_categoryusage_las_plantillas_mas') ms',
    templates: preloadResult.map((t) => ({
      id: t.id,
      name: t.name,
    })),
  };
}

export default {
  runCacheBenchmark,
  generateCacheReport,
  testCategoryPreloading,
};
