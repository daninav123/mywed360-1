/**
 * Rutas de Proxy para API Keys
 * Mueve las API keys del frontend al backend por seguridad
 */

import express from 'express';
import axios from 'axios';
import logger from '../utils/logger.js';

const router = express.Router();

// Rate limiting específico para proxies (más restrictivo)
import rateLimit from 'express-rate-limit';

const proxyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto
  message: { error: 'Demasiadas peticiones, intenta de nuevo más tarde' },
});

router.use(proxyLimiter);

/**
 * Proxy para Google Translation API
 * POST /api/proxy/translate
 */
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLang = 'es', sourceLang = '' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Texto requerido' });
    }

    const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (!API_KEY) {
      logger.warn('ProxyTranslate', 'API key de Google Translate no configurada');
      return res.status(503).json({
        error: 'Servicio de traducción no disponible',
        translated: text, // Devolver texto original como fallback
      });
    }

    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        q: text,
        target: targetLang,
        source: sourceLang || undefined,
        format: 'text',
      },
      {
        timeout: 10000,
      }
    );

    const translated = response.data.data.translations[0].translatedText;

    res.json({
      success: true,
      translated,
      source: sourceLang || 'auto',
      target: targetLang,
    });
  } catch (error) {
    logger.error('ProxyTranslate', 'Error en traducción', {
      message: error.message,
      status: error.response?.status,
    });

    res.status(500).json({
      error: 'Error en el servicio de traducción',
      translated: req.body.text, // Fallback al texto original
    });
  }
});

/**
 * Proxy para OpenAI API
 * POST /api/proxy/openai
 */
router.post('/openai', async (req, res) => {
  try {
    const { messages, model = 'gpt-4o-mini', maxTokens = 1000 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Mensajes requeridos' });
    }

    const API_KEY = process.env.OPENAI_API_KEY;

    if (!API_KEY) {
      logger.warn('ProxyOpenAI', 'API key de OpenAI no configurada');
      return res.status(503).json({
        error: 'Servicio de IA no disponible',
      });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    res.json({
      success: true,
      response: response.data.choices[0].message.content,
      usage: response.data.usage,
    });
  } catch (error) {
    logger.error('ProxyOpenAI', 'Error en OpenAI', {
      message: error.message,
      status: error.response?.status,
    });

    res.status(error.response?.status || 500).json({
      error: 'Error en el servicio de IA',
      details: error.response?.data?.error?.message,
    });
  }
});

/**
 * Proxy para Tavily Search API
 * POST /api/proxy/tavily-search
 */
router.post('/tavily-search', async (req, res) => {
  try {
    const { query, searchDepth = 'basic', maxResults = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query requerido' });
    }

    const API_KEY = process.env.TAVILY_API_KEY;

    if (!API_KEY) {
      logger.warn('ProxyTavily', 'API key de Tavily no configurada');
      return res.status(503).json({
        error: 'Servicio de búsqueda no disponible',
        results: [],
      });
    }

    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: API_KEY,
        query,
        search_depth: searchDepth,
        max_results: maxResults,
        include_answer: true,
        include_images: false,
      },
      {
        timeout: 15000,
      }
    );

    res.json({
      success: true,
      results: response.data.results || [],
      answer: response.data.answer,
    });
  } catch (error) {
    logger.error('ProxyTavily', 'Error en Tavily Search', {
      message: error.message,
      status: error.response?.status,
    });

    res.status(500).json({
      error: 'Error en el servicio de búsqueda',
      results: [],
    });
  }
});

/**
 * Información de disponibilidad de servicios
 * GET /api/proxy/status
 */
router.get('/status', (req, res) => {
  const services = {
    translate: !!process.env.GOOGLE_TRANSLATE_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    tavily: !!process.env.TAVILY_API_KEY,
    googlePlaces: !!process.env.GOOGLE_PLACES_API_KEY,
  };

  res.json({
    available: services,
    count: Object.values(services).filter(Boolean).length,
    total: Object.keys(services).length,
  });
});

export default router;
