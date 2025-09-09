import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { importCSV, importVCF, health } from '../services/contactsService.js';

const router = express.Router();

router.post('/import/csv', requireAuth, async (req, res) => {
  try {
    const { weddingId, csvText, mapping } = req.body || {};
    const result = await importCSV(weddingId, csvText, mapping || {});
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'importCSV error' });
  }
});

router.post('/import/vcf', requireAuth, async (req, res) => {
  try {
    const { weddingId, vcfText } = req.body || {};
    const result = await importVCF(weddingId, vcfText);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'importVCF error' });
  }
});

router.get('/health', async (_req, res) => {
  const h = await health();
  res.status(h.ok ? 200 : 503).json(h);
});

export default router;
