/**
 * API Routes: Admin Quote Requests
 *
 * Rutas para gestionar solicitudes de presupuesto desde el panel de admin
 */

import express from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/admin/quote-requests
 * Obtener todas las solicitudes de presupuesto (vista admin)
 */
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { supplierId, weddingId, status, limit = 100 } = req.query;

    let query = db.collection('quoteRequests');

    // Filtros opcionales
    if (supplierId) {
      query = query.where('supplierId', '==', supplierId);
    }
    if (weddingId) {
      query = query.where('weddingId', '==', weddingId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    // Ordenar por fecha de creación (más recientes primero)
    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));

    const snapshot = await query.get();

    const requests = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Enriquecer con información adicional
      let supplierName = data.supplierInfo?.name || 'Desconocido';
      let weddingOwner = 'Desconocido';

      // Obtener nombre del proveedor si no está en supplierInfo
      if (!data.supplierInfo?.name && data.supplierId) {
        try {
          const supplierDoc = await db.collection('suppliers').doc(data.supplierId).get();
          if (supplierDoc.exists) {
            const supplierData = supplierDoc.data();
            supplierName = supplierData.name || supplierData.profile?.name || 'Desconocido';
          }
        } catch (err) {
          console.error(`Error obteniendo proveedor ${data.supplierId}:`, err);
        }
      }

      // Obtener información de la boda
      if (data.weddingId) {
        try {
          const weddingDoc = await db.collection('weddings').doc(data.weddingId).get();
          if (weddingDoc.exists) {
            const weddingData = weddingDoc.data();
            weddingOwner =
              weddingData.owners?.[0] || weddingData.couple?.partner1?.name || 'Desconocido';
          }
        } catch (err) {
          console.error(`Error obteniendo boda ${data.weddingId}:`, err);
        }
      }

      requests.push({
        id: doc.id,
        ...data,
        enriched: {
          supplierName,
          weddingOwner,
        },
      });
    }

    console.log(`📋 [admin-quote-requests] ${requests.length} solicitudes encontradas`);

    res.json({
      success: true,
      requests,
      count: requests.length,
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
    const snapshot = await db.collection('quoteRequests').get();

    const stats = {
      total: snapshot.size,
      byStatus: {
        pending: 0,
        quoted: 0,
        accepted: 0,
        rejected: 0,
        cancelled: 0,
      },
      byCategory: {},
      recent: 0, // Últimas 24 horas
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Contar por status
      if (data.status && stats.byStatus.hasOwnProperty(data.status)) {
        stats.byStatus[data.status]++;
      }

      // Contar por categoría
      if (data.category) {
        stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;
      }

      // Contar recientes
      if (data.createdAt) {
        const createdDate = new Date(data.createdAt);
        if (createdDate > oneDayAgo) {
          stats.recent++;
        }
      }
    });

    console.log(`📊 [admin-quote-requests] Estadísticas generadas`);

    res.json({
      success: true,
      stats,
    });
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

    // Agregar metadata de actualización
    updateData.updatedAt = new Date().toISOString();
    updateData.updatedBy = req.user.uid;
    updateData.updatedByAdmin = true;

    await db.collection('quoteRequests').doc(id).update(updateData);

    console.log(`✅ [admin-quote-requests] Solicitud ${id} actualizada por admin`);

    res.json({
      success: true,
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

    await db.collection('quoteRequests').doc(id).delete();

    console.log(`🗑️ [admin-quote-requests] Solicitud ${id} eliminada por admin`);

    res.json({
      success: true,
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
