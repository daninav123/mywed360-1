import express from 'express';
import { db } from '../db.js';
import { requireMailAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

// Email stats: totals by folder and unread
router.get('/stats', requireMailAccess, async (_req, res) => {
  try {
    const byFolder = {};
    const folders = ['inbox', 'sent', 'trash', 'archive'];
    for (const f of folders) byFolder[f] = 0;

    let total = 0;
    let unread = 0;

    // Try counting per folder
    for (const f of folders) {
      try {
        const snap = await db.collection('mails').where('folder', '==', f).get();
        byFolder[f] = snap.size;
        total += snap.size;
        snap.docs.forEach(d => { if ((d.data() || {}).read === false) unread += 1; });
      } catch {}
    }

    // If totals are zero (no standard folders), compute from all
    if (total === 0) {
      const snap = await db.collection('mails').get();
      total = snap.size;
      snap.docs.forEach(d => {
        const data = d.data() || {};
        const f = data.folder || 'inbox';
        byFolder[f] = (byFolder[f] || 0) + 1;
        if (data.read === false) unread += 1;
      });
    }

    res.json({ total, unread, byFolder });
  } catch (e) {
    console.error('GET /api/mail/stats', e);
    res.status(500).json({ error: 'stats-failed' });
  }
});

export default router;

