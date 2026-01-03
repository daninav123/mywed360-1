const ROLES = ['owner', 'planner', 'assistant'];
const LEVELS = ['manage', 'view', 'none'];

const MODULE_DEFAULTS = Object.freeze({
  guests: { owner: 'manage', planner: 'manage', assistant: 'view' },
  tasks: { owner: 'manage', planner: 'manage', assistant: 'view' },
  finance: { owner: 'manage', planner: 'view', assistant: 'none' },
  providers: { owner: 'manage', planner: 'manage', assistant: 'view' },
  communications: { owner: 'manage', planner: 'manage', assistant: 'view' },
  settings: { owner: 'manage', planner: 'manage', assistant: 'none' },
  analytics: { owner: 'manage', planner: 'view', assistant: 'none' },
});

const MODULE_PERMISSION_MAP = [
  { module: 'guests', viewKey: 'viewGuests', manageKey: 'manageGuests' },
  { module: 'tasks', viewKey: 'viewTasks', manageKey: 'manageTasks' },
  { module: 'finance', viewKey: 'viewFinance', manageKey: 'manageFinance' },
  { module: 'providers', viewKey: 'viewProviders', manageKey: 'manageProviders' },
  { module: 'communications', viewKey: 'viewCommunications', manageKey: 'manageCommunications' },
  { module: 'settings', viewKey: 'viewSettings', manageKey: 'manageSettings' },
  { module: 'analytics', viewKey: 'viewAnalytics', manageKey: null },
];

const sanitizeLevel = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase();
  if (LEVELS.includes(normalized)) return normalized;
  return null;
};

export function normalizeModulePermissions(raw) {
  const result = {};
  const source = raw && typeof raw === 'object' ? raw : {};
  for (const [module, defaults] of Object.entries(MODULE_DEFAULTS)) {
    const moduleSource = source[module];
    const normalized = {};
    for (const role of ROLES) {
      const fallback = defaults[role] || 'view';
      const override = moduleSource && sanitizeLevel(moduleSource[role]);
      normalized[role] = override || fallback;
    }
    result[module] = normalized;
  }
  return result;
}

export function computePermissionOverrides(modulePermissions, role) {
  if (!role) return {};
  const normalizedRole = String(role).toLowerCase();
  const modules = normalizeModulePermissions(modulePermissions);
  const overrides = {};

  const applyLevel = (moduleEntry, viewKey, manageKey) => {
    if (!moduleEntry) return;
    const level = moduleEntry[normalizedRole];
    if (!viewKey) return;
    if (level === 'manage') {
      overrides[viewKey] = true;
      if (manageKey) overrides[manageKey] = true;
    } else if (level === 'view') {
      overrides[viewKey] = true;
      if (manageKey) overrides[manageKey] = false;
    } else if (level === 'none') {
      overrides[viewKey] = false;
      if (manageKey) overrides[manageKey] = false;
    }
  };

  MODULE_PERMISSION_MAP.forEach(({ module, viewKey, manageKey }) => {
    applyLevel(modules[module], viewKey, manageKey);
  });

  return overrides;
}

export const MODULE_PERMISSION_DEFINITION = MODULE_PERMISSION_MAP.map((item) => ({
  module: item.module,
  viewKey: item.viewKey,
  manageKey: item.manageKey,
}));

export const MODULE_PERMISSION_OPTIONS = Object.freeze({
  roles: ROLES,
  levels: LEVELS,
  defaults: MODULE_DEFAULTS,
});

