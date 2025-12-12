/**
 * Middleware de autenticación para proveedores
 * Verifica JWT tokens y valida que el proveedor esté activo
 */

import jwt from 'jsonwebtoken';
import { db } from '../firebase-admin.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware para requerir autenticación de proveedor
 * Verifica JWT token y adjunta información del proveedor al request
 */
export async function requireSupplierAuth(req, res, next) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header', {
        path: req.path,
        method: req.method,
      });
      return res.status(401).json({
        error: 'missing_token',
        message: 'Authorization header required',
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.warn('Invalid JWT token', {
        error: error.message,
        path: req.path,
      });
      return res.status(401).json({
        error: 'invalid_token',
        message: 'Invalid or expired token',
      });
    }

    const { supplierId, email } = decoded;

    if (!supplierId) {
      logger.warn('JWT missing supplierId', {
        token: token.substring(0, 20) + '...',
      });
      return res.status(401).json({
        error: 'invalid_token',
        message: 'Token missing supplierId',
      });
    }

    // Verificar que el proveedor existe en Firestore
    const supplierDoc = await db.collection('suppliers').doc(supplierId).get();
    if (!supplierDoc.exists) {
      logger.warn('Supplier not found', {
        supplierId,
        email,
      });
      return res.status(403).json({
        error: 'supplier_not_found',
        message: 'Supplier does not exist',
      });
    }

    const supplier = supplierDoc.data();

    // Verificar que el proveedor está activo
    if (supplier.status !== 'active' && supplier.status !== 'verified') {
      logger.warn('Supplier inactive', {
        supplierId,
        status: supplier.status,
      });
      return res.status(403).json({
        error: 'supplier_inactive',
        message: `Supplier is ${supplier.status}`,
      });
    }

    // Verificar que el email coincide (seguridad adicional)
    if (email && supplier.email && email !== supplier.email) {
      logger.warn('Email mismatch in token', {
        supplierId,
        tokenEmail: email,
        supplierEmail: supplier.email,
      });
      return res.status(403).json({
        error: 'email_mismatch',
        message: 'Token email does not match supplier email',
      });
    }

    // Adjuntar información del proveedor al request
    req.supplier = {
      id: supplierId,
      email: supplier.email,
      name: supplier.name,
      status: supplier.status,
      category: supplier.category,
      ...supplier,
    };

    logger.info('Supplier authenticated', {
      supplierId,
      email: supplier.email,
    });

    next();
  } catch (error) {
    logger.error('Auth middleware error', {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      error: 'internal_error',
      message: 'Authentication error',
    });
  }
}

/**
 * Middleware para verificar que el proveedor accede solo sus propios datos
 * Debe usarse después de requireSupplierAuth
 */
export function verifySupplierId(req, res, next) {
  const { supplierId } = req.params;
  const { supplier } = req;

  if (!supplier) {
    return res.status(401).json({
      error: 'not_authenticated',
      message: 'Supplier not authenticated',
    });
  }

  if (supplier.id !== supplierId) {
    logger.warn('Supplier trying to access other supplier data', {
      requestedSupplierId: supplierId,
      authenticatedSupplierId: supplier.id,
      email: supplier.email,
    });
    return res.status(403).json({
      error: 'forbidden',
      message: 'You can only access your own data',
    });
  }

  next();
}

/**
 * Middleware para requerir rol específico de proveedor
 * Uso: requireSupplierRole('admin', 'manager')
 */
export function requireSupplierRole(...allowedRoles) {
  return (req, res, next) => {
    const { supplier } = req;

    if (!supplier) {
      return res.status(401).json({
        error: 'not_authenticated',
        message: 'Supplier not authenticated',
      });
    }

    const supplierRole = supplier.role || 'member';

    if (!allowedRoles.includes(supplierRole)) {
      logger.warn('Supplier insufficient permissions', {
        supplierId: supplier.id,
        requiredRoles: allowedRoles,
        currentRole: supplierRole,
      });
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: `Required role: ${allowedRoles.join(' or ')}`,
        required: allowedRoles,
        current: supplierRole,
      });
    }

    next();
  };
}

/**
 * Generar JWT token para proveedor
 * Uso en login/signup
 */
export function generateSupplierToken(supplierId, email, expiresIn = '7d') {
  try {
    const token = jwt.sign(
      {
        supplierId,
        email,
        type: 'supplier',
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn }
    );

    return token;
  } catch (error) {
    logger.error('Error generating supplier token', {
      error: error.message,
      supplierId,
    });
    throw error;
  }
}

/**
 * Verificar y decodificar JWT token
 */
export function verifySupplierToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    logger.warn('Token verification failed', {
      error: error.message,
    });
    throw error;
  }
}

export default {
  requireSupplierAuth,
  verifySupplierId,
  requireSupplierRole,
  generateSupplierToken,
  verifySupplierToken,
};
