/**
 * Utilidades para manejo de áreas en Seating Plan
 */

export const AREA_TYPE_META = {
  boundary: { label: 'Perímetro', color: '#2563eb', order: 1 },
  aisle: { label: 'Pasillos', color: '#0ea5e9', order: 2 },
  door: { label: 'Puertas', color: '#16a34a', order: 3 },
  obstacle: { label: 'Obstáculos', color: '#f97316', order: 4 },
  stage: { label: 'Escenario', color: '#9333ea', order: 5 },
  vendor: { label: 'Zona proveedor', color: '#6366f1', order: 6 },
  kids: { label: 'Área infantil', color: '#f59e0b', order: 7 },
  free: { label: 'Área libre', color: '#4b5563', order: 8 },
  default: { label: 'Área', color: '#6b7280', order: 99 },
};

const AREA_ALIAS = {
  rectangle: 'obstacle',
  rect: 'obstacle',
  square: 'obstacle',
  line: 'aisle',
  walkway: 'aisle',
  path: 'aisle',
  boundary: 'boundary',
  perimeter: 'boundary',
  door: 'door',
  doorway: 'door',
  obstacle: 'obstacle',
  aisle: 'aisle',
  free: 'free',
  curve: 'free',
  stage: 'stage',
  vendor: 'vendor',
  suppliers: 'vendor',
  kids: 'kids',
  kidsarea: 'kids',
  play: 'kids',
};

/**
 * Resuelve el tipo de área normalizado
 * @param {Object} area - Objeto de área
 * @returns {string} Tipo de área normalizado
 */
export const resolveAreaType = (area) => {
  const rawType =
    typeof area?.type === 'string'
      ? area.type
      : typeof area?.semantic === 'string'
        ? area.semantic
        : typeof area?.kind === 'string'
          ? area.kind
          : typeof area?.label === 'string'
            ? area.label
            : null;

  let normalized = typeof rawType === 'string' ? rawType.trim().toLowerCase() : null;

  if (!normalized && area && typeof area.drawMode === 'string') {
    normalized = area.drawMode.trim().toLowerCase();
  }

  if (!normalized && Array.isArray(area)) {
    normalized = 'free';
  }

  if (!normalized) {
    normalized = 'free';
  }

  normalized = AREA_ALIAS[normalized] || normalized;

  if (!AREA_TYPE_META[normalized]) {
    return 'free';
  }

  return normalized;
};

/**
 * Genera resumen de áreas por tipo
 * @param {Array} areas - Array de áreas
 * @returns {Array} Resumen de áreas agrupadas por tipo
 */
export const generateAreaSummary = (areas) => {
  if (!Array.isArray(areas) || areas.length === 0) {
    return [];
  }

  const counts = new Map();

  areas.forEach((area) => {
    if (!area) return;
    const type = resolveAreaType(area);
    const prev = counts.get(type) || 0;
    counts.set(type, prev + 1);
  });

  const result = [];
  counts.forEach((count, type) => {
    const meta = AREA_TYPE_META[type] || AREA_TYPE_META.default;
    result.push({
      type,
      count,
      label: meta.label,
      color: meta.color,
      order: meta.order,
    });
  });

  result.sort((a, b) => a.order - b.order);
  return result;
};

/**
 * Valida si un área es válida
 * @param {Object} area - Objeto de área
 * @returns {boolean} True si es válida
 */
export const isValidArea = (area) => {
  if (!area || typeof area !== 'object') return false;

  // Debe tener coordenadas o puntos
  if (!area.x && !area.y && !Array.isArray(area.points)) return false;

  return true;
};
