/**
 * Categorías estandarizadas de proveedores de bodas
 * Usadas en toda la aplicación (frontend, backend, Google Places)
 */

export const SUPPLIER_CATEGORIES = [
  // Principales
  {
    id: 'fotografia',
    name: 'Fotografía',
    nameEn: 'Photography',
    icon: 'camera',
    description: 'Fotógrafos profesionales de bodas',
    googlePlacesType: 'photographer',
    keywords: ['fotografia', 'fotografo', 'photo', 'photography'],
    coverage: 'medium', // high, medium, low (para Google Places)
  },
  {
    id: 'video',
    name: 'Vídeo',
    nameEn: 'Videography',
    icon: 'video',
    description: 'Videógrafos y productoras de vídeo',
    googlePlacesType: 'videographer',
    keywords: ['video', 'videografia', 'videografo', 'cine', 'film'],
    coverage: 'medium',
  },
  {
    id: 'musica',
    name: 'Música',
    nameEn: 'Music',
    icon: 'music',
    description: 'Músicos, bandas, orquestas',
    googlePlacesType: null, // Sin tipo específico en Google Places
    keywords: ['musica', 'musico', 'banda', 'orquesta', 'grupo musical'],
    coverage: 'medium',
  },
  {
    id: 'dj',
    name: 'DJ',
    nameEn: 'DJ',
    icon: 'disc',
    description: 'DJs profesionales para bodas',
    googlePlacesType: null,
    keywords: ['dj', 'disc jockey', 'discoteca', 'música electrónica'],
    coverage: 'low',
  },
  {
    id: 'catering',
    name: 'Catering',
    nameEn: 'Catering',
    icon: 'utensils',
    description: 'Servicios de catering y banquetes',
    googlePlacesType: 'caterer',
    keywords: ['catering', 'banquete', 'comida', 'menu'],
    coverage: 'medium',
  },
  {
    id: 'lugares',
    name: 'Lugares',
    nameEn: 'Venues',
    icon: 'home',
    description: 'Salones, fincas, haciendas, venues',
    googlePlacesType: 'banquet hall',
    keywords: ['salon', 'finca', 'hacienda', 'venue', 'lugar', 'espacio'],
    coverage: 'high',
  },
  {
    id: 'restaurantes',
    name: 'Restaurantes',
    nameEn: 'Restaurants',
    icon: 'utensils',
    description: 'Restaurantes con salones para bodas',
    googlePlacesType: 'restaurant',
    keywords: ['restaurante', 'comedor'],
    coverage: 'high',
  },
  {
    id: 'flores-decoracion',
    name: 'Flores y Decoración',
    nameEn: 'Flowers & Decoration',
    icon: 'flower',
    description: 'Floristerías y decoración floral',
    googlePlacesType: 'florist',
    keywords: ['flores', 'florista', 'floristeria', 'decoracion', 'ramos'],
    coverage: 'high',
  },
  {
    id: 'decoracion',
    name: 'Decoración',
    nameEn: 'Decoration',
    icon: 'palette',
    description: 'Decoración de espacios y ambientación',
    googlePlacesType: 'event planner',
    keywords: ['decoracion', 'ambientacion', 'montaje'],
    coverage: 'medium',
  },
  {
    id: 'vestidos-trajes',
    name: 'Vestidos y Trajes',
    nameEn: 'Dresses & Suits',
    icon: 'shirt',
    description: 'Vestidos de novia, trajes de novio',
    googlePlacesType: 'bridal shop',
    keywords: ['vestido', 'novia', 'traje', 'novio', 'moda nupcial'],
    coverage: 'high',
  },
  {
    id: 'belleza',
    name: 'Belleza',
    nameEn: 'Beauty',
    icon: 'sparkles',
    description: 'Peluquería, maquillaje, estética',
    googlePlacesType: 'beauty salon',
    keywords: ['peluqueria', 'maquillaje', 'belleza', 'estetica', 'spa'],
    coverage: 'high',
  },
  {
    id: 'joyeria',
    name: 'Joyería',
    nameEn: 'Jewelry',
    icon: 'gem',
    description: 'Anillos, alianzas, joyería',
    googlePlacesType: 'jewelry store',
    keywords: ['joyeria', 'anillos', 'alianzas', 'joyas'],
    coverage: 'high',
  },
  {
    id: 'tartas',
    name: 'Tartas de Boda',
    nameEn: 'Wedding Cakes',
    icon: 'cake',
    description: 'Pastelerías y tartas personalizadas',
    googlePlacesType: 'bakery',
    keywords: ['tarta', 'pastel', 'pasteleria', 'reposteria', 'dulces'],
    coverage: 'high',
  },
  {
    id: 'invitaciones',
    name: 'Invitaciones',
    nameEn: 'Invitations',
    icon: 'mail',
    description: 'Invitaciones y papelería de boda',
    googlePlacesType: null,
    keywords: ['invitaciones', 'papeleria', 'tarjetas', 'imprenta'],
    coverage: 'low',
  },
  {
    id: 'detalles',
    name: 'Detalles de Boda',
    nameEn: 'Wedding Favors',
    icon: 'gift',
    description: 'Detalles y regalos para invitados',
    googlePlacesType: null,
    keywords: ['detalles', 'regalos', 'recuerdos', 'souvenirs'],
    coverage: 'low',
  },
  {
    id: 'transporte',
    name: 'Transporte',
    nameEn: 'Transportation',
    icon: 'car',
    description: 'Coches clásicos, limusinas, transporte',
    googlePlacesType: null,
    keywords: ['transporte', 'coche', 'limusina', 'autobus', 'vehiculo'],
    coverage: 'medium',
  },
  {
    id: 'animacion',
    name: 'Animación',
    nameEn: 'Entertainment',
    icon: 'party-popper',
    description: 'Animadores, magos, photocall',
    googlePlacesType: null,
    keywords: ['animacion', 'entretenimiento', 'photocall', 'photobooth'],
    coverage: 'low',
  },
  {
    id: 'fuegos-artificiales',
    name: 'Fuegos Artificiales',
    nameEn: 'Fireworks',
    icon: 'sparkles',
    description: 'Pirotecnia y fuegos artificiales',
    googlePlacesType: null,
    keywords: ['fuegos', 'artificiales', 'pirotecnia', 'bengalas'],
    coverage: 'low',
  },
  {
    id: 'organizacion',
    name: 'Organización',
    nameEn: 'Planning',
    icon: 'clipboard-list',
    description: 'Wedding planners y coordinadores',
    googlePlacesType: 'event planner',
    keywords: ['wedding planner', 'organizacion', 'coordinador', 'planner'],
    coverage: 'low',
  },
  {
    id: 'ceremonia',
    name: 'Ceremonia',
    nameEn: 'Ceremony',
    icon: 'church',
    description: 'Oficiantes, maestros de ceremonia',
    googlePlacesType: null,
    keywords: ['oficiante', 'maestro ceremonia', 'celebrante'],
    coverage: 'low',
  },
  {
    id: 'luna-de-miel',
    name: 'Luna de Miel',
    nameEn: 'Honeymoon',
    icon: 'plane',
    description: 'Agencias de viajes, hoteles',
    googlePlacesType: 'lodging',
    keywords: ['luna de miel', 'viaje', 'hotel', 'honeymoon'],
    coverage: 'medium',
  },
  {
    id: 'otros',
    name: 'Otros',
    nameEn: 'Other',
    icon: 'more-horizontal',
    description: 'Otros servicios de boda',
    googlePlacesType: null,
    keywords: ['otros', 'varios', 'other'],
    coverage: 'low',
  },
];

/**
 * Obtiene una categoría por ID
 */
export function getCategoryById(id) {
  return SUPPLIER_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Obtiene categorías con alta cobertura en Google Places
 */
export function getHighCoverageCategories() {
  return SUPPLIER_CATEGORIES.filter((cat) => cat.coverage === 'high');
}

/**
 * Obtiene categorías con media cobertura en Google Places
 */
export function getMediumCoverageCategories() {
  return SUPPLIER_CATEGORIES.filter((cat) => cat.coverage === 'medium');
}

/**
 * Obtiene categorías con baja cobertura en Google Places
 */
export function getLowCoverageCategories() {
  return SUPPLIER_CATEGORIES.filter((cat) => cat.coverage === 'low');
}

/**
 * Busca categoría por keyword
 */
export function findCategoryByKeyword(keyword) {
  const normalized = keyword.toLowerCase().trim();
  return SUPPLIER_CATEGORIES.find((cat) =>
    cat.keywords.some((kw) => normalized.includes(kw) || kw.includes(normalized))
  );
}

/**
 * Obtiene el tipo de Google Places para una categoría
 */
export function getGooglePlacesType(categoryId) {
  const category = getCategoryById(categoryId);
  return category?.googlePlacesType || null;
}

/**
 * IDs simples para usar en código
 */
export const CATEGORY_IDS = {
  PHOTOGRAPHY: 'fotografia',
  VIDEO: 'video',
  MUSIC: 'musica',
  DJ: 'dj',
  CATERING: 'catering',
  VENUES: 'lugares',
  RESTAURANTS: 'restaurantes',
  FLOWERS: 'flores-decoracion',
  DECORATION: 'decoracion',
  DRESSES: 'vestidos-trajes',
  BEAUTY: 'belleza',
  JEWELRY: 'joyeria',
  CAKES: 'tartas',
  INVITATIONS: 'invitaciones',
  FAVORS: 'detalles',
  TRANSPORTATION: 'transporte',
  ENTERTAINMENT: 'animacion',
  FIREWORKS: 'fuegos-artificiales',
  PLANNING: 'organizacion',
  CEREMONY: 'ceremonia',
  HONEYMOON: 'luna-de-miel',
  OTHER: 'otros',
};

export default SUPPLIER_CATEGORIES;
