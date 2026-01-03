// Express backend for MaLoveApp

// Provides:
//   GET /api/transactions - proxy or mock to bank aggregator (Nordigen)
//   Health check at /

import dotenv from 'dotenv';
// Cargar variables de entorno con precedencia clara (secret -> .env -> .env.local)
import fs from 'fs';
import path from 'path';

const secretEnvPath = '/etc/secrets/app.env';
const rootDir = process.cwd();
const envPath = path.resolve(rootDir, '.env');
const envLocalPath = path.resolve(rootDir, '.env.local');

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

if (!isTest) {
  if (fs.existsSync(secretEnvPath)) {
    dotenv.config({ path: secretEnvPath, override: false });
    console.log('[env] Variables de entorno cargadas desde secret file', secretEnvPath);
  }
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: !isProd });
    console.log('[env] .env loaded from', envPath);
  }
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true });
    console.log('[env] .env.local loaded from', envLocalPath);
  }
}
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import axios from 'axios';
import { http, requestWithRetry } from './utils/http.js';
import { randomUUID } from 'crypto';
// Importar middleware de autenticación (ESM) - debe cargarse antes que las rutas para inicializar Firebase Admin correctamente
import {
  requireAuth,
  requireAdmin,
  optionalAuth,
  requireMailAccess,
  requireSupplier
} from './middleware/authMiddleware.js';

import mailRouter from './routes/mail.js';
import mailOpsRouter from './routes/mail-ops.js';
import mailStatsRouter from './routes/mail-stats.js';
import mailSearchRouter from './routes/mail-search.js';
import aiRouter from './routes/ai.js';
import aiAssignRouter from './routes/ai-assign.js';
import aiImageRouter from './routes/ai-image.js';
import aiSearchRouter from './routes/ai-search.js';
import aiSuppliersRouter from './routes/ai-suppliers.js';
import aiSuppliersWebRouter from './routes/ai-suppliers-web.js';
import aiSuppliersRealRouter from './routes/ai-suppliers-real-search.js';
import aiSuppliersTavilyRouter from './routes/ai-suppliers-tavily.js';
import suppliersHybridRouter from './routes/suppliers-hybrid.js';
import suppliersRegisterRouter from './routes/suppliers-register.js';
import supplierRequestsRouter from './routes/supplier-requests.js';
import aiBudgetRouter from './routes/ai-budget.js';
import aiSongsRouter from './routes/ai-songs.js';
import aiWebsiteRouter from './routes/ai-website.js';
import emailInsightsRouter from './routes/email-insights.js';
import metricsSeatingRouter from './routes/metrics-seating.js';
import notificationsRouter from './routes/notifications.js';
// import guestsPostgresRouter from './routes/guests-postgres.js'; // Deshabilitado - ruta experimental
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
import testHelpersRouter from './routes/test-helpers.js';
import emailTemplatesRouter from './routes/email-templates.js';
import logger from './utils/logger.js';
import instagramWallRouter from './routes/instagram-wall.js';
import imageProxyRouter from './routes/image-proxy.js';
import proxyRouter from './routes/proxy.js';
import googlePlacesRouter from './routes/google-places.js';
import weddingNewsRouter from './routes/wedding-news.js';
import supplierPortalRouter from './routes/supplier-portal.js';
import supplierRegistrationRouter from './routes/supplier-registration.js';
import supplierDashboardRouter from './routes/supplier-dashboard.js';
import supplierMessagesRouter from './routes/supplier-messages.js';
import supplierAvailabilityRouter from './routes/supplier-availability.js';
import supplierPaymentsRouter from './routes/supplier-payments.js';
import supplierPublicRouter from './routes/supplier-public.js';
import supplierReviewsRouter from './routes/supplier-reviews.js';
import supplierQuoteRequestsRouter from './routes/supplier-quote-requests.js';
import supplierBudgetRouter from './routes/supplier-budget.js';
import userEmailAliasRouter from './routes/user-email-alias.js';
import supplierPortfolioRouter from './routes/supplier-portfolio.js';
import migrateSuppliersRouter from './routes/migrate-suppliers.js';
import publicWeddingRouter from './routes/public-wedding.js';
import weddingServicesRouter from './routes/wedding-services.js';
import rsvpRouter from './routes/rsvp.js';
import resendQuoteEmailRouter from './routes/resend-quote-email.js';
import automationRouter from './routes/automation.js';
import automationOrchestratorRouter from './routes/automation-orchestrator.js';
import emailAutomationRouter from './routes/email-automation.js';
import legalDocsRouter from './routes/legal-docs.js';
import plannersRouter from './routes/planners.js';
import signatureRouter from './routes/signature.js';
import contactsRouter from './routes/contacts.js';
import gamificationRouter from './routes/gamification.js';
import whatsappRouter from './routes/whatsapp.js';
import gdprRouter from './routes/gdpr.js';
import pushRouter from './routes/push.js';
import paymentsRouter from './routes/payments.js';
import paymentsWebhookRouter from './routes/payments-webhook.js';
import stripeRouter from './routes/stripe.js';
import stripeWebhookRouter from './routes/stripe-webhook.js';
import applePaymentsRouter from './routes/apple-payments.js';
import googlePaymentsRouter from './routes/google-payments.js';
import contractsRouter from './routes/contracts.js';
import healthRouter from './routes/health.js';
import calendarFeedRouter from './routes/calendar-feed.js';
import spotifyRouter from './routes/spotify.js';
import playbackRouter from './routes/playback.js';
import bankRouter from './routes/bank.js';
import emailActionsRouter from './routes/email-actions.js';
import emailsRouter from './routes/emails.js';
import emailDocsRouter from './routes/email-docs.js';
import emailFoldersRouter from './routes/email-folders.js';
import emailValidationRouter from './routes/email-validation.js';
import partnerStatsRouter from './routes/partner-stats.js';
import appStoreWebhookRouter from './routes/app-store-webhook.js';
import emailTagsRouter from './routes/email-tags.js';
import seatingPlanRouter from './routes/seating-plan.js';
import ceremonyRouter from './routes/ceremony.js';
import supplierGroupsRouter from './routes/supplier-groups.js';
import providersRouter from './routes/providers.js';
import favoritesRouter from './routes/favorites.js';
import projectMetricsRouter from './routes/project-metrics.js';
import weddingsRouter from './routes/weddings.js';
import usersRouter from './routes/users.js';
import userWeddingsRouter from './routes/user-weddings.js';
import taskTemplatesRouter from './routes/task-templates.js';
import mobileRouter from './routes/mobile.js';
import quoteRequestsRouter from './routes/quote-requests.js';
import adminQuoteRequestsRouter from './routes/admin-quote-requests.js';
import quoteResponsesRouter from './routes/quote-responses.js';
import quoteStatsRouter from './routes/quote-stats.js';
import quoteValidationRouter from './routes/quote-validation.js';
import suppliersAnalyzeWebRouter from './routes/suppliers-analyze-web.js';
import checklistRouter from './routes/checklist.js';
import geolocationRouter from './routes/geolocation.js';
import suppliersRouter from './routes/suppliers.js';

import ipAllowlist from './middleware/ipAllowlist.js';
import adminAuthRouter from './routes/admin-auth.js';
import adminSuppliersRouter from './routes/admin-suppliers.js';
import adminAuditRouter from './routes/admin-audit.js';
import blogRouter from './routes/blog.js';
import { cleanupExpiredFavorites } from './tasks/cleanupExpiredFavorites.js';
import adminAITraining from './routes/admin-ai-training.js';
import weddingDesignRouter from './routes/wedding-design.js';
import tasksRouter from './routes/tasks.js';
import timelineRouter from './routes/timeline.js';
import specialMomentsRouter from './routes/special-moments.js';
import transactionsRouter from './routes/transactions.js';
import budgetRouter from './routes/budget.js';
import weddingInfoRouter from './routes/wedding-info.js';
import authRouter from './routes/auth.js';

const {
  PORT,
  ALLOWED_ORIGINS,
  RATE_LIMIT_AI_MAX,
  RATE_LIMIT_GLOBAL_MAX,
  CORS_EXPOSE_HEADERS,
  ADMIN_IP_ALLOWLIST,
  WHATSAPP_WEBHOOK_RATE_LIMIT_MAX,
  MAILGUN_WEBHOOK_RATE_LIMIT_MAX,
  WHATSAPP_WEBHOOK_IP_ALLOWLIST,
  MAILGUN_WEBHOOK_IP_ALLOWLIST,
} = await import('./config.js');
if (!process.env.OPENAI_API_KEY) {
  console.warn('[env] OPENAI_API_KEY not set. Chat AI endpoints will return 500.');
}

// Puerto desde config centralizada (Render inyecta PORT)
// Ya se importa PORT desde config.js

const app = express();
// Detrás de proxy (Render) para que express-rate-limit use la IP correcta
app.set('trust proxy', 1);

// Timeout de red por defecto (evita cuelgues con integraciones externas)
try {
  axios.defaults.timeout = Number(process.env.AXIOS_TIMEOUT_MS || 10000);
} catch {}

// Compresión HTTP (gzip/br) para respuestas
app.use(compression());

// Seguridad básica
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// Configurar CORS por allowlist (coma-separado)
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      // log denegación sin detalles sensibles
      try {
        logger.warn(`[CORS] Origin no permitido: ${origin || 'n/a'}`);
      } catch {}
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Admin-Session',
      'x-admin-session',
      'X-Admin-Session-Token',
      'x-admin-session-token',
      'X-Admin-Token',
      'x-admin-token',
      'x-wedding-id',
      'X-Wedding-Id',
    ],
    exposedHeaders: CORS_EXPOSE_HEADERS,
    optionsSuccessStatus: 204,
  })
);

// Responder preflight explícitamente y cachear durante 10 minutos
app.options(
  '*',
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Admin-Session',
      'x-admin-session',
      'X-Admin-Session-Token',
      'x-admin-session-token',
      'X-Admin-Token',
      'x-admin-token',
      'x-wedding-id',
      'X-Wedding-Id',
    ],
    optionsSuccessStatus: 204,
    maxAge: 600,
  })
);

// Rate limiting: por defecto 120/min en producción, 0 en otros entornos (puede sobreescribirse con RATE_LIMIT_AI_MAX)
if (RATE_LIMIT_AI_MAX > 0) {
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: RATE_LIMIT_AI_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    // Limitar por usuario autenticado (uid); fallback a IP
    keyGenerator: (req, _res) => {
      try {
        const uid = req?.user?.uid || req?.userProfile?.uid;
        if (uid) return `uid:${uid}`;
      } catch {}
      const ip =
        req.ip ||
        (Array.isArray(req.ips) && req.ips[0]) ||
        req.headers['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        'unknown';
      return `ip:${ip}`;
    },
    message: { success: false, error: { code: 'rate_limit', message: 'Too many requests' } },
  });
  app.use('/api/ai', aiLimiter);
  app.use('/api/ai-image', aiLimiter);
  app.use('/api/ai-suppliers', aiLimiter);
  app.use('/api/ai-suppliers-web', aiLimiter);
  app.use('/api/ai-suppliers-real', aiLimiter);
  app.use('/api/ai-suppliers-tavily', aiLimiter);
  app.use('/api/suppliers', aiLimiter);
  app.use('/api/ai/budget-estimate', aiLimiter);
  app.use('/api/ai-website', aiLimiter);
}

// Rate limit global opcional (excluye health/metrics/vitals)
if (RATE_LIMIT_GLOBAL_MAX > 0) {
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: RATE_LIMIT_GLOBAL_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const p = req.path || '';
      return (
        p.startsWith('/api/health') || p.startsWith('/api/web-vitals') || p.startsWith('/metrics')
      );
    },
    keyGenerator: (req, _res) => {
      try {
        if (req?.user?.uid) return `uid:${req.user.uid}`;
      } catch {}
      const ip =
        req.ip ||
        (Array.isArray(req.ips) && req.ips[0]) ||
        req.headers['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        'unknown';
      return `ip:${ip}`;
    },
    message: { success: false, error: { code: 'rate_limit', message: 'Too many requests' } },
  });
  app.use('/api', globalLimiter);
}

// Middleware de correlación: X-Request-ID en cada petición
app.use((req, res, next) => {
  try {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && incoming.trim() ? incoming.trim() : randomUUID();
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
  httpErrorsTotal: null,
  httpResponseSize: null,
};

async function ensureMetrics() {
  if (metrics.loaded) return;
  try {
    const mod = await import('prom-client');
    const prom = mod.default || mod;
    const registry = new prom.Registry();
    // En entorno test no iniciamos métricas por defecto (crean timers/handles que impiden que Vitest termine)
    if (process.env.NODE_ENV !== 'test') {
      prom.collectDefaultMetrics({ register: registry });
    }
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
    const httpErrorsTotal = new prom.Counter({
      name: 'http_errors_total',
      help: 'Total de respuestas de error (>=400)',
      labelNames: ['method', 'route', 'status_class'],
      registers: [registry],
    });
    const httpResponseSize = new prom.Histogram({
      name: 'http_response_size_bytes',
      help: 'Tamaño de respuesta en bytes',
      labelNames: ['method', 'route', 'status'],
      buckets: [512, 1024, 4096, 16384, 65536, 262144, 1048576, 4194304],
      registers: [registry],
    });

    metrics = {
      loaded: true,
      prom,
      registry,
      httpRequestsTotal,
      httpRequestDuration,
      httpErrorsTotal,
      httpResponseSize,
    };
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
      const route =
        (req.route && req.route.path) ||
        req.path ||
        (req.originalUrl ? req.originalUrl.split('?')[0] : 'unknown');
      const status = String(res.statusCode || 0);
      metrics.httpRequestsTotal.labels(method, route, status).inc(1);
      metrics.httpRequestDuration.labels(method, route, status).observe(durationSec);
      // errores por clase
      const sc = Number(res.statusCode || 0);
      if (sc >= 400) {
        const cls = sc >= 500 ? '5xx' : '4xx';
        metrics.httpErrorsTotal.labels(method, route, cls).inc(1);
      }
      // tamaño de respuesta
      try {
        const lenHeader = res.getHeader('Content-Length');
        const bytes =
          typeof lenHeader === 'string'
            ? parseInt(lenHeader, 10)
            : typeof lenHeader === 'number'
              ? lenHeader
              : 0;
        if (Number.isFinite(bytes) && bytes >= 0) {
          metrics.httpResponseSize.labels(method, route, status).observe(bytes);
        }
      } catch {}
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
app.use(
  express.urlencoded({
    extended: true,
    parameterLimit: Number(process.env.BODY_PARAMETER_LIMIT || '1000'),
    limit: process.env.BODY_URLENCODED_LIMIT || '2mb',
  })
);
app.use(express.json({ limit: process.env.BODY_JSON_LIMIT || '1mb' }));

// Endpoint de métricas (activa prom-client si está disponible)
app.get('/metrics', requireAdmin, async (req, res) => {
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

// HTTP metrics summary for admin (JSON)
app.get(
  '/api/admin/metrics/http',
  ipAllowlist(ADMIN_IP_ALLOWLIST),
  requireAdmin,
  async (req, res) => {
    try {
      await ensureMetrics();
      if (!metrics.loaded) return res.status(503).json({ error: 'metrics-unavailable' });

      // Extract counters by method/route/status
      const totalMetric = metrics.httpRequestsTotal;
      const histMetric = metrics.httpRequestDuration;
      const totals = {};
      const byRoute = new Map(); // key: method|route

      try {
        const data = totalMetric?.get()?.values || [];
        for (const v of data) {
          if (!v || !v.labels) continue;
          const method = String(v.labels.method || 'GET');
          const route = String(v.labels.route || 'unknown');
          const status = String(v.labels.status || '0');
          const key = `${method} ${route}`;
          const entry = byRoute.get(key) || { method, route, total: 0, byStatus: {} };
          entry.total += Number(v.value || 0);
          entry.byStatus[status] = (entry.byStatus[status] || 0) + Number(v.value || 0);
          byRoute.set(key, entry);
        }
      } catch {}

      // Derive errors and averages from histogram buckets
      const hist = {};
      try {
        const values = histMetric?.get()?.values || [];
        for (const v of values) {
          const l = v.labels || {};
          const method = String(l.method || 'GET');
          const route = String(l.route || 'unknown');
          const status = String(l.status || '0');
          const key = `${method} ${route} ${status}`;
          const typ =
            typeof l.le !== 'undefined' ? 'bucket' : l.quantile ? 'quantile' : l.stat || 'value';
          const rec = hist[key] || { buckets: [], sum: 0, count: 0 };
          if (Object.prototype.hasOwnProperty.call(l, 'le')) {
            const le = Number(l.le);
            rec.buckets.push({ le, value: Number(v.value || 0) });
          } else if (l && l.hasOwnProperty('sum')) {
            rec.sum = Number(v.value || 0);
          } else if (l && l.hasOwnProperty('count')) {
            rec.count = Number(v.value || 0);
          }
          hist[key] = rec;
        }
      } catch {}

      // Compute per route stats aggregating by status
      const results = [];
      for (const [key, entry] of byRoute.entries()) {
        const [method, route] = key.split(' ', 2);
        let errors = 0;
        for (const [st, n] of Object.entries(entry.byStatus)) {
          const sc = Number(st);
          if (sc >= 400) errors += Number(n);
        }
        // Aggregate histogram across statuses for approximate avg/p95/p99
        let sum = 0,
          count = 0;
        const buckets = [];
        for (const st of Object.keys(entry.byStatus)) {
          const hkey = `${method} ${route} ${st}`;
          const rec = hist[hkey];
          if (!rec) continue;
          sum += rec.sum || 0;
          count += rec.count || 0;
          for (const b of rec.buckets || []) buckets.push(b);
        }
        // Merge buckets by le
        const bucketMap = new Map();
        for (const b of buckets) {
          const prev = bucketMap.get(b.le) || 0;
          bucketMap.set(b.le, prev + Number(b.value || 0));
        }
        const merged = Array.from(bucketMap.entries())
          .map(([le, value]) => ({ le: Number(le), value: Number(value) }))
          .sort((a, b) => a.le - b.le);
        const getPct = (p) => {
          if (!merged.length || count === 0) return 0;
          const target = p * count;
          let acc = 0;
          for (const b of merged) {
            acc += b.value;
            if (acc >= target) return b.le;
          }
          return merged[merged.length - 1].le;
        };
        const avg = count ? sum / count : 0;
        const p95 = getPct(0.95);
        const p99 = getPct(0.99);
        results.push({
          method,
          route,
          total: entry.total,
          errors,
          errorRate: entry.total ? errors / entry.total : 0,
          avg,
          p95,
          p99,
          byStatus: entry.byStatus,
        });
      }

      // Sort by total desc and limit
      const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
      results.sort((a, b) => b.total - a.total);
      const routes = results.slice(0, limit);

      const totalRequests = routes.reduce((s, r) => s + r.total, 0);
      const totalErrors = routes.reduce((s, r) => s + r.errors, 0);
      const errorRate = totalRequests ? totalErrors / totalRequests : 0;
      return res.json({
        routes,
        totals: { totalRequests, totalErrors, errorRate },
        timestamp: Date.now(),
      });
    } catch (e) {
      res.status(500).json({ error: 'http-metrics-failed' });
    }
  }
);

// Rutas públicas (sin autenticación)
// Allowlist y rate limit específico para webhooks
if (MAILGUN_WEBHOOK_IP_ALLOWLIST.length) {
  app.use('/api/mailgun/webhook', ipAllowlist(MAILGUN_WEBHOOK_IP_ALLOWLIST));
}
if (Number(MAILGUN_WEBHOOK_RATE_LIMIT_MAX) > 0) {
  const mailgunLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Number(MAILGUN_WEBHOOK_RATE_LIMIT_MAX),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const ip =
        req.ip ||
        (Array.isArray(req.ips) && req.ips[0]) ||
        req.headers['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        'unknown';
      return `ip:${ip}`;
    },
    message: 'Too many webhook requests',
  });
  app.use('/api/mailgun/webhook', mailgunLimiter);
}
app.use('/api/mailgun/webhook', mailgunWebhookRouter); // Webhooks de Mailgun (verificación interna)
app.use('/api/inbound/mailgun', mailgunInboundRouter); // Correos entrantes
app.use('/api/rsvp', rsvpRouter); // Endpoints públicos por token para RSVP
app.use('/api/task-templates', taskTemplatesRouter); // Plantillas de tareas (endpoint público para obtener activa)

// Rutas que requieren autenticación específica para correo
app.use('/api/mail', (req, res, next) => {
  console.error(`🚨 [INDEX] PRE-AUTH: ${req.method} ${req.url}`);
  next();
}, requireAuth, (req, res, next) => {
  console.error(`✅ [INDEX] POST-AUTH: ${req.method} ${req.url} user=${req.user?.uid}`);
  next();
}, mailRouter);
app.use('/api/mail', mailOpsRouter);
app.use('/api/mail', mailStatsRouter);
app.use('/api/mail', mailSearchRouter);
app.use('/api/email/folders', requireAuth, emailFoldersRouter);
app.use('/api/email/tags', requireAuth, emailTagsRouter);
app.use('/api/email/validate', requireAuth, emailValidationRouter); // Validación DKIM/SPF
app.use('/api/email', emailDocsRouter);
app.use('/api/email-templates', optionalAuth, emailTemplatesRouter); // Plantillas de email
// app.use('/api/email-alias', optionalAuth, emailAliasRouter); // COMENTADO: router no importado

// IMPORTANTE: Las rutas más específicas (/api/mailgun/events) deben ir ANTES que las generales (/api/mailgun)
app.use('/api/mailgun/events', requireMailAccess, mailgunEventsRouter); // Eventos de Mailgun
app.use('/api/mailgun', optionalAuth, mailgunTestRouter); // Rutas generales de Mailgun (incluye /test)
app.use('/api/mailgun-debug', requireMailAccess, mailgunDebugRoutes);
app.use('/api/email-insights', requireMailAccess, emailInsightsRouter);
// Emails API (alias de /api/mail con rutas adicionales)
app.use('/api/emails', requireMailAccess, emailsRouter);

// Rutas que requieren autenticación general
app.use('/api/notifications', requireAuth, notificationsRouter);
app.use('/api/guests', requireAuth, guestsRouter);
app.use('/api/checklist', requireAuth, checklistRouter);
app.use('/api/wedding-suppliers', requireAuth, suppliersRouter); // PostgreSQL suppliers
app.use('/api/events', requireAuth, eventsRouter);
app.use('/api/roles', requireAuth, rolesRouter);
app.use('/api/ai-image', requireAuth, aiImageRouter);
app.use('/api/ai-suppliers', requireAuth, aiSuppliersRouter);
app.use('/api/ai-suppliers-web', requireAuth, aiSuppliersWebRouter);
app.use('/api/ai-suppliers-real', requireAuth, aiSuppliersRealRouter);
app.use('/api/ai-suppliers-tavily', requireAuth, aiSuppliersTavilyRouter);
app.use('/api/google-places', googlePlacesRouter); // Proxy para Google Places API
app.use('/api/proxy', requireAuth, proxyRouter); // Proxy seguro para API keys (Translation, OpenAI, Tavily)
app.use('/api/suppliers', suppliersHybridRouter); // Búsqueda pública, sin auth
app.use('/api/suppliers', suppliersRegisterRouter); // No requiere auth para registro
app.use('/api/suppliers', supplierPublicRouter); // Portfolio público (sin auth)
app.use('/api/suppliers', supplierReviewsRouter); // Reseñas (público lectura, auth escritura)
app.use('/api/suppliers', supplierPortfolioRouter); // Catálogo de productos/servicios (requiere auth proveedor)
app.use('/api/suppliers', supplierQuoteRequestsRouter); // Solicitudes de presupuesto (público)
app.use('/api/quote-requests', supplierQuoteRequestsRouter); // Rutas públicas de respuesta de presupuestos
app.use('/api/suppliers', supplierRequestsRouter); // Solicitudes de presupuesto (legacy - mantener por compatibilidad)
app.use('/api', resendQuoteEmailRouter); // Reenviar emails de solicitudes de presupuesto (debug)
app.use('/api/suppliers', suppliersAnalyzeWebRouter); // Análisis web de proveedores (público)
app.use('/api/favorites', requireAuth, favoritesRouter); // Favoritos requiere auth
app.use('/api/ai/budget-estimate', requireAuth, aiBudgetRouter);
app.use('/api/ai/search', requireAuth, aiSearchRouter); // Búsqueda inteligente con IA
app.use('/api/ai', requireAuth, aiRouter);
app.use('/api/ai-assign', requireAuth, aiAssignRouter);
app.use('/api/ai-songs', requireAuth, aiSongsRouter);
app.use('/api/ai-website', requireAuth, aiWebsiteRouter);
app.use('/api/wedding-design', requireAuth, weddingDesignRouter); // Chat IA para diseño de boda
app.use('/api/instagram-wall', optionalAuth, instagramWallRouter); // Puede ser público
// Alias para compatibilidad con frontend: /api/instagram/wall -> mismo router
app.use('/api/instagram/wall', optionalAuth, instagramWallRouter);
// Proxy de imágenes externas (evita hotlink+cors)
// CORS liberal para contenido público (lectura desde apps externas)
const publicCors = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: CORS_EXPOSE_HEADERS,
  optionsSuccessStatus: 204,
  maxAge: 600,
});
app.options('/api/image-proxy', publicCors);
app.use('/api/image-proxy', publicCors, imageProxyRouter);
app.options('/api/wedding-news', publicCors);
app.use('/api/wedding-news', publicCors, weddingNewsRouter); // Público, sin verificar token
// Public wedding site (GET public, POST publish with auth context)
app.use('/api/public/weddings', optionalAuth, publicWeddingRouter);
// Presupuestos de proveedores (aceptar/rechazar)
app.use('/api/weddings', requireAuth, supplierBudgetRouter);
// Wedding services (asignar proveedores a servicios)
app.use('/api', weddingServicesRouter);
// Weddings general (autofix permisos, etc.)
app.use('/api/weddings', requireAuth, weddingsRouter);
app.use('/api/seating-plan', requireAuth, seatingPlanRouter);
app.use('/api/ceremony', requireAuth, ceremonyRouter);
app.use('/api/supplier-groups', requireAuth, supplierGroupsRouter);
app.use('/api/auth', authRouter);
app.use('/api/geolocation', geolocationRouter);
app.use('/api/user', requireAuth, userEmailAliasRouter);
app.use('/api/user', requireAuth, userWeddingsRouter);
app.use('/api/transactions', requireAuth, transactionsRouter);
app.use('/api/budget', requireAuth, budgetRouter);
app.use('/api/wedding-info', requireAuth, weddingInfoRouter);
// app.use('/api/crm', crmRouter); // COMENTADO: router no importado
// Supplier portal (public entry by token, handled inside router)
app.use('/api/supplier-portal', supplierPortalRouter);
// Supplier registration (public, no auth required)
app.use('/api/supplier-registration', supplierRegistrationRouter);
// Supplier dashboard (protected, JWT auth)
console.log('[index.js] Mounting supplier-dashboard router...');
app.use('/api/supplier-dashboard', supplierDashboardRouter);
console.log('[index.js] Supplier-dashboard router mounted successfully');
// Supplier Fase 3: Mensajería, Calendario y Pagos
app.use('/api/supplier-messages', supplierMessagesRouter);
app.use('/api/supplier-availability', supplierAvailabilityRouter);
app.use('/api/supplier-payments', supplierPaymentsRouter);
// Supplier requests (solicitudes de presupuesto)
app.use('/api/supplier-requests', supplierRequestsRouter);
// Supplier migration (temporal, para migrar proveedores existentes)
app.use('/api/migrate-suppliers', migrateSuppliersRouter);

// Nuevos módulos transversales
app.use('/api/automation', automationRouter);
app.use('/api/automation/orchestrator', automationOrchestratorRouter);
app.use('/api/email-automation', emailAutomationRouter);
app.use('/api/legal-docs', requireAuth, legalDocsRouter);
app.use('/api/planners', requireAuth, plannersRouter);
app.use('/api/signature', requireAuth, signatureRouter);
app.use('/api/contacts', requireAuth, contactsRouter);
app.use('/api/gamification', requireAuth, gamificationRouter);
app.use('/api/providers', requireAuth, providersRouter);
app.use('/api/users', requireAuth, usersRouter);
app.use('/api/project-metrics', requireAuth, projectMetricsRouter);
if (WHATSAPP_WEBHOOK_IP_ALLOWLIST.length) {
  app.use('/api/whatsapp/webhook/twilio', ipAllowlist(WHATSAPP_WEBHOOK_IP_ALLOWLIST));
}
if (Number(WHATSAPP_WEBHOOK_RATE_LIMIT_MAX) > 0) {
  const waLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Number(WHATSAPP_WEBHOOK_RATE_LIMIT_MAX),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const ip =
        req.ip ||
        (Array.isArray(req.ips) && req.ips[0]) ||
        req.headers['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        'unknown';
      return `ip:${ip}`;
    },
    message: 'Too many webhook requests',
  });
  app.use('/api/whatsapp/webhook/twilio', waLimiter);
}
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/gdpr', gdprRouter);
app.use('/api/push', pushRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/contracts', requireAuth, contractsRouter);
app.use('/api/payments', paymentsWebhookRouter);
// Stripe webhook (sin auth, debe ir ANTES que las rutas con auth)
app.use('/api/stripe', stripeWebhookRouter);
// Stripe checkout y suscripciones (requiere auth)
app.use('/api/stripe', requireAuth, stripeRouter);
// Apple In-App Purchases (webhooks sin auth, verify con auth)
app.use('/api/apple', applePaymentsRouter);
// Google Play Billing (webhooks sin auth, verify con auth)
app.use('/api/google', googlePaymentsRouter);
app.use('/api/health', healthRouter);
app.use('/health', healthRouter);
app.use('/api/calendar', calendarFeedRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/web-vitals', (await import('./routes/web-vitals.js')).default);
app.use('/api/weddings', (await import('./routes/wedding-metrics.js')).default);
app.use('/api/blog', blogRouter);
// Supplier options (crowdsourcing system)
app.use('/api/supplier-options', (await import('./routes/supplier-options.js')).default);
// Rutas de autenticación de administración (login/MFA/logout)
app.use('/api/admin', adminAuthRouter);
app.use(
  '/api/admin/suppliers',
  ipAllowlist(ADMIN_IP_ALLOWLIST),
  requireAdmin,
  adminSuppliersRouter
);
try {
  const adminBlogRouter = (await import('./routes/admin-blog.js')).default;
  app.use('/api/admin/blog', ipAllowlist(ADMIN_IP_ALLOWLIST), requireAdmin, adminBlogRouter);
  console.log('[backend] Admin blog routes mounted on /api/admin/blog');
} catch (error) {
  console.error('[backend] Failed to load admin blog routes:', error.message);
}
app.use('/api/admin/audit', ipAllowlist(ADMIN_IP_ALLOWLIST), requireAdmin, adminAuditRouter);
// Admin metrics dashboard API (solo admin) en ruta separada para no bloquear /api/metrics/* públicos
// Rutas de métricas y dashboard de admin
try {
  const metricsAdminRouter = (await import('./routes/metrics-admin.js')).default;
  app.use('/api/admin/metrics', ipAllowlist(ADMIN_IP_ALLOWLIST), requireAdmin, metricsAdminRouter);
  console.log('[backend] Admin metrics routes mounted on /api/admin/metrics');
} catch (error) {
  console.error('[backend] Failed to load admin metrics routes:', error.message);
}

try {
  const adminDashboardRouter = (await import('./routes/admin-dashboard.js')).default;
  app.use(
    '/api/admin/dashboard',
    ipAllowlist(ADMIN_IP_ALLOWLIST),
    requireAdmin,
    adminDashboardRouter
  );
  console.log('[backend] Admin dashboard routes mounted on /api/admin/dashboard');
} catch (error) {
  console.error('[backend] Failed to load admin dashboard routes:', error.message);
}

try {
  const adminAITrainingRouter = (await import('./routes/admin-ai-training.js')).default;
  app.use('/api/admin/ai-training', ipAllowlist(ADMIN_IP_ALLOWLIST), adminAITrainingRouter);
  console.log('[backend] Admin AI Training routes mounted on /api/admin/ai-training');
} catch (error) {
  console.error('[backend] Failed to load admin AI training routes:', error.message);
}

// Quote Requests routes
try {
  app.use('/api/quote-requests', requireAuth, quoteRequestsRouter);
  console.log('[backend] Quote requests routes mounted on /api/quote-requests');
} catch (error) {
  console.error('[backend] Failed to load quote requests routes:', error.message);
}

try {
  app.use(
    '/api/admin/quote-requests',
    ipAllowlist(ADMIN_IP_ALLOWLIST),
    requireAdmin,
    adminQuoteRequestsRouter
  );
  console.log('[backend] Admin quote requests routes mounted on /api/admin/quote-requests');
} catch (error) {
  console.error('[backend] Failed to load admin quote requests routes:', error.message);
}

// Quote Responses routes (presupuestos recibidos por email con IA)
try {
  app.use('/api/quote-responses', requireAuth, quoteResponsesRouter);
  console.log('[backend] Quote responses routes mounted on /api/quote-responses');
} catch (error) {
  console.error('[backend] Failed to load quote responses routes:', error.message);
}

// Quote Stats routes (estadísticas de presupuestos por categoría)
try {
  app.use('/api/quote-stats', quoteStatsRouter);
  console.log('[backend] Quote stats routes mounted on /api/quote-stats');
} catch (error) {
  console.error('[backend] Failed to load quote stats routes:', error.message);
}

// Quote Validation routes (validación y entrenamiento de IA)
try {
  app.use('/api/quote-validation', quoteValidationRouter);
  console.log('[backend] Quote validation routes mounted on /api/quote-validation');
} catch (error) {
  console.error('[backend] Failed to load quote validation routes:', error.message);
}

// Admin tasks - Limpieza de favoritos expirados
app.post('/api/admin/tasks/cleanup-favorites', requireAdmin, async (req, res) => {
  try {
    logger.info('[admin-tasks] Iniciando limpieza de favoritos expirados (manual)');
    const result = await cleanupExpiredFavorites();
    logger.info(
      `[admin-tasks] Limpieza completada: ${result.deleted} eliminados, ${result.errors} errores`
    );
    res.json({
      success: true,
      message: 'Limpieza de favoritos completada',
      ...result,
    });
  } catch (error) {
    logger.error('[admin-tasks] Error en limpieza de favoritos:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
console.log('[backend] Admin tasks endpoint mounted on /api/admin/tasks/cleanup-favorites');

// Fallback monitor (requiere autenticación, admins para stats)
try {
  const fallbackMonitorRouter = (await import('./routes/fallback-monitor.js')).default;
  app.use('/api/fallback-monitor', requireAuth, fallbackMonitorRouter);
  console.log('[backend] Fallback monitor routes mounted on /api/fallback-monitor');
} catch (error) {
  console.error('[backend] Failed to load fallback monitor routes:', error.message);
}

// Partner stats (público, solo requiere token válido)
app.use('/api/partner', partnerStatsRouter);
console.log('[backend] Partner stats routes mounted on /api/partner');

// App Store webhooks (público, recibe notificaciones de Apple)
app.use('/api/app-store', appStoreWebhookRouter);
console.log('[backend] App Store webhook routes mounted on /api/app-store');
app.use('/api/bank', requireAuth, bankRouter);
app.use('/api/email-actions', requireAuth, emailActionsRouter);
// Rutas de diagnóstico y test (públicas para debugging)
app.use('/api/diagnostic', diagnosticRouter);
app.use('/api/test', simpleTestRouter);
app.use('/api/test', testHelpersRouter); // Test helpers para E2E (solo en desarrollo)
app.use('/api/metrics', metricsSeatingRouter);

app.get('/', (_req, res) => {
  res.send({ status: 'ok', service: 'maloveapp-backend' });
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

    const { NORDIGEN_SECRET_ID, NORDIGEN_SECRET_KEY } = process.env;
    const STATIC_TOKEN =
      process.env.NORDIGEN_ACCESS_TOKEN ||
      process.env.GOCARDLESS_ACCESS_TOKEN ||
      process.env.BANK_ACCESS_TOKEN;
    const NORDIGEN_BASE_URL = process.env.NORDIGEN_BASE_URL || 'https://ob.gocardless.com/api/v2';
    if (!NORDIGEN_SECRET_ID && !NORDIGEN_SECRET_KEY && !STATIC_TOKEN) {
      return res.status(500).json({
        error: 'missing-bank-credentials',
        message:
          'No se encontraron credenciales válidas para el agregador bancario. Configura las variables de entorno requeridas.',
      });
    }

    // 1. Get access token from Nordigen/GoCardless (or use static token if set)
    const access =
      STATIC_TOKEN ||
      (
        await requestWithRetry(() =>
          http.post(`${NORDIGEN_BASE_URL}/token/new/`, {
            secret_id: NORDIGEN_SECRET_ID,
            secret_key: NORDIGEN_SECRET_KEY,
          })
        )
      ).data.access;

    // 2. Build query params
    const params = new URLSearchParams();
    if (bankId) params.append('bankId', bankId);
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    // 3. Fetch transactions from your own aggregator endpoint or Nordigen endpoint directly
    const txnResp = await requestWithRetry(() =>
      http.get(`${NORDIGEN_BASE_URL}/accounts/${bankId}/transactions/?${params}`, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      })
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
    if (req.path.startsWith('/api') || req.path.startsWith('/metrics') || req.path === '/health')
      return next();
    if (!host.endsWith(base)) return next();
    const sub = host.slice(0, -base.length).replace(/\.$/, '');
    if (!sub || sub.includes(':')) return next();
    // Exclusion list: comma-separated env PUBLIC_SITES_EXCLUDED_SUBDOMAINS
    const excluded = (
      process.env.PUBLIC_SITES_EXCLUDED_SUBDOMAINS || 'www,api,mail,mg,cdn,static,assets,admin'
    )
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
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
  res
    .status(404)
    .json({ success: false, error: { code: 'not_found', message: 'Not found' }, requestId: id });
});

// Middleware de manejo de errores
app.use((err, req, res, _next) => {
  try {
    const requestId = req?.id || null;
    const status = Number(err?.status || err?.statusCode || 500);
    const code = String(err?.code || 'internal_error');
    const message = String(err?.message || 'Internal server error');
    const uid = req?.user && req.user.uid ? req.user.uid : 'anon';
    logger.error(
      `[${requestId || 'n/a'}] uid:${uid} ${req?.method || ''} ${req?.originalUrl || ''} -> ${status} ${code}`,
      err
    );
    res.status(status).json({ success: false, error: { code, message }, requestId });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: { code: 'internal_error', message: 'Internal server error' },
    });
  }
});

// Captura de errores globales para que se muestren en CMD
if (!globalThis.__malove_backend_process_handlers_registered) {
  globalThis.__malove_backend_process_handlers_registered = true;
  process.on('unhandledRejection', (reason) => {
    logger.error('UnhandledRejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    logger.error('UncaughtException:', err);
  });
}

// TODO: Crear índice en Firestore antes de habilitar
// https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes
// startEmailSchedulerWorker();

if (process.env.NODE_ENV !== 'test') {
  try {
    const mod = await import('./workers/metricAggregatorWorker.js');
    if (mod && typeof mod.startMetricAggregatorWorker === 'function') {
      mod.startMetricAggregatorWorker();
    }
  } catch (e) {
    try {
      logger.error('Failed to start metric aggregator worker', e);
    } catch {}
  }

  try {
    const mod = await import('./workers/momentosCleanupWorker.js');
    if (mod && typeof mod.startMomentosCleanupWorker === 'function') {
      mod.startMomentosCleanupWorker();
    }
  } catch (e) {
    try {
      logger.error('Failed to start momentos cleanup worker', e);
    } catch {}
  }

  try {
    const mod = await import('./workers/momentosModerationWorker.js');
    if (mod && typeof mod.startMomentosModerationWorker === 'function') {
      mod.startMomentosModerationWorker();
    }
  } catch (e) {
    try {
      logger.error('Failed to start momentos moderation worker', e);
    } catch {}
  }

  try {
    const mod = await import('./workers/blogAutomationWorker.js');
    if (mod && typeof mod.startBlogAutomationWorker === 'function') {
      mod.startBlogAutomationWorker();
    }
  } catch (e) {
    try {
      logger.error('Failed to start blog automation worker', e);
    } catch {}
  }
}

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`MaLoveApp backend up on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    logger.error('Server listen error:', err);
    process.exit(1);
  });
}

export default app;
