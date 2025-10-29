import express from 'express';
import admin from '../firebaseAdmin.js';
import { sendEmailWithMailbox } from '../services/mailboxService.js';

const router = express.Router();

const db = admin.firestore();

/**
 * POST /api/quotes/request
 * Crear solicitud de presupuesto Y enviar email con bandeja
 */
router.post('/request', async (req, res) => {
  try {
    const {
      supplierId,
      supplierName,
      supplierEmail,
      supplierCategory,
      coupleName,
      weddingDate,
      location,
      guestCount,
      budget,
      services,
      message,
      contactEmail,
      contactPhone,
      preferredContactMethod,
      urgency,
      userId, // ID del usuario que envía
    } = req.body;

    // Validaciones
    if (!supplierId || !coupleName || !contactEmail || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. GUARDAR solicitud en Firebase
    const requestId = db.collection('quoteRequests').doc().id;
    const requestData = {
      id: requestId,
      supplierId,
      supplierName,
      supplierEmail,
      supplierCategory,
      userId,
      coupleName,
      weddingDate: weddingDate || null,
      location: location || null,
      guestCount: guestCount ? parseInt(guestCount) : null,
      budget: budget ? parseFloat(budget) : null,
      services: services || [],
      message,
      contactEmail,
      contactPhone: contactPhone || null,
      preferredContactMethod: preferredContactMethod || 'email',
      urgency: urgency || 'normal',
      status: 'pending',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      respondedAt: null,
      response: null,
    };

    await db.collection('quoteRequests').doc(requestId).set(requestData);

    // 2. ENVIAR EMAIL al proveedor con bandeja
    const supplierEmailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .info-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Nueva Solicitud de Presupuesto</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${supplierName}</strong>,</p>
            <p>Has recibido una nueva solicitud de presupuesto:</p>
            
            <div class="info-box">
              <h3>📋 Detalles de la Boda</h3>
              <p><strong>Pareja:</strong> ${coupleName}</p>
              ${weddingDate ? `<p><strong>Fecha:</strong> ${weddingDate}</p>` : ''}
              ${location ? `<p><strong>Ubicación:</strong> ${location}</p>` : ''}
              ${guestCount ? `<p><strong>Invitados:</strong> ${guestCount}</p>` : ''}
              ${budget ? `<p><strong>Presupuesto:</strong> ${budget}€</p>` : ''}
            </div>
            
            <div class="info-box">
              <h3>🎯 Servicios Solicitados</h3>
              <ul>
                ${services.map((s) => `<li>${s}</li>`).join('')}
              </ul>
            </div>
            
            <div class="info-box">
              <h3>💬 Mensaje</h3>
              <p>${message}</p>
            </div>
            
            <div class="info-box">
              <h3>📞 Contacto</h3>
              <p><strong>Email:</strong> ${contactEmail}</p>
              ${contactPhone ? `<p><strong>Teléfono:</strong> ${contactPhone}</p>` : ''}
              ${urgency === 'urgent' ? '<p style="color: red;"><strong>⚠️ URGENTE</strong></p>' : ''}
            </div>
            
            <center style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/supplier/quotes/${requestId}" class="button">
                Ver y Responder Solicitud
              </a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmailWithMailbox({
      fromEmail: contactEmail,
      fromName: coupleName,
      fromUserId: userId,

      toEmail: supplierEmail,
      toName: supplierName,
      toSupplierId: supplierId,

      subject: `📧 Nueva Solicitud de Presupuesto - ${coupleName}`,
      textMessage: message,
      htmlMessage: supplierEmailHTML,

      category: 'quote_request',
      relatedTo: {
        type: 'quote',
        id: requestId,
      },
    });

    // 3. EMAIL de confirmación al cliente
    const clientEmailHTML = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">✅ ¡Solicitud Enviada!</h2>
          <p>Hola <strong>${coupleName}</strong>,</p>
          <p>Tu solicitud de presupuesto a <strong>${supplierName}</strong> ha sido enviada correctamente.</p>
          <p><strong>Resumen:</strong></p>
          <ul>
            <li>Servicios: ${services.join(', ')}</li>
            ${weddingDate ? `<li>Fecha: ${weddingDate}</li>` : ''}
            ${location ? `<li>Ubicación: ${location}</li>` : ''}
          </ul>
          <p>El proveedor recibirá tu mensaje y se pondrá en contacto pronto.</p>
          <p>Puedes ver el estado en tu bandeja de mensajes.</p>
          <p>Saludos,<br>El equipo de MyWed360</p>
        </div>
      </body>
      </html>
    `;

    await sendEmailWithMailbox({
      fromEmail: process.env.SMTP_USER || 'noreply@mywed360.com',
      fromName: 'MyWed360',
      fromUserId: null,

      toEmail: contactEmail,
      toName: coupleName,
      toUserId: userId,

      subject: `✅ Solicitud Enviada a ${supplierName}`,
      textMessage: `Tu solicitud a ${supplierName} ha sido enviada.`,
      htmlMessage: clientEmailHTML,

      category: 'notification',
      relatedTo: {
        type: 'quote',
        id: requestId,
      },
    });

    res.json({
      success: true,
      requestId,
      message: 'Quote request sent and saved to mailbox',
    });
  } catch (error) {
    console.error('Error creating quote request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/quotes/my-requests
 * Obtener solicitudes del usuario
 */
router.get('/my-requests', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const snapshot = await db
      .collection('quoteRequests')
      .where('userId', '==', userId)
      .orderBy('requestedAt', 'desc')
      .get();

    const requests = [];
    snapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
