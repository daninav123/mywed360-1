/**
 * Utilidades para el layout del Seating Plan
 */

/**
 * Valores seguros para evitar crashes
 * @param {*} value - Valor a validar
 * @param {*} defaultValue - Valor por defecto
 * @returns {*} Valor seguro
 */
export const ensureSafe = (value, defaultValue) => {
  return value != null ? value : defaultValue;
};

/**
 * Asegura que el array sea válido
 * @param {*} value - Valor a validar
 * @returns {Array} Array seguro
 */
export const ensureSafeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

/**
 * Asegura que hallSize sea válido
 * @param {*} hallSize - Tamaño del salón
 * @returns {Object} HallSize seguro
 */
export const ensureSafeHallSize = (hallSize) => {
  if (hallSize && typeof hallSize.width === 'number' && typeof hallSize.height === 'number') {
    return hallSize;
  }
  return { width: 1800, height: 1200 };
};

/**
 * Verifica si el salón está listo
 * @param {Object} hallSize - Tamaño del salón
 * @returns {boolean} True si está listo
 */
export const isHallReady = (hallSize) => {
  return Number.isFinite(hallSize?.width) && Number.isFinite(hallSize?.height);
};

/**
 * Filtra invitados pendientes (sin mesa)
 * @param {Array} guests - Lista de invitados
 * @returns {Array} Invitados pendientes
 */
export const getPendingGuests = (guests) => {
  try {
    const safeGuests = ensureSafeArray(guests);
    return safeGuests.filter((g) => !g?.table && !g?.tableId);
  } catch (error) {
    console.error('[seatingLayout] Error getting pending guests:', error);
    return [];
  }
};

/**
 * Crea snapshot de exportación
 * @param {Object} params - Parámetros del snapshot
 * @returns {Object} Snapshot para exportación
 */
export const createExportSnapshot = ({ tab, hallSize, tables, seats, guests, areas }) => {
  return {
    tab: ensureSafe(tab, 'banquet'),
    hallSize: ensureSafeHallSize(hallSize),
    tables: ensureSafeArray(tables),
    seats: ensureSafeArray(seats),
    guestsCount: ensureSafeArray(guests).length,
    areas: ensureSafeArray(areas),
  };
};

/**
 * Crea mapa de locks de mesas
 * @param {Array} locks - Lista de locks
 * @returns {Map} Mapa de locks por tableId
 */
export const createTableLocksMap = (locks) => {
  const map = new Map();

  if (Array.isArray(locks)) {
    locks.forEach((lock) => {
      if (lock.resourceType === 'table') {
        map.set(String(lock.resourceId), lock);
      }
    });
  }

  return map;
};

/**
 * Filtra colaboradores que no son el usuario actual
 * @param {Array} collaborators - Lista de colaboradores
 * @returns {Array} Otros colaboradores
 */
export const getOtherCollaborators = (collaborators) => {
  return Array.isArray(collaborators) ? collaborators.filter((member) => !member?.isCurrent) : [];
};

/**
 * Configuraciones de layout por tipo de dispositivo
 */
export const LAYOUT_CONFIGS = {
  desktop: {
    showLibrary: true,
    showSmart: true,
    showInspector: true,
    showGuests: true,
  },
  tablet: {
    showLibrary: true,
    showSmart: false,
    showInspector: true,
    showGuests: false,
  },
  mobile: {
    showLibrary: false,
    showSmart: false,
    showInspector: false,
    showGuests: false,
  },
};

/**
 * Obtiene configuración de layout según el dispositivo
 * @param {boolean} isMobile - Si es mobile
 * @param {boolean} isTablet - Si es tablet
 * @returns {Object} Configuración de layout
 */
export const getLayoutConfig = (isMobile, isTablet = false) => {
  if (isMobile) return LAYOUT_CONFIGS.mobile;
  if (isTablet) return LAYOUT_CONFIGS.tablet;
  return LAYOUT_CONFIGS.desktop;
};
