import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/wedding-categories/:weddingId
 * Obtener categorías activas de una boda
 */
router.get('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    // Verificar acceso a la boda
    const wedding = await prisma.wedding.findFirst({
      where: {
        id: weddingId,
        OR: [{ userId }, { access: { some: { userId } } }],
      },
      select: {
        id: true,
        activeCategories: true,
        wantedServices: true,
        updatedAt: true,
      },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    res.json({
      success: true,
      data: {
        activeCategories: wedding.activeCategories || [],
        wantedServices: wedding.wantedServices || [],
        updatedAt: wedding.updatedAt,
      },
    });
  } catch (error) {
    console.error('[wedding-categories] GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/wedding-categories/:weddingId
 * Actualizar categorías activas de una boda
 */
router.put('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { activeCategories, wantedServices } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    // Verificar acceso a la boda
    const wedding = await prisma.wedding.findFirst({
      where: {
        id: weddingId,
        OR: [{ userId }, { access: { some: { userId } } }],
      },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    // Actualizar categorías
    const updated = await prisma.wedding.update({
      where: { id: weddingId },
      data: {
        activeCategories: activeCategories || [],
        wantedServices: wantedServices || [],
        updatedAt: new Date(),
      },
      select: {
        id: true,
        activeCategories: true,
        wantedServices: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        activeCategories: updated.activeCategories,
        wantedServices: updated.wantedServices,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('[wedding-categories] PUT error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
