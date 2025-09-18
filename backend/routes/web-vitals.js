import express from 'express';
import logger from '../logger.js';
import { getOrCreateCounter, getOrCreateHistogram } from '../services/metrics.js';

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
      // Best-effort Prometheus metrics
      try {
        const c = await getOrCreateCounter(
          'web_vitals_total',
          'Total de métricas web-vitals recibidas',
          ['name', 'label']
        );
        if (c) c.labels({ name: String(name || 'unknown'), label: String(label || 'unknown') }).inc(1);

        const h = await getOrCreateHistogram(
          'web_vitals_value',
          'Valores de web-vitals',
          ['name', 'label'],
          [1, 10, 50, 100, 200, 500, 1000, 2000]
        );
        if (h && typeof value === 'number') h.labels({ name: String(name || 'unknown'), label: String(label || 'unknown') }).observe(value);
      } catch {}
    }
    // Best-effort: could store to a time-series DB in the future
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
});

export default router;
