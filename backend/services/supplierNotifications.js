import logger from '../logger.js';
import { sendEmail } from './mailgunService.js';

/**
 * Servicio de notificaciones para proveedores
 */

// Enviar notificación de nueva solicitud de presupuesto
export async function notifyNewQuoteRequest(supplier, request) {
  try {
    const supplierEmail = supplier.contact?.email || supplier.email;

    if (!supplierEmail) {
      logger.warn(`Supplier ${supplier.id} has no email, skipping notification`);
      return { success: false, reason: 'no_email' };
    }

    const subject = '🎉 Nueva solicitud de presupuesto - MaLove.App';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6d28d9; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">¡Nueva solicitud recibida!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${supplier.name}</strong>,</p>
            
            <p>Has recibido una nueva solicitud de presupuesto para tu servicio de <strong>${supplier.category}</strong>.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Detalles del evento:</h3>
              <p><strong>Fecha del evento:</strong> ${request.eventDate || 'No especificada'}</p>
              <p><strong>Ubicación:</strong> ${request.location || 'No especificada'}</p>
              <p><strong>Presupuesto estimado:</strong> ${request.budget || 'Por determinar'}</p>
              ${request.message ? `<p><strong>Mensaje:</strong><br>${request.message}</p>` : ''}
            </div>
            
            <p>Responde rápido para aumentar tus posibilidades de cerrar el contrato.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/supplier/dashboard/${supplier.id}/requests" class="button">
              Ver solicitud completa
            </a>
          </div>
          <div class="footer">
            <p>MaLove.App - Tu plataforma de servicios para bodas</p>
            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/supplier/dashboard/${supplier.id}/settings">Gestionar notificaciones</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: supplierEmail,
      subject,
      html,
      text: `Nueva solicitud de presupuesto para ${supplier.category}. Visita tu panel para ver los detalles.`,
    });

    logger.info(`Notification sent to supplier ${supplier.id}: new quote request`);
    return { success: true, messageId: result.id };
  } catch (error) {
    logger.error('Error sending new quote request notification:', error);
    return { success: false, error: error.message };
  }
}

// Enviar notificación de nueva reseña
export async function notifyNewReview(supplier, review) {
  try {
    const supplierEmail = supplier.contact?.email || supplier.email;

    if (!supplierEmail) {
      logger.warn(`Supplier ${supplier.id} has no email, skipping notification`);
      return { success: false, reason: 'no_email' };
    }

    const stars = '⭐'.repeat(review.rating);
    const subject = `${stars} Nueva reseña recibida - MaLove.App`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6d28d9; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .review-box { background: white; padding: 15px; border-left: 4px solid #fbbf24; border-radius: 6px; margin: 15px 0; }
          .stars { font-size: 24px; color: #fbbf24; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">¡Nueva reseña recibida!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${supplier.name}</strong>,</p>
            
            <p>Has recibido una nueva reseña de <strong>${review.clientName || 'un cliente'}</strong>:</p>
            
            <div class="review-box">
              <div class="stars">${stars}</div>
              <p style="font-style: italic; margin-top: 10px;">"${review.comment}"</p>
            </div>
            
            <p>Es importante responder a las reseñas para mostrar que valoras la opinión de tus clientes.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/supplier/dashboard/${supplier.id}/reviews" class="button">
              Responder ahora
            </a>
          </div>
          <div class="footer">
            <p>MaLove.App - Tu plataforma de servicios para bodas</p>
            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/supplier/dashboard/${supplier.id}/settings">Gestionar notificaciones</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: supplierEmail,
      subject,
      html,
      text: `Nueva reseña de ${review.rating} estrellas. Visita tu panel para responder.`,
    });

    logger.info(`Notification sent to supplier ${supplier.id}: new review`);
    return { success: true, messageId: result.id };
  } catch (error) {
    logger.error('Error sending new review notification:', error);
    return { success: false, error: error.message };
  }
}

// Enviar resumen semanal de actividad
export async function sendWeeklySummary(supplier, stats) {
  try {
    const supplierEmail = supplier.contact?.email || supplier.email;

    if (!supplierEmail) {
      return { success: false, reason: 'no_email' };
    }

    const subject = '📊 Tu resumen semanal - MaLove.App';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6d28d9; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-card { background: white; padding: 15px; border-radius: 6px; text-align: center; }
          .stat-number { font-size: 32px; font-weight: bold; color: #6d28d9; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Tu semana en MaLove.App</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${supplier.name}</strong>,</p>
            
            <p>Aquí está tu resumen de actividad de los últimos 7 días:</p>
            
            <div class="stat-grid">
              <div class="stat-card">
                <div>👁️ Vistas del perfil</div>
                <div class="stat-number">${stats.views || 0}</div>
              </div>
              <div class="stat-card">
                <div>📧 Nuevas solicitudes</div>
                <div class="stat-number">${stats.newRequests || 0}</div>
              </div>
              <div class="stat-card">
                <div>⭐ Nuevas reseñas</div>
                <div class="stat-number">${stats.newReviews || 0}</div>
              </div>
              <div class="stat-card">
                <div>🖱️ Clics en contacto</div>
                <div class="stat-number">${stats.clicks || 0}</div>
              </div>
            </div>
            
            <p>Sigue mejorando tu perfil para atraer más clientes.</p>
          </div>
          <div class="footer">
            <p>MaLove.App - Tu plataforma de servicios para bodas</p>
            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/supplier/dashboard/${supplier.id}/settings">Gestionar notificaciones</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: supplierEmail,
      subject,
      html,
      text: `Tu resumen semanal: ${stats.views} vistas, ${stats.newRequests} solicitudes, ${stats.newReviews} reseñas.`,
    });

    logger.info(`Weekly summary sent to supplier ${supplier.id}`);
    return { success: true, messageId: result.id };
  } catch (error) {
    logger.error('Error sending weekly summary:', error);
    return { success: false, error: error.message };
  }
}
