import express from 'express';
import { db } from '../db.js';
import logger from '../logger.js';

const router = express.Router();

/**
 * GET /api/suppliers/public/:slug
 * Obtener información pública de un proveedor por su slug
 */
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Buscar proveedor por slug
    const suppliersQuery = await db
      .collection('suppliers')
      .where('profile.slug', '==', slug)
      .limit(1)
      .get();

    if (suppliersQuery.empty) {
      return res.status(404).json({ error: 'supplier_not_found' });
    }

    const supplierDoc = suppliersQuery.docs[0];
    const supplierData = supplierDoc.data();
    const supplierId = supplierDoc.id;

    // Obtener portfolio público
    const portfolioQuery = await db
      .collection('suppliers')
      .doc(supplierId)
      .collection('portfolio')
      .orderBy('uploadedAt', 'desc')
      .limit(50)
      .get();

    const portfolio = portfolioQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Datos públicos del proveedor (sin información sensible)
    const publicSupplier = {
      id: supplierId,
      name: supplierData.profile?.name || supplierData.name || '',
      business: {
        description: supplierData.business?.description || '',
        priceRange: supplierData.business?.priceRange || '',
      },
      profile: {
        category: supplierData.profile?.category || '',
        slug: supplierData.profile?.slug || slug,
      },
      location: {
        city: supplierData.location?.city || '',
        province: supplierData.location?.province || '',
        country: supplierData.location?.country || '',
      },
      contact: {
        email: supplierData.contact?.email || '',
        phone: supplierData.contact?.phone || '',
        website: supplierData.contact?.website || '',
        instagram: supplierData.contact?.instagram || '',
      },
      rating: supplierData.rating || 0,
      reviewCount: supplierData.reviewCount || 0,
    };

    return res.json({
      success: true,
      supplier: publicSupplier,
      portfolio,
    });
  } catch (error) {
    logger.error('Error fetching public supplier:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * POST /api/suppliers/public/:supplierId/portfolio/:photoId/view
 * Incrementar contador de vistas (público, sin auth)
 */
router.post('/public/:supplierId/portfolio/:photoId/view', express.json(), async (req, res) => {
  try {
    const { supplierId, photoId } = req.params;

    const photoRef = db
      .collection('suppliers')
      .doc(supplierId)
      .collection('portfolio')
      .doc(photoId);

    await photoRef.update({
      views: db.FieldValue.increment(1),
    });

    return res.json({ success: true });
  } catch (error) {
    // No es crítico si falla
    logger.warn('Error incrementing view count:', error);
    return res.json({ success: false });
  }
});

export default router;
