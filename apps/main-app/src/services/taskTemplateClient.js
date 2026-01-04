/**
 * Task Template Client - PostgreSQL Version
 * Usa API backend para plantillas de tareas
 */

import fallbackTemplate from '../data/tasks/masterTimelineTemplate.json';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

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

export async function fetchPublishedTaskTemplate({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && cachedTemplate && now - cachedAt < CACHE_TTL_MS) {
    return cachedTemplate;
  }

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/task-templates/active`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const result = await response.json();
      const template = result.template || result.data;
      
      if (template && isValidTemplate(template)) {
        const normalized = normalizeTemplate(template);
        cachedTemplate = normalized;
        cachedAt = now;
        return normalized;
      }
    }
  } catch (error) {
    console.warn('[taskTemplateClient] Error fetching template:', error);
  }

  cachedTemplate = fallbackTemplate;
  cachedAt = now;
  return fallbackTemplate;
}

export function clearTemplateCache() {
  cachedTemplate = null;
  cachedAt = 0;
}
