import express from 'express';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/suppliers/:id/reviews
 * Obtener reseñas públicas de un proveedor
 * NO requiere autenticación
 */
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, orderBy = 'createdAt', order = 'desc' } = req.query;

    const query = db
      .collection('suppliers')
      .doc(id)
      .collection('reviews')
      .where('status', '==', 'approved') // Solo mostrar aprobadas
      .orderBy(orderBy, order)
      .limit(parseInt(limit));

    const snapshot = await query.get();

    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // No exponer información sensible
      reportedBy: undefined,
      reportReason: undefined,
    }));

    // Calcular estadísticas
    const stats = {
      total: reviews.length,
      averageRating:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
          : 0,
      ratingDistribution: {
        5: reviews.filter((r) => r.rating === 5).length,
        4: reviews.filter((r) => r.rating === 4).length,
        3: reviews.filter((r) => r.rating === 3).length,
        2: reviews.filter((r) => r.rating === 2).length,
        1: reviews.filter((r) => r.rating === 1).length,
      },
    };

    return res.json({
      success: true,
      reviews,
      stats,
    });
  } catch (error) {
    logger.error('Error fetching reviews:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * POST /api/suppliers/:id/reviews
 * Crear una nueva reseña
 * Requiere autenticación
 */
router.post('/:id/reviews', express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, weddingDate, serviceType } = req.body;

    // Validaciones
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'invalid_rating' });
    }

    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({ error: 'comment_too_short' });
    }

    // Obtener usuario (por ahora usamos header, puedes implementar middleware auth)
    const userId = req.headers['x-user-id'];
    const userName = req.headers['x-user-name'] || 'Usuario Anónimo';
    const userEmail = req.headers['x-user-email'];

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    // Verificar si ya dejó reseña
    const existingReview = await db
      .collection('suppliers')
      .doc(id)
      .collection('reviews')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingReview.empty) {
      return res.status(409).json({ error: 'already_reviewed' });
    }

    // Crear reseña
    const reviewData = {
      userId,
      userName,
      userEmail: userEmail || null,
      rating: parseInt(rating),
      comment: comment.trim(),
      weddingDate: weddingDate || null,
      serviceType: serviceType || null,
      status: 'pending', // pending, approved, rejected
      supplierResponse: null,
      supplierResponseAt: null,
      helpful: 0,
      reported: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('suppliers').doc(id).collection('reviews').add(reviewData);

    logger.info(`Nueva reseña creada: ${docRef.id} para proveedor ${id}`);

    // Actualizar rating promedio del proveedor (en background)
    updateSupplierRating(id).catch((err) => {
      logger.error('Error updating supplier rating:', err);
    });

    return res.status(201).json({
      success: true,
      reviewId: docRef.id,
      review: {
        id: docRef.id,
        ...reviewData,
      },
    });
  } catch (error) {
    logger.error('Error creating review:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * PUT /api/suppliers/:id/reviews/:reviewId/respond
 * Responder a una reseña (solo el proveedor)
 * Requiere autenticación de proveedor
 */
router.put('/:id/reviews/:reviewId/respond', express.json(), async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { response } = req.body;

    // Validar autenticación del proveedor
    const supplierId = req.headers['x-supplier-id'];
    if (!supplierId || supplierId !== id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    if (!response || response.trim().length < 5) {
      return res.status(400).json({ error: 'response_too_short' });
    }

    const reviewRef = db.collection('suppliers').doc(id).collection('reviews').doc(reviewId);

    const reviewDoc = await reviewRef.get();
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'review_not_found' });
    }

    await reviewRef.update({
      supplierResponse: response.trim(),
      supplierResponseAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`Proveedor ${id} respondió a reseña ${reviewId}`);

    return res.json({
      success: true,
      message: 'Respuesta publicada correctamente',
    });
  } catch (error) {
    logger.error('Error responding to review:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * POST /api/suppliers/:id/reviews/:reviewId/helpful
 * Marcar reseña como útil
 * NO requiere autenticación
 */
router.post('/:id/reviews/:reviewId/helpful', async (req, res) => {
  try {
    const { id, reviewId } = req.params;

    const reviewRef = db.collection('suppliers').doc(id).collection('reviews').doc(reviewId);

    await reviewRef.update({
      helpful: FieldValue.increment(1),
    });

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error marking review as helpful:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * POST /api/suppliers/:id/reviews/:reviewId/report
 * Reportar una reseña inapropiada
 * Requiere autenticación
 */
router.post('/:id/reviews/:reviewId/report', express.json(), async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { reason } = req.body;

    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: 'reason_required' });
    }

    const reviewRef = db.collection('suppliers').doc(id).collection('reviews').doc(reviewId);

    const reviewDoc = await reviewRef.get();
    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'review_not_found' });
    }

    await reviewRef.update({
      reported: true,
      reportedBy: userId,
      reportReason: reason.trim(),
      reportedAt: FieldValue.serverTimestamp(),
    });

    logger.warn(`Reseña ${reviewId} reportada por usuario ${userId}`);

    return res.json({
      success: true,
      message: 'Reseña reportada. Será revisada por el equipo.',
    });
  } catch (error) {
    logger.error('Error reporting review:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Función auxiliar para actualizar el rating promedio del proveedor
 */
async function updateSupplierRating(supplierId) {
  try {
    const reviewsSnapshot = await db
      .collection('suppliers')
      .doc(supplierId)
      .collection('reviews')
      .where('status', '==', 'approved')
      .get();

    if (reviewsSnapshot.empty) {
      return;
    }

    const reviews = reviewsSnapshot.docs.map((doc) => doc.data());
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = totalRating / reviews.length;
    const reviewCount = reviews.length;

    await db
      .collection('suppliers')
      .doc(supplierId)
      .update({
        rating: Math.round(averageRating * 10) / 10, // Redondear a 1 decimal
        reviewCount,
        updatedAt: FieldValue.serverTimestamp(),
      });

    logger.info(
      `Rating actualizado para proveedor ${supplierId}: ${averageRating} (${reviewCount} reseñas)`
    );
  } catch (error) {
    logger.error('Error updating supplier rating:', error);
    throw error;
  }
}

export default router;
