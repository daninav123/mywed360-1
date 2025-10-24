import express from 'express';
import admin from 'firebase-admin';
import { db } from '../db.js';

const router = express.Router();

// GET /api/notifications
router.get('/', async (_req, res) => {
  try {
    const snapshot = await db
      .collection('notifications')
      .orderBy('date', 'desc')
      .get();
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// POST /api/notifications { type, message }
router.post('/', async (req, res) => {
  try {
    const { type = 'info', message, payload = {}, date: dateFromClient, read = false } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message is required' });
    const date = dateFromClient || new Date().toISOString();
    const docRef = await db.collection('notifications').add({
      type,
      message,
      date,
      read: Boolean(read),
      payload,
    });
    const notif = { id: docRef.id, type, message, date, read: Boolean(read), payload };

    // Disparo de push (best-effort) a las suscripciones del usuario si existen
    (async () => {
      try {
        const uid = (req.user && (req.user.uid || req.user.id)) || null;
        // Obtener claves VAPID
        let VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
        let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
        if ((!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) && process.env.NODE_ENV !== 'production') {
          try {
            const cfgRef = db.collection('config').doc('pushVapid');
            const snap = await cfgRef.get();
            if (snap.exists) {
              const d = snap.data();
              VAPID_PUBLIC_KEY = d.publicKey || VAPID_PUBLIC_KEY;
              VAPID_PRIVATE_KEY = d.privateKey || VAPID_PRIVATE_KEY;
            } else {
              const mod = await import('web-push').catch(() => null);
              const webpushGen = mod && (mod.default || mod);
              if (webpushGen && webpushGen.generateVAPIDKeys) {
                const { publicKey, privateKey } = webpushGen.generateVAPIDKeys();
                await cfgRef.set({
                  publicKey,
                  privateKey,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                VAPID_PUBLIC_KEY = publicKey;
                VAPID_PRIVATE_KEY = privateKey;
              }
            }
          } catch {}
        }
        if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return; // no configurado

        const mod2 = await import('web-push').catch(() => null);
        const webpush = mod2 && (mod2.default || mod2);
        if (!webpush || !webpush.setVapidDetails) return;
        webpush.setVapidDetails('mailto:admin@maloveapp.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

        // Seleccionar suscripciones (del usuario si disponible; si no, una muestra global)
        let subsSnap;
        if (uid) {
          subsSnap = await db.collection('pushSubscriptions').where('uid', '==', uid).get();
        } else {
          subsSnap = await db.collection('pushSubscriptions').limit(5).get();
        }
        if (subsSnap.empty) return;

        const url = process.env.FRONTEND_BASE_URL || 'http://localhost:5173/home';
        const payloadPush = JSON.stringify({
          title: 'MaLoveApp',
          body: message,
          url,
          tag: 'notification',
          data: { url },
        });

        const deletions = [];
        await Promise.all(
          subsSnap.docs.map(async (d) => {
            try {
              const sub = d.data().subscription;
              if (!sub || !sub.endpoint) return;
              await webpush.sendNotification(sub, payloadPush);
            } catch (e) {
              // Limpia suscripciones inservibles
              if (e && (e.statusCode === 404 || e.statusCode === 410)) {
                deletions.push(d.ref.delete().catch(() => {}));
              }
            }
          })
        );
        if (deletions.length) await Promise.all(deletions);
      } catch {}
    })();

    res.status(201).json(notif);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding notification' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('notifications').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    await docRef.update({ read: true });
    res.json({ id, ...doc.data(), read: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating notification' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('notifications').doc(id).delete();
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting notification' });
  }
});

// PATCH /api/notifications/:id (actualización genérica)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body || {};
    const allowed = ['read', 'type', 'message', 'title', 'payload', 'date'];
    const data = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) data[k] = patch[k];
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'no-fields' });
    const ref = db.collection('notifications').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    await ref.set(data, { merge: true });
    return res.json({ id, ...snap.data(), ...data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error patching notification' });
  }
});

export default router;
