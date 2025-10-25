/**
 * Servicio de caché inteligente para componentes React
 * Optimiza el rendimiento cachéando resultados de componentes pesados
 */

import i18n from '../i18n';
import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Caché global en memoria
const globalCache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0,
};

// Configuración por defecto
const DEFAULT_CONFIG = {
  maxSize: 100, // Máximo número de entradas en caché
  ttl: 5 * 60 * 1000, // 5 minutos en millisegundos
  enableStats: true,
};

/**
 * Genera una clave de caché basada en props y dependencias
 * @param {string} componentName - Nombre del componente
 * @param {Object} props - Props del componente
 * @param {Array} deps - Dependencias adicionales
 * @returns {string} - Clave única de caché
 */
const generateCacheKey = (componentName, props = {}, deps = []) => {
  const propsString = JSON.stringify(props, Object.keys(props).sort());
  const depsString = JSON.stringify(deps);
  return `${componentName}:${btoa(propsString + depsString)}`;
};

/**
 * Limpia entradas expiradas del caché
 */
const cleanExpiredEntries = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of globalCache.entries()) {
    if (now > entry.expiresAt) {
      globalCache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    cacheStats.evictions += cleaned;
    console.log(`[ComponentCache] Limpiadas ${cleaned} entradas expiradas`);
  }
};

/**
 * Aplica política LRU cuando el caché está lleno
 */
const evictLRU = () => {
  if (globalCache.size <= DEFAULT_CONFIG.maxSize) return;

  // Encontrar la entrada menos recientemente usada
  let oldestKey = null;
  let oldestTime = Infinity;

  for (const [key, entry] of globalCache.entries()) {
    if (entry.lastAccessed < oldestTime) {
      oldestTime = entry.lastAccessed;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    globalCache.delete(oldestKey);
    cacheStats.evictions++;
  }
};

/**
 * Hook para cachear resultados de computaciones pesadas en componentes
 * @param {Function} computeFn - Función de computación
 * @param {Array} deps - Dependencias
 * @param {Object} options - Opciones de caché
 * @returns {any} - Resultado cacheado
 */
export const useCachedComputation = (computeFn, deps = [], options = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options };
  const componentName = options.name || 'anonymousi18n.t('common.return_usememo_const_cachekey_generatecachekeycomponentname_deps')CachedComponenti18n.t('common.return_usememo_const_cachekey_generatecachekeycomponentname_props')undefined' && (globalThis.vi || globalThis.vitest || globalThis.jest)) || (typeof process !== 'undefined' && process.env && (process.env.VITEST || process.env.NODE_ENV === 'test')) || (typeof import.meta !== 'undefined' && (import.meta.vitest || (import.meta.env && import.meta.env.MODE === 'test'))));
if (!__IS_TEST__) { setInterval(cleanExpiredEntries, 5 * 60 * 1000); }

export default {
  useCachedComputation,
  useCachedComponent,
  useCacheInvalidation,
  withCache,
  getCacheStats,
  clearCache,
  useCacheMonitor,
};

