/**
 * API Routes: Quote Requests (Solicitudes de Presupuesto)
 *
 * Gestiona las solicitudes de presupuesto entre owners y proveedores
 */

import express from 'express';
import { db } from '../db.js';
import { FieldPath } from 'firebase-admin/firestore';
import { requireAuth } from '../middleware/authMiddleware.js';
import { sendQuoteRequestEmail } from '../services/quoteRequestEmailService.js';
import logger from '../utils/logger.js';

const router = express.Router();

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
    const weddingDoc = await db.collection('weddings').doc(weddingId).get();
    if (!weddingDoc.exists) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    // Verificar que el proveedor existe
    const supplierDoc = await db.collection('suppliers').doc(supplierId).get();
    if (!supplierDoc.exists) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const supplierData = supplierDoc.data();

    // Crear la solicitud
    const quoteRequest = {
      weddingId,
      supplierId,
      category,
      message: message || '',
      requestedServices: requestedServices || [],
      eventDate: eventDate || null,
      guestCount: guestCount || null,
      budget: budget || null,
      contact: contact || {},
      status: 'pending',
      supplierInfo: {
        name: supplierData.name || supplierData.profile?.name,
        email: supplierData.contact?.email,
        category: supplierData.category,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.uid,
    };

    // Guardar en Firestore (colección principal)
    const docRef = await db.collection('quoteRequests').add(quoteRequest);

    console.log(`✅ [quote-requests] Nueva solicitud creada: ${docRef.id}`);
    console.log(`   Proveedor: ${supplierData.name}`);
    console.log(`   Categoría: ${category}`);

    // TAMBIÉN guardar en la subcolección del proveedor (para compatibilidad con panel existente)
    try {
      // El panel del proveedor lee de suppliers/{id}/requests, NO de quote-requests
      await db
        .collection('suppliers')
        .doc(supplierId)
        .collection('requests') // ← CORREGIDO: era 'quote-requests'
        .doc(docRef.id)
        .set({
          // Datos en el formato que espera el panel del proveedor
          id: docRef.id,
          coupleName: contact?.name || 'Sin nombre',
          contactEmail: contact?.email,
          contactPhone: contact?.phone || null,
          message: message || '',
          services: requestedServices || [],
          weddingDate: eventDate || null,
          guestCount: guestCount || null,
          budget: budget?.max || budget?.min || null,
          location: null,
          preferredContactMethod: 'email',
          urgency: 'normal',
          status: 'new', // new | viewed | responded | archived
          receivedAt: new Date(),
          viewedAt: null,
          respondedAt: null,
          response: null,
          userId: req.user.uid,
          weddingId,
        });

      console.log(
        `✅ [quote-requests] Solicitud guardada en subcolección del proveedor (suppliers/${supplierId}/requests/${docRef.id})`
      );
    } catch (subError) {
      console.error('[quote-requests] Error guardando en subcolección:', subError);
      // No fallar la solicitud si esto falla
    }

    // Enviar notificación y email al proveedor (sin bloquear la respuesta)
    const supplierEmail = supplierData.contact?.email || supplierData.email;
    if (supplierEmail) {
      setImmediate(async () => {
        try {
          // 1. Crear notificación en Firestore para el proveedor
          await db.collection('notifications').add({
            type: 'quote_request',
            recipientId: supplierId,
            recipientType: 'supplier',
            title: 'Nueva solicitud de presupuesto',
            message: `Has recibido una solicitud de presupuesto para ${category}`,
            data: {
              quoteRequestId: docRef.id,
              weddingId,
              category,
              guestCount,
              eventDate,
            },
            status: 'unread',
            createdAt: new Date().toISOString(),
          });

          logger.info(
            `✅ [quote-requests] Notificación creada para proveedor: ${supplierData.name}`
          );

          // 2. Enviar email al proveedor
          try {
            await sendQuoteRequestEmail({
              supplierEmail,
              supplierName: supplierData.name || supplierData.profile?.name || 'Proveedor',
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
              requestId: docRef.id,
              userId: req.user.uid,
            });

            logger.info(
              `📧 [quote-requests] Email enviado a ${supplierEmail} para solicitud ${docRef.id}`
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
      requestId: docRef.id,
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

    let query = db.collection('quoteRequests');

    // Filtrar por boda si se proporciona
    if (weddingId) {
      query = query.where('weddingId', '==', weddingId);
    }

    // Filtrar por status si se proporciona
    if (status) {
      query = query.where('status', '==', status);
    }

    // Ordenar por fecha de creación (más recientes primero)
    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();

    const requests = [];
    snapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data(),
      });
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

    const doc = await db.collection('quoteRequests').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json({
      success: true,
      request: {
        id: doc.id,
        ...doc.data(),
      },
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
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.uid,
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'quoted') {
      updateData.quotedAt = new Date().toISOString();
    } else if (status === 'accepted') {
      updateData.acceptedAt = new Date().toISOString();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date().toISOString();
    }

    await db.collection('quoteRequests').doc(id).update(updateData);

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

    // Intentar en quote-requests-internet primero
    const internetDoc = await db.collection('quote-requests-internet').doc(id).get();
    
    if (internetDoc.exists) {
      const data = internetDoc.data() || {};
      const ownerUid = data.userId || data.createdBy || data.ownerUid;

      if (ownerUid && ownerUid !== req.user.uid) {
        return res.status(403).json({
          error: 'No autorizado para cancelar esta solicitud',
        });
      }

      await db.collection('quote-requests-internet').doc(id).update({
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: req.user.uid,
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ [quote-requests] Solicitud ${id} cancelada en quote-requests-internet`);

      return res.json({
        success: true,
        message: 'Solicitud cancelada',
      });
    }

    // Fallback 1: solicitudes legacy en suppliers/*/quote-requests (de ahí vienen los IDs del quote-stats)
    const legacyQuoteRequestsSnap = await db
      .collectionGroup('quote-requests')
      .where(FieldPath.documentId(), '==', id)
      .limit(1)
      .get();

    if (!legacyQuoteRequestsSnap.empty) {
      const legacyDoc = legacyQuoteRequestsSnap.docs[0];
      const data = legacyDoc.data() || {};
      const ownerUid = data.userId || data.createdBy || data.ownerUid;

      if (ownerUid && ownerUid !== req.user.uid) {
        return res.status(403).json({
          error: 'No autorizado para cancelar esta solicitud',
        });
      }

      await legacyDoc.ref.update({
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: req.user.uid,
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ [quote-requests] Solicitud ${id} cancelada en collectionGroup(quote-requests)`);

      return res.json({
        success: true,
        message: 'Solicitud cancelada',
      });
    }

    // Fallback 2: solicitudes en suppliers/*/requests
    const supplierRequestsSnap = await db
      .collectionGroup('requests')
      .where(FieldPath.documentId(), '==', id)
      .limit(1)
      .get();

    if (!supplierRequestsSnap.empty) {
      const reqDoc = supplierRequestsSnap.docs[0];
      const data = reqDoc.data() || {};
      const ownerUid = data.userId || data.createdBy || data.ownerUid;

      if (ownerUid && ownerUid !== req.user.uid) {
        return res.status(403).json({
          error: 'No autorizado para cancelar esta solicitud',
        });
      }

      await reqDoc.ref.update({
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: req.user.uid,
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ [quote-requests] Solicitud ${id} cancelada en collectionGroup(requests)`);

      return res.json({
        success: true,
        message: 'Solicitud cancelada',
      });
    }

    // Si no está en proveedores de internet, intentar en la colección principal quoteRequests
    const mainDoc = await db.collection('quoteRequests').doc(id).get();
    if (mainDoc.exists) {
      const data = mainDoc.data() || {};
      const ownerUid = data.userId || data.createdBy || data.ownerUid;

      if (ownerUid && ownerUid !== req.user.uid) {
        return res.status(403).json({
          error: 'No autorizado para cancelar esta solicitud',
        });
      }

      await db.collection('quoteRequests').doc(id).update({
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: req.user.uid,
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ [quote-requests] Solicitud ${id} cancelada en quoteRequests`);

      return res.json({
        success: true,
        message: 'Solicitud cancelada',
      });
    }

    // Si no está ahí, buscar en suppliers/{supplierId}/requests
    const suppliersSnapshot = await db.collection('suppliers').get();
    let found = false;

    for (const supplierDoc of suppliersSnapshot.docs) {
      const requestDoc = await db
        .collection('suppliers')
        .doc(supplierDoc.id)
        .collection('requests')
        .doc(id)
        .get();

      if (requestDoc.exists) {
        await db
          .collection('suppliers')
          .doc(supplierDoc.id)
          .collection('requests')
          .doc(id)
          .update({
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancelledBy: req.user.uid,
            updatedAt: new Date().toISOString(),
          });

        console.log(`✅ [quote-requests] Solicitud ${id} cancelada en suppliers/${supplierDoc.id}/requests`);
        found = true;
        break;
      }
    }

    if (found) {
      return res.json({
        success: true,
        message: 'Solicitud cancelada',
      });
    }

    // Si no se encontró en ningún lado
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
