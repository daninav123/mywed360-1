/**
 * Auto-Reply Service
 * Gestiona respuestas automáticas a emails
 * Sprint 3 - Unificar Email, Tarea S3-T003
 */

const { sendSuccess, sendError, sendInternalError } = require('../utils/apiResponse');
const { db } = require('../db');

/**
 * Tipos de auto-respuestas predefinidos
 */
const AUTO_REPLY_TYPES = {
  RSVP_CONFIRMATION: {
    id: 'rsvp_confirmation',
    name: 'Confirmación RSVP',
    trigger: 'rsvp_received',
    defaultSubject: '¡Gracias por confirmar tu asistencia!',
    defaultTemplate: `
      <h2>¡Gracias {guest_name}!</h2>
      <p>Hemos recibido tu confirmación de asistencia.</p>
      <p><strong>Estado:</strong> {rsvp_status}</p>
      {#if companions_count}
      <p><strong>Acompañantes:</strong> {companions_count}</p>
      {/if}
      <p>¡Nos vemos el {wedding_date}!</p>
    `
  },
  THANK_YOU: {
    id: 'thank_you',
    name: 'Agradecimiento Post-Boda',
    trigger: 'post_wedding',
    defaultSubject: 'Gracias por acompañarnos en nuestro día especial',
    defaultTemplate: `
      <h2>¡Gracias {guest_name}!</h2>
      <p>Queremos agradecerte por haber sido parte de nuestro día especial.</p>
      <p>Tu presencia hizo que este momento fuera aún más memorable.</p>
    `
  },
  REMINDER: {
    id: 'reminder',
    name: 'Recordatorio',
    trigger: 'days_before_wedding',
    defaultSubject: 'Recordatorio: Nuestra boda está cerca',
    defaultTemplate: `
      <h2>Hola {guest_name}!</h2>
      <p>Te recordamos que nuestra boda será el {wedding_date}.</p>
      <p><strong>Lugar:</strong> {venue_name}</p>
      <p><strong>Hora:</strong> {ceremony_time}</p>
      <p>¡Esperamos verte allí!</p>
    `
  },
  INFO_UPDATE: {
    id: 'info_update',
    name: 'Actualización de Información',
    trigger: 'manual',
    defaultSubject: 'Actualización sobre nuestra boda',
    defaultTemplate: `
      <h2>Hola {guest_name}!</h2>
      <p>Queremos informarte sobre algunos cambios:</p>
      <p>{update_message}</p>
    `
  },
  DIETARY_CONFIRMATION: {
    id: 'dietary_confirmation',
    name: 'Confirmación Restricciones Dietéticas',
    trigger: 'dietary_info_received',
    defaultSubject: 'Confirmación de preferencias alimentarias',
    defaultTemplate: `
      <h2>Hola {guest_name}!</h2>
      <p>Hemos registrado tus preferencias alimentarias:</p>
      <p><strong>Restricciones:</strong> {dietary_restrictions}</p>
      <p>Nos aseguraremos de tener opciones adecuadas para ti.</p>
    `
  }
};

/**
 * Auto-Reply Service Class
 */
class AutoReplyService {
  /**
   * Procesa variables en plantilla
   */
  processTemplate(template, variables) {
    let processed = template;

    // Reemplazar variables simples {variable}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      processed = processed.replace(regex, variables[key] || '');
    });

    // Procesar condicionales {#if variable}...{/if}
    const ifRegex = /{#if\s+(\w+)}([\s\S]*?){\/if}/g;
    processed = processed.replace(ifRegex, (match, varName, content) => {
      return variables[varName] ? content : '';
    });

    return processed;
  }

  /**
   * Obtiene configuración de auto-respuesta
   */
  async getAutoReplyConfig(weddingId, replyType) {
    try {
      const configRef = db.collection('weddings').doc(weddingId)
        .collection('emailConfig').doc('autoReplies');
      
      const configDoc = await configRef.get();
      
      if (!configDoc.exists) {
        return AUTO_REPLY_TYPES[replyType.toUpperCase()];
      }

      const config = configDoc.data();
      const customConfig = config[replyType];

      if (customConfig && customConfig.enabled) {
        return {
          ...AUTO_REPLY_TYPES[replyType.toUpperCase()],
          ...customConfig
        };
      }

      return AUTO_REPLY_TYPES[replyType.toUpperCase()];
    } catch (error) {
      console.error('Error getting auto-reply config:', error);
      return AUTO_REPLY_TYPES[replyType.toUpperCase()];
    }
  }

  /**
   * Guarda configuración de auto-respuesta
   */
  async saveAutoReplyConfig(weddingId, replyType, config) {
    try {
      const configRef = db.collection('weddings').doc(weddingId)
        .collection('emailConfig').doc('autoReplies');

      await configRef.set({
        [replyType]: {
          ...config,
          updatedAt: new Date().toISOString()
        }
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error saving auto-reply config:', error);
      return false;
    }
  }

  /**
   * Envía auto-respuesta
   */
  async sendAutoReply(weddingId, replyType, recipientEmail, variables) {
    try {
      // Obtener configuración
      const config = await this.getAutoReplyConfig(weddingId, replyType);

      if (!config || config.enabled === false) {
        return { sent: false, reason: 'Auto-reply disabled' };
      }

      // Procesar plantilla
      const subject = this.processTemplate(config.subject || config.defaultSubject, variables);
      const body = this.processTemplate(config.template || config.defaultTemplate, variables);

      // Registrar en historial
      const historyRef = db.collection('weddings').doc(weddingId)
        .collection('emailHistory').doc();

      await historyRef.set({
        type: 'auto_reply',
        replyType,
        recipientEmail,
        subject,
        body,
        variables,
        sentAt: new Date().toISOString(),
        status: 'sent'
      });

      // TODO: Integrar con servicio de email real (Mailgun/SendGrid)
      console.log('Auto-reply sent:', { recipientEmail, subject });

      return {
        sent: true,
        historyId: historyRef.id,
        subject,
        body
      };
    } catch (error) {
      console.error('Error sending auto-reply:', error);
      return { sent: false, error: error.message };
    }
  }

  /**
   * Trigger para confirmación RSVP
   */
  async triggerRSVPConfirmation(weddingId, guestData) {
    const variables = {
      guest_name: guestData.name,
      rsvp_status: guestData.status === 'confirmed' ? 'Confirmado' : 'No asistirá',
      companions_count: guestData.companions?.length || 0,
      wedding_date: guestData.weddingDate,
      venue_name: guestData.venueName
    };

    return this.sendAutoReply(
      weddingId,
      'rsvp_confirmation',
      guestData.email,
      variables
    );
  }

  /**
   * Trigger para confirmación de restricciones dietéticas
   */
  async triggerDietaryConfirmation(weddingId, guestData) {
    const variables = {
      guest_name: guestData.name,
      dietary_restrictions: guestData.allergens?.join(', ') || 'Ninguna especificada'
    };

    return this.sendAutoReply(
      weddingId,
      'dietary_confirmation',
      guestData.email,
      variables
    );
  }

  /**
   * Trigger para recordatorio
   */
  async triggerReminder(weddingId, guestData, daysBeforeWedding) {
    const variables = {
      guest_name: guestData.name,
      wedding_date: guestData.weddingDate,
      venue_name: guestData.venueName,
      ceremony_time: guestData.ceremonyTime,
      days_remaining: daysBeforeWedding
    };

    return this.sendAutoReply(
      weddingId,
      'reminder',
      guestData.email,
      variables
    );
  }

  /**
   * Programa envío de auto-respuesta
   */
  async scheduleAutoReply(weddingId, replyType, recipientEmail, variables, sendAt) {
    try {
      const scheduleRef = db.collection('weddings').doc(weddingId)
        .collection('scheduledEmails').doc();

      await scheduleRef.set({
        type: 'auto_reply',
        replyType,
        recipientEmail,
        variables,
        sendAt: sendAt.toISOString(),
        status: 'scheduled',
        createdAt: new Date().toISOString()
      });

      return { scheduled: true, scheduleId: scheduleRef.id };
    } catch (error) {
      console.error('Error scheduling auto-reply:', error);
      return { scheduled: false, error: error.message };
    }
  }

  /**
   * Obtiene tipos de auto-respuesta disponibles
   */
  getAvailableTypes() {
    return Object.values(AUTO_REPLY_TYPES);
  }

  /**
   * Valida plantilla
   */
  validateTemplate(template) {
    const errors = [];

    // Verificar que no tenga tags HTML peligrosos
    const dangerousTags = /<script|<iframe|<object|<embed/gi;
    if (dangerousTags.test(template)) {
      errors.push('Template contains dangerous HTML tags');
    }

    // Verificar sintaxis de condicionales
    const ifTags = (template.match(/{#if/g) || []).length;
    const endifTags = (template.match(/{\/if}/g) || []).length;
    if (ifTags !== endifTags) {
      errors.push('Mismatched if/endif tags');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Instancia singleton
const autoReplyService = new AutoReplyService();

module.exports = {
  autoReplyService,
  AUTO_REPLY_TYPES
};
