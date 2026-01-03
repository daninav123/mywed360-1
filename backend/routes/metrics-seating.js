import express from 'express';
import { incCounter } from '../services/metrics.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import admin from 'firebase-admin';

const router = express.Router();

// POST /api/metrics/seating
// Body: { event: 'assign', result: 'success' | 'blocked', tab?: 'ceremony' | 'banquet' }
router.post('/seating', requireAuth, async (req, res) => {
  try {
    const { event, result, tab, weddingId } = req.body || {};
    if (!weddingId || typeof weddingId !== 'string') {
      return res.status(400).json({ error: 'weddingId-required' });
    }
    // Verify membership (owner/planner/assistant) or admin
    const uid = req?.user?.uid || '';
    const userRole = (req?.userProfile?.role || '').toLowerCase();
    const isAdmin = userRole === 'admin';
    if (!isAdmin) {
      try {
        const snap = await admin.firestore().collection('weddings').doc(weddingId).get();
        if (!snap.exists) return res.status(404).json({ error: 'wedding-not-found' });
        const data = snap.data() || {};
        const owners = Array.isArray(data.ownerIds) ? data.ownerIds : [];
        const planners = Array.isArray(data.plannerIds) ? data.plannerIds : [];
        const assistants = Array.isArray(data.assistantIds) ? data.assistantIds : [];
        const allowed = owners.includes(uid) || planners.includes(uid) || assistants.includes(uid);
        if (!allowed) return res.status(403).json({ error: 'forbidden' });
      } catch (e) {
        return res.status(500).json({ error: 'membership-check-failed' });
      }
    }
    if (event === 'assign' && (result === 'success' || result === 'blocked')) {
      try {
        await incCounter(
          'seating_assignments_total',
          { result: String(result), tab: String(tab || 'unknown') },
          1,
          'Seating assignments (success/blocked) by tab',
          ['result', 'tab']
        );
      } catch {}
      return res.json({ ok: true });
    }
    return res.status(400).json({ error: 'invalid-payload' });
  } catch (err) {
    return res.status(500).json({ error: 'metrics-failed' });
  }
});

export default router;
