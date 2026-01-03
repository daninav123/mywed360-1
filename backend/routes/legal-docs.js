import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  sendSuccess,
  sendError,
  sendInternalError,
  sendValidationError,
} from '../utils/apiResponse.js';
import { listTemplates, generateContract, saveDocumentMeta, listDocuments } from '../services/legalDocsService.js';

const router = express.Router();

router.get('/templates', requireAuth, async (_req, res) => {
  try {
    return sendSuccess(res, { templates: listTemplates() });
    return sendSuccess(req, res, { templates: listTemplates() });
  } catch (e) {
    return sendInternalError(req, res, e);
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
    return sendSuccess(req, res, { document: result });
  } catch (e) {
    const msg = e?.issues ? e.issues.map(i => i.message).join(', ') : (e?.message || 'generate error');
    return sendValidationError(req, res, e?.issues || [{ message: msg }]);
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
