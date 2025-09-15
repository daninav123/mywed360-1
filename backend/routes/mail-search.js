import express from 'express';
import { db } from '../db.js';
import { requireMailAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/mail/search?q=term
// Búsqueda simple por asunto/cuerpo/remitente/destinatario en últimas N entradas
router.get('/search', requireMailAccess, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    if (!q || q.length < 2) return res.json([]);

    // Muestreo limitado para evitar scans grandes
    let snap;
    try {
      snap = await db.collection('mails').orderBy('date', 'desc').limit(300).get();
    } catch (_) {
      snap = await db.collection('mails').limit(300).get();
    }
    const out = [];
    snap.docs.forEach((d) => {
      const data = d.data() || {};
      const hay = `${data.subject || ''} ${data.body || ''} ${data.from || ''} ${data.to || ''}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({ id: d.id, subject: data.subject || '(Sin asunto)', from: data.from || '', date: data.date || data.createdAt || null });
      }
    });
    res.json(out.slice(0, 50));
  } catch (err) {
    console.error('Error en GET /api/mail/search:', err);
    res.status(500).json({ error: 'search-failed' });
  }
});

export default router;

