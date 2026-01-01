import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { blockId } = req.query;
    
    const where = { weddingId };
    if (blockId) {
      where.blockId = blockId;
    }
    
    const moments = await prisma.specialMoment.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });
    
    res.json(moments);
  } catch (error) {
    console.error('[special-moments] Error fetching moments:', error);
    res.status(500).json({ error: 'Error al obtener momentos especiales' });
  }
});

router.post('/wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const momentData = req.body;
    
    const moment = await prisma.specialMoment.create({
      data: {
        weddingId,
        blockId: momentData.blockId,
        title: momentData.title,
        time: momentData.time || null,
        duration: momentData.duration || '15',
        songTitle: momentData.songTitle || null,
        artist: momentData.artist || null,
        spotifyId: momentData.spotifyId || null,
        responsible: momentData.responsible || null,
        status: momentData.status || 'pendiente',
        type: momentData.type || null,
        notes: momentData.notes || null
      }
    });
    
    res.status(201).json(moment);
  } catch (error) {
    console.error('[special-moments] Error creating moment:', error);
    res.status(500).json({ error: 'Error al crear momento especial' });
  }
});

router.put('/:momentId', async (req, res) => {
  try {
    const { momentId } = req.params;
    const momentData = req.body;
    
    const updates = {};
    if (momentData.blockId !== undefined) updates.blockId = momentData.blockId;
    if (momentData.title !== undefined) updates.title = momentData.title;
    if (momentData.time !== undefined) updates.time = momentData.time;
    if (momentData.duration !== undefined) updates.duration = momentData.duration;
    if (momentData.songTitle !== undefined) updates.songTitle = momentData.songTitle;
    if (momentData.artist !== undefined) updates.artist = momentData.artist;
    if (momentData.spotifyId !== undefined) updates.spotifyId = momentData.spotifyId;
    if (momentData.responsible !== undefined) updates.responsible = momentData.responsible;
    if (momentData.status !== undefined) updates.status = momentData.status;
    if (momentData.type !== undefined) updates.type = momentData.type;
    if (momentData.notes !== undefined) updates.notes = momentData.notes;
    
    const moment = await prisma.specialMoment.update({
      where: { id: momentId },
      data: updates
    });
    
    res.json(moment);
  } catch (error) {
    console.error('[special-moments] Error updating moment:', error);
    res.status(500).json({ error: 'Error al actualizar momento especial' });
  }
});

router.delete('/:momentId', async (req, res) => {
  try {
    const { momentId } = req.params;
    
    await prisma.specialMoment.delete({
      where: { id: momentId }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('[special-moments] Error deleting moment:', error);
    res.status(500).json({ error: 'Error al eliminar momento especial' });
  }
});

router.delete('/wedding/:weddingId/block/:blockId', async (req, res) => {
  try {
    const { weddingId, blockId } = req.params;
    
    await prisma.specialMoment.deleteMany({
      where: {
        weddingId,
        blockId
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('[special-moments] Error deleting block moments:', error);
    res.status(500).json({ error: 'Error al eliminar momentos del bloque' });
  }
});

export default router;
