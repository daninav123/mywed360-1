import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/quote-stats/category/:category
 * Obtener estadísticas de presupuestos por categoría
 */
// Normalizar categoría (remover acentos y convertir a minúsculas)
function normalizeCategory(cat) {
  if (!cat) return '';
  return cat.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

router.get('/category/:category', requireAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user.uid;
    const normalizedCategory = normalizeCategory(category);

    logger.info(`[quote-stats] Obteniendo stats para categoría: ${category} (normalized: ${normalizedCategory}), usuario: ${userId}`);

    // 1. Buscar solicitudes enviadas para esta categoría
    const requests = [];
    
    // Buscar en proveedores registrados
    const suppliersSnapshot = await db.collection('suppliers').get();
    
    for (const supplierDoc of suppliersSnapshot.docs) {
      const supplier = supplierDoc.data();
      
      // Verificar si el proveedor es de esta categoría (con normalización)
      if (normalizeCategory(supplier.category) === normalizedCategory) {
        const requestsSnapshot = await db
          .collection('suppliers')
          .doc(supplierDoc.id)
          .collection('quote-requests')
          .where('userId', '==', userId)
          .get();
        
        requestsSnapshot.docs.forEach(doc => {
          requests.push({
            id: doc.id,
            ...doc.data(),
            supplierId: supplierDoc.id,
            supplierName: supplier.name || supplier.profile?.name,
            source: 'registered',
          });
        });
      }
    }

    // Buscar en proveedores de internet (sin filtro de categoría para normalizar después)
    const internetRequestsSnapshot = await db
      .collection('quote-requests-internet')
      .where('userId', '==', userId)
      .get();
    
    internetRequestsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Comparar con normalización
      if (normalizeCategory(data.supplierCategory) === normalizedCategory) {
        requests.push({
          id: doc.id,
          ...data,
          source: 'internet',
        });
      }
    });

    // 2. Buscar respuestas de presupuestos para esta categoría
    const responses = [];
    const responseIds = new Set();

    // 2a. Cargar quotes enlazadas desde requests
    for (const request of requests) {
      if (request.quoteResponseId && !responseIds.has(request.quoteResponseId)) {
        responseIds.add(request.quoteResponseId);
        
        const responseDoc = await db
          .collection('quote-responses')
          .doc(request.quoteResponseId)
          .get();
        
        if (responseDoc.exists) {
          responses.push({
            id: responseDoc.id,
            ...responseDoc.data(),
            linkedRequestId: request.id,
          });
        }
      }
    }

    // 2b. Cargar TODAS las quotes del usuario para esta categoría
    // (para capturar quotes múltiples con mismo requestId)
    const allUserQuotesSnapshot = await db
      .collection('quote-responses')
      .where('userId', '==', userId)
      .get();
    
    allUserQuotesSnapshot.docs.forEach(doc => {
      const quoteData = doc.data();
      
      // Si ya está en responses, skip
      if (responseIds.has(doc.id)) return;
      
      // Verificar si el quote corresponde a algún request de esta categoría
      const matchingRequest = requests.find(r => r.id === quoteData.requestId);
      if (matchingRequest) {
        responseIds.add(doc.id);
        responses.push({
          id: doc.id,
          ...quoteData,
          linkedRequestId: quoteData.requestId,
        });
      }
    });

    // 3. Calcular estadísticas
    const stats = {
      category,
      contacted: new Set(requests.map(r => r.supplierEmail || r.supplierName)).size,
      sent: requests.length,
      received: responses.length,
      pending: requests.filter(r => r.status === 'pending').length,
      quoted: requests.filter(r => r.status === 'quoted').length,
      accepted: responses.filter(r => r.status === 'accepted').length,
      rejected: responses.filter(r => r.status === 'rejected').length,
    };

    // 4. Obtener detalle de proveedores
    const providers = requests.map(req => ({
      id: req.supplierId || req.id,
      name: req.supplierName,
      email: req.supplierEmail,
      status: req.status,
      requestId: req.id,
      sentAt: req.createdAt,
      hasResponse: !!req.quoteResponseId,
      responseId: req.quoteResponseId || null,
    }));

    // 5. Obtener presupuesto aceptado si existe
    const acceptedQuote = responses.find(r => r.status === 'accepted');

    res.json({
      success: true,
      stats,
      providers,
      responses: responses.map(r => ({
        id: r.id,
        supplierName: r.supplierName,
        totalPrice: r.totalPrice,
        confidence: r.confidence,
        status: r.status,
        receivedAt: r.createdAt,
        servicesIncluded: r.servicesIncluded || [],
        priceBreakdown: r.priceBreakdown || [],
      })),
      acceptedQuote: acceptedQuote ? {
        id: acceptedQuote.id,
        supplierName: acceptedQuote.supplierName,
        totalPrice: acceptedQuote.totalPrice,
      } : null,
    });
  } catch (error) {
    logger.error('[quote-stats] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/quote-stats/overview
 * Obtener resumen general de todas las categorías
 */
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;

    logger.info(`[quote-stats] Obteniendo overview para usuario: ${userId}`);

    // Obtener todas las categorías con solicitudes
    const categoriesMap = new Map();

    // Buscar en proveedores registrados
    const suppliersSnapshot = await db.collection('suppliers').get();
    
    for (const supplierDoc of suppliersSnapshot.docs) {
      const supplier = supplierDoc.data();
      const category = supplier.category;
      
      if (category) {
        const requestsSnapshot = await db
          .collection('suppliers')
          .doc(supplierDoc.id)
          .collection('quote-requests')
          .where('userId', '==', userId)
          .get();
        
        if (!requestsSnapshot.empty) {
          if (!categoriesMap.has(category)) {
            categoriesMap.set(category, {
              contacted: new Set(),
              sent: 0,
              received: 0,
              accepted: false,
            });
          }
          
          const catData = categoriesMap.get(category);
          requestsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            catData.sent++;
            catData.contacted.add(supplier.contact?.email || supplier.name);
            if (data.quoteResponseId) catData.received++;
          });
        }
      }
    }

    // Buscar en proveedores de internet
    const internetRequestsSnapshot = await db
      .collection('quote-requests-internet')
      .where('userId', '==', userId)
      .get();
    
    internetRequestsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const category = data.supplierCategory;
      
      if (category) {
        if (!categoriesMap.has(category)) {
          categoriesMap.set(category, {
            contacted: new Set(),
            sent: 0,
            received: 0,
            accepted: false,
          });
        }
        
        const catData = categoriesMap.get(category);
        catData.sent++;
        catData.contacted.add(data.supplierEmail || data.supplierName);
        if (data.quoteResponseId) catData.received++;
      }
    });

    // Convertir a array
    const overview = Array.from(categoriesMap.entries()).map(([category, data]) => ({
      category,
      contacted: data.contacted.size,
      sent: data.sent,
      received: data.received,
      accepted: data.accepted,
    }));

    res.json({
      success: true,
      overview,
    });
  } catch (error) {
    logger.error('[quote-stats] Error en overview:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
