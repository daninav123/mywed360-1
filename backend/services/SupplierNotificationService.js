const nodemailer = require('nodemailer');
const { db } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');

/**
 * Servicio de notificaciones para proveedores
 * Gestiona envío de emails cuando hay nuevas solicitudes
 */
class SupplierNotificationService {
  constructor() {
    // Configurar transporte de email según proveedor
    const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';

    if (emailProvider === 'mailgun') {
      // Mailgun con nodemailer-mailgun-transport
      const mg = require('nodemailer-mailgun-transport');
      this.transporter = nodemailer.createTransport(
        mg({
          auth: {
            api_key: process.env.MAILGUN_API_KEY,
            domain: process.env.MAILGUN_DOMAIN || 'malove.app',
          },
        })
      );
    } else {
      // SMTP genérico
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    console.log(`[SupplierNotificationService] Inicializado con provider: ${emailProvider}`);
  }

  /**
   * Crea una solicitud y notifica al proveedor
   */
  async createAndNotifyRequest(requestData) {
    try {
      console.log('[SupplierNotificationService] Creando solicitud:', {
        supplierId: requestData.supplierId,
        client: requestData.client?.name,
      });

      // 1. Validar datos requeridos
      if (!requestData.supplierId) {
        throw new Error('supplierId es requerido');
      }
      if (!requestData.client?.email) {
        throw new Error('Email del cliente es requerido');
      }

      // 2. Guardar en Firestore
      const requestRef = await db.collection('supplier_requests').add({
        ...requestData,
        status: 'pending',
        emailSent: false,
        emailOpened: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const requestId = requestRef.id;
      console.log('[SupplierNotificationService] Solicitud guardada:', requestId);

      // 3. Obtener info del proveedor
      const supplierDoc = await db.collection('suppliers').doc(requestData.supplierId).get();

      if (!supplierDoc.exists) {
        throw new Error('Proveedor no encontrado');
      }

      const supplier = { id: supplierDoc.id, ...supplierDoc.data() };

      // 4. Enviar email
      console.log('[SupplierNotificationService] Enviando email a:', supplier.email);
      await this.sendNewRequestEmail({
        request: { id: requestId, ...requestData },
        supplier,
      });

      // 5. Actualizar status
      await requestRef.update({
        emailSent: true,
        emailSentAt: Timestamp.now(),
      });

      console.log('[SupplierNotificationService] Email enviado correctamente');

      return { id: requestId, ...requestData };
    } catch (error) {
      console.error('[SupplierNotificationService] Error:', error);
      throw error;
    }
  }

  /**
   * Envía email de nueva solicitud al proveedor
   */
  async sendNewRequestEmail({ request, supplier }) {
    const emailHtml = this.generateRequestEmailHtml(request, supplier);

    const mailOptions = {
      from: `"${request.client.name}" <${request.client.email}>`,
      to: supplier.email,
      replyTo: request.client.email,
      subject: `🎉 Nueva solicitud de ${request.client.name}`,
      html: emailHtml,
      text: this.generateRequestEmailText(request, supplier),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('[Email] Enviado exitosamente:', info.messageId);
      return info;
    } catch (error) {
      console.error('[Email] Error al enviar:', error);
      throw error;
    }
  }

  /**
   * Genera HTML del email con diseño responsive
   */
  generateRequestEmailHtml(request, supplier) {
    const appUrl = process.env.APP_URL || 'https://malove.app';
    const dashboardLink = `${appUrl}/supplier/dashboard/${supplier.id}/requests/${request.id}`;
    const replyLink = `mailto:${request.client.email}?subject=Re: Solicitud de presupuesto - ${supplier.name}`;

    // Formatear fecha
    const weddingDate = request.wedding?.date
      ? new Date(request.wedding.date).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Fecha por confirmar';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Solicitud</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🎉 Nueva Solicitud</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Una pareja está interesada en tus servicios</p>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 40px 20px;">
      
      <!-- Info de la pareja -->
      <div style="background: #f9fafb; border-left: 4px solid #6366f1; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
        <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 20px;">Información de la Pareja</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 40%;">Nombres:</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600;">${request.client.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${request.client.email}" style="color: #6366f1; text-decoration: none;">${request.client.email}</a></td>
          </tr>
          ${
            request.client.phone
              ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Teléfono:</td>
            <td style="padding: 8px 0; color: #111827;">${request.client.phone}</td>
          </tr>
          `
              : ''
          }
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Fecha boda:</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600;">${weddingDate}</td>
          </tr>
          ${
            request.wedding?.location
              ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Lugar:</td>
            <td style="padding: 8px 0; color: #111827;">${request.wedding.location}</td>
          </tr>
          `
              : ''
          }
          ${
            request.wedding?.guestCount
              ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Invitados:</td>
            <td style="padding: 8px 0; color: #111827;">${request.wedding.guestCount}</td>
          </tr>
          `
              : ''
          }
          ${
            request.wedding?.budget
              ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Presupuesto:</td>
            <td style="padding: 8px 0; color: #111827;">${request.wedding.budget} ${request.wedding.budgetCurrency || 'EUR'}</td>
          </tr>
          `
              : ''
          }
        </table>
      </div>
      
      <!-- Mensaje -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">Mensaje de la pareja:</h3>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <p style="margin: 0; color: #374151; line-height: 1.6; white-space: pre-wrap;">${request.message}</p>
        </div>
      </div>
      
      <!-- Botones de acción -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${replyLink}" 
           style="display: inline-block; background: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px;">
          📧 Responder por Email
        </a>
      </div>
      
      <!-- Dashboard link -->
      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
          También puedes gestionar esta solicitud en tu panel:
        </p>
        <a href="${dashboardLink}" 
           style="color: #6366f1; text-decoration: none; font-weight: 500;">
          Ver en Dashboard →
        </a>
      </div>
      
      <!-- Consejo -->
      <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          💡 <strong>Consejo:</strong> Las parejas valoran las respuestas rápidas. Intenta responder en menos de 24 horas para aumentar tus posibilidades.
        </p>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="background: #f3f4f6; padding: 30px 20px; text-align: center;">
      <div style="margin: 0 0 20px 0;">
        <a href="${appUrl}/supplier/settings" style="color: #6366f1; text-decoration: none; margin: 0 10px; font-size: 12px;">Configurar notificaciones</a>
        <span style="color: #d1d5db;">|</span>
        <a href="${appUrl}/supplier/dashboard/${supplier.id}" style="color: #6366f1; text-decoration: none; margin: 0 10px; font-size: 12px;">Mi Dashboard</a>
        <span style="color: #d1d5db;">|</span>
        <a href="${appUrl}/api-docs" style="color: #6366f1; text-decoration: none; margin: 0 10px; font-size: 12px;">API</a>
      </div>
      <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
        © 2025 MaLove.App - Plataforma para proveedores de bodas
      </p>
    </div>
    
  </div>
</body>
</html>
    `;
  }

  /**
   * Genera texto plano del email (fallback)
   */
  generateRequestEmailText(request, supplier) {
    const weddingDate = request.wedding?.date || 'Fecha por confirmar';

    return `
🎉 NUEVA SOLICITUD DE BODA

INFORMACIÓN DE LA PAREJA
------------------------
Nombres: ${request.client.name}
Email: ${request.client.email}
${request.client.phone ? `Teléfono: ${request.client.phone}` : ''}

DETALLES DE LA BODA
-------------------
Fecha: ${weddingDate}
${request.wedding?.location ? `Lugar: ${request.wedding.location}` : ''}
${request.wedding?.guestCount ? `Invitados: ${request.wedding.guestCount}` : ''}
${request.wedding?.budget ? `Presupuesto: ${request.wedding.budget} ${request.wedding.budgetCurrency || 'EUR'}` : ''}

MENSAJE
-------
${request.message}

RESPONDER
---------
Responde a este email directamente o contacta a: ${request.client.email}

Ver en tu panel: ${process.env.APP_URL || 'https://malove.app'}/supplier/dashboard/${supplier.id}/requests/${request.id}

💡 Consejo: Las parejas valoran las respuestas rápidas. Intenta responder en menos de 24 horas.

---
MaLove.App - Plataforma para proveedores de bodas
    `.trim();
  }
}

module.exports = new SupplierNotificationService();
