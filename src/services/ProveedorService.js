import i18n from '../i18n';

/**
 * Servicio para la gestión de proveedores
 * Proporciona funciones para buscar, filtrar y manipular datos de proveedores
 */

// Datos de ejemplo para búsqueda de proveedores
// En producción, estos datos vendrían de una API o base de datos
const SAMPLE_PROVIDERS = [
  {
    id: 1,
    name: i18n.t('common.floristeria_bella_rosa'),
    category: i18n.t('common.decoracion'),
    location: 'Madrid',
    rating: 4.8,
  },
  { id: 2, name: 'Catering Delicias', category: 'Catering', location: 'Barcelona', rating: 4.5 },
  { id: 3, name: i18n.t('common.fotografia_momentos'), category: i18n.t('common.fotografia'), location: 'Valencia', rating: 4.7 },
  { id: 4, name: 'DJ Events', category: 'Música', location: 'Sevilla', rating: 4.3 },
  {
    id: 5,
    name: 'Wedding Planners S.L.',
    category: i18n.t('common.planificacion'),
    location: 'Madrid',
    rating: 4.9,
  },
  { id: 6, name: 'Vestidos Novias Elegance', category: 'Moda', location: 'Barcelona', rating: 4.6 },
  {
    id: 7,
    name: i18n.t('common.salon_celebraciones_vista'),
    category: 'Locales',
    location: 'Valencia',
    rating: 4.2,
  },
  { id: 8, name: i18n.t('common.joyeria_alianzas'), category: i18n.t('common.joyeria'), location: 'Madrid', rating: 4.4 },
];

/**
 * Busca proveedores que coincidan con el término especificado
 * La búsqueda se realiza por nombre, categoría y ubicación
 *
 * @param {string} term - Término de búsqueda
 * @returns {Promise<Array>} - Promesa con los proveedores encontrados
 */
export const searchProviders = async (term) => {
  // Simulación de latencia de red
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!term) return [];

  const normalizedTerm = term.toLowerCase().trim();

  return SAMPLE_PROVIDERS.filter(
    (provider) =>
      provider.name.toLowerCase().includes(normalizedTerm) ||
      provider.category.toLowerCase().includes(normalizedTerm) ||
      provider.location.toLowerCase().includes(normalizedTerm)
  ).map((provider) => ({
    id: provider.id,
    title: provider.name,
    subtitle: `${provider.category} | ${provider.location}`,
    rating: provider.rating,
    // Datos adicionales para mostrar en resultados de búsqueda
    metaInfo: `${provider.rating} estrellas`,
    route: `/providers/${provider.id}`,
  }));
};

/**
 * Obtiene un proveedor por su ID
 *
 * @param {number} id - ID del proveedor
 * @returns {Promise<Object|null>} - Promesa con el proveedor o null si no se encuentra
 */
export const getProviderById = async (id) => {
  // Simulación de latencia de red
  await new Promise((resolve) => setTimeout(resolve, 200));

  const provider = SAMPLE_PROVIDERS.find((p) => p.id === parseInt(id));
  return provider || null;
};

/**
 * Filtra proveedores por categoría
 *
 * @param {string} category - Categoría para filtrar
 * @returns {Promise<Array>} - Promesa con los proveedores filtrados
 */
export const getProvidersByCategory = async (category) => {
  // Simulación de latencia de red
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!category) return SAMPLE_PROVIDERS;

  const normalizedCategory = category.toLowerCase().trim();

  return SAMPLE_PROVIDERS.filter(
    (provider) => provider.category.toLowerCase() === normalizedCategory
  );
};
