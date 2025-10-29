import express from 'express';
import { db, FieldValue } from '../config/firebase.js';
import logger from '../logger.js';
import { sendEmail } from '../services/mailgunService.js';

const router = express.Router();

/**
 * POST /api/suppliers/:supplierId/request-quote
 * Crear solicitud de presupuesto desde el cliente
 */
router.post('/:supplierId/request-quote', express.json(), async (req, res) => {
  try {
    const { supplierId } = req.params;
    const {
      // Datos de la pareja
      coupleName,
      weddingDate,
      location,
      guestCount,
      budget,

      // Servicios y mensaje
      services,
      message,

      // Contacto
      contactEmail,
      contactPhone,
      preferredContactMethod,
      urgency,

      // Metadata
      userId,
      weddingId,
    } = req.body;

    // Validaciones
    if (!coupleName || !contactEmail || !message) {
      return res.status(400).json({
        error: 'missing_required_fields',
        required: ['coupleName', 'contactEmail', 'message'],
      });
    }

    // Verificar que el proveedor existe
    const supplierDoc = await db.collection('suppliers').doc(supplierId).get();
    if (!supplierDoc.exists) {
      return res.status(404).json({ error: 'supplier_not_found' });
    }

    const supplierData = supplierDoc.data();
    const supplierEmail = supplierData.email || supplierData.contact?.email;
    const supplierName = supplierData.name || supplierData.businessName || 'Proveedor';

    // Crear ID único para la solicitud
    const requestId = db.collection('suppliers').doc(supplierId).collection('requests').doc().id;

    // Datos de la solicitud
    const requestData = {
      id: requestId,

      // Info de la pareja
      coupleName,
      weddingDate: weddingDate || null,
      location: location || null,
      guestCount: guestCount ? Number(guestCount) : null,
      budget: budget ? Number(budget) : null,

      // Servicios y mensaje
      services: Array.isArray(services) ? services : [],
      message,

      // Contacto
      contactEmail,
      contactPhone: contactPhone || null,
      preferredContactMethod: preferredContactMethod || 'email',
      urgency: urgency || 'normal',

      // Metadata
      userId: userId || null,
      weddingId: weddingId || null,

      // Estado
      status: 'new', // new | viewed | responded | archived
      receivedAt: FieldValue.serverTimestamp(),
      viewedAt: null,
      respondedAt: null,

      // Respuesta (se llenará cuando el proveedor responda)
      response: null,
    };

    // Guardar en Firestore
    await db
      .collection('suppliers')
      .doc(supplierId)
      .collection('requests')
      .doc(requestId)
      .set(requestData);

    logger.info(`Nueva solicitud ${requestId} creada para proveedor ${supplierId}`);

    // Enviar email al proveedor si tiene email
    if (supplierEmail) {
      try {
        const emailHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 30px; 
                text-align: center; 
                border-radius: 10px 10px 0 0; 
              }
              .content { background: #f9f9f9; padding: 30px; }
              .info-box { 
                background: white; 
                border-left: 4px solid #667eea; 
                padding: 15px; 
                margin: 15px 0; 
                border-radius: 4px;
              }
              .button { 
                display: inline-block; 
                background: #667eea; 
                color: white !important; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              h3 { margin: 0 0 10px 0; color: #667eea; }
              ul { margin: 5px 0; padding-left: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📧 Nueva Solicitud de Presupuesto</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${supplierName}</strong>,</p>
                <p>Has recibido una nueva solicitud de presupuesto a través de MyWed360:</p>
                
                <div class="info-box">
                  <h3>👰🤵 Detalles de la Boda</h3>
                  <p><strong>Pareja:</strong> ${coupleName}</p>
                  ${weddingDate ? `<p><strong>Fecha:</strong> ${weddingDate}</p>` : ''}
                  ${location ? `<p><strong>Ubicación:</strong> ${location}</p>` : ''}
                  ${guestCount ? `<p><strong>Invitados:</strong> ${guestCount}</p>` : ''}
                  ${budget ? `<p><strong>Presupuesto estimado:</strong> ${budget}€</p>` : ''}
                </div>
                
                ${
                  services && services.length > 0
                    ? `
                <div class="info-box">
                  <h3>🎯 Servicios Solicitados</h3>
                  <ul>
                    ${services.map((s) => `<li>${s}</li>`).join('')}
                  </ul>
                </div>
                `
                    : ''
                }
                
                <div class="info-box">
                  <h3>💬 Mensaje del Cliente</h3>
                  <p>${message.replace(/\n/g, '<br>')}</p>
                </div>
                
                <div class="info-box">
                  <h3>📞 Información de Contacto</h3>
                  <p><strong>Email:</strong> ${contactEmail}</p>
                  ${contactPhone ? `<p><strong>Teléfono:</strong> ${contactPhone}</p>` : ''}
                  <p><strong>Método preferido:</strong> ${preferredContactMethod === 'whatsapp' ? 'WhatsApp' : preferredContactMethod === 'phone' ? 'Teléfono' : 'Email'}</p>
                  ${urgency === 'urgent' ? '<p style="color: #e53e3e; font-weight: bold;">⚠️ SOLICITUD URGENTE - Boda en menos de 1 mes</p>' : ''}
                </div>
                
                <center>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/supplier/dashboard/requests/${requestId}" class="button">
                    Ver Solicitud y Responder
                  </a>
                </center>
                
                <p style="margin-top: 30px; font-size: 14px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
                  💡 <strong>Tip:</strong> Responde rápido para aumentar tus posibilidades de ser contratado. 
                  Los clientes valoran la prontitud en la respuesta.
                </p>
              </div>
              <div class="footer">
                <p>Este email fue enviado por MyWed360</p>
                <p>Si no eres ${supplierName}, ignora este mensaje.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: supplierEmail,
          subject: `📧 Nueva Solicitud de Presupuesto - ${coupleName}`,
          html: emailHTML,
        });

        logger.info(`Email enviado a ${supplierEmail} para solicitud ${requestId}`);
      } catch (emailError) {
        logger.error('Error enviando email al proveedor:', emailError);
        // No fallar la request por error de email
      }
    }

    // Email de confirmación al cliente
    try {
      const clientEmailHTML = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #667eea; margin-top: 0;">✅ ¡Solicitud Enviada!</h2>
            <p>Hola <strong>${coupleName}</strong>,</p>
            <p>Tu solicitud de presupuesto a <strong>${supplierName}</strong> ha sido enviada correctamente.</p>
            
            <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p><strong>Resumen de tu solicitud:</strong></p>
              <ul>
                ${services && services.length > 0 ? `<li>Servicios: ${services.join(', ')}</li>` : ''}
                ${weddingDate ? `<li>Fecha: ${weddingDate}</li>` : ''}
                ${location ? `<li>Ubicación: ${location}</li>` : ''}
                ${guestCount ? `<li>Invitados: ${guestCount}</li>` : ''}
              </ul>
            </div>
            
            <p>El proveedor recibirá tu mensaje y se pondrá en contacto contigo pronto a través de <strong>${preferredContactMethod === 'whatsapp' ? 'WhatsApp' : preferredContactMethod === 'phone' ? 'teléfono' : 'email'}</strong>.</p>
            
            <p style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              💡 <strong>Próximo paso:</strong> El proveedor revisará tu solicitud y te enviará un presupuesto personalizado.
            </p>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Saludos,<br>
              El equipo de MyWed360
            </p>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: contactEmail,
        subject: `✅ Solicitud Enviada a ${supplierName}`,
        html: clientEmailHTML,
      });

      logger.info(`Email de confirmación enviado a ${contactEmail}`);
    } catch (emailError) {
      logger.error('Error enviando email de confirmación:', emailError);
      // No fallar la request por error de email
    }

    res.json({
      success: true,
      requestId,
      message: 'Solicitud enviada correctamente',
      supplier: {
        id: supplierId,
        name: supplierName,
      },
    });
  } catch (error) {
    logger.error('Error creating quote request:', error);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

export default router;
