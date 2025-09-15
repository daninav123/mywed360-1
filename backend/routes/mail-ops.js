import express from 'express';
import { db } from '../db.js';
import { requireMailAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

// PUT /api/mail/:id/folder  { folder }
router.put('/:id/folder', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { folder = 'inbox' } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id-required' });
    await db.collection('mails').doc(id).set({ folder }, { merge: true });
    res.json({ ok: true });
  } catch (e) {
    console.error('PUT /api/mail/:id/folder', e);
    res.status(500).json({ error: 'update-folder-failed' });
  }
});

// POST /api/mail/:id/tags  { add?: [string], remove?: [string] }
router.post('/:id/tags', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { add = [], remove = [] } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id-required' });
    const ref = db.collection('mails').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });
    const data = snap.data() || {};
    let tags = Array.isArray(data.tags) ? data.tags.slice() : [];
    for (const t of add) {
      const name = String(t || '').trim();
      if (name && !tags.includes(name)) tags.push(name);
    }
    if (remove && remove.length) {
      const setRemove = new Set(remove.map((x) => String(x || '').trim()));
      tags = tags.filter((t) => !setRemove.has(String(t || '').trim()));
    }
    await ref.set({ tags }, { merge: true });
    res.json({ ok: true, tags });
  } catch (e) {
    console.error('POST /api/mail/:id/tags', e);
    res.status(500).json({ error: 'update-tags-failed' });
  }
});

export default router;

// DELETE /api/mail/:id  -> Eliminar mensaje
router.delete('/:id', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id-required' });

    // Eliminar del buzón global
    await db.collection('mails').doc(id).delete();

    // Eliminar de subcolección del usuario si aplica
    try {
      const uid = req.user?.uid;
      if (uid) {
        await db.collection('users').doc(uid).collection('mails').doc(id).delete();
      }
    } catch (_) {
      // best-effort
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/mail/:id', e);
    res.status(500).json({ error: 'delete-mail-failed' });
  }
});
