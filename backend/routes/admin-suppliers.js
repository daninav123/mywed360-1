import express from 'express';

import { db } from '../db.js';
import computeSupplierScore, { aggregateServiceStats } from '../../src/utils/supplierScore.js';

const router = express.Router();

const SCORE_BUCKETS = [
  { label: '0-19', min: 0, max: 19 },
  { label: '20-39', min: 20, max: 39 },
  { label: '40-59', min: 40, max: 59 },
  { label: '60-79', min: 60, max: 79 },
  { label: '80-100', min: 80, max: 100 },
];

function normalizeScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

router.get('/analytics', async (req, res) => {
  try {
    const topLimit = Math.max(1, Math.min(50, Number(req.query.topLimit || req.query.limit || 10)));

    const snapshot = await db.collectionGroup('suppliers').get();

    const statusCounts = new Map();
    const weddingIds = new Set();
    const providersForStats = [];
    const topCandidates = [];
    const distribution = SCORE_BUCKETS.map((bucket) => ({ ...bucket, count: 0 }));
    let portalEnabled = 0;
    let portalResponded = 0;
    let scoreSum = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const weddingId = docSnap.ref.parent?.parent?.id || null;
      if (weddingId) weddingIds.add(weddingId);

      const baseProvider = {
        id: docSnap.id,
        name: data.name || 'Proveedor sin nombre',
        service: data.service || 'Sin servicio',
        status: data.status || 'Sin estado',
        aiMatch: data.aiMatch ?? data.match ?? data.score ?? 0,
        match: data.match ?? data.score ?? 0,
        rating: data.rating,
        ratingCount: data.ratingCount,
        portalToken: data.portalToken,
        portalLastSubmitAt: data.portalLastSubmitAt,
        lastInteractionAt: data.lastInteractionAt || data.updatedAt || data.updated || data.date || null,
      };

      const computed = computeSupplierScore(baseProvider, null, {});
      const score = normalizeScore(computed?.score);

      scoreSum += score;

      const bucket = distribution.find((b) => score >= b.min && score <= b.max);
      if (bucket) bucket.count += 1;

      const status = baseProvider.status || 'Sin estado';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);

      if (baseProvider.portalToken) {
        portalEnabled += 1;
        if (baseProvider.portalLastSubmitAt) portalResponded += 1;
      }

      providersForStats.push({
        ...baseProvider,
        intelligentScore: { score },
      });

      topCandidates.push({
        id: baseProvider.id,
        weddingId,
        name: baseProvider.name,
        service: baseProvider.service,
        status,
        score,
      });
    });

    const totalSuppliers = providersForStats.length;
    const averageScore = totalSuppliers ? Math.round(scoreSum / totalSuppliers) : 0;
    const serviceStats = aggregateServiceStats(providersForStats);

    const topProviders = topCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, topLimit);

    const scoreDistribution = distribution.map((bucket) => ({
      label: bucket.label,
      count: bucket.count,
      percentage: totalSuppliers
        ? Math.round((bucket.count / totalSuppliers) * 100)
        : 0,
    }));

    const portalPending = Math.max(0, portalEnabled - portalResponded);

    const statusBreakdown = Array.from(statusCounts.entries()).map(([key, value]) => ({
      status: key,
      count: value,
      percentage: totalSuppliers ? Math.round((value / totalSuppliers) * 100) : 0,
    }));

    return res.json({
      generatedAt: Date.now(),
      totals: {
        suppliers: totalSuppliers,
        weddings: weddingIds.size,
      },
      score: {
        average: averageScore,
        distribution: scoreDistribution,
      },
      portal: {
        enabled: portalEnabled,
        responded: portalResponded,
        pending: portalPending,
      },
      serviceStats,
      statusBreakdown,
      topProviders,
    });
  } catch (error) {
    console.error('[admin-suppliers] analytics error', error);
    return res.status(500).json({ error: 'analytics-failed' });
  }
});

export default router;

