import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/authMiddleware.js';
import { sendSuccess, sendValidationError, sendInternalError } from '../utils/apiResponse.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/suppliers/wedding/:weddingId - Obtener todos los proveedores de una boda
router.get('/wedding/:weddingId', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;
    const userId = req.user.id;

    // Verificar acceso a la boda
    const access = await prisma.weddingAccess.findFirst({
      where: {
        weddingId,
        userId,
        status: 'active'
      }
    });

    if (!access) {
      return sendValidationError(req, res, 'No tienes acceso a esta boda', { code: 'no_access' });
    }

    // Obtener proveedores con sus líneas de servicio
    const suppliers = await prisma.weddingSupplier.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'desc' },
      include: {
        serviceLines: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return sendSuccess(req, res, suppliers);
  } catch (error) {
    console.error('[Suppliers API] Error loading suppliers:', error);
    return sendInternalError(req, res, 'Error al cargar proveedores');
  }
});

// POST /api/suppliers/wedding/:weddingId - Crear proveedor
router.post('/wedding/:weddingId', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;
    const userId = req.user.id;

    // Verificar acceso
    const access = await prisma.weddingAccess.findFirst({
      where: { weddingId, userId, status: 'active' }
    });

    if (!access) {
      return sendValidationError(req, res, 'No tienes acceso a esta boda');
    }

    const supplierData = req.body;

    const supplier = await prisma.weddingSupplier.create({
      data: {
        weddingId,
        name: supplierData.name,
        service: supplierData.service,
        contact: supplierData.contact,
        email: supplierData.email,
        phone: supplierData.phone,
        status: supplierData.status || 'Nuevo',
        date: supplierData.date ? new Date(supplierData.date) : null,
        rating: supplierData.rating || 0,
        ratingCount: supplierData.ratingCount || 0,
        snippet: supplierData.snippet,
        link: supplierData.link,
        image: supplierData.image,
        budget: supplierData.budget,
        priceRange: supplierData.priceRange,
        favorite: supplierData.favorite || false,
        notes: supplierData.notes,
        contractStatus: supplierData.contractStatus,
        budgetStatus: supplierData.budgetStatus,
        paymentSchedule: supplierData.paymentSchedule || [],
        reservations: supplierData.reservations || [],
        metadata: supplierData.metadata || {}
      },
      include: {
        serviceLines: true
      }
    });

    return sendSuccess(req, res, supplier);
  } catch (error) {
    console.error('[Suppliers API] Error creating supplier:', error);
    return sendInternalError(req, res, 'Error al crear proveedor');
  }
});

// PUT /api/suppliers/:supplierId - Actualizar proveedor
router.put('/:supplierId', requireAuth, async (req, res) => {
  try {
    const { supplierId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Verificar que el proveedor existe y el usuario tiene acceso
    const supplier = await prisma.weddingSupplier.findUnique({
      where: { id: supplierId },
      include: { wedding: { include: { access: true } } }
    });

    if (!supplier) {
      return sendValidationError(req, res, 'Proveedor no encontrado');
    }

    const hasAccess = supplier.wedding.access.some(
      a => a.userId === userId && a.status === 'active'
    );

    if (!hasAccess) {
      return sendValidationError(req, res, 'No tienes acceso a este proveedor');
    }

    // Actualizar
    const updated = await prisma.weddingSupplier.update({
      where: { id: supplierId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.service && { service: updates.service }),
        ...(updates.contact && { contact: updates.contact }),
        ...(updates.email && { email: updates.email }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.status && { status: updates.status }),
        ...(updates.date && { date: new Date(updates.date) }),
        ...(updates.rating !== undefined && { rating: updates.rating }),
        ...(updates.ratingCount !== undefined && { ratingCount: updates.ratingCount }),
        ...(updates.snippet && { snippet: updates.snippet }),
        ...(updates.link && { link: updates.link }),
        ...(updates.image && { image: updates.image }),
        ...(updates.budget !== undefined && { budget: updates.budget }),
        ...(updates.priceRange && { priceRange: updates.priceRange }),
        ...(updates.favorite !== undefined && { favorite: updates.favorite }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.contractStatus && { contractStatus: updates.contractStatus }),
        ...(updates.budgetStatus && { budgetStatus: updates.budgetStatus }),
        ...(updates.paymentSchedule && { paymentSchedule: updates.paymentSchedule }),
        ...(updates.reservations && { reservations: updates.reservations }),
        ...(updates.metadata && { metadata: updates.metadata })
      },
      include: {
        serviceLines: true
      }
    });

    return sendSuccess(req, res, updated);
  } catch (error) {
    console.error('[Suppliers API] Error updating supplier:', error);
    return sendInternalError(req, res, 'Error al actualizar proveedor');
  }
});

// DELETE /api/suppliers/:supplierId - Eliminar proveedor
router.delete('/:supplierId', requireAuth, async (req, res) => {
  try {
    const { supplierId } = req.params;
    const userId = req.user.id;

    // Verificar acceso
    const supplier = await prisma.weddingSupplier.findUnique({
      where: { id: supplierId },
      include: { wedding: { include: { access: true } } }
    });

    if (!supplier) {
      return sendValidationError(req, res, 'Proveedor no encontrado');
    }

    const hasAccess = supplier.wedding.access.some(
      a => a.userId === userId && a.status === 'active'
    );

    if (!hasAccess) {
      return sendValidationError(req, res, 'No tienes acceso');
    }

    await prisma.weddingSupplier.delete({
      where: { id: supplierId }
    });

    return sendSuccess(req, res, { deleted: true });
  } catch (error) {
    console.error('[Suppliers API] Error deleting supplier:', error);
    return sendInternalError(req, res, 'Error al eliminar proveedor');
  }
});

// Service Lines endpoints

// POST /api/suppliers/:supplierId/service-lines - Crear línea de servicio
router.post('/:supplierId/service-lines', requireAuth, async (req, res) => {
  try {
    const { supplierId } = req.params;
    const lineData = req.body;

    const serviceLine = await prisma.serviceLine.create({
      data: {
        supplierId,
        name: lineData.name,
        categoryKey: lineData.categoryKey,
        assignedBudget: lineData.assignedBudget || 0,
        status: lineData.status || 'Pendiente',
        notes: lineData.notes || '',
        deliverables: lineData.deliverables || [],
        milestones: lineData.milestones || []
      }
    });

    return sendSuccess(req, res, serviceLine);
  } catch (error) {
    console.error('[Suppliers API] Error creating service line:', error);
    return sendInternalError(req, res, 'Error al crear línea de servicio');
  }
});

// PUT /api/suppliers/:supplierId/service-lines/:lineId - Actualizar línea
router.put('/:supplierId/service-lines/:lineId', requireAuth, async (req, res) => {
  try {
    const { lineId } = req.params;
    const updates = req.body;

    const updated = await prisma.serviceLine.update({
      where: { id: lineId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.categoryKey && { categoryKey: updates.categoryKey }),
        ...(updates.assignedBudget !== undefined && { assignedBudget: updates.assignedBudget }),
        ...(updates.status && { status: updates.status }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.deliverables && { deliverables: updates.deliverables }),
        ...(updates.milestones && { milestones: updates.milestones })
      }
    });

    return sendSuccess(req, res, updated);
  } catch (error) {
    console.error('[Suppliers API] Error updating service line:', error);
    return sendInternalError(req, res, 'Error al actualizar línea');
  }
});

// DELETE /api/suppliers/:supplierId/service-lines/:lineId - Eliminar línea
router.delete('/:supplierId/service-lines/:lineId', requireAuth, async (req, res) => {
  try {
    const { lineId } = req.params;

    await prisma.serviceLine.delete({
      where: { id: lineId }
    });

    return sendSuccess(req, res, { deleted: true });
  } catch (error) {
    console.error('[Suppliers API] Error deleting service line:', error);
    return sendInternalError(req, res, 'Error al eliminar línea');
  }
});

export default router;
