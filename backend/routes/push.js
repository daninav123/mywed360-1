import express from 'express';
import admin from 'firebase-admin';
import logger from '../utils/logger.js';

if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } catch {}
}
const db = admin.firestore();
const router = express.Router();

// Dev helper: ensure VAPID keys exist in Firestore when allowed
async function ensureDevVapidKeys() {
  const allowDev =
    process.env.ALLOW_MOCK_TOKENS === 'true' || process.env.NODE_ENV !== 'production';
  if (!allowDev) return null;
  try {
    const docRef = db.collection('config').doc('pushVapid');
    const snap = await docRef.get();
    if (snap.exists) return snap.data();
    let webpush;
    try {
      const mod = await import('web-push');
      webpush = mod.default || mod;
    } catch {
      return null; // web-push no instalado
    }
    const { publicKey, privateKey } = webpush.generateVAPIDKeys();
    const payload = {
      publicKey,
      privateKey,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await docRef.set(payload);
    return payload;
  } catch (e) {
    logger.warn('ensureDevVapidKeys error', e?.message || e);
    return null;
  }
}

router.get('/public-key', async (_req, res) => {
  let key = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || '';
  if (!key) {
    // intentar cargar/generar dev keys
    const dev = await ensureDevVapidKeys();
    key = dev?.publicKey || '';
  }
  if (!key) return res.status(200).json({ key: null });
  return res.json({ key });
});

router.post('/subscribe', async (req, res) => {
  try {
    const sub = req.body;
    if (!sub || !sub.endpoint) return res.status(400).json({ error: 'invalid-subscription' });
    const uid = (req.user && (req.user.uid || req.user.id)) || 'anon';
    const docId = Buffer.from(sub.endpoint).toString('base64').replace(/=+$/, '');
    await db.collection('pushSubscriptions').doc(docId).set(
      {
        uid,
        subscription: sub,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return res.json({ ok: true });
  } catch (e) {
    logger.warn('push-subscribe error', e.message);
    return res.status(500).json({ error: 'subscribe-failed' });
  }
});

router.post('/unsubscribe', async (req, res) => {
  try {
    const sub = req.body;
    if (!sub || !sub.endpoint) return res.status(400).json({ error: 'invalid-subscription' });
    const docId = Buffer.from(sub.endpoint).toString('base64').replace(/=+$/, '');
    await db.collection('pushSubscriptions').doc(docId).delete();
    return res.json({ ok: true });
  } catch (e) {
    logger.warn('push-unsubscribe error', e.message);
    return res.status(500).json({ error: 'unsubscribe-failed' });
  }
});

router.post('/test', async (req, res) => {
  try {
    let VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
    let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      const dev = await ensureDevVapidKeys();
      if (dev) {
        VAPID_PUBLIC_KEY = dev.publicKey;
        VAPID_PRIVATE_KEY = dev.privateKey;
      }
    }
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(503).json({ error: 'vapid-not-configured' });
    }
    let webpush;
    try {
      const mod = await import('web-push');
      webpush = mod.default || mod;
    } catch (e) {
      return res.status(503).json({ error: 'web-push-not-installed' });
    }
    webpush.setVapidDetails('mailto:admin@maloveapp.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    const { endpoint } = req.body || {};
    let subDoc;
    if (endpoint) {
      const id = Buffer.from(endpoint).toString('base64').replace(/=+$/, '');
      subDoc = await db.collection('pushSubscriptions').doc(id).get();
    } else {
      const snap = await db.collection('pushSubscriptions').limit(1).get();
      if (!snap.empty) subDoc = snap.docs[0];
    }
    if (!subDoc || !subDoc.exists) return res.status(404).json({ error: 'no-subscription' });
    const subscription = subDoc.data().subscription;
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: 'MaLoveApp',
        body: 'Notificación de prueba',
        url: process.env.FRONTEND_BASE_URL || 'http://localhost:5173/home',
      })
    );
    return res.json({ ok: true });
  } catch (e) {
    logger.warn('push-test error', e.message);
    return res.status(500).json({ error: 'push-test-failed' });
  }
});

// Estado básico de push: VAPID configured y número de suscripciones
router.get('/status', async (_req, res) => {
  try {
    const hasVapid = !!(process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY);
    const snap = await db.collection('pushSubscriptions').limit(1).get();
    const countApprox = snap.size; // nota: aproximado
    res.json({ vapid: hasVapid, subscriptionsSampled: countApprox });
  } catch (e) {
    res.status(200).json({ vapid: false, subscriptionsSampled: 0 });
  }
});

export default router;
