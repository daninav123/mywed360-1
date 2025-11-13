/**
 * 🤖 Clasificador Automático de Categorías de Proveedores
 *
 * Detecta automáticamente la categoría de un proveedor basándose en:
 * - Nombre del proveedor
 * - Descripción / snippet
 * - Keywords de SUPPLIER_CATEGORIES
 *
 * Usa un sistema de scoring para encontrar la mejor coincidencia.
 */

import { SUPPLIER_CATEGORIES, findCategoryByKeyword } from '../shared/supplierCategories';

/**
 * Normaliza texto para comparación
 * - Elimina acentos
 * - Convierte a minúsculas
 * - Elimina caracteres especiales
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar marcas diacríticas
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Reemplazar caracteres especiales por espacios
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim();
}

/**
 * Calcula el score de coincidencia entre texto y keywords
 *
 * @param {string} text - Texto a analizar (nombre, descripción, etc.)
 * @param {string[]} keywords - Lista de keywords de la categoría
 * @returns {number} Score de 0 a 100
 */
function calculateKeywordScore(text, keywords) {
  if (!text || !keywords || keywords.length === 0) return 0;

  const normalizedText = normalizeText(text);
  const words = normalizedText.split(' ');

  let score = 0;
  let matchedKeywords = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);

    // Coincidencia exacta en el texto completo (peso 3)
    if (normalizedText.includes(normalizedKeyword)) {
      score += 30;
      matchedKeywords++;
    }

    // Coincidencia en palabras individuales (peso 2)
    for (const word of words) {
      if (word === normalizedKeyword) {
        score += 20;
        matchedKeywords++;
        break;
      }

      // Coincidencia parcial (peso 1)
      if (word.includes(normalizedKeyword) || normalizedKeyword.includes(word)) {
        score += 10;
        matchedKeywords++;
        break;
      }
    }
  }

  // Bonus por múltiples keywords coincidentes
  if (matchedKeywords > 1) {
    score += matchedKeywords * 5;
  }

  // Normalizar a 0-100
  return Math.min(100, score);
}

/**
 * Clasifica un proveedor en la categoría más apropiada
 *
 * @param {Object} supplier - Datos del proveedor
 * @param {string} supplier.name - Nombre del proveedor
 * @param {string} [supplier.description] - Descripción
 * @param {string} [supplier.snippet] - Snippet de búsqueda
 * @param {string} [supplier.service] - Servicio declarado (si existe)
 * @param {string[]} [supplier.tags] - Tags del proveedor
 * @returns {Object} { category: string, confidence: number, alternativeCategories: Array }
 */
export function classifySupplier(supplier) {
  if (!supplier || typeof supplier !== 'object') {
    return {
      category: 'otros',
      categoryName: 'Otros',
      confidence: 0,
      alternativeCategories: [],
    };
  }

  // 1. Si ya tiene un servicio/categoría declarado, intentar usarlo
  if (supplier.service || supplier.category) {
    const declaredCategory = findCategoryByKeyword(supplier.service || supplier.category);
    if (declaredCategory) {
      // console.log(`✅ [Classifier] Categoría declarada: ${declaredCategory.id}`);
      return {
        category: declaredCategory.id,
        categoryName: declaredCategory.name,
        confidence: 95, // Alta confianza si viene declarado
        alternativeCategories: [],
        method: 'declared',
      };
    }
  }

  // 2. Analizar textos disponibles
  const textsToAnalyze = [
    { text: supplier.name || '', weight: 3 }, // Nombre es muy importante
    { text: supplier.description || '', weight: 2 }, // Descripción es importante
    { text: supplier.snippet || '', weight: 2 }, // Snippet también
    { text: supplier.aiSummary || '', weight: 1.5 }, // Resumen IA
    { text: (supplier.tags || []).join(' '), weight: 2 }, // Tags son relevantes
  ];

  // 3. Calcular scores para cada categoría
  const categoryScores = SUPPLIER_CATEGORIES.map((category) => {
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const { text, weight } of textsToAnalyze) {
      if (!text) continue;

      const keywordScore = calculateKeywordScore(text, category.keywords);
      totalScore += keywordScore * weight;
      maxPossibleScore += 100 * weight;
    }

    // Normalizar a 0-100
    const normalizedScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    return {
      category: category.id,
      categoryName: category.name,
      score: normalizedScore,
      coverage: category.coverage,
    };
  });

  // 4. Ordenar por score
  categoryScores.sort((a, b) => b.score - a.score);

  // 5. Obtener la mejor categoría
  const bestMatch = categoryScores[0];

  // 6. Si el score es muy bajo, asignar a "otros"
  if (bestMatch.score < 10) {
    // console.log(`⚠️ [Classifier] Score muy bajo (${bestMatch.score}), asignando a 'otros'`);
    return {
      category: 'otros',
      categoryName: 'Otros',
      confidence: 0,
      alternativeCategories: categoryScores.slice(0, 3).map((c) => ({
        category: c.category,
        categoryName: c.categoryName,
        confidence: Math.round(c.score),
      })),
      method: 'fallback',
    };
  }

  // 7. Obtener categorías alternativas (top 3)
  const alternatives = categoryScores
    .slice(1, 4)
    .filter((c) => c.score > 5) // Solo si tienen score significativo
    .map((c) => ({
      category: c.category,
      categoryName: c.categoryName,
      confidence: Math.round(c.score),
    }));


  return {
    category: bestMatch.category,
    categoryName: bestMatch.categoryName,
    confidence: Math.round(bestMatch.score),
    alternativeCategories: alternatives,
    method: 'ai_keywords',
  };
}

/**
 * Clasifica múltiples proveedores en batch
 *
 * @param {Array<Object>} suppliers - Lista de proveedores
 * @returns {Array<Object>} Proveedores con categoría asignada
 */
export function classifySuppliers(suppliers) {
  if (!Array.isArray(suppliers)) {
    return [];
  }

  // console.log(`🔄 [Classifier] Clasificando ${suppliers.length} proveedores...`);

  const classified = suppliers.map((supplier) => {
    const classification = classifySupplier(supplier);

    return {
      ...supplier,
      category: classification.category,
      categoryName: classification.categoryName,
      categoryConfidence: classification.confidence,
      alternativeCategories: classification.alternativeCategories,
      classificationMethod: classification.method,
    };
  });

  // Estadísticas
  const stats = classified.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});

  // console.log(`✅ [Classifier] Clasificación completada:`, stats);

  return classified;
}

/**
 * Reclasifica un proveedor si el usuario lo corrige manualmente
 *
 * @param {Object} supplier - Proveedor
 * @param {string} newCategory - Nueva categoría asignada por el usuario
 * @returns {Object} Proveedor actualizado
 */
export function reclassifySupplier(supplier, newCategory) {
  const category = SUPPLIER_CATEGORIES.find((c) => c.id === newCategory);

  if (!category) {
    // console.warn(`⚠️ [Classifier] Categoría inválida: ${newCategory}`);
    return supplier;
  }

  // console.log(`🔄 [Classifier] Reclasificando "${supplier.name}" → ${category.name}`);

  return {
    ...supplier,
    category: category.id,
    categoryName: category.name,
    categoryConfidence: 100, // 100% porque lo asignó el usuario
    classificationMethod: 'manual',
    alternativeCategories: [], // Limpiar alternativas
  };
}

export default {
  classifySupplier,
  classifySuppliers,
  reclassifySupplier,
};
