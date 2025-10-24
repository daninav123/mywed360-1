/**
 * Utilidades para calcular la puntuaci�n "inteligente" de proveedores IA.
 *
 * La puntuaci�n combina:
 *  - Coincidencia IA (match) o afinidad manual.
 *  - Rating hist�rico y n� de valoraciones.
 *  - Experiencia (bodas servidas + estado pipeline).
 *  - Tiempo de respuesta medio.
 *  - Satisfacci�n reportada.
 *  - Interacci�n reciente v�a portal.
 *
 * Todas las entradas se normalizan a 0-100.
 */

const STATUS_WEIGHTS = {
  Confirmado: 12,
  Seleccionado: 8,
  Contactado: 4,
  Pendiente: 0,
  Rechazado: -8,
  Archivado: -4,
};

const clamp = (value, min = 0, max = 100) => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
};

const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function computeAverage(sum, count) {
  if (!count) return 0;
  const total = safeNumber(sum);
  return total / count;
}

/**
 * Devuelve m�tricas normalizadas para la puntuaci�n IA.
 * @param {object} provider Datos del proveedor.
 * @param {object|null} insights Doc con hist�ricos (supplierInsights).
 * @param {object} opts Opciones adicionales.
 */
export function buildSupplierSignals(provider = {}, insights = null, opts = {}) {
  const {
    now = Date.now(),
    serviceCoverageRatio = 0,
    recentInteractionDays = null,
  } = opts;

  const matchRaw = safeNumber(
    provider.aiMatch ?? provider.match ?? provider.score ?? provider.aiScore,
    0
  );
  const match = clamp(matchRaw, 0, 100);

  const ratingsCount = safeNumber(provider.ratingCount, 0);
  const ratingAverage = ratingsCount
    ? safeNumber(provider.rating, 0) / Math.max(1, ratingsCount)
    : safeNumber(provider.rating, 0);
  const ratingScore = clamp(ratingAverage * 20, 0, 100);

  const statusWeight = STATUS_WEIGHTS[provider.status] ?? 0;

  const weddingsServed = safeNumber(insights?.weddingsServed, 0);
  // Cada boda aporta hasta 4 puntos, tope 20.
  const experienceScore = clamp(weddingsServed * 4, 0, 20);

  const avgResponse =
    computeAverage(insights?.avgResponseTime, insights?.responsesTracked) || 0;
  // Menos minutos = mejor. Normaliza 0-20 restando penalizaci�n.
  const responseScore = clamp(20 - Math.min(20, avgResponse / 15), 0, 20);

  const satisfactionAvg =
    computeAverage(insights?.satisfactionScore, insights?.responsesTracked) * 20;
  const satisfactionScore = clamp(satisfactionAvg, 0, 20);

  const coverageBoost = clamp(serviceCoverageRatio * 10, 0, 10);

  let recencyBonus = 0;
  if (recentInteractionDays != null) {
    if (recentInteractionDays <= 3) recencyBonus = 6;
    else if (recentInteractionDays <= 7) recencyBonus = 4;
    else if (recentInteractionDays <= 14) recencyBonus = 2;
  } else if (provider.portalLastSubmitAt) {
    try {
      const ts = provider.portalLastSubmitAt?.toDate
        ? provider.portalLastSubmitAt.toDate()
        : new Date(provider.portalLastSubmitAt);
      const diffMs = now - ts.getTime();
      if (Number.isFinite(diffMs)) {
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays <= 3) recencyBonus = 6;
        else if (diffDays <= 7) recencyBonus = 4;
        else if (diffDays <= 14) recencyBonus = 2;
      }
    } catch {
      /* noop */
    }
  }

  const signals = {
    match,
    ratingScore,
    statusWeight,
    experienceScore,
    responseScore,
    satisfactionScore,
    coverageBoost,
    recencyBonus,
  };

  return {
    signals,
    baseScore: clamp(
      match * 0.4 +
        ratingScore * 0.2 +
        experienceScore +
        responseScore +
        satisfactionScore +
        coverageBoost +
        recencyBonus +
        statusWeight,
      0,
      100
    ),
  };
}

export function computeSupplierScore(provider = {}, insights = null, opts = {}) {
  const { signals, baseScore } = buildSupplierSignals(provider, insights, opts);
  return {
    score: Math.round(baseScore),
    breakdown: signals,
  };
}

/**
 * Crea estad�sticas agregadas por servicio.
 * @param {Array<{service: string, intelligentScore?: {score:number}}>} providers
 */
export function aggregateServiceStats(providers = []) {
  const stats = new Map();
  providers.forEach((p) => {
    const key = p.service || 'Sin servicio';
    const entry = stats.get(key) || {
      service: key,
      total: 0,
      scoreSum: 0,
      hired: 0,
      shortlisted: 0,
      matchAvg: 0,
      matchSum: 0,
    };
    entry.total += 1;
    const score = safeNumber(p.intelligentScore?.score, 0);
    entry.scoreSum += score;
    const match = safeNumber(p.aiMatch ?? p.match ?? p.intelligentScore?.breakdown?.match ?? 0, 0);
    entry.matchSum += match;
    if (['Confirmado', 'Seleccionado'].includes(p.status)) entry.hired += 1;
    if (['Contactado', 'Pendiente'].includes(p.status)) entry.shortlisted += 1;
    stats.set(key, entry);
  });
  const result = Array.from(stats.values()).map((entry) => ({
    ...entry,
    averageScore: entry.total ? Math.round(entry.scoreSum / entry.total) : 0,
    averageMatch: entry.total ? Math.round(entry.matchSum / entry.total) : 0,
  }));
  result.sort((a, b) => b.averageScore - a.averageScore);
  return result;
}

export function deriveCoverageKpis(providers = [], serviceLinesBySupplier = new Map()) {
  const totalServices = new Map();
  let withPortal = 0;
  let pendingPortal = 0;
  providers.forEach((p) => {
    const lines = serviceLinesBySupplier.get(p.id) || p.serviceLines || [];
    const catalog = Array.isArray(lines) && lines.length ? lines : [{ name: p.service }];
    catalog.forEach((line) => {
      const name = line?.name || p.service || 'General';
      const entry = totalServices.get(name) || { name, suppliers: 0, confirmed: 0 };
      entry.suppliers += 1;
      if (['Confirmado', 'Seleccionado'].includes(p.status)) entry.confirmed += 1;
      totalServices.set(name, entry);
    });
    if (p.portalLastSubmitAt) withPortal += 1;
    if (!p.portalLastSubmitAt && p.portalToken) pendingPortal += 1;
  });

  return {
    services: Array.from(totalServices.values()),
    portal: {
      enabled: withPortal + pendingPortal,
      responded: withPortal,
      pending: pendingPortal,
    },
  };
}

export default computeSupplierScore;
