/**
 * Rutas de IA para búsqueda inteligente
 * Migrado desde frontend para seguridad
 */

import express from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError, sendInternalError } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Obtener API key desde backend (más seguro)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

// Rate limiting simple (mejorar en producción)
const rateLimitMap = new Map();
const RATE_LIMIT = 20; // requests por minuto
const RATE_WINDOW_MS = 60 * 1000;

const checkRateLimit = (uid) => {
  const now = Date.now();
  const userRequests = rateLimitMap.get(uid) || [];

  // Limpiar requests antiguos
  const recentRequests = userRequests.filter((timestamp) => now - timestamp < RATE_WINDOW_MS);

  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }

  recentRequests.push(now);
  rateLimitMap.set(uid, recentRequests);
  return true;
};

/**
 * POST /api/ai/search/analyze-intent
 * Analizar intención de búsqueda con IA
 */
router.post('/analyze-intent', requireAuth, async (req, res) => {
  try {
    const { query } = req.body;
    const uid = req.user?.uid;

    if (!query || typeof query !== 'string') {
      return sendError(req, res, 'bad_request', 'Query requerido', 400);
    }

    // Rate limiting
    if (!checkRateLimit(uid)) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'rate-limit-exceeded',
          message: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.',
        },
      });
    }

    if (!OPENAI_API_KEY) {
      // Fallback sin IA
      return sendSuccess(req, res, {
        intent: 'general',
        category: null,
        filters: {},
        hasLocation: false,
        hasDate: false,
        hasPriceRange: false,
      });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Analiza la intención de búsqueda y devuelve un JSON con: intent, category, filters, hasLocation, hasDate, hasPriceRange',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content || '{}';
    let analysis = {};

    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = {
        intent: 'general',
        category: null,
        filters: {},
      };
    }

    logger.info(`[AI Search] Intent analyzed for user ${uid}: ${analysis.intent}`);

    return sendSuccess(req, res, analysis);
  } catch (error) {
    logger.error('[AI Search] Error analyzing intent:', error);

    // Fallback sin IA
    return sendSuccess(req, res, {
      intent: 'general',
      category: null,
      filters: {},
      fallback: true,
    });
  }
});

/**
 * POST /api/ai/search/enrich-results
 * Enriquecer resultados con recomendaciones IA
 */
router.post('/enrich-results', requireAuth, async (req, res) => {
  try {
    const { results, query } = req.body;
    const uid = req.user?.uid;

    if (!Array.isArray(results)) {
      return sendError(req, res, 'bad_request', 'Results debe ser un array', 400);
    }

    if (!results.length) {
      return sendSuccess(req, res, results);
    }

    // Rate limiting
    if (!checkRateLimit(uid)) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'rate-limit-exceeded',
          message: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.',
        },
      });
    }

    if (!OPENAI_API_KEY) {
      // Sin enriquecimiento
      return sendSuccess(req, res, results);
    }

    const summarized = results.slice(0, 5).map((r) => ({
      name: r.name,
      service: r.service,
      location: r.location,
    }));

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Analiza resultados de búsqueda y sugiere recomendaciones relevantes. Devuelve JSON con: topPick, reasoning, suggestions',
          },
          {
            role: 'user',
            content: `Query: "${query}". Resultados: ${JSON.stringify(summarized)}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content || '{}';
    let enrichment = {};

    try {
      enrichment = JSON.parse(content);
    } catch {
      enrichment = {};
    }

    logger.info(`[AI Search] Results enriched for user ${uid}`);

    return sendSuccess(req, res, {
      results,
      enrichment,
    });
  } catch (error) {
    logger.error('[AI Search] Error enriching results:', error);

    // Sin enriquecimiento
    return sendSuccess(req, res, { results });
  }
});

/**
 * POST /api/ai/search/generate-suggestions
 * Generar sugerencias de búsqueda
 */
router.post('/generate-suggestions', requireAuth, async (req, res) => {
  try {
    const { partialQuery, context = {} } = req.body;
    const uid = req.user?.uid;

    if (!partialQuery || typeof partialQuery !== 'string') {
      return sendError(req, res, 'bad_request', 'partialQuery requerido', 400);
    }

    if (partialQuery.length < 2) {
      return sendSuccess(req, res, { suggestions: [] });
    }

    // Rate limiting
    if (!checkRateLimit(uid)) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'rate-limit-exceeded',
          message: 'Demasiadas solicitudes.',
        },
      });
    }

    if (!OPENAI_API_KEY) {
      return sendSuccess(req, res, { suggestions: [] });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Genera 3-5 sugerencias de búsqueda relevantes para proveedores de bodas. Devuelve array de strings.',
          },
          {
            role: 'user',
            content: `Búsqueda parcial: "${partialQuery}". Contexto: ${JSON.stringify(context)}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 150,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content || '[]';
    let suggestions = [];

    try {
      suggestions = JSON.parse(content);
      if (!Array.isArray(suggestions)) {
        suggestions = [];
      }
    } catch {
      suggestions = [];
    }

    logger.info(`[AI Search] Suggestions generated for user ${uid}`);

    return sendSuccess(req, res, { suggestions });
  } catch (error) {
    logger.error('[AI Search] Error generating suggestions:', error);
    return sendSuccess(req, res, { suggestions: [] });
  }
});

export default router;
