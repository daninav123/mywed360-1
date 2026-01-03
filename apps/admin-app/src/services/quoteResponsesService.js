/**
 * 📊 Servicio para gestionar presupuestos recibidos por email (con análisis IA)
 */

import { auth } from '../lib/firebase';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004';

/**
 * Obtener token de autenticación
 */
async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');
  return await user.getIdToken();
}

/**
 * Listar presupuestos recibidos
 * @param {Object} filters - Filtros opcionales
 * @param {string} [filters.weddingId] - ID de la boda
 * @param {string} [filters.supplierId] - ID del proveedor
 * @param {string} [filters.status] - Estado del presupuesto
 * @returns {Promise<Array>}
 */
export async function getQuoteResponses(filters = {}) {
  try {
    const token = await getAuthToken();
    
    const params = new URLSearchParams();
    if (filters.weddingId) params.append('weddingId', filters.weddingId);
    if (filters.supplierId) params.append('supplierId', filters.supplierId);
    if (filters.status) params.append('status', filters.status);
    if (filters.userId) params.append('userId', filters.userId);
    
    const url = `${API_URL}/api/quote-responses?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.responses || [];
  } catch (error) {
    console.error('[quoteResponsesService] Error obteniendo presupuestos:', error);
    throw error;
  }
}

/**
 * Obtener detalles de un presupuesto específico
 * @param {string} id - ID del presupuesto
 * @returns {Promise<Object>}
 */
export async function getQuoteResponseById(id) {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_URL}/api/quote-responses/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('[quoteResponsesService] Error obteniendo presupuesto:', error);
    throw error;
  }
}

/**
 * Actualizar estado de un presupuesto
 * @param {string} id - ID del presupuesto
 * @param {string} status - Nuevo estado (received, reviewed, accepted, rejected, negotiating)
 * @param {string} [notes] - Notas opcionales
 * @returns {Promise<Object>}
 */
export async function updateQuoteResponseStatus(id, status, notes = '') {
  try {
    console.log('[updateQuoteResponseStatus] 🔄 Actualizando:', { id, status, notes });
    
    const token = await getAuthToken();
    console.log('[updateQuoteResponseStatus] ✅ Token obtenido');
    
    const url = `${API_URL}/api/quote-responses/${id}/status`;
    console.log('[updateQuoteResponseStatus] 📡 URL:', url);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, notes }),
    });

    console.log('[updateQuoteResponseStatus] Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[updateQuoteResponseStatus] ❌ Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('[updateQuoteResponseStatus] ✅ Success:', result);
    return result;
  } catch (error) {
    console.error('[updateQuoteResponseStatus] 💥 Error crítico:', error);
    throw error;
  }
}

/**
 * Obtener presupuestos para una solicitud específica
 * @param {string} requestId - ID de la solicitud original
 * @returns {Promise<Array>}
 */
export async function getQuoteResponsesByRequest(requestId) {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_URL}/api/quote-responses/request/${requestId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.responses || [];
  } catch (error) {
    console.error('[quoteResponsesService] Error obteniendo presupuestos por solicitud:', error);
    throw error;
  }
}

/**
 * Formatear precio para mostrar
 * @param {number} price - Precio
 * @param {string} currency - Moneda (default: EUR)
 * @returns {string}
 */
export function formatPrice(price, currency = 'EUR') {
  if (!price && price !== 0) return 'N/A';
  
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(price);
}

/**
 * Obtener badge de estado
 * @param {string} status - Estado del presupuesto
 * @returns {Object} - { text, color }
 */
export function getStatusBadge(status) {
  const badges = {
    received: { text: 'Recibido', color: 'blue' },
    reviewed: { text: 'Revisado', color: 'purple' },
    accepted: { text: 'Aceptado', color: 'green' },
    rejected: { text: 'Rechazado', color: 'red' },
    negotiating: { text: 'Negociando', color: 'orange' },
  };
  
  return badges[status] || { text: status, color: 'gray' };
}

/**
 * Obtener badge de confianza IA
 * @param {number} confidence - Confianza (0-100)
 * @returns {Object} - { text, color }
 */
export function getConfidenceBadge(confidence) {
  if (!confidence && confidence !== 0) {
    return { text: 'Manual', color: 'gray' };
  }
  
  if (confidence >= 90) {
    return { text: `${confidence}% Alta`, color: 'green' };
  } else if (confidence >= 70) {
    return { text: `${confidence}% Media`, color: 'yellow' };
  } else {
    return { text: `${confidence}% Baja`, color: 'red' };
  }
}
