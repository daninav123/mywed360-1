/**
 * API Routes: Quote Requests (Solicitudes de Presupuesto)
 *
 * Gestiona las solicitudes de presupuesto entre owners y proveedores
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/authMiddleware.js';
import { sendQuoteRequestEmail } from '../services/quoteRequestEmailService.js';
import logger from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/quote-requests
 * Crear nueva solicitud de presupuesto
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      weddingId,
      supplierId,
      category,
      message,
      requestedServices,
      eventDate,
      guestCount,
      budget,
      contact,
    } = req.body;

    // Validaciones básicas
    if (!weddingId || !supplierId || !category) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: weddingId, supplierId, category',
      });
    }

    // Verificar que la boda existe
    const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
    if (!wedding) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    // Verificar que el proveedor existe
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Crear la solicitud en PostgreSQL
    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        weddingId,
        userId: req.user.uid,
        supplierId,
        category,
        service: requestedServices?.join(', ') || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        guestCount: guestCount || null,
        budget: budget || null,
        description: message || null,
        contactName: contact?.name || 'Sin nombre',
        contactEmail: contact?.email || '',
        contactPhone: contact?.phone || null,
        status: 'pending',
        supplierEmail: supplier.email,
        supplierInfo: {
          name: supplier.businessName,
          email: supplier.email,
          category: supplier.category,
        },
        metadata: {
          requestedServices: requestedServices || [],
          contact: contact || {},
        },
      },
    });

    console.log(`✅ [quote-requests] Nueva solicitud creada: ${quoteRequest.id}`);
    console.log(`   Proveedor: ${supplier.businessName}`);
    console.log(`   Categoría: ${category}`);

    // Enviar notificación y email al proveedor (sin bloquear la respuesta)
    const supplierEmail = supplier.email;
    if (supplierEmail) {
      setImmediate(async () => {
        try {
          // 1. Crear notificación en PostgreSQL para el proveedor
          await prisma.notification.create({
            data: {
              userId: supplierId,
              type: 'quote_request',
              title: 'Nueva solicitud de presupuesto',
              message: `Has recibido una solicitud de presupuesto para ${category}`,
              data: {
                quoteRequestId: quoteRequest.id,
                weddingId,
                category,
                guestCount,
                eventDate,
              },
              read: false,
            },
          });

          logger.info(
            `✅ [quote-requests] Notificación creada para proveedor: ${supplier.businessName}`
          );

          // 2. Enviar email al proveedor
          try {
            await sendQuoteRequestEmail({
              supplierEmail,
              supplierName: supplier.businessName || 'Proveedor',
              clientName: contact?.name || 'Cliente',
              clientEmail: contact?.email || 'No especificado',
              clientPhone: contact?.phone || null,
              weddingDate: eventDate || null,
              city: location?.city || null,
              guestCount: guestCount || null,
              totalBudget: budget?.max || budget?.min || null,
              categoryName: category || 'Servicio',
              serviceDetails: {},
              customMessage: message || '',
              responseUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/supplier/requests`,
              requestId: quoteRequest.id,
              userId: req.user.uid,
            });

            logger.info(
              `📧 [quote-requests] Email enviado a ${supplierEmail} para solicitud ${quoteRequest.id}`
            );
          } catch (emailError) {
            logger.error('[quote-requests] Error enviando email al proveedor:', emailError);
            // No fallar si el email falla
          }
        } catch (notifError) {
          logger.error('[quote-requests] Error creando notificación:', notifError);
        }
      });
    } else {
      logger.warn(`⚠️  [quote-requests] Proveedor ${supplierId} no tiene email configurado`);
    }

    res.status(201).json({
      success: true,
      requestId: quoteRequest.id,
      message: 'Solicitud de presupuesto enviada correctamente',
    });
  } catch (error) {
    console.error('[quote-requests] Error creando solicitud:', error);
    res.status(500).json({
      error: 'Error al crear solicitud de presupuesto',
      details: error.message,
    });
  }
});

router.post('/cancel-provider', requireAuth, express.json(), async (req, res) => {
  try {
    const userId = req.user.uid;
    const { supplierId, supplierEmail } = req.body || {};

    if (!supplierId && !supplierEmail) {
      return res.status(400).json({ error: 'supplierId o supplierEmail requerido' });
    }

    const updates = {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: userId,
      updatedAt: new Date().toISOString(),
    };

    const result = {
      supplierId: supplierId || null,
      supplierEmail: supplierEmail || null,
      cancelled: 0,
      skipped: 0,
      errors: 0,
    };

    const updateDocs = async (snapshot) => {
      for (const doc of snapshot.docs) {
        try {
          const data = doc.data() || {};
          const ownerUid = data.userId || data.createdBy || data.ownerUid;
          if (ownerUid && ownerUid !== userId) {
            result.skipped++;
            continue;
          }
          await doc.ref.update(updates);
          result.cancelled++;
        } catch (e) {
          result.errors++;
        }
      }
    };

    if (supplierId) {
      const snap1 = await db
        .collection('suppliers')
        .doc(supplierId)
        .collection('quote-requests')
        .get();
      await updateDocs(snap1);

      const snap2 = await db
        .collection('suppliers')
        .doc(supplierId)
        .collection('requests')
        .get();
      await updateDocs(snap2);

      const snap3 = await db
        .collection('quoteRequests')
        .where('supplierId', '==', supplierId)
        .get();
      await updateDocs(snap3);
    }

    if (supplierEmail) {
      const emailLower = String(supplierEmail).toLowerCase();

      const snap4 = await db
        .collection('quote-requests-internet')
        .where('userId', '==', userId)
        .where('supplierEmail', '==', emailLower)
        .get();
      await updateDocs(snap4);

      const snap5 = await db
        .collection('quote-requests-internet')
        .where('userId', '==', userId)
        .where('supplierInfo.email', '==', emailLower)
        .get();
      await updateDocs(snap5);
    }

    console.log('✅ [quote-requests] cancel-provider result:', result);
    return res.json({ success: true, result });
  } catch (error) {
    console.error('[quote-requests] Error cancelando proveedor:', error);
    return res.status(500).json({ error: 'Error al cancelar proveedor', details: error.message });
  }
});

/**
 * GET /api/quote-requests
 * Obtener solicitudes del usuario actual
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { weddingId, status } = req.query;

    const where = {};
    
    if (weddingId) {
      where.weddingId = weddingId;
    }
    
    if (status) {
      where.status = status;
    }

    const requests = await prisma.quoteRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📋 [quote-requests] ${requests.length} solicitudes encontradas`);

    res.json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('[quote-requests] Error obteniendo solicitudes:', error);
    res.status(500).json({
      error: 'Error al obtener solicitudes',
      details: error.message,
    });
  }
});

/**
 * GET /api/quote-requests/:id
 * Obtener detalles de una solicitud específica
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.quoteRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json({
      success: true,
      request,
    });
  } catch (error) {
    console.error('[quote-requests] Error obteniendo solicitud:', error);
    res.status(500).json({
      error: 'Error al obtener solicitud',
      details: error.message,
    });
  }
});

/**
 * PATCH /api/quote-requests/:id/status
 * Actualizar el estado de una solicitud
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'quoted', 'accepted', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`,
      });
    }

    const updateData = {
      status,
      metadata: notes ? { notes } : undefined,
    };

    if (status === 'quoted') {
      updateData.respondedAt = new Date();
    } else if (status === 'accepted') {
      updateData.respondedAt = new Date();
    } else if (status === 'rejected') {
      updateData.respondedAt = new Date();
    }

    await prisma.quoteRequest.update({
      where: { id },
      data: updateData,
    });

    console.log(`✅ [quote-requests] Solicitud ${id} actualizada a: ${status}`);

    res.json({
      success: true,
      message: `Solicitud actualizada a ${status}`,
    });
  } catch (error) {
    console.error('[quote-requests] Error actualizando estado:', error);
    res.status(500).json({
      error: 'Error al actualizar estado',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/quote-requests/:id
 * Cancelar/eliminar una solicitud
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ [quote-requests] Cancelando solicitud ${id}`);

    // Buscar en PostgreSQL
    const request = await prisma.quoteRequest.findUnique({
      where: { id },
    });
    
    if (request) {
      if (request.userId && request.userId !== req.user.uid) {
        return res.status(403).json({
          error: 'No autorizado para cancelar esta solicitud',
        });
      }

      await prisma.quoteRequest.update({
        where: { id },
        data: {
          status: 'cancelled',
        },
      });

      console.log(`✅ [quote-requests] Solicitud ${id} cancelada`);

      return res.json({
        success: true,
        message: 'Solicitud cancelada',
      });
    }

    // Si no se encontró
    console.warn(`⚠️ [quote-requests] Solicitud ${id} no encontrada`);
    return res.status(404).json({
      error: 'Solicitud no encontrada',
    });

  } catch (error) {
    console.error('[quote-requests] Error cancelando solicitud:', error);
    res.status(500).json({
      error: 'Error al cancelar solicitud',
      details: error.message,
    });
  }
});

export default router;
