import { db } from '../db.js';

/**
 * Genera un slug único para un proveedor
 * @param {string} name - Nombre del proveedor
 * @param {string} city - Ciudad del proveedor
 * @returns {Promise<string>} Slug único
 */
export async function generateSupplierSlug(name, city = '') {
  // Sanitizar nombre
  let slug = name
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .replace(/^-|-$/g, ''); // Eliminar guiones al inicio/final

  // Añadir ciudad si existe
  if (city) {
    const citySlug = city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    slug = `${slug}-${citySlug}`;
  }

  // Verificar unicidad
  let finalSlug = slug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const existingQuery = await db
      .collection('suppliers')
      .where('profile.slug', '==', finalSlug)
      .limit(1)
      .get();

    if (existingQuery.empty) {
      isUnique = true;
    } else {
      // Si ya existe, añadir número
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  return finalSlug;
}

/**
 * Actualiza el slug de un proveedor existente
 * @param {string} supplierId - ID del proveedor
 * @param {string} name - Nombre del proveedor
 * @param {string} city - Ciudad del proveedor
 * @returns {Promise<string>} Nuevo slug
 */
export async function updateSupplierSlug(supplierId, name, city = '') {
  const newSlug = await generateSupplierSlug(name, city);

  await db.collection('suppliers').doc(supplierId).update({
    'profile.slug': newSlug,
    updatedAt: new Date(),
  });

  return newSlug;
}

/**
 * Valida que un slug tenga el formato correcto
 * @param {string} slug - Slug a validar
 * @returns {boolean}
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;

  // Solo letras minúsculas, números y guiones
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  // Longitud mínima 3, máxima 100
  if (slug.length < 3 || slug.length > 100) return false;

  return slugRegex.test(slug);
}
