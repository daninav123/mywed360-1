/**
 * Middleware para filtrar y proteger datos sensibles (PII)
 * Previene exposición accidental de información personal identificable
 */

import logger from '../logger.js';

/**
 * Lista de campos considerados PII que deben filtrarse en logs y respuestas públicas
 */
const PII_FIELDS = [
  'email',
  'phone',
  'phoneNumber',
  'telefono',
  'address',
  'direccion',
  'dni',
  'nif',
  'passport',
  'passportNumber',
  'creditCard',
  'iban',
  'ssn',
  'socialSecurityNumber',
  'birthDate',
  'dateOfBirth',
  'emergencyContact',
  'medicalInfo',
  'allergies', // Solo si contiene info médica detallada
];

/**
 * Máscaras PII en objetos para logging seguro
 * @param {Object} obj - Objeto a enmascarar
 * @param {Array} fieldsToMask - Campos adicionales a enmascarar
 * @returns {Object} - Objeto con PII enmascarada
 */
export function maskPII(obj, fieldsToMask = []) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const masked = { ...obj };
  const allFields = [...PII_FIELDS, ...fieldsToMask];
  
  for (const key of Object.keys(masked)) {
    if (allFields.includes(key)) {
      const value = masked[key];
      if (typeof value === 'string' && value.length > 0) {
        // Mostrar solo primeros 2 caracteres
        masked[key] = value.substring(0, 2) + '***';
      }
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      // Recursivo para objetos anidados
      masked[key] = maskPII(masked[key], fieldsToMask);
    }
  }
  
  return masked;
}

/**
 * Filtra campos PII de un objeto
 * @param {Object} obj - Objeto a filtrar
 * @param {Array} fieldsToKeep - Campos permitidos (whitelist)
 * @returns {Object} - Objeto sin PII
 */
export function filterPII(obj, fieldsToKeep = []) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const filtered = {};
  
  for (const key of Object.keys(obj)) {
    // Si está en whitelist, mantenerlo
    if (fieldsToKeep.includes(key)) {
      filtered[key] = obj[key];
      continue;
    }
    
    // Si es PII, omitirlo
    if (PII_FIELDS.includes(key)) {
      continue;
    }
    
    // Si es objeto anidado, filtrar recursivamente
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      filtered[key] = filterPII(obj[key], fieldsToKeep);
    } else {
      filtered[key] = obj[key];
    }
  }
  
  return filtered;
}

/**
 * Middleware para filtrar PII en respuestas a endpoints públicos
 * Uso: router.get('/public-endpoint', filterPublicPII, handler)
 * 
 * @param {Object} options - Configuración
 * @param {Array} options.allowedFields - Campos permitidos en respuesta
 */
export function filterPublicPII(options = {}) {
  const { allowedFields = ['name', 'status', 'companions', 'allergens'] } = options;
  
  return (req, res, next) => {
    // Guardar el método json original
    const originalJson = res.json.bind(res);
    
    // Override res.json para filtrar PII
    res.json = function(data) {
      if (data && data.data && typeof data.data === 'object') {
        // Filtrar PII del data object
        data.data = filterPII(data.data, allowedFields);
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Middleware para logging seguro que enmascara PII
 * Uso: app.use(piiSafeLogging)
 */
export function piiSafeLogging(req, res, next) {
  // Guardar referencia original de logger
  const originalInfo = logger.info.bind(logger);
  const originalError = logger.error.bind(logger);
  const originalWarn = logger.warn.bind(logger);
  
  // Override logger methods para esta request
  req.logger = {
    info: (message, data) => {
      originalInfo(message, data ? maskPII(data) : undefined);
    },
    error: (message, error) => {
      const maskedError = error && typeof error === 'object' 
        ? maskPII(error) 
        : error;
      originalError(message, maskedError);
    },
    warn: (message, data) => {
      originalWarn(message, data ? maskPII(data) : undefined);
    }
  };
  
  next();
}

/**
 * Valida que un email no sea expuesto en respuestas públicas
 * @param {string} email - Email a validar
 * @returns {string} - Email parcialmente enmascarado
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';
  
  // Mostrar solo primeras 2 letras del local y dominio completo
  return `${local.substring(0, 2)}***@${domain}`;
}

/**
 * Valida que un teléfono no sea expuesto en respuestas públicas
 * @param {string} phone - Teléfono a validar
 * @returns {string} - Teléfono parcialmente enmascarado
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  
  // Limpiar caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 6) return '***';
  
  // Mostrar solo últimos 3 dígitos
  return '***' + cleaned.substring(cleaned.length - 3);
}

/**
 * Middleware para endpoints que requieren auditoría de acceso a PII
 * Registra quién accede a datos sensibles
 */
export function auditPIIAccess(req, res, next) {
  const user = req.user || req.userId;
  const endpoint = req.path;
  const method = req.method;
  
  // Log de acceso a datos sensibles
  logger.info('🔒 PII Access Audit', {
    user: user || 'anonymous',
    endpoint,
    method,
    timestamp: new Date().toISOString(),
    ip: req.ip || req.headers['x-forwarded-for'],
  });
  
  next();
}

export default {
  maskPII,
  filterPII,
  filterPublicPII,
  piiSafeLogging,
  maskEmail,
  maskPhone,
  auditPIIAccess,
};
