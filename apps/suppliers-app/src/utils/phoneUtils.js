/**
 * Utilidades para formatear números de teléfono
 */

/**
 * Normaliza un número de teléfono español para WhatsApp
 * WhatsApp requiere formato: [código país][número] sin espacios ni símbolos
 * Ejemplo: 34612345678 (sin el +)
 * 
 * @param {string} phone - Número de teléfono en cualquier formato
 * @returns {string} Número normalizado para WhatsApp (ej: "34612345678")
 */
export function normalizePhoneForWhatsApp(phone) {
  if (!phone) return '';
  
  // Limpiar el número (quitar espacios, guiones, paréntesis)
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Si empieza con +, quitarlo
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Si empieza con 34 (código España), retornar directamente
  if (cleaned.startsWith('34')) {
    return cleaned;
  }
  
  // Si empieza con 0034, quitar los ceros iniciales
  if (cleaned.startsWith('0034')) {
    return cleaned.substring(2);
  }
  
  // Si es un número español sin prefijo (empieza con 6, 7, 8 o 9)
  if (cleaned.match(/^[6789]\d{8}$/)) {
    return '34' + cleaned;
  }
  
  // Si no coincide con ningún patrón, asumir que es español y añadir prefijo
  // (para números que empiezan con 6, 7, 8, 9)
  if (cleaned.match(/^[6789]/)) {
    return '34' + cleaned;
  }
  
  // Para cualquier otro caso, retornar el número limpio
  // (puede ser un número internacional de otro país)
  return cleaned;
}

/**
 * Formatea un número de teléfono para mostrar
 * @param {string} phone - Número de teléfono
 * @returns {string} Número formateado para display
 */
export function formatPhoneForDisplay(phone) {
  if (!phone) return '';
  
  const normalized = normalizePhoneForWhatsApp(phone);
  
  // Si es español (empieza con 34)
  if (normalized.startsWith('34')) {
    const withoutPrefix = normalized.substring(2);
    // Formato: +34 612 34 56 78
    return `+34 ${withoutPrefix.substring(0, 3)} ${withoutPrefix.substring(3, 5)} ${withoutPrefix.substring(5, 7)} ${withoutPrefix.substring(7)}`;
  }
  
  // Para otros números, retornar con +
  return '+' + normalized;
}

/**
 * Valida si un número de teléfono es válido
 * @param {string} phone - Número de teléfono
 * @returns {boolean} True si es válido
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  
  const normalized = normalizePhoneForWhatsApp(phone);
  
  // Número español: 34 + 9 dígitos
  if (normalized.match(/^34[6789]\d{8}$/)) {
    return true;
  }
  
  // Número internacional genérico: entre 8 y 15 dígitos
  if (normalized.match(/^\d{8,15}$/)) {
    return true;
  }
  
  return false;
}
