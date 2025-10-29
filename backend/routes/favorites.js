import express from 'express';
import { db } from '../db.js';
import logger from '../logger.js';

const router = express.Router();

/**
 * GET /api/favorites
 * Obtener todos los proveedores favoritos de la boda actual
 * REQUIERE: x-wedding-id header
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.uid;
    const weddingId = req.headers['x-wedding-id'];

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (!weddingId) {
      return res.status(400).json({
        error: 'wedding-required',
        message: 'Se requiere una boda activa para gestionar favoritos',
      });
    }

    // Ruta: weddings/{weddingId}/suppliers/favorites
    const snapshot = await db
      .collection('weddings')
      .doc(weddingId)
      .collection('suppliers')
      .doc('favorites')
      .collection('items')
      .get();

    // Filtrar expirados y ordenar
    const now = new Date();
    const docs = snapshot.docs
      .filter((doc) => {
        const expiresAt = doc.data().expiresAt;
        if (!expiresAt) return true; // Compatibilidad con favoritos antiguos
        return new Date(expiresAt) > now;
      })
      .sort((a, b) => {
        const aDate = new Date(a.data().addedAt || 0);
        const bDate = new Date(b.data().addedAt || 0);
        return bDate - aDate; // desc
      });

    const favorites = docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    logger.info(`[favorites] Boda ${weddingId} tiene ${favorites.length} favoritos activos`);

    res.json({ favorites, count: favorites.length });
  } catch (error) {
    logger.error('[favorites] Error obteniendo favoritos:', error);
    res.status(500).json({ error: 'fetch-failed', message: error.message });
  }
});

/**
 * POST /api/favorites
 * Añadir proveedor a favoritos (TEMPORAL: 30 días)
 * REQUIERE: x-wedding-id header
 *
 * Body: { supplier: {...}, notes: "opcional" }
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.uid;
    const weddingId = req.headers['x-wedding-id'];
    const { supplier, notes } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (!weddingId) {
      return res.status(400).json({
        error: 'wedding-required',
        message: 'Se requiere una boda activa para gestionar favoritos',
      });
    }

    if (!supplier || !supplier.id) {
      return res.status(400).json({ error: 'invalid-supplier' });
    }

    const favoritesRef = db
      .collection('weddings')
      .doc(weddingId)
      .collection('suppliers')
      .doc('favorites')
      .collection('items');

    // Verificar si ya existe en favoritos
    const existingSnapshot = await favoritesRef
      .where('supplierId', '==', supplier.id)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(409).json({
        error: 'already-favorited',
        message: 'Este proveedor ya está en tus favoritos',
      });
    }

    // Calcular fecha de expiración (30 días)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 días

    // Helper: Eliminar valores undefined (Firestore no los acepta)
    const cleanObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      const cleaned = {};
      for (const key in obj) {
        if (obj[key] !== undefined && obj[key] !== null) {
          cleaned[key] =
            typeof obj[key] === 'object' && !Array.isArray(obj[key])
              ? cleanObject(obj[key])
              : obj[key];
        }
      }
      return cleaned;
    };

    // Crear documento de favorito (limpio de undefined)
    const favoriteData = cleanObject({
      userId,
      weddingId,
      supplierId: supplier.id,
      supplier: {
        id: supplier.id,
        name: supplier.name || 'Sin nombre',
        category: supplier.category || 'Sin categoría',
        location: supplier.location,
        contact: supplier.contact,
        media: supplier.media,
        registered: supplier.registered || false,
        badge: supplier.badge,
        source: supplier.source || 'unknown',
      },
      notes: notes || '',
      addedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(), // ⭐ TTL de 30 días
    });

    const docRef = await favoritesRef.add(favoriteData);

    logger.info(
      `[favorites] Boda ${weddingId} añadió proveedor ${supplier.id} (expira: ${expiresAt.toISOString()})`
    );

    res.status(201).json({
      message: 'Proveedor añadido a favoritos (válido 30 días)',
      favorite: { id: docRef.id, ...favoriteData },
    });
  } catch (error) {
    logger.error('[favorites] Error añadiendo favorito:', error);
    res.status(500).json({ error: 'add-failed', message: error.message });
  }
});

/**
 * DELETE /api/favorites/:supplierId
 * Eliminar proveedor de favoritos
 * REQUIERE: x-wedding-id header
 */
router.delete('/:supplierId', async (req, res) => {
  try {
    const userId = req.user?.uid;
    const weddingId = req.headers['x-wedding-id'];
    const { supplierId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (!weddingId) {
      return res.status(400).json({
        error: 'wedding-required',
        message: 'Se requiere una boda activa para gestionar favoritos',
      });
    }

    const favoritesRef = db
      .collection('weddings')
      .doc(weddingId)
      .collection('suppliers')
      .doc('favorites')
      .collection('items');

    // Buscar el favorito
    const snapshot = await favoritesRef.where('supplierId', '==', supplierId).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: 'not-found',
        message: 'Este proveedor no está en tus favoritos',
      });
    }

    // Eliminar
    const docId = snapshot.docs[0].id;
    await favoritesRef.doc(docId).delete();

    logger.info(`[favorites] Boda ${weddingId} eliminó proveedor ${supplierId} de favoritos`);

    res.json({ message: 'Proveedor eliminado de favoritos' });
  } catch (error) {
    logger.error('[favorites] Error eliminando favorito:', error);
    res.status(500).json({ error: 'delete-failed', message: error.message });
  }
});

/**
 * GET /api/favorites/check/:supplierId
 * Verificar si un proveedor está en favoritos
 * REQUIERE: x-wedding-id header
 */
router.get('/check/:supplierId', async (req, res) => {
  try {
    const userId = req.user?.uid;
    const weddingId = req.headers['x-wedding-id'];
    const { supplierId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (!weddingId) {
      return res.json({ isFavorite: false }); // Sin boda = sin favoritos
    }

    const favoritesRef = db
      .collection('weddings')
      .doc(weddingId)
      .collection('suppliers')
      .doc('favorites')
      .collection('items');

    const snapshot = await favoritesRef.where('supplierId', '==', supplierId).limit(1).get();

    // Verificar si está expirado
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const expiresAt = doc.data().expiresAt;
      if (expiresAt && new Date(expiresAt) < new Date()) {
        // Eliminar favorito expirado
        await favoritesRef.doc(doc.id).delete();
        logger.info(`[favorites] Favorito expirado eliminado: ${supplierId}`);
        return res.json({ isFavorite: false });
      }
    }

    res.json({ isFavorite: !snapshot.empty });
  } catch (error) {
    logger.error('[favorites] Error verificando favorito:', error);
    res.status(500).json({ error: 'check-failed', message: error.message });
  }
});

export default router;
