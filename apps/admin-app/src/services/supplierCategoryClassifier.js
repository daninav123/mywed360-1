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
 * Analiza el website del proveedor para detectar servicios
 * @param {Object} supplier - Proveedor con website
 * @returns {Promise<Object|null>} Servicios detectados o null
 */
async function analyzeSupplierWebsite(supplier) {
  if (!supplier.website) {
    console.warn('[WebAnalysis] No hay website');
    return null;
  }

  console.log(`🌐 [WebAnalysis] Llamando API para: ${supplier.website}`);
  
  try {
    const response = await fetch('/api/suppliers/analyze-website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: supplier.website,
        supplierName: supplier.name || ''
      })
    });

    console.log(`📊 [WebAnalysis] Respuesta HTTP: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WebAnalysis] Error HTTP:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('📊 [WebAnalysis] Data recibida:', data);
    
    if (!data.success) {
      console.warn('[WebAnalysis] API retornó success=false:', data.error);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error('[WebAnalysis] Exception:', error);
    return null;
  }
}

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
    let keywordMatched = false;

    // Coincidencia exacta en el texto completo (peso 3)
    if (normalizedText.includes(normalizedKeyword)) {
      score += 30;
      matchedKeywords++;
      keywordMatched = true;
    }

    // Coincidencia en palabras individuales (peso 2)
    if (!keywordMatched) {
      for (const word of words) {
        if (word === normalizedKeyword) {
          score += 20;
          matchedKeywords++;
          keywordMatched = true;
          break;
        }

        // Coincidencia parcial en palabras (peso 1.5)
        // Mejorado: detectar si keyword es parte significativa de la palabra
        if (word.length >= 4 && normalizedKeyword.length >= 4) {
          if (word.includes(normalizedKeyword)) {
            score += 15;
            matchedKeywords++;
            keywordMatched = true;
            break;
          }
          if (normalizedKeyword.includes(word) && word.length > 3) {
            score += 10;
            matchedKeywords++;
            keywordMatched = true;
            break;
          }
        }
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

  // Debug logging temporal
  const isDebugSupplier = supplier.name?.toLowerCase().includes('audio');
  if (isDebugSupplier) {
    console.log('🔍 [Classifier DEBUG] Analizando:', supplier.name);
    console.log('  - description:', supplier.description);
    console.log('  - snippet:', supplier.snippet);
    console.log('  - category:', supplier.category);
    console.log('  - service:', supplier.service);
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
    { text: supplier.name || '', weight: 5 }, // NOMBRE ES CRÍTICO - aumentado peso
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

    // Debug logging para proveedores de audio
    if (isDebugSupplier && normalizedScore > 0) {
      console.log(`  [${category.name}] Score: ${normalizedScore.toFixed(1)}`);
    }

    return {
      category: category.id,
      categoryName: category.name,
      score: normalizedScore,
      coverage: category.coverage,
    };
  });

  // 4. Ordenar por score (sin boost artificial)
  categoryScores.sort((a, b) => b.score - a.score);

  // 6. Obtener la mejor categoría
  const bestMatch = categoryScores[0];

  if (isDebugSupplier) {
    console.log('  ✅ Mejor match:', bestMatch.categoryName, '-', bestMatch.score.toFixed(1));
  }

  // 7. Si el score es muy bajo, asignar a "otros"
  // EXCEPTO si es una empresa de audio/sonido (forzar Música/DJ)
  if (bestMatch.score < 10 && !isAudioInName) {
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
  
  // Si es empresa de audio pero tiene score bajo, forzar Música o DJ
  if (bestMatch.score < 10 && isAudioInName) {
    const musicOrDJ = categoryScores.find(c => c.category === 'musica' || c.category === 'dj');
    if (musicOrDJ) {
      if (isDebugSupplier) {
        console.log('  🔄 [FORCE] Empresa de audio con score bajo, forzando:', musicOrDJ.categoryName);
      }
      return {
        category: musicOrDJ.category,
        categoryName: musicOrDJ.categoryName,
        confidence: 60,
        alternativeCategories: [
          ...categoryScores.filter(c => (c.category === 'musica' || c.category === 'dj') && c.category !== musicOrDJ.category).map(c => ({
            category: c.category,
            categoryName: c.categoryName,
            confidence: 50
          }))
        ],
        method: 'audio_company_forced',
      };
    }
  }

  // 8. Obtener categorías alternativas (top 3)
  const alternatives = categoryScores
    .slice(1, 4)
    .filter((c) => c.score > 5) // Solo si tienen score significativo
    .map((c) => ({
      category: c.category,
      categoryName: c.categoryName,
      confidence: Math.round(c.score),
    }));

  // 9. Lógica especial: Si es empresa de audio/sonido, incluir automáticamente Música y DJ
  const nameAndDesc = `${supplier.name || ''} ${supplier.description || ''} ${supplier.snippet || ''}`.toLowerCase();
  const isAudioCompany = nameAndDesc.includes('audio') || nameAndDesc.includes('sonido') || nameAndDesc.includes('sound');
  
  if (isAudioCompany) {
    // Buscar si Música o DJ están en las alternativas
    const hasMusicInAlternatives = alternatives.some(alt => alt.category === 'musica' || alt.category === 'dj');
    const isMusicOrDJMain = bestMatch.category === 'musica' || bestMatch.category === 'dj';
    
    if (isMusicOrDJMain && !hasMusicInAlternatives) {
      // Si la principal es Música o DJ, añadir la otra automáticamente
      const otherCategory = bestMatch.category === 'musica' ? 'dj' : 'musica';
      const otherCategoryData = categoryScores.find(c => c.category === otherCategory);
      
      if (otherCategoryData) {
        alternatives.unshift({
          category: otherCategoryData.category,
          categoryName: otherCategoryData.categoryName,
          confidence: Math.max(35, Math.round(otherCategoryData.score)), // Mínimo 35% para empresas de audio
        });
      }
    }
  }


  const result = {
    category: bestMatch.category,
    categoryName: bestMatch.categoryName,
    confidence: Math.round(bestMatch.score),
    alternativeCategories: alternatives,
    method: 'ai_keywords',
  };

  if (isDebugSupplier) {
    console.log('  📋 Resultado final:', result);
  }

  return result;
}

/**
 * Clasifica un proveedor CON análisis web si es necesario
 * @param {Object} supplier - Proveedor a clasificar
 * @returns {Promise<Object>} Clasificación
 */
export async function classifySupplierWithWebAnalysis(supplier) {
  console.log(`🔍 [classifySupplierWithWebAnalysis] Iniciando para: ${supplier.name}`);
  console.log(`  - Website: ${supplier.website}`);
  
  // 1. Clasificación básica primero
  const basicClassification = classifySupplier(supplier);
  console.log(`  - Clasificación básica: ${basicClassification.categoryName} (${basicClassification.confidence}%)`);

  // 2. Si confidence es baja O es "otros" Y tiene website, analizar web
  const shouldAnalyze = (basicClassification.confidence < 50 || basicClassification.category === 'otros') && supplier.website;
  
  if (shouldAnalyze) {
    const reason = basicClassification.category === 'otros' ? 'categoría=otros' : `confidence baja (${basicClassification.confidence}%)`;
    console.log(`🌐 [Classifier] ${reason}, analizando website...`, supplier.website);
    
    const webAnalysis = await analyzeSupplierWebsite(supplier);
    console.log('📊 [Classifier] Respuesta análisis web:', webAnalysis ? 'OK' : 'NULL');
    
    if (webAnalysis && webAnalysis.detectedServices && webAnalysis.detectedServices.length > 0) {
      console.log('✅ [Classifier] Servicios detectados en web:', webAnalysis.detectedServices);
      
      // Log detallado de cada servicio
      webAnalysis.detectedServices.forEach((s, i) => {
        console.log(`  ${i+1}. ${s.category}: ${s.confidence}%`);
      });
      
      // PASO 1: Encontrar servicio con mayor confidence
      let bestWebService = webAnalysis.detectedServices.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      console.log(`🔍 [Classifier] Servicio con mayor confidence: ${bestWebService.category} (${bestWebService.confidence}%)`);
      
      // PASO 2: Si el best es video, verificar si hay música con confidence similar para priorizarla
      if (bestWebService.category === 'video') {
        const musicaService = webAnalysis.detectedServices.find(s => s.category === 'musica');
        console.log(`🎵 [Classifier] ¿Hay música detectada?`, musicaService ? `SÍ (${musicaService.confidence}%)` : 'NO');
        
        if (musicaService && musicaService.confidence >= 80) {
          const diff = Math.abs(musicaService.confidence - bestWebService.confidence);
          console.log(`🎵 [Classifier] Video=${bestWebService.confidence}%, Música=${musicaService.confidence}%, Diferencia=${diff}% (umbral: 15%)`);
          
          if (diff < 15) {
            console.log(`✅ [Classifier] PRIORIZANDO música sobre video - empresa de audio/eventos`);
            bestWebService = musicaService;
          } else {
            console.log(`❌ [Classifier] NO priorizando música - diferencia muy grande (${diff}% >= 15%)`);
          }
        }
      }

      // PASO 3: Si el best es organizacion, verificar si hay música con confidence similar para priorizarla
      if (bestWebService.category === 'organizacion') {
        const musicaService = webAnalysis.detectedServices.find(s => s.category === 'musica');
        console.log(`🎵 [Classifier] ¿Hay música detectada?`, musicaService ? `SÍ (${musicaService.confidence}%)` : 'NO');

        if (musicaService && musicaService.confidence >= 80) {
          const diff = Math.abs(musicaService.confidence - bestWebService.confidence);
          console.log(`🎵 [Classifier] Organización=${bestWebService.confidence}%, Música=${musicaService.confidence}%, Diferencia=${diff}% (umbral: 15%)`);

          if (diff < 15) {
            console.log(`✅ [Classifier] PRIORIZANDO música sobre organización - servicio más específico`);
            bestWebService = musicaService;
          } else {
            console.log(`❌ [Classifier] NO priorizando música - diferencia muy grande (${diff}% >= 15%)`);
          }
        }
      }
      
      console.log(`🤔 [Classifier] Mejor servicio web: ${bestWebService.category} (${bestWebService.confidence}%)`);
      console.log(`🤔 [Classifier] Clasificación básica: ${basicClassification.category} (${basicClassification.confidence}%)`);
      
      // Si la clasificación básica es "otros", SIEMPRE usar web
      const shouldUseWeb = basicClassification.category === 'otros' || bestWebService.confidence > basicClassification.confidence;
      console.log(`🤔 [Classifier] ¿Reclasificar?`, {
        isOtros: basicClassification.category === 'otros',
        webBetter: bestWebService.confidence > basicClassification.confidence,
        decision: shouldUseWeb
      });

      if (shouldUseWeb) {
        const reason = basicClassification.category === 'otros' ? 'clasificación básica es "otros"' : `web tiene mayor confidence (${bestWebService.confidence}% > ${basicClassification.confidence}%)`;
        console.log(`✅ [Classifier] SÍ reclasificando - Razón: ${reason}`);
        const category = SUPPLIER_CATEGORIES.find(c => c.id === bestWebService.category);
        
        return {
          category: bestWebService.category,
          categoryName: category?.name || bestWebService.category,
          confidence: bestWebService.confidence,
          alternativeCategories: webAnalysis.detectedServices
            .filter(s => s.category !== bestWebService.category)
            .map(s => ({
              category: s.category,
              categoryName: SUPPLIER_CATEGORIES.find(c => c.id === s.category)?.name || s.category,
              confidence: s.confidence
            })),
          method: 'web_analysis',
          webAnalysisData: webAnalysis
        };
      }
    }
  }

  return basicClassification;
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
  classifySupplierWithWebAnalysis,
  reclassifySupplier,
};
