const ROLE_ALIASES = {
  pareja: 'owner',
  propietario: 'owner',
  owner: 'owner',
  planner: 'planner',
  'wedding-planner': 'planner',
  weddingplanner: 'planner',
  asistente: 'assistant',
  assistant: 'assistant',
};

const PERMISSION_TEMPLATE = {
  viewGuests: true,
  manageGuests: false,
  viewTasks: true,
  manageTasks: false,
  viewFinance: false,
  manageFinance: false,
  viewProviders: true,
  manageProviders: false,
  viewCommunications: true,
  manageCommunications: false,
  viewSettings: false,
  manageSettings: false,
  viewAnalytics: false,
  manageAssistants: false,
  inviteCollaborators: false,
  archiveWedding: false,
  createWedding: false,
};

const ROLE_PERMISSION_MAP = {
  owner: {
    ...PERMISSION_TEMPLATE,
    manageGuests: true,
    manageTasks: true,
    viewFinance: true,
    manageFinance: true,
    manageProviders: true,
    manageCommunications: true,
    viewSettings: true,
    manageSettings: true,
    viewAnalytics: true,
    manageAssistants: true,
    inviteCollaborators: true,
    archiveWedding: true,
  },
  planner: {
    ...PERMISSION_TEMPLATE,
    manageGuests: true,
    manageTasks: true,
    viewFinance: true,
    manageFinance: false,
    manageProviders: true,
    manageCommunications: true,
    viewSettings: true,
    manageSettings: true,
    viewAnalytics: true,
    createWedding: true,
    archiveWedding: true,
  },
  assistant: {
    ...PERMISSION_TEMPLATE,
    viewFinance: true,
  },
};

/**
 * Normaliza un rol (acepta alias conocidos) devolviendo owner/planner/assistant.
 * @param {string} rawRole
 * @param {string} [fallback='owner']
 * @returns {'owner'|'planner'|'assistant'}
 */
export function normalizeWeddingRole(rawRole, fallback = 'owner') {
  if (!rawRole || typeof rawRole !== 'string') return fallback;
  const normalized = rawRole.trim().toLowerCase();
  return ROLE_ALIASES[normalized] || normalized || fallback;
}

/**
 * Devuelve un objeto de permisos para el rol indicado.
 * Fusiona con la plantilla base para garantizar que todas las claves existan.
 * @param {string} role
 * @returns {Record<string, boolean>}
 */
export function permissionsForRole(role) {
  const key = normalizeWeddingRole(role);
  const base = ROLE_PERMISSION_MAP[key] || ROLE_PERMISSION_MAP.owner;
  return { ...PERMISSION_TEMPLATE, ...base };
}

/**
 * Mezcla permisos existentes con overrides asegurando la forma correcta.
 * @param {Record<string, boolean>} current
 * @param {Record<string, boolean>} overrides
 * @returns {Record<string, boolean>}
 */
export function mergePermissions(current = {}, overrides = {}) {
  return {
    ...PERMISSION_TEMPLATE,
    ...current,
    ...overrides,
  };
}

/**
 * Ajusta un registro de boda cargado desde Firestore para que incluya `role`
 * y un objeto `permissions` consistente. Si no existe rol, usa `fallbackRole`.
 * @param {object} entry
 * @param {string} fallbackRole
 * @returns {object}
 */
export function ensureWeddingAccessMetadata(entry = {}, fallbackRole = 'owner') {
  const resolvedRole = normalizeWeddingRole(entry.role || fallbackRole);
  const permissions =
    entry.permissions && typeof entry.permissions === 'object'
      ? mergePermissions(permissionsForRole(resolvedRole), entry.permissions)
      : permissionsForRole(resolvedRole);

  return {
    ...entry,
    role: resolvedRole,
    permissions,
  };
}

/**
 * Helper sencillo para saber si los permisos permiten una capacidad concreta.
 * @param {Record<string, boolean>} permissions
 * @param {string} key
 * @returns {boolean}
 */
export function hasPermission(permissions, key) {
  if (!permissions) return false;
  return Boolean(permissions[key]);
}

export const WEDDING_PERMISSION_KEYS = Object.keys(PERMISSION_TEMPLATE);

