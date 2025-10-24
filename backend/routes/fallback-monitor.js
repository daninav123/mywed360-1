// backend/routes/fallback-monitor.js
// Endpoints para monitoreo de fallbacks

import express from 'express';
import { z } from 'zod';

import { fallbackMonitor } from '../services/FallbackMonitor.js';
import logger from '../logger.js';

const router = express.Router();

// Schema de validación para log de fallback
const LogFallbackSchema = z.object({
  service: z.string().min(1, 'Service name is required'),
  error: z.string().optional(),
  errorMessage: z.string().optional(),
  endpoint: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/fallback-monitor/log
 * Registra activación de fallback desde frontend
 * Requiere autenticación
 */
router.post('/log', async (req, res) => {
  try {
    // Validar payload
    const validation = LogFallbackSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid payload',
        details: validation.error.errors,
      });
    }

    const { service, error, errorMessage, endpoint, metadata } = validation.data;

    // Extraer información del usuario y request
    const userId = req.user?.uid || req.user?.id || 'anonymous';
    const userAgent = req.headers['user-agent'] || '';

    // Registrar fallback
    const result = await fallbackMonitor.logFallback(service, {
      userId,
      error,
      errorMessage,
      endpoint,
      userAgent,
      metadata,
    });

    logger.info(`[fallback-monitor] Fallback registered from client`, {
      service,
      userId,
      count: result.count,
    });

    res.json({
      success: true,
      count: result.count,
      message: 'Fallback logged successfully',
    });
  } catch (error) {
    logger.error('[fallback-monitor] Failed to log fallback', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Failed to log fallback',
      details: error.message,
    });
  }
});

/**
 * GET /api/fallback-monitor/stats
 * Obtiene estadísticas de fallbacks (solo admins)
 * Query params:
 *   - hours: ventana de tiempo en horas (default: 24)
 */
router.get('/stats', async (req, res) => {
  try {
    // TODO: Verificar que usuario es admin
    // const isAdmin = req.user?.role === 'admin';
    // if (!isAdmin) {
    //   return res.status(403).json({ error: 'Forbidden: Admin access required' });
    // }

    const hours = parseInt(req.query.hours) || 24;

    // Validar rango
    if (hours < 1 || hours > 720) {
      // máx 30 días
      return res.status(400).json({
        error: 'Invalid hours parameter',
        details: 'Hours must be between 1 and 720',
      });
    }

    const stats = await fallbackMonitor.getStats(hours);

    res.json({
      success: true,
      hours,
      stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[fallback-monitor] Failed to get stats', {
      error: error.message,
    });
    res.status(500).json({
      error: 'Failed to get stats',
      details: error.message,
    });
  }
});

/**
 * POST /api/fallback-monitor/resolve/:alertId
 * Resuelve una alerta de fallback (solo admins)
 */
router.post('/resolve/:alertId', async (req, res) => {
  try {
    // TODO: Verificar que usuario es admin

    const { alertId } = req.params;
    const { notes } = req.body;

    if (!alertId) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    const result = await fallbackMonitor.resolveAlert(alertId, notes);

    if (!result.success) {
      return res.status(404).json({
        error: result.error || 'Alert not found',
      });
    }

    res.json({
      success: true,
      message: 'Alert resolved successfully',
    });
  } catch (error) {
    logger.error('[fallback-monitor] Failed to resolve alert', {
      error: error.message,
    });
    res.status(500).json({
      error: 'Failed to resolve alert',
      details: error.message,
    });
  }
});

/**
 * GET /api/fallback-monitor/health
 * Health check para el servicio de monitoreo
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'fallback-monitor',
    timestamp: new Date().toISOString(),
  });
});

export default router;
