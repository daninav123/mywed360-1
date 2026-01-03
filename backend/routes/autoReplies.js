/**
 * Auto-Replies Routes
 * Endpoints para gestionar auto-respuestas de email
 * Sprint 3 - Unificar Email
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { autoReplyService, AUTO_REPLY_TYPES } = require('../services/autoReplyService');
const { sendSuccess, sendError, sendValidationError, sendNotFoundError, sendInternalError } = require('../utils/apiResponse');
const { z } = require('zod');

// Schemas de validación
const configSchema = z.object({
  enabled: z.boolean().optional(),
  subject: z.string().min(1).max(200).optional(),
  template: z.string().min(1).max(10000).optional()
});

const sendAutoReplySchema = z.object({
  replyType: z.enum(['rsvp_confirmation', 'thank_you', 'reminder', 'info_update', 'dietary_confirmation']),
  recipientEmail: z.string().email(),
  variables: z.record(z.any())
});

const scheduleAutoReplySchema = z.object({
  replyType: z.enum(['rsvp_confirmation', 'thank_you', 'reminder', 'info_update', 'dietary_confirmation']),
  recipientEmail: z.string().email(),
  variables: z.record(z.any()),
  sendAt: z.string().datetime()
});

/**
 * GET /api/auto-replies/types
 * Obtiene los tipos de auto-respuesta disponibles
 */
router.get('/types', requireAuth, async (req, res) => {
  try {
    const types = autoReplyService.getAvailableTypes();
    return sendSuccess(req, res, { types });
  } catch (error) {
    console.error('Error getting auto-reply types:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * GET /api/auto-replies/:weddingId/config/:replyType
 * Obtiene la configuración de un tipo de auto-respuesta
 */
router.get('/:weddingId/config/:replyType', requireAuth, async (req, res) => {
  try {
    const { weddingId, replyType } = req.params;

    // Validar que el usuario tiene acceso a esta boda
    // TODO: Implementar verificación de permisos

    const config = await autoReplyService.getAutoReplyConfig(weddingId, replyType);

    if (!config) {
      return sendNotFoundError(req, res, 'Configuración de auto-respuesta');
    }

    return sendSuccess(req, res, { config });
  } catch (error) {
    console.error('Error getting auto-reply config:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * PUT /api/auto-replies/:weddingId/config/:replyType
 * Actualiza la configuración de un tipo de auto-respuesta
 */
router.put('/:weddingId/config/:replyType', requireAuth, async (req, res) => {
  try {
    const { weddingId, replyType } = req.params;
    
    // Validar body
    const validation = configSchema.safeParse(req.body);
    if (!validation.success) {
      return sendValidationError(req, res, validation.error.errors);
    }

    const config = validation.data;

    // Validar plantilla si se proporciona
    if (config.template) {
      const templateValidation = autoReplyService.validateTemplate(config.template);
      if (!templateValidation.valid) {
        return sendValidationError(req, res, templateValidation.errors);
      }
    }

    // Guardar configuración
    const success = await autoReplyService.saveAutoReplyConfig(weddingId, replyType, config);

    if (!success) {
      return sendError(req, res, 'SAVE_FAILED', 'No se pudo guardar la configuración');
    }

    return sendSuccess(req, res, { updated: true, config });
  } catch (error) {
    console.error('Error saving auto-reply config:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * POST /api/auto-replies/:weddingId/send
 * Envía una auto-respuesta inmediatamente
 */
router.post('/:weddingId/send', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;

    // Validar body
    const validation = sendAutoReplySchema.safeParse(req.body);
    if (!validation.success) {
      return sendValidationError(req, res, validation.error.errors);
    }

    const { replyType, recipientEmail, variables } = validation.data;

    // Enviar auto-respuesta
    const result = await autoReplyService.sendAutoReply(
      weddingId,
      replyType,
      recipientEmail,
      variables
    );

    if (!result.sent) {
      return sendError(req, res, 'SEND_FAILED', result.reason || 'No se pudo enviar la auto-respuesta');
    }

    return sendSuccess(req, res, {
      sent: true,
      historyId: result.historyId,
      subject: result.subject
    });
  } catch (error) {
    console.error('Error sending auto-reply:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * POST /api/auto-replies/:weddingId/schedule
 * Programa el envío de una auto-respuesta
 */
router.post('/:weddingId/schedule', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;

    // Validar body
    const validation = scheduleAutoReplySchema.safeParse(req.body);
    if (!validation.success) {
      return sendValidationError(req, res, validation.error.errors);
    }

    const { replyType, recipientEmail, variables, sendAt } = validation.data;

    // Programar auto-respuesta
    const result = await autoReplyService.scheduleAutoReply(
      weddingId,
      replyType,
      recipientEmail,
      variables,
      new Date(sendAt)
    );

    if (!result.scheduled) {
      return sendError(req, res, 'SCHEDULE_FAILED', result.error || 'No se pudo programar la auto-respuesta');
    }

    return sendSuccess(req, res, {
      scheduled: true,
      scheduleId: result.scheduleId,
      sendAt
    });
  } catch (error) {
    console.error('Error scheduling auto-reply:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * POST /api/auto-replies/:weddingId/validate-template
 * Valida una plantilla de email
 */
router.post('/:weddingId/validate-template', requireAuth, async (req, res) => {
  try {
    const { template } = req.body;

    if (!template) {
      return sendValidationError(req, res, [{ message: 'Template is required' }]);
    }

    const validation = autoReplyService.validateTemplate(template);

    return sendSuccess(req, res, {
      valid: validation.valid,
      errors: validation.errors
    });
  } catch (error) {
    console.error('Error validating template:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * POST /api/auto-replies/:weddingId/preview
 * Previsualiza una auto-respuesta con variables
 */
router.post('/:weddingId/preview', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { replyType, variables } = req.body;

    if (!replyType) {
      return sendValidationError(req, res, [{ message: 'replyType is required' }]);
    }

    // Obtener configuración
    const config = await autoReplyService.getAutoReplyConfig(weddingId, replyType);

    if (!config) {
      return sendNotFoundError(req, res, 'Configuración de auto-respuesta');
    }

    // Procesar plantilla con variables de ejemplo
    const previewVariables = variables || {
      guest_name: 'Juan Pérez',
      rsvp_status: 'Confirmado',
      companions_count: 2,
      wedding_date: '15 de Junio de 2026',
      venue_name: 'Jardín Botánico',
      ceremony_time: '18:00',
      dietary_restrictions: 'Vegetariano',
      update_message: 'Cambio en el horario de la ceremonia'
    };

    const subject = autoReplyService.processTemplate(
      config.subject || config.defaultSubject,
      previewVariables
    );
    
    const body = autoReplyService.processTemplate(
      config.template || config.defaultTemplate,
      previewVariables
    );

    return sendSuccess(req, res, {
      subject,
      body,
      variables: previewVariables
    });
  } catch (error) {
    console.error('Error previewing auto-reply:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * GET /api/auto-replies/:weddingId/history
 * Obtiene el historial de auto-respuestas enviadas
 */
router.get('/:weddingId/history', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // TODO: Implementar paginación y consulta a Firestore
    // Por ahora retornar array vacío
    
    return sendSuccess(req, res, {
      history: [],
      total: 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting auto-reply history:', error);
    return sendInternalError(req, res, error);
  }
});

module.exports = router;
