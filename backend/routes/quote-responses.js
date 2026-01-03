/**
 * 📊 Rutas para gestionar respuestas de presupuestos
 * Presupuestos enviados por proveedores automáticamente procesados por IA
 */

import express from 'express';
import { db } from '../db.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Construye actualizaciones de InfoBoda según la categoría del proveedor aceptado
 */
function buildInfoBodaUpdates(categoryKey, supplierData) {
  const updates = {};
  
  switch (categoryKey) {
    case 'lugares':
      updates.celebrationPlace = supplierData.venueName || supplierData.name;
      updates.celebrationAddress = supplierData.address;
      updates.celebrationCity = supplierData.city;
      updates.ceremonyGPS = supplierData.gps;
      updates.venueManagerName = supplierData.managerName || supplierData.contactName;
      updates.venueManagerPhone = supplierData.contactPhone || supplierData.phone;
      updates._celebrationPlaceSource = 'supplier-confirmed';
      updates._celebrationPlaceSupplierId = supplierData.supplierId;
      break;
      
    case 'restaurantes':
      updates.celebrationPlace = supplierData.name;
      updates.celebrationAddress = supplierData.address;
      updates.celebrationCity = supplierData.city;
      updates.banquetPlace = supplierData.name;
      updates.receptionAddress = supplierData.address;
      updates.venueManagerName = supplierData.contactName;
      updates.venueManagerPhone = supplierData.contactPhone || supplierData.phone;
      updates._banquetPlaceSource = 'supplier-confirmed';
      break;
      
    case 'catering':
      updates.cateringContact = supplierData.contactPhone || supplierData.phone;
      if (supplierData.menuDescription) {
        updates.menu = supplierData.menuDescription;
      }
      updates._cateringSource = 'supplier-confirmed';
      updates._cateringSupplierId = supplierData.supplierId;
      break;
      
    case 'fotografia':
      updates.photographerContact = supplierData.contactPhone || supplierData.phone;
      updates._photographerSource = 'supplier-confirmed';
      updates._photographerSupplierId = supplierData.supplierId;
      break;
      
    case 'musica-ceremonia':
    case 'musica-cocktail':
    case 'musica-fiesta':
    case 'dj':
      updates.musicContact = supplierData.contactPhone || supplierData.phone;
      updates[`_${categoryKey}Source`] = 'supplier-confirmed';
      break;
      
    case 'organizacion':
      updates.coordinatorName = supplierData.contactName || supplierData.name;
      updates.coordinatorPhone = supplierData.contactPhone || supplierData.phone;
      updates._coordinatorSource = 'supplier-confirmed';
      updates._coordinatorSupplierId = supplierData.supplierId;
      break;
  }
  
  // Añadir metadata de actualización
  if (Object.keys(updates).length > 0) {
    updates._lastUpdateSource = 'supplier-acceptance';
    updates._lastUpdateCategory = categoryKey;
    updates._lastUpdateSupplierName = supplierData.name;
    updates._lastUpdateTimestamp = Date.now();
  }
  
  return updates;
}

/**
 * GET /api/quote-responses
 * Listar presupuestos recibidos (filtrable por usuario/boda)
 */
router.get('/', express.json(), async (req, res) => {
  try {
    const { userId, weddingId, supplierId, status } = req.query;

    let query = db.collection('quote-responses');

    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (weddingId) {
      query = query.where('weddingId', '==', weddingId);
    }
    if (supplierId) {
      query = query.where('supplierId', '==', supplierId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();

    const responses = [];
    snapshot.forEach((doc) => {
      responses.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.json({
      success: true,
      count: responses.length,
      responses,
    });
  } catch (error) {
    logger.error('[quote-responses] Error listando presupuestos:', error);
    return res.status(500).json({
      success: false,
      error: 'internal_error',
    });
  }
});

/**
 * GET /api/quote-responses/:id
 * Obtener detalles de un presupuesto específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('quote-responses').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
      });
    }

    return res.json({
      success: true,
      response: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    logger.error('[quote-responses] Error obteniendo presupuesto:', error);
    return res.status(500).json({
      success: false,
      error: 'internal_error',
    });
  }
});

/**
 * PATCH /api/quote-responses/:id/status
 * Actualizar estado de un presupuesto (accepted, rejected, etc.)
 */
router.patch('/:id/status', express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['received', 'reviewed', 'accepted', 'rejected', 'negotiating'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'invalid_status',
      });
    }

    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (notes) {
      updateData.statusNotes = notes;
    }

    if (status === 'accepted') {
      updateData.acceptedAt = new Date().toISOString();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date().toISOString();
    }

    await db.collection('quote-responses').doc(id).update(updateData);

    return res.json({
      success: true,
      message: 'Estado actualizado',
    });
  } catch (error) {
    logger.error('[quote-responses] Error actualizando estado:', error);
    return res.status(500).json({
      success: false,
      error: 'internal_error',
    });
  }
});

/**
 * GET /api/quote-responses/request/:requestId
 * Obtener presupuestos para una solicitud específica
 */
router.get('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    const snapshot = await db
      .collection('quote-responses')
      .where('requestId', '==', requestId)
      .orderBy('createdAt', 'desc')
      .get();

    const responses = [];
    snapshot.forEach((doc) => {
      responses.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.json({
      success: true,
      count: responses.length,
      responses,
    });
  } catch (error) {
    logger.error('[quote-responses] Error obteniendo presupuestos por solicitud:', error);
    return res.status(500).json({
      success: false,
      error: 'internal_error',
    });
  }
});

/**
 * POST /api/quote-responses/:id/accept
 * Aceptar un presupuesto y añadir proveedor a la boda
 * Soporta múltiples proveedores por categoría
 */
router.post('/:id/accept', express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      role = 'principal', // principal, complementary, backup
      notes = '',
      notifyProvider = true 
    } = req.body;

    logger.info(`[quote-responses] Aceptando presupuesto ${id} con rol: ${role}`);

    // 1. Obtener el presupuesto
    const quoteDoc = await db.collection('quote-responses').doc(id).get();
    
    if (!quoteDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found',
      });
    }

    const quote = quoteDoc.data();
    const { weddingId, categoryKey, supplierId, supplierName, totalPrice } = quote;

    if (!weddingId) {
      return res.status(400).json({
        success: false,
        error: 'Quote has no associated wedding',
      });
    }

    // 2. Obtener la boda
    const weddingRef = db.collection('weddings').doc(weddingId);
    const weddingDoc = await weddingRef.get();

    if (!weddingDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Wedding not found',
      });
    }

    const wedding = weddingDoc.data();

    // 3. Actualizar estado del presupuesto a 'accepted'
    await db.collection('quote-responses').doc(id).update({
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedRole: role,
      acceptedNotes: notes,
      updatedAt: new Date(),
    });

    // 4. Gestionar proveedores en la categoría
    const currentServices = wedding.services || {};
    const categoryService = currentServices[categoryKey] || {
      suppliers: [],
      status: 'pending',
      totalBudget: 0,
    };

    let suppliers = Array.isArray(categoryService.suppliers) 
      ? categoryService.suppliers 
      : [];

    // Verificar si ya existe este proveedor
    const existingIndex = suppliers.findIndex(
      s => s.supplierId === supplierId
    );

    const newSupplierData = {
      supplierId: supplierId,
      supplierName: supplierName,
      supplierEmail: quote.supplierEmail || '',
      role: role,
      quoteId: id,
      totalPrice: totalPrice || 0,
      servicesIncluded: quote.servicesIncluded || [],
      paymentTerms: quote.paymentTerms || null,
      deliveryTime: quote.deliveryTime || null,
      contractedAt: new Date(),
      status: 'active',
      notes: notes,
    };

    if (existingIndex >= 0) {
      // Ya existe → actualizar
      suppliers[existingIndex] = {
        ...suppliers[existingIndex],
        ...newSupplierData,
        updatedAt: new Date(),
      };
      logger.info(`[quote-responses] Proveedor actualizado en posición ${existingIndex}`);
    } else {
      // Nuevo proveedor → añadir
      suppliers.push(newSupplierData);
      logger.info(`[quote-responses] Nuevo proveedor añadido`);
    }

    // Si el rol es 'principal' y hay otro principal, cambiar el anterior
    if (role === 'principal') {
      suppliers = suppliers.map(s => {
        if (s.supplierId !== supplierId && s.role === 'principal') {
          logger.info(`[quote-responses] Cambiando rol de ${s.supplierName} a 'backup'`);
          return { ...s, role: 'backup', updatedAt: new Date() };
        }
        return s;
      });
    }

    // 5. Calcular total de la categoría
    const totalCategoryBudget = suppliers
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.totalPrice || 0), 0);

    // 6. Actualizar wedding.services
    const updatedServices = {
      ...currentServices,
      [categoryKey]: {
        categoryName: quote.categoryName || categoryKey,
        status: 'contracted',
        suppliers: suppliers,
        totalBudget: totalCategoryBudget,
        lastUpdated: new Date(),
      },
    };

    // 7. Actualizar presupuesto de la boda
    const currentBudget = wedding.budget || { total: 0, spent: 0, allocated: {} };
    const previousAllocated = currentBudget.allocated?.[categoryKey] || 0;
    const budgetDifference = totalCategoryBudget - previousAllocated;

    const updatedBudget = {
      ...currentBudget,
      spent: (currentBudget.spent || 0) + budgetDifference,
      remaining: (currentBudget.total || 0) - ((currentBudget.spent || 0) + budgetDifference),
      allocated: {
        ...(currentBudget.allocated || {}),
        [categoryKey]: totalCategoryBudget,
      },
    };

    // 8. Preparar datos del proveedor para propagación a InfoBoda
    const supplierDataForPropagation = {
      name: supplierName,
      supplierId: supplierId,
      contactPhone: quote.contactPhone || quote.supplierPhone || '',
      contactName: quote.contactName || supplierName,
      address: quote.venueAddress || quote.address || '',
      city: quote.city || '',
      gps: quote.venueGPS || quote.gps || '',
      venueName: quote.venueName || supplierName,
      menuDescription: quote.menuDescription || '',
      phone: quote.contactPhone || quote.supplierPhone || '',
      managerName: quote.managerName || quote.contactName || '',
    };

    // 8.1. Actualizar campos de InfoBoda según categoría (PROPAGACIÓN AUTOMÁTICA)
    const infoBodaUpdates = buildInfoBodaUpdates(categoryKey, supplierDataForPropagation);

    // 8.2. Guardar cambios en la boda (incluyendo propagación a InfoBoda)
    await weddingRef.update({
      services: updatedServices,
      budget: updatedBudget,
      ...infoBodaUpdates,
      updatedAt: new Date(),
    });

    logger.info(`[quote-responses] ✅ Boda actualizada - Total categoría: ${totalCategoryBudget}€`);
    logger.info(`[quote-responses] ✅ InfoBoda actualizada - Campos: ${Object.keys(infoBodaUpdates).join(', ')}`);

    // 9. Notificar al proveedor (si está habilitado)
    if (notifyProvider && quote.supplierEmail) {
      try {
        // TODO: Implementar envío de email
        logger.info(`[quote-responses] Notificación pendiente para: ${quote.supplierEmail}`);
      } catch (emailError) {
        logger.error('[quote-responses] Error enviando notificación:', emailError);
        // No fallar la operación principal por error de email
      }
    }

    // 10. Retornar respuesta exitosa
    return res.json({
      success: true,
      message: 'Presupuesto aceptado exitosamente',
      data: {
        quoteId: id,
        supplierId: supplierId,
        supplierName: supplierName,
        role: role,
        categoryKey: categoryKey,
        totalCategoryBudget: totalCategoryBudget,
        suppliers: suppliers,
        budgetStatus: {
          spent: updatedBudget.spent,
          remaining: updatedBudget.remaining,
          overBudget: updatedBudget.remaining < 0,
        },
      },
    });

  } catch (error) {
    logger.error('[quote-responses] Error aceptando presupuesto:', error);
    return res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message,
    });
  }
});

/**
 * POST /api/quote-responses/:id/cancel-provider
 * Cancelar/desactivar un proveedor contratado
 */
router.post('/:id/cancel-provider', express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;

    logger.info(`[quote-responses] Cancelando proveedor del presupuesto ${id}`);

    // Obtener el presupuesto
    const quoteDoc = await db.collection('quote-responses').doc(id).get();
    
    if (!quoteDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found',
      });
    }

    const quote = quoteDoc.data();
    const { weddingId, categoryKey, supplierId } = quote;

    // Obtener la boda
    const weddingRef = db.collection('weddings').doc(weddingId);
    const weddingDoc = await weddingRef.get();

    if (!weddingDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Wedding not found',
      });
    }

    const wedding = weddingDoc.data();
    const categoryService = wedding.services?.[categoryKey];

    if (!categoryService || !Array.isArray(categoryService.suppliers)) {
      return res.status(404).json({
        success: false,
        error: 'Category service not found',
      });
    }

    // Marcar proveedor como cancelado
    const updatedSuppliers = categoryService.suppliers.map(s => {
      if (s.supplierId === supplierId && s.quoteId === id) {
        return {
          ...s,
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: reason,
        };
      }
      return s;
    });

    // Recalcular total (solo activos)
    const totalCategoryBudget = updatedSuppliers
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.totalPrice || 0), 0);

    // Actualizar wedding
    await weddingRef.update({
      [`services.${categoryKey}.suppliers`]: updatedSuppliers,
      [`services.${categoryKey}.totalBudget`]: totalCategoryBudget,
      [`services.${categoryKey}.lastUpdated`]: new Date(),
      [`budget.allocated.${categoryKey}`]: totalCategoryBudget,
    });

    // Actualizar estado del presupuesto
    await db.collection('quote-responses').doc(id).update({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason,
    });

    return res.json({
      success: true,
      message: 'Proveedor cancelado exitosamente',
      data: {
        totalCategoryBudget,
        remainingSuppliers: updatedSuppliers.filter(s => s.status === 'active').length,
      },
    });

  } catch (error) {
    logger.error('[quote-responses] Error cancelando proveedor:', error);
    return res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message,
    });
  }
});

export default router;
