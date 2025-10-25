/**
 * StyleConsistencyService
 * ------------------------
 * Utilidades puras para calcular pesos de estilo, detectar conflictos
 * y normalizar preferencias con contrastes controlados.
 *
 * Estas funciones son sin side-effects para que puedan ser probadas en vitest.
 */

export const CONTRAST_LEVELS = {
  COMPLEMENTA: 'complementa',
  CONTRASTE_CONTROLADO: 'contraste_controlado',
  FULL_CONTRASTE: 'full_contraste',
};

const DEFAULT_CONTRAST_WEIGHT = 0.15;
const DEFAULT_CONTRAST_LIMIT = 0.35;

export function normalizePreference(preference = {}) {
  const {
    id,
    idea,
    nivelContraste = CONTRAST_LEVELS.COMPLEMENTA,
    zonaAplicacion,
    relacionaConStyle,
    weight,
    motivo,
    requiresReview,
  } = preference;

  const normalized = {
    id: id ?? idea ?? '',
    idea,
    nivelContraste,
    zonaAplicacion: zonaAplicacion ?? null,
    relacionaConStyle: relacionaConStyle ?? null,
    weight: typeof weight === 'number' ? weight : DEFAULT_CONTRAST_WEIGHT,
    motivo: motivo ?? null,
    requiresReview: Boolean(requiresReview),
  };

  if (normalized.nivelContraste === CONTRAST_LEVELS.COMPLEMENTA) {
    normalized.weight = 0;
  }

  return normalized;
}

export function computeStyleWeights(preferences = [], options = {}) {
  const limit = options.contrastLimit ?? DEFAULT_CONTRAST_LIMIT;
  const normalized = preferences.map(normalizePreference);
  const totalContrast = normalized
    .filter((pref) => pref.nivelContraste !== CONTRAST_LEVELS.COMPLEMENTA)
    .reduce((sum, pref) => sum + pref.weight, 0);

  const contrastWeight = Math.min(Number(totalContrast.toFixed(2)), limit);
  const coreStyleWeight = Number(Math.max(1 - contrastWeight, 0).toFixed(2));

  return {
    coreStyleWeight,
    contrastWeight,
    limit,
    breakdown: normalized.map((pref) => ({
      id: pref.id,
      idea: pref.idea,
      nivelContraste: pref.nivelContraste,
      weight: pref.weight,
    })),
  };
}

export function detectStyleConflicts(preferences = [], weights = {}, options = {}) {
  const limit = weights.limit ?? options.contrastLimit ?? DEFAULT_CONTRAST_LIMIT;
  const conflicts = [];
  const normalized = preferences.map(normalizePreference);

  for (const pref of normalized) {
    if (pref.nivelContraste === CONTRAST_LEVELS.COMPLEMENTA) continue;
    if (!pref.zonaAplicacion) {
      conflicts.push({
        id: pref.id,
        type: 'missing_zone',
        message: `El contraste "${pref.idea}" no tiene zonaAplicacion definida.`,
      });
    }
    if (!pref.relacionaConStyle) {
      conflicts.push({
        id: pref.id,
        type: 'missing_relation',
        message: `El contraste "${pref.idea}" no referencia al estilo base.`,
      });
    }
    if (pref.requiresReview) {
      conflicts.push({
        id: pref.id,
        type: 'requires_review',
        message: `El contraste "${pref.idea}" está marcado para revisión manual.`,
      });
    }
  }

  if (weights.contrastWeight > limit) {
    conflicts.push({
      id: 'style_balance',
      type: 'limit_exceeded',
      message: `El peso de contrastes (${weights.contrastWeight}) supera el límite permitido (${limit}).`,
    });
  }

  return conflicts;
}

export function buildConsistencyReport(preferences = [], options = {}) {
  const weights = computeStyleWeights(preferences, options);
  const conflicts = detectStyleConflicts(preferences, weights, options);
  return { weights, conflicts };
}
