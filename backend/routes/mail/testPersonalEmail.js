import express from 'express';
import { db } from '../../db.js';
import { requireMailAccess } from '../../middleware/authMiddleware.js';
import { createMailgunClients } from './clients.js';

const router = express.Router();

// POST /api/mail/test-personal-email
router.post('/test-personal-email', requireMailAccess, async (req, res) => {
  try {
    const { from, to, subject, message } = req.body;

    if (!from || !to || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios (from, to, subject, message)' });
    }

    const fromUser = String(from).split('@')[0];
    const emailDomain = String(from).split('@')[1];
    if (!emailDomain || emailDomain !== 'maloveapp.com') {
      return res.status(400).json({ success: false, message: 'El remitente debe ser una dirección de correo de maloveapp.com' });
    }

    try {
      const { mailgun, mailgunAlt } = createMailgunClients();
      const fromFormatted = `${fromUser.charAt(0).toUpperCase() + fromUser.slice(1)} <${from}>`;

      const attemptOptions = [
        { client: mailgun, data: { from, to, subject: `[Prueba 1] ${subject}`, text: message, html: `<div style=\"font-family: Arial, sans-serif; line-height: 1.6;\">${message.replace(/\\n/g, '<br>')}</div>` }, description: 'Dirección original con dominio base' },
        { client: mailgun, data: { from: fromFormatted, to, subject: `[Prueba 2] ${subject}`, text: message, html: `<div style=\"font-family: Arial, sans-serif; line-height: 1.6;\">${message.replace(/\\n/g, '<br>')}</div>` }, description: 'Formato con nombre con dominio base' },
        { client: mailgunAlt, data: { from, to, subject: `[Prueba 3] ${subject}`, text: message, html: `<div style=\"font-family: Arial, sans-serif; line-height: 1.6;\">${message.replace(/\\n/g, '<br>')}</div>` }, description: 'Dirección original con dominio de envío' },
        { client: mailgunAlt, data: { from: fromFormatted, to, subject: `[Prueba 4] ${subject}`, text: message, html: `<div style=\"font-family: Arial, sans-serif; line-height: 1.6;\">${message.replace(/\\n/g, '<br>')}</div>` }, description: 'Formato con nombre con dominio de envío' },
      ].filter((a) => a.client);

      let result = null;
      let successMethod = null;
      const errorMessages = [];

      for (let i = 0; i < attemptOptions.length; i++) {
        const attempt = attemptOptions[i];
        try {
          result = await attempt.client.messages().send(attempt.data);
          successMethod = attempt.description;
          break;
        } catch (attemptError) {
          errorMessages.push({ method: attempt.description, error: attemptError.message, status: attemptError.statusCode || 'desconocido' });
        }
      }

      if (!result) {
        try {
          await db.collection('mail_config').doc('error_logs').set(
            { lastErrors: errorMessages, timestamp: new Date(), from, to },
            { merge: true }
          );
        } catch {}

        const forbiddenErrors = errorMessages.filter((e) => e.error.includes('Forbidden') || e.status === 403);
        const authErrors = errorMessages.filter((e) => e.status === 401 || e.error.includes('Unauthorized'));
        throw {
          message: 'Todos los métodos de envío fallaron',
          details: errorMessages,
          diagnostic: { forbiddenIssues: forbiddenErrors.length > 0, authIssues: authErrors.length > 0 },
        };
      }

      const newEmail = {
        from,
        to,
        subject,
        body: message,
        date: new Date(),
        status: 'sent',
        folder: 'sent',
        isRead: true,
        personalEmail: true,
        sendMethod: successMethod,
      };
      await db.collection('mails').add(newEmail);

      await db.collection('mail_config').doc('successful_config').set(
        { method: successMethod, timestamp: new Date() },
        { merge: true }
      );

      return res.status(200).json({ success: true, message: `Email de prueba enviado correctamente usando el método: ${successMethod}`, data: { mailgunResponse: result, successMethod } });
    } catch (mailgunError) {
      let errorMessage = 'Error al enviar el correo con Mailgun';
      let statusCode = 500;
      let diagnosticInfo = {};

      if (mailgunError.details && Array.isArray(mailgunError.details)) {
        diagnosticInfo.attemptsMade = mailgunError.details.length;
        diagnosticInfo.errorTypes = [];
        const hasAuthErrors = mailgunError.details.some((e) => e.status === 401 || e.error.includes('Unauthorized'));
        const hasForbiddenErrors = mailgunError.details.some((e) => e.status === 403 || e.error.includes('Forbidden'));
        const hasNotFoundErrors = mailgunError.details.some((e) => e.status === 404);
        if (hasAuthErrors) {
          diagnosticInfo.errorTypes.push('autenticación');
          errorMessage = 'Error de autenticación con Mailgun. Verifica la API key.';
        }
        if (hasForbiddenErrors) {
          diagnosticInfo.errorTypes.push('autorización');
          errorMessage = 'Error de permisos (Forbidden) con Mailgun. El dominio podría no estar verificado o el remitente no está autorizado.';
        }
        if (hasNotFoundErrors) {
          diagnosticInfo.errorTypes.push('dominio_no_encontrado');
          errorMessage = 'Error: dominio no encontrado en Mailgun.';
        }
        if (diagnosticInfo.errorTypes.length > 1) {
          errorMessage = `Se detectaron múltiples problemas: ${diagnosticInfo.errorTypes.join(', ')}. Revisa la configuración de Mailgun.`;
        }
      } else {
        if (mailgunError.statusCode === 401) {
          errorMessage = 'Error de autenticación con Mailgun. Verifica la API key.';
          diagnosticInfo.type = 'autenticación';
        } else if (mailgunError.statusCode === 403) {
          errorMessage = 'Error de permisos (Forbidden). El dominio podría no estar verificado o el remitente no está autorizado.';
          diagnosticInfo.type = 'autorización';
        } else if (mailgunError.statusCode === 404) {
          errorMessage = 'Dominio no encontrado en Mailgun. Verifica la configuración del dominio.';
          diagnosticInfo.type = 'dominio_no_encontrado';
        }
      }

      try {
        await db.collection('mail_config').doc('error_diagnostics').set(
          { lastError: { message: errorMessage, timestamp: new Date(), details: mailgunError.details || mailgunError.message, diagnostic: diagnosticInfo } },
          { merge: true }
        );
      } catch {}

      return res.status(statusCode).json({ success: false, message: errorMessage, error: mailgunError.message || 'Error desconocido', statusCode: mailgunError.statusCode || 'desconocido', diagnostic: diagnosticInfo });
    }
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return res.status(500).json({ success: false, message: 'Error al procesar la solicitud', error: error.message });
  }
});

export default router;

