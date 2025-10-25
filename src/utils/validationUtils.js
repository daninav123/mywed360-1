import i18n from '../i18n';

/**
 * Utilidades de validación reutilizables para formularios
 * Centraliza las validaciones más comunes del proyecto
 */

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida formato de teléfono español
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} True si es válido
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  // Acepta formatos: +34 XXX XXX XXX, 6XXXXXXXX, 9XXXXXXXX
  const phoneRegex = /^(\+34|0034|34)?[6789]\d{8}$/;
  const cleanPhone = phone.replace(/[\s-]/g, 'i18n.t('common.return_phoneregextestcleanphone_valida_formato_url_param')http://') || url.startsWith('https://i18n.t('common.catch_return_false_valida_que_string')string' && value.trim().length > 0;
};

const PASSWORD_SCORE_LABELS = [i18n.t('common.muy_debil'), 'Débil', 'Aceptable', 'Buena', 'Excelente'];
const PASSWORD_SCORE_COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#15803di18n.t('common.const_passwordprogresssteps_100_evalua_fuerza_una')') => {
  const value = password.trim();
  if (!value) {
    return {
      score: 0,
      label: PASSWORD_SCORE_LABELS[0],
      color: PASSWORD_SCORE_COLORS[0],
      progress: PASSWORD_PROGRESS_STEPS[0],
      suggestions: [i18n.t('common.introduce_una_contrasena_con_menos_caracteres')],
    };
  }

  let score = 0;
  const suggestions = [];

  if (value.length >= 8) {
    score += 1;
  } else {
    suggestions.push('Usa al menos 8 caracteres.');
  }

  if (value.length >= 12) {
    score += 1;
  } else {
    suggestions.push(i18n.t('common.aumenta_longitud_caracteres_mas'));
  }

  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) {
    score += 1;
  } else {
    suggestions.push(i18n.t('common.combina_mayusculas_minusculas'));
  }

  if (/\d/.test(value)) {
    score += 1;
  } else {
    suggestions.push(i18n.t('common.anade_numeros_para_reforzarla'));
  }

  if (/[^A-Za-z0-9]/.test(value)) {
    score += 1;
  } else {
    suggestions.push(i18n.t('common.incluye_simbolos_como_similares'));
  }

  if (/(\w)\1{2,}/.test(value)) {
    suggestions.push(i18n.t('common.evita_repetir_mismo_caracter_varias_veces'));
  }

  if (/password|1234|abcd|qwer|admin/i.test(value)) {
    suggestions.push('Evita palabras comunes o secuencias previsibles.i18n.t('common.score_mathminscore_return_score_label_passwordscorelabelsscore')i18n.t('common.touppercase_validar_formato_dni_digitos_letra')TRWAGMYFPDXBNJZSQVHLCKEi18n.t('common.const_number_parseintcleandnisubstr0_const_letter_cleandnicharat8')TRWAGMYFPDXBNJZSQVHLCKEi18n.t('common.let_number_cleandnisubstr1_const_firstchar_cleandnicharat0')X') number = '0' + number;
    else if (firstChar === 'Y') number = '1' + number;
    else if (firstChar === 'Z') number = '2' + number;

    const letter = cleanDNI.charAt(8);
    return letters.charAt(parseInt(number, 10) % 23) === letter;
  }

  return false;
};

/**
 * Sanitiza un string eliminando caracteres peligrosos
 * @param {string} input - String a sanitizar
 * @returns {string} String sanitizado
 */
export const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, 'i18n.t('common.eliminar_eventos_onclick_onload_etc_trim')string') return '';

  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^\w\s]/g, 'i18n.t('common.eliminar_caracteres_especiales_trim_reglas_validacion')Este campo es obligatorio',
  },

  email: {
    required: true,
    email: true,
    requiredMessage: 'El email es obligatorio',
    emailMessage: i18n.t('common.formato_del_email_valido'),
  },

  phone: {
    custom: (value) => {
      if (!value) return null;
      return isValidPhone(value) ? null : i18n.t('common.formato_del_telefono_valido');
    },
  },

  url: {
    custom: (value) => {
      if (!value) return null;
      return isValidUrl(value) ? null : 'La URL debe empezar con http:// o https://';
    },
  },

  password: {
    required: true,
    minLength: 6,
    requiredMessage: i18n.t('common.contrasena_obligatoria'),
    minLengthMessage: i18n.t('common.contrasena_debe_tener_menos_caracteres'),
  },

  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    requiredMessage: 'El nombre es obligatorio',
    minLengthMessage: 'El nombre debe tener al menos 2 caracteres',
    maxLengthMessage: i18n.t('common.nombre_puede_tener_mas_caracteres'),
  },

  postalCode: {
    custom: (value) => {
      if (!value) return null;
      return isValidSpanishPostalCode(value) ? null : i18n.t('common.codigo_postal_valido');
    },
  },

  dni: {
    custom: (value) => {
      if (!value) return null;
      return isValidSpanishDNI(value) ? null : i18n.t('common.dninie_valido');
    },
  },
};
