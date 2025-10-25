import i18n from '../i18n';

/**
 * Utilidades de formateo reutilizables para datos
 * Centraliza las funciones de formateo más comunes del proyecto
 */

/**
 * Formatea un número como moneda en euros
 * @param {number} amount - Cantidad a formatear
 * @param {boolean} showDecimals - Si mostrar decimales
 * @returns {string} Cantidad formateada
 */
export const formatCurrency = (amount, showDecimals = true) => {
  const numeric = Number(amount);
  const value = Number.isFinite(numeric) ? numeric : 0;

  const options = {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  };

  return new Intl.NumberFormat('es-ESi18n.t('common.optionsformatvalue_formatea_numero_con_separadores_miles')es-ESi18n.t('common.formatvalue_formatea_una_fecha_formato_espanol')short', 'medium', 'long', 'full', 'custom')
 * @param {boolean} includeTime - Si incluir la hora
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, format = 'medium', includeTime = false) => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  if (format === 'custom') {
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();

    if (includeTime) {
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    return `${day}/${month}/${year}`;
  }

  const options = {
    dateStyle: format,
    ...(includeTime && { timeStyle: 'short' }),
  };

  return new Intl.DateTimeFormat('es-ESi18n.t('common.optionsformatdateobj_formatea_telefono_formato_espanol_param')';

  const cleanPhone = phone.replace(/[\s()-]/g, '');

  let nationalPhone = cleanPhone;
  if (nationalPhone.startsWith('+34')) nationalPhone = nationalPhone.substring(3);
  else if (nationalPhone.startsWith('0034')) nationalPhone = nationalPhone.substring(4);
  else if (nationalPhone.startsWith('34')) nationalPhone = nationalPhone.substring(2);

  if (nationalPhone.length === 9) {
    return `${nationalPhone.substring(0, 3)} ${nationalPhone.substring(3, 6)} ${nationalPhone.substring(6)}`;
  }
  return phone;
};

/**
 * Formatea un email ocultando parte del dominio
 * @param {string} email - Email a formatear
 * @param {boolean} hidePartial - Si ocultar parte del email
 * @returns {string} Email formateado
 */
export const formatEmail = (email, hidePartial = false) => {
  if (!email) return '';
  if (!hidePartial) return email;
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  let maskedLocal = localPart;
  if (localPart.length > 3) {
    maskedLocal =
      localPart.substring(0, 2) + '*i18n.t('common.repeatlocalpartlength_localpartslice1_return_maskedlocaldomain_formatea_nombre')string') return '';
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' i18n.t('common.formatea_una_direccion_postal_export_const')';
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.number) parts.push(address.number);
  if (address.city) parts.push(address.city);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.province) parts.push(address.province);
  return parts.join(', ');
};

/**
 * Formatea un porcentaje
 */
export const formatPercentage = (value, isDecimal = true, decimals = 1) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0%i18n.t('common.const_percentage_isdecimal_numeric_100_numeric')0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(dm)) + ' i18n.t('common.sizesi_formatea_una_duracion_segundos_export')0s';
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (includeSeconds && (secs > 0 || parts.length === 0)) parts.push(`${secs}s`);
  return parts.join(' ');
};

/**
 * Formatea texto para URL (slug)
 */
export const formatSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, 'i18n.t('common.solo_letras_numeros_espacios_guiones_replacesg')-') // Espacios a guiones
    .replace(/-+/g, '-i18n.t('common.multiples_guiones_uno_replaceg')i18n.t('common.trim_guiones_trunca_texto_una_longitud')...') => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitaliza la primera letra de cada palabra
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/**
 * Formatea un estado o status con color
 */
export const formatStatus = (status) => {
  const statusMap = {
    pending: { label: 'Pendiente', color: 'yellow' },
    confirmed: { label: 'Confirmado', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
    completed: { label: 'Completado', color: 'blue' },
    in_progress: { label: 'En progreso', color: 'orange' },
    draft: { label: 'Borrador', color: 'gray' },
    published: { label: 'Publicado', color: 'green' },
    active: { label: 'Activo', color: 'green' },
    inactive: { label: 'Inactivo', color: 'gray' },
  };
  return statusMap[status] || { label: status, color: 'gray' };
};
