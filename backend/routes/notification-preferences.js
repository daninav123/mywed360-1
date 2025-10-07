import express from 'express';
import admin from 'firebase-admin';
import logger from '../logger.js';

const router = express.Router();
const db = admin.firestore();

// GET /api/notification-preferences
router.get('/', async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ success: false, error: { code: 'unauthenticated', message: 'Auth required' } });
    const snap = await db.collection('notificationPreferences').doc(uid).get();
    const data = snap.exists ? snap.data() : { channels: { email: true, inapp: true, push: false }, quietHours: null };
    res.json({ success: true, preferences: data });
  } catch (err) {
    logger.error('notif-prefs-get', err);
    res.status(500).json({ success: false, error: { code: 'internal-error', message: 'Failed to load preferences', details: err?.message || String(err) } });
  }
});

// PUT /api/notification-preferences
router.put('/', async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ success: false, error: { code: 'unauthenticated', message: 'Auth required' } });
    const { channels, quietHours } = req.body || {};
    await db.collection('notificationPreferences').doc(uid).set({ channels, quietHours, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    res.json({ success: true });
  } catch (err) {
    logger.error('notif-prefs-put', err);
    res.status(500).json({ success: false, error: { code: 'internal-error', message: 'Failed to update preferences', details: err?.message || String(err) } });
  }
});

export default router;

