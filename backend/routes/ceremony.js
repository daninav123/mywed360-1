import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/ceremony/:weddingId - Obtener todos los datos de ceremonia
router.get('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { ceremonyData: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    res.json(wedding.ceremonyData || { checklist: null, timeline: null, texts: null });
  } catch (error) {
    console.error('[GET /ceremony/:weddingId] Error:', error);
    res.status(500).json({ error: 'Error al obtener datos de ceremonia' });
  }
});

// PUT /api/ceremony/:weddingId - Actualizar datos completos
router.put('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const ceremonyData = req.body;

    const wedding = await prisma.wedding.update({
      where: { id: weddingId },
      data: { ceremonyData },
    });

    res.json(wedding.ceremonyData);
  } catch (error) {
    console.error('[PUT /ceremony/:weddingId] Error:', error);
    res.status(500).json({ error: 'Error al actualizar ceremonia' });
  }
});

// PATCH /api/ceremony/:weddingId/checklist - Actualizar solo checklist
router.patch('/:weddingId/checklist', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const checklist = req.body;

    const current = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { ceremonyData: true },
    });

    const updatedCeremonyData = {
      ...(current?.ceremonyData || {}),
      checklist: checklist,
    };

    const wedding = await prisma.wedding.update({
      where: { id: weddingId },
      data: { ceremonyData: updatedCeremonyData },
    });

    res.json(wedding.ceremonyData);
  } catch (error) {
    console.error('[PATCH /ceremony/:weddingId/checklist] Error:', error);
    res.status(500).json({ error: 'Error al actualizar checklist' });
  }
});

// PATCH /api/ceremony/:weddingId/timeline - Actualizar solo timeline
router.patch('/:weddingId/timeline', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const timeline = req.body;

    const current = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { ceremonyData: true },
    });

    const updatedCeremonyData = {
      ...(current?.ceremonyData || {}),
      timeline: timeline,
    };

    const wedding = await prisma.wedding.update({
      where: { id: weddingId },
      data: { ceremonyData: updatedCeremonyData },
    });

    res.json(wedding.ceremonyData);
  } catch (error) {
    console.error('[PATCH /ceremony/:weddingId/timeline] Error:', error);
    res.status(500).json({ error: 'Error al actualizar timeline' });
  }
});

// PATCH /api/ceremony/:weddingId/texts - Actualizar solo textos
router.patch('/:weddingId/texts', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const texts = req.body;

    const current = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { ceremonyData: true },
    });

    const updatedCeremonyData = {
      ...(current?.ceremonyData || {}),
      texts: texts,
    };

    const wedding = await prisma.wedding.update({
      where: { id: weddingId },
      data: { ceremonyData: updatedCeremonyData },
    });

    res.json(wedding.ceremonyData);
  } catch (error) {
    console.error('[PATCH /ceremony/:weddingId/texts] Error:', error);
    res.status(500).json({ error: 'Error al actualizar textos' });
  }
});

export default router;
