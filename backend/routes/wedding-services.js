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
 * Asignar un proveedor a un servicio (soporta múltiples proveedores)
 */
router.post('/weddings/:weddingId/services/:serviceId/assign', requireAuth, async (req, res) => {
  try {
    const { weddingId, serviceId } = req.params;
    const { supplier, price, currency, notes, status, serviceDescription, deposit } = req.body;
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
    const newProvider = {
      id: Date.now().toString(), // ID único para este proveedor dentro del servicio
      supplierId: supplier.id,
      name: supplier.name,
      serviceDescription: serviceDescription || '', // ej: "Alianzas", "Anillo compromiso"
      contact: {
        email: supplier.contact?.email || supplier.email || null,
        phone: supplier.contact?.phone || supplier.phone || null,
        website: supplier.contact?.website || supplier.website || null,
      },
      status: status || 'interesado', // interesado, cotizando, contratado, confirmado, pagado
      price: price || null,
      currency: currency || 'EUR',
      notes: notes || '',
      
      // Información de adelantos/depósitos
      deposit: deposit || null, // { percentage: 30, amount: 360, dueDate: '2025-03-01' }
      
      assignedAt: new Date().toISOString(),
      contractedAt: null,
      confirmedAt: null,
      paidAt: null,
      payments: [],
      totalPaid: 0,
      remaining: price || 0,
      isPrimary: false, // Se marcará como primario si es el primero
    };

    // Actualizar servicio
    const serviceRef = weddingRef.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();

    let assignedSuppliers = [];
    
    if (serviceDoc.exists) {
      const serviceData = serviceDoc.data();
      
      // Migrar de assignedSupplier (singular) a assignedSuppliers (plural)
      if (serviceData.assignedSupplier && !serviceData.assignedSuppliers) {
        assignedSuppliers = [{
          ...serviceData.assignedSupplier,
          id: Date.now().toString() + '_migrated',
          isPrimary: true,
          serviceDescription: serviceData.assignedSupplier.notes || '',
        }];
      } else {
        assignedSuppliers = serviceData.assignedSuppliers || [];
      }
      
      // Marcar como primario si es el primer proveedor
      if (assignedSuppliers.length === 0) {
        newProvider.isPrimary = true;
      }
      
      // Añadir nuevo proveedor
      assignedSuppliers.push(newProvider);
      
      // Actualizar servicio existente
      await serviceRef.update({
        assignedSuppliers,
        // Mantener compatibilidad con código antiguo: assignedSupplier apunta al primario
        assignedSupplier: assignedSuppliers.find(p => p.isPrimary) || assignedSuppliers[0],
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Crear servicio nuevo
      newProvider.isPrimary = true;
      assignedSuppliers = [newProvider];
      
      await serviceRef.set({
        category: serviceId,
        name: serviceId.charAt(0).toUpperCase() + serviceId.slice(1),
        assignedSuppliers,
        assignedSupplier: newProvider, // Compatibilidad
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
        assignedSuppliers,
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
 * DELETE /api/weddings/:weddingId/services/:serviceId/suppliers/:providerId
 * Quitar un proveedor específico de un servicio
 */
router.delete(
  '/weddings/:weddingId/services/:serviceId/suppliers/:providerId',
  requireAuth,
  async (req, res) => {
    try {
      const { weddingId, serviceId, providerId } = req.params;
      const userId = req.user.uid;

      const weddingRef = db.collection('users').doc(userId).collection('weddings').doc(weddingId);
      const serviceRef = weddingRef.collection('services').doc(serviceId);

      const serviceDoc = await serviceRef.get();
      if (!serviceDoc.exists) {
        return res.status(404).json({ error: 'Servicio no encontrado' });
      }

      const serviceData = serviceDoc.data();
      let assignedSuppliers = serviceData.assignedSuppliers || [];
      
      // Filtrar el proveedor a eliminar
      const remainingSuppliers = assignedSuppliers.filter(p => p.id !== providerId);
      
      // Si eliminamos el primario, hacer primario al siguiente
      if (remainingSuppliers.length > 0) {
        const hadPrimary = assignedSuppliers.find(p => p.id === providerId)?.isPrimary;
        if (hadPrimary && !remainingSuppliers.some(p => p.isPrimary)) {
          remainingSuppliers[0].isPrimary = true;
        }
      }

      await serviceRef.update({
        assignedSuppliers: remainingSuppliers,
        assignedSupplier: remainingSuppliers.length > 0 ? remainingSuppliers[0] : null,
        updatedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Proveedor eliminado del servicio',
        remainingCount: remainingSuppliers.length,
      });
    } catch (error) {
      console.error('Error removing assigned supplier:', error);
      res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
  }
);

/**
 * PATCH /api/weddings/:weddingId/services/:serviceId/suppliers/:providerId/primary
 * Marcar un proveedor como primario
 */
router.patch(
  '/weddings/:weddingId/services/:serviceId/suppliers/:providerId/primary',
  requireAuth,
  async (req, res) => {
    try {
      const { weddingId, serviceId, providerId } = req.params;
      const userId = req.user.uid;

      const weddingRef = db.collection('users').doc(userId).collection('weddings').doc(weddingId);
      const serviceRef = weddingRef.collection('services').doc(serviceId);

      const serviceDoc = await serviceRef.get();
      if (!serviceDoc.exists) {
        return res.status(404).json({ error: 'Servicio no encontrado' });
      }

      const serviceData = serviceDoc.data();
      let assignedSuppliers = serviceData.assignedSuppliers || [];
      
      // Quitar isPrimary de todos y añadirlo solo al seleccionado
      assignedSuppliers = assignedSuppliers.map(p => ({
        ...p,
        isPrimary: p.id === providerId,
      }));

      await serviceRef.update({
        assignedSuppliers,
        assignedSupplier: assignedSuppliers.find(p => p.isPrimary),
        updatedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Proveedor marcado como primario',
      });
    } catch (error) {
      console.error('Error setting primary supplier:', error);
      res.status(500).json({ error: 'Error al marcar proveedor como primario' });
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

/**
 * POST /api/weddings/:weddingId/services/:serviceId/link
 * Vincular servicios cuando son del mismo proveedor
 */
router.post('/weddings/:weddingId/services/:serviceId/link', requireAuth, async (req, res) => {
  try {
    const { weddingId, serviceId } = req.params;
    const { linkedServices } = req.body; // Array de IDs de servicios a vincular
    const userId = req.user.uid;

    if (!linkedServices || !Array.isArray(linkedServices)) {
      return res.status(400).json({ error: 'linkedServices debe ser un array' });
    }

    // Verificar acceso a la boda
    const weddingRef = db.collection('users').doc(userId).collection('weddings').doc(weddingId);
    const weddingDoc = await weddingRef.get();

    if (!weddingDoc.exists) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    // Actualizar el servicio principal para agregar linkedServices
    const serviceRef = weddingRef.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();

    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Actualizar servicio principal
    await serviceRef.update({
      linkedServices: linkedServices,
      updatedAt: new Date().toISOString(),
    });

    // Marcar los servicios vinculados como \"linkedTo\"
    const updatePromises = linkedServices.map((linkedId) => {
      const linkedRef = weddingRef.collection('services').doc(linkedId);
      return linkedRef.update({
        linkedTo: serviceId,
        updatedAt: new Date().toISOString(),
      });
    });
    await Promise.all(updatePromises);

    res.json({ success: true, linkedServices });
  } catch (error) {
    console.error('Error vinculando servicios:', error);
    res.status(500).json({ error: 'Error al vincular servicios' });
  }
});

/**
 * DELETE /api/weddings/:weddingId/services/:serviceId/link
 * Desvincular servicios
 */
router.delete('/weddings/:weddingId/services/:serviceId/link', requireAuth, async (req, res) => {
  try {
    const { weddingId, serviceId } = req.params;
    const userId = req.user.uid;

    // Verificar acceso a la boda
    const weddingRef = db.collection('users').doc(userId).collection('weddings').doc(weddingId);
    const weddingDoc = await weddingRef.get();

    if (!weddingDoc.exists) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    // Obtener el servicio para ver qué servicios tiene vinculados
    const serviceRef = weddingRef.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();

    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const linkedServices = serviceDoc.data().linkedServices || [];

    // Limpiar linkedServices del servicio principal
    await serviceRef.update({
      linkedServices: [],
      updatedAt: new Date().toISOString(),
    });

    // Limpiar linkedTo de los servicios vinculados
    const updatePromises = linkedServices.map((linkedId) => {
      const linkedRef = weddingRef.collection('services').doc(linkedId);
      return linkedRef.update({
        linkedTo: null,
        updatedAt: new Date().toISOString(),
      });
    });
    await Promise.all(updatePromises);

    res.json({ success: true });
  } catch (error) {
    console.error('Error desvinculando servicios:', error);
    res.status(500).json({ error: 'Error al desvincular servicios' });
  }
});

export default router;
