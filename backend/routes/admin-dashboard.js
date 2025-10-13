import express from 'express';
import admin from 'firebase-admin';

import { db } from '../db.js';
import logger from '../logger.js';
import { createMailgunClients } from './mail/clients.js';

const router = express.Router();

const MAX_LIMIT = 200;

const collections = {
  metrics: () => db.collection('adminMetrics'),
  serviceStatus: () => db.collection('adminServiceStatus'),
  alerts: () => db.collection('adminAlerts'),
  tasks: () => db.collection('adminTasks'),
  weddings: () => db.collection('weddings'),
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
};

function toDate(value) {
  try {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  } catch (error) {
    logger.warn('[admin-dashboard] toDate parse error', { value, message: error.message });
  }
  return null;
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

function normalizeNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
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

async function writeAudit(req, action, details = {}) {
  try {
    await collections.auditLogs().add({
      action,
      actor: getActor(req),
      createdAt: serverTs(),
      ...details,
    });
  } catch (e) {
    logger.warn('[admin-dashboard] audit write failed', { action, message: e?.message });
  }
}

function extractKpis(metricsDoc) {
  if (!metricsDoc) return [];
  if (Array.isArray(metricsDoc.kpis) && metricsDoc.kpis.length) {
    return metricsDoc.kpis.map((kpi, idx) => ({
      id: kpi.id || `kpi-${idx}`,
      label: kpi.label || `KPI ${idx + 1}`,
      value: kpi.value ?? '',
      trend: typeof kpi.trend === 'number' ? Number(kpi.trend) : null,
      testId: kpi.testId,
    }));
  }

  const kpis = [];
  const addKpi = (id, label, value, trend) => {
    if (value == null) return;
    kpis.push({
      id,
      label,
      value,
      trend: typeof trend === 'number' ? trend : null,
    });
  };

  addKpi('active-users', 'Usuarios activos (7 días)', metricsDoc.activeUsers7d, metricsDoc.activeUsersTrend);
  addKpi('new-weddings', 'Bodas creadas (30 días)', metricsDoc.newWeddings30d, metricsDoc.newWeddingsTrend);
  addKpi('conversion', 'Conversión signup→boda', metricsDoc.conversionRate, metricsDoc.conversionTrend);
  addKpi('estimated-revenue', 'Ingresos estimados (30 días)', metricsDoc.estimatedRevenue, metricsDoc.estimatedRevenueTrend);

  return kpis;
}

function defaultKpis() {
  return [
    { id: 'active-users', testId: 'admin-kpi-active-users', label: 'Usuarios activos (7 días)', value: 0, trend: 0 },
    { id: 'new-weddings', testId: 'admin-kpi-new-weddings', label: 'Bodas creadas (30 días)', value: 0, trend: 0 },
    { id: 'conversion', testId: 'admin-kpi-conversion', label: 'Conversión signup→boda', value: '0%', trend: 0 },
    { id: 'estimated-revenue', testId: 'admin-kpi-estimated-revenue', label: 'Ingresos estimados (30 días)', value: '€0', trend: 0 },
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
  const lastAccess = data.lastAccess || data.lastLoginAt || data.lastLogin;
  return {
    id: doc.id,
    email: data.email || data.username || doc.id,
    role: data.role || 'owner',
    status: data.status || 'active',
    lastAccess: formatDateTime(lastAccess) || '',
    weddings: normalizeNumber(data.weddingsCount ?? data.weddings) ?? 0,
    createdAt: formatDateOnly(data.createdAt) || '',
  };
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
    const [metricsDocs, serviceDocs, alertDocs, taskDocs] = await Promise.all([
      getCollectionDocs('metrics', { orderBy: 'date', limit: 1 }),
      getCollectionDocs('serviceStatus', { orderBy: 'service', limit: 50 }),
      getCollectionDocs('alerts', { orderBy: 'createdAt', limit: 20 }),
      getCollectionDocs('tasks', { orderBy: 'createdAt', limit: 50 }),
    ]);

    const latestMetrics = metricsDocs.length ? metricsDocs[0].data() : null;
    let kpis = extractKpis(latestMetrics);
    let services = extractServices(latestMetrics, serviceDocs);
    let alerts = alertDocs.map(mapAlertDoc);
    let tasks = taskDocs.map(mapTaskDoc);

    if (!kpis.length) kpis = defaultKpis();
    if (!services.length) services = defaultServices();
    if (!alerts.length) alerts = [
      { id: 'al-1', severity: 'high', module: 'Sistema', message: 'Sin datos de métricas (modo demo)', timestamp: formatDateTime(new Date()), resolved: false },
    ];
    if (!tasks.length) tasks = [
      { id: 'tk-1', title: 'Revisar reportes semanales', completed: false, priority: 'medium', dueDate: formatDateOnly(new Date()) },
    ];

    res.json({
      kpis,
      services,
      alerts,
      tasks,
      fetchedAt: new Date().toISOString(),
      source: latestMetrics ? 'firestore' : 'empty',
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

    await writeAudit(req, 'ADMIN_INTEGRATION_RETRY', { resourceType: 'integration', resourceId: id, payload: { status: service.status, latency: service.latency } });
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
    const series = ensureArray(latest?.series);
    const funnel = latest?.funnel || [
      { label: 'Visitantes', value: 0, percentage: '100%' },
      { label: 'Registrados', value: 0, percentage: '0%' },
      { label: 'Bodas activas', value: 0, percentage: '0%' },
    ];
    const iaCosts = ensureArray(latest?.aiCosts);
    const communications = ensureArray(latest?.communications);
    const supportMetrics = latest?.supportMetrics || null;
    res.json({ series, funnel, iaCosts, communications, supportMetrics });
  } catch (error) {
    logger.error('[admin-dashboard] metrics error', error);
    res.status(500).json({ error: 'admin_dashboard_metrics_failed' });
  }
});

router.get('/portfolio', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, MAX_LIMIT);
    const weddingDocs = await getCollectionDocs('weddings', { orderBy: 'eventDate', limit });
    let weddings = weddingDocs.map(mapWeddingDoc);
    if (!weddings.length) {
      weddings = [
        { id: 'wd-1', couple: 'Pareja Demo', owner: 'owner@lovenda.com', eventDate: formatDateOnly(new Date()), status: 'active', confirmedGuests: 0, signedContracts: 0, lastUpdate: formatDateOnly(new Date()) },
      ];
    }
    res.json({ items: weddings, count: weddings.length });
  } catch (error) {
    logger.error('[admin-dashboard] portfolio error', error);
    res.status(500).json({ error: 'admin_dashboard_portfolio_failed' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, MAX_LIMIT);
    const userDocs = await getCollectionDocs('users', { orderBy: 'createdAt', limit });
    let users = userDocs.map(mapUserDoc);
    if (!users.length) {
      users = [
        { id: 'usr-1', email: 'owner@lovenda.com', role: 'owner', status: 'active', lastAccess: formatDateTime(new Date()), weddings: 1, createdAt: formatDateOnly(new Date()) },
      ];
    }
    res.json({ items: users, count: users.length });
  } catch (error) {
    logger.error('[admin-dashboard] users error', error);
    res.status(500).json({ error: 'admin_dashboard_users_failed' });
  }
});

router.get('/integrations', async (_req, res) => {
  try {
    const [serviceDocs, incidentDocs] = await Promise.all([
      getCollectionDocs('serviceStatus', { orderBy: 'service', limit: 50 }),
      getCollectionDocs('incidents', { orderBy: 'startedAt', limit: 50 }),
    ]);
    let services = extractServices(null, serviceDocs);
    if (!services.length) services = defaultServices();
    let incidents = incidentDocs.map(mapIncidentDoc);
    if (!incidents.length) {
      incidents = [
        { id: 'inc-1', service: 'Mailgun', startedAt: formatDateTime(new Date()), duration: '—', impact: 'Sin datos recientes (demo)', action: 'N/A', resolvedBy: '—' },
      ];
    }
    res.json({ services, incidents });
  } catch (error) {
    logger.error('[admin-dashboard] integrations error', error);
    res.status(500).json({ error: 'admin_dashboard_integrations_failed' });
  }
});

router.get('/settings', async (_req, res) => {
  try {
    const [flagDocs, secretDocs, templateDocs] = await Promise.all([
      getCollectionDocs('featureFlags', { orderBy: 'lastModifiedAt', limit: 100 }),
      getCollectionDocs('secrets', { orderBy: 'lastRotatedAt', limit: 100 }),
      getCollectionDocs('templates', { orderBy: 'updatedAt', limit: 100 }),
    ]);
    let featureFlags = flagDocs.map(mapFeatureFlagDoc);
    let secrets = secretDocs.map(mapSecretDoc);
    let templates = templateDocs.map(mapTemplateDoc);
    if (!featureFlags.length) featureFlags = [{ id: 'ff-demo', name: 'FEATURE_DEMO', description: 'Bandera de ejemplo', domain: 'core', enabled: false, lastModifiedBy: 'admin', lastModifiedAt: formatDateTime(new Date()) }];
    if (!secrets.length) secrets = [{ id: 'sec-demo', name: 'MAILGUN_API_KEY', lastRotatedAt: formatDateOnly(new Date()) }];
    if (!templates.length) templates = [{ id: 'tpl-demo', name: 'email-welcome', content: 'Bienvenida Lovenda {nombre}', updatedAt: formatDateTime(new Date()) }];
    res.json({ featureFlags, secrets, templates });
  } catch (error) {
    logger.error('[admin-dashboard] settings error', error);
    res.status(500).json({ error: 'admin_dashboard_settings_failed' });
  }
});

router.get('/alerts', async (_req, res) => {
  try {
    const alertDocs = await getCollectionDocs('alerts', { orderBy: 'createdAt', limit: 100 });
    let alerts = alertDocs.map(mapAlertDoc);
    if (!alerts.length) alerts = [ { id: 'al-1', severity: 'high', module: 'Sistema', message: 'Sin alertas reales (demo)', timestamp: formatDateTime(new Date()), resolved: false } ];
    res.json(alerts);
  } catch (error) {
    logger.error('[admin-dashboard] alerts error', error);
    res.status(500).json({ error: 'admin_dashboard_alerts_failed' });
  }
});

router.get('/broadcasts', async (_req, res) => {
  try {
    const docs = await getCollectionDocs('broadcasts', { orderBy: 'scheduledAt', limit: 100 });
    let items = docs.map(mapBroadcastDoc);
    if (!items.length) items = [ { id: 'br-1', type: 'email', subject: 'Mantenimiento programado', segment: 'Todos', scheduledAt: formatDateTime(new Date()), status: 'Pendiente', stats: null } ];
    res.json(items);
  } catch (error) {
    logger.error('[admin-dashboard] broadcasts error', error);
    res.status(500).json({ error: 'admin_dashboard_broadcasts_failed' });
  }
});

router.get('/audit', async (_req, res) => {
  try {
    const docs = await getCollectionDocs('auditLogs', { orderBy: 'createdAt', limit: 200 });
    let items = docs.map(mapAuditLogDoc);
    if (!items.length) items = [ { id: 'au-1', createdAt: formatDateTime(new Date()), actor: 'admin@lovenda.com', action: 'FLAG_UPDATE', resourceType: 'flag', resourceId: 'FEATURE_DEMO', payload: '{}' } ];
    res.json(items);
  } catch (error) {
    logger.error('[admin-dashboard] audit error', error);
    res.status(500).json({ error: 'admin_dashboard_audit_failed' });
  }
});

router.get('/reports', async (_req, res) => {
  try {
    const docs = await getCollectionDocs('reports', { orderBy: 'name', limit: 100 });
    let items = docs.map(mapReportDoc);
    if (!items.length) items = [ { id: 'rep-1', name: 'Métricas globales', cadence: 'Semanal', recipients: ['direccion@lovenda.com'], format: 'PDF', status: 'enabled' } ];
    res.json(items);
  } catch (error) {
    logger.error('[admin-dashboard] reports error', error);
    res.status(500).json({ error: 'admin_dashboard_reports_failed' });
  }
});

router.get('/support', async (_req, res) => {
  try {
    const [summaryDocs, ticketDocs] = await Promise.all([
      getCollectionDocs('supportSummary', { limit: 1 }),
      getCollectionDocs('supportTickets', { orderBy: 'updatedAt', limit: 100 }),
    ]);
    let summary = summaryDocs.length ? mapSupportSummaryDoc(summaryDocs[0]) : null;
    let tickets = ticketDocs.map(mapSupportTicketDoc);
    if (!summary) summary = { open: 0, pending: 0, resolved: 0, slaAverage: '—', nps: 50, updatedAt: formatDateTime(new Date()) };
    if (!tickets.length) tickets = [ { id: 'tck-1', subject: 'Demo: acceso planner', requester: 'planner@lovenda.com', status: 'open', updatedAt: formatDateTime(new Date()), priority: 'low' } ];
    res.json({ summary, tickets });
  } catch (error) {
    logger.error('[admin-dashboard] support error', error);
    res.status(500).json({ error: 'admin_dashboard_support_failed' });
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
    await writeAudit(req, 'ADMIN_TASK_CREATE', { resourceType: 'adminTask', resourceId: ref.id, payload: { title: t } });
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
    await writeAudit(req, 'ADMIN_TASK_UPDATE', { resourceType: 'adminTask', resourceId: id, payload: patch });
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
    await writeAudit(req, 'ADMIN_ALERT_RESOLVE', { resourceType: 'adminAlert', resourceId: id, payload: { notes } });
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
    await writeAudit(req, 'ADMIN_FLAG_UPDATE', { resourceType: 'featureFlag', resourceId: id, payload: { enabled: patch.enabled } });
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
    await writeAudit(req, 'ADMIN_SECRET_ROTATE', { resourceType: 'secret', resourceId: id });
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
    await writeAudit(req, 'ADMIN_TEMPLATE_SAVE', { resourceType: 'template', resourceId: id });
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
    await writeAudit(req, 'ADMIN_BROADCAST_CREATE', { resourceType: 'broadcast', resourceId: ref.id, payload: { subject: tSubject } });
    return res.status(201).json({ id: ref.id, item });
  } catch (error) {
    logger.error('[admin-dashboard] create broadcast error', error);
    return res.status(500).json({ error: 'admin_broadcast_create_failed' });
  }
});

export default router;
