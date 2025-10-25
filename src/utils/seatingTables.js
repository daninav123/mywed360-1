import i18n from '../i18n';

// Utilities for seating plan tables: defaults, capacity calculation and sanitization
const SEAT_SPACING_CM = 60; // average space needed per guest along perimeter

export const TABLE_TYPES = [
  {
    id: 'round',
    label: 'Mesa redonda',
    shape: 'circle',
    defaults: {
      diameter: 180,
      seats: 8,
    },
  },
  {
    id: 'square',
    label: 'Mesa cuadrada',
    shape: 'rectangle',
    defaults: {
      width: 160,
      height: 160,
      seats: 8,
    },
  },
  {
    id: 'imperial',
    label: 'Mesa imperial',
    shape: 'rectangle',
    defaults: {
      width: 320,
      height: 100,
      seats: 12,
    },
  },
  {
    id: 'cocktail',
    label: i18n.t('common.mesa_coctel_alta'),
    shape: 'circle',
    defaults: {
      diameter: 90,
      seats: 0,
    },
  },
  {
    id: 'auxiliary',
    label: 'Mesa auxiliar / staff',
    shape: 'rectangle',
    defaults: {
      width: 140,
      height: 70,
      seats: 0,
    },
  },
];

const TABLE_TYPES_MAP = TABLE_TYPES.reduce((acc, type) => {
  acc[type.id] = type;
  return acc;
}, {});

export const TABLE_TYPE_IDS = TABLE_TYPES.map((t) => t.id);

export function inferTableType(table = {}) {
  if (table.tableType && TABLE_TYPES_MAP[table.tableType]) {
    return table.tableType;
  }
  const shape = table.shape || (table.diameter ? 'circle' : 'rectangle');
  if (shape === 'circle') return 'round';

  const width = Number(table.width) || Number(table.length) || 0;
  const height = Number(table.height) || 0;

  if (!width || !height) return 'square';
  if (width >= height * 1.6) return 'imperial';
  if (height >= width * 1.6) return 'imperial';
  return 'square';
}

export function computeTableCapacity(table = {}) {
  const type = inferTableType(table);
  const width = Number(table.width) || Number(table.length) || 0;
  const height = Number(table.height) || 0;
  const diameter = Number(table.diameter) || 0;

  switch (type) {
    case 'roundi18n.t('common.const_circ_mathpi_diameter_circ_return')square': {
      if (!width || !height) return 0;
      const perimetro = 2 * (width + height);
      const seats = Math.floor(perimetro / SEAT_SPACING_CM);
      return Math.max(4, seats);
    }
    case 'imperial': {
      if (!width) return 0;
      const lados = Math.floor(width / SEAT_SPACING_CM) * 2;
      const cabeceras = height >= 90 ? 2 : 0;
      return Math.max(6, lados + cabeceras);
    }
    case 'cocktail':
      // mesas de apoyo – recomendamos 4 personas de pie
      return 4;
    case 'auxiliary':
      // staff/auxiliares; normalmente sin invitados
      return 0;
    default:
      return Number(table.seats) || 0;
  }
}

export function createTableFromType(tableType = 'round', overrides = {}) {
  const type = TABLE_TYPES_MAP[tableType] || TABLE_TYPES_MAP.round;
  const defaults = type.defaults || {};
  const width = overrides.width ?? defaults.width ?? 0;
  const height = overrides.height ?? defaults.height ?? overrides.length ?? 0;
  const diameter = overrides.diameter ?? defaults.diameter ?? 0;
  const base = {
    tableType: type.id,
    shape: type.shape,
    autoCapacity: overrides.autoCapacity ?? true,
    width,
    height,
    diameter,
  };

  const withOverrides = {
    ...base,
    ...overrides,
  };
  const seats =
    overrides.seats != null && overrides.autoCapacity === false
      ? Number(overrides.seats)
      : computeTableCapacity({
          ...withOverrides,
          width,
          height,
          diameter,
        });

  return {
    id: Date.now(),
    name: overrides.name || '',
    x: Number(overrides.x) || 120,
    y: Number(overrides.y) || 120,
    shape: type.shape,
    tableType: type.id,
    autoCapacity: overrides.autoCapacity ?? true,
    width,
    height,
    diameter,
    seats: Math.max(0, Math.round(seats)),
    enabled: overrides.enabled !== false,
  };
}

export function sanitizeTable(rawTable = {}, { forceAuto = false } = {}) {
  const tableType = inferTableType(rawTable);
  const typeConfig = TABLE_TYPES_MAP[tableType] || TABLE_TYPES_MAP.round;
  const shape = typeConfig.shape;
  const width = rawTable.width ?? rawTable.length ?? typeConfig.defaults.width ?? 0;
  const height = rawTable.height ?? typeConfig.defaults.height ?? rawTable.length ?? 0;
  const diameter = rawTable.diameter ?? typeConfig.defaults.diameter ?? 0;
  const autoCapacity =
    forceAuto || rawTable.autoCapacity === true || rawTable.seats == null
      ? true
      : rawTable.autoCapacity === false
      ? false
      : false;

  const base = {
    ...rawTable,
    tableType,
    shape,
    width,
    height,
    diameter,
    autoCapacity,
  };

  let seats = Number(rawTable.seats);
  if (base.autoCapacity) {
    seats = computeTableCapacity(base);
  }
  if (!Number.isFinite(seats) || seats < 0) seats = 0;

  return {
    ...base,
    seats: Math.round(seats),
  };
}

export function updateTableWithField(table, field, value) {
  const next = { ...table };
  switch (field) {
    case 'tableType': {
      const cleaned = createTableFromType(value, {
        ...table,
        tableType: value,
        autoCapacity: true,
        id: table.id,
        x: table.x,
        y: table.y,
        name: table.name,
      });
      return cleaned;
    }
    case 'autoCapacity': {
      const enabled = Boolean(value);
      next.autoCapacity = enabled;
      if (enabled) {
        next.seats = computeTableCapacity(next);
      }
      return next;
    }
    case 'width':
    case 'height':
    case 'diameter': {
      const numeric = Number(value) || 0;
      next[field] = numeric;
      if (field === 'height') next.length = numeric; // compat legacy
      if (next.autoCapacity !== false) {
        next.autoCapacity = true;
        next.seats = computeTableCapacity(next);
      }
      return next;
    }
    case 'seats': {
      next.seats = Math.max(0, Number(value) || 0);
      next.autoCapacity = false;
      return next;
    }
    case 'name':
      next.name = value;
      return next;
    default:
      next[field] = value;
      return next;
  }
}

