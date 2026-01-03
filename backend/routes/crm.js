import express from 'express';
import admin from 'firebase-admin';

import logger from '../utils/logger.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/sync-wedding', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const weddingId = String(body.weddingId || '').trim();
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    const reason = String(body.reason || 'manual_sync');
    const uid = req?.user?.uid || null;

    if (!weddingId) {
      return res
        .status(400)
        .json({ success: false, error: { code: 'bad_request', message: 'weddingId requerido' } });
    }

    const db = admin.firestore();
    const queueRef = db.collection('crmSyncQueue').doc();
    const { FieldValue } = await import('firebase-admin/firestore');
    const now = FieldValue.serverTimestamp();

    await queueRef.set({
      id: queueRef.id,
      weddingId,
      status: 'queued',
      payload,
      reason,
      requestedBy: uid,
      requestedAt: now,
      attempts: [],
    });

    await db
      .collection('weddings')
      .doc(weddingId)
      .set(
        {
          crm: {
            lastSyncStatus: 'queued',
            lastSyncRequestedAt: now,
            lastSyncRequestedBy: uid,
            lastSyncReason: reason,
            lastSyncPayloadKeys: Object.keys(payload || {}).slice(0, 10),
          },
        },
        { merge: true }
      );

    return res.json({ success: true, queueId: queueRef.id });
  } catch (error) {
    logger.error('[crm] sync-wedding error:', error);
    return res
      .status(500)
      .json({ success: false, error: { code: 'internal_error', message: 'Error interno' } });
  }
});

router.post('/sync-weddings/bulk', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const weddingIds = Array.isArray(body.weddingIds) ? body.weddingIds.filter(Boolean) : [];
    const context = body.context && typeof body.context === 'object' ? body.context : {};
    const uid = req?.user?.uid || null;

    if (!weddingIds.length) {
      return res
        .status(400)
        .json({ success: false, error: { code: 'bad_request', message: 'weddingIds requerido' } });
    }

    const db = admin.firestore();
    const batch = db.batch();
    const { FieldValue } = await import('firebase-admin/firestore');
    const now = FieldValue.serverTimestamp();
    const queued = [];

    weddingIds.forEach((weddingId) => {
      const queueRef = db.collection('crmSyncQueue').doc();
      batch.set(queueRef, {
        id: queueRef.id,
        weddingId,
        status: 'queued',
        payload: { bulk: true, context },
        reason: 'bulk_sync',
        requestedBy: uid,
        requestedAt: now,
        attempts: [],
      });
      queued.push(queueRef.id);

      const weddingRef = db.collection('weddings').doc(weddingId);
      batch.set(
        weddingRef,
        {
          crm: {
            lastSyncStatus: 'queued',
            lastSyncRequestedAt: now,
            lastSyncRequestedBy: uid,
            lastSyncReason: 'bulk_sync',
          },
        },
        { merge: true }
      );
    });

    await batch.commit();
    return res.json({ success: true, queued });
  } catch (error) {
    logger.error('[crm] bulk sync error:', error);
    return res
      .status(500)
      .json({ success: false, error: { code: 'internal_error', message: 'Error interno' } });
  }
});

export default router;
