/**
 * SERVICIO DE ANÁLISIS DE BÚSQUEDAS
 * 
 * Fase 1: Captura básica de búsquedas
 * - Guarda cada búsqueda en Firestore
 * - Extracción simple de keywords
 * - No bloquea el flujo de búsqueda
 * 
 * Futuro: NLP avanzado, clustering, nodos dinámicos
 */

import admin from 'firebase-admin';

// CONFIGURACIÓN
const CONFIG = {
  ENABLED: true,              // Activar/desactivar captura
  SAVE_TO_FIRESTORE: true,   // Guardar en BD
  LOG_TO_CONSOLE: true,      // Logs de debug
  MIN_QUERY_LENGTH: 2,       // Mínimo caracteres para analizar
  
  // Stop words español (palabras a ignorar)
  STOP_WORDS: [
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'para', 'con', 'en', 'por', 'y', 'o',
    'que', 'es', 'su', 'mi', 'tu', 'se', 'al', 'como'
  ]
};

/**
 * Capturar y analizar una búsqueda
 * 
 * @param {Object} searchData - Datos de la búsqueda
 * @param {string} searchData.query - Query del usuario
 * @param {string} searchData.service - Servicio buscado
 * @param {string} searchData.location - Ubicación
 * @param {Object} searchData.filters - Filtros aplicados
 * @param {string} searchData.user_id - ID del usuario
 * @param {string} searchData.wedding_id - ID de la boda
 * @param {Object} searchData.results - Resultados devueltos (opcional)
 */
async function captureSearch(searchData) {
  if (!CONFIG.ENABLED) return;
  
  try {
    const {
      query = '',
      service = '',
      location = '',
      filters = {},
      user_id = null,
      wedding_id = null,
      results = null
    } = searchData;
    
    // Validaciones básicas
    if (!service && !query) {
      if (CONFIG.LOG_TO_CONSOLE) {
        console.log('⚠️ [SEARCH-ANALYTICS] Búsqueda sin query ni service, ignorando');
      }
      return;
    }
    
    // Extracción simple de keywords
    const keywords = extractSimpleKeywords(query, service);
    
    // Construir documento
    const searchDoc = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      
      // INPUT
      query: query.trim(),
      service,
      location,
      filters,
      
      // CONTEXTO
      user_id: user_id || 'anonymous',
      wedding_id: wedding_id || null,
      
      // ANÁLISIS BÁSICO
      keywords,
      keyword_count: keywords.length,
      has_budget: !!(filters.budget || filters.minBudget || filters.maxBudget),
      has_location: !!location,
      
      // RESULTADOS (si se proporcionan)
      results_provided: !!results,
      results_count: results?.count || 0,
      results_breakdown: results?.breakdown || null,
      
      // METADATA
      version: '1.0',
      processing_status: 'captured'  // captured | analyzed | processed
    };
    
    if (CONFIG.LOG_TO_CONSOLE) {
      console.log(`📊 [SEARCH-ANALYTICS] Capturada: "${query || service}" (${keywords.length} keywords)`);
    }
    
    // Guardar en Firestore (async, no esperar)
    if (CONFIG.SAVE_TO_FIRESTORE) {
      saveToFirestore(searchDoc).catch(err => {
        console.error('❌ [SEARCH-ANALYTICS] Error guardando:', err.message);
      });
    }
    
    return searchDoc;
    
  } catch (error) {
    console.error('❌ [SEARCH-ANALYTICS] Error capturando búsqueda:', error);
    // No propagar error, no queremos romper la búsqueda
  }
}

/**
 * Extracción SIMPLE de keywords (Fase 1)
 * Sin NLP complejo, solo tokenización básica
 */
function extractSimpleKeywords(query = '', service = '') {
  const stripDiacritics = (value = '') =>
    String(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const text = `${query} ${service}`.toLowerCase();
  const normalizedQuery = stripDiacritics(query);
  
  // Tokenizar (separar por espacios y limpiar)
  let words = text
    .split(/[\s,.-]+/)                    // Separar por espacios y puntuación
    .map(w => w.trim())                   // Limpiar espacios
    .filter(w => w.length >= CONFIG.MIN_QUERY_LENGTH)  // Mínimo longitud
    .filter(w => !CONFIG.STOP_WORDS.includes(w));      // Quitar stop words
  
  // Eliminar duplicados
  words = [...new Set(words)];
  
  // Convertir a objetos con metadata básica
  return words.map((word, index) => ({
    word,
    position: index,
    length: word.length,
    source: normalizedQuery.includes(stripDiacritics(word)) ? 'query' : 'service'
  }));
}

/**
 * Guardar en Firestore (async, no bloquear)
 */
async function saveToFirestore(searchDoc) {
  const db = admin.firestore();
  
  try {
    const docRef = await db.collection('searchAnalytics').add(searchDoc);
    
    if (CONFIG.LOG_TO_CONSOLE) {
      console.log(`✅ [SEARCH-ANALYTICS] Guardado: ${docRef.id}`);
    }
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ [SEARCH-ANALYTICS] Error en Firestore:', error);
    throw error;
  }
}

/**
 * Registrar resultado de búsqueda (llamar después de devolver resultados)
 */
async function recordSearchResults(searchId, resultsData) {
  if (!CONFIG.ENABLED || !CONFIG.SAVE_TO_FIRESTORE) return;
  
  try {
    const db = admin.firestore();
    
    await db.collection('searchAnalytics').doc(searchId).update({
      results_count: resultsData.count || 0,
      results_breakdown: resultsData.breakdown || null,
      results_recorded_at: admin.firestore.FieldValue.serverTimestamp(),
      processing_status: 'completed'
    });
    
    if (CONFIG.LOG_TO_CONSOLE) {
      console.log(`✅ [SEARCH-ANALYTICS] Resultados registrados: ${searchId}`);
    }
    
  } catch (error) {
    console.error('❌ [SEARCH-ANALYTICS] Error registrando resultados:', error);
  }
}

/**
 * Registrar interacción del usuario (click en proveedor)
 */
async function recordUserInteraction(searchId, interactionData) {
  if (!CONFIG.ENABLED || !CONFIG.SAVE_TO_FIRESTORE) return;
  
  try {
    const db = admin.firestore();
    const { supplier_id, action } = interactionData;  // action: 'click' | 'view' | 'hire'
    
    await db.collection('searchAnalytics').doc(searchId).update({
      [`interactions.${action}`]: admin.firestore.FieldValue.arrayUnion(supplier_id),
      last_interaction: admin.firestore.FieldValue.serverTimestamp()
    });
    
    if (CONFIG.LOG_TO_CONSOLE) {
      console.log(`👆 [SEARCH-ANALYTICS] Interacción: ${action} en ${supplier_id}`);
    }
    
  } catch (error) {
    console.error('❌ [SEARCH-ANALYTICS] Error registrando interacción:', error);
  }
}

/**
 * Obtener estadísticas básicas (para admin)
 */
async function getSearchStats(timeRange = 30) {
  const db = admin.firestore();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeRange);
  
  try {
    const snapshot = await db.collection('searchAnalytics')
      .where('timestamp', '>=', cutoffDate)
      .get();
    
    const stats = {
      total_searches: snapshot.size,
      unique_services: new Set(),
      unique_locations: new Set(),
      top_keywords: {},
      avg_keywords_per_search: 0
    };
    
    let totalKeywords = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.service) stats.unique_services.add(data.service);
      if (data.location) stats.unique_locations.add(data.location);
      
      totalKeywords += data.keyword_count || 0;
      
      // Contar keywords
      (data.keywords || []).forEach(kw => {
        stats.top_keywords[kw.word] = (stats.top_keywords[kw.word] || 0) + 1;
      });
    });
    
    stats.avg_keywords_per_search = stats.total_searches > 0 
      ? (totalKeywords / stats.total_searches).toFixed(2)
      : 0;
    
    stats.unique_services = stats.unique_services.size;
    stats.unique_locations = stats.unique_locations.size;
    
    // Top 10 keywords
    stats.top_keywords = Object.entries(stats.top_keywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
    
    return stats;
    
  } catch (error) {
    console.error('❌ [SEARCH-ANALYTICS] Error obteniendo stats:', error);
    throw error;
  }
}

export default {
  captureSearch,
  recordSearchResults,
  recordUserInteraction,
  getSearchStats,
  CONFIG  // Exportar para poder modificar en runtime
};

export {
  captureSearch,
  recordSearchResults,
  recordUserInteraction,
  getSearchStats,
  CONFIG
};
