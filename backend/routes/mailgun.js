import crypto from 'crypto';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mailgun from 'mailgun-js';
import { recordDeliverabilityEvent } from '../services/emailDeliverability.js';

// Asegura variables de entorno disponibles en Render o local
dotenv.config();

// Ensure MAILGUN_* env vars exist in development by falling back to VITE_* equivalents
if (!process.env.MAILGUN_API_KEY && process.env.VITE_MAILGUN_API_KEY) {
  process.env.MAILGUN_API_KEY = process.env.VITE_MAILGUN_API_KEY;
}
if (!process.env.MAILGUN_DOMAIN && process.env.VITE_MAILGUN_DOMAIN) {
  process.env.MAILGUN_DOMAIN = process.env.VITE_MAILGUN_DOMAIN;
}
if (typeof process.env.MAILGUN_EU_REGION === 'undefined' && typeof process.env.VITE_MAILGUN_EU_REGION !== 'undefined') {
  process.env.MAILGUN_EU_REGION = process.env.VITE_MAILGUN_EU_REGION;
}

const router = express.Router();

// Habilitar CORS basico para tests desde frontend
router.use(cors({ origin: true }));
router.use(express.urlencoded({ extended: true }));

function getMailgunConfig() {
  const apiKey = process.env.MAILGUN_API_KEY || process.env.VITE_MAILGUN_API_KEY || '';
  let domain = process.env.MAILGUN_DOMAIN || process.env.VITE_MAILGUN_DOMAIN || '';
  if (typeof domain === 'string') {
    domain = domain.replace(/^https?:\/\//i, '').trim();
  }
  const euRegion = String(process.env.MAILGUN_EU_REGION || process.env.VITE_MAILGUN_EU_REGION || '').toLowerCase() === 'true';
  return { apiKey, domain, euRegion };
}

function createMailgunClient(domainOverride) {
  const { apiKey, domain, euRegion } = getMailgunConfig();
  const targetDomain = domainOverride || domain;
  if (!apiKey || !targetDomain) return null;
  const options = { apiKey, domain: targetDomain };
  if (euRegion) options.host = 'api.eu.mailgun.net';
  try {
    return mailgun(options);
  } catch (error) {
    console.warn('[mailgun] failed to create client', error?.message || error);
    return null;
  }
}

function normalizeRecord(record) {
  if (!record || typeof record !== 'object') return null;
  return {
    name: record.name || record.hostname || '',
    type: record.record_type || record.type || '',
    value: record.value || record.record_value || '',
    valid: Boolean(record.valid || record.verified),
    verified: Boolean(record.verified),
    cached: Boolean(record.cached),
    lastChecked: record.last_checked || record.checked_at || null,
  };
}

router.get('/domain-status', async (req, res) => {
  try {
    const queryDomain = typeof req.query?.domain === 'string' ? req.query.domain.trim() : '';
    const { domain: envDomain } = getMailgunConfig();
    const targetDomain = (queryDomain || envDomain || '').replace(/^https?:\/\//i, '').trim();
    const client = createMailgunClient(targetDomain);
    if (!client || !targetDomain) {
      return res.status(503).json({
        success: false,
        error: 'mailgun-not-configured',
        message: 'Mailgun no está configurado en el servidor',
      });
    }
    const domainInfo = await new Promise((resolve, reject) => {
      client.get(`/domains/${targetDomain}`, (err, body) => {
        if (err) return reject(err);
        resolve(body || {});
      });
    });
    const sendingRecords = Array.isArray(domainInfo?.sending_dns_records)
      ? domainInfo.sending_dns_records
      : [];
    const receivingRecords = Array.isArray(domainInfo?.receiving_dns_records)
      ? domainInfo.receiving_dns_records
      : [];
    const dkimRecords = sendingRecords
      .filter((record) => {
        const name = String(record?.name || record?.hostname || '').toLowerCase();
        return name.includes('._domainkey');
      })
      .map((record) => normalizeRecord(record))
      .filter(Boolean);
    const spfRecords = sendingRecords
      .filter((record) => {
        const value = String(record?.value || record?.record_value || '').toLowerCase();
        const name = String(record?.name || '').toLowerCase();
        return value.includes('spf') || name === targetDomain;
      })
      .map((record) => normalizeRecord(record))
      .filter(Boolean);
    const dmarcRecords = [...receivingRecords, ...sendingRecords]
      .filter((record) => {
        const name = String(record?.name || record?.hostname || '').toLowerCase();
        return name.includes('_dmarc');
      })
      .map((record) => normalizeRecord(record))
      .filter(Boolean);
    const aggregateStatus = (records) => {
      if (!records.length) {
        return { verified: false, pending: true, records };
      }
      const verified = records.every((record) => record.verified || record.valid);
      return {
        verified,
        pending: !verified,
        records,
      };
    };
    return res.json({
      success: true,
      domain: targetDomain,
      state: domainInfo?.domain?.state || domainInfo?.state || null,
      dkim: aggregateStatus(dkimRecords),
      spf: aggregateStatus(spfRecords),
      receiving: aggregateStatus(
        receivingRecords.map((record) => normalizeRecord(record)).filter(Boolean)
      ),
      dmarc: aggregateStatus(dmarcRecords),
      raw: {
        domain: domainInfo?.domain || null,
        sending_dns_records: sendingRecords,
        receiving_dns_records: receivingRecords,
        dmarc_records: dmarcRecords,
      },
    });
  } catch (error) {
    console.error('[mailgun] domain-status failed', error);
    return res.status(502).json({
      success: false,
      error: 'mailgun-domain-status-failed',
      message: error?.message || 'Mailgun domain lookup failed',
    });
  }
});

router.post('/send-test', async (req, res) => {
  try {
    const { toEmail, alias, subject, text, html } = req.body || {};
    const trimmedTo = typeof toEmail === 'string' ? toEmail.trim() : '';
    if (!trimmedTo) {
      return res.status(400).json({ success: false, error: 'toEmail-required' });
    }

    const config = getMailgunConfig();
    const client = createMailgunClient();
    if (!client || !config.domain) {
      return res.status(503).json({ success: false, error: 'mailgun-not-configured' });
    }

    const normalizedAlias = alias && typeof alias === 'string' ? alias.trim().toLowerCase() : '';
    const fromAddress = normalizedAlias
      ? `${normalizedAlias}@${config.domain}`
      : `verificacion@${config.domain}`;

    const messageData = {
      from: fromAddress,
      to: trimmedTo,
      subject: subject || 'Prueba de correo myWed360',
      text:
        text ||
        `Hola,

Este es un correo de prueba enviado automáticamente por myWed360 para verificar la configuración del alias ${normalizedAlias}@${config.domain}.

Si recibes este mensaje significa que Mailgun está aceptando los envíos correctamente.

Gracias,
Equipo myWed360`,
    };

    if (html && typeof html === 'string') {
      messageData.html = html;
    }

    await client.messages().send(messageData);

    return res.json({ success: true });
  } catch (error) {
    console.error('[mailgun] send-test failed', error);
    return res.status(502).json({
      success: false,
      error: 'mailgun-send-test-failed',
      message: error?.message || 'Mailgun send failed',
    });
  }
});

/**
 * GET /api/mailgun/test
 * Responde 200 si la configuración básica de Mailgun en el backend es correcta.
 * Versión simplificada sin dependencia de mailgun-js para debugging.
 */
router.all('/test', async (req, res) => {
  try {
    const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_EU_REGION } = process.env;
    
    // Test básico: verificar que las variables de entorno existen
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      return res.status(503).json({ 
        success: false, 
        message: 'Mailgun no está configurado en el servidor',
        debug: {
          hasApiKey: !!MAILGUN_API_KEY,
          hasDomain: !!MAILGUN_DOMAIN,
          euRegion: MAILGUN_EU_REGION
        }
      });
    }

    // Test exitoso: configuración presente
    return res.status(200).json({ 
      success: true, 
      message: 'Mailgun configuración OK (test simplificado)',
      debug: {
        domain: MAILGUN_DOMAIN,
        euRegion: MAILGUN_EU_REGION === 'true',
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: err.message,
      stack: err.stack
    });
  }
});

function getSignatureField(body, key) {
  return (
    body[`signature[${key}]`] ||
    (body.signature && body.signature[key]) ||
    body[`signature_${key}`] ||
    null
  );
}

function verifyWebhookSignature(body) {
  const signingKey =
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY || process.env.VITE_MAILGUN_WEBHOOK_SIGNING_KEY || '';
  if (!signingKey) return true;

  const timestamp = getSignatureField(body, 'timestamp') || body.timestamp;
  const token = getSignatureField(body, 'token') || body.token;
  const signature = getSignatureField(body, 'signature') || body.signature;
  if (!timestamp || !token || !signature) return false;

  const digest = crypto.createHmac('sha256', signingKey).update(`${timestamp}${token}`).digest('hex');
  return digest === signature;
}

router.post('/webhooks/deliverability', async (req, res) => {
  try {
    if (!verifyWebhookSignature(req.body || {})) {
      return res.status(401).json({ error: 'invalid-signature' });
    }

    const body = req.body || {};
    const timestampSeconds = Number(body.timestamp || getSignatureField(body, 'timestamp'));
    const timestampMs = Number.isFinite(timestampSeconds) ? timestampSeconds * 1000 : Date.now();

    const payload = {
      event: body.event || body['event'],
      timestamp: timestampMs,
      recipient: body.recipient || body['recipient'],
      severity: body.severity || null,
      reason:
        body.reason ||
        body.description ||
        body['reject-reason'] ||
        body['delivery-status']?.message ||
        null,
      code: body.code || body['delivery-status']?.code || null,
      message: body.message || body.error || null,
      storage: body.storage || null,
      signatureId: getSignatureField(body, 'signature') || null,
      'message-id':
        body['message-id'] ||
        (body['Message-Id'] ? body['Message-Id'] : null) ||
        body.messageId ||
        body['mail-headers']?.['message-id'] ||
        null,
    };

    const recordResult = await recordDeliverabilityEvent(payload);
    if (!recordResult.recorded) {
      return res.status(202).json({ ok: false, reason: recordResult.reason || 'not-recorded' });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('[mailgun] webhook error', error);
    return res.status(500).json({ error: 'webhook-failed' });
  }
});

export default router;
