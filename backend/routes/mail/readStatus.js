import express from 'express';
import { db } from '../../db.js';
import { requireMailAccess } from '../../middleware/authMiddleware.js';

const router = express.Router();

async function setReadFlag(id, flag, req) {
  // Intentar primero en la colección global
  const docRef = db.collection('mails').doc(id);
  const doc = await docRef.get();
  if (doc.exists) {
    const data = doc.data();
    await docRef.update({ read: flag });
    return { data, scope: 'global' };
  }

  // Fallback: algunos mensajes existen sólo en la subcolección del usuario
  try {
    const uid = req?.user?.uid || null;
    if (uid) {
      const userDocRef = db.collection('users').doc(uid).collection('mails').doc(id);
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        await userDocRef.set({ read: flag }, { merge: true });
        const data = userDoc.data() || {};
        return { data, scope: 'user', uid };
      }
    }
  } catch (_) {}

  return { notFound: true };
}

async function propagateToUserSubcollection(data, id, flag) {
  try {
    const targetEmail = data.folder === 'sent' ? data.from : data.to;
    if (targetEmail) {
      let uid = null;
      const byAlias = await db.collection('users').where('myWed360Email', '==', targetEmail).limit(1).get();
      if (!byAlias.empty) {
        uid = byAlias.docs[0].id;
      } else {
        const byLogin = await db.collection('users').where('email', '==', targetEmail).limit(1).get();
        if (!byLogin.empty) uid = byLogin.docs[0].id;
      }
      if (uid) {
        await db.collection('users').doc(uid).collection('mails').doc(id).set({ read: flag }, { merge: true });
      }
    }
  } catch (e) {
    console.warn('No se pudo propagar read/unread a subcolección de usuario:', e?.message || e);
  }
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
    const docRef = db.collection('mails').doc(id);
    const snap = await docRef.get();
    const data = snap.exists ? snap.data() : null;
    await docRef.delete();

    try {
      if (data) {
        const targetEmail = data.folder === 'sent' ? data.from : data.to;
        if (targetEmail) {
          let uid = null;
          const byAlias = await db.collection('users').where('myWed360Email', '==', targetEmail).limit(1).get();
          if (!byAlias.empty) {
            uid = byAlias.docs[0].id;
          } else {
            const byLogin = await db.collection('users').where('email', '==', targetEmail).limit(1).get();
            if (!byLogin.empty) uid = byLogin.docs[0].id;
          }
          if (uid) {
            await db.collection('users').doc(uid).collection('mails').doc(id).delete();
          }
        }
      }
    } catch (e) {
      console.warn('No se pudo eliminar de subcolección de usuario:', e?.message || e);
    }
    res.status(204).end();
  } catch (err) {
    console.error('Error en DELETE /api/mail/:id:', err);
    res.status(503).json({ success: false, message: 'Fallo eliminando mail', error: err?.message || String(err) });
  }
});

export default router;

