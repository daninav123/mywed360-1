import express from 'express';
import admin from 'firebase-admin';
import { z } from 'zod';

const router = express.Router();

if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } catch {}
}

const postSchema = z.object({
  weddingId: z.string().min(1),
  module: z.string().min(1),
  event: z.string().min(1),
  payload: z.record(z.any()).optional(),
  meta: z.record(z.any()).optional(),
  timestamp: z.string().optional(),
});

router.post('/', async (req, res) => {
  try {
    const parsed = postSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: { code: 'invalid_payload', message: parsed.error?.errors?.[0]?.message || 'Invalid payload' } });
    }
    const { weddingId, module, event, payload = {}, meta = {}, timestamp } = parsed.data;

    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const data = {
      weddingId,
      module,
      event,
      payload,
      meta: { ...meta, source: meta?.source || 'performanceMonitor' },
      receivedAt: now,
      requestId: req?.id || null,
      processed: false,
    };
    if (timestamp) {
      try {
        const asDate = new Date(timestamp);
        if (!Number.isNaN(asDate.getTime())) data.eventAt = admin.firestore.Timestamp.fromDate(asDate);
      } catch {}
    }

    const ref = await db.collection('projectMetrics_events').add(data);
    return res.status(202).json({ success: true, id: ref.id });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'ingest_failed', message: 'Failed to ingest metric event' } });
  }
});

function parseRange(range) {
  const r = String(range || '7d').toLowerCase();
  let days = 7;
  if (r === '30d') days = 30;
  else if (r === '90d') days = 90;
  const now = new Date();
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return { from, to };
}

function fmt(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

router.get('/', async (req, res) => {
  try {
    const weddingId = String(req.query.weddingId || '').trim();
    const module = String(req.query.module || '').trim();
    const range = String(req.query.range || '7d');
    const groupBy = String(req.query.groupBy || 'daily');

    if (!weddingId || !module) {
      return res.status(400).json({ success: false, error: { code: 'missing_params', message: 'weddingId and module are required' } });
    }
    if (groupBy !== 'daily') {
      return res.status(400).json({ success: false, error: { code: 'unsupported_group_by', message: 'Only groupBy=daily is supported' } });
    }
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, error: { code: 'unauthorized', message: 'Authentication required' } });
    }
    const uid = req.user.uid;
    const weddingSnap = await admin.firestore().collection('weddings').doc(weddingId).get();
    if (!weddingSnap.exists) {
      return res.status(404).json({ success: false, error: { code: 'wedding_not_found', message: 'Wedding not found' } });
    }
    const w = weddingSnap.data() || {};
    const owners = Array.isArray(w.ownerIds) ? w.ownerIds : Object.keys(w.ownerIds || {});
    const planners = Array.isArray(w.plannerIds) ? w.plannerIds : Object.keys(w.plannerIds || {});
    const assistants = Array.isArray(w.assistantIds) ? w.assistantIds : Object.keys(w.assistantIds || {});
    const isMember = owners.includes(uid) || planners.includes(uid) || assistants.includes(uid);
    if (!isMember) {
      return res.status(403).json({ success: false, error: { code: 'forbidden', message: 'Access denied' } });
    }

    const db = admin.firestore();
    const dailyCol = db
      .collection('projectMetrics')
      .doc(weddingId)
      .collection('modules')
      .doc(module)
      .collection('daily');

    const { from, to } = parseRange(range);
    const startId = fmt(from);
    const endId = fmt(to);

    let snap;
    try {
      const FieldPath = admin.firestore.FieldPath;
      snap = await dailyCol
        .orderBy(FieldPath.documentId())
        .startAt(startId)
        .endAt(endId)
        .get();
    } catch (e) {
      snap = await dailyCol.get();
    }

    const points = [];
    for (const doc of snap.docs) {
      const id = doc.id;
      if (id < startId || id > endId) continue;
      const data = doc.data() || {};
      const totals = data.totals || {};
      points.push({ date: id, ...totals });
    }

    return res.json({
      weddingId,
      module,
      range,
      groupBy: 'daily',
      points,
      refreshedAt: new Date().toISOString(),
      source: 'metricAggregatorWorker',
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'fetch_failed', message: 'Failed to fetch metrics' } });
  }
});

export default router;
