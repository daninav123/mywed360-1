// routes/suppliers-analyze-web.js
// 🌐 Endpoint para analizar websites de proveedores

import express from 'express';
import { 
  analyzeSupplierWebsite, 
  cacheWebAnalysis, 
  getCachedWebAnalysis 
} from '../services/webScraperService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/suppliers/analyze-website
 * Analiza el website de un proveedor para detectar servicios
 */
router.post('/analyze-website', async (req, res) => {
  try {
    const { url, supplierName, forceRefresh = false } = req.body;

    if (!url) {
      return res.status(400).json({ 
        success: false,
        error: 'URL es requerida' 
      });
    }

    // Validar formato URL
    let validUrl;
    try {
      validUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ 
        success: false,
        error: 'URL inválida' 
      });
    }

    logger.info(`[AnalyzeWeb] Solicitud para: ${url}`);

    const openAIAvailable = !!(process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY);

    // 1. Verificar caché primero (salvo forceRefresh)
    if (!forceRefresh) {
      const cached = await getCachedWebAnalysis(url);
      if (cached) {
        const cachedAiUsed = !!cached?.data?.aiUsed;
        if (cachedAiUsed || !openAIAvailable) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          return res.json({
            success: true,
            cached: true,
            ...cached
          });
        }

        logger.info(`[AnalyzeWeb] Caché generado sin IA; refrescando análisis: ${url}`);
      }
    }

    // 2. Analizar website
    const analysis = await analyzeSupplierWebsite(url, supplierName || '');

    if (!analysis.success) {
      return res.status(500).json({
        success: false,
        error: analysis.error || 'Error analizando website',
        errorType: analysis.errorType
      });
    }

    // 3. Guardar en caché (30 días)
    await cacheWebAnalysis(url, analysis, 30);

    // 4. Retornar análisis
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.json({
      success: true,
      cached: false,
      ...analysis
    });

  } catch (error) {
    logger.error('[AnalyzeWeb] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/suppliers/analyze-website/:encodedUrl
 * Obtiene análisis cacheado de un website
 */
router.get('/analyze-website/:encodedUrl', async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.encodedUrl);

    logger.info(`[AnalyzeWeb] Consultando caché para: ${url}`);

    const cached = await getCachedWebAnalysis(url);

    if (!cached) {
      return res.status(404).json({
        success: false,
        error: 'No hay análisis cacheado para esta URL'
      });
    }

    return res.json({
      success: true,
      cached: true,
      ...cached
    });

  } catch (error) {
    logger.error('[AnalyzeWeb] Error consultando caché:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
});

export default router;
