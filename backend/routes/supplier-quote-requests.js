import express from 'express';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../logger.js';

const router = express.Router();

/**
 * POST /api/suppliers/:id/quote-requests
 * 💰 Sistema Inteligente V2 - Solicitar presupuesto con templates dinámicos
 * NO requiere autenticación (público)
 */
router.post('/:id/quote-requests', express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { weddingInfo, contacto, proveedor, serviceDetails, customMessage, userId, weddingId } =
      req.body;

    // Validaciones del nuevo formato
    if (!contacto || !contacto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto.email)) {
      return res.status(400).json({ error: 'invalid_email' });
    }

    if (!contacto.nombre || contacto.nombre.trim().length < 2) {
      return res.status(400).json({ error: 'name_required' });
    }

    // Verificar que el proveedor existe
    const supplierDoc = await db.collection('suppliers').doc(id).get();
    if (!supplierDoc.exists) {
      return res.status(404).json({ error: 'supplier_not_found' });
    }

    const supplier = supplierDoc.data();

    // 🤖 Crear solicitud de presupuesto con nuevo formato
    const quoteRequestData = {
      // Info del proveedor
      supplierId: id,
      supplierName: supplier.profile?.name || supplier.name || 'Proveedor',
      supplierEmail: supplier.contact?.email || null,
      supplierCategory: proveedor?.category || null,
      supplierCategoryName: proveedor?.categoryName || null,

      // Info de la boda (automática)
      weddingInfo: {
        fecha: weddingInfo?.fecha || null,
        ciudad: weddingInfo?.ciudad || null,
        numeroInvitados: weddingInfo?.numeroInvitados || null,
        presupuestoTotal: weddingInfo?.presupuestoTotal || null,
      },

      // Info de contacto del cliente
      contacto: {
        nombre: contacto.nombre.trim(),
        email: contacto.email.trim().toLowerCase(),
        telefono: contacto.telefono || null,
      },

      // 🎯 Detalles del servicio (dinámico por categoría)
      serviceDetails: serviceDetails || {},

      // Mensaje personalizado
      customMessage: customMessage || '',

      // Estado
      status: 'pending', // pending, contacted, quoted, accepted, rejected

      // Metadata
      source: 'intelligent_quote_system_v2',
      userId: userId || null,
      weddingId: weddingId || null,
      viewed: false,
      viewedAt: null,
      respondedAt: null,

      // Timestamps
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Guardar en la subcolección del proveedor
    const docRef = await db
      .collection('suppliers')
      .doc(id)
      .collection('quote-requests')
      .add(quoteRequestData);

    logger.info(
      `✅ Nueva solicitud presupuesto V2: ${docRef.id} para proveedor ${id} (${proveedor?.categoryName || 'sin categoría'})`
    );

    // TODO: Enviar email de notificación al proveedor con template específico
    // sendQuoteRequestEmailV2(supplier.contact.email, quoteRequestData);

    // Incrementar contador de solicitudes (analytics)
    try {
      await db
        .collection('suppliers')
        .doc(id)
        .update({
          'metrics.quote_requests': FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
    } catch (err) {
      logger.warn('Error updating supplier quote_requests counter:', err);
    }

    return res.status(201).json({
      success: true,
      requestId: docRef.id,
      message:
        'Solicitud enviada correctamente. El proveedor se pondrá en contacto contigo pronto.',
    });
  } catch (error) {
    logger.error('Error creating quote request:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * GET /api/suppliers/:id/quote-requests
 * Obtener solicitudes de presupuesto (solo para el proveedor autenticado)
 * Requiere autenticación de proveedor
 */
router.get('/:id/quote-requests', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, status, viewed } = req.query;

    // Validar autenticación del proveedor
    // TODO: Implementar middleware de auth
    const supplierId = req.headers['x-supplier-id'];
    if (!supplierId || supplierId !== id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    let query = db
      .collection('suppliers')
      .doc(id)
      .collection('quote-requests')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    // Filtros opcionales
    if (status) {
      query = query.where('status', '==', status);
    }

    if (viewed !== undefined) {
      query = query.where('viewed', '==', viewed === 'true');
    }

    const snapshot = await query.get();

    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({
      success: true,
      requests,
      total: requests.length,
    });
  } catch (error) {
    logger.error('Error fetching quote requests:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * PUT /api/suppliers/:id/quote-requests/:requestId/status
 * Actualizar estado de solicitud (solo proveedor)
 * Requiere autenticación de proveedor
 */
router.put('/:id/quote-requests/:requestId/status', express.json(), async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const { status, notes } = req.body;

    // Validar autenticación del proveedor
    const supplierId = req.headers['x-supplier-id'];
    if (!supplierId || supplierId !== id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const validStatuses = ['pending', 'contacted', 'quoted', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'invalid_status' });
    }

    const requestRef = db
      .collection('suppliers')
      .doc(id)
      .collection('quote-requests')
      .doc(requestId);

    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'request_not_found' });
    }

    const updates = {
      status,
      viewed: true,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!requestDoc.data().viewedAt) {
      updates.viewedAt = FieldValue.serverTimestamp();
    }

    if (status !== 'pending' && !requestDoc.data().respondedAt) {
      updates.respondedAt = FieldValue.serverTimestamp();
    }

    if (notes) {
      updates.notes = notes.trim();
    }

    await requestRef.update(updates);

    logger.info(`Solicitud ${requestId} actualizada a estado: ${status}`);

    return res.json({
      success: true,
      message: 'Estado actualizado correctamente',
    });
  } catch (error) {
    logger.error('Error updating quote request status:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * GET /api/suppliers/:id/quote-requests/stats
 * Obtener estadísticas de solicitudes (solo proveedor)
 * Requiere autenticación de proveedor
 */
router.get('/:id/quote-requests/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Validar autenticación del proveedor
    const supplierId = req.headers['x-supplier-id'];
    if (!supplierId || supplierId !== id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const snapshot = await db.collection('suppliers').doc(id).collection('quote-requests').get();

    const requests = snapshot.docs.map((doc) => doc.data());

    const stats = {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      contacted: requests.filter((r) => r.status === 'contacted').length,
      quoted: requests.filter((r) => r.status === 'quoted').length,
      accepted: requests.filter((r) => r.status === 'accepted').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
      unviewed: requests.filter((r) => !r.viewed).length,
      conversionRate:
        requests.length > 0
          ? (
              (requests.filter((r) => r.status === 'accepted').length / requests.length) *
              100
            ).toFixed(1)
          : 0,
    };

    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Error fetching quote request stats:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
