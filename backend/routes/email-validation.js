/**
 * Rutas para validación de configuración de email (SPF, DKIM, DMARC)
 */

import express from 'express';
import { sendSuccess, sendError, sendValidationError } from '../utils/apiResponse.js';
import { 
  validateEmailConfiguration, 
  sendTestEmail,
  validateSPF,
  validateDKIM,
  validateDMARC
} from '../services/emailValidationService.js';
import { z } from 'zod';
import logger from '../logger.js';

const router = express.Router();

// Validación de schema para dominio
const validateDomainSchema = z.object({
  domain: z.string().min(3).max(255).regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'Formato de dominio inválido'),
  dkimSelector: z.string().min(1).max(50).optional().default('k1')
});

/**
 * POST /api/email/validate-configuration
 * Valida la configuración completa de SPF, DKIM y DMARC
 */
router.post('/validate-configuration', async (req, res) => {
  try {
    // Validar input
    const parsed = validateDomainSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(req, res, parsed.error.errors);
    }

    const { domain, dkimSelector } = parsed.data;

    // Realizar validación
    const result = await validateEmailConfiguration(domain, dkimSelector);

    return sendSuccess(req, res, result);
  } catch (error) {
    logger.error('Error in validate-configuration:', error);
    return sendError(req, res, 'validation_failed', 'Error al validar configuración', 500);
  }
});

/**
 * POST /api/email/validate-spf
 * Valida solo SPF
 */
router.post('/validate-spf', async (req, res) => {
  try {
    const parsed = z.object({ domain: z.string().min(3) }).safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(req, res, parsed.error.errors);
    }

    const result = await validateSPF(parsed.data.domain);
    return sendSuccess(req, res, result);
  } catch (error) {
    logger.error('Error in validate-spf:', error);
    return sendError(req, res, 'spf_validation_failed', 'Error al validar SPF', 500);
  }
});

/**
 * POST /api/email/validate-dkim
 * Valida solo DKIM
 */
router.post('/validate-dkim', async (req, res) => {
  try {
    const parsed = z.object({
      domain: z.string().min(3),
      selector: z.string().optional().default('k1')
    }).safeParse(req.body);
    
    if (!parsed.success) {
      return sendValidationError(req, res, parsed.error.errors);
    }

    const { domain, selector } = parsed.data;
    const result = await validateDKIM(domain, selector);
    return sendSuccess(req, res, result);
  } catch (error) {
    logger.error('Error in validate-dkim:', error);
    return sendError(req, res, 'dkim_validation_failed', 'Error al validar DKIM', 500);
  }
});

/**
 * POST /api/email/validate-dmarc
 * Valida solo DMARC
 */
router.post('/validate-dmarc', async (req, res) => {
  try {
    const parsed = z.object({ domain: z.string().min(3) }).safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(req, res, parsed.error.errors);
    }

    const result = await validateDMARC(parsed.data.domain);
    return sendSuccess(req, res, result);
  } catch (error) {
    logger.error('Error in validate-dmarc:', error);
    return sendError(req, res, 'dmarc_validation_failed', 'Error al validar DMARC', 500);
  }
});

/**
 * POST /api/email/send-test
 * Envía un email de prueba
 */
router.post('/send-test', async (req, res) => {
  try {
    const schema = z.object({
      from: z.string().email(),
      to: z.string().email()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(req, res, parsed.error.errors);
    }

    const { from, to } = parsed.data;

    // Obtener cliente de Mailgun del contexto (debe estar configurado en index.js)
    const mailgunClient = req.app.get('mailgunClient');
    
    if (!mailgunClient) {
      return sendError(
        req,
        res,
        'mailgun_not_configured',
        'El servicio de email no está configurado',
        503
      );
    }

    const result = await sendTestEmail(from, to, mailgunClient);

    if (!result.success) {
      return sendError(req, res, 'test_email_failed', result.error, 500);
    }

    return sendSuccess(req, res, {
      sent: true,
      messageId: result.messageId,
      message: 'Email de prueba enviado correctamente'
    });
  } catch (error) {
    logger.error('Error in send-test:', error);
    return sendError(req, res, 'send_test_failed', 'Error al enviar email de prueba', 500);
  }
});

export default router;
