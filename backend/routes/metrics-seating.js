import express from 'express';
import { incCounter } from '../services/metrics.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/metrics/seating
// Body: { event: 'assign', result: 'success' | 'blocked', tab?: 'ceremony' | 'banquet' }
router.post('/seating', optionalAuth, async (req, res) => {
  try {
    const { event, result, tab } = req.body || {};
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
