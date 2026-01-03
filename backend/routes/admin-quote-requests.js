/**
 * API Routes: Admin Quote Requests
 *
 * Rutas para gestionar solicitudes de presupuesto desde el panel de admin
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import {
  sendSuccess,
  sendInternalError,
} from '../utils/apiResponse.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/quote-requests
 * Obtener todas las solicitudes de presupuesto (vista admin)
 */
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { supplierId, weddingId, status, limit = 100 } = req.query;

    const where = {};
    if (supplierId) where.supplierId = supplierId;
    if (weddingId) where.weddingId = weddingId;
    if (status) where.status = status;

    const requests = await prisma.quoteRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        // No incluir relaciones por ahora para simplificar
      },
    });

    // Enriquecer con información de supplier y wedding si es necesario
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        let supplierName = request.supplierInfo?.name || 'Desconocido';
        let weddingOwner = 'Desconocido';

        if (request.supplierId && !request.supplierInfo?.name) {
          try {
            const supplier = await prisma.supplier.findUnique({
              where: { id: request.supplierId },
            });
            if (supplier) {
              supplierName = supplier.businessName || 'Desconocido';
            }
          } catch (err) {
            console.error(`Error obteniendo proveedor ${request.supplierId}:`, err);
          }
        }

        if (request.weddingId) {
          try {
            const wedding = await prisma.wedding.findUnique({
              where: { id: request.weddingId },
            });
            if (wedding) {
              weddingOwner = wedding.coupleName || 'Desconocido';
            }
          } catch (err) {
            console.error(`Error obteniendo boda ${request.weddingId}:`, err);
          }
        }

        return {
          ...request,
          enriched: {
            supplierName,
            weddingOwner,
          },
        };
      })
    );

    console.log(`📋 [admin-quote-requests] ${enrichedRequests.length} solicitudes encontradas`);

    return sendSuccess(req, res, {
      requests: enrichedRequests,
      count: enrichedRequests.length,
    });
  } catch (error) {
    console.error('[admin-quote-requests] Error obteniendo solicitudes:', error);
    res.status(500).json({
      error: 'Error al obtener solicitudes',
      details: error.message,
    });
  }
});

/**
 * GET /api/admin/quote-requests/stats
 * Obtener estadísticas de solicitudes de presupuesto
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const allRequests = await prisma.quoteRequest.findMany();

    const stats = {
      total: allRequests.length,
      byStatus: {
        pending: 0,
        quoted: 0,
        accepted: 0,
        rejected: 0,
        cancelled: 0,
      },
      byCategory: {},
      recent: 0,
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    allRequests.forEach((request) => {
      // Contar por status
      if (request.status && stats.byStatus.hasOwnProperty(request.status)) {
        stats.byStatus[request.status]++;
      }

      // Contar por categoría
      if (request.category) {
        stats.byCategory[request.category] = (stats.byCategory[request.category] || 0) + 1;
      }

      // Contar recientes
      if (request.createdAt && request.createdAt > oneDayAgo) {
        stats.recent++;
      }
    });

    console.log(`📊 [admin-quote-requests] Estadísticas generadas`);

    return sendSuccess(req, res, { stats });
  } catch (error) {
    console.error('[admin-quote-requests] Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message,
    });
  }
});

/**
 * PATCH /api/admin/quote-requests/:id
 * Actualizar cualquier campo de una solicitud (admin override)
 */
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Agregar metadata en el campo metadata JSON
    const metadata = {
      ...(updateData.metadata || {}),
      updatedBy: req.user.uid,
      updatedByAdmin: true,
      lastAdminUpdate: new Date().toISOString(),
    };

    await prisma.quoteRequest.update({
      where: { id },
      data: {
        ...updateData,
        metadata,
      },
    });

    console.log(`✅ [admin-quote-requests] Solicitud ${id} actualizada por admin`);

    return sendSuccess(req, res, {
      message: 'Solicitud actualizada correctamente',
    });
  } catch (error) {
    console.error('[admin-quote-requests] Error actualizando solicitud:', error);
    res.status(500).json({
      error: 'Error al actualizar solicitud',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/admin/quote-requests/:id
 * Eliminar permanentemente una solicitud (solo admin)
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.quoteRequest.delete({
      where: { id },
    });

    console.log(`🗑️ [admin-quote-requests] Solicitud ${id} eliminada por admin`);

    return sendSuccess(req, res, {
      message: 'Solicitud eliminada permanentemente',
    });
  } catch (error) {
    console.error('[admin-quote-requests] Error eliminando solicitud:', error);
    res.status(500).json({
      error: 'Error al eliminar solicitud',
      details: error.message,
    });
  }
});

export default router;
