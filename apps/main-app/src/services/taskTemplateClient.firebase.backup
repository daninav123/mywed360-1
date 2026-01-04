import { doc, getDoc } from 'firebase/firestore';

import fallbackTemplate from '../data/tasks/masterTimelineTemplate.json';
import { db } from '../firebaseConfig';
import { getActiveTaskTemplate } from './taskTemplateService';

const CACHE_TTL_MS = 60 * 1000;
let cachedTemplate = null;
let cachedAt = 0;

function isValidTemplate(template) {
  return template && typeof template === 'object' && Array.isArray(template.blocks) && template.blocks.length > 0;
}

function normalizeTemplate(data) {
  if (!data || typeof data !== 'object') return fallbackTemplate;
  const version = Number(data.version || data.schemaVersion) || Number(fallbackTemplate.version || 1) || 1;
  const status = typeof data.status === 'string' ? data.status : 'published';
  const name = typeof data.name === 'string' ? data.name : (fallbackTemplate.name || 'Plantilla');
  return {
    ...data,
    version,
    status,
    name,
    blocks: Array.isArray(data.blocks) ? data.blocks : [],
  };
}

/**
 * Obtiene la plantilla de tareas publicada desde adminTaskTemplates
 * Reemplaza el sistema legacy de config/taskTemplate
 */
export async function fetchPublishedTaskTemplate({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && cachedTemplate && now - cachedAt < CACHE_TTL_MS) {
    return cachedTemplate;
  }

  if (!db) {
    cachedTemplate = fallbackTemplate;
    cachedAt = now;
    return fallbackTemplate;
  }

  try {
    // NUEVO: Usar sistema de adminTaskTemplates
    const template = await getActiveTaskTemplate();
    
    if (template && isValidTemplate(template)) {
      const normalized = normalizeTemplate(template);
      cachedTemplate = normalized;
      cachedAt = now;
      return normalized;
    }

    // Fallback legacy: intentar config/taskTemplate (por compatibilidad)
    try {
      const configRef = doc(db, 'config', 'taskTemplate');
      const snap = await getDoc(configRef);
      if (snap.exists()) {
        const data = snap.data();
        if (isValidTemplate(data)) {
          const normalized = normalizeTemplate(data);
          cachedTemplate = normalized;
          cachedAt = now;
          // console.warn('[taskTemplateClient] Usando plantilla legacy de config/taskTemplate. Migrar a adminTaskTemplates.');
          return normalized;
        }
      }
    } catch (legacyError) {
      // console.warn('[taskTemplateClient] Fallback legacy falló:', legacyError);
    }
  } catch (error) {
    // console.warn('[taskTemplateClient] fetchPublishedTaskTemplate failed', error);
  }

  // Último fallback: plantilla hardcodeada
  cachedTemplate = fallbackTemplate;
  cachedAt = now;
  return fallbackTemplate;
}

export function invalidateTaskTemplateCache() {
  cachedTemplate = null;
  cachedAt = 0;
}
