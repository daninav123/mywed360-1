/**
 * Servicio para enviar emails de solicitudes de presupuesto a proveedores
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { createMailgunClients } from '../routes/mail/clients.js';
import logger from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar template HTML
const templatePath = path.join(__dirname, '../templates/emails/supplier-quote-request.html');
let emailTemplate = null;

try {
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  emailTemplate = Handlebars.compile(templateContent);
} catch (error) {
  logger.error('[quoteRequestEmailService] Error loading email template:', error);
}

/**
 * Formatear fecha para display
 */
function formatDate(dateValue) {
  if (!dateValue) return 'No especificada';

  try {
    const date = typeof dateValue?.toDate === 'function' ? dateValue.toDate() : new Date(dateValue);

    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return 'No especificada';
  }
}

/**
 * Formatear detalles del servicio para el email
 */
function formatServiceDetails(serviceDetails) {
  if (!serviceDetails || typeof serviceDetails !== 'object') {
    return [];
  }

  const formatted = [];

  Object.entries(serviceDetails).forEach(([key, value]) => {
    // Convertir camelCase a título legible
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    let displayValue = value;

    if (typeof value === 'boolean') {
      displayValue = value ? 'Sí' : 'No';
    } else if (Array.isArray(value)) {
      displayValue = value.join(', ');
    }

    formatted.push({
      label,
      value: displayValue,
    });
  });

  return formatted;
}

/**
 * Enviar email de solicitud de presupuesto al proveedor
 */
export async function sendQuoteRequestEmail({
  supplierEmail,
  supplierName,
  clientName,
  clientEmail,
  clientPhone = null,
  weddingDate,
  city,
  guestCount,
  totalBudget,
  categoryName,
  serviceDetails = {},
  customMessage = '',
  responseUrl,
  requestId,
}) {
  try {
    if (!emailTemplate) {
      throw new Error('Template de email no disponible');
    }

    if (!supplierEmail) {
      throw new Error('Email del proveedor requerido');
    }

    // Calcular fecha de validez (30 días desde ahora)
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 30);
    const validUntil = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
    }).format(validUntilDate);

    // Preparar datos para el template
    const templateData = {
      supplierName: supplierName || 'Proveedor',
      clientName: clientName || 'Cliente',
      clientEmail,
      clientPhone,
      categoryName: categoryName || 'Servicio',
      weddingDate: formatDate(weddingDate),
      city: city || 'No especificada',
      guestCount: guestCount || 'No especificado',
      totalBudget: totalBudget ? totalBudget.toLocaleString('es-ES') : 'No especificado',
      serviceDetails: formatServiceDetails(serviceDetails),
      customMessage,
      responseUrl,
      validUntil,
    };

    // Generar HTML
    const htmlContent = emailTemplate(templateData);

    // Preparar texto plano (fallback)
    const textContent = `
Nueva Solicitud de Presupuesto

${clientName} está interesado en tu servicio de ${categoryName} para su boda.

Detalles del evento:
- Fecha: ${templateData.weddingDate}
- Ciudad: ${templateData.city}
- Invitados: ${templateData.guestCount}
- Presupuesto total: ${templateData.totalBudget}€

Responde con tu presupuesto aquí:
${responseUrl}

Este enlace es único y seguro.

---
MyWed360 - Plataforma de gestión de bodas
    `.trim();

    // Enviar email con Mailgun
    const { mgClient, domainName } = await createMailgunClients();

    const messageData = {
      from: `MyWed360 - Solicitudes <solicitudes@${domainName}>`,
      to: supplierEmail,
      subject: `💼 Nueva solicitud de presupuesto de ${clientName}`,
      text: textContent,
      html: htmlContent,
      'h:X-Mailgun-Variables': JSON.stringify({
        requestId,
        type: 'quote_request',
        supplierId: supplierEmail,
      }),
    };

    const result = await mgClient.messages.create(domainName, messageData);

    logger.info(
      `✅ Email enviado a ${supplierEmail} - Request ID: ${requestId} - Mailgun ID: ${result.id}`
    );

    return {
      success: true,
      messageId: result.id,
      to: supplierEmail,
    };
  } catch (error) {
    logger.error('[quoteRequestEmailService] Error sending email:', error);
    throw error;
  }
}

/**
 * Enviar email de notificación al usuario cuando recibe un presupuesto
 */
export async function sendQuoteReceivedNotification({
  userEmail,
  userName,
  supplierName,
  categoryName,
  quoteAmount,
  viewUrl,
}) {
  try {
    const { mgClient, domainName } = await createMailgunClients();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
    .highlight { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ¡Nuevo Presupuesto Recibido!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Tenemos buenas noticias: <strong>${supplierName}</strong> ha respondido a tu solicitud de presupuesto para <strong>${categoryName}</strong>.</p>
      
      <div class="highlight">
        <p style="margin: 0;"><strong>Proveedor:</strong> ${supplierName}</p>
        <p style="margin: 10px 0 0 0;"><strong>Servicio:</strong> ${categoryName}</p>
        ${quoteAmount ? `<p style="margin: 10px 0 0 0;"><strong>Precio:</strong> ${quoteAmount.toLocaleString('es-ES')}€</p>` : ''}
      </div>
      
      <p><strong>¿Qué puedes hacer ahora?</strong></p>
      <ul>
        <li>Ver el presupuesto completo con todos los detalles</li>
        <li>Compararlo con otras opciones si has recibido más</li>
        <li>Aceptar y contratar directamente</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${viewUrl}" class="button">👀 Ver Presupuesto</a>
      </div>
    </div>
    <div class="footer">
      <p>MyWed360 - Tu asistente de bodas inteligente</p>
      <p><a href="${viewUrl}">Ver presupuesto</a> • <a href="https://app.mywed360.com">Ir a mi boda</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
¡Nuevo Presupuesto Recibido!

Hola ${userName},

${supplierName} ha respondido a tu solicitud de presupuesto para ${categoryName}.

${quoteAmount ? `Precio: ${quoteAmount.toLocaleString('es-ES')}€` : ''}

Ver presupuesto: ${viewUrl}

---
MyWed360
    `.trim();

    const messageData = {
      from: `MyWed360 - Notificaciones <notificaciones@${domainName}>`,
      to: userEmail,
      subject: `🎉 ${supplierName} respondió tu solicitud de ${categoryName}`,
      text: textContent,
      html: htmlContent,
    };

    const result = await mgClient.messages.create(domainName, messageData);

    logger.info(`✅ Notificación enviada a ${userEmail} - Mailgun ID: ${result.id}`);

    return {
      success: true,
      messageId: result.id,
    };
  } catch (error) {
    logger.error('[quoteRequestEmailService] Error sending notification:', error);
    throw error;
  }
}
