import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    
    const events = await prisma.timelineEvent.findMany({
      where: { weddingId },
      orderBy: { order: 'asc' }
    });
    
    res.json(events);
  } catch (error) {
    console.error('[timeline] Error fetching timeline:', error);
    res.status(500).json({ error: 'Error al obtener timeline' });
  }
});

router.post('/wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const eventData = req.body;
    
    const event = await prisma.timelineEvent.create({
      data: {
        weddingId,
        name: eventData.name,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        status: eventData.status || 'on-time',
        order: eventData.order || 0,
        moments: eventData.moments || null,
        alerts: eventData.alerts || null,
        notes: eventData.notes || null
      }
    });
    
    res.status(201).json(event);
  } catch (error) {
    console.error('[timeline] Error creating event:', error);
    res.status(500).json({ error: 'Error al crear evento' });
  }
});

router.put('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventData = req.body;
    
    const updates = {};
    if (eventData.name !== undefined) updates.name = eventData.name;
    if (eventData.startTime !== undefined) updates.startTime = eventData.startTime;
    if (eventData.endTime !== undefined) updates.endTime = eventData.endTime;
    if (eventData.status !== undefined) updates.status = eventData.status;
    if (eventData.order !== undefined) updates.order = eventData.order;
    if (eventData.moments !== undefined) updates.moments = eventData.moments;
    if (eventData.alerts !== undefined) updates.alerts = eventData.alerts;
    if (eventData.notes !== undefined) updates.notes = eventData.notes;
    
    const event = await prisma.timelineEvent.update({
      where: { id: eventId },
      data: updates
    });
    
    res.json(event);
  } catch (error) {
    console.error('[timeline] Error updating event:', error);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
});

router.delete('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    await prisma.timelineEvent.delete({
      where: { id: eventId }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('[timeline] Error deleting event:', error);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
});

router.put('/wedding/:weddingId/bulk', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { events } = req.body;
    
    await prisma.timelineEvent.deleteMany({
      where: { weddingId }
    });
    
    const newEvents = await prisma.timelineEvent.createMany({
      data: events.map(event => ({
        weddingId,
        name: event.name,
        startTime: event.startTime,
        endTime: event.endTime,
        status: event.status || 'on-time',
        order: event.order || 0,
        moments: event.moments || null,
        alerts: event.alerts || null,
        notes: event.notes || null
      }))
    });
    
    const updatedEvents = await prisma.timelineEvent.findMany({
      where: { weddingId },
      orderBy: { order: 'asc' }
    });
    
    res.json(updatedEvents);
  } catch (error) {
    console.error('[timeline] Error bulk updating timeline:', error);
    res.status(500).json({ error: 'Error al actualizar timeline' });
  }
});

export default router;
