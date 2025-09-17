import express from 'express';
import { db } from '../db.js';
import { requireMailAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

function hasPrivilegedRole(profile) {
  const role = String((profile && profile.role) || '').toLowerCase();
  return role === 'admin' || role === 'planner';
}

function isOwner(profile, mailData) {
  if (!profile || !mailData) return false;
  const myAlias = String(profile.myWed360Email || '').toLowerCase();
  const myLogin = String(profile.email || '').toLowerCase();
  const target = String(mailData.folder === 'sent' ? (mailData.from || '') : (mailData.to || '')).toLowerCase();
  return !!target && (target === myAlias || target === myLogin);
}

// PUT /api/mail/:id/folder  { folder }
router.put('/:id/folder', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { folder = 'inbox' } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id-required' });
    const ref = db.collection('mails').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });
    const data = snap.data() || {};
    const profile = req.userProfile || {};
    if (!hasPrivilegedRole(profile) && !isOwner(profile, data)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    await ref.set({ folder }, { merge: true });
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
    const profile = req.userProfile || {};
    if (!hasPrivilegedRole(profile) && !isOwner(profile, data)) {
      return res.status(403).json({ error: 'forbidden' });
    }
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
    const ref = db.collection('mails').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });
    const data = snap.data() || {};
    const profile = req.userProfile || {};
    if (!hasPrivilegedRole(profile) && !isOwner(profile, data)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    await ref.delete();

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
