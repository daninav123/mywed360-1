import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/notifications
router.get('/', async (_req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// POST /api/notifications { type, message }
router.post('/', async (req, res) => {
  try {
    const { type = 'info', message, title = 'MaLoveApp', payload = {}, userId, read = false } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message is required' });
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    
    const notif = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        read: Boolean(read),
        data: payload,
      },
    });

    // Disparo de push (best-effort) a las suscripciones del usuario si existen
    (async () => {
      try {
        const uid = userId || (req.user && (req.user.uid || req.user.id)) || null;
        const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
        const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
        
        if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !uid) return;

        const mod = await import('web-push').catch(() => null);
        const webpush = mod && (mod.default || mod);
        if (!webpush || !webpush.setVapidDetails) return;
        webpush.setVapidDetails('mailto:admin@maloveapp.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

        const subscriptions = await prisma.pushSubscription.findMany({
          where: { userId: uid },
        });
        
        if (subscriptions.length === 0) return;

        const url = process.env.FRONTEND_BASE_URL || 'http://localhost:5173/home';
        const payloadPush = JSON.stringify({
          title: title || 'MaLoveApp',
          body: message,
          url,
          tag: 'notification',
          data: { url },
        });

        const deletions = [];
        await Promise.all(
          subscriptions.map(async (sub) => {
            try {
              const subscription = sub.subscription;
              if (!subscription || !subscription.endpoint) return;
              await webpush.sendNotification(subscription, payloadPush);
            } catch (e) {
              if (e && (e.statusCode === 404 || e.statusCode === 410)) {
                deletions.push(prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {}));
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
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ error: 'Not found' });
    
    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating notification' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.delete({ where: { id } });
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
    const allowed = ['read', 'type', 'message', 'title', 'data'];
    const updateData = {};
    
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) {
        updateData[k] = patch[k];
      }
    }
    
    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'no-fields' });
    
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ error: 'Not found' });
    
    const updated = await prisma.notification.update({
      where: { id },
      data: updateData,
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error patching notification' });
  }
});

export default router;
