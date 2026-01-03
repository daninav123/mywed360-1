/**
 * Endpoint para reenviar email de solicitud de presupuesto
 */

import express from 'express';
import { db } from '../db.js';
import logger from '../utils/logger.js';
import { sendQuoteRequestEmail } from '../services/quoteRequestEmailService.js';

const router = express.Router();

/**
 * POST /api/resend-quote-email/:requestId
 * Reenvía el email de una solicitud de presupuesto
 */
router.post('/resend-quote-email/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { email } = req.body; // Email opcional para override
    
    logger.info(`📤 [ResendQuote] Reenviando solicitud: ${requestId}`);
    
    // Buscar solicitud en quote-requests-internet
    const doc = await db.collection('quote-requests-internet').doc(requestId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      });
    }
    
    const request = doc.data();
    const supplierEmail = email || request.supplierEmail;
    
    if (!supplierEmail) {
      return res.status(400).json({
        success: false,
        error: 'No hay email configurado para este proveedor'
      });
    }
    
    // Si se proporciona un email nuevo, actualizar en Firestore
    if (email && email !== request.supplierEmail) {
      await db.collection('quote-requests-internet').doc(requestId).update({
        supplierEmail: email,
        'supplierInfo.email': email
      });
      logger.info(`✅ [ResendQuote] Email actualizado a: ${email}`);
    }
    
    // Enviar email
    logger.info(`📧 [ResendQuote] Enviando a: ${supplierEmail}`);
    
    await sendQuoteRequestEmail({
      supplierEmail: supplierEmail,
      supplierName: request.supplierName,
      clientName: request.contacto?.nombre,
      clientEmail: request.contacto?.email,
      clientPhone: request.contacto?.telefono,
      weddingDate: request.weddingInfo?.fecha,
      city: request.weddingInfo?.ciudad,
      guestCount: request.weddingInfo?.numeroInvitados,
      totalBudget: request.weddingInfo?.presupuestoTotal,
      categoryName: request.supplierCategoryName || 'Servicio',
      serviceDetails: request.serviceDetails || {},
      customMessage: request.customMessage || '',
      responseUrl: request.responseUrl,
      requestId: requestId
    });
    
    logger.info(`✅ [ResendQuote] Email enviado correctamente a ${supplierEmail}`);
    
    res.json({
      success: true,
      message: 'Email reenviado correctamente',
      email: supplierEmail
    });
    
  } catch (error) {
    logger.error('[ResendQuote] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
