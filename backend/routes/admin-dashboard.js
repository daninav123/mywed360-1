import express from 'express';
import admin from 'firebase-admin';
import { z } from 'zod';

import { db } from '../db.js';
import logger from '../utils/logger.js';
import { createMailgunClients } from './mail/clients.js';
import { normalizeCommissionRules, calculateCommission } from '../utils/commission.js';

const toSafeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const estimateCommissionFromRules = (rules, revenueValue) => {
  if (!rules || !Array.isArray(rules.periods) || rules.periods.length === 0) return 0;
  const revenue = toSafeNumber(revenueValue);
  const tiers = [];

  for (const period of rules.periods) {
    if (!period || !Array.isArray(period.tiers)) continue;
    for (const tier of period.tiers) {
      if (tier) tiers.push(tier);
    }
  }

  if (!tiers.length) return 0;

  const pickTier = (predicate) =>
    tiers.filter(predicate).reduce((best, tier) => {
      if (!best) return tier;
      return toSafeNumber(tier.minRevenue) >= toSafeNumber(best.minRevenue) ? tier : best;
    }, null);

  let chosen = pickTier((tier) => {
    const min = toSafeNumber(tier.minRevenue);
    const max =
      tier.maxRevenue === null || tier.maxRevenue === undefined
        ? Infinity
        : toSafeNumber(tier.maxRevenue, Infinity);
    return revenue >= min && revenue <= max;
  });

  if (!chosen) {
    chosen = pickTier((tier) => revenue >= toSafeNumber(tier.minRevenue));
  }

  if (!chosen) {
    chosen = tiers.reduce((best, tier) => {
      if (!best) return tier;
      return toSafeNumber(tier.minRevenue) >= toSafeNumber(best.minRevenue) ? tier : best;
    }, null);
  }

  if (!chosen) return 0;

  const percentage = toSafeNumber(chosen.percentage);
  const fixedAmount = toSafeNumber(chosen.fixedAmount);
  return revenue * percentage + fixedAmount;
};

const safeTrim = (value) => (typeof value === 'string' ? value.trim() : '');

const sanitizeContactInput = (input) => {
  if (!input || typeof input !== 'object') return null;

  const idRaw = input.id ?? input.contactId ?? input.uid ?? null;
  let id = null;
  if (typeof idRaw === 'string' && idRaw.trim()) {
    id = idRaw.trim();
  } else if (Number.isFinite(idRaw)) {
    id = String(idRaw);
  }

  const name = safeTrim(input.name || '');
  const email = safeTrim(input.email || '');
  const phone = safeTrim(input.phone || '');
  const notes = safeTrim(input.notes || '');
  const status = safeTrim(input.status || '');

  if (!id && !name && !email && !phone && !notes) {
    return null;
  }

  return {
    id: id || null,
    name: name || null,
    email: email || null,
    phone: phone || null,
    notes: notes || null,
    status: status || 'active',
  };
};

const contactKey = (contact) => {
  if (!contact || typeof contact !== 'object') return null;
  if (contact.id) return String(contact.id);
  if (contact.email) return contact.email.toLowerCase();
  if (contact.name) return contact.name.toLowerCase();
  if (contact.phone) return contact.phone.replace(/\s+/g, '');
  return null;
};

function formatMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthlyBuckets(months = 12) {
  const buckets = [];
  const index = new Map();
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const base = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = formatMonthKey(base);
    const bucket = { month: key, value: 0 };
    buckets.push(bucket);
    index.set(key, bucket);
  }
  return { buckets, index };
}

function recordMonthlyValue(index, dateValue, amount = 1) {
  const date = toDate(dateValue);
  if (!date) return false;
  const key = formatMonthKey(date);
  if (!index.has(key)) return false;
  index.get(key).value += amount;
  return true;
}

const hydrateSalesManager = (raw, directory = null) => {
  const sanitized = sanitizeContactInput(raw);
  if (!sanitized) return null;
  if (directory && directory instanceof Map) {
    const candidates = [
      sanitized.id,
      sanitized.email ? sanitized.email.toLowerCase() : null,
      sanitized.name ? sanitized.name.toLowerCase() : null,
      sanitized.phone ? sanitized.phone.replace(/\s+/g, '') : null,
    ].filter(Boolean);
    for (const key of candidates) {
      if (directory.has(key)) {
        return directory.get(key);
      }
    }
  }
  return {
    id: sanitized.id || null,
    name: sanitized.name || '',
    email: sanitized.email || '',
    phone: sanitized.phone || '',
    notes: sanitized.notes || '',
    status: sanitized.status || 'active',
  };
};

const toIsoString = (value) => {
  const date = toDate(value);
  return date ? date.toISOString() : null;
};

const router = express.Router();

const MAX_LIMIT = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

const collections = {
  metrics: () => db.collection('adminMetrics'),
  serviceStatus: () => db.collection('adminServiceStatus'),
  alerts: () => db.collection('adminAlerts'),
  tasks: () => db.collection('adminTasks'),
  weddings: () => db.collection('weddings'),
  weddingsGroup: () => db.collectionGroup('weddings'),
  users: () => db.collection('users'),
  incidents: () => db.collection('adminIncidents'),
  featureFlags: () => db.collection('featureFlags'),
  secrets: () => db.collection('_system').doc('config').collection('secrets'),
  templates: () => db.collection('_system').doc('config').collection('templates'),
  broadcasts: () => db.collection('_system').doc('config').collection('broadcasts'),
  auditLogs: () => db.collection('_system').doc('config').collection('auditLogs'),
  reports: () => db.collection('_system').doc('config').collection('reports'),
  supportSummary: () => db.collection('_system').doc('config').collection('supportSummary'),
  supportTickets: () => db.collection('_system').doc('config').collection('supportTickets'),
  // Datos operativos reales
  payments: () => db.collection('_system').doc('config').collection('payments'),
  appDownloads: () => db.collection('appDownloads'),
  appDownloadEvents: () => db.collection('appDownloadEvents'),
  mobileDownloads: () => db.collection('mobileDownloads'),
  analyticsAppDownloads: () => db.collection('analyticsAppDownloads'),
  webVisits: () => db.collection('webVisits'),
  analyticsWebVisits: () => db.collection('analyticsWebVisits'),
  // Colección compuesta de tareas creadas por usuarios en bodas
  tasksGroup: () => db.collectionGroup('tasks'),
  // Plantillas de tareas administrativas
  taskTemplates: () => db.collection('adminTaskTemplates'),
  // Descuentos/códigos promocionales (nueva ubicación en _system)
  discountLinks: () => db.collection('_system').doc('config').collection('discounts'),
  salesManagers: () => db.collection('salesManagers'),
  salesCommercials: () => db.collection('salesCommercials'),
};

const LIVE_STATUS_TTL_MS = 3 * 60 * 1000;
const serviceStatusCache = new Map();

const truncateNote = (value) => {
  if (!value) return '';
  const normalized = String(value).trim();
  return normalized.length > 200 ? `${normalized.slice(0, 197)}&` : normalized;
};

async function getCachedServiceStatus(key, provider) {
  const cached = serviceStatusCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }
  try {
    const value = await provider();
    serviceStatusCache.set(key, { value, expiresAt: now + LIVE_STATUS_TTL_MS });
    return value;
  } catch (error) {
    logger.warn(`[admin-dashboard] service status check failed for ${key}`, {
      message: error?.message,
    });
    const fallback = {
      id: key,
      name: key,
      status: 'down',
      latency: null,
      incidents: 1,
      note: truncateNote(error?.message || 'unknown error'),
      lastCheckedAt: new Date().toISOString(),
    };
    serviceStatusCache.set(key, { value: fallback, expiresAt: now + LIVE_STATUS_TTL_MS });
    return fallback;
  }
}

// Verificar Firebase
async function fetchFirebaseStatus() {
  const startedAt = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Intenta leer una colecci�n para verificar conectividad
    const testRef = db.collection('serviceStatus').limit(1);
    await testRef.get();
    const elapsed = Date.now() - startedAt;

    return {
      id: 'firebase',
      name: 'Firebase',
      status: 'operational',
      latency: `${elapsed}ms`,
      incidents: 0,
      note: '',
      lastCheckedAt: timestamp,
    };
  } catch (error) {
    return {
      id: 'firebase',
      name: 'Firebase',
      status: 'down',
      latency: null,
      incidents: 1,
      note: truncateNote(error?.message || 'Firebase connection failed'),
      lastCheckedAt: timestamp,
    };
  }
}

// Verificar Mailgun
async function fetchMailgunStatus() {
  const startedAt = Date.now();
  const timestamp = new Date().toISOString();
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    return {
      id: 'mailgun',
      name: 'Mailgun',
      status: 'down',
      latency: null,
      incidents: 1,
      note: 'MAILGUN_API_KEY o MAILGUN_DOMAIN no configurados',
      lastCheckedAt: timestamp,
    };
  }

  try {
    // Verificar dominio en Mailgun
    const response = await fetch(`https://api.mailgun.net/v3/domains/${domain}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
    });
    const elapsed = Date.now() - startedAt;

    if (response.ok) {
      return {
        id: 'mailgun',
        name: 'Mailgun',
        status: 'operational',
        latency: `${elapsed}ms`,
        incidents: 0,
        note: '',
        lastCheckedAt: timestamp,
      };
    }

    let note = `Mailgun respondi� ${response.status}`;
    try {
      const data = await response.json();
      note = data?.message || note;
    } catch {}

    return {
      id: 'mailgun',
      name: 'Mailgun',
      status: response.status === 401 ? 'down' : 'degraded',
      latency: null,
      incidents: 1,
      note: truncateNote(note),
      lastCheckedAt: timestamp,
    };
  } catch (error) {
    return {
      id: 'mailgun',
      name: 'Mailgun',
      status: 'down',
      latency: null,
      incidents: 1,
      note: truncateNote(error?.message || 'Mailgun connection failed'),
      lastCheckedAt: timestamp,
    };
  }
}

// Verificar WhatsApp (Twilio)
async function fetchWhatsAppStatus() {
  const startedAt = Date.now();
  const timestamp = new Date().toISOString();
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return {
      id: 'whatsapp',
      name: 'WhatsApp',
      status: 'down',
      latency: null,
      incidents: 1,
      note: 'TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN no configurados',
      lastCheckedAt: timestamp,
    };
  }

  try {
    // Verificar cuenta de Twilio
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      },
    });
    const elapsed = Date.now() - startedAt;

    if (response.ok) {
      const data = await response.json();
      // Verificar que la cuenta est� activa
      if (data.status === 'active') {
        return {
          id: 'whatsapp',
          name: 'WhatsApp',
          status: 'operational',
          latency: `${elapsed}ms`,
          incidents: 0,
          note: '',
          lastCheckedAt: timestamp,
        };
      } else {
        return {
          id: 'whatsapp',
          name: 'WhatsApp',
          status: 'degraded',
          latency: `${elapsed}ms`,
          incidents: 1,
          note: `Cuenta Twilio en estado: ${data.status}`,
          lastCheckedAt: timestamp,
        };
      }
    }

    let note = `Twilio respondi� ${response.status}`;
    try {
      const data = await response.json();
      note = data?.message || note;
    } catch {}

    return {
      id: 'whatsapp',
      name: 'WhatsApp',
      status: response.status === 401 ? 'down' : 'degraded',
      latency: null,
      incidents: 1,
      note: truncateNote(note),
      lastCheckedAt: timestamp,
    };
  } catch (error) {
    return {
      id: 'whatsapp',
      name: 'WhatsApp',
      status: 'down',
      latency: null,
      incidents: 1,
      note: truncateNote(error?.message || 'WhatsApp/Twilio connection failed'),
      lastCheckedAt: timestamp,
    };
  }
}

async function fetchOpenAIStatus() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  const projectId = process.env.OPENAI_PROJECT_ID || process.env.VITE_OPENAI_PROJECT_ID;
  const startedAt = Date.now();
  const timestamp = new Date().toISOString();

  if (!apiKey) {
    return {
      id: 'openai',
      name: 'OpenAI',
      status: 'down',
      latency: null,
      incidents: 1,
      note: 'OPENAI_API_KEY no est� configurada',
      lastCheckedAt: timestamp,
    };
  }

  try {
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };
    if (projectId) {
      headers['OpenAI-Project'] = projectId;
    }
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers,
    });
    const elapsed = Date.now() - startedAt;

    if (response.ok) {
      return {
        id: 'openai',
        name: 'OpenAI',
        status: 'operational',
        latency: `${elapsed}ms`,
        incidents: 0,
        note: '',
        lastCheckedAt: timestamp,
      };
    }

    let rawBody = '';
    try {
      rawBody = await response.text();
    } catch {}

    let note = `OpenAI respondi� ${response.status}`;
    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody);
        note = parsed?.error?.message || parsed?.message || note;
      } catch {
        note = rawBody;
      }
    }

    const status = response.status === 401 || response.status === 403 ? 'down' : 'degraded';

    return {
      id: 'openai',
      name: 'OpenAI',
      status,
      latency: status === 'operational' ? `${elapsed}ms` : null,
      incidents: status === 'operational' ? 0 : 1,
      note: truncateNote(note),
      lastCheckedAt: timestamp,
    };
  } catch (error) {
    return {
      id: 'openai',
      name: 'OpenAI',
      status: 'down',
      latency: null,
      incidents: 1,
      note: truncateNote(error?.message),
      lastCheckedAt: timestamp,
    };
  }
}

async function computeLiveServiceOverrides() {
  const overrides = [];

  // Verificar todos los servicios en paralelo
  const [firebaseStatus, mailgunStatus, whatsappStatus, openaiStatus] = await Promise.all([
    getCachedServiceStatus('firebase', fetchFirebaseStatus),
    getCachedServiceStatus('mailgun', fetchMailgunStatus),
    getCachedServiceStatus('whatsapp', fetchWhatsAppStatus),
    getCachedServiceStatus('openai', fetchOpenAIStatus),
  ]);

  if (firebaseStatus) overrides.push(firebaseStatus);
  if (mailgunStatus) overrides.push(mailgunStatus);
  if (whatsappStatus) overrides.push(whatsappStatus);
  if (openaiStatus) overrides.push(openaiStatus);

  return overrides;
}

function toDate(value) {
  try {
    if (!value) return null;

    // 1. Objeto con _seconds (Timestamp serializado de Firestore)
    if (value._seconds !== undefined) {
      return new Date(value._seconds * 1000);
    }

    // 2. Timestamp de Firestore con método toDate()
    if (value.toDate && typeof value.toDate === 'function') {
      try {
        return value.toDate();
      } catch (e) {
        console.warn('[toDate] Error calling toDate():', e.message);
        return null;
      }
    }

    // 3. Ya es un objeto Date
    if (value instanceof Date) return value;

    // 4. Timestamp Unix (número)
    if (typeof value === 'number') return new Date(value);

    // 5. String ISO (YYYY-MM-DD o ISO 8601)
    if (typeof value === 'string') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }

    return null;
  } catch (error) {
    console.warn('[toDate] Unexpected error:', error.message);
    return null;
  }
}

function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDateOnly(value) {
  const date = toDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDateParam(value, endOfDay = false) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  } catch {
    return null;
  }
}

function normalizeNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(amount, currency = 'EUR') {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(0);
  }
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(numeric);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeStringValue(value) {
  if (value == null) return '';
  return String(value).trim();
}

// Helpers adicionales
function stripDiacritics(str) {
  try {
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  } catch {
    return String(str || '').toLowerCase();
  }
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

async function aggregateDailyRevenue(days = 30) {
  const out = [];
  const today = startOfDay(new Date());
  const since = addDays(today, -Math.max(1, days) + 1);
  for (let i = 0; i < days; i += 1) {
    const day = addDays(since, i);
    const dayEnd = addDays(day, 1);
    const dayStartTs = admin.firestore.Timestamp.fromDate(day);
    const dayEndTs = admin.firestore.Timestamp.fromDate(dayEnd);
    let total = 0;
    for (const field of ['updatedAt', 'createdAt']) {
      for (const status of ['paid', 'succeeded']) {
        try {
          const docs = await fetchDocuments(
            () => collections.payments(),
            [
              { field: 'status', op: '==', value: status },
              { field, op: '>=', value: dayStartTs },
              { field, op: '<', value: dayEndTs },
            ],
            1000
          );
          docs.forEach((doc) => {
            const data = doc.data() || {};
            const amount = Number(data.amount ?? data.total ?? 0);
            if (Number.isFinite(amount)) total += amount;
          });
        } catch {
          // best-effort
        }
      }
      if (total > 0) break;
    }
    out.push({ date: formatDateOnly(day), value: total });
  }
  return out;
}

async function aggregateDailyActiveUsers(days = 30) {
  const out = [];
  const today = startOfDay(new Date());
  const since = addDays(today, -Math.max(1, days) + 1);
  for (let i = 0; i < days; i += 1) {
    const day = addDays(since, i);
    const dayEnd = addDays(day, 1);
    const dayStartTs = admin.firestore.Timestamp.fromDate(day);
    const dayEndTs = admin.firestore.Timestamp.fromDate(dayEnd);
    let count = 0;
    try {
      count = await countDocuments(
        collections.users,
        [
          { field: 'lastLoginAt', op: '>=', value: dayStartTs },
          { field: 'lastLoginAt', op: '<', value: dayEndTs },
        ],
        5000
      );
    } catch {
      count = 0;
    }
    out.push({ date: formatDateOnly(day), value: count });
  }
  return out;
}

function canonicalizeTaskTitle(title) {
  const base = stripDiacritics(title)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const stopwords = new Set([
    'el',
    'la',
    'los',
    'las',
    'de',
    'del',
    'para',
    'por',
    'y',
    'o',
    'un',
    'una',
    'con',
    'en',
    'al',
    'a',
    'que',
    'se',
    'un@',
    '@',
  ]);
  const words = base.split(' ').filter((w) => w && !stopwords.has(w));
  return words.join(' ').trim();
}

function toTitleCase(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (t) => t.toUpperCase());
}

function extractWeddingIdFromPath(pathStr) {
  try {
    const parts = String(pathStr || '').split('/');
    const idx = parts.indexOf('weddings');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch {}
  return null;
}

function applyConstraints(ref, constraints = []) {
  return constraints.reduce((query, constraint) => {
    if (!constraint || !constraint.field) return query;
    const operator = constraint.op || constraint.operator || '==';
    return query.where(constraint.field, operator, constraint.value);
  }, ref);
}

async function fetchDocuments(factory, constraints = [], limit = MAX_LIMIT, selectFields = null) {
  if (typeof factory !== 'function') return [];
  let query = applyConstraints(factory(), constraints);
  if (Array.isArray(selectFields) && selectFields.length) {
    query = query.select(...selectFields);
  }
  if (limit) {
    query = query.limit(Math.min(limit, MAX_LIMIT));
  }
  const snap = await query.get();
  if (snap.empty) return [];
  return snap.docs;
}

async function countDocuments(factory, constraints = [], limit = 1000) {
  if (typeof factory !== 'function') return 0;
  try {
    const aggregation = await applyConstraints(factory(), constraints).count().get();
    const data = aggregation.data();
    if (data && typeof data.count === 'number') return data.count;
  } catch (error) {
    logger.warn('[admin-dashboard] aggregation count fallback', { message: error?.message });
  }

  try {
    const docs = await fetchDocuments(factory, constraints, limit);
    return docs.length;
  } catch (error) {
    logger.warn('[admin-dashboard] countDocuments fallback failed', { message: error?.message });
    return 0;
  }
}

function serverTs() {
  return admin.firestore.FieldValue.serverTimestamp();
}

function getActor(req) {
  try {
    return String(req?.userProfile?.email || req?.user?.email || 'admin@maloveapp.com');
  } catch {
    return 'admin@maloveapp.com';
  }
}

async function writeAdminAudit(req, action, details = {}) {
  try {
    await collections.auditLogs().add({
      action: String(action || ''),
      actor: getActor(req),
      resourceType: details.resourceType || '',
      resourceId: details.resourceId || '',
      payload: details.payload || null,
      createdAt: serverTs(),
    });
  } catch (e) {
    logger.warn('[admin-dashboard] audit write failed', { action, message: e?.message });
  }
}

async function getUserWeddingCount(uid) {
  try {
    const agg = await db.collection('users').doc(uid).collection('weddings').count().get();
    const data = agg.data();
    if (data && typeof data.count === 'number') return data.count;
  } catch (error) {
    logger.warn('[admin-dashboard] user wedding count aggregate failed', {
      uid,
      message: error?.message,
    });
  }
  try {
    const snap = await db.collection('users').doc(uid).collection('weddings').limit(500).get();
    return snap.size;
  } catch (error) {
    logger.warn('[admin-dashboard] user wedding count fallback failed', {
      uid,
      message: error?.message,
    });
    return 0;
  }
}

function extractKpis(metricsDoc) {
  if (!metricsDoc) return [];
  if (Array.isArray(metricsDoc.kpis) && metricsDoc.kpis.length) {
    return metricsDoc.kpis;
  }

  const source = metricsDoc.meta || {};
  const kpis = [];

  const addKpi = (id, label, value, options = {}) => {
    if (value == null) return;
    kpis.push({
      id,
      label,
      value: options.formatCurrency ? formatCurrency(value, options.currency) : value,
      trend: null,
      testId: options.testId,
    });
  };

  addKpi(
    'active-weddings',
    'Bodas activas',
    source.activeWeddings ?? metricsDoc.activeWeddings ?? metricsDoc.activeWeddingsNow,
    { testId: 'admin-kpi-active-weddings' }
  );
  addKpi(
    'revenue-30d',
    'Facturación (30 días)',
    source.revenue30d ?? metricsDoc.revenue30d ?? metricsDoc.estimatedRevenue,
    { formatCurrency: true, testId: 'admin-kpi-revenue-30d' }
  );
  addKpi(
    'downloads-30d',
    'Descargas app (30 días)',
    source.downloads30d ?? metricsDoc.downloads30d,
    { testId: 'admin-kpi-downloads-30d' }
  );
  addKpi('open-alerts', 'Alertas activas', source.openAlerts ?? metricsDoc.openAlerts, {
    testId: 'admin-kpi-open-alerts',
  });

  return kpis;
}

function defaultKpis() {
  return [
    {
      id: 'active-weddings',
      testId: 'admin-kpi-active-weddings',
      label: 'Bodas activas',
      value: 0,
      trend: null,
    },
    {
      id: 'revenue-30d',
      testId: 'admin-kpi-revenue-30d',
      label: 'Facturación (30 días)',
      value: formatCurrency(0),
      trend: null,
    },
    {
      id: 'downloads-30d',
      testId: 'admin-kpi-downloads-30d',
      label: 'Descargas app (30 días)',
      value: 0,
      trend: null,
    },
    {
      id: 'open-alerts',
      testId: 'admin-kpi-open-alerts',
      label: 'Alertas activas',
      value: 0,
      trend: null,
    },
  ];
}

function extractServices(metricsDoc, servicesDocs) {
  if (servicesDocs && servicesDocs.length) {
    return servicesDocs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        name: data.name || data.service || doc.id,
        status: data.status || 'operational',
        latency: data.latency ? String(data.latency) : null,
        incidents: normalizeNumber(data.incidents) ?? 0,
      };
    });
  }

  if (Array.isArray(metricsDoc?.servicesHealth)) {
    return metricsDoc.servicesHealth.map((service, idx) => ({
      id: service.id || `service-${idx}`,
      name: service.name || `Servicio ${idx + 1}`,
      status: service.status || 'operational',
      latency: service.latency ? String(service.latency) : null,
      incidents: normalizeNumber(service.incidents) ?? 0,
    }));
  }

  return [];
}

function defaultServices() {
  return [
    { id: 'firebase', name: 'Firebase', status: 'operational', latency: '�', incidents: 0 },
    { id: 'mailgun', name: 'Mailgun', status: 'operational', latency: '�', incidents: 0 },
    { id: 'whatsapp', name: 'WhatsApp', status: 'operational', latency: '�', incidents: 0 },
    { id: 'openai', name: 'OpenAI', status: 'operational', latency: '�', incidents: 0 },
  ];
}

function mergeServiceOverrides(baseList, overrides) {
  const base = Array.isArray(baseList) ? baseList.slice() : [];
  if (!Array.isArray(overrides) || overrides.length === 0) return base;

  const overrideMap = new Map();
  overrides.forEach((service) => {
    if (service && service.id) {
      overrideMap.set(service.id, service);
    }
  });

  const merged = base.map((service) => {
    const override = overrideMap.get(service.id);
    if (!override) return service;
    return {
      ...service,
      ...override,
    };
  });

  overrideMap.forEach((service, id) => {
    if (!merged.some((item) => item.id === id)) {
      merged.push(service);
    }
  });

  return merged;
}

function mapAlertDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    severity: data.severity || data.level || 'medium',
    module: data.module || data.category || 'General',
    service: data.service || null,
    type: data.type || null,
    message: data.message || data.title || '',
    timestamp: formatDateTime(data.createdAt || data.timestamp || data.updatedAt),
    resolved: Boolean(data.resolved),
    count: data.count || null,
    threshold: data.threshold || null,
    actions: data.actions || [],
    metadata: data.metadata || {},
  };
}

function mapTaskDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    title: data.title || data.name || 'Tarea sin título',
    completed: Boolean(data.completed),
    priority: data.priority || null,
    dueDate: formatDateOnly(data.dueDate),
    createdAt: formatDateTime(data.createdAt),
  };
}

function mapWeddingDoc(doc) {
  const data = doc.data() || {};
  const eventDate = data.eventDate || data.date || data.event_date;
  const updatedAt = data.updatedAt || data.lastUpdate || data.updated_at;
  const ownerEmail = data.ownerEmail || data.owner || data.primaryOwnerEmail;
  const couple =
    data.coupleName ||
    data.couple ||
    (Array.isArray(data.coupleNames) ? data.coupleNames.join(' & ') : null) ||
    data.name ||
    'Pareja sin nombre';

  return {
    id: doc.id,
    couple,
    owner: ownerEmail || 'sin-owner@maloveapp.com',
    eventDate: formatDateOnly(eventDate) || '',
    status: data.status || 'draft',
    confirmedGuests: normalizeNumber(data.confirmedGuests ?? data.guestsConfirmed) ?? 0,
    signedContracts: normalizeNumber(data.signedContracts ?? data.contractsSigned) ?? 0,
    lastUpdate: formatDateOnly(updatedAt) || formatDateOnly(data.createdAt) || '',
  };
}

function mapUserDoc(doc) {
  const data = doc.data() || {};
  const lastAccessDate = toDate(
    data.lastAccess || data.lastLoginAt || data.lastLogin || data.last_seen_at
  );
  const updatedAtDate = toDate(data.updatedAt || data.lastActivity || data.lastUpdated);
  const createdAtDate = toDate(
    data.createdAt ||
      data.created_at ||
      data.signupDate ||
      data.registeredAt ||
      data.createdOn ||
      data.firstLoginAt
  );
  const fallbackCreatedDate = createdAtDate || updatedAtDate || lastAccessDate;

  const weddingsCount =
    normalizeNumber(data.weddingsCount ?? data.weddings ?? data.totalWeddings ?? null) ??
    (Array.isArray(data.weddingIds) ? data.weddingIds.length : 0) ??
    0;

  const user = {
    id: doc.id,
    email: data.email || data.username || data.contactEmail || doc.id,
    role: data.role || data.type || 'owner',
    status: data.status || data.state || 'active',
    lastAccess: formatDateTime(lastAccessDate) || '',
    weddings: weddingsCount,
    createdAt: formatDateOnly(createdAtDate || fallbackCreatedDate) || '',
  };

  const sortKey =
    (lastAccessDate && lastAccessDate.getTime()) ||
    (updatedAtDate && updatedAtDate.getTime()) ||
    (createdAtDate && createdAtDate.getTime()) ||
    0;
  const secondarySortKey =
    (createdAtDate && createdAtDate.getTime()) ||
    (updatedAtDate && updatedAtDate.getTime()) ||
    (lastAccessDate && lastAccessDate.getTime()) ||
    0;

  Object.defineProperty(user, '_sortKey', { value: sortKey, enumerable: false });
  Object.defineProperty(user, '_secondarySortKey', { value: secondarySortKey, enumerable: false });

  return user;
}

function mapIncidentDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    service: data.service || data.name || doc.id,
    startedAt: formatDateTime(data.startedAt || data.started_at || data.startTime),
    duration: data.duration || null,
    impact: data.impact || data.description || '',
    action: data.action || data.remediation || '',
    resolvedBy: data.resolvedBy || data.owner || '',
  };
}

function mapFeatureFlagDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    name: data.name || doc.id,
    description: data.description || '',
    domain: data.domain || '',
    enabled: Boolean(data.enabled),
    lastModifiedBy: data.lastModifiedBy || data.updatedBy || '',
    lastModifiedAt: formatDateTime(data.lastModifiedAt || data.updatedAt),
  };
}

function mapSecretDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    name: data.name || doc.id,
    lastRotatedAt: formatDateOnly(data.lastRotatedAt || data.updatedAt),
  };
}

function mapTemplateDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    name: data.name || doc.id,
    content: data.content || '',
    updatedAt: formatDateTime(data.updatedAt),
  };
}

function mapBroadcastDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    type: data.type || 'email',
    subject: data.subject || '',
    segment: data.segment || 'Todos',
    scheduledAt: formatDateTime(data.scheduledAt || data.sendAt),
    status: data.status || 'Pendiente',
    stats: data.stats || null,
  };
}

function mapAuditLogDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    createdAt: formatDateTime(data.createdAt),
    actor: data.actor || data.user || '',
    action: data.action || '',
    resourceType: data.resourceType || '',
    resourceId: data.resourceId || '',
    payload: typeof data.payload === 'string' ? data.payload : JSON.stringify(data.payload || {}),
  };
}

function mapReportDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    name: data.name || doc.id,
    cadence: data.cadence || '',
    recipients: ensureArray(data.recipients),
    format: data.format || '',
    status: data.status || '',
  };
}

function mapSupportSummaryDoc(doc) {
  const data = doc.data() || {};
  return {
    open: normalizeNumber(data.open) ?? 0,
    pending: normalizeNumber(data.pending) ?? 0,
    resolved: normalizeNumber(data.resolved) ?? 0,
    slaAverage: data.slaAverage || data.sla || '',
    nps: normalizeNumber(data.nps),
    updatedAt: formatDateTime(data.updatedAt || data.generatedAt),
  };
}

function mapSupportTicketDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    subject: data.subject || '',
    requester: data.requester || data.email || '',
    status: data.status || '',
    updatedAt: formatDateTime(data.updatedAt),
    priority: data.priority || '',
  };
}

async function sumPaymentsLast30d() {
  if (typeof collections.payments !== 'function') return 0;
  const sinceDate = new Date(Date.now() - 30 * DAY_MS);
  const sinceTimestamp = admin.firestore.Timestamp.fromDate(sinceDate);
  const seen = new Set();
  let total = 0;

  const collect = async (field) => {
    const statuses = ['paid', 'succeeded'];
    for (const status of statuses) {
      try {
        const docs = await fetchDocuments(
          () => collections.payments(),
          [
            { field: 'status', op: '==', value: status },
            { field, op: '>=', value: sinceTimestamp },
          ],
          1000
        );
        docs.forEach((doc) => {
          if (seen.has(doc.id)) return;
          const data = doc.data() || {};
          const amount = Number(data.amount ?? data.total ?? 0);
          if (Number.isFinite(amount)) {
            total += amount;
            seen.add(doc.id);
          }
        });
      } catch (error) {
        logger.warn('[admin-dashboard] payments aggregation failed', {
          field,
          message: error?.message,
        });
      }
    }
  };

  await collect('updatedAt');
  if (total === 0) {
    await collect('createdAt');
  }

  return total;
}

async function countDownloadsLast30d() {
  const sinceDate = new Date(Date.now() - 30 * DAY_MS);
  const sinceTimestamp = admin.firestore.Timestamp.fromDate(sinceDate);
  const candidates = [
    { key: 'appDownloads', fields: ['createdAt', 'timestamp', 'downloadedAt'] },
    { key: 'appDownloadEvents', fields: ['createdAt', 'timestamp', 'eventAt'] },
    { key: 'mobileDownloads', fields: ['createdAt', 'updatedAt'] },
    { key: 'analyticsAppDownloads', fields: ['createdAt', 'eventAt'] },
  ];

  const ids = new Set();

  for (const candidate of candidates) {
    const factory = collections[candidate.key];
    if (typeof factory !== 'function') continue;

    for (const field of candidate.fields) {
      try {
        const docs = await fetchDocuments(
          () => factory(),
          [{ field, op: '>=', value: sinceTimestamp }],
          1000
        );
        docs.forEach((doc) => {
          if (ids.has(doc.id)) return;
          const data = doc.data() || {};
          const ts = toDate(data[field]);
          if (ts && ts >= sinceDate) ids.add(doc.id);
        });
      } catch (error) {
        logger.warn('[admin-dashboard] downloads aggregation failed', {
          collection: candidate.key,
          field,
          message: error?.message,
        });
      }
    }
  }

  return ids.size;
}

const BYTES_IN_GB = 1024 * 1024 * 1024;

const normalizePlan = (value) => {
  if (!value) return '';
  return String(value).toLowerCase();
};

const isPremiumPlan = (planValue) => {
  const normalized = normalizePlan(planValue);
  if (!normalized) return false;
  return (
    normalized.includes('premium') ||
    normalized.includes('pro') ||
    normalized.includes('business') ||
    normalized.includes('plan_b')
  );
};

async function calculateStorageUsageStats() {
  let totalBytes = 0;
  let premiumBytes = 0;
  let premiumCount = 0;
  let source = 'fallback';

  try {
    const snapshot = await collections.weddings().get();
    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      const usage =
        Number(
          data?.storageUsage?.bytes ?? data?.storage?.usageBytes ?? data?.storage?.totalBytes ?? 0
        ) || 0;
      totalBytes += usage;
      const plan =
        data?.plan ||
        data?.subscriptionPlan ||
        data?.subscription?.planId ||
        data?.subscription?.currentPlan?.id;
      if (isPremiumPlan(plan)) {
        premiumBytes += usage;
        premiumCount += 1;
      }
    });
    source = 'firestore';
  } catch (error) {
    logger.warn('[admin-dashboard] storage usage aggregation failed', { message: error?.message });
  }

  const premiumAverageBytes = premiumCount > 0 ? premiumBytes / premiumCount : 0;
  return {
    totalBytes,
    totalGigabytes: totalBytes / BYTES_IN_GB,
    premiumAverageBytes,
    premiumAverageGigabytes: premiumAverageBytes / BYTES_IN_GB,
    premiumCount,
    source,
  };
}

async function countDownloadsTotal() {
  const candidates = [
    { key: 'appDownloads' },
    { key: 'appDownloadEvents' },
    { key: 'mobileDownloads' },
    { key: 'analyticsAppDownloads' },
  ];
  const ids = new Set();
  for (const candidate of candidates) {
    const factory = collections[candidate.key];
    if (typeof factory !== 'function') continue;
    try {
      const docs = await fetchDocuments(() => factory(), [], 5000);
      docs.forEach((doc) => ids.add(doc.id));
    } catch (error) {
      logger.warn('[admin-dashboard] total downloads aggregation failed', {
        collection: candidate.key,
        message: error?.message,
      });
    }
  }
  return ids.size;
}

function isPremiumUserDoc(data) {
  if (!data || typeof data !== 'object') return false;
  const plan =
    data.plan ||
    data.planType ||
    data.subscriptionPlan ||
    data.subscription?.planId ||
    data.subscription?.currentPlan?.id ||
    data.billing?.plan;
  return isPremiumPlan(plan);
}

async function aggregateDownloadsByMonth(months = 12) {
  const { buckets, index } = buildMonthlyBuckets(months);
  const visited = new Set();
  const dateFields = [
    'createdAt',
    'installedAt',
    'timestamp',
    'eventAt',
    'registeredAt',
    'updatedAt',
  ];
  const candidates = [
    { key: 'appDownloads', fields: dateFields },
    { key: 'appDownloadEvents', fields: dateFields },
    { key: 'mobileDownloads', fields: dateFields },
    { key: 'analyticsAppDownloads', fields: dateFields },
  ];

  for (const candidate of candidates) {
    const factory = collections[candidate.key];
    if (typeof factory !== 'function') continue;
    try {
      const docs = await fetchDocuments(() => factory(), [], 5000);
      docs.forEach((doc) => {
        const data = doc.data() || {};
        let matchDate = null;

        for (const field of candidate.fields) {
          if (data[field]) {
            matchDate = toDate(data[field]);
            if (matchDate) break;
          }
        }

        if (!matchDate && data.device?.installedAt) {
          matchDate = toDate(data.device.installedAt);
        }
        if (!matchDate && data.metadata?.createdAt) {
          matchDate = toDate(data.metadata.createdAt);
        }
        if (!matchDate) return;

        const key = formatMonthKey(matchDate);
        const uniqueKey = `${candidate.key}:${doc.id}`;
        if (visited.has(uniqueKey)) return;
        visited.add(uniqueKey);
        if (index.has(key)) {
          index.get(key).value += 1;
        }
      });
    } catch (error) {
      logger.warn('[admin-dashboard] downloads by month aggregation failed', {
        collection: candidate.key,
        message: error?.message,
      });
    }
  }

  const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  return { total, byMonth: buckets };
}

async function aggregateUserAcquisitionStats(months = 12) {
  const { buckets, index } = buildMonthlyBuckets(months);
  const { buckets: paidBuckets, index: paidIndex } = buildMonthlyBuckets(months);
  let totalUsers = 0;
  let paidUsers = 0;

  try {
    const docs = await fetchDocuments(collections.users, [], 5000);
    totalUsers = docs.length;
    docs.forEach((doc) => {
      const data = doc.data() || {};
      const createdAt = toDate(data.createdAt);
      if (createdAt) {
        recordMonthlyValue(index, createdAt, 1);
      }
      if (isPremiumUserDoc(data)) {
        paidUsers += 1;
        if (createdAt) {
          recordMonthlyValue(paidIndex, createdAt, 1);
        }
      }
    });
  } catch (error) {
    logger.warn('[admin-dashboard] user acquisition aggregation failed', {
      message: error?.message,
    });
  }

  return {
    total: totalUsers,
    byMonth: buckets,
    paidTotal: paidUsers,
    paidByMonth: paidBuckets,
  };
}

async function aggregateWeddingInsights(limit = 10) {
  const plannerCounts = new Map();
  let finishedCount = 0;
  let completedCount = 0;
  let tasksCompletionTotal = 0;
  const tasksCompletionSamples = [];
  let tasksCompletionCount = 0;
  let momentosUsageBytes = 0;
  let momentosUsageCount = 0;

  try {
    const docs = await fetchDocuments(collections.weddings, [], 5000);
    const now = new Date();

    docs.forEach((doc) => {
      const data = doc.data() || {};
      const plannerIds =
        Array.isArray(data.plannerIds) && data.plannerIds.length
          ? data.plannerIds
          : ['sin_asignar'];
      plannerIds.forEach((plannerId) => {
        const key = String(plannerId || 'sin_asignar');
        plannerCounts.set(key, (plannerCounts.get(key) || 0) + 1);
      });

      const status = String(data.status || '').toLowerCase();
      const active = data.active;
      const eventDate = toDate(data.eventDate || data.weddingDate);
      const isFinished =
        status === 'archived' ||
        status === 'finished' ||
        status === 'completed' ||
        active === false ||
        (eventDate && eventDate < now && status !== 'draft');
      if (isFinished) finishedCount += 1;

      const summary = data.summary || {};
      const tasksCompleted = Number(summary.tasksCompleted ?? data.tasksCompleted ?? 0);
      const tasksPending = Number(summary.tasksPending ?? data.tasksPending ?? 0);
      const tasksTotal =
        Number(summary.tasksTotal ?? data.tasksTotal ?? 0) || tasksCompleted + tasksPending;
      if (tasksTotal > 0) {
        const ratio = Math.min(100, Math.max(0, (tasksCompleted / tasksTotal) * 100));
        tasksCompletionTotal += ratio;
        tasksCompletionCount += 1;
        if (tasksCompletionSamples.length < 10) {
          tasksCompletionSamples.push({
            weddingId: doc.id,
            name: data.name || data.slug || doc.id,
            completionPercent: Number(ratio.toFixed(1)),
            tasksCompleted,
            tasksTotal,
          });
        }
      }

      const completionThreshold = tasksTotal > 0 ? tasksCompleted / tasksTotal : 0;
      const isCompleted =
        isFinished &&
        (status === 'completed' ||
          tasksPending === 0 ||
          completionThreshold >= 0.9 ||
          Number(data.progress || 0) >= 95 ||
          summary.status === 'completed');
      if (isCompleted) completedCount += 1;

      const momentosActive = Boolean(
        data.momentosEnabled ||
          data.features?.momentos?.active ||
          data.products?.momentos?.active ||
          data.subscription?.addons?.includes?.('momentos')
      );
      if (momentosActive) {
        const usageBytes =
          Number(
            data.storageUsage?.momentosBytes ??
              data.storage?.momentosBytes ??
              data.storage?.momentos?.bytes ??
              data.storageUsage?.bytes ??
              0
          ) || 0;
        if (usageBytes > 0) {
          momentosUsageBytes += usageBytes;
        }
        momentosUsageCount += 1;
      }
    });
  } catch (error) {
    logger.warn('[admin-dashboard] wedding insights aggregation failed', {
      message: error?.message,
    });
  }

  const plannerEntries = Array.from(plannerCounts.entries())
    .map(([plannerId, count]) => ({ plannerId, count }))
    .sort((a, b) => b.count - a.count);
  const totalPlanners = plannerEntries.length;
  const averageTasksCompletion =
    tasksCompletionCount > 0 ? Number((tasksCompletionTotal / tasksCompletionCount).toFixed(1)) : 0;
  const completionRate =
    finishedCount > 0 ? Number(((completedCount / finishedCount) * 100).toFixed(1)) : 0;

  return {
    plannerStats: {
      totalPlanners,
      top: plannerEntries.slice(0, limit),
    },
    weddingProgress: {
      finished: finishedCount,
      completed: completedCount,
      completionRate,
    },
    tasksCompletion: {
      averageCompletionPercent: averageTasksCompletion,
      sample: tasksCompletionSamples,
    },
    momentosUsage: {
      totalBytes: momentosUsageBytes,
      totalGigabytes: momentosUsageBytes / BYTES_IN_GB,
      averageGigabytes:
        momentosUsageCount > 0 ? momentosUsageBytes / momentosUsageCount / BYTES_IN_GB : 0,
      weddingsWithMoments: momentosUsageCount,
    },
  };
}

async function aggregateWebVisitStats(days = 30) {
  const sinceDate = new Date(Date.now() - days * DAY_MS);
  const sinceTimestamp = admin.firestore.Timestamp.fromDate(sinceDate);
  const candidates = [
    { key: 'analyticsWebVisits', fields: ['createdAt', 'eventAt', 'timestamp', 'visitedAt'] },
    { key: 'webVisits', fields: ['createdAt', 'eventAt', 'timestamp', 'visitedAt'] },
  ];

  let total = 0;
  const recentIds = new Set();
  let source = 'fallback';

  for (const candidate of candidates) {
    const factory = collections[candidate.key];
    if (typeof factory !== 'function') continue;

    try {
      const docs = await fetchDocuments(() => factory(), [], 5000);
      if (docs.length > 0) source = candidate.key;
      total += docs.length;
      docs.forEach((doc) => {
        const data = doc.data() || {};
        const matchField = candidate.fields.find((field) => data[field]);
        if (!matchField) return;
        const visitDate = toDate(data[matchField]);
        if (visitDate && visitDate >= sinceDate) {
          recentIds.add(doc.id);
        }
      });
    } catch (error) {
      logger.warn('[admin-dashboard] web visits aggregation failed', {
        collection: candidate.key,
        message: error?.message,
      });
    }
  }

  return {
    totalVisits: total,
    newVisits: recentIds.size,
    since: sinceDate.toISOString(),
    source,
  };
}

async function aggregateUserGrowthMetrics(days = 30) {
  const sinceDate = new Date(Date.now() - days * DAY_MS);
  const sinceTimestamp = admin.firestore.Timestamp.fromDate(sinceDate);
  let newUsers = 0;
  let newPremiumUsers = 0;
  let source = 'firestore';

  try {
    const users = await fetchDocuments(
      collections.users,
      [{ field: 'createdAt', op: '>=', value: sinceTimestamp }],
      5000
    );
    newUsers = users.length;
    users.forEach((doc) => {
      const data = doc.data() || {};
      if (isPremiumUserDoc(data)) newPremiumUsers += 1;
    });
  } catch (error) {
    logger.warn('[admin-dashboard] new users aggregation failed', { message: error?.message });
    source = 'fallback';
  }

  let totalUsers = 0;
  try {
    totalUsers = await countDocuments(collections.users);
  } catch (error) {
    logger.warn('[admin-dashboard] total users count failed', { message: error?.message });
  }

  return {
    since: sinceDate.toISOString(),
    newUsers,
    newPremiumUsers,
    newPremiumShare: newUsers > 0 ? newPremiumUsers / newUsers : 0,
    totalUsers,
    source,
  };
}

async function countOpenAlertsRealtime() {
  try {
    return await countDocuments(collections.alerts, [
      { field: 'resolved', op: '==', value: false },
    ]);
  } catch (error) {
    logger.warn('[admin-dashboard] open alerts count fallback', { message: error?.message });
    return 0;
  }
}

// Calcular NPS real basado en feedback de usuarios
async function calculateRealNPS() {
  try {
    const feedbackCollection = db.collection('userFeedback');
    const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS);
    const snap = await feedbackCollection
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .where('score', '>=', 0)
      .where('score', '<=', 10)
      .limit(1000)
      .get();

    if (snap.empty) return null;

    let promoters = 0; // 9-10
    let passives = 0; // 7-8
    let detractors = 0; // 0-6

    snap.forEach((doc) => {
      const score = doc.data().score;
      if (score >= 9) promoters++;
      else if (score >= 7) passives++;
      else detractors++;
    });

    const total = snap.size;
    if (total === 0) return null;

    const nps = Math.round(((promoters - detractors) / total) * 100);
    return {
      score: nps,
      total,
      promoters,
      passives,
      detractors,
      period: '30d',
    };
  } catch (error) {
    logger.warn('[admin-dashboard] NPS calculation failed', { message: error?.message });
    return null;
  }
}

// Calcular métricas de conversión owners -> planners
async function calculateConversionMetrics() {
  try {
    const usersSnap = await collections.users().get();
    const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS);

    let owners = 0;
    let planners = 0;
    let assistants = 0;
    let upgradedToPlannerCount = 0;

    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const role = String(data.role || 'owner').toLowerCase();

      if (role.includes('planner')) {
        planners++;
        // Verificar si fue upgrade reciente
        const roleChangeDate = toDate(data.roleChangedAt);
        if (roleChangeDate && roleChangeDate >= thirtyDaysAgo && data.previousRole === 'owner') {
          upgradedToPlannerCount++;
        }
      } else if (role.includes('assistant')) {
        assistants++;
      } else {
        owners++;
      }
    }

    const conversionRate = owners > 0 ? ((upgradedToPlannerCount / owners) * 100).toFixed(2) : 0;

    return {
      owners,
      planners,
      assistants,
      upgradedLast30d: upgradedToPlannerCount,
      conversionRate: parseFloat(conversionRate),
    };
  } catch (error) {
    logger.warn('[admin-dashboard] Conversion metrics failed', { message: error?.message });
    return null;
  }
}

// Calcular MRR/ARR
async function calculateRecurringRevenue() {
  try {
    const subscriptionsSnap = await db
      .collection('subscriptions')
      .where('status', 'in', ['active', 'trialing'])
      .get();

    let monthlyRevenue = 0;
    const revenueByPlan = {};
    const revenueByCountry = {};

    subscriptionsSnap.forEach((doc) => {
      const data = doc.data();
      const amount = Number(data.monthlyAmount || data.amount || 0);
      const plan = data.plan || 'unknown';
      const country = data.country || 'ES';

      monthlyRevenue += amount;

      if (!revenueByPlan[plan]) revenueByPlan[plan] = 0;
      revenueByPlan[plan] += amount;

      if (!revenueByCountry[country]) revenueByCountry[country] = 0;
      revenueByCountry[country] += amount;
    });

    return {
      mrr: monthlyRevenue,
      arr: monthlyRevenue * 12,
      byPlan: revenueByPlan,
      byCountry: revenueByCountry,
      activeSubscriptions: subscriptionsSnap.size,
      currency: 'EUR',
    };
  } catch (error) {
    logger.warn('[admin-dashboard] MRR calculation failed', { message: error?.message });
    return null;
  }
}

// Calcular métricas de retención
async function calculateRetentionMetrics(days = 30) {
  try {
    const startDate = new Date(Date.now() - days * DAY_MS);
    const usersSnap = await collections
      .users()
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .get();

    const cohortSize = usersSnap.size;
    if (cohortSize === 0) return null;

    let retainedD1 = 0;
    let retainedD7 = 0;
    let retainedD30 = 0;

    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const createdAt = toDate(data.createdAt);
      const lastLoginAt = toDate(data.lastLoginAt || data.lastAccess);

      if (!createdAt || !lastLoginAt) continue;

      const daysSinceCreation = (lastLoginAt - createdAt) / DAY_MS;

      if (daysSinceCreation >= 1) retainedD1++;
      if (daysSinceCreation >= 7) retainedD7++;
      if (daysSinceCreation >= 30) retainedD30++;
    }

    return {
      cohortSize,
      d1: ((retainedD1 / cohortSize) * 100).toFixed(2),
      d7: ((retainedD7 / cohortSize) * 100).toFixed(2),
      d30: ((retainedD30 / cohortSize) * 100).toFixed(2),
      period: `${days}d`,
    };
  } catch (error) {
    logger.warn('[admin-dashboard] Retention metrics failed', { message: error?.message });
    return null;
  }
}

async function getNewUserTasks(days = 14, maxResults = 20) {
  if (typeof collections.tasksGroup !== 'function') return [];

  const windowDays = Math.max(days, 1);
  const sinceDate = new Date(Date.now() - windowDays * DAY_MS);
  const sinceTimestamp = admin.firestore.Timestamp.fromDate(sinceDate);

  try {
    const snap = await collections
      .tasksGroup()
      .where('createdAt', '>=', sinceTimestamp)
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get();

    if (snap.empty) return [];

    const groups = new Map();

    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const type = String(data.type || 'task').toLowerCase();
      if (type === 'subtask') return;

      const rawTitle = normalizeStringValue(data.title || data.name || '');
      if (!rawTitle) return;

      const canonical = canonicalizeTaskTitle(rawTitle);
      if (!canonical) return;

      const createdAtDate = toDate(data.createdAt);
      if (!createdAtDate || createdAtDate < sinceDate) return;

      const isTemplateDerived = Boolean(
        data.templateKey || data.templateVersion || data.templateParentKey || data.templateId
      );
      const hasManualFlag = Boolean(
        data.createdBy ||
          data.createdByUid ||
          data.createdByRole ||
          data.manual === true ||
          data.isManual === true ||
          String(data.source || '').toLowerCase() === 'user' ||
          String(data.origin || '').toLowerCase() === 'user'
      );
      if (isTemplateDerived && !hasManualFlag) return;

      const weddingId = data.weddingId || extractWeddingIdFromPath(docSnap.ref.path);

      const entry = groups.get(canonical) || {
        key: canonical,
        label: toTitleCase(canonical),
        totalOccurrences: 0,
        weddingIds: new Set(),
        sampleTitles: new Set(),
        lastCreatedAt: null,
      };

      entry.totalOccurrences += 1;
      if (weddingId) entry.weddingIds.add(String(weddingId));
      entry.sampleTitles.add(toTitleCase(rawTitle));
      if (!entry.lastCreatedAt || createdAtDate > entry.lastCreatedAt) {
        entry.lastCreatedAt = createdAtDate;
      }

      groups.set(canonical, entry);
    });

    const ordered = Array.from(groups.values())
      .map((entry) => ({
        key: entry.key,
        label: entry.label,
        totalOccurrences: entry.totalOccurrences,
        totalWeddings: entry.weddingIds.size,
        sampleTitles: Array.from(entry.sampleTitles).slice(0, 3),
        lastCreatedAt: entry.lastCreatedAt ? formatDateTime(entry.lastCreatedAt) : null,
      }))
      .filter((item) => item.totalOccurrences > 0 && item.totalWeddings > 0)
      .sort((a, b) => {
        if (b.totalOccurrences !== a.totalOccurrences)
          return b.totalOccurrences - a.totalOccurrences;
        if (b.totalWeddings !== a.totalWeddings) return b.totalWeddings - a.totalWeddings;
        if (b.lastCreatedAt && a.lastCreatedAt)
          return b.lastCreatedAt.localeCompare(a.lastCreatedAt);
        return 0;
      });

    return ordered.slice(0, Math.max(maxResults, 1));
  } catch (error) {
    logger.warn('[admin-dashboard] new user tasks aggregation failed', { message: error?.message });
    return [];
  }
}

async function computeRealtimeOverview() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const thirtyTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

  const totalUsers = await countDocuments(collections.users);
  const activeUsers30d = await countDocuments(collections.users, [
    { field: 'lastLoginAt', op: '>=', value: thirtyTimestamp },
  ]);
  // Weddings raíz y fallback a grupo
  let totalWeddings = await countDocuments(collections.weddings);
  if (!totalWeddings) {
    try {
      totalWeddings = await countDocuments(collections.weddingsGroup);
    } catch {
      totalWeddings = 0;
    }
  }
  let newWeddings30d = await countDocuments(collections.weddings, [
    { field: 'createdAt', op: '>=', value: thirtyTimestamp },
  ]);
  if (!newWeddings30d) {
    try {
      newWeddings30d = await countDocuments(collections.weddingsGroup, [
        { field: 'createdAt', op: '>=', value: thirtyTimestamp },
      ]);
    } catch {
      newWeddings30d = 0;
    }
  }
  // Contar bodas activas: campo 'active' (booleano), no 'status'
  let activeWeddings = await countDocuments(collections.weddings, [
    { field: 'active', op: '==', value: true },
  ]);
  if (!activeWeddings) {
    try {
      activeWeddings = await countDocuments(collections.weddingsGroup, [
        { field: 'active', op: '==', value: true },
      ]);
    } catch {
      activeWeddings = 0;
    }
  }
  const revenue30dRaw = await sumPaymentsLast30d();
  const downloads30d = await countDownloadsLast30d();
  const openAlerts = await countOpenAlertsRealtime();
  const newTasks = await getNewUserTasks(14, 20);

  const kpis = [
    {
      id: 'active-weddings',
      label: 'Bodas activas',
      value: activeWeddings,
      trend: null,
      testId: 'admin-kpi-active-weddings',
    },
    {
      id: 'revenue-30d',
      label: 'Facturación (30 días)',
      value: formatCurrency(revenue30dRaw),
      trend: null,
      testId: 'admin-kpi-revenue-30d',
    },
    {
      id: 'downloads-30d',
      label: 'Descargas app (30 días)',
      value: downloads30d,
      trend: null,
      testId: 'admin-kpi-downloads-30d',
    },
    {
      id: 'open-alerts',
      label: 'Alertas activas',
      value: openAlerts,
      trend: null,
      testId: 'admin-kpi-open-alerts',
    },
  ];

  return {
    kpis,
    services: [],
    alerts: [],
    tasks: [],
    newTasks,
    meta: {
      totalUsers,
      activeUsers30d,
      totalWeddings,
      newWeddings30d,
      activeWeddings,
      revenue30d: revenue30dRaw,
      downloads30d,
      openAlerts,
      computedAt: now.toISOString(),
    },
  };
}

async function getCollectionDocs(name, opts = {}) {
  try {
    const col = collections[name];
    if (!col) return [];
    let ref = col();
    if (opts.orderBy) {
      ref = ref.orderBy(opts.orderBy, opts.direction || 'desc');
    }
    if (opts.limit) {
      ref = ref.limit(Math.min(opts.limit, MAX_LIMIT));
    }
    const snap = await ref.get();
    if (snap.empty) return [];
    return snap.docs;
  } catch (error) {
    logger.warn(`[admin-dashboard] Failed to read ${name}: ${error.message}`);
    return [];
  }
}

router.get('/overview', async (_req, res) => {
  try {
    const [metricsDocs, serviceDocs, alertDocs, taskDocs, realtime] = await Promise.all([
      getCollectionDocs('metrics', { orderBy: 'date', limit: 1 }),
      getCollectionDocs('serviceStatus', { orderBy: 'service', limit: 50 }),
      getCollectionDocs('alerts', { orderBy: 'createdAt', limit: 20 }),
      getCollectionDocs('tasks', { orderBy: 'createdAt', limit: 50 }),
      computeRealtimeOverview(),
    ]);

    const latestMetrics = metricsDocs.length ? metricsDocs[0].data() : null;
    let kpis = realtime?.kpis?.length ? realtime.kpis : extractKpis(latestMetrics);
    if (!kpis.length) kpis = defaultKpis();

    let services = extractServices(latestMetrics, serviceDocs);
    if (!services.length) services = defaultServices();
    const liveOverrides = await computeLiveServiceOverrides();
    services = mergeServiceOverrides(services, liveOverrides);

    let alerts = alertDocs.map(mapAlertDoc);
    if (!alerts.length)
      alerts = [
        {
          id: 'al-1',
          severity: 'high',
          module: 'Sistema',
          message: 'Sin datos de métricas (modo demo)',
          timestamp: formatDateTime(new Date()),
          resolved: false,
        },
      ];
    const tasks = taskDocs.map(mapTaskDoc);
    const newTasks = Array.isArray(realtime?.newTasks) ? realtime.newTasks : [];
    const meta = realtime?.meta || latestMetrics?.meta || null;

    res.json({
      kpis,
      services,
      alerts,
      tasks,
      newTasks,
      fetchedAt: new Date().toISOString(),
      source: realtime ? 'realtime' : latestMetrics ? 'firestore' : 'empty',
      meta,
    });
  } catch (error) {
    logger.error('[admin-dashboard] integrations GET error', error);
    res.status(500).json({ error: 'admin_integrations_failed' });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, MAX_LIMIT);
    const includeResolved = req.query.resolved === 'true';

    // Construir query base
    let query = collections.alerts().orderBy('createdAt', 'desc');

    // Filtrar por estado si no se incluyen resueltas
    if (!includeResolved) {
      query = query.where('resolved', '==', false);
    }

    query = query.limit(limit);

    const alertDocs = await query.get();
    const alerts = alertDocs.docs.map(mapAlertDoc);

    // Ordenar por severidad y timestamp
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      const severityDiff = (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
      if (severityDiff !== 0) return severityDiff;
      // Si tienen la misma severidad, ordenar por timestamp (más reciente primero)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.json(alerts);
  } catch (error) {
    logger.error('[admin-dashboard] alerts GET error', error);
    res.status(500).json({ error: 'admin_alerts_failed' });
  }
});

// Reintentar conexión de un servicio de integraciones
router.post('/integrations/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'integration_id_required' });

    const ref = collections.serviceStatus().doc(id);
    const snap = await ref.get();
    const prev = snap.exists ? snap.data() || {} : {};

    const latencyMs = Math.floor(120 + Math.random() * 220);
    const next = {
      name: prev.name || prev.service || id,
      latency: `${latencyMs}ms`,
      status:
        prev.status && prev.status !== 'operational' ? 'operational' : prev.status || 'operational',
      incidents: Number.isFinite(prev.incidents) ? prev.incidents : 0,
      lastCheckedAt: serverTs(),
    };
    await ref.set(next, { merge: true });

    const updated = await ref.get();
    const data = updated.data() || {};
    const service = {
      id: updated.id,
      name: data.name || data.service || updated.id,
      status: data.status || 'operational',
      latency: data.latency ? String(data.latency) : null,
      incidents: Number.isFinite(data.incidents) ? data.incidents : 0,
    };

    await writeAdminAudit(req, 'ADMIN_INTEGRATION_RETRY', {
      resourceType: 'integration',
      resourceId: id,
      payload: { status: service.status, latency: service.latency },
    });
    return res.json({ service });
  } catch (error) {
    logger.error('[admin-dashboard] integrations retry error', error);
    return res.status(500).json({ error: 'admin_integration_retry_failed' });
  }
});

router.get('/metrics', async (_req, res) => {
  try {
    const metricsDocs = await getCollectionDocs('metrics', { orderBy: 'date', limit: 1 });
    const latest = metricsDocs.length ? metricsDocs[0].data() : null;
    let series = ensureArray(latest?.series);
    const funnel = latest?.funnel || [
      { label: 'Visitantes', value: 0, percentage: '100%' },
      { label: 'Registrados', value: 0, percentage: '0%' },
      { label: 'Bodas activas', value: 0, percentage: '0%' },
    ];
    let iaCosts = ensureArray(latest?.aiCosts);
    const communications = ensureArray(latest?.communications);
    const supportMetrics = latest?.supportMetrics || null;

    // Métricas avanzadas en tiempo real
    const [
      conversionMetrics,
      recurringRevenue,
      retentionData,
      storageMetrics,
      totalDownloads,
      trafficMetrics,
      userGrowthMetrics,
      downloadsLast30d,
      downloadsByMonth,
      userAcquisition,
      weddingInsights,
    ] = await Promise.all([
      calculateConversionMetrics(),
      calculateRecurringRevenue(),
      calculateRetentionMetrics(30),
      calculateStorageUsageStats(),
      countDownloadsTotal(),
      aggregateWebVisitStats(30),
      aggregateUserGrowthMetrics(30),
      countDownloadsLast30d(),
      aggregateDownloadsByMonth(12),
      aggregateUserAcquisitionStats(12),
      aggregateWeddingInsights(10),
    ]);

    // userStats / weddingStats en tiempo real (best-effort)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
    const sevenTimestamp = admin.firestore.Timestamp.fromDate(sevenDaysAgo);
    const thirtyTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

    const usersTotal = await countDocuments(collections.users);
    const usersActive7d = await countDocuments(collections.users, [
      { field: 'lastLoginAt', op: '>=', value: sevenTimestamp },
    ]);
    const usersActive30d = await countDocuments(collections.users, [
      { field: 'lastLoginAt', op: '>=', value: thirtyTimestamp },
    ]);

    // Weddings: intentar raíz y luego grupo
    let weddingsTotal = await countDocuments(collections.weddings);
    if (!weddingsTotal) {
      try {
        weddingsTotal = await countDocuments(collections.weddingsGroup);
      } catch {
        weddingsTotal = 0;
      }
    }
    let weddingsActive = await countDocuments(collections.weddings, [
      { field: 'active', op: '==', value: true },
    ]);
    if (!weddingsActive) {
      try {
        weddingsActive = await countDocuments(collections.weddingsGroup, [
          { field: 'active', op: '==', value: true },
        ]);
      } catch {
        weddingsActive = 0;
      }
    }
    if (!weddingsActive) {
      try {
        weddingsActive = await countDocuments(collections.weddings, [
          { field: 'status', op: '==', value: 'active' },
        ]);
      } catch {}
    }
    if (!weddingsActive) {
      try {
        weddingsActive = await countDocuments(collections.weddingsGroup, [
          { field: 'status', op: '==', value: 'active' },
        ]);
      } catch {}
    }
    weddingsActive = Number.isFinite(weddingsActive) ? weddingsActive : 0;

    const withPlanner = await countDocuments(collections.weddings, [
      { field: 'plannerIds', op: '!=', value: [] },
    ]).catch(() => 0);
    const withoutPlanner = await countDocuments(collections.weddings, [
      { field: 'plannerIds', op: '==', value: [] },
    ]).catch(() => 0);

    // Completar series/iaCosts con datos reales si no hay documento de métricas
    if (!Array.isArray(series) || series.length === 0) {
      try {
        const usersDaily = await aggregateDailyActiveUsers(30);
        series = [
          {
            id: 'usersActiveDaily',
            label: 'Usuarios activos (diario)',
            data: usersDaily,
          },
        ];
      } catch (e) {
        series = [];
      }
    }
    if (!Array.isArray(iaCosts) || iaCosts.length === 0) {
      try {
        const revenueDaily = await aggregateDailyRevenue(30);
        iaCosts = [
          {
            id: 'revenueDaily',
            label: 'Ingresos diarios',
            currency: 'EUR',
            data: revenueDaily,
          },
        ];
      } catch (e) {
        iaCosts = [];
      }
    }

    const userStats = {
      total: usersTotal,
      active7d: usersActive7d,
      active30d: usersActive30d,
      dau: usersActive7d / 7, // Aproximación
      mau: usersActive30d,
      stickiness: usersActive30d > 0 ? ((usersActive7d / 7 / usersActive30d) * 100).toFixed(1) : 0,
      byRole: { owner: 0, planner: 0, assistant: 0 },
      source: 'realtime',
    };

    const weddingStats = {
      total: weddingsTotal,
      active: weddingsActive,
      withPlanner,
      withoutPlanner,
      completionRate: weddingsTotal > 0 ? ((weddingsActive / weddingsTotal) * 100).toFixed(1) : 0,
      source: 'realtime',
    };
    const downloadsByMonthResult =
      downloadsByMonth && typeof downloadsByMonth === 'object' ? downloadsByMonth : null;
    const downloadsTotal =
      Number.isFinite(totalDownloads) && totalDownloads > 0
        ? totalDownloads
        : (normalizeNumber(downloadsByMonthResult?.total) ?? 0);
    const downloadsPayload = {
      total: Number.isFinite(downloadsTotal) ? downloadsTotal : 0,
      last30d: Number.isFinite(downloadsLast30d) ? downloadsLast30d : 0,
      byMonth: Array.isArray(downloadsByMonthResult?.byMonth)
        ? downloadsByMonthResult.byMonth.map((entry) => ({
            month: String(entry?.month || ''),
            value: normalizeNumber(entry?.value) ?? 0,
          }))
        : [],
      source: 'aggregated',
    };
    const weddingInsightsResult =
      weddingInsights && typeof weddingInsights === 'object' ? weddingInsights : {};
    const plannerStats =
      weddingInsightsResult.plannerStats && typeof weddingInsightsResult.plannerStats === 'object'
        ? {
            totalPlanners: normalizeNumber(weddingInsightsResult.plannerStats.totalPlanners) ?? 0,
            top: Array.isArray(weddingInsightsResult.plannerStats.top)
              ? weddingInsightsResult.plannerStats.top.map((item) => ({
                  plannerId: String(item?.plannerId || ''),
                  count: normalizeNumber(item?.count) ?? 0,
                }))
              : [],
          }
        : { totalPlanners: 0, top: [] };
    const weddingProgress =
      weddingInsightsResult.weddingProgress &&
      typeof weddingInsightsResult.weddingProgress === 'object'
        ? {
            finished: normalizeNumber(weddingInsightsResult.weddingProgress.finished) ?? 0,
            completed: normalizeNumber(weddingInsightsResult.weddingProgress.completed) ?? 0,
            completionRate:
              normalizeNumber(weddingInsightsResult.weddingProgress.completionRate) ?? 0,
          }
        : { finished: 0, completed: 0, completionRate: 0 };
    const tasksCompletion =
      weddingInsightsResult.tasksCompletion &&
      typeof weddingInsightsResult.tasksCompletion === 'object'
        ? {
            averageCompletionPercent:
              normalizeNumber(weddingInsightsResult.tasksCompletion.averageCompletionPercent) ?? 0,
            sample: Array.isArray(weddingInsightsResult.tasksCompletion.sample)
              ? weddingInsightsResult.tasksCompletion.sample.map((item) => ({
                  weddingId: String(item?.weddingId || ''),
                  name: String(item?.name || ''),
                  completionPercent: normalizeNumber(item?.completionPercent) ?? 0,
                  tasksCompleted: normalizeNumber(item?.tasksCompleted) ?? 0,
                  tasksTotal: normalizeNumber(item?.tasksTotal) ?? 0,
                }))
              : [],
          }
        : { averageCompletionPercent: 0, sample: [] };
    const momentosUsage =
      weddingInsightsResult.momentosUsage && typeof weddingInsightsResult.momentosUsage === 'object'
        ? {
            totalBytes: normalizeNumber(weddingInsightsResult.momentosUsage.totalBytes) ?? 0,
            totalGigabytes:
              normalizeNumber(weddingInsightsResult.momentosUsage.totalGigabytes) ?? 0,
            averageGigabytes:
              normalizeNumber(weddingInsightsResult.momentosUsage.averageGigabytes) ?? 0,
            weddingsWithMoments:
              normalizeNumber(weddingInsightsResult.momentosUsage.weddingsWithMoments) ?? 0,
          }
        : { totalBytes: 0, totalGigabytes: 0, averageGigabytes: 0, weddingsWithMoments: 0 };
    const userAcquisitionResult =
      userAcquisition && typeof userAcquisition === 'object'
        ? {
            total: normalizeNumber(userAcquisition.total) ?? 0,
            byMonth: Array.isArray(userAcquisition.byMonth)
              ? userAcquisition.byMonth.map((entry) => ({
                  month: String(entry?.month || ''),
                  value: normalizeNumber(entry?.value) ?? 0,
                }))
              : [],
            paidTotal: normalizeNumber(userAcquisition.paidTotal) ?? 0,
            paidByMonth: Array.isArray(userAcquisition.paidByMonth)
              ? userAcquisition.paidByMonth.map((entry) => ({
                  month: String(entry?.month || ''),
                  value: normalizeNumber(entry?.value) ?? 0,
                }))
              : [],
          }
        : { total: 0, byMonth: [], paidTotal: 0, paidByMonth: [] };

    res.json({
      series,
      funnel,
      iaCosts,
      communications,
      supportMetrics,
      userStats,
      weddingStats,
      conversionMetrics,
      recurringRevenue,
      retentionData,
      storage: storageMetrics,
      downloads: downloadsPayload,
      traffic: trafficMetrics,
      userGrowth: userGrowthMetrics,
      plannerStats,
      weddingProgress,
      tasksCompletion,
      momentosUsage,
      userAcquisition: userAcquisitionResult,
    });
  } catch (error) {
    logger.error('[admin-dashboard] metrics error', error);
    res.status(500).json({ error: 'admin_dashboard_metrics_failed' });
  }
});

// Nuevos endpoints de métricas detalladas
router.get('/metrics/product', async (_req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

    // Feature adoption
    const weddingsSnap = await collections.weddings().limit(500).get();
    let featureAdoption = {
      invitados: 0,
      seating: 0,
      momentos: 0,
      presupuesto: 0,
      tareas: 0,
      webEditor: 0,
    };

    for (const doc of weddingsSnap.docs) {
      const wedding = doc.data();
      if (wedding.guestCount > 0) featureAdoption.invitados++;
      if (wedding.seatingCompleted) featureAdoption.seating++;
      if (wedding.momentosEnabled) featureAdoption.momentos++;
      if (wedding.budget?.total) featureAdoption.presupuesto++;
      if (wedding.tasksCount > 0) featureAdoption.tareas++;
      if (wedding.invitationUrl) featureAdoption.webEditor++;
    }

    const total = weddingsSnap.size || 1;
    const featureAdoptionPercent = {
      invitados: ((featureAdoption.invitados / total) * 100).toFixed(1),
      seating: ((featureAdoption.seating / total) * 100).toFixed(1),
      momentos: ((featureAdoption.momentos / total) * 100).toFixed(1),
      presupuesto: ((featureAdoption.presupuesto / total) * 100).toFixed(1),
      tareas: ((featureAdoption.tareas / total) * 100).toFixed(1),
      webEditor: ((featureAdoption.webEditor / total) * 100).toFixed(1),
    };

    // Nuevos registros últimos 30 días
    const newUsersSnap = await collections
      .users()
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();

    res.json({
      featureAdoption: featureAdoptionPercent,
      newRegistrations: {
        last30days: newUsersSnap.size,
        daily: (newUsersSnap.size / 30).toFixed(1),
      },
    });
  } catch (error) {
    logger.error('[admin-dashboard] product metrics error', error);
    res.status(500).json({ error: 'product_metrics_failed' });
  }
});

router.get('/metrics/technical', async (_req, res) => {
  try {
    // Web Vitals simulados (TODO: integrar con monitorización real)
    const technicalMetrics = {
      performance: {
        lcp: 2.1,
        fid: 85,
        cls: 0.08,
        ttfb: 145,
      },
      uptime: 99.92,
      errorRate: 0.12,
      avgResponseTime: 145,
    };

    res.json(technicalMetrics);
  } catch (error) {
    logger.error('[admin-dashboard] technical metrics error', error);
    res.status(500).json({ error: 'technical_metrics_failed' });
  }
});

router.get('/metrics/economic', async (_req, res) => {
  try {
    const recurringRevenue = await calculateRecurringRevenue();
    const conversionMetrics = await calculateConversionMetrics();

    // CAC & LTV (simulados - TODO: integrar con datos reales de marketing)
    const cac = 45.5; // Coste de adquisición por cliente
    const ltv = recurringRevenue.avgTicket * 12; // Simplificado: ticket medio � 12 meses
    const cacLtvRatio = ltv / cac;

    res.json({
      cac,
      ltv: ltv.toFixed(2),
      cacLtvRatio: cacLtvRatio.toFixed(2),
      paybackPeriod: (cac / recurringRevenue.avgTicket).toFixed(1),
      recurringRevenue,
      conversionMetrics,
    });
  } catch (error) {
    logger.error('[admin-dashboard] economic metrics error', error);
    res.status(500).json({ error: 'economic_metrics_failed' });
  }
});

router.get('/support', async (_req, res) => {
  try {
    const [summaryDocs, ticketDocs, npsData] = await Promise.all([
      getCollectionDocs('supportSummary', { limit: 1 }),
      getCollectionDocs('supportTickets', { orderBy: 'updatedAt', limit: 100 }),
      calculateRealNPS(), // Calcular NPS real
    ]);

    let summary = summaryDocs.length ? mapSupportSummaryDoc(summaryDocs[0]) : null;
    let tickets = ticketDocs.map(mapSupportTicketDoc);

    // Actualizar NPS con datos reales si existen
    if (npsData) {
      if (!summary)
        summary = {
          open: 0,
          pending: 0,
          resolved: 0,
          slaAverage: '�',
          updatedAt: formatDateTime(new Date()),
        };
      summary.nps = npsData.score;
      summary.npsDetails = npsData;
    }

    if (!summary)
      summary = {
        open: 0,
        pending: 0,
        resolved: 0,
        slaAverage: '�',
        nps: null,
        updatedAt: formatDateTime(new Date()),
      };
    if (!tickets.length) tickets = [];

    res.json({ summary, tickets });
  } catch (error) {
    logger.error('[admin-dashboard] support error', error);
    res.status(500).json({ error: 'admin_dashboard_support_failed' });
  }
});
router.get('/users', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, MAX_LIMIT);
  const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';

  console.log('\n�x� [DEBUG] GET /users endpoint called');
  console.log('  - Limit:', limit);
  console.log('  - Status filter:', statusFilter || 'none');
  console.log('  - Firebase Admin initialized:', !!admin.apps.length);

  try {
    // Intentar primero desde Firestore
    let items = [];
    let fromAuth = false;

    console.log('  - Attempting Firestore query...');
    try {
      let query;
      try {
        query = statusFilter
          ? collections
              .users()
              .where('status', '==', statusFilter)
              .orderBy('createdAt', 'desc')
              .limit(limit)
          : collections.users().orderBy('createdAt', 'desc').limit(limit);
      } catch (error) {
        logger.warn('[admin-dashboard] users query fallback', { message: error?.message });
        query = collections.users().orderBy('createdAt', 'desc').limit(limit);
      }

      const snap = await query.get();
      console.log(`  - Firestore query result: ${snap.size} users found`);

      if (!snap.empty) {
        for (const docSnap of snap.docs) {
          const data = docSnap.data() || {};
          const email =
            data.email ||
            data.authEmail ||
            data.contactEmail ||
            data.profile?.email ||
            `${docSnap.id}@example.com`;
          const role = String(data.role || data.profile?.role || 'owner');
          const status = String(data.status || (data.disabled ? 'disabled' : 'active'));
          if (statusFilter && status !== statusFilter) continue;

          const createdAt =
            formatDateOnly(data.createdAt || data.created_at || docSnap.createTime) || '�';
          const lastAccess =
            formatDateTime(
              data.lastAccess ||
                data.lastLoginAt ||
                data.lastAccessAt ||
                data.updatedAt ||
                data.lastActiveWeddingAt
            ) || '�';

          let weddingsCount = Number(
            data.weddings ?? data.weddingCount ?? data.stats?.weddings ?? 0
          );
          if (!Number.isFinite(weddingsCount) || weddingsCount < 0) weddingsCount = 0;
          if (weddingsCount === 0) {
            try {
              weddingsCount = await getUserWeddingCount(docSnap.id);
            } catch (err) {
              logger.warn('[admin-dashboard] getUserWeddingCount failed', {
                uid: docSnap.id,
                message: err?.message,
              });
            }
          }

          items.push({
            id: docSnap.id,
            email,
            role,
            status,
            lastAccess,
            weddings: weddingsCount,
            createdAt,
          });
        }
      }
    } catch (firestoreError) {
      console.error('  �R Firestore query failed:', firestoreError.message);
      console.log('  - Switching to Firebase Auth fallback...');
      logger.warn('[admin-dashboard] Firestore users query failed, trying Firebase Auth', {
        message: firestoreError?.message,
      });
      fromAuth = true;

      // Fallback: obtener usuarios desde Firebase Authentication
      try {
        console.log('  - Calling admin.auth().listUsers()...');
        const listUsersResult = await admin.auth().listUsers(limit);
        console.log(`  - Firebase Auth returned ${listUsersResult.users.length} users`);

        for (const userRecord of listUsersResult.users) {
          const status = userRecord.disabled ? 'disabled' : 'active';
          if (statusFilter && status !== statusFilter) continue;

          // Intentar obtener datos adicionales de Firestore para cada usuario
          let weddingsCount = 0;
          let role = 'owner';
          let lastAccess = '�';

          try {
            const userDoc = await collections.users().doc(userRecord.uid).get();
            if (userDoc.exists) {
              const data = userDoc.data();
              role = String(data.role || data.profile?.role || 'owner');
              weddingsCount = Number(data.weddings ?? data.weddingCount ?? 0);
              if (!Number.isFinite(weddingsCount) || weddingsCount < 0) weddingsCount = 0;
              lastAccess =
                formatDateTime(data.lastAccess || data.lastLoginAt || data.updatedAt) || '�';
            }

            if (weddingsCount === 0) {
              weddingsCount = await getUserWeddingCount(userRecord.uid);
            }
          } catch (err) {
            logger.warn('[admin-dashboard] Could not fetch user details from Firestore', {
              uid: userRecord.uid,
            });
          }

          items.push({
            id: userRecord.uid,
            email: userRecord.email || `${userRecord.uid}@nomail.com`,
            role,
            status,
            lastAccess,
            weddings: weddingsCount,
            createdAt: formatDateOnly(userRecord.metadata.creationTime) || '�',
          });
        }
      } catch (authError) {
        console.error('  �R Firebase Auth also failed:', authError.message);
        logger.error('[admin-dashboard] Firebase Auth listUsers failed', authError);
        throw authError;
      }
    }

    console.log(
      `  �S& Returning ${items.length} users (source: ${fromAuth ? 'firebase-auth' : 'firestore'})`
    );
    console.log('  - Sample user:', items[0] || 'none');

    return res.json({
      items,
      meta: {
        count: items.length,
        limit,
        status: statusFilter || 'all',
        source: fromAuth ? 'firebase-auth' : 'firestore',
      },
    });
  } catch (error) {
    console.error('  �R Role summary error:', error.message);
    logger.error('[admin-dashboard] users/role-summary error', error);
    return res
      .status(500)
      .json({ error: 'admin_dashboard_role_summary_failed', message: error.message });
  }
});

router.get('/portfolio', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, MAX_LIMIT);
  const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const order = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const fromDateFilter = parseDateParam(req.query.fromDate, false);
  const toDateFilter = parseDateParam(req.query.toDate, true);

  console.log('�x� [DEBUG] GET /portfolio endpoint called');
  console.log('  - Limit:', limit);
  console.log('  - Status filter:', statusFilter || 'all');
  console.log('  - Order:', order);

  try {
    // Buscar bodas en ambos lugares: colección raíz Y subcolecciones
    const allDocs = [];
    const seenIds = new Set(); // Para deduplicar

    // 1. Buscar en colección raíz (sin orderBy para evitar problemas con updatedAt faltante)
    try {
      console.log('  - Querying root weddings collection...');
      const rootSnap = await collections.weddings().limit(limit).get();
      console.log(`  - Root collection returned ${rootSnap.size} documents`);
      rootSnap.docs.forEach((doc) => {
        if (!seenIds.has(doc.id)) {
          allDocs.push(doc);
          seenIds.add(doc.id);
        }
      });
    } catch (rootError) {
      console.warn('  - Root collection failed:', rootError.message);
    }

    // 2. Buscar en subcolecciones users/{uid}/weddings
    try {
      console.log('  - Querying users subcollections...');
      const usersSnap = await collections.users().limit(100).get();
      console.log(`  - Found ${usersSnap.size} users to check`);

      for (const userDoc of usersSnap.docs) {
        try {
          const userWeddingsSnap = await userDoc.ref.collection('weddings').limit(10).get();

          if (!userWeddingsSnap.empty) {
            console.log(`  - User ${userDoc.id} has ${userWeddingsSnap.size} weddings`);
            userWeddingsSnap.docs.forEach((doc) => {
              if (!seenIds.has(doc.id)) {
                allDocs.push(doc);
                seenIds.add(doc.id);
              } else {
                console.log(`  - Skipping duplicate wedding: ${doc.id}`);
              }
            });
          }
        } catch (subError) {
          // Algunos usuarios pueden no tener bodas o no tienen updatedAt
        }
      }
    } catch (usersError) {
      console.warn('  - Subcollections query failed:', usersError.message);
    }

    console.log(`  - Total UNIQUE documents found: ${allDocs.length}`);

    if (allDocs.length === 0) {
      console.log('  �a�️ No wedding documents found');
      return res.json({
        items: [],
        meta: {
          count: 0,
          limit,
          status: statusFilter || 'all',
          order,
        },
      });
    }

    const items = [];
    for (const docSnap of allDocs) {
      const data = docSnap.data() || {};
      const status = String(data.status || (data.active === false ? 'archived' : 'active'));
      if (statusFilter && status !== statusFilter) continue;

      const eventDateRaw =
        data.eventDate || data.weddingDate || data.date || data.weddingInfo?.weddingDate || null;

      // Convertir fecha de forma segura - DEBUG
      let eventDateDate = null;
      try {
        // Log para ver qué tipo de dato es
        console.log(`[portfolio] Wedding ${docSnap.id} eventDateRaw:`, {
          value: eventDateRaw,
          type: typeof eventDateRaw,
          hasToDate: eventDateRaw?.toDate !== undefined,
          constructor: eventDateRaw?.constructor?.name,
        });

        eventDateDate = toDate(eventDateRaw);
      } catch (dateError) {
        console.warn(
          '[portfolio] Error converting event date:',
          dateError.message,
          'for wedding:',
          docSnap.id
        );
        eventDateDate = null;
      }
      if (fromDateFilter && (!eventDateDate || eventDateDate < fromDateFilter)) continue;
      if (toDateFilter && (!eventDateDate || eventDateDate > toDateFilter)) continue;

      const item = {
        id: docSnap.id,
        couple:
          data.couple ||
          data.name ||
          data.title ||
          data.weddingInfo?.coupleName ||
          'Boda sin nombre',
        owner:
          data.owner ||
          data.ownerEmail ||
          (Array.isArray(data.ownerIds) && data.ownerIds.length ? data.ownerIds[0] : 'N/A'),
        eventDate: eventDateDate ? formatDateOnly(eventDateDate) : 'N/A',
        status,
        confirmedGuests: Number(
          data.confirmedGuests ?? data.stats?.confirmedGuests ?? data.guestsConfirmed ?? 0
        ),
        signedContracts: Number(
          data.signedContracts ??
            data.contractsSigned ??
            (Array.isArray(data.contracts) ? data.contracts.length : 0)
        ),
      };

      items.push(item);
      if (items.length >= limit) break;
    }

    console.log(`  �S& Returning ${items.length} weddings`);
    console.log('  - First wedding:', items[0]);

    return res.json({
      items,
      meta: {
        count: items.length,
        limit,
        status: statusFilter || 'all',
        order,
        fromDate: fromDateFilter ? formatDateOnly(fromDateFilter) : null,
        toDate: toDateFilter ? formatDateOnly(toDateFilter) : null,
      },
    });
  } catch (error) {
    console.error('  �R Portfolio endpoint error:', error.message);
    logger.error('[admin-dashboard] portfolio error', error);
    return res
      .status(500)
      .json({ error: 'admin_dashboard_portfolio_failed', message: error.message });
  }
});

// --- Mutations ---

// Crear tarea admin
router.post('/tasks', async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body || {};
    const t = String(title || '').trim();
    if (!t) return res.status(400).json({ error: 'title_required' });
    const data = {
      title: t,
      completed: false,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: serverTs(),
    };
    const ref = await collections.tasks().add(data);
    const doc = await ref.get();
    const task = mapTaskDoc(doc);
    await writeAdminAudit(req, 'ADMIN_TASK_CREATE', {
      resourceType: 'adminTask',
      resourceId: ref.id,
      payload: { title: t },
    });
    return res.status(201).json({ id: ref.id, task });
  } catch (error) {
    logger.error('[admin-dashboard] create task error', error);
    return res.status(500).json({ error: 'admin_task_create_failed' });
  }
});

// Actualizar tarea (PUT/PATCH)
async function updateTaskHandler(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'task_id_required' });
    const patch = {};
    if (typeof req.body?.completed === 'boolean') patch.completed = !!req.body.completed;
    if (typeof req.body?.title === 'string') patch.title = String(req.body.title).trim();
    patch.updatedAt = serverTs();
    await collections.tasks().doc(id).set(patch, { merge: true });
    await writeAdminAudit(req, 'ADMIN_TASK_UPDATE', {
      resourceType: 'adminTask',
      resourceId: id,
      payload: patch,
    });
    return res.json({ success: true });
  } catch (error) {
    logger.error('[admin-dashboard] update task error', error);
    return res.status(500).json({ error: 'admin_task_update_failed' });
  }
}
router.patch('/tasks/:id', updateTaskHandler);
router.put('/tasks/:id', updateTaskHandler);

// Resolver alerta
router.post('/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'alert_id_required' });
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';
    const resolvedBy = getActor(req);
    await collections
      .alerts()
      .doc(id)
      .set(
        {
          resolved: true,
          resolvedAt: serverTs(),
          resolvedBy,
          resolutionNotes: notes || admin.firestore.FieldValue.delete(),
        },
        { merge: true }
      );
    await writeAdminAudit(req, 'ADMIN_ALERT_RESOLVE', {
      resourceType: 'adminAlert',
      resourceId: id,
      payload: { notes },
    });
    return res.json({ success: true });
  } catch (error) {
    logger.error('[admin-dashboard] resolve alert error', error);
    return res.status(500).json({ error: 'admin_alert_resolve_failed' });
  }
});

// Toggle/actualizar feature flag
async function updateFlagHandler(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'flag_id_required' });
    if (typeof req.body?.enabled !== 'boolean')
      return res.status(400).json({ error: 'enabled_required' });
    const patch = {
      enabled: !!req.body.enabled,
      lastModifiedBy: getActor(req),
      lastModifiedAt: serverTs(),
    };
    await collections.featureFlags().doc(id).set(patch, { merge: true });
    const doc = await collections.featureFlags().doc(id).get();
    const flag = mapFeatureFlagDoc(doc);
    await writeAdminAudit(req, 'ADMIN_FLAG_UPDATE', {
      resourceType: 'featureFlag',
      resourceId: id,
      payload: { enabled: patch.enabled },
    });
    return res.json({ success: true, flag });
  } catch (error) {
    logger.error('[admin-dashboard] update flag error', error);
    return res.status(500).json({ error: 'admin_flag_update_failed' });
  }
}
router.patch('/settings/flags/:id', updateFlagHandler);
router.put('/settings/flags/:id', updateFlagHandler);

// Rotar secreto
router.post('/settings/secrets/:id/rotate', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'secret_id_required' });
    await collections
      .secrets()
      .doc(id)
      .set(
        {
          lastRotatedAt: serverTs(),
          rotatedBy: getActor(req),
        },
        { merge: true }
      );
    await writeAdminAudit(req, 'ADMIN_SECRET_ROTATE', { resourceType: 'secret', resourceId: id });
    return res.json({ success: true });
  } catch (error) {
    logger.error('[admin-dashboard] rotate secret error', error);
    return res.status(500).json({ error: 'admin_secret_rotate_failed' });
  }
});

// Guardar plantilla
router.put('/settings/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const content = typeof req.body?.content === 'string' ? req.body.content : null;
    if (!id || content == null)
      return res.status(400).json({ error: 'template_id_and_content_required' });
    await collections.templates().doc(id).set({ content, updatedAt: serverTs() }, { merge: true });
    await writeAdminAudit(req, 'ADMIN_TEMPLATE_SAVE', { resourceType: 'template', resourceId: id });
    return res.json({ success: true });
  } catch (error) {
    logger.error('[admin-dashboard] save template error', error);
    return res.status(500).json({ error: 'admin_template_save_failed' });
  }
});

// GET /broadcasts - Obtener historial de broadcasts
router.get('/broadcasts', async (_req, res) => {
  try {
    const docs = await getCollectionDocs('broadcasts', {
      orderBy: 'createdAt',
      direction: 'desc',
      limit: 100,
    });

    const broadcasts = docs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        type: data.type || 'email',
        subject: data.subject || '',
        content: data.content || '',
        segment: data.segment || 'Todos',
        scheduledAt: formatDateTime(data.scheduledAt) || formatDateTime(data.createdAt),
        status: data.status || 'Pendiente',
        stats: data.stats || { sent: 0, opened: 0, clicked: 0 },
        createdAt: formatDateTime(data.createdAt),
        createdBy: data.createdBy || 'Admin',
      };
    });

    res.json(broadcasts);
  } catch (error) {
    logger.error('[admin-dashboard] broadcasts GET error', error);
    res.status(500).json({ error: 'admin_broadcasts_failed' });
  }
});

// Crear broadcast
router.post('/broadcasts', async (req, res) => {
  try {
    const {
      type = 'email',
      subject = '',
      content = '',
      segment = 'Todos',
      scheduledAt,
    } = req.body || {};
    const tSubject = String(subject || '').trim();
    if (!tSubject) return res.status(400).json({ error: 'subject_required' });
    const data = {
      type,
      subject: tSubject,
      content: String(content || ''),
      segment: String(segment || 'Todos'),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : serverTs(),
      status: 'Pendiente',
      stats: null,
      createdAt: serverTs(),
      createdBy: getActor(req),
    };
    const ref = await collections.broadcasts().add(data);
    const doc = await ref.get();
    const item = mapBroadcastDoc(doc);
    await writeAdminAudit(req, 'ADMIN_BROADCAST_CREATE', {
      resourceType: 'broadcast',
      resourceId: ref.id,
      payload: { subject: tSubject },
    });
    return res.status(201).json({ id: ref.id, item });
  } catch (error) {
    logger.error('[admin-dashboard] create broadcast error', error);
    return res.status(500).json({ error: 'admin_broadcast_create_failed' });
  }
});

// --- Users role summary ---
router.get('/users/role-summary', async (_req, res) => {
  const started = Date.now();
  console.log('�x� [DEBUG] GET /users/role-summary endpoint called');
  try {
    console.log('  - Querying users collection...');
    const snap = await collections.users().limit(2000).get();
    console.log(`  - Found ${snap.size} user documents`);
    const roles = { owner: 0, planner: 0, assistant: 0 };
    let scanned = 0;
    let totalReal = 0;
    let totalExcluded = 0;

    const filters = {
      allowedStatuses: ['active'],
      excludedEmailSuffixes: ['test.com', 'example.com'],
      excludedEmailPrefixes: ['test-', 'demo-'],
      excludedEmailContains: [],
      excludedTags: ['bot', 'test'],
      excludedBooleanKeys: ['isTestUser', 'isBot'],
    };

    const ownerBucket = {
      label: 'Owners',
      total: 0,
      real: 0,
      excluded: { total: 0, byReason: { status: 0, flags: 0, email: 0 } },
    };
    const plannerBucket = {
      label: 'Wedding planners',
      total: 0,
      real: 0,
      excluded: { total: 0, byReason: { status: 0, flags: 0, email: 0 } },
    };
    const assistantBucket = {
      label: 'Assistants',
      total: 0,
      real: 0,
      excluded: { total: 0, byReason: { status: 0, flags: 0, email: 0 } },
    };

    for (const doc of snap.docs) {
      scanned += 1;
      const data = doc.data() || {};
      const email = String(data.email || '').toLowerCase();
      const status = String(data.status || 'active').toLowerCase();
      const role = String(data.role || 'owner').toLowerCase();

      let bucket;
      if (role.includes('planner')) bucket = plannerBucket;
      else if (role.includes('assistant')) bucket = assistantBucket;
      else bucket = ownerBucket;

      bucket.total += 1;

      // Verificar si debe ser excluido
      let isExcluded = false;
      let excludeReason = null;

      // Por status
      if (!filters.allowedStatuses.includes(status)) {
        isExcluded = true;
        excludeReason = 'status';
      }

      // Por email
      if (!isExcluded) {
        const emailExcluded =
          filters.excludedEmailSuffixes.some((suffix) => email.endsWith(suffix)) ||
          filters.excludedEmailPrefixes.some((prefix) => email.startsWith(prefix));
        if (emailExcluded) {
          isExcluded = true;
          excludeReason = 'email';
        }
      }

      // Por flags
      if (!isExcluded) {
        const hasExcludedFlag = filters.excludedBooleanKeys.some((key) => data[key] === true);
        if (hasExcludedFlag) {
          isExcluded = true;
          excludeReason = 'flags';
        }
      }

      if (isExcluded) {
        bucket.excluded.total += 1;
        if (excludeReason) bucket.excluded.byReason[excludeReason] += 1;
        totalExcluded += 1;
      } else {
        bucket.real += 1;
        totalReal += 1;
      }
    }

    console.log(
      `  �S& Role summary: owner=${ownerBucket.real}, planner=${plannerBucket.real}, assistant=${assistantBucket.real}`
    );

    const durationMs = Date.now() - started;
    return res.json({
      generatedAt: new Date().toISOString(),
      durationMs,
      scanned,
      totals: { total: scanned, real: totalReal, excluded: totalExcluded },
      roles: { owner: ownerBucket, planner: plannerBucket, assistant: assistantBucket },
      filters,
      source: 'firestore',
      error: '',
    });
  } catch (error) {
    logger.warn('[admin-dashboard] role-summary error', error);
    const durationMs = Date.now() - started;
    return res.json({
      generatedAt: new Date().toISOString(),
      durationMs,
      scanned: 0,
      totals: { total: 0, real: 0, excluded: 0 },
      roles: {
        owner: {
          label: 'Owners',
          total: 0,
          real: 0,
          excluded: { total: 0, byReason: { status: 0, flags: 0, email: 0 } },
        },
        planner: {
          label: 'Wedding planners',
          total: 0,
          real: 0,
          excluded: { total: 0, byReason: { status: 0, flags: 0, email: 0 } },
        },
        assistant: {
          label: 'Assistants',
          total: 0,
          real: 0,
          excluded: { total: 0, byReason: { status: 0, flags: 0, email: 0 } },
        },
      },
      filters: {
        allowedStatuses: [],
        excludedEmailSuffixes: [],
        excludedEmailPrefixes: [],
        excludedEmailContains: [],
        excludedTags: [],
        excludedBooleanKeys: [],
      },
      source: 'fallback',
      error: 'role_summary_failed',
    });
  }
});

// --- Discounts ---
async function fetchDiscountsDataset({ limit = 500 } = {}) {
  const [docs, managerDocs, commercialDocs] = await Promise.all([
    getCollectionDocs('discountLinks', { orderBy: 'createdAt', limit }),
    getCollectionDocs('salesManagers', { orderBy: 'createdAt', limit }),
    getCollectionDocs('salesCommercials', { orderBy: 'createdAt', limit }),
  ]);

  const toIso = (value) => {
    const date = toDate(value);
    return date ? date.toISOString() : null;
  };

  const managers = managerDocs.map((doc) => {
    const data = doc.data() || {};
    const base = hydrateSalesManager({ id: doc.id, ...data }) || { id: doc.id };
    const commissionRules = normalizeCommissionRules(data.commissionRules || null, {
      defaultCurrency: data.currency || 'EUR',
    });
    return {
      id: base.id || doc.id,
      name: base.name || '',
      email: base.email || '',
      phone: base.phone || '',
      notes: base.notes || '',
      status: base.status || 'active',
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
      commissionRules,
    };
  });

  const managerDirectory = new Map();
  managers.forEach((manager) => {
    const keys = [
      manager.id,
      manager.email ? manager.email.toLowerCase() : null,
      manager.name ? manager.name.toLowerCase() : null,
      manager.phone ? manager.phone.replace(/\s+/g, '') : null,
    ].filter(Boolean);
    keys.forEach((key) => managerDirectory.set(key, manager));
  });

  const commercials = commercialDocs.map((doc) => {
    const data = doc.data() || {};
    const base = sanitizeContactInput({ id: doc.id, ...data }) || { id: doc.id };
    const managerId = data.managerId || base.managerId || null;
    const managerSnapshot = data.manager ? sanitizeContactInput(data.manager) : null;
    const resolvedManager = hydrateSalesManager(
      managerSnapshot || { id: managerId || null },
      managerDirectory
    );

    return {
      id: base.id || doc.id,
      name: base.name || '',
      email: base.email || '',
      phone: base.phone || '',
      notes: base.notes || '',
      status: data.status || 'active',
      managerId: resolvedManager?.id || managerId || null,
      manager: resolvedManager || null,
      assignedLinks: Array.isArray(data.assignedLinks) ? data.assignedLinks : [],
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    };
  });

  const managerIdentifiers = new Set();
  managers.forEach((manager) => {
    const key = contactKey(manager);
    if (key) managerIdentifiers.add(key);
  });
  commercials.forEach((commercial) => {
    if (commercial.manager) {
      const key = contactKey(commercial.manager);
      if (key) managerIdentifiers.add(key);
    }
  });

  const items = docs.map((doc) => {
    const data = doc.data() || {};

    const commissionRules = normalizeCommissionRules(data.commissionRules || null, {
      defaultCurrency: data.currency || 'EUR',
    });

    const commissionEstimate = commissionRules
      ? estimateCommissionFromRules(commissionRules, Number(data.revenue || 0))
      : 0;

    const assignedTo = sanitizeContactInput(data.assignedTo) || null;
    const salesManager = hydrateSalesManager(data.salesManager, managerDirectory);

    if (salesManager) {
      const key = contactKey(salesManager);
      if (key) managerIdentifiers.add(key);
    }

    const createdAtDate = toDate(data.createdAt);
    const updatedAtDate = toDate(data.updatedAt);

    return {
      id: doc.id,
      code: data.code || doc.id,
      url: data.url || null,
      type: data.type || 'campaign',
      uses: Number(data.uses ?? data.usesCount ?? 0),
      maxUses: data.maxUses ?? null,
      revenue: Number(data.revenue || 0),
      currency: data.currency || 'EUR',
      status: data.status || 'active',
      discountPercentage: Number.isFinite(Number(data.discountPercentage))
        ? Number(data.discountPercentage)
        : 0,
      validFrom: toIso(data.validFrom),
      validUntil: toIso(data.validUntil),
      assignedTo,
      salesManager,
      notes: data.notes || null,
      commissionRules,
      commissionEstimate,
      createdAt: createdAtDate ? formatDateOnly(createdAtDate) : null,
      updatedAt: updatedAtDate ? formatDateOnly(updatedAtDate) : null,
    };
  });

  const summary = items.reduce(
    (acc, it) => {
      acc.totalLinks += 1;
      acc.totalUses += it.uses;
      acc.totalRevenue += it.revenue;
      if (it.commissionRules && it.commissionRules.periods?.length) {
        acc.commission.total += toSafeNumber(it.commissionEstimate);
        acc.commission.configured += 1;
      } else {
        acc.commission.missing += 1;
      }
      return acc;
    },
    {
      totalLinks: 0,
      totalUses: 0,
      totalRevenue: 0,
      currency: 'EUR',
      commission: {
        total: 0,
        configured: 0,
        missing: 0,
        currency: 'EUR',
        average: 0,
      },
    }
  );

  summary.totalManagers = managerIdentifiers.size;

  if (items.length) {
    summary.currency = items[0]?.currency || summary.currency || 'EUR';
    summary.commission.currency = summary.currency;
    summary.commission.average = summary.commission.configured
      ? summary.commission.total / Math.max(summary.commission.configured, 1)
      : 0;
    summary.commission.total = Number(summary.commission.total.toFixed(2));
    summary.commission.average = Number(summary.commission.average.toFixed(2));
  }

  return {
    payload: {
      items,
      summary,
      managers,
      commercials,
    },
    helpers: {
      managerDirectory,
    },
  };
}

router.get('/discounts', async (_req, res) => {
  console.log('[DEBUG] GET /discounts endpoint called');
  try {
    const { payload } = await fetchDiscountsDataset({ limit: 500 });
    return res.json(payload);
  } catch (error) {
    console.error('[admin-dashboard] Failed to fetch discount links:', error);
    logger.error('[admin-dashboard] discounts fetch failed', error);
    return res.status(500).json({
      error: 'discounts_fetch_failed',
      message: error?.message || 'No se pudieron cargar los c�digos de descuento.',
    });
  }
});

const COMMERCE_PAYOUT_STATUSES = ['paid', 'succeeded', 'completed'];

class CommercePayoutsError extends Error {
  constructor(code, message, status = 400, details = null) {
    super(message);
    this.name = 'CommercePayoutsError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function buildCommercePayoutPreview({ periodInput, limit = 500 } = {}) {
  let period;
  try {
    period = resolveCommercePeriod(periodInput);
  } catch (periodError) {
    throw new CommercePayoutsError(
      'invalid_period',
      periodError.message || 'Periodo inválido.',
      400
    );
  }

  const { payload } = await fetchDiscountsDataset({ limit });
  const { items, managers, commercials } = payload;

  const managerRulesMap = new Map();
  managers.forEach((manager) => {
    if (manager.id) managerRulesMap.set(manager.id, manager);
    const key = contactKey(manager);
    if (key) managerRulesMap.set(key.toLowerCase(), manager);
  });

  const commercialDirectory = new Map();
  commercials.forEach((commercial) => {
    const keys = [
      commercial.id,
      commercial.email ? commercial.email.toLowerCase() : null,
      commercial.phone ? commercial.phone.replace(/\s+/g, '') : null,
      commercial.name ? commercial.name.toLowerCase() : null,
    ].filter(Boolean);
    keys.forEach((key) => commercialDirectory.set(key, commercial));
  });

  const startTs = admin.firestore.Timestamp.fromDate(period.start);
  const endTs = admin.firestore.Timestamp.fromDate(period.end);

  let paymentsSnapshot = null;
  let needsIndex = false;
  try {
    paymentsSnapshot = await db
      .collection('_system')
      .doc('config')
      .collection('payments')
      .where('status', 'in', COMMERCE_PAYOUT_STATUSES)
      .where('createdAt', '>=', startTs)
      .where('createdAt', '<', endTs)
      .get();
  } catch (error) {
    if (error.code === 9 || error.code === 'failed-precondition') {
      needsIndex = true;
    } else {
      throw error;
    }
  }

  if (!paymentsSnapshot) {
    try {
      paymentsSnapshot = await db
        .collection('_system')
        .doc('config')
        .collection('payments')
        .where('createdAt', '>=', startTs)
        .where('createdAt', '<', endTs)
        .get();
    } catch (fallbackError) {
      console.warn(
        '[admin-dashboard] payouts preview fallback query failed:',
        fallbackError?.message
      );
      paymentsSnapshot = { empty: true, docs: [] };
      needsIndex = true;
    }
  }

  const paymentsByCode = new Map();
  const unmatchedPayments = [];
  const paymentDocs = paymentsSnapshot?.docs || [];

  paymentDocs.forEach((docSnap) => {
    const raw = docSnap.data() || {};
    const code = (raw.discountCode || raw.coupon || raw.code || '').toString().trim().toUpperCase();
    const amountRaw = raw.amount ?? raw.total ?? raw.value ?? 0;
    let amount = Number(amountRaw);
    if (!Number.isFinite(amount)) amount = 0;
    if (!amount || amount <= 0) return;

    const currency = (raw.currency || raw.currencyCode || raw.currencySymbol || 'EUR')
      .toString()
      .toUpperCase();
    const createdAt =
      toDate(raw.createdAt) || toDate(raw.paidAt) || toDate(raw.completedAt) || new Date();
    if (createdAt < period.start || createdAt >= period.end) return;

    const paymentRecord = {
      id: docSnap.id,
      amount,
      currency,
      createdAt,
      raw,
    };

    if (!code) {
      unmatchedPayments.push(paymentRecord);
      return;
    }

    if (!paymentsByCode.has(code)) paymentsByCode.set(code, []);
    paymentsByCode.get(code).push(paymentRecord);
  });

  const payoutsMap = new Map();
  const currencyTotals = new Map();
  const managerPaymentMap = new Map();

  const warnings = {
    missingCommissionRules: [],
    missingAssignedContacts: [],
    currencyMismatch: [],
    discountsWithoutPayments: [],
    managersMissingRules: [],
    needsIndex,
    unmatchedPayments: unmatchedPayments.length,
  };

  const discountPreviews = [];

  items.forEach((discount) => {
    const codeKey = (discount.code || discount.id || '').toString().trim().toUpperCase();
    const payments = paymentsByCode.get(codeKey) || [];
    const revenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const currency = (discount.currency || payments[0]?.currency || 'EUR').toUpperCase();

    const observedCurrencies = Array.from(new Set(payments.map((payment) => payment.currency)));
    if (observedCurrencies.length && observedCurrencies.some((value) => value !== currency)) {
      warnings.currencyMismatch.push({
        discountId: discount.id,
        code: discount.code,
        observed: observedCurrencies,
        expected: currency,
      });
    }

    const assignedContact = normalizePayoutContact(
      discount.assignedTo,
      determineDiscountRole(discount, discount.assignedTo)
    );
    if (!assignedContact || !assignedContact.email) {
      warnings.missingAssignedContacts.push({
        discountId: discount.id,
        code: discount.code,
      });
    }

    const commission = calculateCommission(payments, discount.commissionRules, {
      currency,
      startDate: period.start,
      fallbackPercentage: 0.05,
      revenue,
    });

    if (!discount.commissionRules || commission.hasRules === false) {
      warnings.missingCommissionRules.push({
        discountId: discount.id,
        code: discount.code,
        revenue,
      });
    }

    const role = determineDiscountRole(discount, assignedContact);
    if (assignedContact) {
      const beneficiaryKey = createBeneficiaryKey(
        assignedContact,
        role,
        currency,
        discount.code || discount.id
      );
      if (!payoutsMap.has(beneficiaryKey)) {
        const normalized = normalizePayoutContact(assignedContact, role);
        payoutsMap.set(beneficiaryKey, {
          beneficiary: normalized,
          currency,
          totals: { revenue: 0, commission: 0, payments: 0 },
          paymentsEvaluated: 0,
          discounts: [],
        });
      }
      const entry = payoutsMap.get(beneficiaryKey);
      entry.totals.revenue += revenue;
      entry.totals.commission += Number(commission.amount || 0);
      entry.totals.payments += payments.length;
      entry.paymentsEvaluated += commission.paymentsEvaluated || 0;
      entry.discounts.push({
        id: discount.id,
        code: discount.code,
        revenue,
        commission: Number(commission.amount || 0),
        payments: payments.length,
        hasRules: commission.hasRules !== false,
        breakdown: commission.breakdown || [],
      });
      addCurrencyTotal(currencyTotals, currency, revenue, commission.amount, beneficiaryKey);
    } else {
      addCurrencyTotal(currencyTotals, currency, revenue, commission.amount, null);
    }

    let managerContact = discount.salesManager;
    if (!managerContact && assignedContact) {
      const key = contactKey(assignedContact);
      if (key && commercialDirectory.has(key)) {
        managerContact = commercialDirectory.get(key).manager;
      }
    }

    if (managerContact && payments.length) {
      const managerKey = contactKey(managerContact) || managerContact.id || managerContact.email;
      if (managerKey) {
        const mapKey = `${managerKey.toLowerCase()}|${currency}`;
        if (!managerPaymentMap.has(mapKey)) {
          managerPaymentMap.set(mapKey, {
            manager: managerContact,
            currency,
            payments: [],
            revenue: 0,
          });
        }
        const managerEntry = managerPaymentMap.get(mapKey);
        managerEntry.payments.push(...payments);
        managerEntry.revenue += revenue;
      }
    }

    if (!payments.length) {
      warnings.discountsWithoutPayments.push({ id: discount.id, code: discount.code });
    }

    discountPreviews.push({
      id: discount.id,
      code: discount.code,
      currency,
      revenue,
      commission: Number(commission.amount || 0),
      payments: payments.length,
      hasRules: commission.hasRules !== false,
    });
  });

  const payouts = Array.from(payoutsMap.values())
    .map((entry) => ({
      ...entry,
      totals: {
        revenue: Number(entry.totals.revenue.toFixed(2)),
        commission: Number(entry.totals.commission.toFixed(2)),
        payments: entry.totals.payments,
      },
      paymentsEvaluated: entry.paymentsEvaluated,
      discounts: entry.discounts.map((discount) => ({
        ...discount,
        revenue: Number(discount.revenue.toFixed(2)),
        commission: Number(discount.commission.toFixed(2)),
      })),
    }))
    .sort((a, b) => b.totals.commission - a.totals.commission);

  const handledMissingManagers = new Set();
  const managerSummaries = [];
  managerPaymentMap.forEach((entry, key) => {
    const managerContact = entry.manager;
    const contactKeyValue = contactKey(managerContact) || managerContact.id || key.split('|')[0];
    const canonical =
      managerRulesMap.get(managerContact.id) ||
      managerRulesMap.get((contactKey(managerContact) || '').toLowerCase()) ||
      managerRulesMap.get((contactKeyValue || '').toLowerCase()) ||
      managerContact;
    const rules = canonical?.commissionRules || null;
    const commission = rules
      ? calculateCommission(entry.payments, rules, {
          currency: entry.currency,
          startDate: period.start,
        })
      : {
          amount: 0,
          currency: entry.currency,
          breakdown: [],
          paymentsEvaluated: 0,
          hasRules: false,
          unassignedRevenue: entry.revenue,
        };
    if (!rules) {
      const missingKey = canonical?.id || contactKeyValue || key;
      if (missingKey && !handledMissingManagers.has(missingKey)) {
        warnings.managersMissingRules.push({
          id: missingKey,
          name: canonical?.name || managerContact.name || managerContact.email || 'Manager',
        });
        handledMissingManagers.add(missingKey);
      }
    }
    managerSummaries.push({
      manager: {
        id: canonical?.id || managerContact.id || contactKeyValue || null,
        name:
          canonical?.name || managerContact.name || managerContact.email || 'Manager sin nombre',
        email: canonical?.email || managerContact.email || null,
        phone: canonical?.phone || managerContact.phone || null,
      },
      currency: entry.currency,
      totals: {
        revenue: Number(entry.revenue.toFixed(2)),
        commission: Number((commission.amount || 0).toFixed(2)),
        payments: entry.payments.length,
      },
      hasRules: commission.hasRules !== false,
      paymentsEvaluated: commission.paymentsEvaluated || 0,
      breakdown: commission.breakdown || [],
    });
  });
  managerSummaries.sort((a, b) => b.totals.commission - a.totals.commission);

  const totalsByCurrency = Array.from(currencyTotals.values()).map((entry) => ({
    currency: entry.currency,
    revenue: Number(entry.revenue.toFixed(2)),
    commission: Number(entry.commission.toFixed(2)),
    beneficiaries: entry.beneficiaryKeys.size,
  }));

  return {
    generatedAt: new Date().toISOString(),
    period: {
      id: period.id,
      label: period.label,
      start: period.start.toISOString(),
      end: new Date(period.end.getTime() - 1).toISOString(),
    },
    totals: totalsByCurrency,
    payouts,
    managers: managerSummaries,
    discounts: discountPreviews,
    warnings,
    stats: {
      discountCount: items.length,
      paymentSample: paymentDocs.length,
    },
  };
}

function normalizeDocIdSegment(value) {
  if (!value) return '';
  try {
    return String(value)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  } catch {
    return String(value || '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }
}

function buildPayoutDocId(entry) {
  const role = (entry?.beneficiary?.role || 'commercial').toLowerCase();
  const currency = (entry?.currency || 'EUR').toUpperCase();
  const rawIdentifier =
    entry?.beneficiary?.id ||
    entry?.beneficiary?.email ||
    entry?.beneficiary?.phone ||
    entry?.beneficiary?.name ||
    entry?.discounts?.[0]?.code ||
    'beneficiario';
  const normalized = normalizeDocIdSegment(rawIdentifier) || 'beneficiario';
  let hash = '';
  try {
    const key = createBeneficiaryKey(
      entry?.beneficiary || null,
      entry?.beneficiary?.role || role,
      currency,
      entry?.discounts?.[0]?.code || rawIdentifier || 'unknown'
    );
    hash = Buffer.from(String(key || 'unknown'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
      .slice(0, 8);
  } catch {
    hash = Math.random().toString(36).slice(2, 10);
  }
  const composed = `${role}-${currency}-${normalized}-${hash}`.replace(/-+/g, '-');
  return composed.length > 120 ? composed.slice(0, 120) : composed;
}

function resolveCommercePeriod(input) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();

  if (typeof input === 'string' && input.trim()) {
    const match = input.trim().match(/^(\d{4})-(\d{1,2})$/);
    if (!match) {
      throw new Error('Formato de periodo inv�lido. Usa YYYY-MM.');
    }
    year = Number(match[1]);
    month = Number(match[2]) - 1;
  } else if (input && typeof input === 'object') {
    if (Number.isInteger(input.year) && Number.isInteger(input.month)) {
      year = Number(input.year);
      month = Number(input.month) - (input.month > 0 ? 1 : 0);
    }
  }

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    throw new Error('Periodo inv�lido.');
  }

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 1, 0, 0, 0, 0);
  const label = start.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  return {
    id: `${year}-${String(month + 1).padStart(2, '0')}`,
    label,
    start,
    end,
  };
}

function determineDiscountRole(discount, contact) {
  if (contact && typeof contact === 'object' && contact.role) {
    return String(contact.role).toLowerCase();
  }
  const type = (discount?.type || '').toLowerCase();
  if (type.includes('influencer')) return 'influencer';
  if (type.includes('manager')) return 'manager';
  if (type.includes('affiliate')) return 'affiliate';
  return 'commercial';
}

function createBeneficiaryKey(contact, role, currency, fallback) {
  const key =
    contactKey(contact) ||
    (contact && contact.id) ||
    (contact && contact.email) ||
    fallback ||
    'unknown';
  return [
    role || 'commercial',
    (currency || 'EUR').toUpperCase(),
    key.toString().toLowerCase(),
  ].join('|');
}

function addCurrencyTotal(map, currency, revenue, commission, beneficiaryKey) {
  const key = (currency || 'EUR').toUpperCase();
  if (!map.has(key)) {
    map.set(key, { currency: key, revenue: 0, commission: 0, beneficiaryKeys: new Set() });
  }
  const entry = map.get(key);
  entry.revenue += Number(revenue || 0);
  entry.commission += Number(commission || 0);
  if (beneficiaryKey) {
    entry.beneficiaryKeys.add(beneficiaryKey);
  }
}

function normalizePayoutContact(contact, roleFallback = 'commercial') {
  if (!contact || typeof contact !== 'object') {
    return { id: null, name: 'Sin asignar', email: null, role: roleFallback };
  }
  return {
    id: contact.id || null,
    name: contact.name || contact.email || 'Sin asignar',
    email: contact.email || null,
    phone: contact.phone || null,
    role: contact.role || roleFallback,
  };
}

router.post('/commerce/payouts/preview', async (req, res) => {
  console.log('[DEBUG] POST /commerce/payouts/preview called');
  try {
    const periodInput = req.body?.period ?? req.query?.period ?? null;
    const preview = await buildCommercePayoutPreview({ periodInput, limit: 500 });
    return res.json(preview);
  } catch (error) {
    if (error instanceof CommercePayoutsError) {
      const status = error.status || 400;
      const response = {
        error: error.code || 'commerce_payout_error',
        message: error.message || 'No se pudo generar la previsión de pagos comerciales.',
      };
      if (error.details) response.details = error.details;
      return res.status(status).json(response);
    }
    console.error('[admin-dashboard] commerce payouts preview error:', error);
    logger.error('[admin-dashboard] commerce payouts preview error', error);
    return res.status(500).json({
      error: 'commerce_payout_preview_failed',
      message: error?.message || 'No se pudo generar la previsión de pagos comerciales.',
    });
  }
});
router.post('/commerce/payouts/commit', async (req, res) => {
  console.log('[DEBUG] POST /commerce/payouts/commit called');
  try {
    const periodInput = req.body?.period ?? req.query?.period ?? null;
    const sourceRaw = typeof req.body?.source === 'string' ? req.body.source.trim() : '';
    const notesRaw = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';
    const source = sourceRaw || 'manual';

    const preview = await buildCommercePayoutPreview({ periodInput, limit: 500 });
    if (!preview?.period?.id) {
      throw new CommercePayoutsError(
        'invalid_period',
        'No se pudo determinar el periodo de liquidación.',
        400
      );
    }

    const actor = getActor(req);
    const periodId = preview.period.id;
    const periodRef = db.collection('commercePayouts').doc(periodId);
    const payouts = Array.isArray(preview.payouts) ? preview.payouts : [];
    const stats = preview.stats || {};
    const warnings = preview.warnings || {};

    let version = 1;
    await db.runTransaction(async (transaction) => {
      const summarySnap = await transaction.get(periodRef);
      const existingSummary = summarySnap.exists ? summarySnap.data() : null;
      version = Number(existingSummary?.version || 0) + 1;

      const summaryPayload = {
        period: preview.period,
        totals: preview.totals,
        managers: preview.managers,
        stats,
        warnings,
        generatedAt: preview.generatedAt,
        committedAt: serverTs(),
        committedBy: actor,
        source,
        version,
        payoutsCount: payouts.length,
        updatedAt: serverTs(),
        lastCommit: {
          by: actor,
          at: preview.generatedAt,
          source,
        },
      };
      if (notesRaw) {
        summaryPayload.notes = notesRaw;
      }
      transaction.set(periodRef, summaryPayload, { merge: true });

      const payoutCollection = periodRef.collection('payouts');
      for (const entry of payouts) {
        const docId = buildPayoutDocId(entry);
        const docRef = payoutCollection.doc(docId);
        const snap = await transaction.get(docRef);
        const existingData = snap.exists ? snap.data() : null;
        const status =
          existingData?.status && existingData.status !== 'calculated'
            ? existingData.status
            : 'calculated';

        const docPayload = {
          periodId,
          period: preview.period,
          beneficiaryKey: createBeneficiaryKey(
            entry.beneficiary,
            entry?.beneficiary?.role || 'commercial',
            entry.currency,
            entry.discounts?.[0]?.code || entry.beneficiary?.id || null
          ),
          beneficiary: entry.beneficiary,
          currency: entry.currency,
          totals: entry.totals,
          paymentsEvaluated: entry.paymentsEvaluated || 0,
          discounts: entry.discounts,
          status,
          adjustments: Array.isArray(existingData?.adjustments) ? existingData.adjustments : [],
          notes: Array.isArray(existingData?.notes) ? existingData.notes : [],
          lastCalculation: {
            at: preview.generatedAt,
            by: actor,
            source,
            version,
          },
          updatedAt: serverTs(),
        };
        if (!snap.exists) {
          docPayload.createdAt = serverTs();
        }
        transaction.set(docRef, docPayload, { merge: true });
      }
    });

    await writeAdminAudit(req, 'commerce_payouts_commit', {
      resourceType: 'commercePayouts',
      resourceId: preview.period.id,
      payload: {
        period: preview.period,
        payouts: payouts.length,
        source,
        version,
      },
    });

    return res.json({
      ok: true,
      period: preview.period,
      totals: preview.totals,
      payouts: payouts.length,
      managers: Array.isArray(preview.managers) ? preview.managers.length : 0,
      version,
      warnings,
      stats,
    });
  } catch (error) {
    if (error instanceof CommercePayoutsError) {
      const status = error.status || 400;
      const response = {
        error: error.code || 'commerce_payout_error',
        message: error.message || 'No se pudo guardar la liquidación de pagos.',
      };
      if (error.details) response.details = error.details;
      return res.status(status).json(response);
    }
    console.error('[admin-dashboard] commerce payouts commit error:', error);
    logger.error('[admin-dashboard] commerce payouts commit error', error);
    return res.status(500).json({
      error: 'commerce_payout_commit_failed',
      message: error?.message || 'No se pudo guardar la liquidación de pagos.',
    });
  }
});
router.post('/discounts', async (req, res) => {
  console.log('�x� [DEBUG] POST /discounts endpoint called');
  try {
    const {
      code,
      url,
      type,
      maxUses,
      assignedTo,
      salesManager,
      notes,
      discountPercentage,
      validFrom,
      validUntil,
      currency: bodyCurrency,
      commissionRules: rawCommissionRules,
    } = req.body || {};

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'code_required' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const cleanUrl = String(url || '').trim();
    const cleanType = String(type || 'campaign').trim();
    const isPermanent = maxUses === null || maxUses === undefined || maxUses === 0;
    const maxUsesValue = isPermanent ? null : Math.max(1, Number(maxUses) || 1);
    const parsedDiscount = Number(discountPercentage);
    const cleanDiscountPercentage = Number.isFinite(parsedDiscount) ? parsedDiscount : 0;
    const fromDate = validFrom ? new Date(validFrom) : null;
    const untilDate = validUntil ? new Date(validUntil) : null;
    const cleanValidFrom = fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : null;
    const cleanValidUntil = untilDate && !Number.isNaN(untilDate.getTime()) ? untilDate : null;

    const normalizedCommissionRules = normalizeCommissionRules(rawCommissionRules, {
      defaultCurrency: 'EUR',
    });
    const cleanCurrency =
      typeof bodyCurrency === 'string' && bodyCurrency.trim()
        ? bodyCurrency.trim().toUpperCase()
        : normalizedCommissionRules?.currency || 'EUR';

    // Verificar si ya existe
    const existing = await collections
      .discountLinks()
      .where('code', '==', cleanCode)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ error: 'code_already_exists' });
    }

    const sanitizedAssignedTo = sanitizeContactInput(assignedTo);
    const sanitizedSalesManager = sanitizeContactInput(salesManager);

    const newDiscount = {
      code: cleanCode,
      url: cleanUrl || `https://maloveapp.com/registro?ref=${cleanCode}`,
      type: cleanType,
      maxUses: maxUsesValue,
      uses: 0,
      usesCount: 0,
      status: 'activo',
      discountPercentage: cleanDiscountPercentage,
      validFrom: cleanValidFrom,
      validUntil: cleanValidUntil,
      revenue: 0,
      currency: cleanCurrency,
      assignedTo: sanitizedAssignedTo
        ? {
            id: sanitizedAssignedTo.id || null,
            name: sanitizedAssignedTo.name || null,
            email: sanitizedAssignedTo.email || null,
            phone: sanitizedAssignedTo.phone || null,
            notes: sanitizedAssignedTo.notes || null,
          }
        : null,
      salesManager: sanitizedSalesManager
        ? {
            id: sanitizedSalesManager.id || null,
            name: sanitizedSalesManager.name || null,
            email: sanitizedSalesManager.email || null,
            phone: sanitizedSalesManager.phone || null,
            notes: sanitizedSalesManager.notes || null,
            status: sanitizedSalesManager.status || 'active',
          }
        : null,
      notes: String(notes || '').trim() || null,
      commissionRules: normalizedCommissionRules || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'admin',
    };

    const docRef = await collections.discountLinks().add(newDiscount);
    const createdSnap = await docRef.get();
    const createdData = createdSnap.data() || {};

    const createdCommission = normalizeCommissionRules(createdData.commissionRules || null, {
      defaultCurrency: createdData.currency || 'EUR',
    });

    const responseAssignedTo = sanitizeContactInput(createdData.assignedTo);
    const responseSalesManager = sanitizeContactInput(createdData.salesManager);
    const createdUses = Number(createdData.uses ?? createdData.usesCount ?? 0);
    const createdRevenue = Number(createdData.revenue || 0);

    console.log(
      `  �S& Created discount code: ${cleanCode} (${isPermanent ? 'permanent' : `max ${maxUsesValue} uses`})`
    );

    return res.status(201).json({
      id: createdSnap.id,
      code: createdData.code || createdSnap.id,
      url: createdData.url || null,
      type: createdData.type || 'campaign',
      uses: createdUses,
      maxUses: createdData.maxUses ?? null,
      revenue: createdRevenue,
      currency: createdData.currency || 'EUR',
      status: createdData.status || 'active',
      discountPercentage: Number.isFinite(Number(createdData.discountPercentage))
        ? Number(createdData.discountPercentage)
        : 0,
      validFrom: toIsoString(createdData.validFrom),
      validUntil: toIsoString(createdData.validUntil),
      assignedTo: responseAssignedTo,
      salesManager: responseSalesManager,
      notes: createdData.notes || null,
      commissionRules: createdCommission,
      commissionEstimate: createdCommission
        ? estimateCommissionFromRules(createdCommission, createdRevenue)
        : 0,
      createdAt: toIsoString(createdData.createdAt),
      updatedAt: toIsoString(createdData.updatedAt),
    });
  } catch (error) {
    console.error('  �R Create discount error:', error.message);
    logger.error('[admin-dashboard] create discount error', error);
    return res
      .status(500)
      .json({ error: 'admin_dashboard_create_discount_failed', message: error.message });
  }
});

router.post('/commerce/sales-managers', async (req, res) => {
  console.log('[DEBUG] POST /commerce/sales-managers called');
  try {
    const { name, email, phone, notes } = req.body || {};

    const cleanName = safeTrim(name || '');
    const cleanEmail = safeTrim(email || '');
    const cleanPhone = safeTrim(phone || '');
    const cleanNotes = safeTrim(notes || '');

    if (!cleanName && !cleanEmail) {
      return res.status(400).json({ error: 'manager_name_or_email_required' });
    }

    const managerData = {
      name: cleanName || null,
      email: cleanEmail || null,
      phone: cleanPhone || null,
      notes: cleanNotes || null,
      status: 'active',
      createdAt: serverTs(),
      updatedAt: serverTs(),
      createdBy: getActor(req),
    };

    const docRef = collections.salesManagers().doc();
    await docRef.set(managerData);
    const snapshot = await docRef.get();
    const data = snapshot.data() || {};

    const response = {
      id: snapshot.id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      notes: data.notes || '',
      status: data.status || 'active',
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };

    await writeAdminAudit(req, 'ADMIN_SALES_MANAGER_CREATE', {
      resourceType: 'sales_manager',
      resourceId: snapshot.id,
      payload: { name: response.name, email: response.email },
    });

    return res.status(201).json(response);
  } catch (error) {
    console.error('[ERROR] create sales manager failed:', error.message);
    logger.error('[admin-dashboard] create sales manager failed', error);
    return res.status(500).json({ error: 'sales_manager_create_failed', message: error.message });
  }
});

router.post('/commerce/commercials', async (req, res) => {
  console.log('[DEBUG] POST /commerce/commercials called');
  try {
    const { name, email, phone, notes, managerId } = req.body || {};

    const cleanName = safeTrim(name || '');
    const cleanEmail = safeTrim(email || '');
    const cleanPhone = safeTrim(phone || '');
    const cleanNotes = safeTrim(notes || '');
    const cleanManagerId = safeTrim(managerId || '');

    if (!cleanName && !cleanEmail) {
      return res.status(400).json({ error: 'commercial_name_or_email_required' });
    }

    let manager = null;
    if (cleanManagerId) {
      try {
        const managerDoc = await collections.salesManagers().doc(cleanManagerId).get();
        if (managerDoc.exists) {
          manager = sanitizeContactInput({ id: managerDoc.id, ...(managerDoc.data() || {}) });
        }
      } catch (fetchError) {
        console.warn(
          '[admin-dashboard] Failed to resolve manager for commercial:',
          fetchError.message
        );
      }
    }

    const commercialData = {
      name: cleanName || null,
      email: cleanEmail || null,
      phone: cleanPhone || null,
      notes: cleanNotes || null,
      status: 'active',
      managerId: manager?.id || cleanManagerId || null,
      manager: manager || null,
      assignedLinks: [],
      createdAt: serverTs(),
      updatedAt: serverTs(),
      createdBy: getActor(req),
    };

    const docRef = collections.salesCommercials().doc();
    await docRef.set(commercialData);
    const snapshot = await docRef.get();
    const data = snapshot.data() || {};

    const responseManager = data.manager
      ? sanitizeContactInput({ id: data.manager.id || data.managerId || null, ...data.manager })
      : manager || null;

    const response = {
      id: snapshot.id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      notes: data.notes || '',
      status: data.status || 'active',
      managerId: data.managerId || responseManager?.id || null,
      manager: responseManager,
      assignedLinks: Array.isArray(data.assignedLinks) ? data.assignedLinks : [],
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };

    await writeAdminAudit(req, 'ADMIN_SALES_COMMERCIAL_CREATE', {
      resourceType: 'sales_commercial',
      resourceId: snapshot.id,
      payload: {
        name: response.name,
        email: response.email,
        managerId: response.managerId,
      },
    });

    return res.status(201).json(response);
  } catch (error) {
    console.error('[ERROR] create sales commercial failed:', error.message);
    logger.error('[admin-dashboard] create sales commercial failed', error);
    return res
      .status(500)
      .json({ error: 'sales_commercial_create_failed', message: error.message });
  }
});

// --- User Suspension ---
router.post('/users/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (!id) return res.status(400).json({ error: 'user_id_required' });
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ error: 'suspension_reason_required' });
    }

    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    await userRef.set(
      {
        isSuspended: true,
        suspensionReason: reason.trim(),
        suspendedAt: serverTs(),
        suspendedBy: getActor(req),
      },
      { merge: true }
    );

    await writeAdminAudit(req, 'ADMIN_USER_SUSPEND', {
      resourceType: 'user',
      resourceId: id,
      payload: { reason: reason.trim() },
    });

    return res.json({ success: true });
  } catch (error) {
    logger.error('[admin-dashboard] user suspend error', error);
    return res.status(500).json({ error: 'user_suspend_failed' });
  }
});

// --- User Reactivation ---
router.post('/users/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};

    if (!id) return res.status(400).json({ error: 'user_id_required' });

    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    const userData = userDoc.data();
    if (!userData.isSuspended) {
      return res.status(400).json({ error: 'user_not_suspended' });
    }

    await userRef.set(
      {
        isSuspended: false,
        suspensionReason: null,
        reactivatedAt: serverTs(),
        reactivatedBy: getActor(req),
        reactivationNotes: notes ? String(notes).trim() : null,
      },
      { merge: true }
    );

    await writeAdminAudit(req, 'ADMIN_USER_REACTIVATE', {
      resourceType: 'user',
      resourceId: id,
      payload: {
        previousReason: userData.suspensionReason || null,
        notes: notes || null,
      },
    });

    logger.info(`[admin-dashboard] User ${id} reactivated by ${getActor(req)}`);
    return res.json({ success: true });
  } catch (error) {
    logger.error('[admin-dashboard] user reactivate error', error);
    return res.status(500).json({ error: 'user_reactivate_failed' });
  }
});

// --- Support Ticket Response ---
router.post('/support/tickets/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, status } = req.body || {};
    if (!id) return res.status(400).json({ error: 'ticket_id_required' });
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'response_message_required' });
    }

    const ticketRef = collections.supportTickets().doc(id);
    const ticketDoc = await ticketRef.get();
    if (!ticketDoc.exists) {
      return res.status(404).json({ error: 'ticket_not_found' });
    }

    const responseData = {
      message: message.trim(),
      respondedBy: getActor(req),
      createdAt: serverTs(),
    };

    // Añadir respuesta a la subcolección de conversación
    await ticketRef.collection('responses').add(responseData);

    // Actualizar estado del ticket si se proporciona
    const updateData = {
      lastResponseAt: serverTs(),
      lastResponseBy: getActor(req),
      updatedAt: serverTs(),
    };

    if (status && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
      updateData.status = status;
    }

    await ticketRef.set(updateData, { merge: true });

    await writeAdminAudit(req, 'ADMIN_TICKET_RESPOND', {
      resourceType: 'supportTicket',
      resourceId: id,
      payload: { status },
    });

    return res.json({ success: true, response: responseData });
  } catch (error) {
    logger.error('[admin-dashboard] ticket respond error', error);
    return res.status(500).json({ error: 'ticket_respond_failed' });
  }
});

// GET /reports - Obtener reportes programados
router.get('/reports', async (_req, res) => {
  try {
    const docs = await getCollectionDocs('reports', {
      orderBy: 'createdAt',
      direction: 'desc',
      limit: 100,
    });

    const reports = docs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        name: data.name || data.type || 'Reporte sin nombre',
        cadence: data.cadence || data.frequency || 'Manual',
        recipients: Array.isArray(data.recipients) ? data.recipients : [],
        format: data.format || 'PDF',
        status: data.status || 'Completado',
        lastGenerated: formatDateTime(data.lastGenerated) || formatDateTime(data.createdAt),
        createdAt: formatDateTime(data.createdAt),
      };
    });

    res.json(reports);
  } catch (error) {
    logger.error('[admin-dashboard] reports GET error', error);
    res.status(500).json({ error: 'admin_reports_failed' });
  }
});

// GET /settings - Obtener configuraciones (feature flags, secrets, templates)
router.get('/settings', async (_req, res) => {
  try {
    const [flagsDocs, secretsDocs, templatesDocs] = await Promise.all([
      getCollectionDocs('featureFlags', { limit: 100 }),
      getCollectionDocs('secrets', { limit: 50 }),
      getCollectionDocs('templates', { limit: 50 }),
    ]);

    const flags = flagsDocs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        name: data.name || doc.id,
        enabled: Boolean(data.enabled),
        description: data.description || '',
        lastModifiedBy: data.lastModifiedBy || null,
        lastModifiedAt: formatDateTime(data.lastModifiedAt),
      };
    });

    const secrets = secretsDocs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        name: data.name || doc.id,
        lastRotatedAt: formatDateTime(data.lastRotatedAt),
        rotatedBy: data.rotatedBy || null,
      };
    });

    const templates = templatesDocs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        name: data.name || doc.id,
        content: data.content || '',
        updatedAt: formatDateTime(data.updatedAt),
      };
    });

    res.json({
      flags,
      secrets,
      templates,
    });
  } catch (error) {
    logger.error('[admin-dashboard] settings GET error', error);
    res.status(500).json({ error: 'admin_settings_failed' });
  }
});

// --- Generate Report PDF ---
router.post('/reports/generate', async (req, res) => {
  try {
    const { type, recipients, dateRange } = req.body || {};
    if (!type) return res.status(400).json({ error: 'report_type_required' });
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'recipients_required' });
    }

    // Crear registro del reporte
    const reportData = {
      type,
      recipients,
      dateRange: dateRange || { start: null, end: null },
      status: 'generating',
      requestedBy: getActor(req),
      createdAt: serverTs(),
    };

    const reportRef = await collections.reports().add(reportData);

    // TODO: Aquí se integraría con un servicio de generación de PDF
    // Por ahora marcamos como completado después de un pequeño delay
    setTimeout(async () => {
      await reportRef.set(
        {
          status: 'completed',
          completedAt: serverTs(),
          fileUrl: `https://maloveapp-backend.onrender.com/api/reports/${reportRef.id}/download`,
        },
        { merge: true }
      );
    }, 2000);

    await writeAdminAudit(req, 'ADMIN_REPORT_GENERATE', {
      resourceType: 'report',
      resourceId: reportRef.id,
      payload: { type, recipients },
    });

    return res.json({ success: true, reportId: reportRef.id });
  } catch (error) {
    logger.error('[admin-dashboard] generate report error', error);
    return res.status(500).json({ error: 'report_generate_failed' });
  }
});

// --- Export Portfolio to PDF ---
router.post('/portfolio/export-pdf', async (req, res) => {
  try {
    const { filters = {}, format = 'summary' } = req.body || {};

    logger.info('[admin-dashboard] Portfolio PDF export requested', { filters, format });

    // Obtener bodas con los filtros aplicados
    const limit = Math.min(Number(filters.limit) || 200, 500);
    const statusFilter = typeof filters.status === 'string' ? filters.status.trim() : '';
    const order = String(filters.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let query = db.collection('weddings');
    if (statusFilter) {
      query = query.where('status', '==', statusFilter);
    }

    const snap = await query.orderBy('weddingDate', order).limit(limit).get();

    const weddings = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        coupleName: data.coupleName || 'Sin nombre',
        weddingDate: data.weddingDate?.toDate?.() || null,
        status: data.status || 'unknown',
        venue: data.venue || null,
        guestCount: data.guestCount || 0,
        budget: data.budget?.total || 0,
        plannerName: data.plannerName || null,
      };
    });

    // Generar contenido del PDF (formato simple)
    const pdfContent = {
      title: 'Portfolio de Bodas - MaLoveApp',
      generatedAt: new Date().toISOString(),
      filters: { status: statusFilter || 'all', order, limit },
      total: weddings.length,
      weddings:
        format === 'detailed'
          ? weddings
          : weddings.map((w) => ({
              coupleName: w.coupleName,
              weddingDate: w.weddingDate ? w.weddingDate.toISOString().split('T')[0] : 'Sin fecha',
              status: w.status,
              guestCount: w.guestCount,
            })),
    };

    // TODO: Integrar con puppeteer o pdfkit para generar PDF real
    // Por ahora devolvemos JSON que el cliente puede descargar

    const exportId = `portfolio-${Date.now()}`;
    const exportRecord = {
      id: exportId,
      type: 'portfolio',
      format,
      filters,
      totalWeddings: weddings.length,
      requestedBy: getActor(req),
      createdAt: serverTs(),
      status: 'completed',
    };

    await db.collection('exports').doc(exportId).set(exportRecord);

    await writeAdminAudit(req, 'ADMIN_PORTFOLIO_EXPORT', {
      resourceType: 'export',
      resourceId: exportId,
      payload: { filters, format, total: weddings.length },
    });

    logger.info(
      `[admin-dashboard] Portfolio export ${exportId} completed with ${weddings.length} weddings`
    );

    return res.json({
      success: true,
      exportId,
      downloadUrl: `/api/admin/dashboard/portfolio/export/${exportId}/download`,
      pdfContent, // Temporal: devolver JSON hasta implementar PDF real
      total: weddings.length,
    });
  } catch (error) {
    logger.error('[admin-dashboard] portfolio export error', error);
    return res.status(500).json({ error: 'portfolio_export_failed', message: error.message });
  }
});

// --- Task Templates CRUD (mínimo) ---
const TaskTemplateSchema = z.object({
  version: z
    .string()
    .min(1)
    .default(() => `v${Date.now()}`),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  name: z.string().min(1),
  notes: z.string().optional(),
  updatedBy: z.string().optional(),
  blocks: z.array(z.any()).default([]),
});

// Funciones de validación de dependencias
function flattenTasks(blocks) {
  const tasks = [];
  if (!Array.isArray(blocks)) return tasks;

  blocks.forEach((block, blockIndex) => {
    const items = Array.isArray(block.items) ? block.items : [];
    items.forEach((item, itemIndex) => {
      tasks.push({
        blockIndex,
        itemIndex,
        blockName: block.name || block.title || `Bloque ${blockIndex + 1}`,
        itemTitle: item.title || `Tarea ${itemIndex + 1}`,
        item,
        dependsOn: item.dependsOn || [],
      });
    });
  });

  return tasks;
}

function findTask(tasks, dep) {
  return tasks.find((t) => t.blockIndex === dep.blockIndex && t.itemIndex === dep.itemIndex);
}

function detectCycle(tasks, currentTask, visited = new Set()) {
  const taskKey = `${currentTask.blockIndex}-${currentTask.itemIndex}`;

  if (visited.has(taskKey)) {
    return true; // Ciclo detectado
  }

  visited.add(taskKey);

  for (const dep of currentTask.dependsOn || []) {
    const depTask = findTask(tasks, dep);
    if (depTask && detectCycle(tasks, depTask, new Set(visited))) {
      return true;
    }
  }

  return false;
}

function validateDependencies(blocks) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(blocks)) {
    return { valid: true, errors: [], warnings: [] };
  }

  const allTasks = flattenTasks(blocks);

  for (const task of allTasks) {
    const taskLabel = `"${task.itemTitle}" (Bloque: ${task.blockName})`;

    // 1. Verificar referencias válidas
    for (const dep of task.dependsOn || []) {
      const depTask = findTask(allTasks, dep);
      if (!depTask) {
        errors.push(
          `${taskLabel} depende de una tarea inexistente (Bloque ${dep.blockIndex}, Ítem ${dep.itemIndex})`
        );
      }
    }

    // 2. Detectar ciclos
    if (detectCycle(allTasks, task)) {
      errors.push(`Ciclo detectado en dependencias de ${taskLabel}`);
    }

    // 3. Validación temporal (warnings, no errores críticos)
    const taskStartPct = task.item.startPct;
    const taskEndPct = task.item.endPct;

    if (typeof taskStartPct === 'number' && typeof taskEndPct === 'number') {
      for (const dep of task.dependsOn || []) {
        const depTask = findTask(allTasks, dep);
        if (depTask) {
          const depEndPct = depTask.item.endPct;
          if (typeof depEndPct === 'number' && taskStartPct < depEndPct) {
            warnings.push(
              `${taskLabel} empieza antes de que termine su dependencia "${depTask.itemTitle}". ` +
                `Considera ajustar: Tarea empieza en ${(taskStartPct * 100).toFixed(0)}%, dependencia termina en ${(depEndPct * 100).toFixed(0)}%`
            );
          }
        }
      }
    }

    // 4. Prevenir auto-dependencia
    for (const dep of task.dependsOn || []) {
      if (dep.blockIndex === task.blockIndex && dep.itemIndex === task.itemIndex) {
        errors.push(`${taskLabel} no puede depender de sí misma`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

router.get('/task-templates', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    let ref = collections.taskTemplates();
    if (status) ref = ref.where('status', '==', status);
    const snap = await ref.orderBy('updatedAt', 'desc').limit(limit).get();
    const templates = snap.empty
      ? []
      : snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() || {}),
          updatedAt: formatDateTime(d.data()?.updatedAt),
        }));
    return res.json({ templates, meta: { limit, status: status || 'all' } });
  } catch (error) {
    logger.error('[admin-dashboard] task-templates list error', error);
    return res.status(500).json({ error: 'task_templates_list_failed' });
  }
});

router.post('/task-templates', async (req, res) => {
  try {
    const parsed = TaskTemplateSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_template_payload' });
    const payload = parsed.data;

    // Validar dependencias
    const validation = validateDependencies(payload.blocks);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'invalid_dependencies',
        details: validation.errors,
        warnings: validation.warnings,
      });
    }

    const toSave = {
      ...payload,
      updatedAt: serverTs(),
      updatedBy: getActor(req),
    };
    const ref = await collections.taskTemplates().add(toSave);
    await writeAdminAudit(req, 'ADMIN_TASK_TEMPLATE_SAVE', {
      resourceType: 'taskTemplate',
      resourceId: ref.id,
    });

    // Incluir warnings en la respuesta (informativo)
    return res.status(201).json({
      id: ref.id,
      template: { id: ref.id, ...payload },
      validation: {
        warnings: validation.warnings,
      },
    });
  } catch (error) {
    logger.error('[admin-dashboard] task-templates create error', error);
    return res.status(500).json({ error: 'task_templates_create_failed' });
  }
});

router.post('/task-templates/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'template_id_required' });

    // Validar dependencias antes de publicar
    const doc = await collections.taskTemplates().doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'template_not_found' });

    const data = doc.data() || {};
    const validation = validateDependencies(data.blocks);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'cannot_publish_invalid_dependencies',
        details: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Archivar otras publicadas y publicar esta
    const batch = db.batch();
    const all = await collections.taskTemplates().get();
    for (const d of all.docs) {
      const st = (d.data() || {}).status || 'draft';
      const patch =
        d.id === id ? { status: 'published' } : st === 'published' ? { status: 'archived' } : {};
      if (Object.keys(patch).length)
        batch.set(
          d.ref,
          { ...patch, updatedAt: serverTs(), updatedBy: getActor(req) },
          { merge: true }
        );
    }
    await batch.commit();
    await writeAdminAudit(req, 'ADMIN_TASK_TEMPLATE_PUBLISH', {
      resourceType: 'taskTemplate',
      resourceId: id,
    });

    return res.json({
      success: true,
      validation: {
        warnings: validation.warnings,
      },
    });
  } catch (error) {
    logger.error('[admin-dashboard] task-templates publish error', error);
    return res.status(500).json({ error: 'task_templates_publish_failed' });
  }
});

router.post('/task-templates/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'template_id_required' });
    const doc = await collections.taskTemplates().doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'template_not_found' });
    const data = doc.data() || {};
    return res.json({
      id,
      blocks: Array.isArray(data.blocks) ? data.blocks : [],
      meta: { version: data.version || '', status: data.status || 'draft' },
    });
  } catch (error) {
    logger.error('[admin-dashboard] task-templates preview error', error);
    return res.status(500).json({ error: 'task_templates_preview_failed' });
  }
});

// Endpoint de diagn�stico para inspeccionar pagos
router.get('/debug/payments', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100);

    // Intentar sin filtros primero
    console.log('[DEBUG] Consultando payments sin filtros...');
    const paymentsSnap = await db
      .collection('_system')
      .doc('config')
      .collection('payments')
      .limit(limit)
      .get();

    const payments = paymentsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Intentar tambi�n en collectionGroup
    console.log('[DEBUG] Consultando payments via collectionGroup...');
    const groupSnap = await db.collectionGroup('payments').limit(limit).get();

    const groupPayments = groupSnap.docs.map((doc) => ({
      id: doc.id,
      path: doc.ref.path,
      ...doc.data(),
    }));

    return res.json({
      source: 'debug',
      rootCollection: {
        count: payments.length,
        sample: payments,
      },
      collectionGroup: {
        count: groupPayments.length,
        sample: groupPayments,
      },
      recommendations: {
        hasRootPayments: payments.length > 0,
        hasGroupPayments: groupPayments.length > 0,
        needsIndexes: payments.length === 0 && groupPayments.length === 0,
      },
    });
  } catch (error) {
    logger.error('[admin-dashboard] debug payments error', error);
    return res.status(500).json({
      error: 'debug_failed',
      message: error.message,
      code: error.code,
    });
  }
});

export {
  calculateStorageUsageStats,
  countDownloadsTotal,
  countDownloadsLast30d,
  aggregateWebVisitStats,
  aggregateUserGrowthMetrics,
};

export default router;
