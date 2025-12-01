// backend/routes/supplier-dashboard.js
// API completa para el Dashboard de Proveedores

import express from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import multer from 'multer';
import { notifyNewQuoteRequest, notifyNewReview } from '../services/supplierNotifications.js';

const router = express.Router();

// LOG DE CARGA DEL MÓDULO - ACTUALIZADO CON BUCKET CORRECTO
logger.info('[supplier-dashboard] Módulo cargado', {
  timestamp: new Date().toISOString(),
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'lovenda-98c77.firebasestorage.app',
});

// Log TODAS las peticiones que lleguen a este router
router.use((req, res, next) => {
  logger.debug(`[supplier-dashboard] ${req.method} ${req.path}`);
  next();
});

// Configurar multer para uploads en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
    }
  },
});

const JWT_SECRET = process.env.SUPPLIER_JWT_SECRET || 'supplier-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

// ============================================
// MIDDLEWARE: Verificar token JWT de proveedor
// ============================================
const requireSupplierAuth = async (req, res, next) => {
  try {
    logger.info(`[requireSupplierAuth] Checking auth for ${req.method} ${req.path}`);
    const authHeader = req.headers.authorization;
    logger.info(
      `[requireSupplierAuth] Authorization header: ${authHeader ? authHeader.substring(0, 20) + '...' : 'NONE'}`
    );

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('[requireSupplierAuth] No authorization header');
      return res.status(401).json({ error: 'unauthorized', message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      logger.warn('[requireSupplierAuth] Invalid token value');
      return res.status(401).json({ error: 'unauthorized', message: 'Token inválido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que el proveedor existe
    const supplierDoc = await db.collection('suppliers').doc(decoded.supplierId).get();
    if (!supplierDoc.exists) {
      logger.warn(`[requireSupplierAuth] Supplier not found: ${decoded.supplierId}`);
      return res.status(401).json({ error: 'supplier_not_found' });
    }

    req.supplier = {
      id: decoded.supplierId,
      data: supplierDoc.data(),
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      logger.warn('[requireSupplierAuth] JWT error:', error.message);
      return res.status(401).json({ error: 'invalid_token', message: error.message });
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
// PORTFOLIO: Gestión de fotos (DEBE ESTAR ANTES DE /:id)
// ============================================

// GET /portfolio - Listar todas las fotos del proveedor
router.get('/portfolio', requireSupplierAuth, async (req, res) => {
  try {
    logger.info(`[GET /portfolio] Handler ejecutándose para supplier: ${req.supplier?.id}`);
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

    // Ejecutar query
    const snapshot = await query.limit(Number(limit)).get();

    const photos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({ success: true, photos });
  } catch (error) {
    logger.error('Error listing portfolio:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ============================================
// DASHBOARD: Obtener datos completos del dashboard (por ID)
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    // Verificar token y obtener datos del proveedor
    const supplierDoc = await db.collection('suppliers').doc(id).get();

    if (!supplierDoc.exists) {
      return res.status(404).json({ error: 'supplier_not_found' });
    }

    const supplierData = supplierDoc.data();

    // Obtener métricas básicas
    const metrics = {
      views: supplierData.stats?.views || 0,
      clicks: supplierData.stats?.clicks || 0,
      contacts: supplierData.stats?.contacts || 0,
      matchScore: supplierData.matchScore || 0,
    };

    return res.json({
      success: true,
      profile: supplierData,
      metrics: metrics,
    });
  } catch (error) {
    logger.error('Error loading dashboard:', error);
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

// GET /analytics/chart - Datos históricos para gráficos
router.get('/analytics/chart', requireSupplierAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calcular rango de fechas
    const now = new Date();
    const startDate = new Date();
    let days = 30;

    if (period === '7d') {
      days = 7;
      startDate.setDate(now.getDate() - 7);
    } else if (period === '30d') {
      days = 30;
      startDate.setDate(now.getDate() - 30);
    } else if (period === '90d') {
      days = 90;
      startDate.setDate(now.getDate() - 90);
    }

    // Inicializar datos por día
    const dataByDay = {};
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dataByDay[dateKey] = {
        date: dateKey,
        views: 0,
        clicks: 0,
        requests: 0,
      };
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

    eventsSnapshot.docs.forEach((doc) => {
      const event = doc.data();
      if (!event.timestamp) return;

      const eventDate = event.timestamp.toDate().toISOString().split('T')[0];
      if (dataByDay[eventDate]) {
        if (event.action === 'view') dataByDay[eventDate].views++;
        if (event.action === 'click' || event.action === 'contact') dataByDay[eventDate].clicks++;
      }
    });

    // Obtener solicitudes
    const requestsSnapshot = await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('requests')
      .where('receivedAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .get();

    requestsSnapshot.docs.forEach((doc) => {
      const request = doc.data();
      if (!request.receivedAt) return;

      const requestDate = request.receivedAt.toDate().toISOString().split('T')[0];
      if (dataByDay[requestDate]) {
        dataByDay[requestDate].requests++;
      }
    });

    // Convertir a array y ordenar por fecha
    const chartData = Object.values(dataByDay).sort((a, b) => a.date.localeCompare(b.date));

    return res.json({
      success: true,
      period,
      data: chartData,
    });
  } catch (error) {
    logger.error('Error fetching chart data:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /portfolio/upload - Subir nueva foto con archivo
router.post('/portfolio/upload', requireSupplierAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'no_file_uploaded' });
    }

    const {
      title = '',
      description = '',
      category,
      tags = '[]',
      featured = 'false',
      isCover = 'false',
    } = req.body;

    // Validaciones
    if (!category) {
      return res.status(400).json({ error: 'category_required' });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = req.file.originalname.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${extension}`;

    // Subir a Firebase Storage usando Admin SDK (sin CORS)
    // Firebase ahora usa .firebasestorage.app como bucket por defecto
    const bucketName =
      process.env.VITE_FIREBASE_STORAGE_BUCKET || 'lovenda-98c77.firebasestorage.app';
    logger.info(`[upload] Usando bucket: ${bucketName}`);
    const bucket = admin.storage().bucket(bucketName);
    const storagePath = `suppliers/${req.supplier.id}/portfolio/${fileName}`;
    const file = bucket.file(storagePath);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    // Hacer el archivo público
    await file.makePublic();

    // Obtener URL pública
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Si se marca como portada, desmarcar la anterior
    const isActualCover = isCover === 'true' || isCover === true;
    if (isActualCover) {
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

    // Parsear tags si viene como string JSON
    let parsedTags = [];
    try {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch (e) {
      parsedTags =
        typeof tags === 'string'
          ? tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [];
    }

    // Crear nueva foto en Firestore
    const photoData = {
      title,
      description,
      category,
      tags: Array.isArray(parsedTags) ? parsedTags : [],
      featured: featured === 'true' || featured === true,
      isCover: isActualCover,

      // URLs de imágenes (por ahora sin thumbnails, se pueden generar después)
      original: downloadURL,
      thumbnails: {
        small: downloadURL,
        medium: downloadURL,
        large: downloadURL,
      },
      storagePath, // Guardar para poder eliminar después

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
    logger.error('Error uploading portfolio photo:', error);
    return res.status(500).json({ error: 'upload_failed', message: error.message });
  }
});

// POST /portfolio - Subir nueva foto (legacy, espera URLs ya subidas)
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

// ============================================
// REVIEWS: Sistema de Reseñas
// ============================================

// GET /reviews - Listar reseñas del proveedor
router.get('/reviews', requireSupplierAuth, async (req, res) => {
  try {
    const { status = 'all', limit = 50, offset = 0 } = req.query;

    let query = db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('reviews')
      .orderBy('createdAt', 'desc');

    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(Number(limit)).offset(Number(offset)).get();

    const reviews = [];
    for (const doc of snapshot.docs) {
      const reviewData = doc.data();

      // Obtener datos del cliente si existe userId
      let clientData = null;
      if (reviewData.userId) {
        try {
          const userDoc = await db.collection('users').doc(reviewData.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            clientData = {
              name: userData.name || userData.displayName || 'Cliente',
              email: userData.email,
            };
          }
        } catch (err) {
          logger.warn(`Could not fetch user data for review ${doc.id}`);
        }
      }

      reviews.push({
        id: doc.id,
        ...reviewData,
        client: clientData || { name: reviewData.clientName || 'Anónimo' },
      });
    }

    return res.json({ success: true, reviews });
  } catch (error) {
    logger.error('Error listing reviews:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// GET /reviews/stats - Estadísticas de reseñas
router.get('/reviews/stats', requireSupplierAuth, async (req, res) => {
  try {
    const reviewsRef = db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('reviews')
      .where('status', '==', 'published');

    const snapshot = await reviewsRef.get();

    let totalRating = 0;
    let count = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    snapshot.forEach((doc) => {
      const review = doc.data();
      if (review.rating) {
        totalRating += review.rating;
        count++;
        ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
      }
    });

    const averageRating = count > 0 ? (totalRating / count).toFixed(1) : 0;

    return res.json({
      success: true,
      stats: {
        averageRating: parseFloat(averageRating),
        totalReviews: count,
        distribution: ratingDistribution,
      },
    });
  } catch (error) {
    logger.error('Error getting review stats:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /reviews/:reviewId/respond - Responder a una reseña
router.post('/reviews/:reviewId/respond', requireSupplierAuth, express.json(), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ error: 'response_required' });
    }

    const reviewRef = db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('reviews')
      .doc(reviewId);

    const reviewDoc = await reviewRef.get();
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'review_not_found' });
    }

    await reviewRef.update({
      supplierResponse: response.trim(),
      respondedAt: FieldValue.serverTimestamp(),
    });

    // TODO: Enviar notificación al cliente
    logger.info(`Supplier ${req.supplier.id} responded to review ${reviewId}`);

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error responding to review:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /reviews/:reviewId/report - Reportar reseña inapropiada
router.post('/reviews/:reviewId/report', requireSupplierAuth, express.json(), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'reason_required' });
    }

    const reviewRef = db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('reviews')
      .doc(reviewId);

    const reviewDoc = await reviewRef.get();
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'review_not_found' });
    }

    await reviewRef.update({
      reported: true,
      reportReason: reason.trim(),
      reportedAt: FieldValue.serverTimestamp(),
      status: 'under_review',
    });

    logger.info(`Supplier ${req.supplier.id} reported review ${reviewId}: ${reason}`);

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error reporting review:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Exportar middleware para uso en otros módulos
export { requireSupplierAuth };

export default router;
