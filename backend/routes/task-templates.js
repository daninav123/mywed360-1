import express from 'express';
import { db } from '../db.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Caché en memoria de la plantilla activa
let activeTemplateCache = {
  template: null,
  timestamp: 0,
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * GET /api/task-templates/active
 * Endpoint público (sin autenticación) para obtener la plantilla activa
 */
router.get('/active', async (req, res) => {
  try {
    // Verificar caché
    const now = Date.now();
    if (activeTemplateCache.template && now - activeTemplateCache.timestamp < CACHE_TTL_MS) {
      logger.info('[task-templates] Retornando plantilla desde caché');
      return res.json({
        template: activeTemplateCache.template,
        cached: true,
      });
    }

    // Buscar plantilla publicada en Firestore
    const snapshot = await db
      .collection('adminTaskTemplates')
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      logger.warn('[task-templates] No hay plantilla publicada');
      return res.status(404).json({
        error: 'no_published_template',
        message: 'No hay plantilla de tareas publicada actualmente',
      });
    }

    const doc = snapshot.docs[0];
    const templateData = doc.data();

    // Preparar respuesta
    const template = {
      id: doc.id,
      version: templateData.version || '',
      blocks: Array.isArray(templateData.blocks) ? templateData.blocks : [],
      totals: templateData.totals || {
        blocks: 0,
        subtasks: 0,
      },
      publishedAt: templateData.publishedAt
        ? templateData.publishedAt.toDate?.()?.toISOString() || templateData.publishedAt
        : null,
      name: templateData.name || '',
    };

    // Actualizar caché
    activeTemplateCache = {
      template,
      timestamp: now,
    };

    logger.info('[task-templates] Plantilla activa obtenida:', {
      id: template.id,
      version: template.version,
      blocks: template.totals.blocks,
      subtasks: template.totals.subtasks,
    });

    return res.json({
      template,
      cached: false,
    });
  } catch (error) {
    logger.error('[task-templates] Error obteniendo plantilla activa:', error);
    return res.status(500).json({
      error: 'template_fetch_failed',
      message: 'Error al obtener plantilla de tareas',
    });
  }
});

/**
 * POST /api/task-templates/invalidate-cache
 * Invalida la caché de plantilla activa (para uso interno)
 */
router.post('/invalidate-cache', (req, res) => {
  activeTemplateCache = {
    template: null,
    timestamp: 0,
  };
  logger.info('[task-templates] Caché invalidada manualmente');
  return res.json({ success: true, message: 'Caché invalidada' });
});

export default router;
