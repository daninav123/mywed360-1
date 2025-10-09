import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';

import {
  adminKpis,
  serviceHealth,
  adminAlerts,
  adminTasks,
  adminPortfolio,
  adminUsersList,
  adminIncidents,
  featureFlags,
  secretList,
  emailTemplates,
  broadcastHistory,
  auditLogs,
  reportsScheduled,
  supportSummary,
  supportTickets,
} from '../data/adminMock';
import { db } from '../firebaseConfig.jsx';

const safeGetDocs = async (colName, opts = {}) => {
  if (!db) return null;
  try {
    const col = collection(db, colName);
    const q = opts.orderBy
      ? query(col, orderBy(opts.orderBy, opts.direction || 'desc'), limit(opts.limit || 20))
      : query(col, limit(opts.limit || 20));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn(`[adminDataService] No se pudo leer ${colName}:`, error);
    return null;
  }
};

export const getDashboardData = async () => {
  const metricsDocs = await safeGetDocs('adminMetrics', { limit: 1, orderBy: 'date' });
  const latestMetrics = metricsDocs && metricsDocs.length ? metricsDocs[0] : {};

  const alertsDocs = await safeGetDocs('adminAlerts', { orderBy: 'createdAt', limit: 20 });
  const tasksDocs = await safeGetDocs('adminTasks', { orderBy: 'createdAt', limit: 20 });
  const servicesDocs = await safeGetDocs('adminServiceStatus', { limit: 50, orderBy: 'service' });

  return {
    kpis: latestMetrics.kpis || adminKpis,
    services: servicesDocs || latestMetrics.servicesHealth || serviceHealth,
    alerts: alertsDocs || adminAlerts,
    tasks: tasksDocs || adminTasks,
  };
};

export const getMetricsData = async () => {
  const metricsDocs = await safeGetDocs('adminMetrics', { limit: 1, orderBy: 'date' });
  const latest = metricsDocs && metricsDocs.length ? metricsDocs[0] : {};
  return {
    series: latest.series || [],
    funnel: latest.funnel || null,
    iaCosts: latest.aiCosts || [],
  };
};

export const getPortfolioData = async () => {
  const weddingsDocs = await safeGetDocs('weddings', { limit: 100, orderBy: 'eventDate' });
  if (weddingsDocs && weddingsDocs.length) {
    return weddingsDocs.map((wedding) => ({
      id: wedding.id,
      couple: wedding.coupleName || wedding.name || 'Pareja sin nombre',
      owner: wedding.ownerEmail || 'sin-owner@lovenda.com',
      eventDate: wedding.eventDate || '-',
      status: wedding.status || 'draft',
      confirmedGuests: wedding.confirmedGuests || 0,
      signedContracts: wedding.signedContracts || 0,
      lastUpdate: wedding.updatedAt || wedding.createdAt || '-',
    }));
  }
  return adminPortfolio;
};

export const getUsersData = async () => {
  const usersDocs = await safeGetDocs('users', { limit: 100, orderBy: 'createdAt' });
  if (usersDocs && usersDocs.length) {
    return usersDocs.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role || 'owner',
      status: user.status || 'active',
      lastAccess: user.lastAccess || '-',
      weddings: user.weddingsCount || 0,
      createdAt: user.createdAt || '-',
    }));
  }
  return adminUsersList;
};

export const getIntegrationsData = async () => {
  const incidents = await safeGetDocs('adminIncidents', { orderBy: 'startedAt', limit: 50 });
  const servicesDocs = await safeGetDocs('adminServiceStatus', { limit: 50, orderBy: 'service' });
  return {
    services: servicesDocs || serviceHealth,
    incidents: incidents || adminIncidents,
  };
};

export const getSettingsData = async () => {
  const flagsDocs = await safeGetDocs('featureFlags', { limit: 50, orderBy: 'lastModifiedAt' });
  const secretsDocs = await safeGetDocs('adminSecrets', { limit: 50, orderBy: 'lastRotatedAt' });
  const templatesDocs = await safeGetDocs('adminTemplates', { limit: 50, orderBy: 'updatedAt' });

  return {
    featureFlags: flagsDocs || featureFlags,
    secrets: secretsDocs || secretList,
    templates: templatesDocs || emailTemplates,
  };
};

export const getAlertsData = async () => {
  const alertsDocs = await safeGetDocs('adminAlerts', { orderBy: 'createdAt', limit: 50 });
  return alertsDocs || adminAlerts;
};

export const getBroadcastData = async () => {
  const historyDocs = await safeGetDocs('adminBroadcasts', { orderBy: 'scheduledAt', limit: 50 });
  return historyDocs || broadcastHistory;
};

export const getAuditLogs = async () => {
  const logsDocs = await safeGetDocs('adminAuditLogs', { orderBy: 'createdAt', limit: 100 });
  return logsDocs || auditLogs;
};

export const getReportsData = async () => {
  const reportsDocs = await safeGetDocs('adminReports', { orderBy: 'name', limit: 50 });
  return reportsDocs || reportsScheduled;
};

export const getSupportData = async () => {
  const ticketsDocs = await safeGetDocs('adminTickets', { orderBy: 'updatedAt', limit: 50 });
  const summaryDocs = await safeGetDocs('adminSupportSummary', { limit: 1, orderBy: 'generatedAt' });
  return {
    summary: summaryDocs && summaryDocs.length ? summaryDocs[0] : supportSummary,
    tickets: ticketsDocs || supportTickets,
  };
};
