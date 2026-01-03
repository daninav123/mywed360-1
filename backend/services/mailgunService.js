import mailgun from 'mailgun-js';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import { sanitizers } from '../utils/logSanitizer.js';

dotenv.config();

/**
 * Obtiene la configuración de Mailgun
 */
function getMailgunConfig() {
  const apiKey = process.env.MAILGUN_API_KEY || process.env.VITE_MAILGUN_API_KEY || '';
  let domain = process.env.MAILGUN_DOMAIN || process.env.VITE_MAILGUN_DOMAIN || '';
  if (typeof domain === 'string') {
    domain = domain.replace(/^https?:\/\//i, '').trim();
  }
  const euRegion =
    String(
      process.env.MAILGUN_EU_REGION || process.env.VITE_MAILGUN_EU_REGION || ''
    ).toLowerCase() === 'true';
  return { apiKey, domain, euRegion };
}

/**
 * Crea un cliente de Mailgun
 */
function createMailgunClient() {
  const { apiKey, domain, euRegion } = getMailgunConfig();

  if (!apiKey || !domain) {
    logger.warn('[mailgunService] Mailgun no configurado - faltan API_KEY o DOMAIN');
    return null;
  }

  const options = { apiKey, domain };
  if (euRegion) {
    options.host = 'api.eu.mailgun.net';
  }

  try {
    return mailgun(options);
  } catch (error) {
    logger.error('[mailgunService] Error creando cliente Mailgun:', error);
    return null;
  }
}

/**
 * Envía un email usando Mailgun
 * @param {Object} options
 * @param {string} options.to - Email del destinatario
 * @param {string} options.subject - Asunto del email
 * @param {string} options.html - Contenido HTML del email
 * @param {string} [options.from] - Email del remitente (opcional, usa default si no se provee)
 * @param {string} [options.text] - Contenido de texto plano (opcional)
 * @returns {Promise<Object>} Resultado del envío
 */
export async function sendEmail({ to, subject, html, from, text }) {
  const client = createMailgunClient();
  const { domain } = getMailgunConfig();

  if (!client || !domain) {
    throw new Error('Mailgun no está configurado correctamente');
  }

  // Email remitente por defecto
  const defaultFrom = `MyWed360 <noreply@${domain}>`;
  const fromAddress = from || defaultFrom;

  const messageData = {
    from: fromAddress,
    to,
    subject,
    html,
  };

  // Agregar texto plano si se provee
  if (text) {
    messageData.text = text;
  }

  try {
    logger.info(`[mailgunService] Enviando email a ${sanitizers.email(to)}: ${subject}`);
    const result = await client.messages().send(messageData);
    logger.info(`[mailgunService] Email enviado exitosamente. ID: ${result.id}`);
    return { success: true, messageId: result.id, result };
  } catch (error) {
    logger.error('[mailgunService] Error enviando email:', error);
    throw error;
  }
}

/**
 * Verifica si Mailgun está configurado y operativo
 * @returns {boolean}
 */
export function isMailgunConfigured() {
  const { apiKey, domain } = getMailgunConfig();
  return !!(apiKey && domain);
}

export default {
  sendEmail,
  isMailgunConfigured,
};
