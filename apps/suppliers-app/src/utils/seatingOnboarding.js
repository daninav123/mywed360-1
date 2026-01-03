/**
 * Utilidades para el onboarding del Seating Plan
 */

/**
 * Crea estado de onboarding por defecto
 * @returns {Object} Estado inicial de onboarding
 */
export const createDefaultOnboardingState = () => ({
  dismissed: false,
  steps: {
    spaceConfigured: false,
    guestsImported: false,
    firstAssignment: false,
  },
});

/**
 * Determina el paso actual del onboarding
 * @param {Object} steps - Pasos completados
 * @returns {string|null} ID del paso actual o null si completo
 */
export const determineOnboardingStep = (steps) => {
  if (!steps?.spaceConfigured) return 'space';
  if (!steps?.guestsImported) return 'guests';
  if (!steps?.firstAssignment) return 'assign';
  return null;
};

/**
 * Sanitiza el estado de onboarding
 * @param {*} value - Valor a sanitizar
 * @returns {Object} Estado sanitizado
 */
export const sanitizeOnboardingState = (value) => {
  if (!value || typeof value !== 'object') {
    return createDefaultOnboardingState();
  }

  const steps = value.steps && typeof value.steps === 'object' ? value.steps : {};

  return {
    dismissed: value.dismissed === true,
    steps: {
      spaceConfigured: steps.spaceConfigured === true,
      guestsImported: steps.guestsImported === true,
      firstAssignment: steps.firstAssignment === true,
    },
  };
};

/**
 * Compara dos estados de onboarding
 * @param {Object} a - Primer estado
 * @param {Object} b - Segundo estado
 * @returns {boolean} True si son iguales
 */
export const onboardingStatesEqual = (a, b) =>
  a.dismissed === b.dismissed &&
  !!a.steps?.spaceConfigured === !!b.steps?.spaceConfigured &&
  !!a.steps?.guestsImported === !!b.steps?.guestsImported &&
  !!a.steps?.firstAssignment === !!b.steps?.firstAssignment;

/**
 * Claves de los pasos de onboarding
 */
export const ONBOARDING_STEP_KEYS = ['spaceConfigured', 'guestsImported', 'firstAssignment'];

/**
 * Mapeo de IDs de paso a claves
 */
export const ONBOARDING_STEP_ID_MAP = {
  space: 'spaceConfigured',
  guests: 'guestsImported',
  assign: 'firstAssignment',
};

/**
 * Obtiene la clave del paso a partir del ID
 * @param {string} stepId - ID del paso
 * @returns {string|null} Clave del paso o null
 */
export const getStepKey = (stepId) => {
  return ONBOARDING_STEP_ID_MAP[stepId] || null;
};

/**
 * Verifica si el onboarding está completo
 * @param {Object} steps - Pasos completados
 * @returns {boolean} True si está completo
 */
export const isOnboardingComplete = (steps) => {
  return steps?.spaceConfigured && steps?.guestsImported && steps?.firstAssignment;
};
