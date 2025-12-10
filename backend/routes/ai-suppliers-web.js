// routes/ai-suppliers-web.js
// Endpoint que usa Tavily API para búsqueda web REAL de proveedores
// POST /api/ai-suppliers-web
// Requiere TAVILY_API_KEY en .env

import express from 'express';
import OpenAI from 'openai';
import logger from '../utils/logger.js';

const router = express.Router();

// Cliente OpenAI para procesar y estructurar resultados
let openai = null;
const resolveOpenAIKey = () => process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
const resolveProjectId = () =>
  process.env.OPENAI_PROJECT_ID || process.env.VITE_OPENAI_PROJECT_ID || '';

const ensureOpenAIClient = () => {
  const apiKey = resolveOpenAIKey().trim();
  const projectId = resolveProjectId().trim();
  if (!apiKey || openai) return !!openai;

  try {
    openai = new OpenAI({ apiKey, project: projectId || undefined });
    return true;
  } catch {
    return false;
  }
};

ensureOpenAIClient();

/**
 * Búsqueda web real usando Tavily API
 */
async function searchWithTavily(query, location, options = {}) {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    throw new Error('TAVILY_API_KEY not configured');
  }

  // Construir query optimizada
  const searchQuery = `${query} ${location} proveedor bodas -"boda de" -"invitados boda"`;

  logger.info('[ai-suppliers-web] Búsqueda en Tavily', { query: searchQuery });

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: tavilyKey,
      query: searchQuery,
      search_depth: 'advanced', // 'basic' o 'advanced'
      include_domains: ['bodas.net', 'bodas.com.mx', 'instagram.com'], // Priorizar estas
      max_results: 10,
      include_answer: false,
      include_raw_content: false,
      include_images: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('[ai-suppliers-web] Error en Tavily', {
      status: response.status,
      error,
    });
    throw new Error(`Tavily API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Procesa resultados de Tavily con OpenAI para extraer información estructurada
 */
async function processResultsWithAI(webResults, service, location, budget) {
  if (!ensureOpenAIClient() || !openai) {
    // Fallback: devolver resultados crudos
    return webResults.map((result, index) => ({
      title: result.title || `Proveedor ${index + 1}`,
      link: result.url || '',
      snippet: result.content?.substring(0, 200) || '',
      service: service || 'Servicios para bodas',
      location: location || '',
      priceRange: '',
      tags: [],
    }));
  }

  const prompt = `Analiza estos resultados de búsqueda web y extrae información de proveedores de bodas.

RESULTADOS WEB:
${webResults.map((r, i) => `${i + 1}. ${r.title}\nURL: ${r.url}\n${r.content?.substring(0, 300) || ''}\n`).join('\n')}

CONTEXTO:
- Servicio buscado: ${service || 'Servicios para bodas'}
- Ubicación: ${location || 'No especificada'}
- Presupuesto: ${budget || 'No especificado'}

TAREA:
Extrae y estructura información de MÁXIMO 6 proveedores reales.
Para cada proveedor detectado, devuelve:
{
  "title": "Nombre comercial exacto",
  "link": "URL de la web (del resultado)",
  "snippet": "Descripción del servicio (50-100 palabras)",
  "service": "${service || 'Servicios para bodas'}",
  "location": "Ciudad/Provincia donde opera",
  "priceRange": "Rango de precio si se menciona",
  "phone": "Teléfono si aparece",
  "email": "Email si aparece", 
  "tags": ["etiqueta1", "etiqueta2", "etiqueta3"]
}

IMPORTANTE:
- Solo incluye proveedores claramente identificados
- Usa la URL exacta del resultado de búsqueda
- Si no encuentras precio, deja priceRange vacío
- Tags relevantes: estilo, especialización, ubicación

Devuelve formato: {"providers": [array de proveedores]}`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Eres un experto en extraer y estructurar información de proveedores de bodas desde resultados de búsqueda web.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content || '';

  try {
    const parsed = JSON.parse(content);
    if (parsed.providers && Array.isArray(parsed.providers)) {
      return parsed.providers;
    }
    return [];
  } catch (err) {
    logger.error('[ai-suppliers-web] Error parseando respuesta AI', { error: err.message });
    return [];
  }
}

router.post('/', async (req, res) => {
  const { query, service = '', budget = '', profile = {}, location = '' } = req.body || {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  // Derivar ubicación del perfil
  const formattedLocation =
    location ||
    profile?.celebrationPlace ||
    profile?.location ||
    profile?.city ||
    profile?.weddingInfo?.location ||
    'España';

  try {
    logger.info('[ai-suppliers-web] Iniciando búsqueda web', {
      query,
      service,
      location: formattedLocation,
    });

    // 1. Búsqueda web real con Tavily
    const webResults = await searchWithTavily(query, formattedLocation, { service });

    if (!webResults || webResults.length === 0) {
      logger.warn('[ai-suppliers-web] Sin resultados de Tavily');
      return res.status(404).json({
        error: 'no_results',
        message: 'No se encontraron proveedores en la búsqueda web. Intenta con otros términos.',
      });
    }

    logger.info('[ai-suppliers-web] Resultados de Tavily obtenidos', {
      count: webResults.length,
    });

    // 2. Procesar resultados con IA para extraer datos estructurados
    const providers = await processResultsWithAI(webResults, service, formattedLocation, budget);

    if (!providers || providers.length === 0) {
      logger.warn('[ai-suppliers-web] No se pudieron procesar proveedores');
      return res.status(502).json({
        error: 'processing_failed',
        message: 'Se encontraron resultados pero no se pudieron procesar. Intenta de nuevo.',
      });
    }

    logger.info('[ai-suppliers-web] Proveedores procesados exitosamente', {
      count: providers.length,
      firstProvider: providers[0]?.title || 'N/A',
    });

    // Añadir metadata
    const response = providers.map((p) => ({
      ...p,
      source: 'web-search',
      verified: true, // Resultados de búsqueda web real
    }));

    res.json(response);
  } catch (err) {
    logger.error('[ai-suppliers-web] Error en búsqueda web', {
      message: err?.message,
      stack: err?.stack,
    });

    // Si falla Tavily, devolver error específico
    if (err.message?.includes('TAVILY_API_KEY')) {
      return res.status(501).json({
        error: 'tavily_not_configured',
        message: 'Búsqueda web no disponible. Configura TAVILY_API_KEY en el backend.',
      });
    }

    res.status(500).json({
      error: 'web_search_failed',
      details: err?.message || 'unknown',
    });
  }
});

export default router;
