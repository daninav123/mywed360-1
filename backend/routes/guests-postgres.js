import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/guests/wedding/:weddingId - Obtener todos los invitados de una boda
router.get('/wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;

    const guests = await prisma.guest.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(guests);
  } catch (error) {
    console.error('[GET /guests/wedding/:weddingId] Error:', error);
    res.status(500).json({ error: 'Error al obtener invitados' });
  }
});

// POST /api/guests/wedding/:weddingId - Crear invitado
router.post('/wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const guestData = req.body;

    const guest = await prisma.guest.create({
      data: {
        weddingId,
        name: guestData.name,
        email: guestData.email || null,
        phone: guestData.phone || null,
        confirmed: guestData.confirmed || false,
        status: guestData.status || 'pending',
        companions: guestData.companions || 0,
        dietaryRestrictions: guestData.dietaryRestrictions || null,
        notes: guestData.notes || null,
        tableNumber: guestData.tableNumber || null,
        seatNumber: guestData.seatNumber || null,
        userId: guestData.userId || null,
      },
    });

    res.status(201).json(guest);
  } catch (error) {
    console.error('[POST /guests/wedding/:weddingId] Error:', error);
    res.status(500).json({ error: 'Error al crear invitado' });
  }
});

// PUT /api/guests/:guestId - Actualizar invitado
router.put('/:guestId', async (req, res) => {
  try {
    const { guestId } = req.params;
    const updates = req.body;

    const guest = await prisma.guest.update({
      where: { id: guestId },
      data: updates,
    });

    res.json(guest);
  } catch (error) {
    console.error('[PUT /guests/:guestId] Error:', error);
    res.status(500).json({ error: 'Error al actualizar invitado' });
  }
});

// DELETE /api/guests/:guestId - Eliminar invitado
router.delete('/:guestId', async (req, res) => {
  try {
    const { guestId } = req.params;

    await prisma.guest.delete({
      where: { id: guestId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[DELETE /guests/:guestId] Error:', error);
    res.status(500).json({ error: 'Error al eliminar invitado' });
  }
});

// PUT /api/guests/wedding/:weddingId/bulk - Actualización masiva
router.put('/wedding/:weddingId/bulk', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { guests } = req.body;

    const updates = guests.map((guest) =>
      prisma.guest.update({
        where: { id: guest.id },
        data: guest,
      })
    );

    await Promise.all(updates);

    const updatedGuests = await prisma.guest.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(updatedGuests);
  } catch (error) {
    console.error('[PUT /guests/wedding/:weddingId/bulk] Error:', error);
    res.status(500).json({ error: 'Error en actualización masiva' });
  }
});

export default router;
