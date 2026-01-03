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
  const tableDiameter = 120; // Diámetro típico de mesa redonda
  const minSpacing = 120; // Espaciado mínimo entre mesas
  const absoluteMinSpacing = 100; // ⬅️ Espaciado mínimo ABSOLUTO (validaciones + expansión 40cm)

  // Calcular espaciado considerando el tamaño de las mesas
  const availableWidth = hallSize.width - marginX * 2;
  const availableHeight = hallSize.height - marginY * 2;
  const totalTableWidth = cols * tableDiameter + (cols - 1) * minSpacing;
  const totalTableHeight = rows * tableDiameter + (rows - 1) * minSpacing;

  // Si no caben con el espaciado mínimo, reducir proporcionalmente pero NUNCA menos de 100cm
  const spacingX =
    totalTableWidth > availableWidth
      ? Math.max(absoluteMinSpacing, (availableWidth - cols * tableDiameter) / (cols - 1 || 1))
      : minSpacing;
  const spacingY =
    totalTableHeight > availableHeight
      ? Math.max(absoluteMinSpacing, (availableHeight - rows * tableDiameter) / (rows - 1 || 1))
      : minSpacing;

  // Centrar el grid
  const startX = marginX + (availableWidth - (cols * tableDiameter + (cols - 1) * spacingX)) / 2;
  const startY = marginY + (availableHeight - (rows * tableDiameter + (rows - 1) * spacingY)) / 2;

  return tables.map((table, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    return {
      ...table,
      x: startX + tableDiameter / 2 + col * (tableDiameter + spacingX),
      y: startY + tableDiameter / 2 + row * (tableDiameter + spacingY),
      seats: table.totalSeats || 8,
      diameter: tableDiameter,
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
  const tableDiameter = 120;

  // Calcular radio considerando el tamaño de las mesas y espaciado mínimo
  // El radio debe ser suficiente para que las mesas no se toquen en la circunferencia
  const minSpacing = 100;
  const absoluteMinSpacing = 100; // ⬅️ Espaciado mínimo ABSOLUTO (validaciones + expansión 40cm)
  const circumference = tables.length * (tableDiameter + Math.max(minSpacing, absoluteMinSpacing));
  const calculatedRadius = circumference / (2 * Math.PI);
  const maxRadius = Math.min(hallSize.width, hallSize.height) * 0.4;
  const radius = Math.min(calculatedRadius, maxRadius);

  const angleStep = (2 * Math.PI) / tables.length;

  return tables.map((table, index) => {
    const angle = index * angleStep - Math.PI / 2; // Empezar desde arriba

    return {
      ...table,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      seats: table.totalSeats || 8,
      diameter: tableDiameter,
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
  const tableDiameter = 120;
  const minSpacing = 120;
  const absoluteMinSpacing = 100; // ⬅️ Espaciado mínimo ABSOLUTO (validaciones + expansión 40cm)
  const aisleWidth = 250; // Pasillo central más ancho
  const sideWidth = (hallSize.width - marginX * 2 - aisleWidth) / 2;

  // Espaciado considerando el tamaño de las mesas, NUNCA menos de 100cm
  const availableWidthPerSide = sideWidth - tableDiameter;
  const spacingX =
    colsPerSide > 1
      ? Math.max(absoluteMinSpacing, availableWidthPerSide / colsPerSide)
      : minSpacing;
  const availableHeight = hallSize.height - marginY * 2 - rows * tableDiameter;
  const spacingY = rows > 1 ? Math.max(absoluteMinSpacing, availableHeight / rows) : minSpacing;

  return tables.map((table, index) => {
    const row = Math.floor(index / (colsPerSide * 2));
    const isLeftSide = index % (colsPerSide * 2) < colsPerSide;
    const colInSide = index % colsPerSide;

    let x;
    if (isLeftSide) {
      x = marginX + tableDiameter / 2 + colInSide * (tableDiameter + spacingX);
    } else {
      x =
        marginX +
        sideWidth +
        aisleWidth +
        tableDiameter / 2 +
        colInSide * (tableDiameter + spacingX);
    }

    return {
      ...table,
      x,
      y: marginY + tableDiameter / 2 + row * (tableDiameter + spacingY),
      seats: table.totalSeats || 8,
      diameter: tableDiameter,
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
  const tableDiameter = 120;
  const minSpacing = 120;
  const absoluteMinSpacing = 100; // ⬅️ Espaciado mínimo ABSOLUTO (validaciones + expansión 40cm)
  const tablesPerSide = Math.ceil(tables.length / 3);

  const positions = [];
  const availableWidth = hallSize.width - margin * 2 - tableDiameter;
  const availableHeight = hallSize.height - margin * 2 - tableDiameter;

  const spacingX =
    tablesPerSide > 1 ? Math.max(absoluteMinSpacing, availableWidth / tablesPerSide) : minSpacing;
  const spacingY = Math.max(absoluteMinSpacing, availableHeight / 3);

  // Lado superior (horizontal)
  const topCount = Math.ceil(tablesPerSide);
  for (let i = 0; i < topCount && positions.length < tables.length; i++) {
    positions.push({
      x: margin + tableDiameter / 2 + i * spacingX,
      y: margin + tableDiameter / 2,
    });
  }

  // Lado derecho (vertical)
  const rightCount = Math.ceil((tables.length - topCount) / 2);
  for (let i = 0; i < rightCount && positions.length < tables.length; i++) {
    positions.push({
      x: hallSize.width - margin - tableDiameter / 2,
      y: margin + tableDiameter / 2 + (i + 1) * spacingY,
    });
  }

  // Lado inferior (horizontal, de derecha a izquierda)
  const bottomCount = tables.length - positions.length;
  for (let i = 0; i < bottomCount; i++) {
    positions.push({
      x: hallSize.width - margin - tableDiameter / 2 - i * spacingX,
      y: hallSize.height - margin - tableDiameter / 2,
    });
  }

  return tables.map((table, index) => ({
    ...table,
    x: positions[index]?.x || margin + tableDiameter / 2,
    y: positions[index]?.y || margin + tableDiameter / 2,
    seats: table.totalSeats || 8,
    diameter: tableDiameter,
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
  const tableDiameter = 120;
  const minDistance = tableDiameter + 80; // Diámetro de mesa + espaciado mínimo
  const maxAttempts = 200; // Más intentos para encontrar posición válida

  const positions = [];

  tables.forEach((table) => {
    let position = null;
    let attempts = 0;

    while (!position && attempts < maxAttempts) {
      const testX =
        margin + tableDiameter / 2 + Math.random() * (hallSize.width - margin * 2 - tableDiameter);
      const testY =
        margin + tableDiameter / 2 + Math.random() * (hallSize.height - margin * 2 - tableDiameter);

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

    // Si no se encuentra posición, usar grid como fallback
    if (!position) {
      const gridIndex = positions.length;
      const cols = Math.ceil(Math.sqrt(tables.length));
      const row = Math.floor(gridIndex / cols);
      const col = gridIndex % cols;
      position = {
        x: margin + tableDiameter / 2 + col * (tableDiameter + 100),
        y: margin + tableDiameter / 2 + row * (tableDiameter + 100),
      };
    }

    positions.push(position);
  });

  return tables.map((table, index) => ({
    ...table,
    x: positions[index].x,
    y: positions[index].y,
    seats: table.totalSeats || 8,
    diameter: tableDiameter,
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
  const tableDiameter = 120;
  const minSpacing = 100;
  const chevronOffset = 80; // Offset para crear el patrón en espiga

  // Calcular espaciado considerando el tamaño de las mesas
  const availableWidth = hallSize.width - marginX * 2 - Math.abs(chevronOffset) * 2;
  const availableHeight = hallSize.height - marginY * 2;
  const totalTableWidth = tablesPerRow * tableDiameter + (tablesPerRow - 1) * minSpacing;
  const totalTableHeight = rows * tableDiameter + (rows - 1) * minSpacing;

  const spacingX =
    totalTableWidth > availableWidth
      ? (availableWidth - tablesPerRow * tableDiameter) / (tablesPerRow - 1 || 1)
      : minSpacing;
  const spacingY =
    totalTableHeight > availableHeight
      ? (availableHeight - rows * tableDiameter) / (rows - 1 || 1)
      : minSpacing;

  const startX = marginX + tableDiameter / 2;
  const startY = marginY + tableDiameter / 2;

  return tables.map((table, index) => {
    const row = Math.floor(index / tablesPerRow);
    const col = index % tablesPerRow;

    // Alternar offset para crear patrón en espiga
    const offset = row % 2 === 0 ? chevronOffset : -chevronOffset;

    return {
      ...table,
      x: startX + col * (tableDiameter + spacingX) + offset,
      y: startY + row * (tableDiameter + spacingY),
      seats: table.totalSeats || 8,
      diameter: tableDiameter,
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

  // Si no hay mesas asignadas pero sí invitados, generar mesas automáticamente
  if (analysis.totalTables === 0) {
    if (analysis.totalGuests === 0) {
      return {
        tables: [],
        unassignedGuests: [],
        message: 'No hay invitados para generar mesas',
      };
    }

    // Generar mesas basándose en el número de invitados
    // Asumiendo 8-10 personas por mesa
    const guestsPerTable = 10;
    const numTables = Math.ceil(analysis.totalGuests / guestsPerTable);

    // Crear mesas con estructura completa
    const timestamp = Date.now();
    const generatedTables = [];
    for (let i = 0; i < numTables; i++) {
      const tableNumber = i + 1;
      generatedTables.push({
        id: `table-${timestamp}-${i}`,
        name: `Mesa ${tableNumber}`,
        guests: [],
        totalSeats: guestsPerTable,
        // Campos adicionales necesarios para el renderizado
        seats: guestsPerTable,
        shape: 'circle',
        tableType: 'round',
        enabled: true,
        autoCapacity: false,
      });
    }

    // Usar las mesas generadas
    analysis.tables = generatedTables;
    analysis.totalTables = numTables;
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
