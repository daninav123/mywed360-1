import crypto from 'node:crypto';

import { FieldValue } from 'firebase-admin/firestore';

import { db } from '../db.js';
import logger from '../logger.js';

const MODEL_VERSION = 'budget-heuristic-v1.0';
const DEFAULT_CURRENCY = 'EUR';

const SERVICE_PROFILES = [
  {
    key: 'catering',
    aliases: ['catering', 'banquete', 'comida', 'food', 'restaurante', 'menu', 'menú'],
    label: 'Catering',
    budgetShare: { low: 0.26, median: 0.31, high: 0.36 },
    perGuest: { low: 45, median: 62, high: 88 },
    base: { low: 1500, median: 2300, high: 3600 },
  },
  {
    key: 'venue',
    aliases: ['venue', 'espacio', 'lugar', 'finca', 'salon', 'salón', 'hacienda'],
    label: 'Espacio',
    budgetShare: { low: 0.28, median: 0.34, high: 0.4 },
    perGuest: { low: 38, median: 52, high: 75 },
    base: { low: 2000, median: 3200, high: 5200 },
  },
  {
    key: 'photography',
    aliases: ['photo', 'foto', 'fotografia', 'fotografía', 'photo/video', 'photographer'],
    label: 'Fotografía',
    budgetShare: { low: 0.07, median: 0.09, high: 0.12 },
    perGuest: { low: 8, median: 11, high: 15 },
    base: { low: 900, median: 1400, high: 2400 },
  },
  {
    key: 'video',
    aliases: ['video', 'videografia', 'videografía', 'film', 'videographer'],
    label: 'Vídeo',
    budgetShare: { low: 0.05, median: 0.07, high: 0.1 },
    perGuest: { low: 6, median: 8, high: 12 },
    base: { low: 650, median: 1100, high: 1900 },
  },
  {
    key: 'music',
    aliases: ['music', 'música', 'musica', 'dj', 'banda', 'orquesta', 'sonido'],
    label: 'Música',
    budgetShare: { low: 0.06, median: 0.08, high: 0.11 },
    perGuest: { low: 5, median: 7, high: 11 },
    base: { low: 450, median: 900, high: 1600 },
  },
  {
    key: 'flowers',
    aliases: ['flowers', 'flores', 'floristeria', 'floristería', 'decor floral', 'centros'],
    label: 'Flores',
    budgetShare: { low: 0.05, median: 0.07, high: 0.09 },
    perGuest: { low: 4, median: 6, high: 9 },
    base: { low: 350, median: 700, high: 1300 },
  },
  {
    key: 'decor',
    aliases: ['decor', 'decoracion', 'decoración', 'iluminacion', 'iluminación', 'styling'],
    label: 'Decoración',
    budgetShare: { low: 0.07, median: 0.09, high: 0.12 },
    perGuest: { low: 6, median: 8, high: 12 },
    base: { low: 400, median: 950, high: 1800 },
  },
  {
    key: 'planner',
    aliases: ['planner', 'organizacion', 'organización', 'coordinacion', 'coordinación'],
    label: 'Wedding planner',
    budgetShare: { low: 0.08, median: 0.1, high: 0.13 },
    perGuest: { low: 4, median: 6, high: 8 },
    base: { low: 900, median: 1500, high: 2600 },
  },
  {
    key: 'attire',
    aliases: ['vestido', 'traje', 'moda', 'attire', 'vestimenta'],
    label: 'Vestimenta',
    budgetShare: { low: 0.1, median: 0.13, high: 0.18 },
    perGuest: { low: 6, median: 8, high: 10 },
    base: { low: 1200, median: 2200, high: 3500 },
  },
  {
    key: 'transport',
    aliases: ['transporte', 'transport', 'bus', 'autobus', 'autobús', 'coche', 'vehiculo'],
    label: 'Transporte',
    budgetShare: { low: 0.02, median: 0.03, high: 0.05 },
    perGuest: { low: 1.8, median: 2.4, high: 3.3 },
    base: { low: 180, median: 330, high: 650 },
  },
  {
    key: 'stationery',
    aliases: ['papeleria', 'papelería', 'invitaciones', 'stationery', 'save the date'],
    label: 'Papelería',
    budgetShare: { low: 0.02, median: 0.03, high: 0.05 },
    perGuest: { low: 1.1, median: 1.9, high: 2.5 },
    base: { low: 120, median: 250, high: 420 },
  },
  {
    key: 'cake',
    aliases: ['tarta', 'cake', 'postre', 'reposteria'],
    label: 'Tarta y repostería',
    budgetShare: { low: 0.01, median: 0.015, high: 0.02 },
    perGuest: { low: 2, median: 3.2, high: 4.8 },
    base: { low: 180, median: 260, high: 420 },
  },
  {
    key: 'beauty',
    aliases: ['maquillaje', 'peluqueria', 'peluquería', 'beauty', 'estetica', 'estética'],
    label: 'Belleza',
    budgetShare: { low: 0.015, median: 0.025, high: 0.035 },
    perGuest: { low: 0.8, median: 1.1, high: 1.6 },
    base: { low: 180, median: 320, high: 540 },
  },
  {
    key: 'ceremony',
    aliases: ['ceremonia', 'oficiante', 'celebrante'],
    label: 'Ceremonia',
    budgetShare: { low: 0.01, median: 0.015, high: 0.02 },
    perGuest: { low: 0.5, median: 0.9, high: 1.2 },
    base: { low: 150, median: 260, high: 480 },
  },
];

const LOCATION_FACTORS = [
  { name: 'gran-ciudad', test: /(madrid|barcelona|lisboa|paris|porto|milán|milano|london|milan)/i, multiplier: 1.15 },
  { name: 'costero-premium', test: /(ibiza|mallorca|marbella|costa|amalfi|cancún|cancun|tulum|santorini)/i, multiplier: 1.22 },
  { name: 'ciudad', test: /(valencia|sevilla|bilbao|zaragoza|granada|alicante|malaga|málaga|oporto)/i, multiplier: 1.08 },
  { name: 'rural', test: /(pueblo|rural|campo|finca|hacienda|sierra|la rioja|asturias)/i, multiplier: 0.95 },
];

const STYLE_FACTORS = [
  { name: 'lujo', test: /(lujo|luxury|premium|alta gama|high-end|exclusivo|glam)/i, multiplier: 1.18 },
  { name: 'boho', test: /(boho|bohemio|bohemian)/i, multiplier: 1.05 },
  { name: 'minimalista', test: /(minimalista|minimal|intimo|íntimo|small|reducido|ahorro|económico|economico)/i, multiplier: 0.9 },
  { name: 'tematica', test: /(tematic|temática|tematico|temático|destino|destination)/i, multiplier: 1.12 },
];

const PRIORITY_FACTORS = {
  essential: 1.05,
  'must-have': 1.05,
  default: 1,
  optional: 0.96,
  'nice-to-have': 0.94,
};

const guestBuckets = [
  { id: '0-50', min: 0, max: 50 },
  { id: '51-100', min: 51, max: 100 },
  { id: '101-150', min: 101, max: 150 },
  { id: '151-200', min: 151, max: 200 },
  { id: '201-300', min: 201, max: 300 },
  { id: '300+', min: 301, max: Infinity },
];

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  return fallback;
}

function roundCurrency(value) {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value < 100) return Math.round(value / 5) * 5;
  if (value < 1000) return Math.round(value / 10) * 10;
  return Math.round(value / 25) * 25;
}

function detectServiceProfile(serviceRef = {}) {
  const rawType = (serviceRef.type || serviceRef.serviceType || serviceRef.category || '').toString().toLowerCase();
  const rawName = (serviceRef.name || serviceRef.label || '').toString().toLowerCase();
  for (const profile of SERVICE_PROFILES) {
    if (profile.aliases.some((alias) => rawType.includes(alias) || rawName.includes(alias))) {
      return profile;
    }
  }
  if (rawType) {
    const profile = SERVICE_PROFILES.find((p) => rawType === p.key);
    if (profile) return profile;
  }
  return {
    key: rawType || 'otros-servicios',
    aliases: [rawType],
    label: serviceRef.name || serviceRef.type || 'Servicio',
    budgetShare: { low: 0.03, median: 0.05, high: 0.07 },
    perGuest: { low: 3, median: 5, high: 7 },
    base: { low: 200, median: 350, high: 600 },
  };
}

function locateCityFactor(city = '', country = '') {
  const text = `${city || ''} ${country || ''}`;
  for (const factor of LOCATION_FACTORS) {
    if (factor.test.test(text)) {
      return factor;
    }
  }
  return { name: 'standard', multiplier: 1 };
}

function detectStyleFactor(notes = '') {
  if (!notes || typeof notes !== 'string') return { name: 'standard', multiplier: 1 };
  for (const factor of STYLE_FACTORS) {
    if (factor.test.test(notes)) {
      return factor;
    }
  }
  return { name: 'standard', multiplier: 1 };
}

function detectPriorityFactor(priority) {
  if (!priority || typeof priority !== 'string') return PRIORITY_FACTORS.default;
  return PRIORITY_FACTORS[priority.toLowerCase()] || PRIORITY_FACTORS.default;
}

function resolveGuestBucket(count) {
  const guests = safeNumber(count, 0);
  for (const bucket of guestBuckets) {
    if (guests >= bucket.min && guests <= bucket.max) return bucket.id;
  }
  return 'unknown';
}

function blendEstimates(baseEstimate, altEstimate, weightBase = 0.6) {
  const weightAlt = 1 - weightBase;
  return baseEstimate * weightBase + altEstimate * weightAlt;
}

async function loadHistoricalRanges({ serviceKey, cityBucket, guestBucket, currency }) {
  const entries = [];
  try {
    const collection = db.collection('adminMetrics');
    let query = collection.orderBy('date', 'desc').limit(90);
    try {
      const todayDoc = await collection.doc('latest').get();
      if (todayDoc.exists) {
        const docData = todayDoc.data() || {};
        const arr = Array.isArray(docData.aiCosts) ? docData.aiCosts : [];
        arr.forEach((cost) => entries.push(cost));
      }
    } catch {
      /* noop */
    }
    const snap = await query.get();
    snap.forEach((doc) => {
      const data = doc.data() || {};
      const costs = Array.isArray(data.aiCosts) ? data.aiCosts : [];
      costs.forEach((cost) => entries.push(cost));
    });
  } catch (err) {
    logger.debug('[ai-budget] No se pudo leer adminMetrics para históricos', err?.message || err);
  }
  const filtered = entries
    .map((raw) => {
      const key = (raw.serviceType || raw.service || '').toString().toLowerCase();
      if (!key) return null;
      if (serviceKey && key !== serviceKey) return null;
      const entryGuestBucket = raw.guestBucket || raw.guestRange || null;
      if (guestBucket && entryGuestBucket && entryGuestBucket !== guestBucket) return null;
      const entryCity = (raw.cityBucket || raw.city || raw.location || '').toString().toLowerCase();
      if (cityBucket && entryCity && entryCity !== cityBucket.toLowerCase()) return null;
      const range = raw.range || raw.amounts || {};
      const low = safeNumber(range.low ?? raw.low ?? raw.min);
      const median = safeNumber(range.median ?? raw.median ?? raw.mid ?? raw.avg);
      const high = safeNumber(range.high ?? raw.high ?? raw.max);
      if (low <= 0 && median <= 0 && high <= 0) return null;
      return {
        low,
        median,
        high,
        currency: raw.currency || currency || DEFAULT_CURRENCY,
        source: raw.source || 'historical',
        collectedAt: raw.createdAt || raw.date || null,
      };
    })
    .filter(Boolean);
  return filtered;
}

function aggregateHistorical(history = []) {
  if (!Array.isArray(history) || !history.length) return null;
  const lowVals = history.map((h) => h.low).filter((v) => v > 0);
  const midVals = history.map((h) => h.median).filter((v) => v > 0);
  const highVals = history.map((h) => h.high).filter((v) => v > 0);
  if (!midVals.length) return null;
  lowVals.sort((a, b) => a - b);
  midVals.sort((a, b) => a - b);
  highVals.sort((a, b) => a - b);
  const pick = (arr) => {
    if (!arr.length) return 0;
    const mid = Math.floor(arr.length / 2);
    if (arr.length % 2 === 0) {
      return (arr[mid - 1] + arr[mid]) / 2;
    }
    return arr[mid];
  };
  return {
    low: pick(lowVals) || pick(midVals) * 0.85,
    median: pick(midVals),
    high: pick(highVals) || pick(midVals) * 1.15,
    sampleSize: history.length,
  };
}

function computeBaseEstimate({ profile, guestCount, totalBudget }) {
  const guests = Math.max(guestCount || 0, 0);
  const fallbackBudget = guests > 0 ? guests * 140 : 20000;
  const budget = totalBudget > 0 ? totalBudget : fallbackBudget;

  const perGuestLow = profile.base.low + guests * profile.perGuest.low;
  const perGuestMedian = profile.base.median + guests * profile.perGuest.median;
  const perGuestHigh = profile.base.high + guests * profile.perGuest.high;

  const budgetLow = budget * profile.budgetShare.low;
  const budgetMedian = budget * profile.budgetShare.median;
  const budgetHigh = budget * profile.budgetShare.high;

  const low = blendEstimates(budgetLow, perGuestLow, 0.55);
  const median = blendEstimates(budgetMedian, perGuestMedian, 0.6);
  const high = blendEstimates(budgetHigh, perGuestHigh, 0.6);
  return { low, median, high };
}

function applyMultipliers(range, multipliers = []) {
  return multipliers.reduce(
    (acc, factor) => ({
      low: acc.low * factor,
      median: acc.median * factor,
      high: acc.high * factor,
    }),
    range
  );
}

function integrateTarget(range, targetRange) {
  if (!targetRange || typeof targetRange !== 'object') return range;
  const { min, max } = targetRange;
  const minValue = safeNumber(min, null);
  const maxValue = safeNumber(max, null);
  const next = { ...range };
  if (minValue && minValue > 0) {
    next.low = Math.min(next.low * 0.9 + minValue * 0.1, next.median * 0.95);
    next.median = blendEstimates(next.median, minValue * 1.05, 0.7);
  }
  if (maxValue && maxValue > 0) {
    next.high = Math.max(next.high * 0.85 + maxValue * 0.15, next.median * 1.05);
  }
  if (minValue && maxValue && minValue > 0 && maxValue > minValue) {
    next.low = Math.min(next.low, minValue);
    next.high = Math.max(next.high, maxValue);
    next.median = Math.min(Math.max(next.median, minValue * 1.05), maxValue * 0.95);
  }
  return next;
}

function integrateComparison(range, comparisonVendors = []) {
  if (!Array.isArray(comparisonVendors) || !comparisonVendors.length) return range;
  const valid = comparisonVendors
    .map((item) => safeNumber(item?.quotedAmount))
    .filter((value) => value > 0);
  if (!valid.length) return range;
  const avg = valid.reduce((sum, value) => sum + value, 0) / valid.length;
  const next = {
    low: blendEstimates(range.low, avg * 0.9, 0.7),
    median: blendEstimates(range.median, avg, 0.65),
    high: blendEstimates(range.high, avg * 1.08, 0.65),
  };
  return next;
}

function mergeWithHistory(range, historyStats) {
  if (!historyStats) return range;
  const factor = Math.min(historyStats.sampleSize / 12, 0.45);
  const keep = 1 - factor;
  return {
    low: range.low * keep + historyStats.low * factor,
    median: range.median * keep + historyStats.median * factor,
    high: range.high * keep + historyStats.high * factor,
  };
}

function sanitizeRange(range) {
  return {
    low: roundCurrency(Math.max(0, range.low)),
    median: roundCurrency(Math.max(0, range.median)),
    high: roundCurrency(Math.max(0, range.high)),
  };
}

function buildReasoning({
  profile,
  guestCount,
  guestBucket,
  locationFactor,
  styleFactor,
  historyStats,
  historyCount,
  comparisonSummary,
  targetRange,
}) {
  const reasons = [];
  reasons.push(
    `Basado en ${guestCount || 'el número previsto de'} invitados y un peso habitual del ${Math.round(
      profile.budgetShare.median * 100
    )}% sobre el presupuesto total para ${profile.label.toLowerCase()}.`
  );
  if (locationFactor?.multiplier && locationFactor.multiplier !== 1) {
    const pct = Math.round((locationFactor.multiplier - 1) * 100);
    reasons.push(
      `Ajuste de ubicación para mercado "${locationFactor.name}" (${pct >= 0 ? '+' : ''}${pct}%).`
    );
  }
  if (styleFactor?.multiplier && styleFactor.multiplier !== 1) {
    const pct = Math.round((styleFactor.multiplier - 1) * 100);
    reasons.push(
      `Preferencias de estilo detectadas (${styleFactor.name}) con ajuste de ${pct >= 0 ? '+' : ''}${pct}%.`
    );
  }
  if (targetRange && (targetRange.min || targetRange.max)) {
    reasons.push(
      `Se consideró la referencia del equipo (${targetRange.min ? `mínimo ${targetRange.min}` : ''}${
        targetRange.max ? ` máximo ${targetRange.max}` : ''
      }).`
    );
  }
  if (historyStats) {
    reasons.push(
      `Integrados ${historyCount} registros recientes de ${profile.label.toLowerCase()} para bodas con ${guestBucket} invitados.`
    );
  }
  if (comparisonSummary) {
    reasons.push(
      `Comparado con ${comparisonSummary.count} presupuesto(s) enviados por proveedores (${comparisonSummary.label}).`
    );
  }
  return reasons;
}

function computeConfidence({ base = 0.55, historyCount = 0, comparisonCount = 0, hasTarget = false }) {
  let confidence = base;
  if (historyCount >= 12) confidence += 0.16;
  else if (historyCount >= 6) confidence += 0.12;
  else if (historyCount >= 3) confidence += 0.07;

  if (comparisonCount >= 2) confidence += 0.08;
  else if (comparisonCount === 1) confidence += 0.05;

  if (hasTarget) confidence += 0.04;

  return Math.min(0.95, Math.max(0.45, Number(confidence.toFixed(2))));
}

function makeTraceId() {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  return `budget-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export async function buildBudgetEstimate(payload = {}, context = {}) {
  const traceId = context.traceId || makeTraceId();
  const { weddingId = null } = payload;
  const serviceRef = payload.serviceRef || {};
  const eventContext = payload.eventContext || {};
  const serviceContext = payload.serviceContext || {};
  const budgetSnapshot = payload.budgetSnapshot || {};
  const comparisonVendors = Array.isArray(payload.comparisonVendors) ? payload.comparisonVendors : [];

  const profile = detectServiceProfile(serviceRef);
  const guestCount = safeNumber(eventContext.guestCount, safeNumber(budgetSnapshot.guestCount, 0));
  const guestBucket = resolveGuestBucket(guestCount);
  const totalBudget = safeNumber(budgetSnapshot.totalBudget, 0);

  const locationFactor = locateCityFactor(eventContext.city, eventContext.country);
  const styleFactor = detectStyleFactor(serviceContext.styleNotes || serviceContext.notes || '');
  const priorityFactor = detectPriorityFactor(serviceContext.priority);

  const baseRange = computeBaseEstimate({ profile, guestCount, totalBudget });
  let adjustedRange = applyMultipliers(baseRange, [locationFactor.multiplier, styleFactor.multiplier, priorityFactor]);
  adjustedRange = integrateTarget(adjustedRange, serviceContext.targetRange);

  const comparisonSummary = comparisonVendors.length
    ? {
        count: comparisonVendors.length,
        avg: comparisonVendors.reduce((acc, item) => acc + (safeNumber(item?.quotedAmount) || 0), 0) /
          comparisonVendors.length,
        label: comparisonVendors
          .map((c) => c.vendorId || c.providerId || c.name || c.provider || 'Proveedor')
          .slice(0, 3)
          .join(', '),
      }
    : null;

  if (comparisonSummary && comparisonSummary.avg > 0) {
    adjustedRange = integrateComparison(adjustedRange, comparisonVendors);
  }

  const currency = payload.currency || eventContext.currency || budgetSnapshot.currency || DEFAULT_CURRENCY;

  const cityBucket = locationFactor.name;

  const historical = await loadHistoricalRanges({
    serviceKey: profile.key,
    cityBucket,
    guestBucket,
    currency,
  });

  const historyStats = aggregateHistorical(historical);
  if (historyStats) {
    adjustedRange = mergeWithHistory(adjustedRange, historyStats);
  }

  const sanitizedRange = sanitizeRange(adjustedRange);
  const reasoning = buildReasoning({
    profile,
    guestCount,
    guestBucket,
    locationFactor,
    styleFactor,
    historyStats,
    historyCount: historical.length,
    comparisonSummary,
    targetRange: serviceContext.targetRange,
  });

  const confidence = computeConfidence({
    historyCount: historical.length,
    comparisonCount: comparisonVendors.length,
    hasTarget: Boolean(serviceContext?.targetRange && (serviceContext.targetRange.min || serviceContext.targetRange.max)),
  });

  return {
    traceId,
    weddingId,
    serviceType: profile.key,
    serviceLabel: profile.label,
    currency: currency || DEFAULT_CURRENCY,
    range: sanitizedRange,
    confidence,
    reasoning,
    guestBucket,
    cityBucket,
    guestCount,
    modelVersion: MODEL_VERSION,
    historicalSample: historical.length,
    historicalApplied: Boolean(historyStats),
    comparisonSummary,
  };
}

export async function persistBudgetEstimate({ weddingId, estimation, payload, user }) {
  if (!weddingId || !estimation) return;
  const mainRef = db.collection('weddings').doc(weddingId).collection('finance').doc('main');
  const estimationEntry = {
    id: estimation.traceId,
    refType: payload?.serviceRef?.id ? 'provider' : 'category',
    serviceType: estimation.serviceType,
    serviceLabel: estimation.serviceLabel,
    inputs: {
      serviceRef: {
        id: payload?.serviceRef?.id || null,
        type: payload?.serviceRef?.type || payload?.serviceRef?.serviceType || null,
        name: payload?.serviceRef?.name || null,
      },
      guestCount: estimation.guestCount,
      cityBucket: estimation.cityBucket,
      guestBucket: estimation.guestBucket,
    },
    range: estimation.range,
    currency: estimation.currency,
    confidence: estimation.confidence,
    reasoning: estimation.reasoning,
    modelVersion: estimation.modelVersion,
    appliedAmount: null,
    appliedAt: null,
    overridden: false,
    dismissedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: user?.uid || null,
  };

  try {
    await mainRef.set(
      {
        aiEstimates: {
          services: FieldValue.arrayUnion(estimationEntry),
        },
      },
      { merge: true }
    );
  } catch (err) {
    logger.warn('[ai-budget] No se pudo guardar aiEstimates en finance/main', err?.message || err);
  }

  try {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const metricsRef = db.collection('adminMetrics').doc(dateKey);
    await metricsRef.set(
      {
        aiCosts: FieldValue.arrayUnion({
          serviceType: estimation.serviceType,
          serviceLabel: estimation.serviceLabel,
          guestBucket: estimation.guestBucket,
          cityBucket: estimation.cityBucket,
          currency: estimation.currency,
          range: estimation.range,
          modelVersion: estimation.modelVersion,
          source: 'api',
          traceId: estimation.traceId,
          createdAt: FieldValue.serverTimestamp(),
        }),
      },
      { merge: true }
    );
  } catch (err) {
    logger.debug('[ai-budget] No se pudo registrar en adminMetrics', err?.message || err);
  }
}

export function normalizePayload(body = {}) {
  const errors = [];
  const weddingId = body.weddingId ? String(body.weddingId) : null;
  if (weddingId && weddingId.length < 6) errors.push('weddingId inválido');

  const serviceRef = body.serviceRef && typeof body.serviceRef === 'object' ? body.serviceRef : {};
  if (!serviceRef.type && !serviceRef.name) {
    errors.push('serviceRef.type o serviceRef.name son obligatorios');
  }

  const eventContext = body.eventContext && typeof body.eventContext === 'object' ? body.eventContext : {};
  const serviceContext = body.serviceContext && typeof body.serviceContext === 'object' ? body.serviceContext : {};
  const budgetSnapshot = body.budgetSnapshot && typeof body.budgetSnapshot === 'object' ? body.budgetSnapshot : {};
  const comparisonVendors = Array.isArray(body.comparisonVendors) ? body.comparisonVendors : [];

  if (eventContext.date && Number.isNaN(Date.parse(eventContext.date))) {
    errors.push('eventContext.date no es una fecha válida');
  }

  const guestCountCandidates = [
    eventContext.guestCount,
    budgetSnapshot.guestCount,
    serviceContext.guestCount,
  ];
  const guestCount = guestCountCandidates
    .map((value) => safeNumber(value, null))
    .find((value) => value !== null);

  const normalized = {
    weddingId,
    serviceRef,
    eventContext: {
      eventType: eventContext.eventType || 'boda',
      date: eventContext.date || null,
      city: eventContext.city || eventContext.location || '',
      country: eventContext.country || eventContext.region || '',
      guestCount: guestCount ?? null,
      currency: eventContext.currency || budgetSnapshot.currency || DEFAULT_CURRENCY,
    },
    serviceContext: {
      styleNotes: serviceContext.styleNotes || serviceContext.notes || '',
      targetRange: serviceContext.targetRange || null,
      priority: serviceContext.priority || serviceContext.importance || null,
    },
    budgetSnapshot: {
      totalBudget: safeNumber(budgetSnapshot.totalBudget, null),
      allocatedAmount: safeNumber(budgetSnapshot.allocatedAmount, null),
      currency: budgetSnapshot.currency || eventContext.currency || DEFAULT_CURRENCY,
      guestCount: guestCount ?? null,
    },
    comparisonVendors,
    currency: body.currency || eventContext.currency || budgetSnapshot.currency || DEFAULT_CURRENCY,
  };

  return {
    valid: errors.length === 0,
    errors,
    data: normalized,
  };
}

