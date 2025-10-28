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

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') {
    try {
      const asDate = value.toDate();
      return Number.isNaN(asDate.getTime()) ? null : asDate;
    } catch {
      return null;
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toIsoString = (value) => {
  const d = toDate(value);
  if (!d) return null;
  try {
    return d.toISOString();
  } catch {
    return null;
  }
};

const incrementCount = (map, key) => {
  const label = key && typeof key === 'string' ? key : 'Sin dato';
  map.set(label, (map.get(label) || 0) + 1);
};

const mapCounts = (map, top = 25) =>
  Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([value, count]) => ({ value, count }));

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

router.get('/list', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
    const search = String(req.query.search || '').trim().toLowerCase();
    const statusFilter = String(req.query.status || '').trim().toLowerCase();
    const serviceFilter = String(req.query.service || '').trim().toLowerCase();
    const cityFilter = String(req.query.city || '').trim().toLowerCase();
    const portalFilter = String(req.query.portal || '').trim().toLowerCase();
    const onlyRegistered = ['true', '1', 'yes'].includes(String(req.query.registered || req.query.verified || '').toLowerCase());

    const snapshot = await db.collection('suppliers').limit(1000).get();

    const allStatus = new Map();
    const allService = new Map();
    const allCities = new Map();
    const allPortal = new Map();

    const filteredStatus = new Map();
    const filteredService = new Map();
    const filteredCities = new Map();
    const filteredPortal = new Map();

    const suppliers = [];
    let portalEnabled = 0;
    let portalResponded = 0;
    let registeredCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() || {};

      const status = (data.status && String(data.status).trim()) || 'Sin estado';
      const service = (data.service && String(data.service).trim()) || 'General';
      const location = data.location || {};
      const city = location.city || data.city || '';
      const registered = data.registered === true;
      if (registered) registeredCount += 1;

      incrementCount(allStatus, status);
      incrementCount(allService, service);
      if (city) incrementCount(allCities, city);

      const baseProvider = {
        id: docSnap.id,
        name: data.name || 'Proveedor sin nombre',
        service,
        status,
        aiMatch: data.aiMatch ?? data.match ?? data.score ?? 0,
        match: data.match ?? data.score ?? 0,
        rating: data.rating,
        ratingCount: data.ratingCount,
        portalToken: data.portalToken,
        portalLastSubmitAt: data.portalLastSubmitAt,
        lastInteractionAt:
          data.lastInteractionAt || data.updatedAt || data.updated || data.lastUpdated || data.date || null,
      };

      const computed = computeSupplierScore(baseProvider, null, {});
      const score = normalizeScore(computed?.score);

      if (data.portalToken) {
        portalEnabled += 1;
        if (data.portalLastSubmitAt) portalResponded += 1;
      }

      const portalStatus = data.portalToken
        ? data.portalLastSubmitAt
          ? 'responded'
          : 'pending'
        : 'disabled';
      incrementCount(allPortal, portalStatus);

      const emails = Array.isArray(data.emails)
        ? data.emails.filter(Boolean)
        : data.email
        ? [data.email]
        : [];

      const tags = Array.isArray(data.tags) ? data.tags.filter(Boolean) : [];

      const weddingsCount = Array.isArray(data.weddings)
        ? data.weddings.length
        : Number.isFinite(data.weddingsCount)
        ? data.weddingsCount
        : Number.isFinite(data.analytics?.weddingsCount)
        ? data.analytics.weddingsCount
        : 0;

      const supplierRecord = {
        id: docSnap.id,
        name: baseProvider.name,
        service,
        services: Array.isArray(data.serviceLines)
          ? data.serviceLines.map((line) => line?.name).filter(Boolean)
          : [],
        status,
        statusLower: status.toLowerCase(),
        registered,
        city,
        country: location.country || data.country || '',
        emails,
        phone: data.phone || data.phoneNumber || '',
        website: data.website || data.url || data.web || '',
        score,
        match: Number(data.match ?? data.aiMatch ?? 0) || 0,
        weddingsCount,
        portal: {
          enabled: Boolean(data.portalToken),
          lastSubmitAt: toIsoString(data.portalLastSubmitAt),
          status: portalStatus,
        },
        lastInteractionAt: toIsoString(baseProvider.lastInteractionAt),
        createdAt: toIsoString(data.createdAt || data.created || data.submittedAt),
        updatedAt: toIsoString(data.updatedAt || data.updated || data.lastInteractionAt),
        tags,
        notes: data.notes || data.note || '',
        manager: data.assignedManager || data.manager || null,
        source: data.source || data.origin || null,
      };

      const nameLower = supplierRecord.name.toLowerCase();
      const descriptionLower = String(data.description || data.business?.description || '').toLowerCase();
      const tagsLower = tags.join(' ').toLowerCase();

      if (search) {
        const matchesSearch =
          nameLower.includes(search) ||
          descriptionLower.includes(search) ||
          tagsLower.includes(search) ||
          emails.some((email) => String(email).toLowerCase().includes(search));
        if (!matchesSearch) return;
      }

      if (statusFilter && supplierRecord.statusLower !== statusFilter) return;
      if (serviceFilter && service.toLowerCase() !== serviceFilter) return;
      if (cityFilter && city.toLowerCase() !== cityFilter) return;
      if (onlyRegistered && !registered) return;

      const normalizedPortal = supplierRecord.portal.status.toLowerCase();
      if (
        portalFilter &&
        portalFilter !== 'all' &&
        normalizedPortal !== portalFilter &&
        !(portalFilter === 'enabled' && normalizedPortal !== 'disabled')
      ) {
        return;
      }

      suppliers.push(supplierRecord);

      incrementCount(filteredStatus, status);
      incrementCount(filteredService, service);
      if (city) incrementCount(filteredCities, city);
      incrementCount(filteredPortal, supplierRecord.portal.status);
    });

    suppliers.sort((a, b) => {
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      const aDate = toDate(a.updatedAt) || toDate(a.createdAt) || new Date(0);
      const bDate = toDate(b.updatedAt) || toDate(b.createdAt) || new Date(0);
      return bDate.getTime() - aDate.getTime();
    });

    const limitedItems = suppliers.slice(0, limit);

    return res.json({
      generatedAt: Date.now(),
      total: suppliers.length,
      limit,
      hasMore: suppliers.length > limit,
      summary: {
        registered: registeredCount,
        cached: Math.max(0, snapshot.size - registeredCount),
        portal: {
          enabled: portalEnabled,
          responded: portalResponded,
          pending: Math.max(0, portalEnabled - portalResponded),
        },
      },
      facets: {
        status: mapCounts(filteredStatus),
        service: mapCounts(filteredService, 50),
        city: mapCounts(filteredCities, 50),
        portal: mapCounts(filteredPortal),
      },
      allFacets: {
        status: mapCounts(allStatus),
        service: mapCounts(allService, 50),
        city: mapCounts(allCities, 50),
        portal: mapCounts(allPortal),
      },
      items: limitedItems.map(({ statusLower, ...rest }) => rest),
    });
  } catch (error) {
    console.error('[admin-suppliers] list error', error);
    return res.status(500).json({ error: 'list-failed' });
  }
});

export default router;
