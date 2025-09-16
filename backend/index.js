// Express backend for Lovenda

// Provides:
//   GET /api/transactions - proxy or mock to bank aggregator (Nordigen)
//   Health check at /

import dotenv from 'dotenv';
// Cargar variables de entorno lo antes posible desde secret file (Render) o .env local
import fs from 'fs';
import path from 'path';

const secretEnvPath = '/etc/secrets/app.env';
if (fs.existsSync(secretEnvPath)) {
  dotenv.config({ path: secretEnvPath });
  console.log('�S& Variables de entorno cargadas desde secret file', secretEnvPath);
} else {
  dotenv.config(); // fallback a .env local
}
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import { randomUUID } from 'crypto';
// Importar middleware de autenticación (ESM) - debe cargarse antes que las rutas para inicializar Firebase Admin correctamente
import {
  requireAuth,
  requireMailAccess,
  optionalAuth
} from './middleware/authMiddleware.js';

import mailRouter from './routes/mail.js';
import mailOpsRouter from './routes/mail-ops.js';
import mailStatsRouter from './routes/mail-stats.js';
import mailSearchRouter from './routes/mail-search.js';
import aiRouter from './routes/ai.js';
import aiAssignRouter from './routes/ai-assign.js';
import aiImageRouter from './routes/ai-image.js';
import aiSuppliersRouter from './routes/ai-suppliers.js';
import aiSongsRouter from './routes/ai-songs.js';
import emailInsightsRouter from './routes/email-insights.js';
import metricsSeatingRouter from './routes/metrics-seating.js';
import notificationsRouter from './routes/notifications.js';
import guestsRouter from './routes/guests.js';
import rolesRouter from './routes/roles.js';
import eventsRouter from './routes/events.js';
import mailgunDebugRoutes from './routes/mailgun-debug.js';
import mailgunInboundRouter from './routes/mailgun-inbound.js';
import mailgunEventsRouter from './routes/mailgun-events.js';
import mailgunWebhookRouter from './routes/mailgun-webhook.js';
import mailgunTestRouter from './routes/mailgun.js';
import diagnosticRouter from './routes/diagnostic.js';
import simpleTestRouter from './routes/simple-test.js';
import emailTemplatesRouter from './routes/email-templates.js';
import logger from './logger.js';
import instagramWallRouter from './routes/instagram-wall.js';
import imageProxyRouter from './routes/image-proxy.js';
import weddingNewsRouter from './routes/wedding-news.js';
import supplierPortalRouter from './routes/supplier-portal.js';
import supplierBudgetRouter from './routes/supplier-budget.js';
import publicWeddingRouter from './routes/public-wedding.js';
import rsvpRouter from './routes/rsvp.js';
import automationRouter from './routes/automation.js';
import legalDocsRouter from './routes/legal-docs.js';
import signatureRouter from './routes/signature.js';
import contactsRouter from './routes/contacts.js';
import gamificationRouter from './routes/gamification.js';
import whatsappRouter from './routes/whatsapp.js';
import gdprRouter from './routes/gdpr.js';
import pushRouter from './routes/push.js';
import paymentsRouter from './routes/payments.js';
import paymentsWebhookRouter from './routes/payments-webhook.js';
import healthRouter from './routes/health.js';
import calendarFeedRouter from './routes/calendar-feed.js';
import spotifyRouter from './routes/spotify.js';
import playbackRouter from './routes/playback.js';


// Load environment variables (root .env)
const envPath = path.resolve(process.cwd(), '.env');
let result = dotenv.config({ path: envPath });

// Si no se encuentra en la ruta actual, intentar buscar en el directorio padre
if (result.error) {
  const parentEnvPath = path.resolve(process.cwd(), '../.env');
  result = dotenv.config({ path: parentEnvPath });
}
if (result.error) {
  console.warn('�a�️  .env file not found at', envPath);
} else {
  console.log('�S& .env loaded from', envPath);
}
if (!process.env.OPENAI_API_KEY) {
  console.warn('�a�️  OPENAI_API_KEY not set. Chat AI endpoints will return 500.');
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 4004; // Render inyecta PORT, 4004 por defecto para desarrollo local

const app = express();
// Detrás de proxy (Render) para que express-rate-limit use IP correcta
app.set('trust proxy', 1);

// Seguridad básica
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Configurar CORS por allowlist (coma-separado)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
const ALLOWED_ORIGINS = ALLOWED_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting: por defecto 120/min en producción, 0 en otros entornos (puede sobreescribirse con RATE_LIMIT_AI_MAX)
const AI_RATE_LIMIT_MAX = process.env.RATE_LIMIT_AI_MAX
  ? Number(process.env.RATE_LIMIT_AI_MAX)
  : (process.env.NODE_ENV === 'production' ? 60 : 0);
if (AI_RATE_LIMIT_MAX > 0) {
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: AI_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    // Limitar por usuario autenticado (uid); fallback a IP
    keyGenerator: (req, _res) => {
      try {
        const uid = req?.user?.uid || req?.userProfile?.uid;
        if (uid) return `uid:${uid}`;
      } catch {}
      const ip = req.ip || (Array.isArray(req.ips) && req.ips[0]) || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
      return `ip:${ip}`;
    },
    message: { success: false, error: { code: 'rate_limit', message: 'Too many requests' } },
  });
  app.use('/api/ai', aiLimiter);
  app.use('/api/ai-image', aiLimiter);
  app.use('/api/ai-suppliers', aiLimiter);
}

// Middleware de correlación: X-Request-ID en cada petición
app.use((req, res, next) => {
  try {
    const incoming = req.headers['x-request-id'];
    const id = (typeof incoming === 'string' && incoming.trim()) ? incoming.trim() : randomUUID();
    req.id = id;
    res.setHeader('X-Request-ID', id);
  } catch {
    // best-effort
  }
  next();
});

// Prometheus metrics (lazy load si está disponible)
let metrics = {
  loaded: false,
  prom: null,
  registry: null,
  httpRequestsTotal: null,
  httpRequestDuration: null,
};

async function ensureMetrics() {
  if (metrics.loaded) return;
  try {
    const mod = await import('prom-client');
    const prom = mod.default || mod;
    const registry = new prom.Registry();
    prom.collectDefaultMetrics({ register: registry });
    const httpRequestsTotal = new prom.Counter({
      name: 'http_requests_total',
      help: 'Total de peticiones HTTP',
      labelNames: ['method', 'route', 'status'],
      registers: [registry],
    });
    const httpRequestDuration = new prom.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duración de peticiones HTTP en segundos',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
      registers: [registry],
    });
    metrics = { loaded: true, prom, registry, httpRequestsTotal, httpRequestDuration };
  } catch (e) {
    // prom-client no está instalado; se omite sin romper
    metrics.loaded = false;
  }
}

// Middleware de métricas por petición (no-op si prom-client no está)
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    if (!metrics.loaded) return;
    try {
      const end = process.hrtime.bigint();
      const diffNs = Number(end - start);
      const durationSec = diffNs / 1e9;
      const method = req.method;
      const route = (req.route && req.route.path) || req.path || (req.originalUrl ? req.originalUrl.split('?')[0] : 'unknown');
      const status = String(res.statusCode || 0);
      metrics.httpRequestsTotal.labels(method, route, status).inc(1);
      metrics.httpRequestDuration.labels(method, route, status).observe(durationSec);
    } catch {}
  });
  next();
});

// Middleware para registrar cada petición entrante
app.use((req, _res, next) => {
  logger.info(`[${req.id || 'n/a'}] ${req.method} ${req.originalUrl}`);
  next();
});

// Para que Mailgun (form-urlencoded) sea aceptado
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Endpoint de métricas (activa prom-client si está disponible)
app.get('/metrics', async (_req, res) => {
  try {
    await ensureMetrics();
    if (!metrics.loaded) return res.status(503).send('metrics unavailable');
    res.setHeader('Content-Type', metrics.registry.contentType || 'text/plain');
    const text = await metrics.registry.metrics();
    res.status(200).send(text);
  } catch (e) {
    res.status(503).send('metrics error');
  }
});

// Rutas públicas (sin autenticación)
app.use('/api/mailgun/webhook', mailgunWebhookRouter); // Webhooks de Mailgun (verificación interna)
app.use('/api/inbound/mailgun', mailgunInboundRouter); // Correos entrantes
app.use('/api/rsvp', rsvpRouter); // Endpoints públicos por token para RSVP

// Rutas que requieren autenticación específica para correo
app.use('/api/mail', requireMailAccess, mailRouter);
app.use('/api/mail', mailOpsRouter);
app.use('/api/mail', mailStatsRouter);
app.use('/api/mail', mailSearchRouter);
app.use('/api/email-templates', optionalAuth, emailTemplatesRouter); // Plantillas de email

// IMPORTANTE: Las rutas más específicas (/api/mailgun/events) deben ir ANTES que las generales (/api/mailgun)
app.use('/api/mailgun/events', requireMailAccess, mailgunEventsRouter); // Eventos de Mailgun
app.use('/api/mailgun', optionalAuth, mailgunTestRouter); // Rutas generales de Mailgun (incluye /test)
app.use('/api/mailgun-debug', requireMailAccess, mailgunDebugRoutes);
app.use('/api/email-insights', requireMailAccess, emailInsightsRouter);

// Rutas que requieren autenticación general
app.use('/api/notifications', requireAuth, notificationsRouter);
app.use('/api/guests', requireAuth, guestsRouter);
app.use('/api/events', requireAuth, eventsRouter);
app.use('/api/roles', requireAuth, rolesRouter);
app.use('/api/ai-image', requireAuth, aiImageRouter);
app.use('/api/ai-suppliers', requireAuth, aiSuppliersRouter);
app.use('/api/ai', requireAuth, aiRouter);
app.use('/api/ai-assign', requireAuth, aiAssignRouter);
app.use('/api/ai-songs', requireAuth, aiSongsRouter);
app.use('/api/instagram-wall', optionalAuth, instagramWallRouter); // Puede ser público
// Alias para compatibilidad con frontend: /api/instagram/wall -> mismo router
app.use('/api/instagram/wall', optionalAuth, instagramWallRouter);
// Proxy de imágenes externas (evita hotlink+cors)
app.use('/api/image-proxy', imageProxyRouter);
app.use('/api/wedding-news', optionalAuth, weddingNewsRouter); // Puede ser público
// Public wedding site (GET public, POST publish with auth context)
app.use('/api/public/weddings', optionalAuth, publicWeddingRouter);
// Presupuestos de proveedores (aceptar/rechazar)
  app.use('/api/weddings', requireAuth, supplierBudgetRouter);
  // Supplier portal (public entry by token, handled inside router)
  app.use('/api/supplier-portal', supplierPortalRouter);
// Nuevos módulos transversales
app.use('/api/automation', automationRouter);
app.use('/api/legal-docs', requireAuth, legalDocsRouter);
app.use('/api/signature', requireAuth, signatureRouter);
app.use('/api/contacts', requireAuth, contactsRouter);
app.use('/api/gamification', requireAuth, gamificationRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/gdpr', gdprRouter);
app.use('/api/push', pushRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/payments', paymentsWebhookRouter);
app.use('/api/health', healthRouter);
app.use('/api/calendar', calendarFeedRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/playback', playbackRouter);

// Rutas de diagnóstico y test (públicas para debugging)
app.use('/api/diagnostic', diagnosticRouter);
app.use('/api/test', simpleTestRouter);
app.use('/api/metrics', metricsSeatingRouter);

app.get('/', (_req, res) => {
  res.send({ status: 'ok', service: 'lovenda-backend' });
});

// Health check explícito para plataformas de despliegue
app.get('/health', async (_req, res) => {
  try {
    let whatsapp = { configured: false, provider: 'unknown' };
    try {
      const mod = await import('./services/whatsappService.js');
      if (mod && typeof mod.providerStatus === 'function') {
        whatsapp = mod.providerStatus();
      }
    } catch {}
    res.status(200).json({ status: 'ok', whatsapp });
  } catch {
    res.status(200).json({ status: 'ok' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const { bankId, from, to } = req.query;

    // If Nordigen credentials missing, return mock data
    const { NORDIGEN_SECRET_ID, NORDIGEN_SECRET_KEY, NORDIGEN_BASE_URL } =
      process.env;
    if (!NORDIGEN_SECRET_ID || !NORDIGEN_SECRET_KEY) {
      return res.json([
        {
          id: 'txn_demo_1',
          amount: 120.5,
          currency: 'EUR',
          date: '2025-07-01',
          description: 'Mock transaction 1',
        },
      ]);
    }

    // 1. Get access token from Nordigen
    const tokenResp = await axios.post(
      `${NORDIGEN_BASE_URL}/token/new/`,
      {
        secret_id: NORDIGEN_SECRET_ID,
        secret_key: NORDIGEN_SECRET_KEY,
      }
    );

    const access = tokenResp.data.access;

    // 2. Build query params
    const params = new URLSearchParams();
    if (bankId) params.append('bankId', bankId);
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    // 3. Fetch transactions from your own aggregator endpoint or Nordigen endpoint directly
    const txnResp = await axios.get(
      `${NORDIGEN_BASE_URL}/accounts/${bankId}/transactions/?${params}`,
      {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      }
    );

    res.json(txnResp.data.transactions.booked);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// Serve public wedding site by subdomain, if configured
// Requires DNS: wildcard CNAME like *.sites.yourdomain -> backend
// Set PUBLIC_SITES_BASE_DOMAIN=sites.yourdomain
app.get('*', async (req, res, next) => {
  try {
    const base = (process.env.PUBLIC_SITES_BASE_DOMAIN || '').toLowerCase();
    if (!base) return next();
    const host = (req.headers.host || '').toLowerCase();
    // Ignore API and health/metrics paths
    if (req.path.startsWith('/api') || req.path.startsWith('/metrics') || req.path === '/health') return next();
    if (!host.endsWith(base)) return next();
    const sub = host.slice(0, -base.length).replace(/\.$/, '');
    if (!sub || sub.includes(':')) return next();
    // Exclusion list: comma-separated env PUBLIC_SITES_EXCLUDED_SUBDOMAINS
    const excluded = (process.env.PUBLIC_SITES_EXCLUDED_SUBDOMAINS || 'www,api,mail,mg,cdn,static,assets,admin').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
    if (excluded.includes(sub)) return next();
    // Lazy import to avoid circular
    const mod = await import('./routes/public-wedding.js');
    const html = await (mod.getHtmlForWeddingIdOrSlug ? mod.getHtmlForWeddingIdOrSlug(sub) : null);
    if (!html) return next();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (e) {
    return next();
  }
});

// 404 JSON handler
app.use((req, res) => {
  const id = req?.id || null;
  res.status(404).json({ success: false, error: { code: 'not_found', message: 'Not found' }, requestId: id });
});

// Middleware de manejo de errores
app.use((err, req, res, _next) => {
  try {
    const requestId = req?.id || null;
    const status = Number(err?.status || err?.statusCode || 500);
    const code = String(err?.code || 'internal_error');
    const message = String(err?.message || 'Internal server error');
    logger.error(`[${requestId || 'n/a'}] ${req?.method || ''} ${req?.originalUrl || ''} -> ${status} ${code}`, err);
    res.status(status).json({ success: false, error: { code, message }, requestId });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'internal_error', message: 'Internal server error' } });
  }
});

// Captura de errores globales para que se muestren en CMD
process.on('unhandledRejection', (reason) => {
  logger.error('UnhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('UncaughtException:', err);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Lovenda backend up on http://localhost:${PORT}`);
  });
}

export default app;



