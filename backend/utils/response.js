/**
 * Utilidades para respuestas API estandarizadas
 * Según convenciones definidas en docs/API_CONVENTIONS.md
 */

/**
 * Envía una respuesta de éxito con formato estándar
 * @param {object} res - Express response object
 * @param {any} data - Payload de datos a devolver
 * @param {number} status - Código HTTP (default: 200)
 */
export function sendSuccess(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
  });
}

/**
 * Envía una respuesta de error con formato estándar
 * @param {object} res - Express response object
 * @param {string} code - Código de error slug (ej: 'not_found', 'validation_error')
 * @param {string} message - Mensaje legible para humanos
 * @param {number} status - Código HTTP (default: 400)
 * @param {object} req - Express request object (para obtener requestId)
 */
export function sendError(res, code, message, status = 400, req = null) {
  const requestId = req?.id || null;
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
    ...(requestId && { requestId }),
  });
}

/**
 * Envía una respuesta de error de validación con detalles
 * @param {object} res - Express response object
 * @param {string} message - Mensaje de error
 * @param {any} details - Detalles adicionales (opcional)
 * @param {object} req - Express request object
 */
export function sendValidationError(res, message, details = null, req = null) {
  const requestId = req?.id || null;
  const response = {
    success: false,
    error: {
      code: 'validation_error',
      message,
    },
    ...(requestId && { requestId }),
  };
  if (details) {
    response.error.details = details;
  }
  return res.status(400).json(response);
}

/**
 * Envía una respuesta de error interno del servidor
 * @param {object} res - Express response object
 * @param {Error} err - Error object
 * @param {object} req - Express request object
 */
export function sendInternalError(res, err, req = null) {
  const requestId = req?.id || null;
  // En producción, no exponer detalles del error
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (err?.message || 'Internal server error');
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'internal_error',
      message,
    },
    ...(requestId && { requestId }),
  });
}

/**
 * Envía una respuesta de error 404
 * @param {object} res - Express response object
 * @param {string} message - Mensaje personalizado (opcional)
 * @param {object} req - Express request object
 */
export function sendNotFound(res, message = 'Not found', req = null) {
  return sendError(res, 'not_found', message, 404, req);
}

/**
 * Envía una respuesta de error 401 (no autenticado)
 * @param {object} res - Express response object
 * @param {string} message - Mensaje personalizado (opcional)
 * @param {object} req - Express request object
 */
export function sendUnauthorized(res, message = 'Unauthorized', req = null) {
  return sendError(res, 'unauthorized', message, 401, req);
}

/**
 * Envía una respuesta de error 403 (prohibido)
 * @param {object} res - Express response object
 * @param {string} message - Mensaje personalizado (opcional)
 * @param {object} req - Express request object
 */
export function sendForbidden(res, message = 'Forbidden', req = null) {
  return sendError(res, 'forbidden', message, 403, req);
}

/**
 * Envía una respuesta de error 429 (rate limit)
 * @param {object} res - Express response object
 * @param {string} message - Mensaje personalizado (opcional)
 * @param {object} req - Express request object
 */
export function sendRateLimit(res, message = 'Too many requests', req = null) {
  return sendError(res, 'rate_limit', message, 429, req);
}

/**
 * Envía una respuesta de error 503 (servicio no disponible)
 * @param {object} res - Express response object
 * @param {string} message - Mensaje personalizado
 * @param {object} req - Express request object
 */
export function sendServiceUnavailable(res, message = 'Service unavailable', req = null) {
  return sendError(res, 'service_unavailable', message, 503, req);
}

/**
 * Envía una respuesta paginada con formato estándar
 * @param {object} res - Express response object
 * @param {Array} items - Array de items
 * @param {string|null} nextCursor - Cursor para siguiente página (opcional)
 * @param {number} status - Código HTTP (default: 200)
 */
export function sendPaginated(res, items, nextCursor = null, status = 200) {
  const data = { items };
  if (nextCursor) {
    data.nextCursor = nextCursor;
  }
  return res.status(status).json({
    success: true,
    data,
  });
}
