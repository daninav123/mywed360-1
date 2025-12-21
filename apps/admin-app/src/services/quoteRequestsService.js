/**
 * Quote Requests Service
 *
 * Gestiona las solicitudes de presupuesto entre owners y proveedores
 */

import axios from 'axios';
import { auth } from '../firebaseConfig';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

/**
 * Helper para obtener el token de autenticación
 */
async function getAuthToken() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return await user.getIdToken();
  } catch (error) {
    // console.error('[quoteRequests] Error obteniendo token:', error);
    throw error;
  }
}

export async function cancelProviderQuoteRequests({ supplierId = null, supplierEmail = null } = {}) {
  try {
    const token = await getAuthToken();

    const response = await axios.post(
      `${API_URL}/api/quote-requests/cancel-provider`,
      { supplierId, supplierEmail },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error('Error al cancelar solicitudes del proveedor');
  }
}

/**
 * Crear una solicitud de presupuesto
 *
 * @param {Object} requestData - Datos de la solicitud
 * @param {string} requestData.weddingId - ID de la boda
 * @param {string} requestData.supplierId - ID del proveedor
 * @param {string} requestData.category - Categoría del servicio
 * @param {string} requestData.message - Mensaje personalizado
 * @param {string[]} requestData.requestedServices - Servicios solicitados
 * @param {string} requestData.eventDate - Fecha del evento
 * @param {number} requestData.guestCount - Número de invitados
 * @param {Object} requestData.budget - Presupuesto estimado
 * @param {Object} requestData.contact - Información de contacto
 * @returns {Promise<Object>} - Respuesta con el ID de la solicitud
 */
export async function createQuoteRequest(requestData) {
  try {
    const token = await getAuthToken();

    const response = await axios.post(`${API_URL}/api/quote-requests`, requestData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // console.log('✅ [quoteRequests] Solicitud creada:', response.data.requestId);

    return {
      success: true,
      requestId: response.data.requestId,
      message: response.data.message,
    };
  } catch (error) {
    // console.error('❌ [quoteRequests] Error creando solicitud:', error);

    if (error.response?.status === 401) {
      throw new Error('No estás autenticado. Por favor, inicia sesión.');
    } else if (error.response?.status === 404) {
      throw new Error('Boda o proveedor no encontrado');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.error || 'Datos inválidos');
    }

    throw new Error('Error al enviar solicitud de presupuesto');
  }
}

/**
 * Obtener solicitudes de presupuesto de una boda
 *
 * @param {string} weddingId - ID de la boda
 * @param {string} [status] - Estado de las solicitudes (opcional)
 * @returns {Promise<Array>} - Lista de solicitudes
 */
export async function getQuoteRequests(weddingId, status = null) {
  try {
    const token = await getAuthToken();

    const params = { weddingId };
    if (status) {
      params.status = status;
    }

    const response = await axios.get(`${API_URL}/api/quote-requests`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });

    // console.log(`📋 [quoteRequests] ${response.data.count} solicitudes encontradas`);

    return response.data.requests || [];
  } catch (error) {
    // console.error('❌ [quoteRequests] Error obteniendo solicitudes:', error);
    throw new Error('Error al obtener solicitudes de presupuesto');
  }
}

/**
 * Obtener detalles de una solicitud específica
 *
 * @param {string} requestId - ID de la solicitud
 * @returns {Promise<Object>} - Detalles de la solicitud
 */
export async function getQuoteRequest(requestId) {
  try {
    const token = await getAuthToken();

    const response = await axios.get(`${API_URL}/api/quote-requests/${requestId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.request;
  } catch (error) {
    // console.error('❌ [quoteRequests] Error obteniendo solicitud:', error);
    throw new Error('Error al obtener detalles de la solicitud');
  }
}

/**
 * Actualizar el estado de una solicitud
 *
 * @param {string} requestId - ID de la solicitud
 * @param {string} status - Nuevo estado (pending, quoted, accepted, rejected, cancelled)
 * @param {string} [notes] - Notas adicionales (opcional)
 * @returns {Promise<Object>} - Respuesta de la actualización
 */
export async function updateQuoteRequestStatus(requestId, status, notes = null) {
  try {
    const token = await getAuthToken();

    const response = await axios.patch(
      `${API_URL}/api/quote-requests/${requestId}/status`,
      { status, notes },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // console.log(`✅ [quoteRequests] Solicitud ${requestId} actualizada a: ${status}`);

    return response.data;
  } catch (error) {
    // console.error('❌ [quoteRequests] Error actualizando estado:', error);
    throw new Error('Error al actualizar el estado de la solicitud');
  }
}

/**
 * Cancelar una solicitud de presupuesto
 *
 * @param {string} requestId - ID de la solicitud
 * @returns {Promise<Object>} - Respuesta de la cancelación
 */
export async function cancelQuoteRequest(requestId) {
  try {
    const token = await getAuthToken();

    const response = await axios.delete(`${API_URL}/api/quote-requests/${requestId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // console.log(`❌ [quoteRequests] Solicitud ${requestId} cancelada`);

    return response.data;
  } catch (error) {
    // console.error('❌ [quoteRequests] Error cancelando solicitud:', error);
    throw new Error('Error al cancelar la solicitud');
  }
}

/**
 * Helper para crear una solicitud desde la tarjeta de proveedor
 *
 * @param {Object} params
 * @param {string} params.supplierId - ID del proveedor
 * @param {string} params.supplierName - Nombre del proveedor
 * @param {string} params.category - Categoría del servicio
 * @param {string} params.weddingId - ID de la boda
 * @param {Date} params.eventDate - Fecha del evento
 * @param {number} params.guestCount - Número de invitados
 * @param {string} [params.message] - Mensaje personalizado
 * @returns {Promise<Object>}
 */
export async function requestQuoteFromSupplier({
  supplierId,
  supplierName,
  category,
  weddingId,
  eventDate,
  guestCount,
  message = '',
}) {
  const defaultMessage =
    message ||
    `Hola ${supplierName}, estamos interesados en sus servicios de ${category} para nuestra boda. ¿Podrían enviarnos un presupuesto?`;

  return await createQuoteRequest({
    weddingId,
    supplierId,
    category,
    message: defaultMessage,
    requestedServices: [category],
    eventDate: eventDate?.toISOString() || null,
    guestCount,
    budget: null, // El usuario puede especificarlo en el mensaje
    contact: {
      // Estos datos se obtienen automáticamente del backend desde el usuario autenticado
    },
  });
}
