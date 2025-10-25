/**
 * Cliente API centralizado para manejar el nuevo formato de respuestas
 * Según convenciones definidas en docs/API_CONVENTIONS.md
 * 
 * Formato de respuesta esperado:
 * - Éxito: { success: true, data: {...} }
 * - Error: { success: false, error: { code: string, message: string }, requestId?: string }
 */

/**
 * Error personalizado para errores de API
 */
export class ApiError extends Error {
  constructor(message, code, requestId, statusCode) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.requestId = requestId;
    this.statusCode = statusCode;
  }
}

/**
 * Realiza una petición HTTP y maneja el formato de respuesta estándar
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones de fetch
 * @returns {Promise<any>} - Datos de la respuesta
 * @throws {ApiError} - Error con información detallada
 */
export async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Intentar parsear JSON
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      // Si no se puede parsear, crear un error genérico
      throw new ApiError(
        `Error parsing response: ${parseError.message}`,
        'parse_error',
        null,
        response.status
      );
    }

    // Verificar si la respuesta sigue el formato estándar
    if (result && typeof result.success === 'boolean') {
      // Formato estándar nuevo
      if (!result.success) {
        const errorCode = result.error?.code || 'unknown_error';
        const errorMessage = result.error?.message || 'An error occurred';
        const requestId = result.requestId || null;
        throw new ApiError(errorMessage, errorCode, requestId, response.status);
      }
      return result.data;
    }

    // Retrocompatibilidad: formato antiguo sin el campo success
    // Si el status es exitoso (2xx), devolver el resultado completo
    if (response.ok) {
      return result;
    }

    // Si hay error en formato antiguo
    const errorCode = result.error || result.code || 'unknown_error';
    const errorMessage = result.message || 'An error occurred';
    throw new ApiError(errorMessage, errorCode, null, response.status);

  } catch (error) {
    // Si ya es un ApiError, relanzarlo
    if (error instanceof ApiError) {
      throw error;
    }

    // Error de red u otro error
    throw new ApiError(
      error.message || 'Network error',
      'network_error',
      null,
      0
    );
  }
}

/**
 * Realiza una petición GET
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones adicionales
 * @returns {Promise<any>}
 */
export async function apiGet(url, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'GET',
  });
}

/**
 * Realiza una petición POST
 * @param {string} url - URL del endpoint
 * @param {object} data - Datos a enviar
 * @param {object} options - Opciones adicionales
 * @returns {Promise<any>}
 */
export async function apiPost(url, data, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Realiza una petición PUT
 * @param {string} url - URL del endpoint
 * @param {object} data - Datos a enviar
 * @param {object} options - Opciones adicionales
 * @returns {Promise<any>}
 */
export async function apiPut(url, data, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Realiza una petición DELETE
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones adicionales
 * @returns {Promise<any>}
 */
export async function apiDelete(url, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'DELETE',
  });
}

/**
 * Maneja errores de API de forma centralizada
 * @param {Error} error - Error capturado
 * @param {Function} showNotification - Función para mostrar notificaciones (opcional)
 */
export function handleApiError(error, showNotification = null) {
  if (error instanceof ApiError) {
    const message = error.message;
    const details = {
      code: error.code,
      requestId: error.requestId,
      statusCode: error.statusCode,
    };

    console.error('[API Error]', message, details);

    if (showNotification) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: message,
        details: error.requestId ? `Request ID: ${error.requestId}` : undefined,
      });
    }

    return details;
  }

  // Error genérico
  console.error('[Unexpected Error]', error);
  if (showNotification) {
    showNotification({
      type: 'error',
      title: 'Error',
      message: error.message || 'An unexpected error occurred',
    });
  }

  return null;
}

export default {
  request: apiRequest,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  handleError: handleApiError,
  ApiError,
};
