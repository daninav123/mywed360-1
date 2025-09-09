import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { listRules, upsertRule, evaluateTrigger, health } from '../services/automationService.js';

const router = express.Router();

// Lista reglas de automatización por boda
router.get('/rules', requireAuth, async (req, res) => {
  try {
    const weddingId = req.query.weddingId || req.userProfile?.activeWedding || req.user?.weddingId;
    const rules = await listRules(weddingId);
    res.json({ success: true, rules });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'listRules error' });
  }
});

// Crea/actualiza una regla
router.post('/rules', requireAuth, async (req, res) => {
  try {
    const { weddingId, rule } = req.body;
    const saved = await upsertRule(weddingId, rule);
    res.json({ success: true, rule: saved });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'upsertRule error' });
  }
});

// Evalúa un trigger y devuelve acciones sugeridas
router.post('/evaluate', requireAuth, async (req, res) => {
  try {
    const { weddingId, trigger } = req.body;
    const result = await evaluateTrigger(weddingId, trigger);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'evaluate error' });
  }
});

router.get('/health', async (_req, res) => {
  const h = await health();
  res.status(h.ok ? 200 : 503).json(h);
});

export default router;
