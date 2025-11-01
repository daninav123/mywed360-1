/**
 * API para gestión de servicios de boda y asignación de proveedores
 */

import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/weddings/:weddingId/services
 * Obtener todos los servicios de una boda
 */
router.get('/weddings/:weddingId/services', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;
    const userId = req.user.uid;

    // Verificar acceso a la boda
    const weddingRef = db.collection('users').doc(userId).collection('weddings').doc(weddingId);
    const weddingDoc = await weddingRef.get();

    if (!weddingDoc.exists) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    // Obtener servicios
    const servicesRef = weddingRef.collection('services');
    const snapshot = await servicesRef.get();

    const services = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ services });
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

/**
 * POST /api/weddings/:weddingId/services/assign
 * Asignar proveedor desde comparador de presupuestos (sin serviceId previo)
 */
router.post('/weddings/:weddingId/services/assign', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { category, categoryKey, supplier, quote, notes, status, requestId } = req.body;
    const userId = req.user.uid;

    // Validaciones
    if (!category || !supplier || !supplier.id) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Verificar acceso a la boda
    const weddingRef = db.collection('users').doc(userId).collection('weddings').doc(weddingId);
    const weddingDoc = await weddingRef.get();

    if (!weddingDoc.exists) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    // ID del servicio basado en categoryKey
    const serviceId = categoryKey || category.toLowerCase().replace(/\s+/g, '-');

    // Preparar datos del proveedor asignado
    const assignedSupplier = {
      supplierId: supplier.id,
      name: supplier.name,
      email: supplier.email,
      contact: {
        email: supplier.email || null,
        phone: supplier.phone || null,
      },
      status: status || 'contracted',

      // Datos del quote seleccionado
      quote: {
        quoteId: quote?.quoteId || null,
        pricing: quote?.pricing || null,
        serviceOffered: quote?.serviceOffered || null,
        terms: quote?.terms || null,
        message: quote?.message || null,
      },

      price: quote?.pricing?.total || null,
      currency: 'EUR',
      notes: notes || '',
      requestId: requestId || null,

      assignedAt: new Date().toISOString(),
      contractedAt: new Date().toISOString(),
      confirmedAt: null,
      paidAt: null,

      payments: [],
      totalPaid: 0,
      remaining: quote?.pricing?.total || 0,
    };

    // Actualizar o crear servicio
    const serviceRef = weddingRef.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();

    if (serviceDoc.exists) {
      // Actualizar servicio existente
      await serviceRef.update({
        assignedSupplier,
        category: categoryKey || serviceId,
        name: category,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Crear servicio nuevo
      await serviceRef.set({
        category: categoryKey || serviceId,
        name: category,
        assignedSupplier,
        candidates: [],
        priority: 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log(
      `✅ Proveedor ${supplier.name} asignado a servicio ${category} en boda ${weddingId}`
    );

    res.json({
      success: true,
      message: 'Proveedor contratado correctamente',
      service: {
        id: serviceId,
        category,
        assignedSupplier,
      },
    });
  } catch (error) {
    console.error('Error assigning supplier from quote:', error);
    res.status(500).json({ error: 'Error al contratar proveedor' });
  }
});

/**
 * POST /api/weddings/:weddingId/services/:serviceId/assign
 * Asignar un proveedor a un servicio existente (legacy)
 */
router.post('/weddings/:weddingId/services/:serviceId/assign', requireAuth, async (req, res) => {
  try {
    const { weddingId, serviceId } = req.params;
    const { supplier, price, currency, notes, status } = req.body;
    const userId = req.user.uid;

    // Validaciones
    if (!supplier || !supplier.id) {
      return res.status(400).json({ error: 'Proveedor requerido' });
    }

    // Verificar acceso a la boda
    const weddingRef = db.collection('users').doc(userId).collection('weddings').doc(weddingId);
    const weddingDoc = await weddingRef.get();

    if (!weddingDoc.exists) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    // Preparar datos del proveedor asignado
    const assignedSupplier = {
      supplierId: supplier.id,
      name: supplier.name,
      contact: {
        email: supplier.contact?.email || supplier.email || null,
        phone: supplier.contact?.phone || supplier.phone || null,
        website: supplier.contact?.website || supplier.website || null,
      },
      status: status || 'interesado', // interesado, cotizando, contratado, confirmado, pagado
      price: price || null,
      currency: currency || 'EUR',
      notes: notes || '',
      assignedAt: new Date().toISOString(),
      contractedAt: null,
      confirmedAt: null,
      paidAt: null,
      payments: [],
      totalPaid: 0,
      remaining: price || 0,
    };

    // Actualizar servicio
    const serviceRef = weddingRef.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();

    if (serviceDoc.exists) {
      // Actualizar servicio existente
      await serviceRef.update({
        assignedSupplier,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Crear servicio nuevo
      await serviceRef.set({
        category: serviceId,
        name: serviceId.charAt(0).toUpperCase() + serviceId.slice(1),
        assignedSupplier,
        candidates: [],
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'Proveedor asignado correctamente',
      service: {
        id: serviceId,
        assignedSupplier,
      },
    });
  } catch (error) {
    console.error('Error assigning supplier:', error);
    res.status(500).json({ error: 'Error al asignar proveedor' });
  }
});

/**
 * PUT /api/weddings/:weddingId/services/:serviceId/status
 * Actualizar estado del servicio (interesado → cotizando → contratado → confirmado → pagado)
 */
router.put('/weddings/:weddingId/services/:serviceId/status', requireAuth, async (req, res) => {
  try {
    const { weddingId, serviceId } = req.params;
    const { status } = req.body;
    const userId = req.user.uid;

    const validStatuses = ['interesado', 'cotizando', 'contratado', 'confirmado', 'pagado'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const weddingRef = db.collection('users').doc(userId).collection('weddings').doc(weddingId);
    const serviceRef = weddingRef.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();

    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const updateData = {
      'assignedSupplier.status': status,
      updatedAt: new Date().toISOString(),
    };

    // Actualizar fechas según estado
    if (status === 'contratado') {
      updateData['assignedSupplier.contractedAt'] = new Date().toISOString();
    } else if (status === 'confirmado') {
      updateData['assignedSupplier.confirmedAt'] = new Date().toISOString();
    } else if (status === 'pagado') {
      updateData['assignedSupplier.paidAt'] = new Date().toISOString();
    }

    await serviceRef.update(updateData);

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      status,
    });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

/**
 * DELETE /api/weddings/:weddingId/services/:serviceId/assigned
 * Quitar proveedor asignado de un servicio
 */
router.delete(
  '/weddings/:weddingId/services/:serviceId/assigned',
  requireAuth,
  async (req, res) => {
    try {
      const { weddingId, serviceId } = req.params;
      const userId = req.user.uid;

      const weddingRef = db.collection('users').doc(userId).collection('weddings').doc(weddingId);
      const serviceRef = weddingRef.collection('services').doc(serviceId);

      const serviceDoc = await serviceRef.get();
      if (!serviceDoc.exists) {
        return res.status(404).json({ error: 'Servicio no encontrado' });
      }

      await serviceRef.update({
        assignedSupplier: null,
        updatedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Proveedor eliminado del servicio',
      });
    } catch (error) {
      console.error('Error removing assigned supplier:', error);
      res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
  }
);

/**
 * POST /api/weddings/:weddingId/services/:serviceId/payments
 * Registrar un pago para el servicio
 */
router.post('/weddings/:weddingId/services/:serviceId/payments', requireAuth, async (req, res) => {
  try {
    const { weddingId, serviceId } = req.params;
    const { amount, concept, method, date } = req.body;
    const userId = req.user.uid;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Cantidad no válida' });
    }

    const weddingRef = db.collection('users').doc(userId).collection('weddings').doc(weddingId);
    const serviceRef = weddingRef.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();

    if (!serviceDoc.exists || !serviceDoc.data().assignedSupplier) {
      return res.status(404).json({ error: 'Servicio no encontrado o sin proveedor asignado' });
    }

    const payment = {
      amount,
      concept: concept || 'Pago',
      method: method || 'transferencia',
      date: date || new Date().toISOString(),
      registeredAt: new Date().toISOString(),
    };

    const serviceData = serviceDoc.data();
    const currentPayments = serviceData.assignedSupplier.payments || [];
    const newPayments = [...currentPayments, payment];
    const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
    const servicePrice = serviceData.assignedSupplier.price || 0;
    const remaining = Math.max(0, servicePrice - totalPaid);

    await serviceRef.update({
      'assignedSupplier.payments': newPayments,
      'assignedSupplier.totalPaid': totalPaid,
      'assignedSupplier.remaining': remaining,
      updatedAt: new Date().toISOString(),
    });

    // Si está completamente pagado, actualizar estado
    if (remaining === 0 && serviceData.assignedSupplier.status !== 'pagado') {
      await serviceRef.update({
        'assignedSupplier.status': 'pagado',
        'assignedSupplier.paidAt': new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'Pago registrado correctamente',
      payment,
      totalPaid,
      remaining,
    });
  } catch (error) {
    console.error('Error registering payment:', error);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});

export default router;
