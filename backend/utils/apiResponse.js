/**
 * API Response Helper
 * Estandariza el formato de respuestas de la API según convenciones documentadas
 * 
 * Formato estándar:
 * - Éxito: { success: true, data: { ... }, requestId: "uuid" }
 * - Error: { success: false, error: { code: "slug", message: "humano" }, requestId: "uuid" }
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Genera un requestId único o usa el existente del request
 * @param {Object} req - Express request object
 * @returns {string} - Request ID
 */
function getRequestId(req) {
  return req.id || req.headers['x-request-id'] || uuidv4();
}

/**
 * Respuesta exitosa estándar
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} data - Datos de respuesta
 * @param {number} statusCode - Código HTTP (default: 200)
 * @returns {Object} - Express response
 */
function sendSuccess(req, res, data, statusCode = 200) {
  const requestId = getRequestId(req);
  
  return res.status(statusCode).json({
    success: true,
    data,
    requestId
  });
}

/**
 * Respuesta de error estándar
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} code - Código de error (slug)
 * @param {string} message - Mensaje legible para humanos
 * @param {number} statusCode - Código HTTP (default: 400)
 * @param {Object} details - Detalles adicionales opcionales
 * @returns {Object} - Express response
 */
function sendError(req, res, code, message, statusCode = 400, details = null) {
  const requestId = getRequestId(req);
  
  const errorResponse = {
    success: false,
    error: {
      code,
      message
    },
    requestId
  };

  // Añadir detalles adicionales si existen
  if (details) {
    errorResponse.error.details = details;
  }

  // Log del error para debugging (no exponer en producción)
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${requestId}] Error ${code}: ${message}`, details || '');
  }

  return res.status(statusCode).json(errorResponse);
}

/**
 * Wrapper para errores de validación
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Array|Object} validationErrors - Errores de validación
 * @returns {Object} - Express response
 */
function sendValidationError(req, res, validationErrors) {
  return sendError(
    req,
    res,
    'validation_error',
    'Los datos proporcionados no son válidos',
    400,
    { validation: validationErrors }
  );
}

/**
 * Wrapper para errores de autenticación
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje opcional
 * @returns {Object} - Express response
 */
function sendAuthError(req, res, message = 'No autorizado') {
  return sendError(req, res, 'unauthorized', message, 401);
}

/**
 * Wrapper para errores de permisos
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje opcional
 * @returns {Object} - Express response
 */
function sendForbiddenError(req, res, message = 'Acceso prohibido') {
  return sendError(req, res, 'forbidden', message, 403);
}

/**
 * Wrapper para recursos no encontrados
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} resource - Tipo de recurso
 * @returns {Object} - Express response
 */
function sendNotFoundError(req, res, resource = 'Recurso') {
  return sendError(
    req,
    res,
    'not_found',
    `${resource} no encontrado`,
    404
  );
}

/**
 * Wrapper para errores internos del servidor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Error} error - Objeto de error
 * @returns {Object} - Express response
 */
function sendInternalError(req, res, error) {
  // Log completo del error para debugging
  console.error('[Internal Error]', error);

  // En producción, no exponer detalles del error
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : error.message;

  return sendError(req, res, 'internal_error', message, 500);
}

/**
 * Wrapper para errores de rate limiting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Express response
 */
function sendRateLimitError(req, res) {
  return sendError(
    req,
    res,
    'rate_limit_exceeded',
    'Demasiadas peticiones. Por favor, intenta más tarde',
    429
  );
}

/**
 * Wrapper para servicios no disponibles
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje descriptivo
 * @returns {Object} - Express response
 */
function sendServiceUnavailable(req, res, message = 'Servicio no disponible temporalmente') {
  return sendError(
    req,
    res,
    'service_unavailable',
    message,
    503
  );
}

/**
 * Middleware para capturar errores no manejados
 * Debe ser el último middleware en la cadena
 */
function errorHandler(err, req, res, next) {
  // Si ya se envió una respuesta, pasar al siguiente error handler
  if (res.headersSent) {
    return next(err);
  }

  // Manejar errores de Zod validation
  if (err.name === 'ZodError') {
    return sendValidationError(req, res, err.errors);
  }

  // Manejar errores de Firebase
  if (err.code && err.code.startsWith('auth/')) {
    return sendAuthError(req, res, err.message);
  }

  // Error genérico
  return sendInternalError(req, res, err);
}

export {
  getRequestId,
  sendSuccess,
  sendError,
  sendValidationError,
  sendAuthError,
  sendForbiddenError,
  sendNotFoundError,
  sendInternalError,
  sendRateLimitError,
  sendServiceUnavailable,
  errorHandler
};
