/**
 * Generador de alias de email para usuarios
 * Dominio: planivia.net
 * 
 * Genera alias único:
 * - planiviaEmail: slug@planivia.net (para todos los usuarios)
 */

import crypto from 'crypto';

const EMAIL_DOMAIN = 'planivia.net';

/**
 * Genera un slug único basado en nombre o email
 * @param {string} input - Nombre completo o email del usuario
 * @returns {string} Slug limpio
 */
export function generateEmailSlug(input) {
  if (!input) {
    // Fallback: generar slug aleatorio
    return `user-${crypto.randomBytes(4).toString('hex')}`;
  }

  let base = input;
  
  // Si es un email, tomar solo la parte antes del @
  if (input.includes('@')) {
    base = input.split('@')[0];
  }

  // Limpiar: lowercase, eliminar espacios, acentos, caracteres especiales
  const slug = base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar no-alfanuméricos con guión
    .replace(/^-+|-+$/g, '') // Eliminar guiones del inicio/fin
    .substring(0, 30); // Limitar longitud

  return slug || `user-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Genera un alias de email único
 * @param {string} baseSlug - Slug base generado
 * @param {Function} checkExists - Función async que verifica si el email ya existe
 * @returns {Promise<string>} Email único generado
 */
export async function generateUniqueEmailAlias(baseSlug, checkExists) {
  let candidate = `${baseSlug}@${EMAIL_DOMAIN}`;
  let counter = 1;

  // Verificar disponibilidad
  while (await checkExists(candidate)) {
    candidate = `${baseSlug}${counter}@${EMAIL_DOMAIN}`;
    counter++;
    
    // Prevenir loops infinitos
    if (counter > 1000) {
      // Fallback con timestamp
      const timestamp = Date.now().toString(36);
      candidate = `${baseSlug}-${timestamp}@${EMAIL_DOMAIN}`;
      break;
    }
  }

  return candidate;
}

/**
 * Genera alias de email para un usuario nuevo
 * @param {string} input - Nombre completo o email
 * @param {Object} prisma - Cliente de Prisma
 * @returns {Promise<{planiviaEmail: string}>}
 */
export async function generateUserEmailAliases(input, prisma) {
  const baseSlug = generateEmailSlug(input);
  
  // Función para verificar si existe
  const checkExists = async (email) => {
    const existing = await prisma.userProfile.findUnique({
      where: { planiviaEmail: email }
    });
    return !!existing;
  };

  const uniqueEmail = await generateUniqueEmailAlias(baseSlug, checkExists);

  return {
    planiviaEmail: uniqueEmail,
  };
}

/**
 * Obtiene el dominio de email configurado
 * @returns {string} Dominio actual
 */
export function getEmailDomain() {
  return EMAIL_DOMAIN;
}
