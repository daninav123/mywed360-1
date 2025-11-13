/**
 * Utilidades para generar layouts automáticos del seating plan
 * basándose en los invitados existentes y sus asignaciones de mesa
 */

/**
 * Analiza los invitados y extrae información sobre mesas asignadas
 */
export const analyzeGuestAssignments = (guests = []) => {
  const tableMap = new Map();
  const unassignedGuests = [];

  guests.forEach((guest) => {
    const tableId = guest?.tableId;
    const tableName = guest?.table;
    const key = tableId || tableName;

    if (!key) {
      unassignedGuests.push(guest);
      return;
    }

    if (!tableMap.has(key)) {
      tableMap.set(key, {
        id: tableId || key,
        name: tableName || `Mesa ${tableId || key}`,
        guests: [],
        totalSeats: 0,
      });
    }

    const table = tableMap.get(key);
    table.guests.push(guest);
    // Contar invitado + acompañantes
    table.totalSeats += 1 + (parseInt(guest?.companion, 10) || 0);
  });

  return {
    tables: Array.from(tableMap.values()),
    unassignedGuests,
    totalTables: tableMap.size,
    totalAssigned: guests.length - unassignedGuests.length,
    totalGuests: guests.length, // ✨ Añadir total de invitados
  };
};

/**
 * Calcula las dimensiones óptimas para una distribución en grid
 */
export const calculateGridDimensions = (totalTables) => {
  if (totalTables <= 0) return { rows: 0, cols: 0 };

  // Intentar hacer un grid lo más cuadrado posible
  const sqrt = Math.sqrt(totalTables);
  const cols = Math.ceil(sqrt);
  const rows = Math.ceil(totalTables / cols);

  return { rows, cols };
};

/**
 * Distribución en COLUMNAS (rectangular)
 */
export const generateColumnsLayout = (tables, hallSize = { width: 1800, height: 1200 }) => {
  if (!tables || tables.length === 0) return [];

  const { rows, cols } = calculateGridDimensions(tables.length);
  const marginX = 120;
  const marginY = 160;
  const gapX = (hallSize.width - marginX * 2) / (cols + 1);
  const gapY = (hallSize.height - marginY * 2) / (rows + 1);

  return tables.map((table, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    return {
      ...table,
      x: marginX + (col + 1) * gapX,
      y: marginY + (row + 1) * gapY,
      seats: table.totalSeats || 8,
      shape: 'circle',
      tableType: 'round',
      autoCapacity: false,
    };
  });
};

/**
 * Distribución CIRCULAR
 */
export const generateCircularLayout = (tables, hallSize = { width: 1800, height: 1200 }) => {
  if (!tables || tables.length === 0) return [];

  const centerX = hallSize.width / 2;
  const centerY = hallSize.height / 2;
  const radius = Math.min(hallSize.width, hallSize.height) * 0.35;
  const angleStep = (2 * Math.PI) / tables.length;

  return tables.map((table, index) => {
    const angle = index * angleStep - Math.PI / 2; // Empezar desde arriba

    return {
      ...table,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      seats: table.totalSeats || 8,
      shape: 'circle',
      tableType: 'round',
      autoCapacity: false,
    };
  });
};

/**
 * Distribución con PASILLOS centrales
 */
export const generateAisleLayout = (tables, hallSize = { width: 1800, height: 1200 }) => {
  if (!tables || tables.length === 0) return [];

  const { rows } = calculateGridDimensions(tables.length);
  const colsPerSide = Math.ceil(tables.length / rows / 2);

  const marginX = 100;
  const marginY = 160;
  const aisleWidth = 200; // Pasillo central
  const sideWidth = (hallSize.width - marginX * 2 - aisleWidth) / 2;
  const gapX = sideWidth / (colsPerSide + 1);
  const gapY = (hallSize.height - marginY * 2) / (rows + 1);

  return tables.map((table, index) => {
    const row = Math.floor(index / (colsPerSide * 2));
    const isLeftSide = index % (colsPerSide * 2) < colsPerSide;
    const colInSide = index % colsPerSide;

    let x;
    if (isLeftSide) {
      x = marginX + (colInSide + 1) * gapX;
    } else {
      x = marginX + sideWidth + aisleWidth + (colInSide + 1) * gapX;
    }

    return {
      ...table,
      x,
      y: marginY + (row + 1) * gapY,
      seats: table.totalSeats || 8,
      shape: 'circle',
      tableType: 'round',
      autoCapacity: false,
    };
  });
};

/**
 * Distribución en U
 */
export const generateUShapeLayout = (tables, hallSize = { width: 1800, height: 1200 }) => {
  if (!tables || tables.length === 0) return [];

  const margin = 120;
  const tablesPerSide = Math.ceil(tables.length / 3);

  const positions = [];
  const gapX = (hallSize.width - margin * 2) / (tablesPerSide + 1);
  const gapY = (hallSize.height - margin * 2) / 3;

  // Lado superior (horizontal)
  const topCount = Math.ceil(tablesPerSide);
  for (let i = 0; i < topCount && positions.length < tables.length; i++) {
    positions.push({
      x: margin + (i + 1) * gapX,
      y: margin + gapY,
    });
  }

  // Lado derecho (vertical)
  const rightCount = Math.ceil((tables.length - topCount) / 2);
  for (let i = 0; i < rightCount && positions.length < tables.length; i++) {
    positions.push({
      x: hallSize.width - margin,
      y: margin + (i + 2) * gapY,
    });
  }

  // Lado inferior (horizontal, de derecha a izquierda)
  const bottomCount = tables.length - positions.length;
  for (let i = 0; i < bottomCount; i++) {
    positions.push({
      x: hallSize.width - margin - (i + 1) * gapX,
      y: hallSize.height - margin,
    });
  }

  return tables.map((table, index) => ({
    ...table,
    x: positions[index]?.x || margin,
    y: positions[index]?.y || margin,
    seats: table.totalSeats || 8,
    shape: 'circle',
    tableType: 'round',
    autoCapacity: false,
  }));
};

/**
 * Distribución ALEATORIA (con separación mínima)
 */
export const generateRandomLayout = (tables, hallSize = { width: 1800, height: 1200 }) => {
  if (!tables || tables.length === 0) return [];

  const margin = 120;
  const minDistance = 150;
  const maxAttempts = 100;

  const positions = [];

  tables.forEach((table) => {
    let position = null;
    let attempts = 0;

    while (!position && attempts < maxAttempts) {
      const testX = margin + Math.random() * (hallSize.width - margin * 2);
      const testY = margin + Math.random() * (hallSize.height - margin * 2);

      // Verificar distancia mínima con otras mesas
      const tooClose = positions.some((pos) => {
        const dx = testX - pos.x;
        const dy = testY - pos.y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });

      if (!tooClose) {
        position = { x: testX, y: testY };
      }

      attempts++;
    }

    positions.push(position || { x: margin, y: margin });
  });

  return tables.map((table, index) => ({
    ...table,
    x: positions[index].x,
    y: positions[index].y,
    seats: table.totalSeats || 8,
    shape: 'circle',
    tableType: 'round',
    autoCapacity: false,
  }));
};

/**
 * Distribución en ESPIGA / CHEVRON
 */
export const generateChevronLayout = (tables, hallSize = { width: 1800, height: 1200 }) => {
  if (!tables || tables.length === 0) return [];

  const { rows } = calculateGridDimensions(tables.length);
  const tablesPerRow = Math.ceil(tables.length / rows);

  const marginX = 120;
  const marginY = 160;
  const gapX = (hallSize.width - marginX * 2) / (tablesPerRow + 1);
  const gapY = (hallSize.height - marginY * 2) / (rows + 1);
  const chevronOffset = 60; // Offset para crear el patrón en espiga

  return tables.map((table, index) => {
    const row = Math.floor(index / tablesPerRow);
    const col = index % tablesPerRow;

    // Alternar offset para crear patrón en espiga
    const offset = row % 2 === 0 ? chevronOffset : -chevronOffset;

    return {
      ...table,
      x: marginX + (col + 1) * gapX + offset,
      y: marginY + (row + 1) * gapY,
      seats: table.totalSeats || 8,
      shape: 'circle',
      tableType: 'round',
      autoCapacity: false,
    };
  });
};

/**
 * Generador principal que selecciona el tipo de distribución
 */
export const generateAutoLayout = (
  guests,
  layoutType = 'columns',
  hallSize = { width: 1800, height: 1200 }
) => {
  const analysis = analyzeGuestAssignments(guests);

  if (analysis.totalTables === 0) {
    return {
      tables: [],
      unassignedGuests: analysis.unassignedGuests,
      message: 'No hay mesas asignadas todavía',
    };
  }

  let tables = [];

  switch (layoutType) {
    case 'circular':
      tables = generateCircularLayout(analysis.tables, hallSize);
      break;
    case 'aisle':
      tables = generateAisleLayout(analysis.tables, hallSize);
      break;
    case 'u-shape':
      tables = generateUShapeLayout(analysis.tables, hallSize);
      break;
    case 'random':
      tables = generateRandomLayout(analysis.tables, hallSize);
      break;
    case 'chevron':
      tables = generateChevronLayout(analysis.tables, hallSize);
      break;
    case 'columns':
    default:
      tables = generateColumnsLayout(analysis.tables, hallSize);
      break;
  }

  return {
    tables,
    unassignedGuests: analysis.unassignedGuests,
    totalTables: analysis.totalTables,
    totalAssigned: analysis.totalAssigned,
    message: `${analysis.totalTables} mesas generadas con ${analysis.totalAssigned} invitados asignados`,
  };
};

/**
 * Opciones de distribución disponibles
 */
export const LAYOUT_OPTIONS = [
  {
    id: 'columns',
    name: 'Columnas',
    description: 'Distribución rectangular ordenada',
    icon: 'grid',
  },
  {
    id: 'circular',
    name: 'Circular',
    description: 'Mesas dispuestas en círculo',
    icon: 'circle',
  },
  {
    id: 'aisle',
    name: 'Con pasillos',
    description: 'Pasillo central entre grupos',
    icon: 'columns',
  },
  {
    id: 'u-shape',
    name: 'En U',
    description: 'Forma de herradura',
    icon: 'u',
  },
  {
    id: 'chevron',
    name: 'Espiga',
    description: 'Patrón alternado en zigzag',
    icon: 'chevron',
  },
  {
    id: 'random',
    name: 'Aleatorio',
    description: 'Posiciones aleatorias con separación',
    icon: 'shuffle',
  },
];
