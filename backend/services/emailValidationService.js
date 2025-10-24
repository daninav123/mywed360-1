/**
 * Servicio de validaci�n de configuraci�n de email (DKIM, SPF, DMARC)
 * Verifica que el dominio est� correctamente configurado para env�o de emails
 */

import dns from 'dns/promises';
import logger from '../logger.js';

/**
 * Verifica registros SPF del dominio
 * @param {string} domain - Dominio a verificar
 * @returns {Promise<{valid: boolean, record: string|null, error: string|null}>}
 */
export async function validateSPF(domain) {
  try {
    const records = await dns.resolveTxt(domain);
    
    // Buscar registro SPF (debe empezar con "v=spf1")
    const spfRecord = records.find(record => {
      const txt = Array.isArray(record) ? record.join('') : record;
      return txt.startsWith('v=spf1');
    });

    if (!spfRecord) {
      return {
        valid: false,
        record: null,
        error: 'No se encontr� registro SPF en el dominio'
      };
    }

    const spfValue = Array.isArray(spfRecord) ? spfRecord.join('') : spfRecord;
    
    // Validar que incluya Mailgun o el servicio de email usado
    const hasMailgunInclude = spfValue.includes('include:mailgun.org') || 
                               spfValue.includes('include:sparkpostmail.com') ||
                               spfValue.includes('include:_spf.google.com');

    return {
      valid: hasMailgunInclude,
      record: spfValue,
      error: hasMailgunInclude ? null : 'El registro SPF no incluye el proveedor de email (Mailgun, Google, etc.)'
    };
  } catch (error) {
    logger.error('Error validating SPF:', error);
    return {
      valid: false,
      record: null,
      error: `Error al consultar DNS: ${error.message}`
    };
  }
}

/**
 * Verifica registros DKIM del dominio
 * @param {string} domain - Dominio a verificar
 * @param {string} selector - Selector DKIM (ej: 'k1', 'default', 'mailgun')
 * @returns {Promise<{valid: boolean, record: string|null, error: string|null}>}
 */
export async function validateDKIM(domain, selector = 'k1') {
  try {
    const dkimDomain = `${selector}._domainkey.${domain}`;
    const records = await dns.resolveTxt(dkimDomain);
    
    if (!records || records.length === 0) {
      return {
        valid: false,
        record: null,
        error: `No se encontr� registro DKIM para el selector "${selector}"`
      };
    }

    const dkimRecord = Array.isArray(records[0]) ? records[0].join('') : records[0];
    
    // Validar que contenga las partes b�sicas de un registro DKIM
    const hasDKIMSignature = dkimRecord.includes('v=DKIM1') || dkimRecord.includes('p=');

    return {
      valid: hasDKIMSignature,
      record: dkimRecord,
      error: hasDKIMSignature ? null : 'El registro DKIM no tiene el formato correcto'
    };
  } catch (error) {
    logger.error('Error validating DKIM:', error);
    return {
      valid: false,
      record: null,
      error: `Error al consultar DNS: ${error.message}`
    };
  }
}

/**
 * Verifica registros DMARC del dominio
 * @param {string} domain - Dominio a verificar
 * @returns {Promise<{valid: boolean, record: string|null, error: string|null}>}
 */
export async function validateDMARC(domain) {
  try {
    const dmarcDomain = `_dmarc.${domain}`;
    const records = await dns.resolveTxt(dmarcDomain);
    
    if (!records || records.length === 0) {
      return {
        valid: false,
        record: null,
        error: 'No se encontr� registro DMARC (recomendado pero no cr�tico)'
      };
    }

    const dmarcRecord = Array.isArray(records[0]) ? records[0].join('') : records[0];
    
    // Validar que sea un registro DMARC v�lido
    const hasDMARCPolicy = dmarcRecord.startsWith('v=DMARC1');

    return {
      valid: hasDMARCPolicy,
      record: dmarcRecord,
      error: hasDMARCPolicy ? null : 'El registro DMARC no tiene el formato correcto'
    };
  } catch (error) {
    // DMARC no es cr�tico, solo warning
    logger.warn('DMARC validation failed (non-critical):', error);
    return {
      valid: false,
      record: null,
      error: 'DMARC no configurado (recomendado)'
    };
  }
}

/**
 * Validaci�n completa de configuraci�n de email
 * @param {string} domain - Dominio a verificar
 * @param {string} dkimSelector - Selector DKIM (opcional, default: 'k1')
 * @returns {Promise<{overall: boolean, spf: Object, dkim: Object, dmarc: Object}>}
 */
export async function validateEmailConfiguration(domain, dkimSelector = 'k1') {
  logger.info(`Validando configuraci�n de email para dominio: ${domain}`);

  const [spf, dkim, dmarc] = await Promise.all([
    validateSPF(domain),
    validateDKIM(domain, dkimSelector),
    validateDMARC(domain)
  ]);

  // SPF y DKIM son cr�ticos, DMARC es recomendado
  const overall = spf.valid && dkim.valid;

  logger.info(`Validaci�n completa - SPF: ${spf.valid}, DKIM: ${dkim.valid}, DMARC: ${dmarc.valid}`);

  return {
    overall,
    critical: spf.valid && dkim.valid,
    recommended: dmarc.valid,
    spf,
    dkim,
    dmarc,
    summary: {
      ready: overall,
      warnings: [
        !spf.valid && spf.error,
        !dkim.valid && dkim.error,
        !dmarc.valid && 'DMARC no configurado (recomendado para mejorar deliverability)'
      ].filter(Boolean)
    }
  };
}

/**
 * Env�a un email de prueba para validar la configuraci�n
 * @param {string} from - Email remitente
 * @param {string} to - Email destinatario
 * @param {Object} mailgunClient - Cliente de Mailgun configurado
 * @returns {Promise<{success: boolean, messageId: string|null, error: string|null}>}
 */
export async function sendTestEmail(from, to, mailgunClient) {
  try {
    if (!mailgunClient) {
      return {
        success: false,
        messageId: null,
        error: 'Cliente de Mailgun no configurado'
      };
    }

    const result = await mailgunClient.messages.create(process.env.MAILGUN_DOMAIN || 'maloveapp.com', {
      from,
      to,
      subject: 'Prueba de configuraci�n de email - MaLoveApp',
      text: 'Este es un email de prueba para validar la configuraci�n de SPF/DKIM.\n\n' +
            'Si recibes este mensaje, tu configuraci�n de email est� funcionando correctamente.\n\n' +
            '�Felicitaciones!\n\n' +
            'Equipo MaLoveApp',
      html: '<h2>Prueba de configuraci�n de email</h2>' +
            '<p>Este es un email de prueba para validar la configuraci�n de SPF/DKIM.</p>' +
            '<p>Si recibes este mensaje, tu configuraci�n de email est� funcionando correctamente.</p>' +
            '<p><strong>�Felicitaciones!</strong></p>' +
            '<p>Equipo MaLoveApp</p>'
    });

    logger.info(`Email de prueba enviado: ${result.id}`);

    return {
      success: true,
      messageId: result.id,
      error: null
    };
  } catch (error) {
    logger.error('Error sending test email:', error);
    return {
      success: false,
      messageId: null,
      error: error.message || 'Error al enviar email de prueba'
    };
  }
}

export default {
  validateSPF,
  validateDKIM,
  validateDMARC,
  validateEmailConfiguration,
  sendTestEmail
};
