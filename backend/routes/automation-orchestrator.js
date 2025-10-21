import express from 'express';

import { optionalAuth } from '../middleware/authMiddleware.js';
import {
  ingestAutomationEvent,
  normalizeAutomationEvent,
  persistRawEvent,
} from '../services/automationOrchestrator.js';

const router = express.Router();

router.post('/events', optionalAuth, async (req, res) => {
  try {
    const rawEvent = req.body || {};
    const normalized = normalizeAutomationEvent(rawEvent);

    // Persistencia opcional para depuración / workers futuros.
    if (process.env.AUTOMATION_ORCHESTRATOR_PERSIST === '1') {
      persistRawEvent(normalized).catch((error) => {
        // No bloquear el flujo si falla el guardado best-effort.
        console.warn('[automation-orchestrator] persist error', error?.message || error);
      });
    }

    const result = await ingestAutomationEvent(normalized);
    res.status(202).json({
      success: true,
      eventId: result.event.id,
      actions: result.actions,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error?.message || 'automation_orchestrator_failed',
    });
  }
});

router.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

export default router;
