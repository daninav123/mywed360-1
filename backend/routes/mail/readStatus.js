import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireMailAccess } from '../../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

async function setReadFlag(id, flag, req) {
  // Buscar mail en PostgreSQL
  const mail = await prisma.mail.findUnique({ where: { id } });
  
  if (mail) {
    await prisma.mail.update({
      where: { id },
      data: { read: flag },
    });
    return { data: mail, scope: 'global' };
  }

  return { notFound: true };
}

async function propagateToUserSubcollection(data, id, flag) {
  // Ya no necesario - Mail tiene relación directa con userId
  // PostgreSQL maneja esto automáticamente
}

// PATCH /api/mail/:id/read
router.patch('/:id/read', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const r = await setReadFlag(id, true, req);
    if (r.notFound) return res.status(404).json({ error: 'Not found' });
    if (r.scope === 'global') await propagateToUserSubcollection(r.data, id, true);
    res.json({ id, ...r.data, read: true });
  } catch (err) {
    console.error('Error en PATCH /api/mail/:id/read:', err);
    res.status(503).json({ success: false, message: 'Fallo actualizando mail', error: err?.message || String(err) });
  }
});

// POST /api/mail/:id/read (compat)
router.post('/:id/read', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const r = await setReadFlag(id, true, req);
    if (r.notFound) return res.status(404).json({ error: 'Not found' });
    if (r.scope === 'global') await propagateToUserSubcollection(r.data, id, true);
    res.json({ id, ...r.data, read: true });
  } catch (err) {
    console.error('Error en POST /api/mail/:id/read:', err);
    res.status(503).json({ success: false, message: 'Fallo actualizando mail', error: err?.message || String(err) });
  }
});

// PATCH /api/mail/:id/unread
router.patch('/:id/unread', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const r = await setReadFlag(id, false, req);
    if (r.notFound) return res.status(404).json({ error: 'Not found' });
    if (r.scope === 'global') await propagateToUserSubcollection(r.data, id, false);
    res.json({ id, ...r.data, read: false });
  } catch (err) {
    console.error('Error en PATCH /api/mail/:id/unread:', err);
    res.status(503).json({ success: false, message: 'Fallo actualizando mail', error: err?.message || String(err) });
  }
});

// POST /api/mail/:id/unread (compat)
router.post('/:id/unread', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const r = await setReadFlag(id, false, req);
    if (r.notFound) return res.status(404).json({ error: 'Not found' });
    if (r.scope === 'global') await propagateToUserSubcollection(r.data, id, false);
    res.json({ id, ...r.data, read: false });
  } catch (err) {
    console.error('Error en POST /api/mail/:id/unread:', err);
    res.status(503).json({ success: false, message: 'Fallo actualizando mail', error: err?.message || String(err) });
  }
});

// DELETE /api/mail/:id
router.delete('/:id', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const mail = await prisma.mail.findUnique({ where: { id } });
    if (!mail) {
      return res.status(404).json({ error: 'Mail no encontrado' });
    }
    await prisma.mail.delete({ where: { id } });

    // Cleanup de subcollections ya no necesario - PostgreSQL maneja esto con relaciones
    res.status(204).end();
  } catch (err) {
    console.error('Error en DELETE /api/mail/:id:', err);
    res.status(503).json({ success: false, message: 'Fallo eliminando mail', error: err?.message || String(err) });
  }
});

export default router;

