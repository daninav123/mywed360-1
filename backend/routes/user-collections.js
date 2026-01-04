import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/user-collections/:collectionName
 * Obtener colección de usuario
 */
router.get('/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { metadata: true },
    });

    const collections = profile?.metadata?.collections || {};
    const data = collections[collectionName] || [];

    res.json({
      success: true,
      data: Array.isArray(data) ? data : [],
    });
  } catch (error) {
    console.error('[user-collections] GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/user-collections/:collectionName
 * Añadir item a colección de usuario
 */
router.post('/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    const item = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { metadata: true },
    });

    const collections = profile?.metadata?.collections || {};
    const currentData = collections[collectionName] || [];

    const newItem = {
      ...item,
      id: item.id || Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedData = [...currentData, newItem];
    collections[collectionName] = updatedData;

    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        metadata: { collections },
      },
      update: {
        metadata: {
          ...(profile?.metadata || {}),
          collections,
        },
      },
    });

    res.json({
      success: true,
      data: newItem,
    });
  } catch (error) {
    console.error('[user-collections] POST error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/user-collections/:collectionName/:itemId
 * Actualizar item en colección
 */
router.put('/:collectionName/:itemId', async (req, res) => {
  try {
    const { collectionName, itemId } = req.params;
    const changes = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { metadata: true },
    });

    const collections = profile?.metadata?.collections || {};
    const currentData = collections[collectionName] || [];

    const updatedData = currentData.map((item) =>
      item.id === itemId ? { ...item, ...changes } : item
    );

    collections[collectionName] = updatedData;

    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        metadata: { collections },
      },
      update: {
        metadata: {
          ...(profile?.metadata || {}),
          collections,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[user-collections] PUT error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/user-collections/:collectionName/:itemId
 * Eliminar item de colección
 */
router.delete('/:collectionName/:itemId', async (req, res) => {
  try {
    const { collectionName, itemId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { metadata: true },
    });

    const collections = profile?.metadata?.collections || {};
    const currentData = collections[collectionName] || [];

    const updatedData = currentData.filter((item) => item.id !== itemId);
    collections[collectionName] = updatedData;

    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        metadata: { collections },
      },
      update: {
        metadata: {
          ...(profile?.metadata || {}),
          collections,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[user-collections] DELETE error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
