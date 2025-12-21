/**
 * Utilidades para persistencia de datos del Seating Plan
 */

/**
 * Guarda preferencias de UI en localStorage
 * @param {string} weddingId - ID de la boda
 * @param {Object} prefs - Preferencias a guardar
 * @returns {boolean} True si se guardó correctamente
 */
export const saveUIPrefs = (weddingId, prefs) => {
  if (typeof window === 'undefined' || !prefs || typeof prefs !== 'object') {
    return false;
  }

  try {
    const key = `seatingPlan:${weddingId || 'default'}:ui-prefs`;
    const currentRaw = window.localStorage.getItem(key);

    let base = {};
    if (currentRaw) {
      try {
        const parsed = JSON.parse(currentRaw);
        if (parsed && typeof parsed === 'object') {
          base = parsed;
        }
      } catch (error) {
        console.warn('[seatingStorage] Error parsing existing prefs:', error);
        base = {};
      }
    }

    const merged = { ...base, ...prefs };
    window.localStorage.setItem(key, JSON.stringify(merged));
    return true;
  } catch (error) {
    console.error('[seatingStorage] Error saving UI prefs:', error);
    return false;
  }
};

/**
 * Carga preferencias de UI desde localStorage
 * @param {string} weddingId - ID de la boda
 * @returns {Object|null} Preferencias o null si no existen
 */
export const loadUIPrefs = (weddingId) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const key = `seatingPlan:${weddingId || 'default'}:ui-prefs`;
    const raw = window.localStorage.getItem(key);

    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') {
      return null;
    }

    return data;
  } catch (error) {
    console.error('[seatingStorage] Error loading UI prefs:', error);
    return null;
  }
};

/**
 * Limpia preferencias de UI
 * @param {string} weddingId - ID de la boda
 * @returns {boolean} True si se limpió correctamente
 */
export const clearUIPrefs = (weddingId) => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const key = `seatingPlan:${weddingId || 'default'}:ui-prefs`;
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('[seatingStorage] Error clearing UI prefs:', error);
    return false;
  }
};

/**
 * Marca que el usuario ha visitado el seating plan
 * @returns {boolean} True si se guardó correctamente
 */
export const markAsVisited = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem('seating-has-visited', 'true');
    return true;
  } catch (error) {
    console.error('[seatingStorage] Error marking as visited:', error);
    return false;
  }
};

/**
 * Verifica si el usuario ya visitó el seating plan
 * @returns {boolean} True si ya visitó
 */
export const hasVisited = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem('seating-has-visited') === 'true';
  } catch (error) {
    console.error('[seatingStorage] Error checking visit status:', error);
    return false;
  }
};

/**
 * Preferencias por defecto
 */
export const DEFAULT_UI_PREFS = {
  showRulers: true,
  showSeatNumbers: false,
  showTables: true,
  showAdvancedTools: true,
  showLibraryPanel: true,
  showInspectorPanel: true,
  showSmartPanelPinned: true,
  showOverview: true,
  designFocusMode: false,
};
