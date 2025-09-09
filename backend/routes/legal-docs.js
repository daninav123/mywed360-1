import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { listTemplates, generateContract, saveDocumentMeta, listDocuments } from '../services/legalDocsService.js';

const router = express.Router();

router.get('/templates', requireAuth, async (_req, res) => {
  try {
    res.json({ success: true, templates: listTemplates() });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'templates error' });
  }
});

router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { weddingId, payload, saveMeta = true } = req.body || {};
    const result = await generateContract(weddingId, payload);
    if (saveMeta) {
      await saveDocumentMeta(weddingId, result.meta);
    }
    res.json({ success: true, document: result });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'generate error' });
  }
});

router.get('/list', requireAuth, async (req, res) => {
  try {
    const { weddingId, limit } = req.query;
    const docs = await listDocuments(weddingId, Number(limit) || 50);
    res.json({ success: true, documents: docs });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'list error' });
  }
});

export default router;
