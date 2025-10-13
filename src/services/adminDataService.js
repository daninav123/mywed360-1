import errorLogger from '../utils/errorLogger';
import { apiGet, apiPost, apiPut } from './apiClient';
import { getAdminHeaders, getAdminSessionToken } from './adminSession';

const ADMIN_BASE_PATH = '/api/admin/dashboard';

const toArray = (value) => (Array.isArray(value) ? value : []);
const toObject = (value) => (value && typeof value === 'object' ? value : null);

const DEFAULT_OVERVIEW = {
  kpis: [],
  services: [],
  alerts: [],
  tasks: [],
};

const DEFAULT_METRICS = {
  series: [],
  funnel: null,
  iaCosts: [],
  communications: [],
  supportMetrics: null,
};

const DEFAULT_INTEGRATIONS = {
  services: [],
  incidents: [],
};

const DEFAULT_SETTINGS = {
  featureFlags: [],
  secrets: [],
  templates: [],
};

const DEFAULT_SUPPORT = {
  summary: null,
  tickets: [],
};

async function fetchAdminEndpoint(path) {
  const adminToken = getAdminSessionToken();
  const headers = adminToken ? getAdminHeaders() : undefined;

  try {
    const response = await apiGet(path, {
      auth: !adminToken,
      silent: true,
      headers,
    });

    let data = null;
    if (response.status !== 204) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error?.message ||
        data?.error ||
        `${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    return data ?? null;
  } catch (error) {
    errorLogger?.logError?.('AdminDataServiceError', {
      path,
      message: error.message,
    });
    return null;
  }
}

export const getDashboardData = async () => {
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/overview`);
  if (!data) return DEFAULT_OVERVIEW;
  return {
    kpis: toArray(data.kpis),
    services: toArray(data.services),
    alerts: toArray(data.alerts),
    tasks: toArray(data.tasks),
  };
};

export const getMetricsData = async () => {
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/metrics`);
  if (!data) return DEFAULT_METRICS;
  return {
    series: toArray(data.series),
    funnel: data.funnel ?? null,
    iaCosts: toArray(data.iaCosts),
    communications: toArray(data.communications),
    supportMetrics: data.supportMetrics ?? null,
  };
};

export const getPortfolioData = async (opts = {}) => {
  const limit = Number.isFinite(opts.limit) ? Number(opts.limit) : 100;
  const data = await fetchAdminEndpoint(
    `${ADMIN_BASE_PATH}/portfolio?limit=${encodeURIComponent(limit)}`,
  );
  return Array.isArray(data?.items) ? data.items : [];
};

export const getUsersData = async (opts = {}) => {
  const limit = Number.isFinite(opts.limit) ? Number(opts.limit) : 100;
  const data = await fetchAdminEndpoint(
    `${ADMIN_BASE_PATH}/users?limit=${encodeURIComponent(limit)}`,
  );
  return Array.isArray(data?.items) ? data.items : [];
};

export const getIntegrationsData = async () => {
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/integrations`);
  if (!data) return DEFAULT_INTEGRATIONS;
  return {
    services: toArray(data.services),
    incidents: toArray(data.incidents),
  };
};

export const getSettingsData = async () => {
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/settings`);
  if (!data) return DEFAULT_SETTINGS;
  return {
    featureFlags: toArray(data.featureFlags),
    secrets: toArray(data.secrets),
    templates: toArray(data.templates),
  };
};

export const getAlertsData = async () =>
  toArray(await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/alerts`));

export const getBroadcastData = async () =>
  toArray(await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/broadcasts`));

export const getAuditLogs = async () =>
  toArray(await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/audit`));

export const getReportsData = async () =>
  toArray(await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/reports`));

export const getSupportData = async () => {
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/support`);
  if (!data) return DEFAULT_SUPPORT;
  return {
    summary: toObject(data.summary),
    tickets: toArray(data.tickets),
  };
};

// --- Mutations ---

async function postJson(path, body) {
  const adminToken = getAdminSessionToken();
  const headers = adminToken ? getAdminHeaders() : undefined;
  const res = await apiPost(path, body, { auth: !adminToken, headers });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    const err = new Error(data?.message || `${res.status} ${res.statusText}`);
    err.code = data?.code || 'admin_mutation_failed';
    throw err;
  }
  return data;
}

async function putJson(path, body) {
  const adminToken = getAdminSessionToken();
  const headers = adminToken ? getAdminHeaders() : undefined;
  const res = await apiPut(path, body, { auth: !adminToken, headers });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    const err = new Error(data?.message || `${res.status} ${res.statusText}`);
    err.code = data?.code || 'admin_mutation_failed';
    throw err;
  }
  return data;
}

export async function createAdminTask({ title, priority, dueDate }) {
  const payload = { title, priority, dueDate };
  const data = await postJson(`${ADMIN_BASE_PATH}/tasks`, payload);
  return data?.task || null;
}

export async function updateAdminTask(id, patch) {
  if (!id) throw new Error('task_id_required');
  return await putJson(`${ADMIN_BASE_PATH}/tasks/${encodeURIComponent(id)}`, patch);
}

export async function resolveAdminAlert(id, notes = '') {
  if (!id) throw new Error('alert_id_required');
  return await postJson(`${ADMIN_BASE_PATH}/alerts/${encodeURIComponent(id)}/resolve`, { notes });
}

export async function updateFeatureFlag(id, enabled) {
  if (!id) throw new Error('flag_id_required');
  const data = await putJson(`${ADMIN_BASE_PATH}/settings/flags/${encodeURIComponent(id)}`, { enabled: !!enabled });
  return data?.flag || null;
}

export async function rotateSecret(id) {
  if (!id) throw new Error('secret_id_required');
  return await postJson(`${ADMIN_BASE_PATH}/settings/secrets/${encodeURIComponent(id)}/rotate`, {});
}

export async function saveTemplate(id, content) {
  if (!id) throw new Error('template_id_required');
  return await putJson(`${ADMIN_BASE_PATH}/settings/templates/${encodeURIComponent(id)}`, { content });
}

export async function createBroadcast({ type = 'email', subject, content, segment = 'Todos', scheduledAt }) {
  const payload = { type, subject, content, segment };
  if (scheduledAt) payload.scheduledAt = scheduledAt;
  const data = await postJson(`${ADMIN_BASE_PATH}/broadcasts`, payload);
  return data?.item || null;
}

export async function retryIntegration(serviceId) {
  if (!serviceId) throw new Error('integration_id_required');
  const data = await postJson(`${ADMIN_BASE_PATH}/integrations/${encodeURIComponent(serviceId)}/retry`, {});
  return data?.service || null;
}
