// routes/ai-suppliers.js
// Endpoint que llama a OpenAI para buscar proveedores de boda
// POST /api/ai-suppliers
// Body (JSON): { query: string, service?: string, budget?: string, profile?: object, location?: string }
// Respuesta: Array<{title, link, snippet, service, location, priceRange}>

import express from 'express';
import OpenAI from 'openai';
import logger from '../utils/logger.js';

const router = express.Router();

let openai = null;
let openAIConfig = { apiKey: null, projectId: null };

const resolveApiKey = () => process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
const resolveProjectId = () =>
  process.env.OPENAI_PROJECT_ID || process.env.VITE_OPENAI_PROJECT_ID || '';

const ensureOpenAIClient = () => {
  const apiKey = resolveApiKey().trim();
  const projectId = resolveProjectId().trim();

  if (!apiKey) {
    if (openai) logger.warn('[ai-suppliers] cliente OpenAI eliminado porque no hay API key');
    openai = null;
    openAIConfig = { apiKey: null, projectId: null };
    return false;
  }

  if (openai && openAIConfig.apiKey === apiKey && openAIConfig.projectId === projectId) {
    return true;
  }

  try {
    openai = new OpenAI({ apiKey, project: projectId || undefined });
    openAIConfig = { apiKey, projectId };
    logger.info('[ai-suppliers] Cliente OpenAI inicializado/actualizado', {
      apiKeyPrefix: apiKey.slice(0, 8),
      projectId: projectId || null,
    });
    return true;
  } catch (error) {
    openai = null;
    openAIConfig = { apiKey: null, projectId: null };
    logger.error('[ai-suppliers] No se pudo inicializar OpenAI', { message: error?.message });
    return false;
  }
};

// Intento de inicialización al cargar el módulo
ensureOpenAIClient();

router.post('/', async (req, res) => {
  const hasClient = ensureOpenAIClient();
  if (!hasClient || !openai) {
    logger.error('[ai-suppliers] Petición sin cliente OpenAI disponible');
    return res.status(500).json({ error: 'OPENAI_API_KEY missing' });
  }
  const { query, service = '', budget = '', profile = {}, location = '' } = req.body || {};
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  const servicioSeleccionado = service;
  // Derivar ubicación desde distintos posibles campos del perfil
  const formattedLocation =
    location ||
    (profile &&
      (profile.celebrationPlace ||
        profile.location ||
        profile.city ||
        profile.ceremonyLocation ||
        profile.receptionVenue)) ||
    (profile &&
      profile.weddingInfo &&
      (profile.weddingInfo.celebrationPlace ||
        profile.weddingInfo.location ||
        profile.weddingInfo.city)) ||
    'Espana';

  const locationPrompt = formattedLocation
    ? `La boda es en ${formattedLocation}.`
    : 'La ubicacion de la boda no esta especificada.';
  const inferredBudget =
    budget ||
    (profile && (profile.budget || profile.estimatedBudget || profile.totalBudget)) ||
    (profile &&
      profile.weddingInfo &&
      (profile.weddingInfo.budget ||
        profile.weddingInfo.estimatedBudget ||
        profile.weddingInfo.totalBudget)) ||
    '';
  const budgetPrompt = inferredBudget
    ? `El presupuesto es ${inferredBudget}.`
    : 'No hay un presupuesto especificado.';

  const prompt = `Busca en internet proveedores reales de ${servicioSeleccionado || 'servicios para bodas'} para la siguiente consulta:

CONSULTA: "${query}"
UBICACIÓN: ${formattedLocation}
${budgetPrompt}

REQUISITOS:
1. Busca SOLO proveedores reales con presencia web verificable
2. Prioriza proveedores en ${formattedLocation} o que den servicio en esa zona
3. Incluye web oficial, perfil en bodas.net, bodas.com.mx, instagram profesional, o similar
4. Verifica que sean proveedores activos (no cerrados)
5. Busca diversidad: diferentes estilos y rangos de precio

DEVUELVE un array JSON con exactamente 6 proveedores encontrados. Formato por proveedor:
{
  "title": "Nombre comercial del proveedor",
  "link": "URL verificada (web oficial o perfil profesional)",
  "snippet": "Descripción breve del servicio (50-100 palabras)",
  "service": "${servicioSeleccionado || 'Servicios para bodas'}",
  "location": "Ciudad/Provincia donde opera",
  "priceRange": "Rango de precio estimado (ej: 1200-2500 EUR)",
  "phone": "Teléfono si está disponible",
  "email": "Email si está disponible",
  "tags": ["etiqueta1", "etiqueta2", "etiqueta3"]
}

IMPORTANTE: Devuelve SOLO el array JSON, sin texto adicional antes o después.`;

  try {
    logger.info('[ai-suppliers] solicitando resultados a OpenAI', {
      query,
      service: servicioSeleccionado || 'Servicios para bodas',
      projectId: openAIConfig.projectId || null,
      apiKeyPrefix: (openAIConfig.apiKey || '').slice(0, 8),
    });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Eres un buscador experto de proveedores de bodas con acceso a internet.
Buscas información actualizada y verificada.
Siempre devuelves resultados en formato JSON válido.
Solo incluyes proveedores que existen realmente y tienen presencia web verificable.`,
        },
        {
          role: 'user',
          content: `${prompt}\n\nDevuelve el resultado en formato JSON con la estructura: {"providers": [array de proveedores]}`,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || '';
    let results = [];

    try {
      const parsed = JSON.parse(content);
      // El response_format json_object devuelve {providers: [...]}
      if (parsed.providers && Array.isArray(parsed.providers)) {
        results = parsed.providers;
      } else if (Array.isArray(parsed)) {
        results = parsed;
      } else {
        logger.warn('[ai-suppliers] formato JSON inesperado', { parsed });
      }
    } catch (parseError) {
      logger.error('[ai-suppliers] Error parseando respuesta', {
        error: parseError.message,
        content: content.substring(0, 500),
      });

      // Intentar extraer substring que parezca un array JSON
      const match = content.match(/\[.*\]/s);
      if (match) {
        try {
          results = JSON.parse(match[0]);
        } catch {
          /* deja results vacio */
        }
      }
    }

    if (!Array.isArray(results) || results.length === 0) {
      logger.error('[ai-suppliers] Sin resultados válidos', {
        hasContent: !!content,
        contentPreview: content.substring(0, 200),
      });
      return res.status(502).json({
        error: 'openai_invalid_response',
        message: 'La IA no devolvió proveedores válidos. Intenta reformular la búsqueda.',
        raw: content.substring(0, 500),
      });
    }

    logger.info('[ai-suppliers] Resultados obtenidos exitosamente', {
      count: results.length,
      firstProvider: results[0]?.title || 'N/A',
    });

    res.json(results);
  } catch (err) {
    logger.error('[ai-suppliers] Error en llamada a OpenAI', {
      message: err?.message,
      stack: err?.stack,
      type: err?.type,
    });
    res.status(500).json({ error: 'openai_failed', details: err?.message || 'unknown' });
  }
});

export default router;
