/**
 * 🤖 Category Detector - Detección Inteligente de Categorías
 *
 * Detecta automáticamente la categoría de un proveedor basándose en:
 * - Google Places types
 * - Nombre del negocio
 * - Descripción
 * - Keywords del lugar
 */

import { SUPPLIER_CATEGORIES } from '../../shared/supplierCategories.js';

/**
 * Mapeo de Google Places types a nuestras categorías
 */
const GOOGLE_TYPES_MAPPING = {
  // Lugares y Espacios
  banquet_hall: 'lugares',
  event_venue: 'lugares',
  wedding_venue: 'lugares',

  // Restaurantes y Catering
  restaurant: 'restaurantes',
  meal_takeaway: 'catering',
  meal_delivery: 'catering',
  caterer: 'catering',
  food: 'catering',

  // Fotografía y Video
  photographer: 'fotografia',
  videographer: 'video',

  // Flores y Decoración
  florist: 'flores-decoracion',
  home_goods_store: 'decoracion',

  // Belleza
  beauty_salon: 'peluqueria-maquillaje',
  hair_care: 'peluqueria-maquillaje',
  spa: 'peluqueria-maquillaje',

  // Música y Entretenimiento
  night_club: 'dj',
  bar: 'musica',

  // Transporte
  car_rental: 'transporte',
  limousine_service: 'transporte',

  // Joyas
  jewelry_store: 'anillos-joyeria',

  // Ropa
  clothing_store: 'vestidos-trajes',
  store: 'vestidos-trajes',
};

/**
 * Keywords en español para detectar categorías por nombre
 */
const KEYWORD_PATTERNS = {
  lugares: [
    /\b(masía|masia|cortijo|finca|hacienda|palacio|castillo|pazo|parador)\b/i,
    /\b(salon|salón|espacio|venue|lugar)\b/i,
    /\b(bodas?\s+(rural|campestre))\b/i,
  ],
  catering: [/\b(catering|banquete|gastronom[ií]a)\b/i, /\b(comida|men[uú]|culin[aá]ri[oa])\b/i],
  restaurantes: [/\b(restaurante|comedor|mesón|venta)\b/i, /\b(bar.*restaurante)\b/i],
  fotografia: [
    /\b(fotograf[ií]a|fotógrafo|fotografo|photo|studio)\b/i,
    /\b(imagen|visual|retrato)\b/i,
  ],
  video: [
    /\b(v[ií]deo|videograf[ií]a|cine|film|audiovisual)\b/i,
    /\b(producc?ión\s+audiovisual)\b/i,
  ],
  musica: [
    /\b(m[uú]sica|músico|musico|orquesta|banda|grupo\s+musical)\b/i,
    /\b(piano|cuarteto|tr[ií]o|dúo)\b/i,
    /\b(audio|sonido|sound|equipo\s+de\s+sonido)\b/i,
    /\b(alquiler.*audio|alquiler.*sonido)\b/i,
  ],
  dj: [/\b(dj|disc\s+jockey|pinchad[io]scos)\b/i, /\b(discoteca|iluminaci[oó]n|luces)\b/i],
  'flores-decoracion': [
    /\b(flores?|florister[ií]a|floristeria|ramo|floral)\b/i,
    /\b(decoraci[oó]n\s+floral)\b/i,
  ],
  decoracion: [/\b(decoraci[oó]n|decorar|ambientaci[oó]n|montaje)\b/i, /\b(dise[ñn]o\s+evento)\b/i],
  'peluqueria-maquillaje': [
    /\b(peluquer[ií]a|peluqueria|est[ée]tica|belleza)\b/i,
    /\b(maquillaje|make\s*up|estilismo)\b/i,
  ],
  'vestidos-trajes': [/\b(vestido|novia|novio|traje)\b/i, /\b(modas?\s+nupcial|boutique)\b/i],
  'anillos-joyeria': [/\b(anillo|joyer[ií]a|joyeria|alia?nzas?)\b/i, /\b(oro|plata|diamante)\b/i],
  transporte: [
    /\b(coche|carro|limousine|limusina|transporte)\b/i,
    /\b(veh[íi]culo|vintage|cl[áa]sico)\b/i,
  ],
  animacion: [/\b(animaci[oó]n|animador|espect[aá]culo|show)\b/i, /\b(payaso|mago|globos)\b/i],
  'wedding-planner': [
    /\b(wedding\s+planner|organizad[oa]r|planificad[oa]r)\b/i,
    /\b(eventos?|coordinad[oa]r)\b/i,
  ],
};

/**
 * Detecta la categoría de un proveedor
 *
 * @param {Object} place - Datos del lugar de Google Places
 * @param {string} place.name - Nombre del negocio
 * @param {string[]} place.types - Types de Google Places
 * @param {string} place.vicinity - Descripción breve
 * @param {string} searchQuery - Query original de búsqueda
 * @returns {string} ID de categoría detectada
 */
export function detectCategory(place, searchQuery = '') {
  const scores = {};

  // Inicializar scores
  SUPPLIER_CATEGORIES.forEach((cat) => {
    scores[cat.id] = 0;
  });

  // 1. Analizar Google Places types (peso: 3)
  if (place.types && Array.isArray(place.types)) {
    place.types.forEach((type) => {
      const category = GOOGLE_TYPES_MAPPING[type];
      if (category && scores[category] !== undefined) {
        scores[category] += 3;
      }
    });
  }

  // 2. Analizar nombre del negocio (peso: 5)
  const nameToCheck = place.name || '';
  Object.entries(KEYWORD_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach((pattern) => {
      if (pattern.test(nameToCheck)) {
        scores[category] = (scores[category] || 0) + 5;
      }
    });
  });

  // 3. Analizar descripción/vicinity (peso: 2)
  const descToCheck = place.vicinity || place.formatted_address || '';
  Object.entries(KEYWORD_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach((pattern) => {
      if (pattern.test(descToCheck)) {
        scores[category] = (scores[category] || 0) + 2;
      }
    });
  });

  // 4. Analizar query de búsqueda (peso: 1)
  if (searchQuery) {
    Object.entries(KEYWORD_PATTERNS).forEach(([category, patterns]) => {
      patterns.forEach((pattern) => {
        if (pattern.test(searchQuery)) {
          scores[category] = (scores[category] || 0) + 1;
        }
      });
    });
  }

  // Encontrar categoría con mayor score
  let bestCategory = 'otros';
  let bestScore = 0;

  Object.entries(scores).forEach(([category, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  });

  // Log del resultado
  console.log(`🤖 [Category Detector] "${place.name}":`);
  console.log(`   Google types: ${place.types?.join(', ') || 'none'}`);
  console.log(`   Detected: ${bestCategory} (score: ${bestScore})`);
  if (bestScore > 0) {
    console.log(
      `   Top 3 scores:`,
      Object.entries(scores)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, score]) => `${cat}:${score}`)
        .join(', ')
    );
  }

  return bestCategory;
}

/**
 * Obtiene el nombre legible de la categoría
 *
 * @param {string} categoryId - ID de la categoría
 * @returns {string} Nombre legible
 */
export function getCategoryName(categoryId) {
  const category = SUPPLIER_CATEGORIES.find((cat) => cat.id === categoryId);
  return category ? category.name : 'Otros';
}

/**
 * Batch detection - Detecta categorías para múltiples lugares
 *
 * @param {Array} places - Array de lugares de Google Places
 * @param {string} searchQuery - Query original
 * @returns {Array} Lugares con categoría detectada
 */
export function detectCategoriesForPlaces(places, searchQuery = '') {
  return places.map((place) => ({
    ...place,
    detectedCategory: detectCategory(place, searchQuery),
    categoryName: getCategoryName(detectCategory(place, searchQuery)),
  }));
}

export default {
  detectCategory,
  getCategoryName,
  detectCategoriesForPlaces,
};
