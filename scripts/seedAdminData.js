#!/usr/bin/env node
/**
 * Seed: Admin data for Global Administration dashboard
 * ---------------------------------------------
 * Pobla colecciones administrativas con datos reales mínimos para que la UI
 * muestre información real (no mocks) inmediatamente.
 *
 * Uso:
 *   node scripts/seedAdminData.js
 *
 * Requisitos:
 * - Variables de entorno para Firebase Admin (GOOGLE_APPLICATION_CREDENTIALS o FIREBASE_SERVICE_ACCOUNT_JSON)
 * - Firestore accesible (no emulador salvo que USE_FIRESTORE_EMULATOR=true)
 */

import admin from 'firebase-admin';
import { db } from '../backend/db.js';

const fv = admin.firestore.FieldValue;

async function ensureOne(col, data, id = null) {
  if (id) {
    const ref = db.collection(col).doc(id);
    await ref.set({ ...data, createdAt: fv.serverTimestamp(), updatedAt: fv.serverTimestamp() }, { merge: true });
    return ref.id;
  }
  const ref = await db.collection(col).add({ ...data, createdAt: fv.serverTimestamp(), updatedAt: fv.serverTimestamp() });
  return ref.id;
}

async function seedMetrics() {
  // Crear un documento con campo 'date' para que el orderBy funcione
  const now = new Date();
  const snap = await db.collection('adminMetrics').limit(1).get();
  if (!snap.empty) return 'exists';
  await ensureOne('adminMetrics', {
    date: fv.serverTimestamp(),
    activeUsers7d: 128,
    activeUsersTrend: 5,
    newWeddings30d: 7,
    newWeddingsTrend: 2,
    conversionRate: '11%',
    conversionTrend: 1,
    estimatedRevenue: '€1.340',
    estimatedRevenueTrend: 3,
    series: [
      { name: 'Usuarios activos', points: [12, 14, 18, 22, 21, 25, 28] },
    ],
    aiCosts: [
      { provider: 'OpenAI', cost: 23.5, period: '30d' },
    ],
    communications: [
      { channel: 'email', count: 420, period: '30d' },
      { channel: 'whatsapp', count: 180, period: '30d' },
    ],
  });
  return 'created';
}

async function seedServiceStatus() {
  const data = [
    { id: 'firebase', name: 'Firebase', status: 'operational', latency: '120ms', incidents: 0 },
    { id: 'mailgun', name: 'Mailgun', status: 'operational', latency: '210ms', incidents: 1 },
    { id: 'whatsapp', name: 'WhatsApp', status: 'operational', latency: '180ms', incidents: 0 },
    { id: 'openai', name: 'OpenAI', status: 'operational', latency: '250ms', incidents: 0 },
  ];
  for (const s of data) {
    await ensureOne('adminServiceStatus', s, s.id);
  }
  return 'upserted';
}

async function seedAlerts() {
  const snap = await db.collection('adminAlerts').limit(1).get();
  if (!snap.empty) return 'exists';
  await ensureOne('adminAlerts', {
    severity: 'high',
    module: 'Emails',
    message: 'Tasa de bounces elevándose > 5%',
    createdAt: fv.serverTimestamp(),
    resolved: false,
  });
  return 'created';
}

async function seedTasks() {
  const snap = await db.collection('adminTasks').limit(1).get();
  if (!snap.empty) return 'exists';
  await ensureOne('adminTasks', {
    title: 'Revisar conversión signup→boda',
    completed: false,
    priority: 'high',
    dueDate: new Date().toISOString().slice(0, 10),
  });
  return 'created';
}

async function seedWeddings() {
  const snap = await db.collection('weddings').limit(1).get();
  if (!snap.empty) return 'exists';
  await ensureOne('weddings', {
    couple: 'Ana & Luis',
    owner: 'owner@lovenda.com',
    eventDate: admin.firestore.Timestamp.fromDate(new Date(new Date().getFullYear(), 11, 1)),
    status: 'active',
    confirmedGuests: 80,
    signedContracts: 2,
    updatedAt: fv.serverTimestamp(),
  });
  return 'created';
}

async function seedUsers() {
  const snap = await db.collection('users').limit(1).get();
  if (!snap.empty) return 'exists';
  const id = await ensureOne('users', {
    email: 'owner@lovenda.com',
    role: 'owner',
    status: 'active',
    lastAccess: fv.serverTimestamp(),
    weddings: 1,
    createdAt: fv.serverTimestamp(),
  });
  return id ? 'created' : 'exists';
}

async function seedIncidents() {
  const snap = await db.collection('adminIncidents').limit(1).get();
  if (!snap.empty) return 'exists';
  await ensureOne('adminIncidents', {
    service: 'Mailgun',
    startedAt: new Date().toISOString(),
    duration: '25m',
    impact: 'Degradado',
    action: 'Retry policy ajustado',
    resolvedBy: 'ops',
  });
  return 'created';
}

async function seedSettings() {
  const flags = await db.collection('featureFlags').limit(1).get();
  if (flags.empty) {
    await ensureOne('featureFlags', {
      name: 'FEATURE_DEMO',
      description: 'Bandera ejemplo para panel admin',
      domain: 'core',
      enabled: true,
      lastModifiedBy: 'admin@lovenda.com',
      lastModifiedAt: new Date().toISOString(),
    }, 'FEATURE_DEMO');
  }
  const secrets = await db.collection('adminSecrets').limit(1).get();
  if (secrets.empty) {
    await ensureOne('adminSecrets', {
      name: 'MAILGUN_API_KEY',
      lastRotatedAt: new Date().toISOString().slice(0,10),
    }, 'MAILGUN_API_KEY');
  }
  const templates = await db.collection('adminTemplates').limit(1).get();
  if (templates.empty) {
    await ensureOne('adminTemplates', {
      name: 'email-welcome',
      content: 'Bienvenida Lovenda {nombre}',
      updatedAt: new Date().toISOString(),
    }, 'email-welcome');
  }
  return 'upserted';
}

async function seedBroadcasts() {
  const snap = await db.collection('adminBroadcasts').limit(1).get();
  if (!snap.empty) return 'exists';
  await ensureOne('adminBroadcasts', {
    type: 'email',
    subject: 'Mantenimiento programado',
    segment: 'Todos',
    scheduledAt: new Date().toISOString(),
    status: 'Pendiente',
    stats: null,
  });
  return 'created';
}

async function seedAudit() {
  const snap = await db.collection('adminAuditLogs').limit(1).get();
  if (!snap.empty) return 'exists';
  await ensureOne('adminAuditLogs', {
    actor: 'admin@lovenda.com',
    action: 'FLAG_UPDATE',
    resourceType: 'flag',
    resourceId: 'FEATURE_DEMO',
    payload: '{}',
    createdAt: fv.serverTimestamp(),
  });
  return 'created';
}

async function seedReports() {
  const snap = await db.collection('adminReports').limit(1).get();
  if (!snap.empty) return 'exists';
  await ensureOne('adminReports', {
    name: 'Métricas globales',
    cadence: 'Semanal',
    recipients: ['direccion@lovenda.com'],
    format: 'PDF',
    status: 'enabled',
  });
  return 'created';
}

async function seedSupport() {
  const sum = await db.collection('adminSupportSummary').limit(1).get();
  if (sum.empty) {
    await ensureOne('adminSupportSummary', {
      open: 2,
      pending: 1,
      resolved: 5,
      slaAverage: '2h',
      nps: 62,
      updatedAt: new Date().toISOString(),
    }, 'latest');
  }
  const tickets = await db.collection('adminTickets').limit(1).get();
  if (tickets.empty) {
    await ensureOne('adminTickets', {
      subject: 'Acceso planner',
      requester: 'planner@lovenda.com',
      status: 'open',
      updatedAt: new Date().toISOString(),
      priority: 'low',
    });
  }
  return 'upserted';
}

async function main() {
  console.log('⏳ Seed Admin Data...');
  const results = {};
  results.metrics = await seedMetrics();
  results.serviceStatus = await seedServiceStatus();
  results.alerts = await seedAlerts();
  results.tasks = await seedTasks();
  results.weddings = await seedWeddings();
  results.users = await seedUsers();
  results.incidents = await seedIncidents();
  results.settings = await seedSettings();
  results.broadcasts = await seedBroadcasts();
  results.audit = await seedAudit();
  results.reports = await seedReports();
  results.support = await seedSupport();
  console.log('✅ Done:', results);
}

main().catch((err) => {
  console.error('❌ Seed failed', err);
  process.exit(1);
});
