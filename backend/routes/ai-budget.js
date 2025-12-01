import express from 'express';

import logger from '../utils/logger.js';
import {
  buildBudgetEstimate,
  normalizePayload,
  persistBudgetEstimate,
} from '../services/aiBudgetEstimator.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const traceId = req.headers['x-trace-id'] || null;
  try {
    const { valid, errors, data } = normalizePayload(req.body || {});
    if (!valid) {
      return res.status(400).json({
        error: 'invalid_payload',
        details: errors,
        traceId,
      });
    }

    const estimation = await buildBudgetEstimate(data, { traceId });
    if (data.weddingId) {
      persistBudgetEstimate({
        weddingId: data.weddingId,
        estimation,
        payload: data,
        user: req.user || null,
      }).catch((err) => {
        logger.warn('[ai-budget] persistEstimate failed', err?.message || err);
      });
    }

    res.json({
      serviceType: estimation.serviceType,
      serviceLabel: estimation.serviceLabel,
      currency: estimation.currency,
      range: estimation.range,
      confidence: estimation.confidence,
      reasoning: estimation.reasoning,
      modelVersion: estimation.modelVersion,
      traceId: estimation.traceId,
      guestBucket: estimation.guestBucket,
      cityBucket: estimation.cityBucket,
      historicalSample: estimation.historicalSample,
      comparisonSummary: estimation.comparisonSummary
        ? {
            count: estimation.comparisonSummary.count,
            label: estimation.comparisonSummary.label,
          }
        : null,
    });
  } catch (err) {
    logger.error('[ai-budget] estimate failed', err);
    res.status(503).json({
      error: 'estimate_failed',
      message: err?.message || 'No se pudo generar la estimación',
      traceId,
    });
  }
});

export default router;
