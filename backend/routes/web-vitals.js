import express from 'express';
import logger from '../logger.js';

const router = express.Router();

// Accepts single metric or an array of metrics from web-vitals
// Body shape: { metrics: [{name, value, id, label, delta, navigationType}], context?: {...} }
router.post('/', express.json({ limit: '50kb' }), async (req, res) => {
  try {
    const { metrics, context } = req.body || {};
    const list = Array.isArray(metrics) ? metrics : (metrics ? [metrics] : []);
    if (list.length === 0) return res.status(400).json({ success: false, error: 'no_metrics' });
    // Log summarized metrics (avoid PII)
    for (const m of list) {
      const { name, value, id, label, delta, navigationType } = m || {};
      logger.info(`[web-vitals] ${name}=${value} delta=${delta} id=${id} label=${label} nav=${navigationType || ''}`);
    }
    // Best-effort: could store to a time-series DB in the future
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
});

export default router;

