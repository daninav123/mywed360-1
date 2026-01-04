/**
 * WeddingService - Versión PostgreSQL
 * Gestión de bodas, acceso y permisos usando API backend
 */

import { performanceMonitor } from './PerformanceMonitor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

/**
 * Crea una nueva boda
 * @param {string} uid - UID del usuario creador
 * @param {object} extraData - Datos opcionales de la boda
 * @returns {Promise<string>} weddingId creado
 */
export async function createWedding(uid, extraData = {}) {
  if (!uid) throw new Error('uid requerido');
  
  console.log('[WeddingService] Creando boda en PostgreSQL para user:', uid);
  
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    const response = await fetch(`${API_URL}/api/weddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coupleName: extraData.name || 'Mi Boda',
        weddingDate: extraData.weddingDate || extraData.date || null,
        celebrationPlace: extraData.location || extraData.banquetPlace || null,
        status: 'planning',
        numGuests: extraData.numGuests || null,
        eventType: extraData.eventType || 'boda',
        ...extraData
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error creando boda');
    }
    
    const result = await response.json();
    const weddingId = result.data.id;
    
    console.log('[WeddingService] Boda creada en PostgreSQL:', weddingId);
    
    try {
      performanceMonitor?.logEvent?.('wedding_created_postgresql', {
        weddingId,
        userId: uid,
        source: 'WeddingService'
      });
    } catch {}
    
    return weddingId;
  } catch (error) {
    console.error('[WeddingService] Error creando boda:', error);
    throw error;
  }
}

/**
 * Actualizar permisos de módulos de una boda
 * @param {string} weddingId 
 * @param {object} modulePermissions 
 */
export async function updateWeddingModulePermissions(weddingId, modulePermissions = {}) {
  if (!weddingId) throw new Error('weddingId requerido');
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/weddings/${weddingId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ modulePermissions })
    });
    
    if (!response.ok) throw new Error('Error actualizando permisos');
    return true;
  } catch (error) {
    console.error('[WeddingService] Error actualizando permisos:', error);
    throw error;
  }
}

/**
 * Seed default tasks - Delegado al backend
 */
export async function seedDefaultTasksForWedding(weddingId, weddingData) {
  console.log('[WeddingService] seedDefaultTasksForWedding - usar endpoint backend /api/tasks/seed');
  // TODO: Implementar endpoint backend para seed de tareas
  return { success: true };
}

/**
 * Migración de subtareas - No necesario en PostgreSQL
 */
export async function migrateFlatSubtasksToNested(weddingId) {
  console.log('[WeddingService] migrateFlatSubtasksToNested - no necesario en PostgreSQL');
  return { moved: 0 };
}

/**
 * Invitar pareja a la boda
 */
export async function invitePartner(weddingId, email) {
  return createInvitation(weddingId, email, 'partner');
}

/**
 * Invitar planner a la boda
 */
export async function invitePlanner(weddingId, email) {
  return createInvitation(weddingId, email, 'planner');
}

/**
 * Crear invitación genérica
 */
async function createInvitation(weddingId, email, role = 'partner') {
  if (!weddingId || !email) throw new Error('parámetros requeridos');
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/weddings/${weddingId}/invitations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, role })
    });
    
    if (!response.ok) throw new Error('Error creando invitación');
    
    const result = await response.json();
    return result.invitationCode || result.code;
  } catch (error) {
    console.error('[WeddingService] Error creando invitación:', error);
    throw error;
  }
}

/**
 * Aceptar invitación
 */
export async function acceptInvitation(code, uid) {
  if (!code || !uid) throw new Error('parámetros requeridos');
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/weddings/invitations/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });
    
    if (!response.ok) throw new Error('Error aceptando invitación');
    
    const result = await response.json();
    return result.weddingId;
  } catch (error) {
    console.error('[WeddingService] Error aceptando invitación:', error);
    throw error;
  }
}

/**
 * Obtener ID de boda para un owner
 */
export async function getWeddingIdForOwner(uid) {
  if (!uid) return null;
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/weddings?userId=${uid}&limit=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return null;
    
    const result = await response.json();
    const weddings = result.weddings || result.data || [];
    return weddings.length > 0 ? weddings[0].id : null;
  } catch (error) {
    console.error('[WeddingService] Error obteniendo wedding:', error);
    return null;
  }
}

/**
 * Obtener bodas de un planner
 */
export async function getWeddingsForPlanner(plannerUid) {
  if (!plannerUid) return [];
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/weddings?plannerId=${plannerUid}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return [];
    
    const result = await response.json();
    return result.weddings || result.data || [];
  } catch (error) {
    console.error('[WeddingService] Error obteniendo bodas planner:', error);
    return [];
  }
}

/**
 * Añadir planner a una boda
 */
export async function addPlannerToWedding(weddingId, plannerUid) {
  if (!weddingId || !plannerUid) throw new Error('parámetros requeridos');
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/weddings/${weddingId}/access`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: plannerUid,
        role: 'planner'
      })
    });
    
    if (!response.ok) throw new Error('Error añadiendo planner');
    return true;
  } catch (error) {
    console.error('[WeddingService] Error añadiendo planner:', error);
    throw error;
  }
}

/**
 * Fix parent block dates - No necesario en PostgreSQL
 */
export async function fixParentBlockDates(weddingId, ganttStart = null, ganttEnd = null) {
  console.log('[WeddingService] fixParentBlockDates - no necesario en PostgreSQL');
  return { updated: 0 };
}

// Re-exportar funciones legacy como stubs
export const DEFAULT_EVENT_TYPE = 'boda';
