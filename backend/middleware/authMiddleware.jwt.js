/**
 * Middleware de autenticación JWT (sin Firebase)
 * Verifica tokens JWT propios y gestiona permisos
 */

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import {
  getAdminSession,
  touchAdminSession,
} from '../services/adminSessions.js';
import { getCookie } from '../utils/cookies.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Extrae el token del header Authorization
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
 * Verifica y decodifica el token JWT
 */
const verifyJWTToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Obtener usuario de PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true }
    });
    
    if (!user) {
      return {
        success: false,
        error: {
          code: 'user-not-found',
          message: 'Usuario no encontrado'
        }
      };
    }
    
    return {
      success: true,
      user: {
        uid: user.id,
        email: user.email,
        email_verified: user.emailVerified,
        role: user.role,
        profile: user.profile
      }
    };
  } catch (error) {
    console.error('[AuthMiddleware] Error verificando token JWT:', error);
    
    let errorCode = 'invalid-token';
    let errorMessage = 'Token inválido';
    
    if (error.name === 'TokenExpiredError') {
      errorCode = 'token-expired';
      errorMessage = 'Token expirado';
    } else if (error.name === 'JsonWebTokenError') {
      errorCode = 'invalid-token';
      errorMessage = 'Token inválido';
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
 * Obtiene el perfil completo del usuario desde PostgreSQL
 */
const getUserProfile = async (uid) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: {
        profile: true,
        weddings: true,
        accessPermissions: {
          include: {
            wedding: true
          }
        }
      }
    });
    
    if (!user) {
      return null;
    }
    
    return {
      uid: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      weddings: user.weddings,
      accessPermissions: user.accessPermissions
    };
  } catch (error) {
    console.error('[AuthMiddleware] Error obteniendo perfil:', error);
    return null;
  }
};

/**
 * Middleware requireAuth - Requiere autenticación válida
 */
export const requireAuth = async (req, res, next) => {
  // Intentar admin session primero
  const adminSessionToken = extractAdminSessionToken(req);
  if (adminSessionToken) {
    const adminSession = await getAdminSession(adminSessionToken);
    if (adminSession && adminSession.isValid) {
      await touchAdminSession(adminSessionToken);
      req.user = {
        uid: adminSession.userId,
        email: adminSession.userEmail || '',
        isAdmin: true,
        adminSessionId: adminSessionToken
      };
      const fullProfile = await getUserProfile(adminSession.userId);
      if (fullProfile) {
        req.userProfile = fullProfile;
      }
      return next();
    }
  }

  // Intentar JWT token
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }
  
  const result = await verifyJWTToken(token);
  
  if (!result.success) {
    return res.status(401).json({
      success: false,
      error: result.error.message,
      code: result.error.code
    });
  }
  
  req.user = result.user;
  
  // Obtener perfil completo
  const fullProfile = await getUserProfile(result.user.uid);
  if (fullProfile) {
    req.userProfile = fullProfile;
  }
  
  next();
};

/**
 * Middleware optionalAuth - Autenticación opcional
 */
export const optionalAuth = async (req, res, next) => {
  const adminSessionToken = extractAdminSessionToken(req);
  if (adminSessionToken) {
    const adminSession = await getAdminSession(adminSessionToken);
    if (adminSession && adminSession.isValid) {
      await touchAdminSession(adminSessionToken);
      req.user = {
        uid: adminSession.userId,
        email: adminSession.userEmail || '',
        isAdmin: true,
        adminSessionId: adminSessionToken
      };
      const fullProfile = await getUserProfile(adminSession.userId);
      if (fullProfile) {
        req.userProfile = fullProfile;
      }
      return next();
    }
  }

  const token = extractToken(req);
  
  if (!token) {
    return next();
  }
  
  const result = await verifyJWTToken(token);
  
  if (result.success) {
    req.user = result.user;
    const fullProfile = await getUserProfile(result.user.uid);
    if (fullProfile) {
      req.userProfile = fullProfile;
    }
  }
  
  next();
};

/**
 * Middleware requireAdmin - Requiere rol de administrador
 */
export const requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, () => {
    if (!req.user || (req.user.role !== 'ADMIN' && !req.user.isAdmin)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado - se requiere rol de administrador'
      });
    }
    next();
  });
};

/**
 * Middleware requireSupplier - Requiere rol de proveedor
 */
export const requireSupplier = async (req, res, next) => {
  await requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'SUPPLIER') {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado - se requiere rol de proveedor'
      });
    }
    next();
  });
};

/**
 * Middleware requireMailAccess - Verifica acceso al buzón de email
 */
export const requireMailAccess = async (req, res, next) => {
  await requireAuth(req, res, async () => {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }
    
    // Verificar que el usuario tiene perfil con email alias
    const profile = await prisma.userProfile.findUnique({
      where: { userId: uid }
    });
    
    if (!profile || (!profile.myWed360Email && !profile.maLoveEmail)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso al buzón de email'
      });
    }
    
    req.emailAccess = {
      myWed360Email: profile.myWed360Email,
      maLoveEmail: profile.maLoveEmail
    };
    
    next();
  });
};
