/**
 * Middleware de autenticación para el backend de MaLoveApp
 * Verifica tokens de Firebase Auth y gestiona permisos
 */

import admin from 'firebase-admin';

import {
  getAdminSession,
  touchAdminSession,
} from '../services/adminSessions.js';
import { getCookie } from '../utils/cookies.js';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  try {
    // En producción, usar las credenciales del entorno
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      let serviceAccountObj;
      try {
        serviceAccountObj = JSON.parse(rawKey);
      } catch (jsonErr) {
        try {
          const decoded = Buffer.from(rawKey, 'base64').toString('utf8');
          serviceAccountObj = JSON.parse(decoded);
        } catch (b64Err) {
          serviceAccountObj = null;
        }
      }
      if (serviceAccountObj) {
        if (!admin.apps.length) admin.initializeApp({
          credential: admin.credential.cert(serviceAccountObj),
          projectId: process.env.FIREBASE_PROJECT_ID || serviceAccountObj.project_id || 'lovenda-98c77'
        });
      } else {
        // Fallback a archivo
        const fs = await import('fs');
        const path = await import('path');
        const rootPath = path.resolve(process.cwd(), 'serviceAccount.json');
        const secretPath = '/etc/secrets/serviceAccount.json';
        const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const candidatePaths = [envPath, rootPath, secretPath].filter(Boolean);
        const svcPath = candidatePaths.find(p => fs.existsSync(p)) || null;
        if (svcPath) {
          const serviceAccountFile = JSON.parse(fs.readFileSync(svcPath, 'utf8'));
          if (!admin.apps.length) admin.initializeApp({
            credential: admin.credential.cert(serviceAccountFile),
            projectId:
              process.env.FIREBASE_PROJECT_ID || serviceAccountFile.project_id || 'lovenda-98c77'
          });
          console.log(`[AuthMiddleware] Firebase Admin inicializado con serviceAccount.json (${svcPath})`);
        } else {
          if (!admin.apps.length) admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'lovenda-98c77'
          });
        }
      }
    } else {
      // Buscar archivo serviceAccount.json en raíz del proyecto como fallback
      try {
        const fs = await import('fs');
        const path = await import('path');
        const rootPath = path.resolve(process.cwd(), 'serviceAccount.json');
        const secretPath = '/etc/secrets/serviceAccount.json';
        const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const candidatePaths = [envPath, rootPath, secretPath].filter(Boolean);
        const svcPath = candidatePaths.find(p => fs.existsSync(p)) || null;
        if (svcPath) {
          const serviceAccountFile = JSON.parse(fs.readFileSync(svcPath, 'utf8'));
          if (!admin.apps.length) admin.initializeApp({
            credential: admin.credential.cert(serviceAccountFile),
            projectId: process.env.FIREBASE_PROJECT_ID || serviceAccountFile.project_id || 'lovenda-98c77'
          });
          console.log(`[AuthMiddleware] Firebase Admin inicializado con serviceAccount.json (${svcPath})`);
        } else {
          // �altimo recurso: inicialización sin credenciales explícitas (usará ADC si existe)
          if (!admin.apps.length) admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'lovenda-98c77'
          });
        }
      } catch (fileErr) {
        console.error('[AuthMiddleware] Error leyendo serviceAccount.json:', fileErr);
        if (!admin.apps.length) admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'lovenda-98c77'
        });
      }
    }
    console.log('[AuthMiddleware] Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('[AuthMiddleware] Error inicializando Firebase Admin:', error);
  }
}

/**
 * Extrae el token del header Authorization
 * @param {Object} req - Request object
 * @returns {string|null} - Token extraído o null
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Formato esperado: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

const ADMIN_SESSION_HEADER_KEYS = ['x-admin-session', 'x-admin-session-token', 'x-admin-token'];
const ADMIN_SESSION_COOKIE = 'admin_session';

const extractAdminSessionToken = (req) => {
  for (const headerKey of ADMIN_SESSION_HEADER_KEYS) {
    const value = req.headers?.[headerKey];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  const authHeader = req.headers?.authorization || '';
  if (authHeader.startsWith('Admin ')) {
    return authHeader.slice('Admin '.length).trim();
  }
  const cookieToken = getCookie(req, ADMIN_SESSION_COOKIE);
  if (cookieToken && cookieToken.trim()) {
    return cookieToken.trim();
  }
  return null;
};

/**
 * Verifica y decodifica el token de Firebase
 * @param {string} token - Token a verificar
 * @returns {Promise<Object>} - Datos del token decodificado
 */
const verifyFirebaseToken = async (token) => {
  // A partir de ahora s�lo se permiten tokens reales de Firebase.
  // El bypass con tokens mock queda deshabilitado salvo que se active de forma expl�cita (env)
  if (token && token.startsWith('mock-')) {
    console.warn('[AuthMiddleware] Token mock detectado; se requiere un token real de Firebase.');
    return {
      success: false,
      error: {
        code: 'mock-token-disabled',
        message: 'Los tokens mock est�n deshabilitados. Usa credenciales reales.',
      },
    };
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return {
      success: true,
      user: decodedToken
    };
  } catch (error) {
    console.error('[AuthMiddleware] Error verificando token:', error);
    
    let errorCode = 'invalid-token';
    let errorMessage = 'Token inválido';
    
    switch (error.code) {
      case 'auth/id-token-expired':
        errorCode = 'token-expired';
        errorMessage = 'Token expirado';
        break;
      case 'auth/id-token-revoked':
        errorCode = 'token-revoked';
        errorMessage = 'Token revocado';
        break;
      case 'auth/invalid-id-token':
        errorCode = 'invalid-token';
        errorMessage = 'Token inválido';
        break;
      case 'auth/user-not-found':
        errorCode = 'user-not-found';
        errorMessage = 'Usuario no encontrado';
        break;
    }
    
    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        originalError: error
      }
    };
  }
};

/**
 * Obtiene el perfil completo del usuario desde Firestore
 * @param {string} uid - ID del usuario
 * @returns {Promise<Object>} - Perfil del usuario
 */
const getUserProfile = async (uid, emailHint = '') => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const baseProfile = userDoc.exists
      ? { uid, ...userDoc.data() }
      : { uid, role: 'particular', preferences: {} };

    // Asegurar campos esenciales derivados del token cuando falten en Firestore
    const email = String(baseProfile.email || emailHint || '').toLowerCase();
    let myWed360Email = String(baseProfile.myWed360Email || '').toLowerCase();
    let maLoveEmail = String(baseProfile.maLoveEmail || '').toLowerCase();
    
    // Si no tiene maLoveEmail pero tiene emailUsername, construirlo
    if (!maLoveEmail && baseProfile.emailUsername) {
      maLoveEmail = `${baseProfile.emailUsername}@malove.app`;
    }
    
    if (!myWed360Email && email) {
      try {
        const loginPrefix = email.split('@')[0].slice(0, 4).toLowerCase();
        if (loginPrefix) myWed360Email = `${loginPrefix}@maloveapp.com`;
      } catch {}
    }

    return { ...baseProfile, email, myWed360Email, maLoveEmail };
  } catch (error) {
    console.error('[AuthMiddleware] Error obteniendo perfil:', error);
    return {
      uid,
      role: 'particular',
      preferences: {}
    };
  }
};

/**
 * Middleware principal de autenticación
 * @param {Object} options - Opciones del middleware
 * @returns {Function} - Función middleware
 */
const authMiddleware = (options = {}) => {
  const {
    required = true,
    roles = [],
    permissions = [],
    allowAnonymous = false
  } = options;

  return async (req, res, next) => {
    try {
      const adminSessionToken = extractAdminSessionToken(req);
      const token = adminSessionToken ? null : extractToken(req);

      if (!adminSessionToken && !token && required) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'no-token',
            message: 'Token de autenticación requerido'
          }
        });
      }
      
      if (!adminSessionToken && !token && allowAnonymous) {
        req.user = null;
        req.userProfile = null;
        return next();
      }

      let resolvedUser = null;
      let resolvedProfile = null;
      let resolvedSource = null;
      let firebaseTokenResult = null;

      if (adminSessionToken) {
        const session = getAdminSession(adminSessionToken);
        if (!session) {
          if (required) {
            return res.status(401).json({
              success: false,
              error: {
                code: 'invalid-admin-session',
                message: 'Sesión administrativa no válida o expirada',
              },
            });
          }
        } else {
          resolvedSource = 'admin-session';
          const email = session.email || session.profile?.email || 'admin@maloveapp.com';
          resolvedUser = {
            uid: session.profile?.id || 'admin-local',
            email,
            role: 'admin',
            isAdminSession: true,
            sessionId: session.sessionId,
            adminSessionToken,
          };
          resolvedProfile = {
            ...session.profile,
            role: 'admin',
            email,
          };
          try {
            await touchAdminSession(adminSessionToken);
          } catch {}
        }
      }

      // Si no había sesión admin válida, intentar con token estándar
      if (!resolvedUser && token) {
        const tokenResult = await verifyFirebaseToken(token);

        if (!tokenResult.success) {
          return res.status(401).json({
            success: false,
            error: tokenResult.error
          });
        }

        firebaseTokenResult = tokenResult;
        const userProfile = await getUserProfile(tokenResult.user.uid, tokenResult.user.email || '');

        resolvedSource = 'firebase';
        resolvedUser = {
          ...tokenResult.user,
          isAdminSession: false,
        };
        resolvedProfile = userProfile;
      }

      if (!resolvedUser) {
        if (allowAnonymous) {
          req.user = null;
          req.userProfile = null;
          return next();
        }
        return res.status(401).json({
          success: false,
          error: {
            code: 'authentication-required',
            message: 'Autenticación requerida'
          }
        });
      }

      // Verificar roles si se especifican
      if (roles.length > 0) {
        const userRole = resolvedProfile.role?.toLowerCase() || 'particular';
        const hasRequiredRole = roles.some(role => {
          const targetRole = role.toLowerCase();

          const roleHierarchy = {
            'admin': ['admin', 'planner', 'particular'],
            'planner': ['planner', 'particular'],
            'particular': ['particular']
          };

          return roleHierarchy[userRole]?.includes(targetRole) || false;
        });

        if (!hasRequiredRole) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'insufficient-role',
              message: 'Rol insuficiente para acceder a este recurso',
              requiredRoles: roles,
              userRole: userRole
            }
          });
        }
      }

      // Verificar permisos si se especifican
      if (permissions.length > 0) {
        const userRole = resolvedProfile.role?.toLowerCase() || 'particular';

        const rolePermissions = {
          'admin': ['*'],
          'planner': [
            'manage_weddings',
            'view_analytics',
            'manage_tasks',
            'manage_guests',
            'manage_vendors',
            'access_mail_api'
          ],
          'particular': [
            'manage_own_wedding',
            'manage_own_tasks',
            'manage_own_guests',
            'view_own_analytics',
            'access_mail_api'
          ]
        };

        const userPermissions = rolePermissions[userRole] || rolePermissions['particular'];
        const hasAllPermissions = permissions.every(permission =>
          userPermissions.includes('*') || userPermissions.includes(permission)
        );

        if (!hasAllPermissions) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'insufficient-permissions',
              message: 'Permisos insuficientes para acceder a este recurso',
              requiredPermissions: permissions,
              userPermissions: userPermissions.filter(p => p !== '*')
            }
          });
        }
      }

      req.user = resolvedUser;
      req.userProfile = resolvedProfile;
      req.authSource = resolvedSource;

      if (token) {
        if (firebaseTokenResult?.success && !resolvedUser.isAdminSession) {
          try {
            await admin.firestore()
              .collection('users')
              .doc(firebaseTokenResult.user.uid)
              .update({
                lastActivity: admin.firestore.FieldValue.serverTimestamp()
              });
          } catch (error) {
            console.warn('[AuthMiddleware] Error actualizando actividad:', error);
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('[AuthMiddleware] Error en middleware:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'middleware-error',
          message: 'Error interno del servidor'
        }
      });
    }
  };
};

/**
 * Middleware específico para rutas que requieren autenticación
 */
const requireAuth = authMiddleware({ required: true });

/**
 * Middleware específico para rutas de administrador
 */
const requireAdmin = authMiddleware({ 
  required: true, 
  roles: ['admin'] 
});

/**
 * Middleware específico para rutas de planner
 */
const requirePlanner = authMiddleware({ 
  required: true, 
  roles: ['admin', 'planner'] 
});

/**
 * Middleware para rutas de email que requieren permisos específicos
 */
const requireMailAccess = authMiddleware({
  required: true,
  permissions: ['access_mail_api']
});

/**
 * Middleware opcional (permite acceso anónimo)
 */
const optionalAuth = authMiddleware({ 
  required: false, 
  allowAnonymous: true 
});

/**
 * Middleware para verificar propiedad de recursos
 * Verifica que el usuario solo acceda a sus propios recursos
 */
const requireOwnership = (resourceIdParam = 'id', userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'authentication-required',
          message: 'Autenticación requerida'
        }
      });
    }
    
    // Los administradores pueden acceder a cualquier recurso
    if (req.userProfile?.role === 'admin') {
      return next();
    }
    
    const resourceId = req.params[resourceIdParam];
    const userId = req.user.uid;
    
    // Si el recurso pertenece al usuario o es el propio usuario
    if (resourceId === userId || req.body[userIdField] === userId) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      error: {
        code: 'access-denied',
        message: 'No tienes permisos para acceder a este recurso'
      }
    });
  };
};

/**
 * Utilidad para crear respuestas de error estandarizadas
 */
const createAuthError = (code, message, statusCode = 401) => {
  return {
    statusCode,
    body: {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      }
    }
  };
};

export {
  authMiddleware,
  requireAuth,
  requireAdmin,
  requirePlanner,
  requireMailAccess,
  optionalAuth,
  requireOwnership,
  createAuthError,
  extractToken,
  verifyFirebaseToken,
  getUserProfile
};

export default authMiddleware;

