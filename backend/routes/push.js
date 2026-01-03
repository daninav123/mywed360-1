import express from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/public-key', async (_req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || '';
  if (!key) return res.status(200).json({ key: null });
  return res.json({ key });
});

router.post('/subscribe', async (req, res) => {
  try {
    const sub = req.body;
    if (!sub || !sub.endpoint) return res.status(400).json({ error: 'invalid-subscription' });
    const uid = (req.user && (req.user.uid || req.user.id)) || null;
    
    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: {
        subscription: sub,
        userId: uid,
      },
      create: {
        endpoint: sub.endpoint,
        subscription: sub,
        userId: uid,
      },
    });
    
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
    
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: sub.endpoint },
    });
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
