/**
 * SeatingLayoutGenerator
 * Generación automática de distribuciones de mesas para banquetes
 *
 * Tipos de distribución:
 * 1. Grid (columnas) - Distribución rectangular uniforme
 * 2. Circular - Mesas en círculo alrededor del centro
 * 3. Con Pasillos - Grid con pasillo central
 * 4. En U (herradura) - Forma de U para eventos
 * 5. Espiga (chevron/herringbone) - Patrón diagonal
 * 6. Aleatorio - Distribución aleatoria con validación
 */

/**
 * Genera un ID único para mesa
 */
const generateTableId = () => `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Configuración por defecto
 */
const DEFAULT_CONFIG = {
  tableCount: 12,
  tableShape: 'circle',
  tableCapacity: 8,
  tableSize: 100, // px - tamaño de mesa (diameter para círculos)
  spacing: 250, // px entre mesas - MUY aumentado para evitar conflictos
  margin: 200, // px desde bordes - aumentado
  hallWidth: 1800,
  hallHeight: 1200,
};

/**
 * Helper para crear objeto de mesa con todas las propiedades
 */
const createTable = (config) => {
  const { id, name, number, shape, x, y, width, height, capacity, angle = 0 } = config;

  // Para mesas circulares, usar diameter en lugar de width/height
  const tableProps =
    shape === 'circle'
      ? {
          diameter: width, // TableItem espera diameter para círculos
          radius: width / 2,
        }
      : {
          width,
          height: height || width,
        };

  const table = {
    id: id || generateTableId(),
    name: name || `Mesa ${number}`,
    number,
    shape,
    x,
    y,
    ...tableProps,
    capacity,
    seats: capacity,
    angle,
    guests: [],
    locked: false,
  };

  // Debug: Log primera mesa para verificar propiedades
  if (number === 1) {
    // console.log('[createTable] Mesa 1 creada:', table);
    // console.log('[createTable] Shape y diameter:', { shape: table.shape, diameter: table.diameter, radius: table.radius, width: table.width });
  }

  return table;
};

/**
 * 1. GRID RECTANGULAR (Columnas)
 * Distribuye mesas en un grid uniforme
 */
export function generateGridLayout(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const tables = [];

  // Calcular número de columnas y filas
  const cols = Math.ceil(Math.sqrt(cfg.tableCount));
  const rows = Math.ceil(cfg.tableCount / cols);

  // Calcular espacio disponible
  const availableWidth = cfg.hallWidth - 2 * cfg.margin;
  const availableHeight = cfg.hallHeight - 2 * cfg.margin;

  // Calcular espaciado entre mesas
  const spacingX = availableWidth / cols;
  const spacingY = availableHeight / rows;

  let tableNumber = 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (tables.length >= cfg.tableCount) break;

      const x = cfg.margin + col * spacingX + spacingX / 2;
      const y = cfg.margin + row * spacingY + spacingY / 2;

      tables.push(
        createTable({
          number: tableNumber,
          shape: cfg.tableShape,
          x,
          y,
          width: cfg.tableSize,
          height: cfg.tableSize,
          capacity: cfg.tableCapacity,
          angle: 0,
        })
      );

      tableNumber++;
    }
  }

  return tables;
}

/**
 * 2. DISTRIBUCIÓN CIRCULAR
 * Mesas en círculo alrededor del centro
 */
export function generateCircularLayout(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const tables = [];

  // Centro del salón
  const centerX = cfg.hallWidth / 2;
  const centerY = cfg.hallHeight / 2;

  // Radio del círculo (ajustado al espacio disponible)
  const maxRadius = Math.min(
    (cfg.hallWidth - 2 * cfg.margin - cfg.tableSize) / 2,
    (cfg.hallHeight - 2 * cfg.margin - cfg.tableSize) / 2
  );

  const radius = maxRadius * 0.8; // Usar 80% del radio máximo

  // Ángulo entre mesas
  const angleStep = (2 * Math.PI) / cfg.tableCount;

  for (let i = 0; i < cfg.tableCount; i++) {
    const angle = i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    // Rotar la mesa para que mire hacia el centro
    const tableangl = (angle * 180) / Math.PI + 90;

    tables.push(
      createTable({
        number: i + 1,
        shape: cfg.tableShape,
        x,
        y,
        width: cfg.tableSize,
        height: cfg.tableSize,
        capacity: cfg.tableCapacity,
        angle: tableangl,
      })
    );
  }

  return tables;
}

/**
 * 3. CON PASILLOS
 * Grid con pasillo central para circulación
 */
export function generateAislesLayout(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const tables = [];

  const aisleWidth = cfg.spacing * 2; // Pasillo de doble ancho
  const halfTables = Math.ceil(cfg.tableCount / 2);

  // Calcular columnas por lado
  const colsPerSide = Math.ceil(Math.sqrt(halfTables));
  const rows = Math.ceil(halfTables / colsPerSide);

  // Espacio disponible por lado
  const sideWidth = (cfg.hallWidth - aisleWidth - 2 * cfg.margin) / 2;
  const availableHeight = cfg.hallHeight - 2 * cfg.margin;

  const spacingX = sideWidth / colsPerSide;
  const spacingY = availableHeight / rows;

  let tableNumber = 1;

  // Lado izquierdo
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < colsPerSide; col++) {
      if (tableNumber > cfg.tableCount) break;

      const x = cfg.margin + col * spacingX + spacingX / 2;
      const y = cfg.margin + row * spacingY + spacingY / 2;

      tables.push({
        id: generateTableId(),
        name: `Mesa ${tableNumber}`,
        number: tableNumber,
        shape: cfg.tableShape,
        x,
        y,
        width: cfg.tableSize,
        height: cfg.tableSize,
        capacity: cfg.tableCapacity,
        seats: cfg.tableCapacity,
        angle: 0,
        guests: [],
      });

      tableNumber++;
    }
  }

  // Lado derecho
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < colsPerSide; col++) {
      if (tableNumber > cfg.tableCount) break;

      const x = cfg.hallWidth - cfg.margin - sideWidth + col * spacingX + spacingX / 2;
      const y = cfg.margin + row * spacingY + spacingY / 2;

      tables.push({
        id: generateTableId(),
        name: `Mesa ${tableNumber}`,
        number: tableNumber,
        shape: cfg.tableShape,
        x,
        y,
        width: cfg.tableSize,
        height: cfg.tableSize,
        capacity: cfg.tableCapacity,
        seats: cfg.tableCapacity,
        angle: 0,
        guests: [],
      });

      tableNumber++;
    }
  }

  return tables;
}

/**
 * 4. EN U (HERRADURA)
 * Distribución en forma de U
 */
export function generateUShapeLayout(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const tables = [];

  // Dividir mesas en 3 lados: izquierdo, derecho, fondo
  const tablesPerSide = Math.ceil(cfg.tableCount / 3);

  const availableWidth = cfg.hallWidth - 2 * cfg.margin;
  const availableHeight = cfg.hallHeight - 2 * cfg.margin;

  let tableNumber = 1;

  // Lado izquierdo (vertical)
  for (let i = 0; i < tablesPerSide && tableNumber <= cfg.tableCount; i++) {
    const x = cfg.margin + cfg.tableSize / 2;
    const y =
      cfg.margin + i * (availableHeight / tablesPerSide) + availableHeight / tablesPerSide / 2;

    tables.push({
      id: generateTableId(),
      name: `Mesa ${tableNumber}`,
      number: tableNumber,
      shape: cfg.tableShape,
      x,
      y,
      width: cfg.tableSize,
      height: cfg.tableSize,
      capacity: cfg.tableCapacity,
      seats: cfg.tableCapacity,
      angle: 0,
      guests: [],
    });

    tableNumber++;
  }

  // Fondo (horizontal)
  for (let i = 0; i < tablesPerSide && tableNumber <= cfg.tableCount; i++) {
    const x =
      cfg.margin + i * (availableWidth / tablesPerSide) + availableWidth / tablesPerSide / 2;
    const y = cfg.margin + cfg.tableSize / 2;

    tables.push({
      id: generateTableId(),
      name: `Mesa ${tableNumber}`,
      number: tableNumber,
      shape: cfg.tableShape,
      x,
      y,
      width: cfg.tableSize,
      height: cfg.tableSize,
      capacity: cfg.tableCapacity,
      seats: cfg.tableCapacity,
      angle: 0,
      guests: [],
    });

    tableNumber++;
  }

  // Lado derecho (vertical)
  for (let i = 0; i < tablesPerSide && tableNumber <= cfg.tableCount; i++) {
    const x = cfg.hallWidth - cfg.margin - cfg.tableSize / 2;
    const y =
      cfg.margin + i * (availableHeight / tablesPerSide) + availableHeight / tablesPerSide / 2;

    tables.push({
      id: generateTableId(),
      name: `Mesa ${tableNumber}`,
      number: tableNumber,
      shape: cfg.tableShape,
      x,
      y,
      width: cfg.tableSize,
      height: cfg.tableSize,
      capacity: cfg.tableCapacity,
      seats: cfg.tableCapacity,
      angle: 0,
      guests: [],
    });

    tableNumber++;
  }

  return tables;
}

/**
 * 5. ESPIGA (CHEVRON/HERRINGBONE)
 * Patrón diagonal alternado
 */
export function generateHerringboneLayout(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const tables = [];

  const rows = Math.ceil(Math.sqrt(cfg.tableCount));
  const cols = Math.ceil(cfg.tableCount / rows);

  const availableWidth = cfg.hallWidth - 2 * cfg.margin;
  const availableHeight = cfg.hallHeight - 2 * cfg.margin;

  const spacingX = availableWidth / cols;
  const spacingY = availableHeight / rows;

  let tableNumber = 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (tableNumber > cfg.tableCount) break;

      // Alternar ángulo según fila
      const angle = row % 2 === 0 ? 45 : -45;

      // Offset horizontal alternado
      const offsetX = row % 2 === 0 ? spacingX * 0.25 : -spacingX * 0.25;

      const x = cfg.margin + col * spacingX + spacingX / 2 + offsetX;
      const y = cfg.margin + row * spacingY + spacingY / 2;

      tables.push({
        id: generateTableId(),
        name: `Mesa ${tableNumber}`,
        number: tableNumber,
        shape: cfg.tableShape === 'circle' ? 'square' : cfg.tableShape, // Funciona mejor con rectangulares
        x,
        y,
        width: cfg.tableSize,
        height: cfg.tableSize * 1.5, // Rectangulares más largas
        capacity: cfg.tableCapacity,
        seats: cfg.tableCapacity,
        angle,
        guests: [],
      });

      tableNumber++;
    }
  }

  return tables;
}

/**
 * 6. ALEATORIO
 * Distribución aleatoria con validación de espaciado
 */
export function generateRandomLayout(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const tables = [];

  const minDistance = cfg.tableSize + cfg.spacing;
  const maxAttempts = 100;

  /**
   * Verifica si una posición es válida (sin colisiones)
   */
  const isValidPosition = (x, y) => {
    // Verificar límites del salón
    if (
      x < cfg.margin + cfg.tableSize / 2 ||
      x > cfg.hallWidth - cfg.margin - cfg.tableSize / 2 ||
      y < cfg.margin + cfg.tableSize / 2 ||
      y > cfg.hallHeight - cfg.margin - cfg.tableSize / 2
    ) {
      return false;
    }

    // Verificar distancia con otras mesas
    for (const table of tables) {
      const dx = x - table.x;
      const dy = y - table.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        return false;
      }
    }

    return true;
  };

  for (let i = 0; i < cfg.tableCount; i++) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < maxAttempts) {
      const x = cfg.margin + Math.random() * (cfg.hallWidth - 2 * cfg.margin);
      const y = cfg.margin + Math.random() * (cfg.hallHeight - 2 * cfg.margin);

      if (isValidPosition(x, y)) {
        tables.push({
          id: generateTableId(),
          name: `Mesa ${i + 1}`,
          number: i + 1,
          shape: cfg.tableShape,
          x,
          y,
          width: cfg.tableSize,
          height: cfg.tableSize,
          capacity: cfg.tableCapacity,
          seats: cfg.tableCapacity,
          angle: Math.random() * 360, // Ángulo aleatorio
          guests: [],
        });
        placed = true;
      }

      attempts++;
    }

    // Si no se pudo colocar después de max intentos, usar grid fallback
    if (!placed) {
      // console.warn(`No se pudo colocar mesa ${i + 1} aleatoriamente, usando grid`);
      const gridTables = generateGridLayout({ ...cfg, tableCount: cfg.tableCount - tables.length });
      tables.push(...gridTables.slice(0, cfg.tableCount - tables.length));
      break;
    }
  }

  return tables;
}

/**
 * Función principal de generación
 * @param {string} type - Tipo de distribución
 * @param {object} config - Configuración
 * @returns {array} Array de mesas generadas
 */
export function generateLayout(type, config = {}) {
  // console.log('[LayoutGenerator] Generando layout:', type, config);

  switch (type) {
    case 'grid':
      return generateGridLayout(config);
    case 'circular':
      return generateCircularLayout(config);
    case 'aisles':
      return generateAislesLayout(config);
    case 'uShape':
      return generateUShapeLayout(config);
    case 'herringbone':
      return generateHerringboneLayout(config);
    case 'random':
      return generateRandomLayout(config);
    default:
      // console.warn('[LayoutGenerator] Tipo desconocido, usando grid');
      return generateGridLayout(config);
  }
}

/**
 * Metadata de los tipos de layout
 */
export const LAYOUT_TYPES = {
  grid: {
    id: 'grid',
    name: 'Grid (Columnas)',
    description: 'Distribución rectangular uniforme',
    icon: '⊞',
    recommended: 'Ideal para salones rectangulares',
  },
  circular: {
    id: 'circular',
    name: 'Circular',
    description: 'Mesas en círculo alrededor del centro',
    icon: '○',
    recommended: 'Ideal para salones amplios con pista central',
  },
  aisles: {
    id: 'aisles',
    name: 'Con Pasillos',
    description: 'Grid con pasillo central de circulación',
    icon: '⊟',
    recommended: 'Facilita el movimiento de invitados y camareros',
  },
  uShape: {
    id: 'uShape',
    name: 'En U (Herradura)',
    description: 'Distribución en forma de U',
    icon: '⊔',
    recommended: 'Perfecto para eventos con escenario o mesa presidencial',
  },
  herringbone: {
    id: 'herringbone',
    name: 'Espiga (Chevron)',
    description: 'Patrón diagonal alternado',
    icon: '≋',
    recommended: 'Estilo moderno y dinámico',
  },
  random: {
    id: 'random',
    name: 'Aleatorio',
    description: 'Distribución aleatoria con validación',
    icon: '✨',
    recommended: 'Para eventos informales y creativos',
  },
};

export default generateLayout;
