// services/suppliersService.js
// Servicio para búsqueda híbrida de proveedores (Fase 2)

import { auth } from '../firebaseConfig';

/**
 * Buscar proveedores con el nuevo sistema híbrido
 * Primero busca en BD (registrados + cache), luego complementa con Tavily
 */
export async function searchSuppliersHybrid(service, location, query = '', budget = null, filters = {}) {
  try {
    // Obtener token de Firebase Auth
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch('/api/suppliers/search', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        service,
        location,
        query,
        budget,
        filters
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error en búsqueda híbrida:', error);
    throw error;
  }
}

/**
 * Registrar acción de usuario (view, click, contact, confirm)
 * @param {string} supplierId - ID del proveedor
 * @param {string} action - Acción realizada (view, click, contact, confirm)
 * @param {string|object} userIdOrMetadata - userId o metadata adicional { userId, method, ... }
 */
export async function trackSupplierAction(supplierId, action, userIdOrMetadata = null) {
  try {
    // Soporte para metadata como objeto o solo userId
    const metadata = typeof userIdOrMetadata === 'object' ? userIdOrMetadata : { userId: userIdOrMetadata };
    
    await fetch(`/api/suppliers/${supplierId}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        action,
        ...metadata
      })
    });
  } catch (error) {
    // No propagar error, es tracking
    console.warn('Error tracking action:', error);
  }
}

/**
 * Obtener detalles de un proveedor
 */
export async function getSupplierDetails(supplierId) {
  try {
    const response = await fetch(`/api/suppliers/${supplierId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Proveedor no encontrado');
    }

    const data = await response.json();
    return data.supplier;
    
  } catch (error) {
    console.error('Error obteniendo detalles:', error);
    throw error;
  }
}

/**
 * [LEGACY] Búsqueda con Tavily (mantener para compatibilidad)
 */
export async function searchSuppliersTavily(query, location, budget, service) {
  try {
    const response = await fetch('/api/ai-suppliers-tavily', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        location,
        budget,
        service
      })
    });

    if (!response.ok) {
      throw new Error('Error en búsqueda Tavily');
    }

    return await response.json();
    
  } catch (error) {
    console.error('Error en Tavily:', error);
    throw error;
  }
}
