// Servidor mínimo para verificar que Render funciona
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mailgunJs from 'mailgun-js';

import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 4004;

// CORS básico
app.use(cors());
app.use(express.json());

// Cargar variables de entorno básicas para ejecutarse en modo standalone
try {
  const envPath = path.resolve(process.cwd(), '.env');
  dotenv.config({ path: envPath });
} catch (err) {
  console.warn('[minimal-server] No se pudo cargar .env:', err?.message || err);
}

function normalizeAddress(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
}

// Sanea dominios: quita protocolo, rutas y espacios
function sanitizeDomain(input) {
  if (!input) return input;
  let s = String(input).trim();
  s = s.replace(/^['"]|['"]$/g, '');
  s = s.replace(/^\s*https?:\/\//i, '');
  s = s.split('/')[0];
  s = s.replace(/\s+/g, '');
  return s.toLowerCase();
}

function createMailgunClient() {
  const RAW_API_KEY = process.env.VITE_MAILGUN_API_KEY || process.env.MAILGUN_API_KEY;
  const RAW_DOMAIN = process.env.VITE_MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN;
  const RAW_EU = (process.env.VITE_MAILGUN_EU_REGION || process.env.MAILGUN_EU_REGION || '').toString();

  const apiKey = RAW_API_KEY ? RAW_API_KEY.trim() : RAW_API_KEY;
  const domainRaw = RAW_DOMAIN ? RAW_DOMAIN.trim() : RAW_DOMAIN;
  const domain = domainRaw ? sanitizeDomain(domainRaw) : domainRaw;
  const euRegion = RAW_EU ? RAW_EU.trim() : RAW_EU;

  if (!apiKey || !domain) {
    console.warn('[minimal-server] Mailgun no configurado (faltan MAILGUN_API_KEY o MAILGUN_DOMAIN)');
    return null;
  }
  const domainRegex = /^(?=.{1,253}$)(?!-)([a-z0-9-]+\.)+[a-z0-9-]+$/i;
  if (!domainRegex.test(domain)) {
    console.warn('[minimal-server] MAILGUN_DOMAIN inválido tras saneado:', domainRaw, '=>', domain);
    return { __invalidDomain: true };
  }
  const hostCfg = euRegion === 'true' ? { host: 'api.eu.mailgun.net' } : {};
  try {
    return mailgunJs({ apiKey, domain, ...hostCfg });
  } catch (error) {
    console.error('[minimal-server] No se pudo crear Mailgun client:', error?.message || error);
    return null;
  }
}

// Rutas ultra simples
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Minimal server working',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Test de Mailgun ultra simple
app.get('/api/mailgun/test', (req, res) => {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN } = process.env;
  
  res.json({
    success: true,
    message: 'Mailgun endpoint working',
    config: {
      hasApiKey: !!MAILGUN_API_KEY,
      hasDomain: !!MAILGUN_DOMAIN,
      apiKeyPrefix: MAILGUN_API_KEY ? MAILGUN_API_KEY.substring(0, 8) + '...' : 'not_set',
      domain: MAILGUN_DOMAIN || 'not_set'
    },
    timestamp: new Date().toISOString()
  });
});

// Endpoint /api/mail para evitar errores 404
app.get('/api/mail', async (req, res) => {
  const folder = typeof req.query.folder === 'string' ? req.query.folder : 'inbox';
  const user = normalizeAddress(req.query.user);
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

  if (!db) {
    return res.status(503).json({ success: false, message: 'Firestore no disponible' });
  }

  try {
    let baseQuery = db.collection('mails').where('folder', '==', folder);
    if (user) {
      baseQuery = baseQuery.where(folder === 'sent' ? 'from' : 'to', '==', user);
    }

    let snapshot;
    try {
      snapshot = await baseQuery.orderBy('date', 'desc').limit(limit).get();
    } catch (err) {
      console.warn('[minimal-server] GET /api/mail sin índice, usando fallback:', err?.message || err);
      const fallbackSnap = await baseQuery.limit(limit * 2).get();
      const items = fallbackSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, limit);
      return res.json(items);
    }

    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (error) {
    console.error('[minimal-server] Error en GET /api/mail:', error);
    res.status(503).json({ success: false, message: 'Error obteniendo correos', error: error?.message || String(error) });
  }
});

// Endpoint /api/mailgun/events para evitar errores 404
app.get('/api/mailgun/events', async (req, res) => {
  const { recipient, event = 'delivered', limit = 50 } = req.query;

  if (!recipient) {
    return res.status(400).json({ success: false, message: 'Parámetro "recipient" es obligatorio' });
  }

  const mailgun = createMailgunClient();
  if (!mailgun) {
    return res.status(503).json({ success: false, message: 'Mailgun no está configurado en el servidor' });
  }
  if (mailgun.__invalidDomain) {
    return res.status(503).json({
      success: false,
      message: 'MAILGUN_DOMAIN inválido',
      hint: 'Usa solo el dominio verificado (hostname), p.ej. mg.mywed360.com',
    });
  }

  try {
    const query = {
      recipient,
      event,
      limit: Math.min(parseInt(limit, 10) || 50, 300),
      ascending: 'no',
    };
    const data = await mailgun.events().get(query);
    res.json({ success: true, items: (data && data.items) || [] });
  } catch (error) {
    const status = error?.statusCode || error?.status || 503;
    console.error('[minimal-server] Error Mailgun events:', status, error?.message || error);
    res.status(503).json({
      success: false,
      message: 'Fallo consultando eventos de Mailgun',
      error: error?.message || String(error),
    });
  }
});

// Captura de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Mailgun API Key: ${process.env.MAILGUN_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`Mailgun Domain: ${process.env.MAILGUN_DOMAIN || 'NOT SET'}`);
});

export default app;
