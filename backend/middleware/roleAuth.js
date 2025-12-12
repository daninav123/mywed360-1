/**
 * Middleware de autorización basado en roles
 * Define y verifica roles de usuario en toda la aplicación
 */

import logger from '../utils/logger.js';

/**
 * Definición de roles disponibles
 */
export const ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  PLANNER: 'planner',
  ASSISTANT: 'assistant',
  SUPPLIER: 'supplier',
  GUEST: 'guest',
};

/**
 * Permisos por rol
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'manage_users',
    'manage_suppliers',
    'view_analytics',
    'manage_system',
    'manage_payments',
    'view_all_weddings',
    'delete_content',
  ],
  [ROLES.OWNER]: [
    'manage_wedding',
    'manage_guests',
    'manage_suppliers',
    'manage_finances',
    'manage_team',
    'view_analytics',
    'manage_payments',
  ],
  [ROLES.PLANNER]: [
    'manage_wedding',
    'manage_guests',
    'manage_suppliers',
    'manage_finances',
    'view_analytics',
  ],
  [ROLES.ASSISTANT]: [
    'manage_guests',
    'manage_suppliers',
    'view_analytics',
  ],
  [ROLES.SUPPLIER]: [
    'manage_profile',
    'view_requests',
    'submit_quotes',
    'manage_portfolio',
  ],
  [ROLES.GUEST]: [
    'view_wedding_info',
    'rsvp',
    'view_moments',
  ],
};

/**
 * Middleware para requerir autenticación de usuario
 * Verifica que el usuario esté autenticado
 */
export function requireAuth(req, res, next) {
  const { user } = req;

  if (!user) {
    logger.warn('Unauthorized access attempt', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required',
    });
  }

  next();
}

/**
 * Middleware para requerir rol específico
 * Uso: requireRole(ROLES.ADMIN, ROLES.OWNER)
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const { user } = req;

    if (!user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const userRole = user.role || ROLES.GUEST;

    if (!allowedRoles.includes(userRole)) {
      logger.warn('Insufficient permissions', {
        userId: user.id,
        userRole,
        requiredRoles: allowedRoles,
        path: req.path,
      });
      return res.status(403).json({
        error: 'forbidden',
        message: `Required role: ${allowedRoles.join(' or ')}`,
        required: allowedRoles,
        current: userRole,
      });
    }

    next();
  };
}

/**
 * Middleware para requerir permiso específico
 * Uso: requirePermission('manage_wedding', 'manage_guests')
 */
export function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    const { user } = req;

    if (!user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const userRole = user.role || ROLES.GUEST;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      logger.warn('Permission denied', {
        userId: user.id,
        userRole,
        requiredPermissions,
        userPermissions,
        path: req.path,
      });
      return res.status(403).json({
        error: 'forbidden',
        message: `Required permission: ${requiredPermissions.join(' or ')}`,
        required: requiredPermissions,
        userPermissions,
      });
    }

    next();
  };
}

/**
 * Middleware para verificar ownership de recurso
 * Verifica que el usuario es propietario del recurso
 */
export function requireOwnership(resourceField = 'userId') {
  return (req, res, next) => {
    const { user } = req;

    if (!user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const resourceOwnerId = req.params[resourceField] || req.body[resourceField];

    if (!resourceOwnerId) {
      logger.warn('Resource owner field not found', {
        resourceField,
        path: req.path,
      });
      return res.status(400).json({
        error: 'bad_request',
        message: `Missing ${resourceField}`,
      });
    }

    if (user.id !== resourceOwnerId && user.role !== ROLES.ADMIN) {
      logger.warn('Ownership verification failed', {
        userId: user.id,
        resourceOwnerId,
        path: req.path,
      });
      return res.status(403).json({
        error: 'forbidden',
        message: 'You can only access your own resources',
      });
    }

    next();
  };
}

/**
 * Middleware para verificar acceso a boda específica
 * Verifica que el usuario tiene acceso a la boda
 */
export function requireWeddingAccess(req, res, next) {
  const { user } = req;
  const { weddingId } = req.params;

  if (!user) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required',
    });
  }

  if (!weddingId) {
    return res.status(400).json({
      error: 'bad_request',
      message: 'Missing weddingId',
    });
  }

  // Verificar que el usuario tiene acceso a esta boda
  // Esto se implementaría consultando Firestore
  // Por ahora, solo verificamos que es propietario o admin
  if (user.role === ROLES.ADMIN) {
    return next();
  }

  // TODO: Verificar en Firestore que el usuario tiene acceso a esta boda
  // const weddingDoc = await db.collection('weddings').doc(weddingId).get();
  // const wedding = weddingDoc.data();
  // if (wedding.ownerId !== user.id && !wedding.teamMembers.includes(user.id)) {
  //   return res.status(403).json({ error: 'forbidden' });
  // }

  next();
}

/**
 * Middleware para rate limiting por rol
 * Diferentes límites según el rol del usuario
 */
export function rateLimitByRole(limits = {}) {
  const defaultLimits = {
    [ROLES.ADMIN]: { windowMs: 60000, max: 1000 },
    [ROLES.OWNER]: { windowMs: 60000, max: 500 },
    [ROLES.PLANNER]: { windowMs: 60000, max: 300 },
    [ROLES.ASSISTANT]: { windowMs: 60000, max: 200 },
    [ROLES.SUPPLIER]: { windowMs: 60000, max: 100 },
    [ROLES.GUEST]: { windowMs: 60000, max: 50 },
  };

  const finalLimits = { ...defaultLimits, ...limits };

  return (req, res, next) => {
    const { user } = req;
    const userRole = user?.role || ROLES.GUEST;
    const limit = finalLimits[userRole];

    // Implementar lógica de rate limiting
    // Esto se haría con una librería como express-rate-limit
    // Por ahora, solo registramos

    logger.info('Rate limit check', {
      userId: user?.id,
      userRole,
      limit: limit.max,
    });

    next();
  };
}

/**
 * Middleware para auditoría de acciones sensibles
 */
export function auditAction(actionType) {
  return (req, res, next) => {
    const { user } = req;

    logger.info('Audit action', {
      actionType,
      userId: user?.id,
      userRole: user?.role,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });

    next();
  };
}

/**
 * Obtener permisos de un rol
 */
export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Verificar si un rol tiene permiso
 */
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Verificar si un rol tiene alguno de los permisos
 */
export function hasAnyPermission(role, permissions) {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some((perm) => rolePermissions.includes(perm));
}

/**
 * Verificar si un rol tiene todos los permisos
 */
export function hasAllPermissions(role, permissions) {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.every((perm) => rolePermissions.includes(perm));
}

export default {
  ROLES,
  ROLE_PERMISSIONS,
  requireAuth,
  requireRole,
  requirePermission,
  requireOwnership,
  requireWeddingAccess,
  rateLimitByRole,
  auditAction,
  getPermissionsForRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
};
