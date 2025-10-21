import express from 'express';
import admin from 'firebase-admin';
import { z } from 'zod';

import { db } from '../db.js';
import logger from '../logger.js';
import { createMailgunClients } from './mail/clients.js';

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
  secrets: () => db.collection('adminSecrets'),
  templates: () => db.collection('adminTemplates'),
  broadcasts: () => db.collection('adminBroadcasts'),
  auditLogs: () => db.collection('adminAuditLogs'),
  reports: () => db.collection('adminReports'),
  supportSummary: () => db.collection('adminSupportSummary'),
  supportTickets: () => db.collection('adminTickets'),
  // Datos operativos reales
  payments: () => db.collection('payments'),
  appDownloads: () => db.collection('appDownloads'),
  appDownloadEvents: () => db.collection('appDownloadEvents'),
  mobileDownloads: () => db.collection('mobileDownloads'),
  analyticsAppDownloads: () => db.collection('analyticsAppDownloads'),
  // Colección compuesta de tareas creadas por usuarios en bodas
  tasksGroup: () => db.collectionGroup('tasks'),
  // Plantillas de tareas administrativas
  taskTemplates: () => db.collection('adminTaskTemplates'),
  // Descuentos/códigos promocionales
  discountLinks: () => db.collection('discountLinks'),
};

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
            1000,
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
        5000,
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
  const stopwords = new Set(['el','la','los','las','de','del','para','por','y','o','un','una','con','en','al','a','que','se','un@','@']);
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
    return String(req?.userProfile?.email || req?.user?.email || 'admin@lovenda.com');
  } catch {
    return 'admin@lovenda.com';
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
    logger.warn('[admin-dashboard] user wedding count aggregate failed', { uid, message: error?.message });
  }
  try {
    const snap = await db.collection('users').doc(uid).collection('weddings').limit(500).get();
    return snap.size;
  } catch (error) {
    logger.warn('[admin-dashboard] user wedding count fallback failed', { uid, message: error?.message });
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
    { testId: 'admin-kpi-active-weddings' },
  );
  addKpi(
    'revenue-30d',
    'Facturación (30 días)',
    source.revenue30d ?? metricsDoc.revenue30d ?? metricsDoc.estimatedRevenue,
    { formatCurrency: true, testId: 'admin-kpi-revenue-30d' },
  );
  addKpi(
    'downloads-30d',
    'Descargas app (30 días)',
    source.downloads30d ?? metricsDoc.downloads30d,
    { testId: 'admin-kpi-downloads-30d' },
  );
  addKpi(
    'open-alerts',
    'Alertas activas',
    source.openAlerts ?? metricsDoc.openAlerts,
    { testId: 'admin-kpi-open-alerts' },
  );

  return kpis;
}

function defaultKpis() {
  return [
    { id: 'active-weddings', testId: 'admin-kpi-active-weddings', label: 'Bodas activas', value: 0, trend: null },
    { id: 'revenue-30d', testId: 'admin-kpi-revenue-30d', label: 'Facturación (30 días)', value: formatCurrency(0), trend: null },
    { id: 'downloads-30d', testId: 'admin-kpi-downloads-30d', label: 'Descargas app (30 días)', value: 0, trend: null },
    { id: 'open-alerts', testId: 'admin-kpi-open-alerts', label: 'Alertas activas', value: 0, trend: null },
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
    { id: 'firebase', name: 'Firebase', status: 'operational', latency: '—', incidents: 0 },
    { id: 'mailgun', name: 'Mailgun', status: 'operational', latency: '—', incidents: 0 },
    { id: 'whatsapp', name: 'WhatsApp', status: 'operational', latency: '—', incidents: 0 },
    { id: 'openai', name: 'OpenAI', status: 'operational', latency: '—', incidents: 0 },
  ];
}

function mapAlertDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    severity: data.severity || data.level || 'medium',
    module: data.module || data.category || 'General',
    message: data.message || data.title || '',
    timestamp: formatDateTime(data.createdAt || data.timestamp || data.updatedAt),
    resolved: Boolean(data.resolved),
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
    owner: ownerEmail || 'sin-owner@lovenda.com',
    eventDate: formatDateOnly(eventDate) || '',
    status: data.status || 'draft',
    confirmedGuests: normalizeNumber(data.confirmedGuests ?? data.guestsConfirmed) ?? 0,
    signedContracts: normalizeNumber(data.signedContracts ?? data.contractsSigned) ?? 0,
    lastUpdate: formatDateOnly(updatedAt) || formatDateOnly(data.createdAt) || '',
  };
}

function mapUserDoc(doc) {
  const data = doc.data() || {};
  const lastAccessDate = toDate(data.lastAccess || data.lastLoginAt || data.lastLogin || data.last_seen_at);
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
          1000,
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
        logger.warn('[admin-dashboard] payments aggregation failed', { field, message: error?.message });
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
          1000,
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

async function countOpenAlertsRealtime() {
  try {
    return await countDocuments(collections.alerts, [{ field: 'resolved', op: '==', value: false }]);
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
    
    snap.forEach(doc => {
      const score = doc.data().score;
      if (score >= 9) promoters++;
      else if (score >= 7) passives++;
      else detractors++;
    });
    
    const total = snap.size;
    if (total === 0) return null;
    
    const nps = Math.round((promoters - detractors) / total * 100);
    return {
      score: nps,
      total,
      promoters,
      passives,
      detractors,
      period: '30d'
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
    
    const conversionRate = owners > 0 ? (upgradedToPlannerCount / owners * 100).toFixed(2) : 0;
    
    return {
      owners,
      planners,
      assistants,
      upgradedLast30d: upgradedToPlannerCount,
      conversionRate: parseFloat(conversionRate)
    };
  } catch (error) {
    logger.warn('[admin-dashboard] Conversion metrics failed', { message: error?.message });
    return null;
  }
}

// Calcular MRR/ARR
async function calculateRecurringRevenue() {
  try {
    const subscriptionsSnap = await db.collection('subscriptions')
      .where('status', 'in', ['active', 'trialing'])
      .get();
    
    let monthlyRevenue = 0;
    const revenueByPlan = {};
    const revenueByCountry = {};
    
    subscriptionsSnap.forEach(doc => {
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
      currency: 'EUR'
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
    const usersSnap = await collections.users()
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
      d1: (retainedD1 / cohortSize * 100).toFixed(2),
      d7: (retainedD7 / cohortSize * 100).toFixed(2),
      d30: (retainedD30 / cohortSize * 100).toFixed(2),
      period: `${days}d`
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
        data.templateKey ||
          data.templateVersion ||
          data.templateParentKey ||
          data.templateId,
      );
      const hasManualFlag = Boolean(
        data.createdBy ||
          data.createdByUid ||
          data.createdByRole ||
          data.manual === true ||
          data.isManual === true ||
          String(data.source || '').toLowerCase() === 'user' ||
          String(data.origin || '').toLowerCase() === 'user',
      );
      if (isTemplateDerived && !hasManualFlag) return;

      const weddingId = data.weddingId || extractWeddingIdFromPath(docSnap.ref.path);

      const entry =
        groups.get(canonical) ||
        {
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
        if (b.totalOccurrences !== a.totalOccurrences) return b.totalOccurrences - a.totalOccurrences;
        if (b.totalWeddings !== a.totalWeddings) return b.totalWeddings - a.totalWeddings;
        if (b.lastCreatedAt && a.lastCreatedAt) return b.lastCreatedAt.localeCompare(a.lastCreatedAt);
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
  const activeUsers30d = await countDocuments(collections.users, [{ field: 'lastLoginAt', op: '>=', value: thirtyTimestamp }]);
  // Weddings raíz y fallback a grupo
  let totalWeddings = await countDocuments(collections.weddings);
  if (!totalWeddings) {
    try { totalWeddings = await countDocuments(collections.weddingsGroup); } catch { totalWeddings = 0; }
  }
  let newWeddings30d = await countDocuments(collections.weddings, [{ field: 'createdAt', op: '>=', value: thirtyTimestamp }]);
  if (!newWeddings30d) {
    try { newWeddings30d = await countDocuments(collections.weddingsGroup, [{ field: 'createdAt', op: '>=', value: thirtyTimestamp }]); } catch { newWeddings30d = 0; }
  }
  let activeWeddings = await countDocuments(collections.weddings, [{ field: 'status', op: '==', value: 'active' }]);
  if (!activeWeddings) {
    try { activeWeddings = await countDocuments(collections.weddingsGroup, [{ field: 'status', op: '==', value: 'active' }]); } catch { activeWeddings = 0; }
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

    let alerts = alertDocs.map(mapAlertDoc);
    if (!alerts.length) alerts = [
      { id: 'al-1', severity: 'high', module: 'Sistema', message: 'Sin datos de métricas (modo demo)', timestamp: formatDateTime(new Date()), resolved: false },
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
      source: realtime ? 'realtime' : (latestMetrics ? 'firestore' : 'empty'),
      meta,
    });
  } catch (error) {
    logger.error('[admin-dashboard] overview error', error);
    res.status(500).json({ error: 'admin_dashboard_overview_failed' });
  }
});

// Reintentar conexión de un servicio de integraciones
router.post('/integrations/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'integration_id_required' });

    const ref = collections.serviceStatus().doc(id);
    const snap = await ref.get();
    const prev = snap.exists ? (snap.data() || {}) : {};

    const latencyMs = Math.floor(120 + Math.random() * 220);
    const next = {
      name: prev.name || prev.service || id,
      latency: `${latencyMs}ms`,
      status: (prev.status && prev.status !== 'operational') ? 'operational' : (prev.status || 'operational'),
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
    const [conversionMetrics, recurringRevenue, retentionData] = await Promise.all([
      calculateConversionMetrics(),
      calculateRecurringRevenue(),
      calculateRetentionMetrics(30)
    ]);
    
    // userStats / weddingStats en tiempo real (best-effort)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
    const sevenTimestamp = admin.firestore.Timestamp.fromDate(sevenDaysAgo);
    const usersTotal = await countDocuments(collections.users);
    const usersActive7d = await countDocuments(collections.users, [{ field: 'lastLoginAt', op: '>=', value: sevenTimestamp }]);
    // Weddings: intentar raíz y luego grupo
    let weddingsTotal = await countDocuments(collections.weddings);
    if (!weddingsTotal) {
      try { weddingsTotal = await countDocuments(collections.weddingsGroup); } catch { weddingsTotal = 0; }
    }
    let weddingsActive = await countDocuments(collections.weddings, [{ field: 'status', op: '==', value: 'active' }]);
    if (!weddingsActive) {
      try { weddingsActive = await countDocuments(collections.weddingsGroup, [{ field: 'status', op: '==', value: 'active' }]); } catch { weddingsActive = 0; }
    }
    // plannerIds puede no existir en subcolecciones; mantener best-effort con raíz
    const withPlanner = await countDocuments(collections.weddings, [{ field: 'plannerIds', op: '!=', value: [] }]).catch(() => 0);
    const withoutPlanner = await countDocuments(collections.weddings, [{ field: 'plannerIds', op: '==', value: [] }]).catch(() => 0);

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
      byRole: { owner: 0, planner: 0, assistant: 0 },
      source: 'realtime',
    };
    const weddingStats = {
      total: weddingsTotal,
      active: weddingsActive,
      withPlanner,
      withoutPlanner,
      source: 'realtime',
    };
    res.json({ series, funnel, iaCosts, communications, supportMetrics, userStats, weddingStats, conversionMetrics, recurringRevenue, retentionData });
  } catch (error) {
    logger.error('[admin-dashboard] metrics error', error);
    res.status(500).json({ error: 'admin_dashboard_metrics_failed' });
  }
});

router.get('/support', async (_req, res) => {
  try {
    const [summaryDocs, ticketDocs, npsData] = await Promise.all([
      getCollectionDocs('supportSummary', { limit: 1 }),
      getCollectionDocs('supportTickets', { orderBy: 'updatedAt', limit: 100 }),
      calculateRealNPS() // Calcular NPS real
    ]);
    
    let summary = summaryDocs.length ? mapSupportSummaryDoc(summaryDocs[0]) : null;
    let tickets = ticketDocs.map(mapSupportTicketDoc);
    
    // Actualizar NPS con datos reales si existen
    if (npsData) {
      if (!summary) summary = { open: 0, pending: 0, resolved: 0, slaAverage: '—', updatedAt: formatDateTime(new Date()) };
      summary.nps = npsData.score;
      summary.npsDetails = npsData;
    }
    
    if (!summary) summary = { open: 0, pending: 0, resolved: 0, slaAverage: '—', nps: null, updatedAt: formatDateTime(new Date()) };
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

  console.log('\n🔍 [DEBUG] GET /users endpoint called');
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
          ? collections.users().where('status', '==', statusFilter).orderBy('createdAt', 'desc').limit(limit)
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
            formatDateOnly(data.createdAt || data.created_at || docSnap.createTime) || '—';
          const lastAccess =
            formatDateTime(
              data.lastAccess ||
                data.lastLoginAt ||
                data.lastAccessAt ||
                data.updatedAt ||
                data.lastActiveWeddingAt,
            ) || '—';

          let weddingsCount = Number(
            data.weddings ?? data.weddingCount ?? data.stats?.weddings ?? 0,
          );
          if (!Number.isFinite(weddingsCount) || weddingsCount < 0) weddingsCount = 0;
          if (weddingsCount === 0) {
            try {
              weddingsCount = await getUserWeddingCount(docSnap.id);
            } catch (err) {
              logger.warn('[admin-dashboard] getUserWeddingCount failed', { uid: docSnap.id, message: err?.message });
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
      console.error('  ❌ Firestore query failed:', firestoreError.message);
      console.log('  - Switching to Firebase Auth fallback...');
      logger.warn('[admin-dashboard] Firestore users query failed, trying Firebase Auth', { message: firestoreError?.message });
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
          let lastAccess = '—';
          
          try {
            const userDoc = await collections.users().doc(userRecord.uid).get();
            if (userDoc.exists) {
              const data = userDoc.data();
              role = String(data.role || data.profile?.role || 'owner');
              weddingsCount = Number(data.weddings ?? data.weddingCount ?? 0);
              if (!Number.isFinite(weddingsCount) || weddingsCount < 0) weddingsCount = 0;
              lastAccess = formatDateTime(
                data.lastAccess || data.lastLoginAt || data.updatedAt
              ) || '—';
            }
            
            if (weddingsCount === 0) {
              weddingsCount = await getUserWeddingCount(userRecord.uid);
            }
          } catch (err) {
            logger.warn('[admin-dashboard] Could not fetch user details from Firestore', { uid: userRecord.uid });
          }

          items.push({
            id: userRecord.uid,
            email: userRecord.email || `${userRecord.uid}@nomail.com`,
            role,
            status,
            lastAccess,
            weddings: weddingsCount,
            createdAt: formatDateOnly(userRecord.metadata.creationTime) || '—',
          });
        }
      } catch (authError) {
        console.error('  ❌ Firebase Auth also failed:', authError.message);
        logger.error('[admin-dashboard] Firebase Auth listUsers failed', authError);
        throw authError;
      }
    }

    console.log(`  ✅ Returning ${items.length} users (source: ${fromAuth ? 'firebase-auth' : 'firestore'})`);
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
    console.error('  ❌ Role summary error:', error.message);
    logger.error('[admin-dashboard] users/role-summary error', error);
    return res.status(500).json({ error: 'admin_dashboard_role_summary_failed', message: error.message });
  }
});

router.get('/portfolio', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, MAX_LIMIT);
  const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const order = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const fromDateFilter = parseDateParam(req.query.fromDate, false);
  const toDateFilter = parseDateParam(req.query.toDate, true);

  console.log('🔍 [DEBUG] GET /portfolio endpoint called');
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
      const rootSnap = await collections
        .weddings()
        .limit(limit)
        .get();
      console.log(`  - Root collection returned ${rootSnap.size} documents`);
      rootSnap.docs.forEach(doc => {
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
          const userWeddingsSnap = await userDoc.ref
            .collection('weddings')
            .limit(10)
            .get();
          
          if (!userWeddingsSnap.empty) {
            console.log(`  - User ${userDoc.id} has ${userWeddingsSnap.size} weddings`);
            userWeddingsSnap.docs.forEach(doc => {
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
      console.log('  ⚠️ No wedding documents found');
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
        data.eventDate ||
        data.weddingDate ||
        data.date ||
        data.weddingInfo?.weddingDate ||
        null;
      
      // Convertir fecha de forma segura - DEBUG
      let eventDateDate = null;
      try {
        // Log para ver qué tipo de dato es
        console.log(`[portfolio] Wedding ${docSnap.id} eventDateRaw:`, {
          value: eventDateRaw,
          type: typeof eventDateRaw,
          hasToDate: eventDateRaw?.toDate !== undefined,
          constructor: eventDateRaw?.constructor?.name
        });
        
        eventDateDate = toDate(eventDateRaw);
      } catch (dateError) {
        console.warn('[portfolio] Error converting event date:', dateError.message, 'for wedding:', docSnap.id);
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
          data.confirmedGuests ??
            data.stats?.confirmedGuests ??
            data.guestsConfirmed ??
            0,
        ),
        signedContracts: Number(
          data.signedContracts ??
            data.contractsSigned ??
            (Array.isArray(data.contracts) ? data.contracts.length : 0),
        ),
      };

      items.push(item);
      if (items.length >= limit) break;
    }

    console.log(`  ✅ Returning ${items.length} weddings`);
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
    console.error('  ❌ Portfolio endpoint error:', error.message);
    logger.error('[admin-dashboard] portfolio error', error);
    return res.status(500).json({ error: 'admin_dashboard_portfolio_failed', message: error.message });
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
    await writeAdminAudit(req, 'ADMIN_TASK_CREATE', { resourceType: 'adminTask', resourceId: ref.id, payload: { title: t } });
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
    await writeAdminAudit(req, 'ADMIN_TASK_UPDATE', { resourceType: 'adminTask', resourceId: id, payload: patch });
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
    await collections.alerts().doc(id).set({
      resolved: true,
      resolvedAt: serverTs(),
      resolvedBy,
      resolutionNotes: notes || admin.firestore.FieldValue.delete(),
    }, { merge: true });
    await writeAdminAudit(req, 'ADMIN_ALERT_RESOLVE', { resourceType: 'adminAlert', resourceId: id, payload: { notes } });
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
    if (typeof req.body?.enabled !== 'boolean') return res.status(400).json({ error: 'enabled_required' });
    const patch = {
      enabled: !!req.body.enabled,
      lastModifiedBy: getActor(req),
      lastModifiedAt: serverTs(),
    };
    await collections.featureFlags().doc(id).set(patch, { merge: true });
    const doc = await collections.featureFlags().doc(id).get();
    const flag = mapFeatureFlagDoc(doc);
    await writeAdminAudit(req, 'ADMIN_FLAG_UPDATE', { resourceType: 'featureFlag', resourceId: id, payload: { enabled: patch.enabled } });
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
    await collections.secrets().doc(id).set({
      lastRotatedAt: serverTs(),
      rotatedBy: getActor(req),
    }, { merge: true });
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
    if (!id || content == null) return res.status(400).json({ error: 'template_id_and_content_required' });
    await collections.templates().doc(id).set({ content, updatedAt: serverTs() }, { merge: true });
    await writeAdminAudit(req, 'ADMIN_TEMPLATE_SAVE', { resourceType: 'template', resourceId: id });
    return res.json({ success: true });
  } catch (error) {
    logger.error('[admin-dashboard] save template error', error);
    return res.status(500).json({ error: 'admin_template_save_failed' });
  }
});

// Crear broadcast
router.post('/broadcasts', async (req, res) => {
  try {
    const { type = 'email', subject = '', content = '', segment = 'Todos', scheduledAt } = req.body || {};
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
    await writeAdminAudit(req, 'ADMIN_BROADCAST_CREATE', { resourceType: 'broadcast', resourceId: ref.id, payload: { subject: tSubject } });
    return res.status(201).json({ id: ref.id, item });
  } catch (error) {
    logger.error('[admin-dashboard] create broadcast error', error);
    return res.status(500).json({ error: 'admin_broadcast_create_failed' });
  }
});

// --- Users role summary ---
router.get('/users/role-summary', async (_req, res) => {
  const started = Date.now();
  console.log('🔍 [DEBUG] GET /users/role-summary endpoint called');
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
    
    const ownerBucket = { label: 'Owners', total: 0, real: 0, excluded: { total: 0, byReason: { status: 0, flags: 0, email: 0 } } };
    const plannerBucket = { label: 'Wedding planners', total: 0, real: 0, excluded: { total: 0, byReason: { status: 0, flags: 0, email: 0 } } };
    const assistantBucket = { label: 'Assistants', total: 0, real: 0, excluded: { total: 0, byReason: { status: 0, flags: 0, email: 0 } } };
    
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
        const emailExcluded = filters.excludedEmailSuffixes.some(suffix => email.endsWith(suffix)) ||
                             filters.excludedEmailPrefixes.some(prefix => email.startsWith(prefix));
        if (emailExcluded) {
          isExcluded = true;
          excludeReason = 'email';
        }
      }
      
      // Por flags
      if (!isExcluded) {
        const hasExcludedFlag = filters.excludedBooleanKeys.some(key => data[key] === true);
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
    
    console.log(`  ✅ Role summary: owner=${ownerBucket.real}, planner=${plannerBucket.real}, assistant=${assistantBucket.real}`);
    
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
        owner: { label: 'Owners', total: 0, real: 0, excluded: { total: 0, byReason: { status: 0, flags: 0, email: 0 } } },
        planner: { label: 'Wedding planners', total: 0, real: 0, excluded: { total: 0, byReason: { status: 0, flags: 0, email: 0 } } },
        assistant: { label: 'Assistants', total: 0, real: 0, excluded: { total: 0, byReason: { status: 0, flags: 0, email: 0 } } },
      },
      filters: { allowedStatuses: [], excludedEmailSuffixes: [], excludedEmailPrefixes: [], excludedEmailContains: [], excludedTags: [], excludedBooleanKeys: [] },
      source: 'fallback',
      error: 'role_summary_failed',
    });
  }
});

// --- Discounts ---
router.get('/discounts', async (_req, res) => {
  console.log('🔍 [DEBUG] GET /discounts endpoint called');
  try {
    const docs = await getCollectionDocs('discountLinks', { orderBy: 'createdAt', limit: 500 });
    console.log(`  - Found ${docs.length} discount links`);
    const items = docs.map((d) => {
      const data = d.data() || {};
      
      // Función helper para convertir timestamps de forma segura
      const safeToDate = (value) => {
        if (!value) return null;
        if (value.toDate && typeof value.toDate === 'function') {
          try {
            return value.toDate();
          } catch (e) {
            console.warn('Error converting timestamp:', e);
            return null;
          }
        }
        if (value instanceof Date) return value;
        if (typeof value === 'string' || typeof value === 'number') {
          const d = new Date(value);
          return isNaN(d.getTime()) ? null : d;
        }
        return null;
      };
      
      return {
        id: d.id,
        code: data.code || d.id,
        uses: Number(data.uses || 0),
        revenue: Number(data.revenue || 0),
        currency: data.currency || 'EUR',
        status: data.status || 'active',
        createdAt: formatDateOnly(safeToDate(data.createdAt)),
        updatedAt: formatDateOnly(safeToDate(data.updatedAt)),
      };
    });
    const summary = items.reduce(
      (acc, it) => {
        acc.totalLinks += 1;
        acc.totalUses += it.uses;
        acc.totalRevenue += it.revenue;
        return acc;
      },
      { totalLinks: 0, totalUses: 0, totalRevenue: 0, currency: 'EUR' },
    );
    console.log(`  ✅ Returning ${items.length} discount links`);
    console.log('  - Total revenue:', summary.totalRevenue);
    
    return res.json({ items, summary });
  } catch (error) {
    console.error('  ❌ Discounts error:', error.message);
    logger.error('[admin-dashboard] discounts error', error);
    return res.status(500).json({ error: 'admin_dashboard_discounts_failed', message: error.message });
  }
});

// Actualizar código de descuento existente
router.put('/discounts/:id', async (req, res) => {
  console.log('🔍 [DEBUG] PUT /discounts/:id endpoint called');
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'discount_id_required' });
    
    const { url, type, maxUses, assignedTo, notes, status } = req.body || {};
    
    const discountRef = collections.discountLinks().doc(id);
    const discountDoc = await discountRef.get();
    
    if (!discountDoc.exists) {
      return res.status(404).json({ error: 'discount_not_found' });
    }
    
    const updateData = {};
    
    if (url !== undefined) updateData.url = String(url || '').trim();
    if (type !== undefined) updateData.type = String(type || 'campaign').trim();
    if (status !== undefined) updateData.status = String(status).trim();
    if (notes !== undefined) updateData.notes = String(notes || '').trim() || null;
    
    // maxUses: null = permanente, número = limitado
    if (maxUses !== undefined) {
      const isPermanent = maxUses === null || maxUses === undefined || maxUses === 0;
      updateData.maxUses = isPermanent ? null : Math.max(1, Number(maxUses) || 1);
    }
    
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo ? {
        id: assignedTo.id || null,
        name: assignedTo.name || null,
        email: assignedTo.email || null,
      } : null;
    }
    
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    updateData.updatedBy = 'admin';
    
    await discountRef.update(updateData);
    
    const updated = await discountRef.get();
    const data = updated.data();
    
    console.log(`  ✅ Updated discount code: ${data.code}`);
    
    return res.json({
      id: updated.id,
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('  ❌ Update discount error:', error.message);
    logger.error('[admin-dashboard] update discount error', error);
    return res.status(500).json({ error: 'admin_dashboard_update_discount_failed', message: error.message });
  }
});

// Crear nuevo código de descuento
router.post('/discounts', async (req, res) => {
  console.log('🔍 [DEBUG] POST /discounts endpoint called');
  try {
    const { code, url, type, maxUses, assignedTo, notes } = req.body || {};
    
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'code_required' });
    }
    
    const cleanCode = String(code).trim().toUpperCase();
    const cleanUrl = String(url || '').trim();
    const cleanType = String(type || 'campaign').trim();
    const isPermanent = maxUses === null || maxUses === undefined || maxUses === 0;
    const maxUsesValue = isPermanent ? null : Math.max(1, Number(maxUses) || 1);
    
    // Verificar si ya existe
    const existing = await collections.discountLinks()
      .where('code', '==', cleanCode)
      .limit(1)
      .get();
    
    if (!existing.empty) {
      return res.status(409).json({ error: 'code_already_exists' });
    }
    
    const newDiscount = {
      code: cleanCode,
      url: cleanUrl || `https://mywed360.com/registro?ref=${cleanCode}`,
      type: cleanType,
      maxUses: maxUsesValue,
      usesCount: 0,
      status: 'activo',
      revenue: 0,
      currency: 'EUR',
      assignedTo: assignedTo ? {
        id: assignedTo.id || null,
        name: assignedTo.name || null,
        email: assignedTo.email || null,
      } : null,
      notes: String(notes || '').trim() || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'admin',
    };
    
    const docRef = await collections.discountLinks().add(newDiscount);
    
    console.log(`  ✅ Created discount code: ${cleanCode} (${isPermanent ? 'permanent' : `max ${maxUsesValue} uses`})`);
    
    return res.status(201).json({
      id: docRef.id,
      ...newDiscount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('  ❌ Create discount error:', error.message);
    logger.error('[admin-dashboard] create discount error', error);
    return res.status(500).json({ error: 'admin_dashboard_create_discount_failed', message: error.message });
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
    
    await userRef.set({
      isSuspended: true,
      suspensionReason: reason.trim(),
      suspendedAt: serverTs(),
      suspendedBy: getActor(req)
    }, { merge: true });
    
    await writeAdminAudit(req, 'ADMIN_USER_SUSPEND', {
      resourceType: 'user',
      resourceId: id,
      payload: { reason: reason.trim() }
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
    
    await userRef.set({
      isSuspended: false,
      suspensionReason: null,
      reactivatedAt: serverTs(),
      reactivatedBy: getActor(req),
      reactivationNotes: notes ? String(notes).trim() : null
    }, { merge: true });
    
    await writeAdminAudit(req, 'ADMIN_USER_REACTIVATE', {
      resourceType: 'user',
      resourceId: id,
      payload: { 
        previousReason: userData.suspensionReason || null,
        notes: notes || null 
      }
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
      createdAt: serverTs()
    };
    
    // Añadir respuesta a la subcolección de conversación
    await ticketRef.collection('responses').add(responseData);
    
    // Actualizar estado del ticket si se proporciona
    const updateData = {
      lastResponseAt: serverTs(),
      lastResponseBy: getActor(req),
      updatedAt: serverTs()
    };
    
    if (status && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
      updateData.status = status;
    }
    
    await ticketRef.set(updateData, { merge: true });
    
    await writeAdminAudit(req, 'ADMIN_TICKET_RESPOND', {
      resourceType: 'supportTicket',
      resourceId: id,
      payload: { status }
    });
    
    return res.json({ success: true, response: responseData });
  } catch (error) {
    logger.error('[admin-dashboard] ticket respond error', error);
    return res.status(500).json({ error: 'ticket_respond_failed' });
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
      createdAt: serverTs()
    };
    
    const reportRef = await collections.reports().add(reportData);
    
    // TODO: Aquí se integraría con un servicio de generación de PDF
    // Por ahora marcamos como completado después de un pequeño delay
    setTimeout(async () => {
      await reportRef.set({
        status: 'completed',
        completedAt: serverTs(),
        fileUrl: `https://mywed360-backend.onrender.com/api/reports/${reportRef.id}/download`
      }, { merge: true });
    }, 2000);
    
    await writeAdminAudit(req, 'ADMIN_REPORT_GENERATE', {
      resourceType: 'report',
      resourceId: reportRef.id,
      payload: { type, recipients }
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
    
    const weddings = snap.docs.map(d => {
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
      title: 'Portfolio de Bodas - MyWed360',
      generatedAt: new Date().toISOString(),
      filters: { status: statusFilter || 'all', order, limit },
      total: weddings.length,
      weddings: format === 'detailed' ? weddings : weddings.map(w => ({
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
      payload: { filters, format, total: weddings.length }
    });
    
    logger.info(`[admin-dashboard] Portfolio export ${exportId} completed with ${weddings.length} weddings`);
    
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
  version: z.string().min(1).default(() => `v${Date.now()}`),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  name: z.string().min(1),
  notes: z.string().optional(),
  updatedBy: z.string().optional(),
  blocks: z.array(z.any()).default([]),
});

router.get('/task-templates', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    let ref = collections.taskTemplates();
    if (status) ref = ref.where('status', '==', status);
    const snap = await ref.orderBy('updatedAt', 'desc').limit(limit).get();
    const templates = snap.empty
      ? []
      : snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}), updatedAt: formatDateTime(d.data()?.updatedAt) }));
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
    const toSave = {
      ...payload,
      updatedAt: serverTs(),
      updatedBy: getActor(req),
    };
    const ref = await collections.taskTemplates().add(toSave);
    await writeAdminAudit(req, 'ADMIN_TASK_TEMPLATE_SAVE', { resourceType: 'taskTemplate', resourceId: ref.id });
    return res.status(201).json({ id: ref.id, template: { id: ref.id, ...payload } });
  } catch (error) {
    logger.error('[admin-dashboard] task-templates create error', error);
    return res.status(500).json({ error: 'task_templates_create_failed' });
  }
});

router.post('/task-templates/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'template_id_required' });
    // Archivar otras publicadas y publicar esta
    const batch = db.batch();
    const all = await collections.taskTemplates().get();
    for (const d of all.docs) {
      const st = (d.data() || {}).status || 'draft';
      const patch = d.id === id ? { status: 'published' } : (st === 'published' ? { status: 'archived' } : {});
      if (Object.keys(patch).length) batch.set(d.ref, { ...patch, updatedAt: serverTs(), updatedBy: getActor(req) }, { merge: true });
    }
    await batch.commit();
    await writeAdminAudit(req, 'ADMIN_TASK_TEMPLATE_PUBLISH', { resourceType: 'taskTemplate', resourceId: id });
    return res.json({ success: true });
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
    return res.json({ id, blocks: Array.isArray(data.blocks) ? data.blocks : [], meta: { version: data.version || '', status: data.status || 'draft' } });
  } catch (error) {
    logger.error('[admin-dashboard] task-templates preview error', error);
    return res.status(500).json({ error: 'task_templates_preview_failed' });
  }
});

export default router;
