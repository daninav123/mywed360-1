// backend/routes/supplier-dashboard.js
// API completa para el Dashboard de Proveedores

import express from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../logger.js';

const router = express.Router();

const JWT_SECRET = process.env.SUPPLIER_JWT_SECRET || 'supplier-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

// ============================================
// MIDDLEWARE: Verificar token JWT de proveedor
// ============================================
const requireSupplierAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized', message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que el proveedor existe
    const supplierDoc = await db.collection('suppliers').doc(decoded.supplierId).get();
    if (!supplierDoc.exists) {
      return res.status(401).json({ error: 'supplier_not_found' });
    }

    req.supplier = {
      id: decoded.supplierId,
      data: supplierDoc.data(),
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'invalid_token' });
    }
    logger.error('Error in supplier auth middleware:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// ============================================
// AUTH: LOGIN
// ============================================
router.post('/auth/login', express.json(), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email_password_required' });
    }

    // Buscar proveedor por email
    const suppliersQuery = await db
      .collection('suppliers')
      .where('contact.email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (suppliersQuery.empty) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const supplierDoc = suppliersQuery.docs[0];
    const supplierData = supplierDoc.data();

    // Verificar contraseña
    // Nota: En el registro guardamos la contraseña hasheada
    if (!supplierData.auth?.passwordHash) {
      return res.status(401).json({
        error: 'password_not_set',
        message: 'Contraseña no configurada. Contacta soporte.',
      });
    }

    const passwordValid = await bcrypt.compare(password, supplierData.auth.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    // Verificar estado de la cuenta
    if (supplierData.profile?.status === 'suspended') {
      return res.status(403).json({ error: 'account_suspended' });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        supplierId: supplierDoc.id,
        email: email.toLowerCase(),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Actualizar última vez que inició sesión
    await supplierDoc.ref.update({
      lastLoginAt: FieldValue.serverTimestamp(),
    });

    return res.json({
      success: true,
      token,
      supplier: {
        id: supplierDoc.id,
        name: supplierData.profile?.name,
        email: email.toLowerCase(),
        category: supplierData.profile?.category,
        status: supplierData.profile?.status,
      },
    });
  } catch (error) {
    logger.error('Error in supplier login:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ============================================
// AUTH: VERIFY TOKEN
// ============================================
router.get('/auth/verify', requireSupplierAuth, async (req, res) => {
  return res.json({
    success: true,
    supplier: {
      id: req.supplier.id,
      name: req.supplier.data.profile?.name,
      email: req.supplier.data.contact?.email,
      category: req.supplier.data.profile?.category,
      status: req.supplier.data.profile?.status,
    },
  });
});

// ============================================
// AUTH: SET PASSWORD (primera vez o reset)
// ============================================
router.post('/auth/set-password', express.json(), async (req, res) => {
  try {
    const { email, verificationToken, newPassword } = req.body;

    if (!email || !verificationToken || !newPassword) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'password_too_short' });
    }

    // Buscar proveedor
    const suppliersQuery = await db
      .collection('suppliers')
      .where('contact.email', '==', email.toLowerCase())
      .where('verification.emailVerificationToken', '==', verificationToken)
      .limit(1)
      .get();

    if (suppliersQuery.empty) {
      return res.status(404).json({ error: 'invalid_token' });
    }

    const supplierDoc = suppliersQuery.docs[0];

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Guardar contraseña
    await supplierDoc.ref.update({
      'auth.passwordHash': passwordHash,
      'auth.passwordSetAt': FieldValue.serverTimestamp(),
      'verification.emailVerified': true,
      'verification.emailVerifiedAt': FieldValue.serverTimestamp(),
      'verification.emailVerificationToken': null,
      'profile.status': 'verified',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.json({
      success: true,
      message: 'Contraseña configurada correctamente',
    });
  } catch (error) {
    logger.error('Error setting password:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ============================================
// PROFILE: Ver perfil propio
// ============================================
router.get('/profile', requireSupplierAuth, async (req, res) => {
  return res.json({
    success: true,
    profile: req.supplier.data,
  });
});

// ============================================
// PROFILE: Actualizar perfil
// ============================================
router.put('/profile', requireSupplierAuth, express.json(), async (req, res) => {
  try {
    const updates = {};

    // Campos permitidos para actualizar
    if (req.body.description) updates['profile.description'] = req.body.description;
    if (req.body.phone) updates['contact.phone'] = req.body.phone;
    if (req.body.website) updates['contact.website'] = req.body.website;
    if (req.body.city) updates['location.city'] = req.body.city;
    if (req.body.province) updates['location.province'] = req.body.province;
    if (req.body.availability) updates['business.availability'] = req.body.availability;

    if (req.body.priceRange) {
      if (req.body.priceRange.min !== undefined) {
        updates['business.priceRange.min'] = Number(req.body.priceRange.min);
      }
      if (req.body.priceRange.max !== undefined) {
        updates['business.priceRange.max'] = Number(req.body.priceRange.max);
      }
    }

    updates.updatedAt = FieldValue.serverTimestamp();

    await db.collection('suppliers').doc(req.supplier.id).update(updates);

    return res.json({
      success: true,
      message: 'Perfil actualizado',
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ============================================
// REQUESTS: Listar solicitudes de presupuesto
// ============================================
router.get('/requests', requireSupplierAuth, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('requests')
      .orderBy('receivedAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(Number(limit)).offset(Number(offset)).get();

    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({
      success: true,
      requests,
      total: requests.length,
      hasMore: requests.length === Number(limit),
    });
  } catch (error) {
    logger.error('Error fetching requests:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ============================================
// REQUESTS: Ver detalle de solicitud
// ============================================
router.get('/requests/:requestId', requireSupplierAuth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const requestDoc = await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('requests')
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'request_not_found' });
    }

    // Marcar como visto si no lo estaba
    const requestData = requestDoc.data();
    if (requestData.status === 'new') {
      await requestDoc.ref.update({
        status: 'viewed',
        viewedAt: FieldValue.serverTimestamp(),
      });
    }

    return res.json({
      success: true,
      request: {
        id: requestDoc.id,
        ...requestData,
      },
    });
  } catch (error) {
    logger.error('Error fetching request detail:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ============================================
// REQUESTS: Responder a solicitud
// ============================================
router.post(
  '/requests/:requestId/respond',
  requireSupplierAuth,
  express.json(),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { message, quotedPrice, attachments } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'message_required' });
      }

      const requestRef = db
        .collection('suppliers')
        .doc(req.supplier.id)
        .collection('requests')
        .doc(requestId);

      const requestDoc = await requestRef.get();
      if (!requestDoc.exists) {
        return res.status(404).json({ error: 'request_not_found' });
      }

      const requestData = requestDoc.data();

      // Crear respuesta
      const response = {
        message,
        quotedPrice: quotedPrice || null,
        attachments: attachments || [],
        sentAt: FieldValue.serverTimestamp(),
        sentBy: req.supplier.id,
      };

      // Actualizar solicitud
      await requestRef.update({
        status: 'responded',
        respondedAt: FieldValue.serverTimestamp(),
        response,
      });

      // TODO: Enviar email a la pareja
      // await sendEmailToCouple(requestData.contactEmail, response);

      return res.json({
        success: true,
        message: 'Respuesta enviada correctamente',
      });
    } catch (error) {
      logger.error('Error responding to request:', error);
      return res.status(500).json({ error: 'internal_error' });
    }
  }
);

// ============================================
// REQUESTS: Archivar solicitud
// ============================================
router.post('/requests/:requestId/archive', requireSupplierAuth, async (req, res) => {
  try {
    const { requestId } = req.params;

    await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('requests')
      .doc(requestId)
      .update({
        status: 'archived',
        archivedAt: FieldValue.serverTimestamp(),
      });

    return res.json({
      success: true,
      message: 'Solicitud archivada',
    });
  } catch (error) {
    logger.error('Error archiving request:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ============================================
// ANALYTICS: Métricas del proveedor
// ============================================
router.get('/analytics', requireSupplierAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calcular fecha de inicio según el período
    const now = new Date();
    const startDate = new Date();
    if (period === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (period === '90d') {
      startDate.setDate(now.getDate() - 90);
    }

    // Obtener eventos de analítica
    const eventsSnapshot = await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('analytics')
      .doc('events')
      .collection('log')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .get();

    // Contar por tipo
    const metrics = {
      views: 0,
      clicks: 0,
      requests: 0,
    };

    eventsSnapshot.docs.forEach((doc) => {
      const event = doc.data();
      if (event.action === 'view') metrics.views++;
      if (event.action === 'click') metrics.clicks++;
      if (event.action === 'contact') metrics.clicks++;
    });

    // Contar solicitudes en el período
    const requestsSnapshot = await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('requests')
      .where('receivedAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .get();

    metrics.requests = requestsSnapshot.size;
    metrics.conversionRate =
      metrics.views > 0 ? ((metrics.requests / metrics.views) * 100).toFixed(2) : 0;

    return res.json({
      success: true,
      period,
      metrics,
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ============================================
// PORTFOLIO: Gestión de fotos
// ============================================

// GET /portfolio - Listar todas las fotos del proveedor
router.get('/portfolio', requireSupplierAuth, async (req, res) => {
  try {
    const { category, featured, limit = 50 } = req.query;

    let query = db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('portfolio')
      .orderBy('uploadedAt', 'desc');

    // Filtros opcionales
    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    if (featured === 'true') {
      query = query.where('featured', '==', true);
    }

    query = query.limit(parseInt(limit));

    const snapshot = await query.get();
    const photos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({
      success: true,
      photos,
      total: photos.length,
    });
  } catch (error) {
    logger.error('Error fetching portfolio:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /portfolio - Subir nueva foto
router.post('/portfolio', requireSupplierAuth, express.json(), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tags = [],
      featured = false,
      isCover = false,
      // URLs de las imágenes (ya subidas a Firebase Storage desde el frontend)
      original,
      thumbnails = {},
    } = req.body;

    // Validaciones
    if (!original) {
      return res.status(400).json({ error: 'original_url_required' });
    }

    if (!category) {
      return res.status(400).json({ error: 'category_required' });
    }

    // Si se marca como portada, desmarcar la anterior
    if (isCover) {
      const existingCoverQuery = await db
        .collection('suppliers')
        .doc(req.supplier.id)
        .collection('portfolio')
        .where('isCover', '==', true)
        .get();

      const batch = db.batch();
      existingCoverQuery.docs.forEach((doc) => {
        batch.update(doc.ref, { isCover: false });
      });
      await batch.commit();
    }

    // Crear nueva foto
    const photoData = {
      title: title || '',
      description: description || '',
      category,
      tags: Array.isArray(tags) ? tags : [],
      featured: Boolean(featured),
      isCover: Boolean(isCover),

      // URLs de imágenes
      original,
      thumbnails: {
        small: thumbnails.small || '',
        medium: thumbnails.medium || '',
        large: thumbnails.large || '',
      },

      // Analytics
      views: 0,
      likes: 0,

      // Timestamps
      uploadedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('portfolio')
      .add(photoData);

    logger.info(`Photo ${docRef.id} uploaded by supplier ${req.supplier.id}`);

    return res.json({
      success: true,
      photoId: docRef.id,
      photo: {
        id: docRef.id,
        ...photoData,
      },
    });
  } catch (error) {
    logger.error('Error uploading photo:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// PUT /portfolio/:photoId - Editar foto
router.put('/portfolio/:photoId', requireSupplierAuth, express.json(), async (req, res) => {
  try {
    const { photoId } = req.params;
    const { title, description, category, tags, featured, isCover } = req.body;

    const photoRef = db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('portfolio')
      .doc(photoId);

    const photoDoc = await photoRef.get();
    if (!photoDoc.exists) {
      return res.status(404).json({ error: 'photo_not_found' });
    }

    // Si se marca como portada, desmarcar la anterior
    if (isCover === true) {
      const existingCoverQuery = await db
        .collection('suppliers')
        .doc(req.supplier.id)
        .collection('portfolio')
        .where('isCover', '==', true)
        .get();

      const batch = db.batch();
      existingCoverQuery.docs.forEach((doc) => {
        if (doc.id !== photoId) {
          batch.update(doc.ref, { isCover: false });
        }
      });
      await batch.commit();
    }

    const updates = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
    if (featured !== undefined) updates.featured = Boolean(featured);
    if (isCover !== undefined) updates.isCover = Boolean(isCover);

    await photoRef.update(updates);

    logger.info(`Photo ${photoId} updated by supplier ${req.supplier.id}`);

    return res.json({
      success: true,
      photoId,
    });
  } catch (error) {
    logger.error('Error updating photo:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// DELETE /portfolio/:photoId - Eliminar foto
router.delete('/portfolio/:photoId', requireSupplierAuth, async (req, res) => {
  try {
    const { photoId } = req.params;

    const photoRef = db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('portfolio')
      .doc(photoId);

    const photoDoc = await photoRef.get();
    if (!photoDoc.exists) {
      return res.status(404).json({ error: 'photo_not_found' });
    }

    // Eliminar el documento
    await photoRef.delete();

    // Nota: Las imágenes en Firebase Storage deben eliminarse desde el frontend
    // o mediante un Cloud Function para evitar exponer las rutas de Storage

    logger.info(`Photo ${photoId} deleted by supplier ${req.supplier.id}`);

    return res.json({
      success: true,
      photoId,
    });
  } catch (error) {
    logger.error('Error deleting photo:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /portfolio/:photoId/view - Incrementar contador de vistas (público)
router.post('/portfolio/:photoId/view', express.json(), async (req, res) => {
  try {
    const { photoId } = req.params;
    const { supplierId } = req.body;

    if (!supplierId) {
      return res.status(400).json({ error: 'supplier_id_required' });
    }

    const photoRef = db
      .collection('suppliers')
      .doc(supplierId)
      .collection('portfolio')
      .doc(photoId);

    await photoRef.update({
      views: FieldValue.increment(1),
    });

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error incrementing photo view:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
