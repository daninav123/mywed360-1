import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import defaultWeddingTasks from './defaultWeddingTasks';
import errorLogger from '../utils/errorLogger';
import { getBackendBase } from '../utils/backendBase';

const COLLECTION_NAME = 'adminTaskTemplates';
const BACKEND_URL = getBackendBase();

/**
 * Obtiene la plantilla de tareas actualmente publicada
 * @returns {Promise<Object|null>} Plantilla activa o null
 */
export async function getActiveTaskTemplate() {
  try {
    // Primero intentar desde backend (tiene caché y optimizaciones)
    try {
      const response = await fetch(`${BACKEND_URL}/api/task-templates/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.template) {
          return data.template;
        }
      }
    } catch (backendError) {
      // console.warn('[taskTemplateService] Backend no disponible, usando Firestore directo:', backendError.message);
    }

    // Fallback: consulta directa a Firestore
    const templatesRef = collection(db, COLLECTION_NAME);
    const q = query(
      templatesRef,
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // console.warn('[taskTemplateService] No hay plantilla publicada, usando seed por defecto');
      return null;
    }

    const templateDoc = snapshot.docs[0];
    const template = {
      id: templateDoc.id,
      ...templateDoc.data(),
    };

    return template;
  } catch (error) {
    errorLogger?.logError?.('TaskTemplateServiceError', {
      action: 'getActiveTaskTemplate',
      message: error.message,
    });
    // console.error('[taskTemplateService] Error obteniendo plantilla activa:', error);
    return null;
  }
}

/**
 * Transforma la plantilla con fechas relativas a tareas con fechas absolutas
 * @param {Object} template - Plantilla de tareas
 * @param {Date|string} weddingDate - Fecha de la boda
 * @returns {Array} Array de tareas con fechas calculadas
 */
export function transformTemplateToTasks(template, weddingDate) {
  if (!template || !template.blocks || !Array.isArray(template.blocks)) {
    // console.warn('[taskTemplateService] Plantilla inválida, usando seed por defecto');
    return transformLegacySeedToTasks(defaultWeddingTasks, weddingDate);
  }

  const wDate = weddingDate instanceof Date ? weddingDate : new Date(weddingDate);
  
  if (isNaN(wDate.getTime())) {
    // console.error('[taskTemplateService] Fecha de boda inválida');
    return [];
  }

  const tasks = [];

  template.blocks.forEach((block) => {
    // Crear tarea padre
    const parentTask = {
      id: block.id || `block_${Date.now()}_${Math.random()}`,
      title: block.name || block.title || 'Sin título',
      category: block.category || 'GENERAL',
      phaseStartPct: block.startPct || 0,
      phaseEndPct: block.endPct || 100,
      isParent: true,
      completed: false,
      children: [],
      createdAt: new Date(),
    };

    // Si el bloque tiene fechas, calcularlas
    if (typeof block.daysBeforeWedding === 'number') {
      const startDate = new Date(wDate);
      startDate.setDate(startDate.getDate() - block.daysBeforeWedding);
      parentTask.startDate = startDate;

      if (typeof block.durationDays === 'number') {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + block.durationDays);
        parentTask.endDate = endDate;
      }
    }

    // Procesar subtareas
    if (block.items && Array.isArray(block.items)) {
      block.items.forEach((item) => {
        const childTask = {
          id: item.id || `task_${Date.now()}_${Math.random()}`,
          title: item.name || item.title || 'Sin título',
          category: item.category || block.category || 'GENERAL',
          completed: false,
          parentId: parentTask.id,
          assigneeSuggestion: item.assigneeSuggestion || null,
          checklist: item.checklist || [],
          createdAt: new Date(),
        };

        // Calcular fechas de la subtarea
        if (typeof item.daysBeforeWedding === 'number') {
          const startDate = new Date(wDate);
          startDate.setDate(startDate.getDate() - item.daysBeforeWedding);
          childTask.startDate = startDate;

          if (typeof item.durationDays === 'number') {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + item.durationDays);
            childTask.endDate = endDate;
          }
        }

        parentTask.children.push(childTask.id);
        tasks.push(childTask);
      });
    }

    tasks.push(parentTask);
  });

  return tasks;
}

/**
 * Transforma el seed legacy (defaultWeddingTasks.js) al formato de tareas
 * @param {Array} legacySeed - Array del seed legacy
 * @param {Date|string} weddingDate - Fecha de la boda
 * @returns {Array} Array de tareas
 */
function transformLegacySeedToTasks(legacySeed, weddingDate) {
  if (!Array.isArray(legacySeed)) {
    return [];
  }

  const wDate = weddingDate instanceof Date ? weddingDate : new Date(weddingDate);
  
  if (isNaN(wDate.getTime())) {
    // console.error('[taskTemplateService] Fecha de boda inválida');
    return [];
  }

  const tasks = [];

  legacySeed.forEach((parent) => {
    // Crear tarea padre
    const parentTask = {
      id: parent.id || `parent_${Date.now()}_${Math.random()}`,
      title: parent.title || 'Sin título',
      category: parent.category || 'GENERAL',
      phaseStartPct: parent.phaseStartPct || 0,
      phaseEndPct: parent.phaseEndPct || 100,
      isParent: true,
      completed: false,
      children: [],
      createdAt: new Date(),
    };

    // Calcular fechas del padre
    if (typeof parent.startOffsetDays === 'number') {
      const startDate = new Date(wDate);
      startDate.setDate(startDate.getDate() + parent.startOffsetDays);
      parentTask.startDate = startDate;

      if (typeof parent.durationDays === 'number') {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + parent.durationDays);
        parentTask.endDate = endDate;
      }
    }

    // Procesar hijos
    if (parent.children && Array.isArray(parent.children)) {
      parent.children.forEach((child) => {
        const childTask = {
          id: child.id || `child_${Date.now()}_${Math.random()}`,
          title: child.title || 'Sin título',
          category: parent.category || 'GENERAL',
          completed: false,
          parentId: parentTask.id,
          createdAt: new Date(),
        };

        // Calcular fechas del hijo
        if (typeof child.startOffsetDays === 'number') {
          const startDate = new Date(wDate);
          startDate.setDate(startDate.getDate() + child.startOffsetDays);
          childTask.startDate = startDate;

          if (typeof child.durationDays === 'number') {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + child.durationDays);
            childTask.endDate = endDate;
          }
        }

        parentTask.children.push(childTask.id);
        tasks.push(childTask);
      });
    }

    tasks.push(parentTask);
  });

  return tasks;
}

/**
 * Migra el seed hardcodeado a Firebase como plantilla v1
 * IMPORTANTE: Ejecutar solo una vez
 * @returns {Promise<string>} ID de la plantilla creada
 */
export async function migrateDefaultSeedToFirebase() {
  try {
    // Verificar si ya existe plantilla con version "1"
    const templatesRef = collection(db, COLLECTION_NAME);
    const existingQuery = query(templatesRef, where('version', '==', '1'));
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      // console.log('[taskTemplateService] Plantilla v1 ya existe, saltando migración');
      return existingSnapshot.docs[0].id;
    }

    // Transformar seed legacy al nuevo formato
    const blocks = defaultWeddingTasks.map((parent) => {
      const block = {
        id: parent.id,
        name: parent.title,
        category: parent.category,
        startPct: parent.phaseStartPct || 0,
        endPct: parent.phaseEndPct || 100,
        items: [],
      };

      // Convertir fechas: el legacy usa startOffsetDays (puede ser negativo)
      // El nuevo formato usa daysBeforeWedding (siempre positivo para "antes")
      if (typeof parent.startOffsetDays === 'number') {
        // Si es negativo (-150), significa 150 días ANTES
        block.daysBeforeWedding = parent.startOffsetDays < 0 ? Math.abs(parent.startOffsetDays) : 0;
        block.durationDays = parent.durationDays || 0;
      }

      if (parent.children && Array.isArray(parent.children)) {
        block.items = parent.children.map((child) => {
          const item = {
            id: child.id,
            name: child.title,
            category: parent.category,
            assigneeSuggestion: 'both',
            checklist: [],
          };

          if (typeof child.startOffsetDays === 'number') {
            item.daysBeforeWedding = child.startOffsetDays < 0 ? Math.abs(child.startOffsetDays) : 0;
            item.durationDays = child.durationDays || 0;
          }

          return item;
        });
      }

      return block;
    });

    // Calcular totales
    const totals = {
      blocks: blocks.length,
      subtasks: blocks.reduce((sum, block) => sum + (block.items?.length || 0), 0),
    };

    // Crear plantilla en Firebase
    const templateData = {
      version: '1',
      status: 'published',
      name: 'Plantilla Base Migrada',
      notes: 'Migración automática desde defaultWeddingTasks.js',
      blocks,
      totals,
      updatedAt: serverTimestamp(),
      publishedAt: serverTimestamp(),
      updatedBy: 'system_migration',
    };

    const docRef = await addDoc(templatesRef, templateData);
    // console.log('[taskTemplateService] Plantilla v1 creada con ID:', docRef.id);

    return docRef.id;
  } catch (error) {
    errorLogger?.logError?.('TaskTemplateServiceError', {
      action: 'migrateDefaultSeedToFirebase',
      message: error.message,
    });
    // console.error('[taskTemplateService] Error migrando seed:', error);
    throw error;
  }
}

/**
 * Obtiene todas las tareas para una nueva boda
 * Intenta usar plantilla activa, fallback a seed legacy
 * @param {Date|string} weddingDate - Fecha de la boda
 * @returns {Promise<Array>} Array de tareas
 */
export async function getTasksForNewWedding(weddingDate) {
  try {
    // Intentar obtener plantilla activa
    const template = await getActiveTaskTemplate();

    if (template) {
      // console.log('[taskTemplateService] Usando plantilla activa:', template.id);
      return transformTemplateToTasks(template, weddingDate);
    }

    // Fallback a seed hardcodeado
    // console.warn('[taskTemplateService] No hay plantilla activa, usando seed por defecto');
    return transformLegacySeedToTasks(defaultWeddingTasks, weddingDate);
  } catch (error) {
    errorLogger?.logError?.('TaskTemplateServiceError', {
      action: 'getTasksForNewWedding',
      message: error.message,
    });
    // console.error('[taskTemplateService] Error obteniendo tareas:', error);
    
    // Fallback final
    return transformLegacySeedToTasks(defaultWeddingTasks, weddingDate);
  }
}

export default {
  getActiveTaskTemplate,
  transformTemplateToTasks,
  migrateDefaultSeedToFirebase,
  getTasksForNewWedding,
};
