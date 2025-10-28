import express from 'express';
import { db } from '../db.js';
import logger from '../logger.js';

const router = express.Router();

/**
 * GET /api/favorites
 * Obtener todos los proveedores favoritos del usuario/boda actual
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.uid;
    const weddingId = req.headers['x-wedding-id'];

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    // Buscar por weddingId si existe, sino por userId
    const searchKey = weddingId || userId;
    const searchField = weddingId ? 'weddingId' : 'userId';

    const snapshot = await db.collection('favorites').where(searchField, '==', searchKey).get();

    // Ordenar en JavaScript en vez de Firestore (evita necesidad de índice)
    const docs = snapshot.docs.sort((a, b) => {
      const aDate = new Date(a.data().addedAt || 0);
      const bDate = new Date(b.data().addedAt || 0);
      return bDate - aDate; // desc
    });

    const favorites = docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    logger.info(`[favorites] Usuario ${userId} tiene ${favorites.length} favoritos`);

    res.json({ favorites, count: favorites.length });
  } catch (error) {
    logger.error('[favorites] Error obteniendo favoritos:', error);
    res.status(500).json({ error: 'fetch-failed', message: error.message });
  }
});

/**
 * POST /api/favorites
 * Añadir proveedor a favoritos
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

    if (!supplier || !supplier.id) {
      return res.status(400).json({ error: 'invalid-supplier' });
    }

    const searchKey = weddingId || userId;
    const searchField = weddingId ? 'weddingId' : 'userId';

    // Verificar si ya existe en favoritos
    const existingSnapshot = await db
      .collection('favorites')
      .where(searchField, '==', searchKey)
      .where('supplierId', '==', supplier.id)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(409).json({
        error: 'already-favorited',
        message: 'Este proveedor ya está en tus favoritos',
      });
    }

    // Crear documento de favorito
    const favoriteData = {
      userId,
      weddingId: weddingId || null,
      supplierId: supplier.id,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        category: supplier.category,
        location: supplier.location,
        contact: supplier.contact,
        media: supplier.media,
        registered: supplier.registered || false,
        badge: supplier.badge,
        source: supplier.source,
      },
      notes: notes || '',
      addedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('favorites').add(favoriteData);

    logger.info(`[favorites] Usuario ${userId} añadió proveedor ${supplier.id} a favoritos`);

    res.status(201).json({
      message: 'Proveedor añadido a favoritos',
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
 */
router.delete('/:supplierId', async (req, res) => {
  try {
    const userId = req.user?.uid;
    const weddingId = req.headers['x-wedding-id'];
    const { supplierId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const searchKey = weddingId || userId;
    const searchField = weddingId ? 'weddingId' : 'userId';

    // Buscar el favorito
    const snapshot = await db
      .collection('favorites')
      .where(searchField, '==', searchKey)
      .where('supplierId', '==', supplierId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: 'not-found',
        message: 'Este proveedor no está en tus favoritos',
      });
    }

    // Eliminar
    const docId = snapshot.docs[0].id;
    await db.collection('favorites').doc(docId).delete();

    logger.info(`[favorites] Usuario ${userId} eliminó proveedor ${supplierId} de favoritos`);

    res.json({ message: 'Proveedor eliminado de favoritos' });
  } catch (error) {
    logger.error('[favorites] Error eliminando favorito:', error);
    res.status(500).json({ error: 'delete-failed', message: error.message });
  }
});

/**
 * GET /api/favorites/check/:supplierId
 * Verificar si un proveedor está en favoritos
 */
router.get('/check/:supplierId', async (req, res) => {
  try {
    const userId = req.user?.uid;
    const weddingId = req.headers['x-wedding-id'];
    const { supplierId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const searchKey = weddingId || userId;
    const searchField = weddingId ? 'weddingId' : 'userId';

    const snapshot = await db
      .collection('favorites')
      .where(searchField, '==', searchKey)
      .where('supplierId', '==', supplierId)
      .limit(1)
      .get();

    res.json({ isFavorite: !snapshot.empty });
  } catch (error) {
    logger.error('[favorites] Error verificando favorito:', error);
    res.status(500).json({ error: 'check-failed', message: error.message });
  }
});

export default router;
