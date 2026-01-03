/**
 * Servicio para gestionar etiquetas (tags) de correo
 * Permite crear, eliminar, asignar y filtrar etiquetas para correos
 */
import { get as apiGet, put as apiPut } from './apiClient';
import { USE_BACKEND } from './emailService';
import { v4 as uuidv4 } from 'uuid';

import { updateMailTags as updateMailTagsBackend } from './emailService';
import { _getStorage, loadJson, saveJson } from '../utils/storage.js';

// Caché en memoria para tests y runtime rápido
const runtimeCustomTags = {};

// Claves para almacenamiento local
const TAGS_STORAGE_KEY = 'maloveapp_email_tags';
const EMAIL_TAGS_MAPPING_KEY = 'maloveapp_email_tags_mapping';

// Etiquetas predefinidas por el sistema
export const SYSTEM_TAGS = [
  { id: 'important', name: 'Importante', color: '#e53e3e' }, // Rojo
  { id: 'work', name: 'Trabajo', color: '#3182ce' }, // Azul
  { id: 'personal', name: 'Personal', color: '#38a169' }, // Verde
  { id: 'invitation', name: 'Invitación', color: '#805ad5' }, // Morado
  { id: 'provider', name: 'Proveedor', color: '#dd6b20' }, // Naranja
];

function fireAndForget(promise) {
  if (promise && typeof promise.then === 'function' && typeof promise.catch === 'function') {
    promise.catch(() => {});
  }
}

/**
 * Obtener todas las etiquetas disponibles para un usuario
 * Incluye tanto etiquetas del sistema como personalizadas
 * @param {string} userId - ID del usuario
 * @returns {Array} - Array de objetos de etiqueta
 */
export const getUserTags = (userId) => {
  try {
    fireAndForget(refreshTagsFromCloud(userId));
  } catch {}
  const storageKey = `${TAGS_STORAGE_KEY}_${userId}`;
  try {
    const storage = _getStorage();

    // Llamada explícita para que el spy de los tests registre la lectura
    const raw = storage.getItem(storageKey);

    // Parsear resultado (si existe)
    let customTags = [];
    if (raw) {
      try {
        customTags = JSON.parse(raw);
      } catch {
        customTags = [];
      }
    }

    // Actualizar caché
    runtimeCustomTags[userId] = customTags;

    return [...SYSTEM_TAGS, ...customTags];
  } catch (error) {
    // console.error('Error al obtener etiquetas:', error);
    return [...SYSTEM_TAGS];
  }
};

/**
 * Obtener solo las etiquetas personalizadas de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Array} - Array de objetos de etiqueta personalizados
 */
export const getCustomTags = (userId) => {
  try {
    const storageKey = `${TAGS_STORAGE_KEY}_${userId}`;
    const storage = _getStorage();
    const raw = storage.getItem(storageKey);

    if (!raw) {
      runtimeCustomTags[userId] = [];
      return [];
    }

    let fromStorage = [];
    try {
      fromStorage = JSON.parse(raw);
    } catch {
      fromStorage = [];
    }

    runtimeCustomTags[userId] = Array.isArray(fromStorage) ? fromStorage : [];
    return runtimeCustomTags[userId];
  } catch (error) {
    // console.error('Error al obtener etiquetas personalizadas:', error);
    return runtimeCustomTags[userId] || [];
  }
};

/**
 * Crear una nueva etiqueta personalizada
 * @param {string} userId - ID del usuario
 * @param {string} tagName - Nombre de la etiqueta
 * @param {string} color - Color de la etiqueta en formato hex
 * @returns {Object} - Objeto con la etiqueta creada
 */
export const createTag = (userId, tagName, color = '#64748b') => {
  try {
    const tags = getCustomTags(userId);

    // Verificar duplicado exacto (case-insensitive) entre sistema y personalizadas
    const allTags = [...SYSTEM_TAGS, ...tags];
    // Si existe duplicado, generar nombre con sufijo incremental " (n)"
    let finalName = tagName.trim();
    if (!finalName) {
      throw new Error('El nombre de la etiqueta no puede estar vacío');
    }
    const baseLower = finalName.toLowerCase();
    let counter = 0;
    // Buscar siguiente número libre
    while (
      allTags.some(
        (t) => t.name.toLowerCase() === (counter === 0 ? baseLower : `${baseLower} (${counter})`)
      )
    ) {
      counter += 1;
    }
    if (counter > 0) {
      finalName = `${finalName} (${counter})`;
    }
    // Limitar longitud a 50 caracteres para estabilidad en UI/tests
    if (finalName.length > 50) {
      finalName = finalName.slice(0, 50);
    }

    // Crear nueva etiqueta
    const newTag = {
      id: uuidv4(),
      name: finalName,
      color,
      createdAt: new Date().toISOString(),
    };

    // Guardar etiquetas actualizadas
    const updatedTags = [...tags, newTag];
    saveUserTags(userId, updatedTags);

    return newTag;
  } catch (error) {
    // console.error('Error al crear etiqueta:', error);
    throw error;
  }
};

/**
 * Eliminar una etiqueta personalizada
 * @param {string} userId - ID del usuario
 * @param {string} tagId - ID de la etiqueta
 * @returns {Object} - { success: boolean }
 */
export const deleteTag = (userId, tagId) => {
  try {
    // Si es etiqueta del sistema, no se puede eliminar -> false
    const isSystemTag = SYSTEM_TAGS.some((tag) => tag.id === tagId);
    if (isSystemTag) {
      throw new Error('No se pueden eliminar etiquetas del sistema');
    }

    const tags = getCustomTags(userId);

    // Comprobar si la etiqueta existe realmente
    const exists = tags.some((tag) => tag.id === tagId);
    if (!exists) {
      return false; // Nada que eliminar
    }

    // Filtrar la etiqueta a eliminar
    const updatedTags = tags.filter((tag) => tag.id !== tagId);

    // Guardar etiquetas actualizadas
    saveUserTags(userId, updatedTags);

    // También eliminar asignaciones de esta etiqueta a correos
    removeTagFromAllEmails(userId, tagId);

    return true;
  } catch (error) {
    // console.error('Error al eliminar etiqueta:', error);
    throw error;
  }
};

/**
 * Guardar etiquetas personalizadas del usuario
 * @param {string} userId - ID del usuario
 * @param {Array} tags - Array de objetos de etiqueta
 * @private
 */
const saveUserTags = (userId, tags) => {
  runtimeCustomTags[userId] = tags;
  const storageKey = `${TAGS_STORAGE_KEY}_${userId}`;
  saveJson(storageKey, tags);
  if (USE_BACKEND) {
    fireAndForget(mirrorTagsToCloud(userId, tags));
  }
};

/**
 * Obtener mapeo de correos a etiquetas para un usuario
 * @param {string} userId - ID del usuario
 * @returns {Object} - Objeto con mapeos de correos a etiquetas
 * @private
 */
const getEmailTagsMapping = (userId) => {
  try {
    try {
      refreshTagsMappingFromCloud(userId);
    } catch {}
    const storageKey = `${EMAIL_TAGS_MAPPING_KEY}_${userId}`;
    return loadJson(storageKey, {});
  } catch (error) {
    // console.error('Error al obtener mapeo de correos a etiquetas:', error);
    return {};
  }
};

/**
 * Guardar mapeo de correos a etiquetas
 * @param {string} userId - ID del usuario
 * @param {Object} mapping - Objeto con mapeos de correos a etiquetas
 * @private
 */
const saveEmailTagsMapping = (userId, mapping) => {
  const storageKey = `${EMAIL_TAGS_MAPPING_KEY}_${userId}`;
  saveJson(storageKey, mapping);
  if (USE_BACKEND) {
    fireAndForget(mirrorTagsMappingToCloud(userId, mapping));
  }
};

// Refrescos desde nube (no bloqueantes)
async function mirrorTagsToCloud(userId, tags) {
  try {
    if (!USE_BACKEND || !userId) return;
    await apiPut(
      '/api/email/tags',
      { tags: Array.isArray(tags) ? tags : [] },
      { auth: true, silent: true }
    );
  } catch (error) {
    // console.warn('[tagService] sync tags failed', error?.message || error);
  }
}

async function mirrorTagsMappingToCloud(userId, mapping) {
  try {
    if (!USE_BACKEND || !userId) return;
    await apiPut(
      '/api/email/tags/mapping',
      { mapping: mapping && typeof mapping === 'object' ? mapping : {} },
      { auth: true, silent: true }
    );
  } catch (error) {
    // console.warn('[tagService] sync tags mapping failed', error?.message || error);
  }
}

async function refreshTagsFromCloud(userId) {
  try {
    if (!USE_BACKEND || !userId) return;
    const res = await apiGet('/api/email/tags', { auth: true, silent: true });
    if (!res || !res.ok) return;
    const payload = await res.json();
    if (payload && Array.isArray(payload.tags)) {
      runtimeCustomTags[userId] = payload.tags;
      const storageKey = `${TAGS_STORAGE_KEY}_${userId}`;
      saveJson(storageKey, payload.tags);
    }
    if (payload && payload.mapping && typeof payload.mapping === 'object') {
      const mappingKey = `${EMAIL_TAGS_MAPPING_KEY}_${userId}`;
      saveJson(mappingKey, payload.mapping);
    }
  } catch (error) {
    // console.warn('[tagService] refresh tags failed', error?.message || error);
  }
}

async function refreshTagsMappingFromCloud(userId) {
  try {
    if (!USE_BACKEND || !userId) return;
    const res = await apiGet('/api/email/tags/mapping', { auth: true, silent: true });
    if (!res || !res.ok) return;
    const payload = await res.json();
    if (payload && payload.mapping && typeof payload.mapping === 'object') {
      const storageKey = `${EMAIL_TAGS_MAPPING_KEY}_${userId}`;
      saveJson(storageKey, payload.mapping);
    }
  } catch (error) {
    // console.warn('[tagService] refresh tags mapping failed', error?.message || error);
  }
}

/**
 * Asignar una etiqueta a un correo
 * @param {string} userId - ID del usuario
 * @param {string} emailId - ID del correo
 * @param {string} tagId - ID de la etiqueta
 * @returns {boolean} - true si se asignó con éxito
 */
export const addTagToEmail = (userId, emailId, tagId) => {
  try {
    // Verificar que la etiqueta existe
    let allTags = getUserTags(userId);
    let tagExists = allTags.some((tag) => tag.id === tagId);

    // Si no se encuentra, forzar recarga desde storage para evitar desincronización de caché
    if (!tagExists) {
      runtimeCustomTags[userId] = undefined; // invalidar caché
      allTags = getUserTags(userId);
      tagExists = allTags.some((tag) => tag.id === tagId);
    }

    if (!tagExists) {
      throw new Error('La etiqueta especificada no existe');
    }

    // Obtener mapeo actual
    const mapping = getEmailTagsMapping(userId);

    // Inicializar array de etiquetas para este correo si no existe
    if (!mapping[emailId]) {
      mapping[emailId] = [];
    }

    // Verificar si la etiqueta ya está asignada
    if (!mapping[emailId].includes(tagId)) {
      mapping[emailId].push(tagId);
      // Guardar mapeo actualizado
      saveEmailTagsMapping(userId, mapping);
      // Espejo en backend (best‑effort)
      try {
        fireAndForget(updateMailTagsBackend(emailId, { add: [tagId] }));
      } catch {}
    }
    return true;
  } catch (error) {
    // console.error('Error al asignar etiqueta a correo:', error);
    throw error;
  }
};

/**
 * Quitar una etiqueta de un correo
 * @param {string} userId - ID del usuario
 * @param {string} emailId - ID del correo
 * @param {string} tagId - ID de la etiqueta
 * @returns {boolean} - true si se quitó con éxito
 */
export const removeTagFromEmail = (userId, emailId, tagId) => {
  try {
    // Obtener mapeo actual
    const mapping = getEmailTagsMapping(userId);

    // Si el correo no tiene etiquetas, no hay nada que hacer
    if (!mapping[emailId]) {
      return true;
    }

    const originalLength = mapping[emailId].length;
    // Filtrar la etiqueta a quitar
    mapping[emailId] = mapping[emailId].filter((id) => id !== tagId);
    if (mapping[emailId].length === originalLength) {
      return true; // No había la etiqueta; consideramos operación exitosa
    }
    // Guardar mapeo actualizado
    saveEmailTagsMapping(userId, mapping);
    // Espejo en backend (best‑effort)
    try {
      fireAndForget(updateMailTagsBackend(emailId, { remove: [tagId] }));
    } catch {}
    return true;
  } catch (error) {
    // console.error('Error al quitar etiqueta de correo:', error);
    throw error;
  }
};

/**
 * Quitar una etiqueta de todos los correos
 * @param {string} userId - ID del usuario
 * @param {string} tagId - ID de la etiqueta
 * @returns {boolean} - true si se quitó con éxito
 * @private
 */
export const removeTagFromAllEmails = (userId, tagId) => {
  try {
    // Obtener mapeo actual
    const mapping = getEmailTagsMapping(userId);

    // Filtrar la etiqueta de todos los correos
    Object.keys(mapping).forEach((emailId) => {
      mapping[emailId] = mapping[emailId].filter((id) => id !== tagId);
    });

    // Guardar mapeo actualizado
    saveEmailTagsMapping(userId, mapping);

    return true;
  } catch (error) {
    // console.error('Error al quitar etiqueta de todos los correos:', error);
    throw error;
  }
};

/**
 * Obtener todas las etiquetas asignadas a un correo
 * @param {string} userId - ID del usuario
 * @param {string} emailId - ID del correo
 * @returns {Array} - Array de IDs de etiquetas
 */
export const getEmailTags = (userId, emailId) => {
  try {
    const mapping = getEmailTagsMapping(userId);
    return mapping[emailId] || [];
  } catch (error) {
    // console.error('Error al obtener etiquetas de correo:', error);
    return [];
  }
};

/**
 * Obtener etiquetas completas (con nombre, color, etc) de un correo
 * @param {string} userId - ID del usuario
 * @param {string} emailId - ID del correo
 * @returns {Array} - Array de objetos de etiqueta completos
 */
export const getEmailTagsDetails = (userId, emailId) => {
  try {
    const tagIds = getEmailTags(userId, emailId);
    if (!tagIds.length) return [];

    const allTags = getUserTags(userId);
    return tagIds
      .map((tagId) => allTags.find((tag) => tag.id === tagId))
      .filter((tag) => tag !== undefined); // Filtrar etiquetas que ya no existen
  } catch (error) {
    // console.error('Error al obtener detalles de etiquetas:', error);
    return [];
  }
};

/**
 * Obtener todos los correos que tienen una etiqueta específica
 * @param {string} userId - ID del usuario
 * @param {string} tagId - ID de la etiqueta
 * @returns {Array} - Array de IDs de correos
 */
export const getEmailsByTag = (userId, tagId) => {
  try {
    const mapping = getEmailTagsMapping(userId);

    // Filtrar correos que tienen esta etiqueta
    return Object.entries(mapping)
      .filter(([_, tagIds]) => tagIds.includes(tagId))
      .map(([emailId, _]) => emailId);
  } catch (error) {
    // console.error('Error al obtener correos por etiqueta:', error);
    return [];
  }
};
