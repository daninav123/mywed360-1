import i18n from '../i18n';

/* eslint-disable no-unreachable */
/**
 * Servicio de integración con Mailgun para correos MaLove.App (actualizado)
 * Este servicio gestiona todas las interacciones con Mailgun a través de
 * Firebase Cloud Functions por seguridad (no expone API keys en el frontend):
 * - Envío de correos
 * - Verificación de entrega
 * - Gestión de alias de correo
 * - Validación de direcciones
 */

// Variables de configuración
const DOMAIN = import.meta.env.VITE_MAILGUN_DOMAIN || 'malove.app';
const FUNCTIONS_URL =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_URL ||
  'https://us-central1-maloveapp.cloudfunctions.neti18n.t('common.verifica_mailgun_esta_configurado_correctamente_returns')Mailgun no está configurado correctamentei18n.t('common.const_from_subject_text_html_bcc')Remitente (from) requerido');
  if (!to) throw new Error('Destinatario (to) requerido');
  if (!subject) throw new Error('Asunto (subject) requerido');
  if (!text && !html) throw new Error('Contenido (text o html) requerido');

  // Llamar a la Cloud Function para enviar el correo
  try {
    const response = await fetch(`${FUNCTIONS_URL}/sendEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/jsoni18n.t('common.body_jsonstringify_from_subject_text_html')unknown',
      response: data,
    };
  } catch (error) {
    console.error('Error en Cloud Function sendEmail:', error);
    throw error;
  }
}

/**
 * Verifica si un correo electrónico es válido (sintaxis y existencia) usando Cloud Functions
 * @param {string} email - Correo electrónico a verificar
 * @returns {Promise<Object>} - Información sobre la validez del correo
 */
export async function validateEmail(email) {
  if (!isMailgunConfigured()) {
    throw new Error(i18n.t('common.mailgun_esta_configurado_correctamente'));
  }

  if (!email) {
    throw new Error(i18n.t('common.correo_electronico_requerido'));
  }

  try {
    const response = await fetch(
      `${FUNCTIONS_URL}/validateEmail?email=${encodeURIComponent(email)}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al validar correo: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en la validación de correo:', error);
    throw error;
  }
}

/**
 * Verifica si un nombre de usuario está disponible en el dominio usando Cloud Functions
 * @param {string} username - Nombre de usuario a verificar (sin @dominio)
 * @returns {Promise<boolean>} - true si está disponible
 */
export async function checkUsernameAvailability(username) {
  if (!isMailgunConfigured()) {
    throw new Error(i18n.t('common.mailgun_esta_configurado_correctamente'));
  }

  if (!username) {
    throw new Error('Nombre de usuario requerido');
  }

  // Normalizar el nombre de usuario (minusculas, sin acentos, etc)
  const normalizedUsername = username
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]/g, '.i18n.t('common.correo_verificar_const_email_normalizedusernamedomain_try')Error al verificar disponibilidad de nombre de usuario:', error);
    // En caso de error, asumimos que no está disponible por precaución
    return false;
  }

  // En una implementación real, aquí verificaríamos contra la base de datos
  // y el servicio de correo (Mailgun) si el nombre existe ya

  // Simular latencia de red y verificación
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Para simulación, consideramos nombres cortos como no disponibles
  if (username.length <= 4) {
    return { available: false, reason: 'Este nombre de usuario no está disponiblei18n.t('common.por_defecto_indicamos_que_esta_disponible')Mailgun no está configurado correctamente');
  }

  if (!address || !forwardTo) {
    throw new Error(i18n.t('common.requieren_direccion_origen_destino'));
  }

  try {
    return { available: true };
  } catch (error) {
    console.error('Error en Mailgun createForwardingRoute:', error);
    throw error;
  }
}

/**
 * Obtiene los eventos de correo para un usuario específico usando Cloud Functions
 * @param {string} emailAddress - Dirección de correo
 * @param {string} [eventType='delivered'] - Tipo de evento (accepted, delivered, failed, rejected)
 * @param {number} [limit=50] - Número máximo de eventos a devolver
 * @returns {Promise<Array>} - Array de eventos
 */
export async function getMailEvents(emailAddress, eventType = 'delivered', limit = 50) {
  if (!isMailgunConfigured()) {
    throw new Error(i18n.t('common.mailgun_esta_configurado_correctamente'));
  }

  if (!emailAddress) {
    throw new Error(i18n.t('common.direccion_correo_requerida'));
  }

  try {
    const params = new URLSearchParams({
      recipient: emailAddress,
      event: eventType,
      limit,
    });

    const response = await fetch(`${FUNCTIONS_URL}/getMailgunEvents?${params}`);

    if (!response.ok) {
      throw new Error(`Error al obtener eventos: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error al obtener eventos de correo:', error);
    throw error;
  }
}

/**
 * Obtiene el estado del dominio de Mailgun
 * @returns {Promise<Object>} - Estado del dominio
 */
export async function fetchMailgunDomainStatus() {
  if (!isMailgunConfigured()) {
    throw new Error('Mailgun no está configurado correctamente');
  }

  try {
    // En producción, esto debería llamar a un endpoint del backend
    // que consulte la API de Mailgun para verificar el estado del dominio
    return {
      domain: DOMAIN,
      state: 'active',
      verified: true,
      spf: { valid: true, status: 'valid' },
      dkim: { valid: true, status: 'valid' },
      mx: { valid: true, status: 'valid' },
    };
  } catch (error) {
    console.error('Error al obtener estado del dominio:', error);
    throw error;
  }
}

/**
 * Envía un email de verificación para un alias
 * @param {string} alias - Alias de correo a verificar
 * @returns {Promise<Object>} - Resultado del envío
 */
export async function sendAliasVerificationEmail(alias) {
  if (!isMailgunConfigured()) {
    throw new Error('Mailgun no está configurado correctamente');
  }

  if (!alias) {
    throw new Error('Alias requeridoi18n.t('common.try_produccion_esto_deberia_llamar_endpoint')Email de verificación enviado',
      alias: alias,
    };
  } catch (error) {
    console.error('Error al enviar email de verificación:', error);
    throw error;
  }
}
