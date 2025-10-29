import express from 'express';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../logger.js';

const router = express.Router();

/**
 * POST /api/suppliers/:id/quote-requests
 * Solicitar presupuesto a un proveedor
 * NO requiere autenticación (público)
 */
router.post('/:id/quote-requests', express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, weddingDate, location, guestCount, budget, message, serviceType } =
      req.body;

    // Validaciones
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'name_required' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'invalid_email' });
    }

    if (!message || message.trim().length < 10) {
      return res.status(400).json({ error: 'message_too_short' });
    }

    // Verificar que el proveedor existe
    const supplierDoc = await db.collection('suppliers').doc(id).get();
    if (!supplierDoc.exists) {
      return res.status(404).json({ error: 'supplier_not_found' });
    }

    const supplier = supplierDoc.data();

    // Crear solicitud de presupuesto
    const quoteRequestData = {
      supplierId: id,
      supplierName: supplier.profile?.name || supplier.name || 'Proveedor',
      supplierEmail: supplier.contact?.email || null,

      // Datos del cliente
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,

      // Datos del evento
      weddingDate: weddingDate || null,
      location: location || null,
      guestCount: guestCount ? parseInt(guestCount) : null,
      budget: budget || null,
      serviceType: serviceType || null,

      // Mensaje
      message: message.trim(),

      // Estado
      status: 'pending', // pending, contacted, quoted, accepted, rejected

      // Metadata
      source: 'public_page',
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

    logger.info(`Nueva solicitud de presupuesto: ${docRef.id} para proveedor ${id}`);

    // TODO: Enviar email de notificación al proveedor
    // sendQuoteRequestEmail(supplier.contact.email, quoteRequestData);

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
