import errorLogger from '../utils/errorLogger';
import { getAdminFetchOptions, getAdminHeaders, getAdminSessionToken } from './adminSession';
import { apiGet, apiPost, apiPut } from './apiClient';

const ADMIN_BASE_PATH = '/api/admin/dashboard';

const toArray = (value) => (Array.isArray(value) ? value : []);
const toObject = (value) => (value && typeof value === 'object' ? value : null);

const DEFAULT_OVERVIEW = {
  kpis: [],
  services: [],
  alerts: [],
  tasks: [],
  newTasks: [],
  meta: null,
};

const DEFAULT_STORAGE_METRICS = {
  totalBytes: 0,
  totalGigabytes: 0,
  premiumAverageBytes: 0,
  premiumAverageGigabytes: 0,
  premiumCount: 0,
  source: 'fallback',
};

const DEFAULT_DOWNLOAD_METRICS = {
  total: 0,
  last30d: 0,
  source: 'fallback',
};

const DEFAULT_TRAFFIC_METRICS = {
  totalVisits: 0,
  newVisits: 0,
  since: null,
  source: 'fallback',
};

const DEFAULT_USER_GROWTH_METRICS = {
  newUsers: 0,
  newPremiumUsers: 0,
  newPremiumShare: 0,
  totalUsers: 0,
  since: null,
  source: 'fallback',
};

const DEFAULT_METRICS = {
  series: [],
  funnel: null,
  iaCosts: [],
  communications: [],
  supportMetrics: null,
  userStats: {
    total: 0,
    active7d: 0,
    byRole: {
      owner: 0,
      planner: 0,
      assistant: 0,
    },
    source: 'fallback',
  },
  weddingStats: {
    total: 0,
    active: 0,
    withPlanner: 0,
    withoutPlanner: 0,
    source: 'fallback',
  },
  acquisition: [],
  retention: [],
  engagement: [],
  storage: { ...DEFAULT_STORAGE_METRICS },
  downloads: { ...DEFAULT_DOWNLOAD_METRICS },
  traffic: { ...DEFAULT_TRAFFIC_METRICS },
  userGrowth: { ...DEFAULT_USER_GROWTH_METRICS },
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

const DEFAULT_DISCOUNTS = {
  items: [],
  summary: {
    totalLinks: 0,
    totalUses: 0,
    totalRevenue: 0,
    currency: 'EUR',
    totalManagers: 0,
  },
};

const DEFAULT_REVOLUT_LIMIT = {
  limit: 0,
  used: 0,
  currency: 'EUR',
};

export const DEFAULT_REVOLUT_ACCOUNT = {
  connected: false,
  businessName: '',
  businessId: null,
  lastSync: null,
  lastSyncStatus: 'never',
  lastSyncError: null,
  balance: {
    available: 0,
    pending: 0,
    currency: 'EUR',
  },
  limits: {
    daily: { ...DEFAULT_REVOLUT_LIMIT },
    monthly: { ...DEFAULT_REVOLUT_LIMIT },
  },
  webhookStatus: 'unknown',
  webhookUrl: null,
  autoSyncEnabled: false,
  pendingApprovals: [],
  requiresAction: false,
};

const DEFAULT_SALES_CONTACT = {
  name: '',
  email: '',
  phone: '',
};

const normalizeSalesContact = (contact) => {
  if (!contact || typeof contact !== 'object') {
    return { ...DEFAULT_SALES_CONTACT };
  }

  return {
    name: typeof contact.name === 'string' ? contact.name : '',
    email: typeof contact.email === 'string' ? contact.email : '',
    phone: typeof contact.phone === 'string' ? contact.phone : '',
  };
};

const normalizeDiscountLinkItem = (item = {}) => {
  if (!item || typeof item !== 'object') return item || {};

  const assignedTo = normalizeSalesContact(item.assignedTo);
  const salesManager = normalizeSalesContact(item.salesManager);

  return {
    ...item,
    assignedTo,
    salesManager,
  };
};

const computeUniqueManagers = (items = []) => {
  const identifiers = new Set();

  for (const link of items) {
    if (!link || typeof link !== 'object') continue;
    const manager = normalizeSalesContact(link.salesManager);
    const key =
      (manager.email && manager.email.toLowerCase()) ||
      (manager.name && manager.name.toLowerCase()) ||
      null;
    if (key) {
      identifiers.add(key);
    }
  }

  return identifiers.size;
};

const ROLE_LABEL_DEFAULTS = {
  owner: 'Owners',
  planner: 'Wedding planners',
  assistant: 'Assistants',
};

const EMPTY_ROLE_SUMMARY_FILTERS = {
  allowedStatuses: [],
  excludedEmailSuffixes: [],
  excludedEmailPrefixes: [],
  excludedEmailContains: [],
  excludedTags: [],
  excludedBooleanKeys: [],
};

const DEFAULT_USER_STATS = {
  total: 0,
  active7d: 0,
  byRole: {
    owner: 0,
    planner: 0,
    assistant: 0,
  },
  source: 'fallback',
};

const DEFAULT_WEDDING_STATS = {
  total: 0,
  active: 0,
  withPlanner: 0,
  withoutPlanner: 0,
  source: 'fallback',
};

const normalizeMetricNumber = (value) => (Number.isFinite(value) ? value : 0);

const TASK_TEMPLATE_CACHE_TTL = 60 * 1000;
let taskTemplatesCache = { templates: null, meta: null, timestamp: 0 };

const normalizeUserStats = (stats) => {
  if (!stats || typeof stats !== 'object') return { ...DEFAULT_USER_STATS };
  const byRole = stats.byRole && typeof stats.byRole === 'object' ? stats.byRole : {};
  return {
    total: normalizeMetricNumber(stats.total),
    active7d: normalizeMetricNumber(stats.active7d),
    byRole: {
      owner: normalizeMetricNumber(byRole.owner),
      planner: normalizeMetricNumber(byRole.planner),
      assistant: normalizeMetricNumber(byRole.assistant),
    },
    source: typeof stats.source === 'string' && stats.source ? stats.source : 'fallback',
  };
};

const normalizeWeddingStats = (stats) => {
  if (!stats || typeof stats !== 'object') return { ...DEFAULT_WEDDING_STATS };
  return {
    total: normalizeMetricNumber(stats.total),
    active: normalizeMetricNumber(stats.active),
    withPlanner: normalizeMetricNumber(stats.withPlanner),
    withoutPlanner: normalizeMetricNumber(stats.withoutPlanner),
    source: typeof stats.source === 'string' && stats.source ? stats.source : 'fallback',
  };
};

const normalizeStorageMetrics = (metrics) => {
  if (!metrics || typeof metrics !== 'object') return { ...DEFAULT_STORAGE_METRICS };
  return {
    totalBytes: normalizeMetricNumber(metrics.totalBytes),
    totalGigabytes: normalizeMetricNumber(metrics.totalGigabytes),
    premiumAverageBytes: normalizeMetricNumber(metrics.premiumAverageBytes),
    premiumAverageGigabytes: normalizeMetricNumber(metrics.premiumAverageGigabytes),
    premiumCount: normalizeMetricNumber(metrics.premiumCount),
    source:
      typeof metrics.source === 'string' && metrics.source
        ? metrics.source
        : 'fallback',
  };
};

const normalizeDownloadMetrics = (metrics) => {
  if (!metrics || typeof metrics !== 'object') return { ...DEFAULT_DOWNLOAD_METRICS };
  return {
    total: normalizeMetricNumber(metrics.total),
    last30d: normalizeMetricNumber(metrics.last30d),
    source:
      typeof metrics.source === 'string' && metrics.source
        ? metrics.source
        : 'fallback',
  };
};

const normalizeTrafficMetrics = (metrics) => {
  if (!metrics || typeof metrics !== 'object') return { ...DEFAULT_TRAFFIC_METRICS };
  return {
    totalVisits: normalizeMetricNumber(metrics.totalVisits),
    newVisits: normalizeMetricNumber(metrics.newVisits),
    since: metrics.since || null,
    source:
      typeof metrics.source === 'string' && metrics.source
        ? metrics.source
        : 'fallback',
  };
};

const normalizeUserGrowthMetrics = (metrics) => {
  if (!metrics || typeof metrics !== 'object') return { ...DEFAULT_USER_GROWTH_METRICS };
  return {
    newUsers: normalizeMetricNumber(metrics.newUsers),
    newPremiumUsers: normalizeMetricNumber(metrics.newPremiumUsers),
    newPremiumShare: Number.isFinite(metrics.newPremiumShare) ? metrics.newPremiumShare : 0,
    totalUsers: normalizeMetricNumber(metrics.totalUsers),
    since: metrics.since || null,
    source:
      typeof metrics.source === 'string' && metrics.source
        ? metrics.source
        : 'fallback',
  };
};

const normalizeCurrencyCode = (code, fallback = 'EUR') => {
  if (typeof code === 'string' && code.trim().length === 3) {
    return code.trim().toUpperCase();
  }
  return fallback;
};

const normalizeRevolutLimit = (limit = {}, fallbackCurrency = 'EUR') => ({
  limit: normalizeMetricNumber(limit.limit),
  used: normalizeMetricNumber(limit.used),
  currency: normalizeCurrencyCode(limit.currency, fallbackCurrency),
});

const normalizeRevolutAccount = (raw = {}) => {
  const balanceCurrency = normalizeCurrencyCode(raw?.balance?.currency, 'EUR');
  return {
    connected: !!raw.connected,
    businessName: typeof raw.businessName === 'string' ? raw.businessName : '',
    businessId: typeof raw.businessId === 'string' ? raw.businessId : null,
    lastSync: typeof raw.lastSync === 'string' ? raw.lastSync : null,
    lastSyncStatus:
      typeof raw.lastSyncStatus === 'string' && raw.lastSyncStatus
        ? raw.lastSyncStatus
        : 'never',
    lastSyncError: typeof raw.lastSyncError === 'string' ? raw.lastSyncError : null,
    balance: {
      available: normalizeMetricNumber(raw?.balance?.available),
      pending: normalizeMetricNumber(raw?.balance?.pending),
      currency: balanceCurrency,
    },
    limits: {
      daily: normalizeRevolutLimit(raw?.limits?.daily, balanceCurrency),
      monthly: normalizeRevolutLimit(raw?.limits?.monthly, balanceCurrency),
    },
    webhookStatus:
      typeof raw.webhookStatus === 'string' && raw.webhookStatus
        ? raw.webhookStatus
        : 'unknown',
    webhookUrl: typeof raw.webhookUrl === 'string' ? raw.webhookUrl : null,
    autoSyncEnabled: !!raw.autoSyncEnabled,
    pendingApprovals: toArray(raw.pendingApprovals),
    requiresAction: !!raw.requiresAction,
  };
};

const normalizeRevolutStatement = (raw = {}) => ({
  id: typeof raw.id === 'string' ? raw.id : raw.period || raw.createdAt || null,
  period: typeof raw.period === 'string' ? raw.period : null,
  status:
    typeof raw.status === 'string' && raw.status
      ? raw.status
      : 'available',
  createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : null,
  downloadUrl: typeof raw.downloadUrl === 'string' ? raw.downloadUrl : null,
});

const normalizeRevolutTransfer = (raw = {}) => {
  const counterparty =
    typeof raw.counterparty === 'string'
      ? raw.counterparty
      : typeof raw?.counterparty?.name === 'string'
        ? raw.counterparty.name
        : '—';
  return {
    id: typeof raw.id === 'string' ? raw.id : raw.reference || raw.publicId || null,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : null,
    amount: normalizeMetricNumber(raw.amount),
    currency: normalizeCurrencyCode(raw.currency, 'EUR'),
    counterparty,
    reference: typeof raw.reference === 'string' ? raw.reference : null,
    status:
      typeof raw.status === 'string' && raw.status
        ? raw.status
        : 'pending',
    direction:
      typeof raw.direction === 'string' && raw.direction
        ? raw.direction
        : 'out',
  };
};

async function fetchAdminEndpoint(path) {
  console.log(`🔍 [adminDataService] Fetching admin endpoint: ${path}`);
  try {
    const response = await apiGet(path, getAdminFetchOptions({ auth: false, silent: true }));
    console.log(`  - Response status: ${response.status}`);
    console.log(`  - Response ok: ${response.ok}`);

    let data = null;
    if (response.status !== 204) {
      try {
        data = await response.json();
        console.log(`  - Data received:`, data);
      } catch (jsonError) {
        console.error(`  ❌ Failed to parse JSON:`, jsonError);
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

const createRoleBucket = (label) => ({
  label,
  total: 0,
  real: 0,
  excluded: {
    total: 0,
    byReason: {
      status: 0,
      flags: 0,
      email: 0,
    },
  },
});

const normalizeRoleBucket = (bucket, fallbackLabel) => {
  if (!bucket || typeof bucket !== 'object') {
    return createRoleBucket(fallbackLabel);
  }

  const label =
    typeof bucket.label === 'string' && bucket.label.trim() ? bucket.label : fallbackLabel;
  const total = Number.isFinite(bucket.total) ? bucket.total : 0;
  const real = Number.isFinite(bucket.real) ? bucket.real : 0;
  const excludedTotal = Number.isFinite(bucket?.excluded?.total)
    ? bucket.excluded.total
    : Math.max(total - real, 0);
  const byReason = bucket?.excluded?.byReason || {};

  return {
    label,
    total,
    real,
    excluded: {
      total: excludedTotal,
      byReason: {
        status: Number.isFinite(byReason.status) ? byReason.status : 0,
        flags: Number.isFinite(byReason.flags) ? byReason.flags : 0,
        email: Number.isFinite(byReason.email) ? byReason.email : 0,
      },
    },
  };
};

const buildDefaultRoleBuckets = () => ({
  owner: createRoleBucket(ROLE_LABEL_DEFAULTS.owner),
  planner: createRoleBucket(ROLE_LABEL_DEFAULTS.planner),
  assistant: createRoleBucket(ROLE_LABEL_DEFAULTS.assistant),
});

const normalizeRoleSummary = (raw) => {
  const safe = raw && typeof raw === 'object' ? raw : {};
  const filters = safe.filters && typeof safe.filters === 'object' ? safe.filters : {};

  return {
    generatedAt: typeof safe.generatedAt === 'string' ? safe.generatedAt : null,
    durationMs: Number.isFinite(safe.durationMs) ? safe.durationMs : null,
    scanned: Number.isFinite(safe.scanned) ? safe.scanned : 0,
    totals: {
      total: Number.isFinite(safe?.totals?.total) ? safe.totals.total : 0,
      real: Number.isFinite(safe?.totals?.real) ? safe.totals.real : 0,
      excluded: Number.isFinite(safe?.totals?.excluded) ? safe.totals.excluded : 0,
    },
    roles: {
      owner: normalizeRoleBucket(safe?.roles?.owner, ROLE_LABEL_DEFAULTS.owner),
      planner: normalizeRoleBucket(safe?.roles?.planner, ROLE_LABEL_DEFAULTS.planner),
      assistant: normalizeRoleBucket(safe?.roles?.assistant, ROLE_LABEL_DEFAULTS.assistant),
    },
    filters: {
      allowedStatuses: Array.isArray(filters.allowedStatuses) ? filters.allowedStatuses : [],
      excludedEmailSuffixes: Array.isArray(filters.excludedEmailSuffixes)
        ? filters.excludedEmailSuffixes
        : [],
      excludedEmailPrefixes: Array.isArray(filters.excludedEmailPrefixes)
        ? filters.excludedEmailPrefixes
        : [],
      excludedEmailContains: Array.isArray(filters.excludedEmailContains)
        ? filters.excludedEmailContains
        : [],
      excludedTags: Array.isArray(filters.excludedTags) ? filters.excludedTags : [],
      excludedBooleanKeys: Array.isArray(filters.excludedBooleanKeys)
        ? filters.excludedBooleanKeys
        : [],
    },
    source: typeof safe.source === 'string' && safe.source ? safe.source : 'firestore',
    error: typeof safe.error === 'string' && safe.error ? safe.error : '',
  };
};

const buildDefaultRoleSummary = () => ({
  generatedAt: null,
  durationMs: null,
  scanned: 0,
  totals: { total: 0, real: 0, excluded: 0 },
  roles: buildDefaultRoleBuckets(),
  filters: { ...EMPTY_ROLE_SUMMARY_FILTERS },
  source: 'fallback',
  error: '',
});

export const getDashboardData = async () => {
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/overview`);
  if (!data) return DEFAULT_OVERVIEW;
  return {
    kpis: toArray(data.kpis),
    services: toArray(data.services),
    alerts: toArray(data.alerts),
    tasks: toArray(data.tasks),
    newTasks: toArray(data.newTasks),
    meta: data.meta || null,
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
    userStats: normalizeUserStats(data.userStats),
    weddingStats: normalizeWeddingStats(data.weddingStats),
    acquisition: toArray(data.acquisition),
    retention: toArray(data.retention),
    engagement: toArray(data.engagement),
    storage: normalizeStorageMetrics(data.storage),
    downloads: normalizeDownloadMetrics(data.downloads),
    traffic: normalizeTrafficMetrics(data.traffic),
    userGrowth: normalizeUserGrowthMetrics(data.userGrowth),
  };
};

export const getPortfolioData = async (opts = {}) => {
  const params = new URLSearchParams();
  const limit = Number.isFinite(opts.limit) ? Number(opts.limit) : 200;
  params.set('limit', String(limit));
  if (opts.status) params.set('status', opts.status);
  if (opts.fromDate) params.set('fromDate', opts.fromDate);
  if (opts.toDate) params.set('toDate', opts.toDate);
  if (opts.order) params.set('order', opts.order);

  const query = params.toString();
  const data = await fetchAdminEndpoint(
    `${ADMIN_BASE_PATH}/portfolio${query ? `?${query}` : ''}`,
  );

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    meta: data?.meta || null,
  };
};

export const getUsersData = async (opts = {}) => {
  console.log(' [getUsersData] Called with options:', opts);
  const limit = Number.isFinite(opts.limit) ? Number(opts.limit) : 100;
  console.log(`  - Fetching users with limit: ${limit}`);
  
  const data = await fetchAdminEndpoint(
    `${ADMIN_BASE_PATH}/users?limit=${encodeURIComponent(limit)}`,
  );
  
  console.log('  - Raw data from backend:', data);
  const items = toArray(data?.items);
  const meta = toObject(data?.meta);
  
  console.log(`  Returning ${items.length} users`);
  console.log('  - Meta:', meta);
  console.log('  - First user:', items[0]);
  
  return { items, meta };
};

export const getUsersRoleSummary = async () => {
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/users/role-summary`);
  if (!data) {
    return { summary: buildDefaultRoleSummary(), error: 'role_summary_unavailable' };
  }
  const summary = normalizeRoleSummary(data);
  return {
    summary,
    error: typeof data?.error === 'string' && data.error ? data.error : summary.error || '',
  };
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

export const getRevolutAccountOverview = async () => {
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/finance/revolut`);
  if (!data) {
    return {
      account: { ...DEFAULT_REVOLUT_ACCOUNT },
      statements: [],
      transfers: [],
      meta: { source: 'fallback' },
    };
  }
  return {
    account: normalizeRevolutAccount(data.account),
    statements: toArray(data.statements).map(normalizeRevolutStatement),
    transfers: toArray(data.transfers).map(normalizeRevolutTransfer),
    meta: toObject(data.meta) || { source: 'api' },
  };
};

export const triggerRevolutSync = async () => {
  const data = await postJson(`${ADMIN_BASE_PATH}/finance/revolut/sync`, {});
  return {
    account: normalizeRevolutAccount(data?.account),
    statements: toArray(data?.statements).map(normalizeRevolutStatement),
    transfers: toArray(data?.transfers).map(normalizeRevolutTransfer),
    meta: toObject(data?.meta) || null,
  };
};

export const refreshRevolutWebhooks = async () => {
  const data = await postJson(`${ADMIN_BASE_PATH}/finance/revolut/webhooks/refresh`, {});
  return normalizeRevolutAccount(data?.account);
};

export const disconnectRevolutAccount = async () => {
  const data = await postJson(`${ADMIN_BASE_PATH}/finance/revolut/disconnect`, {});
  return !!data?.success;
};

export const requestRevolutConnectLink = async () => {
  const data = await postJson(`${ADMIN_BASE_PATH}/finance/revolut/connect`, {});
  return typeof data?.url === 'string' && data.url ? data.url : null;
};

export const getDiscountLinks = async () => {
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/discounts`);
  if (!data) {
    return { ...DEFAULT_DISCOUNTS };
  }

  const items = toArray(data.items).map(normalizeDiscountLinkItem);
  const summary = {
    ...DEFAULT_DISCOUNTS.summary,
    ...(toObject(data.summary) || {}),
  };
  const managers = toArray(data.managers).map(normalizeSalesContact);
  const inferredManagers = computeUniqueManagers(items);

  if (!Number.isFinite(summary.totalManagers) || summary.totalManagers <= 0) {
    summary.totalManagers = managers.length > 0 ? managers.length : inferredManagers;
  }

  return {
    items,
    summary,
    managers,
  };
};

export const createDiscountCode = async (discountData) => {
  const response = await apiPost(
    `${ADMIN_BASE_PATH}/discounts`,
    discountData,
    getAdminFetchOptions({ auth: false, silent: true })
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'create_discount_failed' }));
    throw new Error(error.error || error.message || 'Error al crear código de descuento');
  }
  
  return response.json();
};

export const updateDiscountCode = async (id, discountData) => {
  const response = await apiPut(
    `${ADMIN_BASE_PATH}/discounts/${id}`,
    discountData,
    getAdminFetchOptions({ auth: false, silent: true })
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'update_discount_failed' }));
    throw new Error(error.error || error.message || 'Error al actualizar código de descuento');
  }
  
  return response.json();
};

export const generatePartnerToken = async (discountId) => {
  const response = await apiPost(
    `/api/partner/generate-token`,
    { discountId },
    getAdminFetchOptions({ auth: false, silent: true })
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'generate_token_failed' }));
    throw new Error(error.error || error.message || 'Error al generar token de partner');
  }
  
  return response.json();
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

export function invalidateWeddingTemplates() {
  taskTemplatesCache = { templates: null, meta: null, timestamp: 0 };
}

export async function getTaskTemplates(options = {}) {
  const { status = null, limit = null, forceRefresh = false } = options || {};
  const noFilters = !status && !limit;
  const now = Date.now();
  if (
    !forceRefresh &&
    noFilters &&
    taskTemplatesCache.templates &&
    now - taskTemplatesCache.timestamp < TASK_TEMPLATE_CACHE_TTL
  ) {
    return {
      templates: taskTemplatesCache.templates,
      meta: taskTemplatesCache.meta || { limit: 20 },
    };
  }

  const params = [];
  if (status) params.push(`status=${encodeURIComponent(status)}`);
  if (Number.isFinite(limit)) params.push(`limit=${encodeURIComponent(limit)}`);
  const qs = params.length ? `?${params.join('&')}` : '';

  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/task-templates${qs}`);
  const templates = Array.isArray(data?.templates) ? data.templates : [];
  const meta = data?.meta && typeof data.meta === 'object' ? data.meta : {};

  if (noFilters && !forceRefresh) {
    taskTemplatesCache = {
      templates,
      meta,
      timestamp: now,
    };
  }

  return { templates, meta };
}

export async function saveTaskTemplateDraft(payload) {
  const data = await postJson(`${ADMIN_BASE_PATH}/task-templates`, payload || {});
  invalidateWeddingTemplates();
  return data;
}

export async function publishTaskTemplate(id) {
  if (!id) throw new Error('template_id_required');
  const data = await postJson(`${ADMIN_BASE_PATH}/task-templates/${encodeURIComponent(id)}/publish`, {});
  invalidateWeddingTemplates();
  return data;
}

export async function previewTaskTemplate(id, options = {}) {
  if (!id) throw new Error('template_id_required');
  return await postJson(`${ADMIN_BASE_PATH}/task-templates/${encodeURIComponent(id)}/preview`, options || {});
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

export async function suspendUser(userId, reason) {
  if (!userId) throw new Error('user_id_required');
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    throw new Error('suspension_reason_required');
  }
  const payload = { reason: reason.trim() };
  return await postJson(`${ADMIN_BASE_PATH}/users/${encodeURIComponent(userId)}/suspend`, payload);
}

export async function reactivateUser(userId, notes = '') {
  if (!userId) throw new Error('user_id_required');
  const payload = { notes: notes ? String(notes).trim() : '' };
  return await postJson(`${ADMIN_BASE_PATH}/users/${encodeURIComponent(userId)}/reactivate`, payload);
}

export async function respondToTicket(ticketId, message, status) {
  if (!ticketId) throw new Error('ticket_id_required');
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('response_message_required');
  }
  const payload = { message };
  if (status) payload.status = status;
  return await postJson(`${ADMIN_BASE_PATH}/support/tickets/${encodeURIComponent(ticketId)}/respond`, payload);
}

export async function generateReport(type, recipients, dateRange) {
  if (!type) throw new Error('report_type_required');
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw new Error('recipients_required');
  }
  const payload = { type, recipients };
  if (dateRange) payload.dateRange = dateRange;
  return await postJson(`${ADMIN_BASE_PATH}/reports/generate`, payload);
}

export const getHttpMetricsSummary = async (opts = {}) => {
  const limit = Number.isFinite(opts.limit) ? Number(opts.limit) : 50;
  const data = await fetchAdminEndpoint(`/api/admin/metrics/http?limit=${encodeURIComponent(limit)}`);
  if (!data || typeof data !== 'object') {
    return { summary: null, requests: [], meta: { limit, source: 'unavailable' } };
  }
  return {
    summary: toObject(data.summary),
    requests: toArray(data.requests),
    meta: { limit, source: data.source || 'real' },
  };
};

export const getUserTasksAnalysis = async (opts = {}) => {
  const limit = Number.isFinite(opts.limit) ? Number(opts.limit) : 100;
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/task-templates/user-tasks/analysis?limit=${limit}`);
  if (!data || typeof data !== 'object') {
    return { tasks: [], meta: { totalWeddings: 0, totalUniqueTasks: 0 } };
  }
  return {
    tasks: toArray(data.tasks),
    meta: data.meta || { totalWeddings: 0, totalUniqueTasks: 0 },
  };
};

export const exportPortfolioPDF = async (filters = {}, format = 'summary') => {
  const payload = { filters, format };
  const response = await apiPost(`${ADMIN_BASE_PATH}/portfolio/export-pdf`, payload, getAdminFetchOptions({ auth: false }));
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'export_failed' }));
    throw new Error(error.error || 'portfolio_export_failed');
  }
  return response.json();
};

export const getProductMetrics = async () => {
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/metrics/product`);
  return data || { featureAdoption: {}, newRegistrations: {} };
};

export const getTechnicalMetrics = async () => {
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/metrics/technical`);
  return data || { performance: {}, uptime: 0, errorRate: 0 };
};

export const getEconomicMetrics = async () => {
  const data = await fetchAdminEndpoint(`${ADMIN_BASE_PATH}/metrics/economic`);
  return data || { cac: 0, ltv: 0, cacLtvRatio: 0 };
};
