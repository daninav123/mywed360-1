// routes/ai-suppliers-real-search.js
// Búsqueda REAL de proveedores usando Google Custom Search API + OpenAI para estructurar
// POST /api/ai-suppliers-real
// Body: { query, service, budget, profile, location }

import express from 'express';
import OpenAI from 'openai';
import logger from '../utils/logger.js';

const router = express.Router();

let openai = null;
let openAIConfig = { apiKey: null };

const resolveApiKey = () => process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
const resolveProjectId = () =>
  process.env.OPENAI_PROJECT_ID || process.env.VITE_OPENAI_PROJECT_ID || '';
const resolveGoogleKey = () => process.env.GOOGLE_SEARCH_API_KEY || '';
const resolveGoogleCX = () => process.env.GOOGLE_SEARCH_CX || '';

const ensureOpenAIClient = () => {
  const apiKey = resolveApiKey().trim();
  const projectId = resolveProjectId().trim();
  if (!apiKey) {
    openai = null;
    openAIConfig = { apiKey: null, projectId: null };
    return false;
  }
  if (openai && openAIConfig.apiKey === apiKey && openAIConfig.projectId === projectId) return true;
  try {
    openai = new OpenAI({ apiKey, project: projectId || undefined });
    openAIConfig = { apiKey, projectId };
    logger.info('[ai-suppliers-real] Cliente OpenAI inicializado', {
      apiKeyPrefix: apiKey.slice(0, 8),
      projectId: projectId || null,
    });
    return true;
  } catch (error) {
    openai = null;
    logger.error('[ai-suppliers-real] Error inicializando OpenAI', { message: error?.message });
    return false;
  }
};

// Búsqueda real usando Google Custom Search API
async function searchGoogle(query, location) {
  const apiKey = resolveGoogleKey();
  const cx = resolveGoogleCX();

  if (!apiKey || !cx) {
    throw new Error('Google Search API no configurada (GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_CX)');
  }

  const searchQuery = `${query} ${location} bodas proveedor`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(searchQuery)}&num=10`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    logger.error('[ai-suppliers-real] Error en búsqueda Google', {
      message: error.message,
      query: searchQuery,
    });
    throw error;
  }
}

// Usar OpenAI para estructurar y filtrar resultados de búsqueda real
async function structureResults(searchResults, query, service, location, budget) {
  if (!searchResults || searchResults.length === 0) {
    return [];
  }

  const resultsText = searchResults
    .map((item, idx) => {
      return `[${idx + 1}]
Título: ${item.title}
URL: ${item.link}
Snippet: ${item.snippet || 'N/A'}
`;
    })
    .join('\n\n');

  const prompt = `Analiza los siguientes resultados de búsqueda web REALES y extrae información de proveedores de bodas para el servicio "${service}" en ${location}.

BÚSQUEDA ORIGINAL: "${query}"
PRESUPUESTO: ${budget || 'No especificado'}

RESULTADOS DE BÚSQUEDA WEB:
${resultsText}

TAREA:
1. Identifica los proveedores reales que coincidan con la búsqueda
2. Extrae: nombre, URL, descripción, ubicación, rango de precio (si aparece)
3. Filtra resultados que NO sean proveedores (blogs, artículos generales, etc.)
4. Devuelve máximo 6 proveedores más relevantes

FORMATO JSON:
{
  "providers": [
    {
      "title": "Nombre comercial exacto del proveedor",
      "link": "URL del resultado (debe ser la URL real proporcionada)",
      "snippet": "Descripción del servicio (max 100 palabras)",
      "service": "${service}",
      "location": "Ciudad/provincia extraída del resultado",
      "priceRange": "Rango de precio si aparece mencionado, o vacío",
      "tags": ["etiqueta1", "etiqueta2"]
    }
  ]
}

IMPORTANTE: Solo incluye proveedores reales que aparecen en los resultados. Usa las URLs exactas proporcionadas.`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Eres un experto en extraer y estructurar información de proveedores de bodas desde resultados de búsqueda web. Solo devuelves información que aparece explícitamente en los resultados.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return parsed.providers || [];
  } catch (error) {
    logger.error('[ai-suppliers-real] Error estructurando resultados', {
      message: error.message,
    });
    return [];
  }
}

ensureOpenAIClient();

router.post('/', async (req, res) => {
  const hasOpenAI = ensureOpenAIClient();
  const hasGoogle = resolveGoogleKey() && resolveGoogleCX();

  if (!hasOpenAI || !openai) {
    logger.error('[ai-suppliers-real] OpenAI no disponible');
    return res.status(500).json({
      error: 'OPENAI_API_KEY missing',
      message: 'Configura OPENAI_API_KEY en el backend para usar búsqueda IA',
    });
  }

  if (!hasGoogle) {
    logger.error('[ai-suppliers-real] Google Search API no configurada');
    return res.status(500).json({
      error: 'GOOGLE_SEARCH_NOT_CONFIGURED',
      message:
        'Configura GOOGLE_SEARCH_API_KEY y GOOGLE_SEARCH_CX para búsqueda real. Ver: https://developers.google.com/custom-search/v1/overview',
    });
  }

  const { query, service = '', budget = '', profile = {}, location = '' } = req.body || {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  const formattedLocation =
    location || profile?.celebrationPlace || profile?.location || profile?.city || 'España';

  try {
    logger.info('[ai-suppliers-real] Iniciando búsqueda real', {
      query,
      service,
      location: formattedLocation,
    });

    // 1. Búsqueda web real
    const searchResults = await searchGoogle(query, formattedLocation);

    logger.info('[ai-suppliers-real] Resultados de Google obtenidos', {
      count: searchResults.length,
    });

    if (searchResults.length === 0) {
      return res.json([]);
    }

    // 2. Estructurar con OpenAI
    const structuredProviders = await structureResults(
      searchResults,
      query,
      service,
      formattedLocation,
      budget
    );

    logger.info('[ai-suppliers-real] Proveedores estructurados', {
      count: structuredProviders.length,
      firstProvider: structuredProviders[0]?.title || 'N/A',
    });

    res.json(structuredProviders);
  } catch (error) {
    logger.error('[ai-suppliers-real] Error en búsqueda', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: 'search_failed',
      message: error.message,
      details: 'Error realizando búsqueda real de proveedores',
    });
  }
});

export default router;
