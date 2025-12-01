import axios from 'axios';
import { searchAll as searchLocal } from './globalSearchService';
import { searchWeb, getUserLocation } from './webSearchService';

/**
 * Orquestador de Búsqueda con IA
 * Usa OpenAI para entender la intención y decidir estrategia de búsqueda
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004';

/**
 * Analizar query con IA para extraer intención
 */
export const analyzeSearchIntent = async (query) => {
  try {
    // Usar endpoint backend (más seguro)
    const response = await axios.post(
      `${BACKEND_URL}/api/ai/search/analyze-intent`,
      { query },
      {
        headers: {
          'Content-Type': 'application/json',
          // El auth token se añade automáticamente por el interceptor de axios
        },
      }
    );

    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }

    // Fallback si el backend no tiene respuesta válida
    return analyzeSearchIntentBasic(query);
  } catch (error) {
    // console.error('Error analyzing search intent with AI:', error);
    return analyzeSearchIntentBasic(query);
  }
};

/**
 * Análisis básico sin IA (fallback)
 */
const analyzeSearchIntentBasic = (query) => {
  const lowerQuery = query.toLowerCase();

  // Detectar categorías primero
  const categories = {
    fotografo: /fotógraf|photo|camara/i,
    fotografia: /fotograf[íi]a/i,
    catering: /catering|comida|banquete/i,
    flores: /flor|ramo|centro de mesa/i,
    musica: /música|dj|banda|orquesta/i,
    video: /video|videograf/i,
    pasteleria: /tarta|pastel|postre/i,
    decoracion: /decoraci[óo]n|decorador/i,
    venue: /venue|sal[óo]n|finca|lugar/i,
    hotel: /hotel|alojamiento/i,
    transporte: /transporte|coche|limousine/i,
    maquillaje: /maquillaje|makeup|belleza/i,
    peluqueria: /peluquer[íi]a|pelo|hair/i,
    vestido: /vestido|novia|traje/i,
  };

  let category = null;
  for (const [cat, regex] of Object.entries(categories)) {
    if (regex.test(lowerQuery)) {
      category = cat;
      break;
    }
  }

  // Detectar ubicación
  const locationMatch = lowerQuery.match(/en ([a-záéíóúñ\s]+)|de ([a-záéíóúñ\s]+)/i);
  const location = locationMatch ? (locationMatch[1] || locationMatch[2]).trim() : null;

  // Detectar si es búsqueda de inspiración
  const inspirationKeywords = /ideas?|inspiraci[óo]n|ejemplos?|estilo|dise[ñn]o/i;
  const isInspiration = inspirationKeywords.test(lowerQuery);

  // Detectar si parece un nombre propio (comienza con mayúscula o tiene varias palabras capitalizadas)
  const looksLikeProperName =
    /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(query) || /[A-ZÁÉÍÓÚÑ][a-z]+\s+[A-ZÁÉÍÓÚÑ][a-z]+/.test(query);

  // Si no tiene categoría ni es inspiración, y tiene más de 3 caracteres, probablemente es un nombre específico
  // Incluso si está en minúsculas (ej: "audioprobe")
  const isSpecificName =
    (looksLikeProperName ||
      (!category && !isInspiration && query.length > 3 && !query.includes(' '))) &&
    !category &&
    !isInspiration;

  // Decidir si necesita web
  const needsWeb = !!(category || location || isInspiration || isSpecificName);

  // Determinar fuentes
  const sources = [];
  if (category || location || isSpecificName) {
    sources.push('google_places');
  }
  if (isInspiration) {
    sources.push('pinterest', 'unsplash');
  }

  return {
    searchType: isInspiration ? 'inspiration' : needsWeb ? 'mixed' : 'local',
    category,
    location,
    needsWeb,
    sources: sources.length > 0 ? sources : ['google_places'],
    intent: isSpecificName
      ? 'search_specific_name'
      : category
        ? 'search_supplier'
        : isInspiration
          ? 'search_inspiration'
          : 'search_local',
    isSpecificName,
  };
};

/**
 * Enriquecer resultados con IA
 */
export const enrichResultsWithAI = async (results, query) => {
  if (results.length === 0) {
    return results;
  }

  try {
    // Usar endpoint backend (más seguro)
    const response = await axios.post(
      `${BACKEND_URL}/api/ai/search/enrich-results`,
      { results, query },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data?.success && response.data?.data) {
      const { results: enrichedResults, enrichment } = response.data.data;

      // Añadir enrichment al primer resultado
      if (enrichedResults[0] && enrichment) {
        enrichedResults[0].aiInsight = enrichment.reasoning || enrichment.topPick;
      }

      return enrichedResults;
    }

    return results;
  } catch (error) {
    // console.error('Error enriching results with AI:', error);
    return results;
  }
};

/**
 * Búsqueda universal orquestada por IA
 */
export const universalSearch = async (query, weddingId, userId) => {
  if (!query || query.length < 2) {
    return {
      local: [],
      web: [],
      combined: [],
      intent: null,
      aiInsight: null,
    };
  }

  try {
    // 1. Analizar intención con IA
    const intent = await analyzeSearchIntent(query);

    // console.log('🤖 Search Intent:', intent);

    // 2. Búsqueda local (siempre)
    const localPromise = searchLocal(query, weddingId, userId);

    // 3. Búsqueda web (si es necesario)
    let webPromise = Promise.resolve({ combined: [], bySource: {} });

    if (intent.needsWeb) {
      // Obtener ubicación del usuario si busca proveedores
      let userLocation = null;
      if (
        intent.intent === 'search_supplier' ||
        intent.intent === 'search_venue' ||
        intent.intent === 'search_specific_name'
      ) {
        userLocation = await getUserLocation();
      }

      webPromise = searchWeb(query, {
        category: intent.category,
        location: userLocation || intent.location,
        sources: intent.sources,
        limit: 10,
        isSpecificName: intent.isSpecificName || false,
      });
    }

    // 4. Ejecutar búsquedas en paralelo
    const [localResults, webResults] = await Promise.all([localPromise, webPromise]);

    // 5. Combinar y ordenar resultados
    const webResultsFormatted = webResults.combined.map((r) => ({
      ...r,
      title: r.name,
      isExternal: true,
      source: r.source,
    }));

    let combined = [...localResults, ...webResultsFormatted];

    // 6. Enriquecer con IA (opcional, solo para los top)
    if (intent.needsWeb && combined.length > 0) {
      combined = await enrichResultsWithAI(combined, query);
    }

    return {
      local: localResults,
      web: webResultsFormatted,
      combined,
      intent,
      aiInsight: combined[0]?.aiInsight || null,
      sources: intent.sources,
    };
  } catch (error) {
    // console.error('Error in universal search:', error);

    // Fallback: solo búsqueda local
    const localResults = await searchLocal(query, weddingId, userId);
    return {
      local: localResults,
      web: [],
      combined: localResults,
      intent: null,
      aiInsight: null,
    };
  }
};

/**
 * Generar sugerencias de búsqueda con IA
 */
export const generateSearchSuggestions = async (partialQuery, context = {}) => {
  if (partialQuery.length < 2) {
    return [];
  }

  try {
    // Usar endpoint backend (más seguro)
    const response = await axios.post(
      `${BACKEND_URL}/api/ai/search/generate-suggestions`,
      { partialQuery, context },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data?.success && response.data?.data?.suggestions) {
      return response.data.data.suggestions;
    }

    return [];
  } catch (error) {
    // console.error('Error generating suggestions:', error);
    return [];
  }
};

export default {
  analyzeSearchIntent,
  enrichResultsWithAI,
  universalSearch,
  generateSearchSuggestions,
};
