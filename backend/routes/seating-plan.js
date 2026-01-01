import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/seating-plan/:weddingId - Obtener plan de mesas
router.get('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { seatingData: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    res.json(wedding.seatingData || { tables: [], layout: null });
  } catch (error) {
    console.error('[GET /seating-plan/:weddingId] Error:', error);
    res.status(500).json({ error: 'Error al obtener plan de mesas' });
  }
});

// PUT /api/seating-plan/:weddingId - Actualizar plan completo
router.put('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const seatingData = req.body;

    const wedding = await prisma.wedding.update({
      where: { id: weddingId },
      data: { seatingData },
    });

    res.json(wedding.seatingData);
  } catch (error) {
    console.error('[PUT /seating-plan/:weddingId] Error:', error);
    res.status(500).json({ error: 'Error al actualizar plan de mesas' });
  }
});

// PATCH /api/seating-plan/:weddingId/tables - Actualizar solo tablas
router.patch('/:weddingId/tables', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { tables } = req.body;

    const current = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { seatingData: true },
    });

    const updatedSeatingData = {
      ...(current?.seatingData || {}),
      tables: tables,
    };

    const wedding = await prisma.wedding.update({
      where: { id: weddingId },
      data: { seatingData: updatedSeatingData },
    });

    res.json(wedding.seatingData);
  } catch (error) {
    console.error('[PATCH /seating-plan/:weddingId/tables] Error:', error);
    res.status(500).json({ error: 'Error al actualizar tablas' });
  }
});

export default router;
