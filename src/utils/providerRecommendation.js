import { computeSupplierScore } from './supplierScore';

const parsePrice = (raw) => {
  if (raw == null) return null;
  try {
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
    const text = String(raw).trim();
    if (!text) return null;
    const cleaned = text
      .replace(/€/g, '')
      .replace(/eur/gi, '')
      .replace(/por\s+persona/gi, '')
      .replace(/x\s*[0-9]+/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    const matches = cleaned.match(/[0-9]+[.,]?[0-9]*/g) || [];
    if (!matches.length) return null;
    const toNumber = (value) => {
      const normalized = value.replace(/\./g, '').replace(/,/g, '.');
      const parsed = parseFloat(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    };
    if (matches.length === 1) return toNumber(matches[0]);
    const values = matches.map(toNumber).filter((n) => n != null);
    if (!values.length) return null;
    if (values.length === 1) return values[0];
    // Promedio del rango
    return (values[0] + values[values.length - 1]) / 2;
  } catch {
    return null;
  }
};

const normalizeList = (list = []) =>
  Array.from(
    new Set(
      (Array.isArray(list) ? list : [])
        .map((value) => String(value || '').toLowerCase().trim())
        .filter(Boolean),
    ),
  );

const collectRequirementTokens = (context = {}) => {
  const tokens = [
    ...normalizeList(context.wantedServices),
    ...normalizeList(context.requiredTags),
    ...normalizeList(context.requiredKeywords),
  ];
  const preferences = context.preferences || {};
  if (preferences.style) tokens.push(String(preferences.style).toLowerCase());
  if (preferences.theme) tokens.push(String(preferences.theme).toLowerCase());
  if (Array.isArray(preferences.tags)) tokens.push(...normalizeList(preferences.tags));
  return normalizeList(tokens);
};

const collectProviderTokens = (provider = {}) => {
  const tokens = [
    provider.service,
    provider.servicio,
    ...(Array.isArray(provider.tags) ? provider.tags : []),
    ...(Array.isArray(provider.keywords) ? provider.keywords : []),
    ...(Array.isArray(provider.capabilities) ? provider.capabilities : []),
    ...(Array.isArray(provider.specialities) ? provider.specialities : []),
  ];
  if (provider.category) tokens.push(provider.category);
  if (provider.subcategory) tokens.push(provider.subcategory);
  if (provider.style) tokens.push(provider.style);
  return normalizeList(tokens);
};

const computeRequirementScore = (provider, contextTokens) => {
  if (!contextTokens.length) return 0;
  const providerTokens = collectProviderTokens(provider);
  if (!providerTokens.length) return 0;
  const matches = providerTokens.filter((token) => contextTokens.includes(token));
  if (!matches.length) return 0;
  // 8 puntos por coincidencia relevante, máximo 24
  return Math.min(matches.length * 8, 24);
};

const computeBudgetScore = (provider, { assignedBudget }) => {
  const target = Number.isFinite(assignedBudget) ? assignedBudget : parsePrice(assignedBudget);
  if (!target || target <= 0) return 0;
  const proposal =
    parsePrice(provider.presupuesto) ??
    parsePrice(provider.budgetSuggested) ??
    parsePrice(provider.priceRange) ??
    parsePrice(provider.lastBudgetAmount);
  if (!proposal || proposal <= 0) return 0;
  const diff = proposal - target;
  if (diff <= 0) {
    // Recompensa presupuestos iguales o inferiores (hasta +18)
    const pct = Math.abs(diff) / target;
    return Math.min(18, Math.round((1 - Math.min(pct, 0.5)) * 18));
  }
  const variance = diff / target;
  // Penaliza presupuestos superiores (-20 como máximo)
  return Math.max(-20, Math.round(-variance * 40));
};

/**
 * Calcula la recomendación automática a partir de los proveedores seleccionados.
 * @param {Array<Object>} providers
 * @param {Object} context
 * @param {Array<string>} context.wantedServices
 * @param {Array<string>} context.requiredTags
 * @param {Array<string>} context.requiredKeywords
 * @param {Object} context.preferences
 * @returns {{providerId:string, score:number, breakdown:Object, ordered:Array}|null}
 */
export function recommendBestProvider(providers = [], context = {}) {
  if (!Array.isArray(providers) || !providers.length) return null;
  const tokens = collectRequirementTokens(context);

  const ranked = providers
    .map((provider) => {
      if (!provider?.id) return null;
      const baseScore =
        (provider?.intelligentScore && provider.intelligentScore.score) ??
        provider?.aiMatch ??
        provider?.match ??
        60;

      const assignedBudget =
        provider?.assignedBudget ??
        provider?.presupuestoAsignado ??
        provider?.budgetTarget;

      const budgetScore = computeBudgetScore(provider, { assignedBudget });
      const requirementScore = computeRequirementScore(provider, tokens);

      const intelligence =
        provider?.intelligentScore ??
        computeSupplierScore(provider).score;

      const final =
        Math.round(
          (Number.isFinite(intelligence) ? intelligence : baseScore) +
            budgetScore +
            requirementScore,
        );

      return {
        id: provider.id,
        provider,
        baseScore: Math.round(baseScore),
        intelligence: Number.isFinite(intelligence) ? Math.round(intelligence) : Math.round(baseScore),
        budgetScore,
        requirementScore,
        finalScore: final,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.finalScore - a.finalScore);

  if (!ranked.length) return null;

  const winner = ranked[0];
  return {
    providerId: winner.id,
    score: winner.finalScore,
    breakdown: {
      base: winner.baseScore,
      intelligence: winner.intelligence,
      budget: winner.budgetScore,
      requirements: winner.requirementScore,
    },
    ordered: ranked,
  };
}

