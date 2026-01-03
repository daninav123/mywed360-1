import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { listRules, upsertRule, evaluateTrigger, health } from '../services/automationService.js';
import {
  getAnniversaryConfig,
  updateAnniversaryConfig,
  runAnniversaryAutomation,
} from '../services/automationAnniversaryService.js';
import {
  getPartnerSummaryConfig,
  updatePartnerSummaryConfig,
  runPartnerSummaryAutomation,
} from '../services/automationPartnerSummaryService.js';

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

router.get('/anniversary/config', requireAuth, async (_req, res) => {
  try {
    const data = await getAnniversaryConfig();
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(400).json({ success: false, error: error?.message || 'anniversary_config_failed' });
  }
});

router.put('/anniversary/config', requireAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await updateAnniversaryConfig(payload, req.userProfile || req.user || {});
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error?.message || 'anniversary_update_failed' });
  }
});

router.post('/anniversary/run', requireAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await runAnniversaryAutomation(payload, req.userProfile || req.user || {});
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error?.message || 'anniversary_run_failed' });
  }
});

router.get('/partner-summary/config', requireAuth, async (_req, res) => {
  try {
    const data = await getPartnerSummaryConfig();
    res.json({ success: true, ...data });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, error: error?.message || 'partner_summary_config_failed' });
  }
});

router.put('/partner-summary/config', requireAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await updatePartnerSummaryConfig(payload, req.userProfile || req.user || {});
    res.json({ success: true, ...result });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, error: error?.message || 'partner_summary_update_failed' });
  }
});

router.post('/partner-summary/run', requireAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await runPartnerSummaryAutomation(payload, req.userProfile || req.user || {});
    res.json({ success: true, ...result });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, error: error?.message || 'partner_summary_run_failed' });
  }
});

export default router;
