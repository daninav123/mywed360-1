import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import logger from '../utils/logger.js';
import { randomBytes } from 'crypto';
import {
  sendQuoteRequestEmail,
  sendQuoteReceivedNotification,
} from '../services/quoteRequestEmailService.js';
import { requireSupplierAuth, verifySupplierId } from '../middleware/supplierAuth.js';
import { sendEmail } from '../services/mailgunService.js';

const router = express.Router();

// Generar token único para respuesta pública
function generateResponseToken() {
  return randomBytes(32).toString('hex');
}

/**
 * POST /api/suppliers/:id/quote-requests
 * 💰 Sistema Inteligente V2 - Solicitar presupuesto con templates dinámicos
 * NO requiere autenticación (público)
 */
router.post('/:id/quote-requests', express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { weddingInfo, contacto, proveedor, serviceDetails, customMessage, userId, weddingId, categoryRequirements } =
      req.body;

    // Validaciones del nuevo formato
    if (!contacto || !contacto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto.email)) {
      return res.status(400).json({ error: 'invalid_email' });
    }

    if (!contacto.nombre || contacto.nombre.trim().length < 2) {
      return res.status(400).json({ error: 'name_required' });
    }

    // Verificar que el proveedor existe (registrado o internet)
    const supplierDoc = await db.collection('suppliers').doc(id).get();

    let supplier;
    let isInternetSupplier = false;

    if (!supplierDoc.exists) {
      // ✨ Proveedor de internet (Google Places) - Usar info del payload
      if (!proveedor || !proveedor.name) {
        return res.status(400).json({
          error: 'supplier_info_required',
          message: 'Para proveedores de internet, se requiere info básica en el payload',
        });
      }

      isInternetSupplier = true;
      supplier = {
        name: proveedor.name,
        profile: { name: proveedor.name },
        contact: {
          email: proveedor.email || null,
          phone: proveedor.phone || null,
          website: proveedor.website || null,
        },
        category: proveedor.category,
        source: 'internet',
      };

      logger.info(`🌐 Solicitud para proveedor de internet: ${proveedor.name}`);
    } else {
      // Proveedor registrado en Firestore
      supplier = supplierDoc.data();
    }

    // Generar token único para respuesta pública
    const responseToken = generateResponseToken();

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

      // ✨ Requisitos específicos de Info Boda para esta categoría
      categoryRequirements: categoryRequirements || null,

      // Mensaje personalizado
      customMessage: customMessage || '',

      // Token para respuesta pública (proveedores)
      responseToken,
      responseUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/responder-presupuesto/${responseToken}`,

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

    let docRef;
    let requestId;

    // Guardar en Firestore solo para proveedores registrados
    if (!isInternetSupplier) {
      // Guardar en la subcolección del proveedor
      docRef = await db
        .collection('suppliers')
        .doc(id)
        .collection('quote-requests')
        .add(quoteRequestData);

      requestId = docRef.id;

      logger.info(
        `✅ Nueva solicitud presupuesto V2: ${requestId} para proveedor registrado ${id} (${proveedor?.categoryName || 'sin categoría'})`
      );
    } else {
      // Para proveedores de internet, guardar en colección global
      docRef = await db.collection('quote-requests-internet').add({
        ...quoteRequestData,
        isInternetSupplier: true,
        supplierInfo: {
          name: supplier.name,
          email: supplier.contact?.email,
          phone: supplier.contact?.phone,
          website: supplier.contact?.website,
        },
      });

      requestId = docRef.id;

      logger.info(
        `✅ Nueva solicitud presupuesto para proveedor de internet: ${requestId} - ${supplier.name}`
      );
    }

    // Enviar email de notificación al proveedor
    let supplierEmail = supplier.contact?.email || supplier.email;
    
    // 🔍 Si no hay email, intentar extraerlo de la web
    if (!supplierEmail && (supplier.contact?.website || supplier.website)) {
      const websiteUrl = supplier.contact?.website || supplier.website;
      logger.info(`📧 [QuoteRequest] No hay email, extrayendo de web: ${websiteUrl}`);
      
      try {
        const { getCachedWebAnalysis } = await import('../services/webScraperService.js');
        const cachedAnalysis = await getCachedWebAnalysis(websiteUrl);
        
        if (cachedAnalysis?.data?.contactEmail) {
          supplierEmail = cachedAnalysis.data.contactEmail;
          logger.info(`✅ [QuoteRequest] Email extraído de caché: ${supplierEmail}`);
          
          // Actualizar el documento con el email encontrado
          await docRef.update({
            supplierEmail: supplierEmail,
            supplierInfo: {
              ...quoteRequestData.supplierInfo,
              email: supplierEmail
            }
          });
        } else {
          logger.warn(`⚠️ [QuoteRequest] No se encontró email en caché para: ${websiteUrl}`);
          
          // 📧 Fallback: emails conocidos de proveedores específicos
          const knownEmails = {
            'resonaevents.com': 'info@resonaevents.com',
            'www.resonaevents.com': 'info@resonaevents.com',
          };
          
          const domain = websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
          if (knownEmails[domain]) {
            supplierEmail = knownEmails[domain];
            logger.info(`✅ [QuoteRequest] Usando email conocido para ${domain}: ${supplierEmail}`);
            
            // Actualizar el documento con el email
            await docRef.update({
              supplierEmail: supplierEmail,
              supplierInfo: {
                ...quoteRequestData.supplierInfo,
                email: supplierEmail
              }
            });
          }
        }
      } catch (emailExtractionError) {
        logger.error(`❌ [QuoteRequest] Error extrayendo email:`, emailExtractionError.message);
      }
    }
    
    logger.info(`📧 [QuoteRequest] Email final para envío: ${supplierEmail || 'NO DISPONIBLE'}`);

    // Obtener email configurado del usuario (myWed360Email es el principal @malove.app)
    let clientEmail = contacto.email;
    if (userId) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          // Priorizar myWed360Email (danielnavarrocampos@malove.app) sobre maLoveEmail
          clientEmail = userData.myWed360Email || userData.maLoveEmail || contacto.email;
          logger.info(`📧 [QuoteRequest] Usando email configurado del usuario: ${clientEmail}`);
        }
      } catch (userError) {
        logger.warn(`⚠️ No se pudo obtener perfil usuario ${userId}, usando contacto.email`);
      }
    }

    if (supplierEmail) {
      try {
        await sendQuoteRequestEmail({
          supplierEmail,
          supplierName: supplier.profile?.name || supplier.name || 'Proveedor',
          clientName: contacto.nombre,
          clientEmail: clientEmail,
          clientPhone: contacto.telefono,
          weddingDate: weddingInfo?.fecha,
          city: weddingInfo?.ciudad,
          guestCount: weddingInfo?.numeroInvitados,
          totalBudget: weddingInfo?.presupuestoTotal,
          categoryName: proveedor?.categoryName || 'Servicio',
          serviceDetails: serviceDetails || {},
          categoryRequirements: categoryRequirements || null,
          customMessage: customMessage || '',
          responseUrl: quoteRequestData.responseUrl,
          requestId,
          userId: userId || null,
          isInternetSupplier,
        });

        logger.info(
          `📧 Email enviado a ${supplierEmail} para solicitud ${requestId}${isInternetSupplier ? ' (proveedor de internet)' : ''}`
        );
      } catch (emailError) {
        // No fallar la solicitud si el email falla
        logger.error('Error enviando email al proveedor:', emailError);
      }
    } else {
      logger.warn(
        `⚠️  Proveedor ${id} no tiene email configurado, no se puede enviar notificación`
      );
    }

    // Incrementar contador de solicitudes solo para proveedores registrados
    if (!isInternetSupplier) {
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
    }

    return res.status(201).json({
      success: true,
      requestId,
      message:
        'Solicitud enviada correctamente. El proveedor se pondrá en contacto contigo pronto.',
      isInternetSupplier,
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
router.get('/:id/quote-requests', requireSupplierAuth, verifySupplierId, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, status, viewed } = req.query;

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
 * POST /api/suppliers/:id/quote-requests/:requestId/quotation
 * Crear y enviar cotización para una solicitud (solo proveedor)
 * Requiere autenticación de proveedor
 */
router.post('/:id/quote-requests/:requestId/quotation', express.json(), async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const { items, discount, tax, validUntil, terms, notes } = req.body;

    // Validar autenticación del proveedor
    const supplierId = req.headers['x-supplier-id'];
    if (!supplierId || supplierId !== id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // Validar items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items_required' });
    }

    // Verificar que la solicitud existe
    const requestRef = db
      .collection('suppliers')
      .doc(id)
      .collection('quote-requests')
      .doc(requestId);

    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'request_not_found' });
    }

    const requestData = requestDoc.data();

    // Calcular totales
    const subtotal = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const discountAmount =
      discount?.type === 'percentage' ? (subtotal * discount.value) / 100 : discount?.value || 0;

    const taxableAmount = subtotal - discountAmount;
    const taxAmount = tax?.rate ? (taxableAmount * tax.rate) / 100 : 0;
    const total = taxableAmount + taxAmount;

    // Crear cotización
    const quotation = {
      quotationId: `QT-${Date.now()}`,
      requestId,
      supplierId: id,
      supplierName: requestData.supplierName,

      // Cliente
      clientName: requestData.contacto?.nombre,
      clientEmail: requestData.contacto?.email,

      // Items
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),

      // Cálculos
      subtotal,
      discount: discount || null,
      discountAmount,
      tax: tax || null,
      taxAmount,
      total,

      // Detalles
      validUntil: validUntil || null,
      terms: terms || '',
      notes: notes || '',

      // Estado
      status: 'sent', // sent, viewed, accepted, rejected

      // Timestamps
      createdAt: FieldValue.serverTimestamp(),
      sentAt: FieldValue.serverTimestamp(),
      viewedAt: null,
      respondedAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Guardar cotización en la solicitud
    await requestRef.update({
      quotation,
      status: 'quoted',
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`✅ Cotización creada: ${quotation.quotationId} para solicitud ${requestId}`);

    // Enviar email al cliente con la cotización
    if (requestData.contacto?.email) {
      try {
        const clientEmail = requestData.contacto.email;
        const clientName = requestData.contacto?.nombre || 'Cliente';
        
        await sendEmail({
          to: clientEmail,
          subject: `Nueva cotización de ${quotation.supplierName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Has recibido una cotización de ${quotation.supplierName}</h2>
              <p>Hola ${clientName},</p>
              <p>El proveedor <strong>${quotation.supplierName}</strong> ha enviado una cotización para tu solicitud.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Detalles de la cotización</h3>
                <p><strong>Subtotal:</strong> €${subtotal.toFixed(2)}</p>
                ${discountAmount > 0 ? `<p><strong>Descuento:</strong> €${discountAmount.toFixed(2)}</p>` : ''}
                ${taxAmount > 0 ? `<p><strong>IVA:</strong> €${taxAmount.toFixed(2)}</p>` : ''}
                <p style="font-size: 18px; font-weight: bold; color: #2563eb;"><strong>Total:</strong> €${total.toFixed(2)}</p>
                ${validUntil ? `<p style="color: #666; font-size: 14px;">Válido hasta: ${new Date(validUntil).toLocaleDateString()}</p>` : ''}
              </div>
              
              ${notes ? `<p><strong>Notas:</strong> ${notes}</p>` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.PUBLIC_APP_BASE_URL || 'http://localhost:5173'}/quotations/${quotation.quotationId}" 
                   style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Ver Cotización Completa
                </a>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">MyWed360 - Plataforma de gestión de bodas</p>
            </div>
          `,
          text: `Has recibido una cotización de ${quotation.supplierName}. Total: €${total.toFixed(2)}. Visita MyWed360 para ver los detalles completos.`
        });
        logger.info('✅ Email de cotización enviado al cliente', { email: clientEmail });
      } catch (emailError) {
        logger.error('⚠️ Error enviando email de cotización al cliente', emailError);
      }
    }

    return res.status(201).json({
      success: true,
      quotation,
      message: 'Cotización enviada correctamente',
    });
  } catch (error) {
    logger.error('Error creating quotation:', error);
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

/**
 * GET /api/quote-requests/public/:token
 * Cargar solicitud de presupuesto desde token público (para proveedor)
 * NO requiere autenticación
 */
router.get('/public/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'token_required' });
    }

    // Buscar la solicitud por token
    const suppliersSnapshot = await db.collection('suppliers').get();

    let foundRequest = null;
    let foundSupplierId = null;
    let foundRequestId = null;

    for (const supplierDoc of suppliersSnapshot.docs) {
      const requestsSnapshot = await db
        .collection('suppliers')
        .doc(supplierDoc.id)
        .collection('quote-requests')
        .where('responseToken', '==', token)
        .limit(1)
        .get();

      if (!requestsSnapshot.empty) {
        foundRequest = requestsSnapshot.docs[0].data();
        foundSupplierId = supplierDoc.id;
        foundRequestId = requestsSnapshot.docs[0].id;
        break;
      }
    }

    if (!foundRequest) {
      return res.status(404).json({ error: 'request_not_found' });
    }

    // Verificar que no esté ya respondida (opcional, permitir múltiples respuestas)
    if (foundRequest.status === 'quoted' && foundRequest.quotes && foundRequest.quotes.length > 0) {
      logger.info(`Request ${foundRequestId} already has quotes, allowing update`);
    }

    // Devolver la solicitud
    return res.json({
      success: true,
      request: {
        id: foundRequestId,
        supplierId: foundSupplierId,
        ...foundRequest,
      },
    });
  } catch (error) {
    logger.error('Error fetching public quote request:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * POST /api/quote-requests/public/:token/respond
 * Responder a solicitud de presupuesto (para proveedor)
 * NO requiere autenticación
 */
router.post('/public/:token/respond', express.json(), async (req, res) => {
  try {
    const { token } = req.params;
    const { quote } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'token_required' });
    }

    if (!quote || !quote.pricing || !quote.pricing.total) {
      return res.status(400).json({ error: 'invalid_quote_data' });
    }

    // Buscar la solicitud por token
    const suppliersSnapshot = await db.collection('suppliers').get();

    let foundRequestRef = null;
    let foundRequest = null;

    for (const supplierDoc of suppliersSnapshot.docs) {
      const requestsSnapshot = await db
        .collection('suppliers')
        .doc(supplierDoc.id)
        .collection('quote-requests')
        .where('responseToken', '==', token)
        .limit(1)
        .get();

      if (!requestsSnapshot.empty) {
        foundRequestRef = requestsSnapshot.docs[0].ref;
        foundRequest = requestsSnapshot.docs[0].data();
        break;
      }
    }

    if (!foundRequestRef) {
      return res.status(404).json({ error: 'request_not_found' });
    }

    // Crear el objeto quote con metadata
    const quoteWithMetadata = {
      ...quote,
      quoteId: `quote_${Date.now()}`,
      version: 1,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Guardar la respuesta
    await foundRequestRef.update({
      quotes: FieldValue.arrayUnion(quoteWithMetadata),
      status: 'quoted',
      respondedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`✅ Quote response saved for request with token ${token.substring(0, 10)}...`);

    // Enviar notificación al usuario
    if (foundRequest.contacto?.email) {
      try {
        // Obtener nombre del usuario
        let userName = foundRequest.contacto?.nombre || 'Usuario';

        // Obtener nombre del proveedor
        const supplierName = foundRequest.supplierName || 'Proveedor';

        // URL para ver el presupuesto
        const viewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/proveedores`;

        await sendQuoteReceivedNotification({
          userEmail: foundRequest.contacto.email,
          userName,
          supplierName,
          categoryName: foundRequest.supplierCategoryName || 'Servicio',
          quoteAmount: quoteWithMetadata.pricing?.total,
          viewUrl,
        });

        logger.info(`📧 Notificación enviada a ${foundRequest.contacto.email}`);
      } catch (emailError) {
        // No fallar la respuesta si el email falla
        logger.error('Error enviando notificación al usuario:', emailError);
      }
    }

    return res.json({
      success: true,
      message: 'Presupuesto enviado correctamente',
      quoteId: quoteWithMetadata.quoteId,
    });
  } catch (error) {
    logger.error('Error saving quote response:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
