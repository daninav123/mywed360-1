import express from 'express';
import admin from 'firebase-admin';
import { z } from 'zod';
import validate from '../middleware/validate.js';
import logger from '../utils/logger.js';
import { personalizeTaskTemplate } from '../services/taskPersonalizationAI.js';
import { db } from '../db.js';

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

    let template = null;

    try {
      // Buscar plantilla publicada en Firestore
      const snapshot = await db
        .collection('adminTaskTemplates')
        .where('status', '==', 'published')
        .orderBy('publishedAt', 'desc')
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const templateData = doc.data();

        // Preparar respuesta
        template = {
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

        logger.info('[task-templates] Plantilla activa obtenida desde Firestore');
      }
    } catch (firestoreError) {
      logger.warn('[task-templates] Error accediendo a Firestore, usando plantilla fallback', {
        error: firestoreError.message,
      });
    }

    // Si no se pudo cargar de Firestore, usar fallback
    if (!template) {
      logger.info('[task-templates] Usando plantilla fallback local');
      template = FALLBACK_TEMPLATE;
    }

    // Actualizar caché
    activeTemplateCache = {
      template,
      timestamp: now,
    };

    logger.info('[task-templates] Plantilla activa retornada:', {
      id: template.id,
      version: template.version,
      blocks: template.totals?.blocks || template.blocks?.length || 0,
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

/**
 * POST /api/task-templates/personalize
 * Personaliza la plantilla maestra según el contexto de la boda usando IA
 * 
 * Body: {
 *   weddingContext: {
 *     ceremonyType: 'civil' | 'religiosa' | 'simbolica' | 'destino',
 *     budget: 'low' | 'medium' | 'high' | 'luxury',
 *     leadTimeMonths: number,
 *     guestCount: number,
 *     style: string,
 *     location: 'local' | 'destino',
 *     hasPlanner: boolean
 *   }
 * }
 */
const personalizeSchema = z.object({
  weddingContext: z.object({
    ceremonyType: z.enum(['civil', 'religiosa', 'simbolica', 'destino']).default('civil'),
    budget: z.enum(['low', 'medium', 'high', 'luxury']).default('medium'),
    leadTimeMonths: z.number().int().min(1).max(36).default(12),
    guestCount: z.number().int().min(10).max(1000).default(100),
    style: z.string().max(100).default('classic'),
    location: z.enum(['local', 'destino']).default('local'),
    hasPlanner: z.boolean().default(false),
  }),
});

// Plantilla fallback local para desarrollo/testing
const FALLBACK_TEMPLATE = {
  id: 'fallback-template',
  version: '1.0.0',
  name: 'Plantilla Base de Boda',
  blocks: [
    {
      id: 'venue-selection',
      title: 'Selección de Lugar',
      description: 'Búsqueda y reserva del espacio',
      priority: 'high',
      daysBeforeWedding: 365,
      estimatedHours: 20,
      items: [
        { id: 'research-venues', title: 'Investigar posibles lugares', completed: false, priority: 'high' },
        { id: 'visit-venues', title: 'Visitar lugares preseleccionados', completed: false, priority: 'high' },
        { id: 'book-venue', title: 'Reservar el lugar elegido', completed: false, priority: 'high' },
      ],
    },
    {
      id: 'catering-planning',
      title: 'Catering y Menú',
      priority: 'high',
      daysBeforeWedding: 180,
      estimatedHours: 15,
      items: [
        { id: 'research-caterers', title: 'Investigar servicios de catering', completed: false, priority: 'medium' },
        { id: 'tasting-session', title: 'Asistir a degustaciones', completed: false, priority: 'high' },
        { id: 'finalize-menu', title: 'Finalizar menú', completed: false, priority: 'high' },
      ],
    },
  ],
  totals: { blocks: 2, subtasks: 6 },
};

router.post('/personalize', validate(personalizeSchema), async (req, res) => {
  try {
    const { weddingContext } = req.body;

    logger.info('[task-templates] Personalizando plantilla con IA', {
      ceremonyType: weddingContext.ceremonyType,
      leadTimeMonths: weddingContext.leadTimeMonths,
      guestCount: weddingContext.guestCount,
    });

    // 1. Obtener plantilla maestra activa
    const now = Date.now();
    let masterTemplate = null;

    // Intentar desde caché primero
    if (activeTemplateCache.template && now - activeTemplateCache.timestamp < CACHE_TTL_MS) {
      masterTemplate = activeTemplateCache.template;
      logger.info('[task-templates] Usando plantilla desde caché para personalización');
    } else {
      try {
        // Intentar buscar en Firestore
        const snapshot = await db
          .collection('adminTaskTemplates')
          .where('status', '==', 'published')
          .orderBy('publishedAt', 'desc')
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const templateData = doc.data();

          masterTemplate = {
            id: doc.id,
            version: templateData.version || '',
            blocks: Array.isArray(templateData.blocks) ? templateData.blocks : [],
            totals: templateData.totals || { blocks: 0, subtasks: 0 },
            publishedAt: templateData.publishedAt
              ? templateData.publishedAt.toDate?.()?.toISOString() || templateData.publishedAt
              : null,
            name: templateData.name || '',
          };

          // Actualizar caché
          activeTemplateCache = {
            template: masterTemplate,
            timestamp: now,
          };
          
          logger.info('[task-templates] Plantilla cargada desde Firestore');
        }
      } catch (firestoreError) {
        logger.warn('[task-templates] Error accediendo a Firestore, usando plantilla fallback', {
          error: firestoreError.message,
        });
      }

      // Si no se pudo cargar de Firestore, usar fallback
      if (!masterTemplate) {
        logger.info('[task-templates] Usando plantilla fallback local');
        masterTemplate = FALLBACK_TEMPLATE;
      }
    }

    // 2. Personalizar con IA
    const result = await personalizeTaskTemplate(masterTemplate, weddingContext);

    if (!result.success) {
      logger.warn('[task-templates] Personalización IA falló, devolviendo plantilla sin cambios', {
        error: result.error,
      });

      return res.json({
        template: masterTemplate,
        personalized: false,
        usedAI: false,
        error: result.error,
        message: 'Se devuelve la plantilla sin personalizar debido a un error en IA',
      });
    }

    logger.info('[task-templates] Plantilla personalizada exitosamente', {
      originalBlocks: masterTemplate.blocks.length,
      personalizedBlocks: result.template.blocks.length,
      usedAI: result.usedAI,
    });

    return res.json({
      template: result.template,
      personalized: true,
      usedAI: result.usedAI,
      analysis: result.analysis,
      aiUsage: result.aiUsage,
      message: 'Plantilla personalizada según contexto de la boda',
    });
  } catch (error) {
    logger.error('[task-templates] Error en personalización:', error);
    return res.status(500).json({
      error: 'personalization_failed',
      message: 'Error al personalizar plantilla de tareas',
    });
  }
});

export default router;
