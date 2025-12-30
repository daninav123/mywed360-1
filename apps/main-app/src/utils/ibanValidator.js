/**
 * Utilidades para validación de IBAN (International Bank Account Number)
 * Soporta validación de formato y checksum según ISO 13616
 */

/**
 * Valida el formato y checksum de un IBAN
 * @param {string} iban - IBAN a validar
 * @returns {boolean} - true si es válido, false si no
 */
export function validateIBAN(iban) {
  if (!iban) return false;

  // Eliminar espacios y convertir a mayúsculas
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  // Validar longitud (mínimo 15, máximo 34 caracteres)
  if (cleanIBAN.length < 15 || cleanIBAN.length > 34) {
    return false;
  }

  // Validar formato: 2 letras (país) + 2 dígitos (checksum) + hasta 30 alfanuméricos
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
  if (!ibanRegex.test(cleanIBAN)) {
    return false;
  }

  // Validar longitud específica por país
  const countryLengths = {
    AD: 24,
    AE: 23,
    AL: 28,
    AT: 20,
    AZ: 28,
    BA: 20,
    BE: 16,
    BG: 22,
    BH: 22,
    BR: 29,
    CH: 21,
    CR: 22,
    CY: 28,
    CZ: 24,
    DE: 22,
    DK: 18,
    DO: 28,
    EE: 20,
    ES: 24,
    FI: 18,
    FO: 18,
    FR: 27,
    GB: 22,
    GE: 22,
    GI: 23,
    GL: 18,
    GR: 27,
    GT: 28,
    HR: 21,
    HU: 28,
    IE: 22,
    IL: 23,
    IS: 26,
    IT: 27,
    JO: 30,
    KW: 30,
    KZ: 20,
    LB: 28,
    LI: 21,
    LT: 20,
    LU: 20,
    LV: 21,
    MC: 27,
    MD: 24,
    ME: 22,
    MK: 19,
    MR: 27,
    MT: 31,
    MU: 30,
    NL: 18,
    NO: 15,
    PK: 24,
    PL: 28,
    PS: 29,
    PT: 25,
    QA: 29,
    RO: 24,
    RS: 22,
    SA: 24,
    SE: 24,
    SI: 19,
    SK: 24,
    SM: 27,
    TN: 24,
    TR: 26,
    UA: 29,
    VA: 22,
    VG: 24,
    XK: 20,
  };

  const countryCode = cleanIBAN.substring(0, 2);
  const expectedLength = countryLengths[countryCode];

  if (expectedLength && cleanIBAN.length !== expectedLength) {
    return false;
  }

  // Validar checksum usando mod-97
  return validateIBANChecksum(cleanIBAN);
}

/**
 * Valida el checksum del IBAN usando algoritmo mod-97
 * @param {string} iban - IBAN limpio (sin espacios, mayúsculas)
 * @returns {boolean}
 */
function validateIBANChecksum(iban) {
  // Mover los primeros 4 caracteres al final
  const rearranged = iban.substring(4) + iban.substring(0, 4);

  // Convertir letras a números (A=10, B=11, ..., Z=35)
  const numericIBAN = rearranged
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        // A-Z
        return code - 55;
      }
      return char;
    })
    .join('');

  // Calcular mod 97
  return mod97(numericIBAN) === 1;
}

/**
 * Calcula mod 97 para números muy grandes (más allá de MAX_SAFE_INTEGER)
 * @param {string} numStr - Número como string
 * @returns {number}
 */
function mod97(numStr) {
  let remainder = 0;
  for (let i = 0; i < numStr.length; i++) {
    remainder = (remainder * 10 + parseInt(numStr[i])) % 97;
  }
  return remainder;
}

/**
 * Formatea un IBAN agregando espacios cada 4 caracteres
 * @param {string} iban - IBAN sin formatear
 * @returns {string} - IBAN formateado
 */
export function formatIBAN(iban) {
  if (!iban) return '';

  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
  return cleanIBAN.match(/.{1,4}/g)?.join(' ') || cleanIBAN;
}

/**
 * Obtiene el nombre del país a partir del código IBAN
 * @param {string} iban - IBAN
 * @returns {string} - Nombre del país o código si no se encuentra
 */
export function getIBANCountry(iban) {
  if (!iban || iban.length < 2) return '';

  const countryCode = iban.substring(0, 2).toUpperCase();
  const countries = {
    AD: 'Andorra',
    AE: 'Emiratos Árabes Unidos',
    AL: 'Albania',
    AT: 'Austria',
    AZ: 'Azerbaiyán',
    BA: 'Bosnia y Herzegovina',
    BE: 'Bélgica',
    BG: 'Bulgaria',
    BH: 'Bahréin',
    BR: 'Brasil',
    CH: 'Suiza',
    CR: 'Costa Rica',
    CY: 'Chipre',
    CZ: 'República Checa',
    DE: 'Alemania',
    DK: 'Dinamarca',
    DO: 'República Dominicana',
    EE: 'Estonia',
    ES: 'España',
    FI: 'Finlandia',
    FO: 'Islas Feroe',
    FR: 'Francia',
    GB: 'Reino Unido',
    GE: 'Georgia',
    GI: 'Gibraltar',
    GL: 'Groenlandia',
    GR: 'Grecia',
    GT: 'Guatemala',
    HR: 'Croacia',
    HU: 'Hungría',
    IE: 'Irlanda',
    IL: 'Israel',
    IS: 'Islandia',
    IT: 'Italia',
    JO: 'Jordania',
    KW: 'Kuwait',
    KZ: 'Kazajistán',
    LB: 'Líbano',
    LI: 'Liechtenstein',
    LT: 'Lituania',
    LU: 'Luxemburgo',
    LV: 'Letonia',
    MC: 'Mónaco',
    MD: 'Moldavia',
    ME: 'Montenegro',
    MK: 'Macedonia del Norte',
    MR: 'Mauritania',
    MT: 'Malta',
    MU: 'Mauricio',
    NL: 'Países Bajos',
    NO: 'Noruega',
    PK: 'Pakistán',
    PL: 'Polonia',
    PS: 'Palestina',
    PT: 'Portugal',
    QA: 'Catar',
    RO: 'Rumania',
    RS: 'Serbia',
    SA: 'Arabia Saudita',
    SE: 'Suecia',
    SI: 'Eslovenia',
    SK: 'Eslovaquia',
    SM: 'San Marino',
    TN: 'Túnez',
    TR: 'Turquía',
    UA: 'Ucrania',
    VA: 'Ciudad del Vaticano',
    VG: 'Islas Vírgenes Británicas',
    XK: 'Kosovo',
  };

  return countries[countryCode] || countryCode;
}

/**
 * Obtiene mensaje de error descriptivo para IBAN inválido
 * @param {string} iban - IBAN a validar
 * @returns {string} - Mensaje de error o vacío si es válido
 */
export function getIBANErrorMessage(iban) {
  if (!iban || iban.trim() === '') {
    return '';
  }

  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  if (cleanIBAN.length < 15) {
    return 'IBAN demasiado corto (mínimo 15 caracteres)';
  }

  if (cleanIBAN.length > 34) {
    return 'IBAN demasiado largo (máximo 34 caracteres)';
  }

  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
  if (!ibanRegex.test(cleanIBAN)) {
    return 'Formato inválido. Debe comenzar con 2 letras (país) y 2 dígitos';
  }

  const countryCode = cleanIBAN.substring(0, 2);
  const countryLengths = {
    AD: 24,
    AE: 23,
    AL: 28,
    AT: 20,
    AZ: 28,
    BA: 20,
    BE: 16,
    BG: 22,
    BH: 22,
    BR: 29,
    CH: 21,
    CR: 22,
    CY: 28,
    CZ: 24,
    DE: 22,
    DK: 18,
    DO: 28,
    EE: 20,
    ES: 24,
    FI: 18,
    FO: 18,
    FR: 27,
    GB: 22,
    GE: 22,
    GI: 23,
    GL: 18,
    GR: 27,
    GT: 28,
    HR: 21,
    HU: 28,
    IE: 22,
    IL: 23,
    IS: 26,
    IT: 27,
    JO: 30,
    KW: 30,
    KZ: 20,
    LB: 28,
    LI: 21,
    LT: 20,
    LU: 20,
    LV: 21,
    MC: 27,
    MD: 24,
    ME: 22,
    MK: 19,
    MR: 27,
    MT: 31,
    MU: 30,
    NL: 18,
    NO: 15,
    PK: 24,
    PL: 28,
    PS: 29,
    PT: 25,
    QA: 29,
    RO: 24,
    RS: 22,
    SA: 24,
    SE: 24,
    SI: 19,
    SK: 24,
    SM: 27,
    TN: 24,
    TR: 26,
    UA: 29,
    VA: 22,
    VG: 24,
    XK: 20,
  };

  const expectedLength = countryLengths[countryCode];
  if (expectedLength && cleanIBAN.length !== expectedLength) {
    return `IBAN de ${getIBANCountry(iban)} debe tener ${expectedLength} caracteres`;
  }

  if (!validateIBANChecksum(cleanIBAN)) {
    return 'IBAN inválido (dígitos de control incorrectos)';
  }

  return '';
}
