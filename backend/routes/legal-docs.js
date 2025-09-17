import express from 'express';
import { z } from 'zod';
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
    const bodySchema = z.object({
      weddingId: z.string().min(1, 'weddingId required'),
      saveMeta: z.boolean().optional().default(true),
      payload: z.object({
        type: z.string().min(1),
        subtype: z.string().optional(),
        title: z.string().min(1),
        data: z.record(z.any()).optional(),
      }),
    });
    const { weddingId, payload, saveMeta } = bodySchema.parse(req.body || {});
    const result = await generateContract(weddingId, payload);
    if (saveMeta) {
      await saveDocumentMeta(weddingId, result.meta);
    }
    res.json({ success: true, document: result });
  } catch (e) {
    const msg = e?.issues ? e.issues.map(i => i.message).join(', ') : (e?.message || 'generate error');
    res.status(400).json({ success: false, error: msg });
  }
});

router.get('/list', requireAuth, async (req, res) => {
  try {
    const qSchema = z.object({
      weddingId: z.string().min(1, 'weddingId required'),
      limit: z.coerce.number().int().positive().max(200).optional(),
    });
    const { weddingId, limit } = qSchema.parse(req.query || {});
    const docs = await listDocuments(weddingId, limit || 50);
    res.json({ success: true, documents: docs });
  } catch (e) {
    const msg = e?.issues ? e.issues.map(i => i.message).join(', ') : (e?.message || 'list error');
    res.status(400).json({ success: false, error: msg });
  }
});

export default router;
