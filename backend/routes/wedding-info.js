import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/wedding-info/:weddingId - Obtener info completa de una boda
router.get('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      include: {
        guests: true,
        tasks: true,
        timelineEvents: true,
        specialMoments: true,
        transactions: true,
      },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    res.json(wedding);
  } catch (error) {
    console.error('[GET /wedding-info/:weddingId] Error:', error);
    res.status(500).json({ error: 'Error al obtener información de la boda' });
  }
});

// PATCH /api/wedding-info/:weddingId - Actualizar info general
router.patch('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const updates = req.body;

    const wedding = await prisma.wedding.update({
      where: { id: weddingId },
      data: updates,
    });

    res.json(wedding);
  } catch (error) {
    console.error('[PATCH /wedding-info/:weddingId] Error:', error);
    res.status(500).json({ error: 'Error al actualizar información' });
  }
});

// PATCH /api/wedding-info/:weddingId/info - Actualizar weddingInfo JSON
router.patch('/:weddingId/info', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const infoUpdates = req.body;

    const current = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { weddingInfo: true },
    });

    const updatedInfo = {
      ...(current?.weddingInfo || {}),
      ...infoUpdates,
    };

    const wedding = await prisma.wedding.update({
      where: { id: weddingId },
      data: { weddingInfo: updatedInfo },
    });

    res.json(wedding);
  } catch (error) {
    console.error('[PATCH /wedding-info/:weddingId/info] Error:', error);
    res.status(500).json({ error: 'Error al actualizar weddingInfo' });
  }
});

export default router;
