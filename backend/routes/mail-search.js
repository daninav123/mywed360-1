import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import { requireMailAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/mail/search?q=term
// Búsqueda simple por asunto/cuerpo/remitente/destinatario en últimas N entradas
router.get('/search', requireMailAccess, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    if (!q || q.length < 2) return res.json([]);

    // Búsqueda en PostgreSQL usando Prisma
    const mails = await prisma.mail.findMany({
      take: 300,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        subject: true,
        body: true,
        from: true,
        to: true,
        date: true,
        createdAt: true,
      },
    });
    
    const out = [];
    for (const mail of mails) {
      const hay = `${mail.subject || ''} ${mail.body || ''} ${mail.from || ''} ${mail.to || ''}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({
          id: mail.id,
          subject: mail.subject || '(Sin asunto)',
          from: mail.from || '',
          date: mail.date || mail.createdAt || null,
        });
      }
    }
    
    res.json(out.slice(0, 50));
  } catch (err) {
    console.error('Error en GET /api/mail/search:', err);
    res.status(500).json({ error: 'search-failed' });
  }
});

export default router;

