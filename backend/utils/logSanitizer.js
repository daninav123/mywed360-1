/**
 * Sanitizador de logs para proteger PII (Personally Identifiable Information)
 * Cumple con GDPR y mejores prácticas de privacidad
 */

/**
 * Campos sensibles que deben ser sanitizados
 */
const SENSITIVE_FIELDS = [
  'email',
  'phone',
  'phoneNumber',
  'telephone',
  'mobile',
  'address',
  'street',
  'postalCode',
  'zipCode',
  'dni',
  'nif',
  'passport',
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'creditCard',
  'cardNumber',
  'cvv',
  'iban',
  'accountNumber',
  'ssn',
  'taxId',
  'birthDate',
  'dateOfBirth',
  'lastName',
  'surname',
  'familyName',
  'ip',
  'ipAddress',
  'location',
  'coordinates',
  'lat',
  'lng',
  'latitude',
  'longitude',
];

/**
 * Patrones regex para detectar PII en strings
 */
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  dni: /\d{8}[A-Z]/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  iban: /[A-Z]{2}\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}/g,
};

/**
 * Sanitiza un string reemplazando PII con placeholders
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  let sanitized = str;

  // Reemplazar emails
  sanitized = sanitized.replace(PII_PATTERNS.email, (match) => {
    const [local, domain] = match.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  });

  // Reemplazar teléfonos
  sanitized = sanitized.replace(PII_PATTERNS.phone, '***-***-****');

  // Reemplazar DNIs
  sanitized = sanitized.replace(PII_PATTERNS.dni, '********X');

  // Reemplazar tarjetas de crédito
  sanitized = sanitized.replace(PII_PATTERNS.creditCard, '**** **** **** ****');

  // Reemplazar IBANs
  sanitized = sanitized.replace(PII_PATTERNS.iban, 'ES** **** **** **** ****');

  return sanitized;
}

/**
 * Sanitiza un objeto recursivamente
 * @param {any} obj - Objeto a sanitizar
 * @param {number} depth - Profundidad actual (previene loops infinitos)
 * @returns {any} Objeto sanitizado
 */
function sanitizeObject(obj, depth = 0) {
  // Prevenir loops infinitos
  if (depth > 10) return '[MAX_DEPTH]';

  // Valores primitivos
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'boolean' || typeof obj === 'number') return obj;
  if (typeof obj === 'string') return sanitizeString(obj);

  // Arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  // Objetos
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Si es un campo sensible, reemplazar completamente
      if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
        if (lowerKey.includes('email')) {
          sanitized[key] = sanitizeEmail(value);
        } else if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('telephone')) {
          sanitized[key] = '***-***-****';
        } else if (lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('secret') || lowerKey.includes('apikey') || lowerKey.includes('api_key')) {
          sanitized[key] = '[REDACTED]';
        } else if (lowerKey.includes('address') || lowerKey.includes('street')) {
          sanitized[key] = '[ADDRESS_REDACTED]';
        } else if (lowerKey.includes('name')) {
          sanitized[key] = sanitizeName(value);
        } else {
          sanitized[key] = '[PII_REDACTED]';
        }
      } else {
        // Sanitizar recursivamente
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitiza un email (muestra solo inicio y dominio)
 * @param {string} email - Email a sanitizar
 * @returns {string} Email sanitizado
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return '[EMAIL_REDACTED]';
  
  const match = email.match(/^([^@]+)@(.+)$/);
  if (!match) return '[INVALID_EMAIL]';
  
  const [, local, domain] = match;
  const showChars = Math.min(2, Math.floor(local.length / 2));
  return `${local.substring(0, showChars)}***@${domain}`;
}

/**
 * Sanitiza un nombre (muestra solo inicial)
 * @param {string} name - Nombre a sanitizar
 * @returns {string} Nombre sanitizado
 */
function sanitizeName(name) {
  if (!name || typeof name !== 'string') return '[NAME_REDACTED]';
  
  const parts = name.trim().split(/\s+/);
  return parts.map(part => `${part.charAt(0)}***`).join(' ');
}

/**
 * Sanitiza un ID de usuario (muestra solo inicio)
 * @param {string} id - ID a sanitizar
 * @returns {string} ID sanitizado
 */
function sanitizeUserId(id) {
  if (!id || typeof id !== 'string') return '[ID_REDACTED]';
  return `${id.substring(0, 8)}***`;
}

/**
 * Wrapper principal para sanitizar cualquier dato antes de loguear
 * @param {any} data - Datos a sanitizar
 * @returns {any} Datos sanitizados
 */
export function sanitize(data) {
  return sanitizeObject(data);
}

/**
 * Crea un logger seguro que sanitiza automáticamente
 * @param {Object} logger - Logger original (winston, console, etc.)
 * @returns {Object} Logger con sanitización automática
 */
export function createSafeLogger(logger) {
  return {
    info: (...args) => logger.info(...args.map(sanitize)),
    warn: (...args) => logger.warn(...args.map(sanitize)),
    error: (...args) => logger.error(...args.map(sanitize)),
    debug: (...args) => logger.debug?.(...args.map(sanitize)) || logger.info(...args.map(sanitize)),
    log: (...args) => logger.log?.(...args.map(sanitize)) || logger.info(...args.map(sanitize)),
  };
}

/**
 * Utilidades específicas para casos comunes
 */
export const sanitizers = {
  email: sanitizeEmail,
  name: sanitizeName,
  userId: sanitizeUserId,
  string: sanitizeString,
  object: sanitizeObject,
};

export default {
  sanitize,
  sanitizers,
  createSafeLogger,
};
