/**
 * layoutTemplates - Generadores de layouts predefinidos
 * FASE 3.1: Templates Visuales
 */

/**
 * Genera mesas en cuadrícula
 */
export function generateGridLayout(config = {}) {
  const {
    tableCount = 12,
    spacing = 200,
    startX = 200,
    startY = 200,
    cols = 4,
    shape = 'circle',
    diameter = 120,
  } = config;

  const tables = [];
  const rows = Math.ceil(tableCount / cols);

  for (let i = 0; i < tableCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    tables.push({
      id: `table-${Date.now()}-${i}`,
      x: startX + col * spacing,
      y: startY + row * spacing,
      shape,
      diameter,
      seats: 8,
      name: `Mesa ${i + 1}`,
      number: i + 1,
    });
  }

  return tables;
}

/**
 * Genera mesas en diagonal
 */
export function generateDiagonalLayout(config = {}) {
  const {
    tableCount = 10,
    spacing = 220,
    startX = 300,
    startY = 200,
    shape = 'circle',
    diameter = 120,
  } = config;

  const tables = [];
  const cols = Math.ceil(Math.sqrt(tableCount));

  for (let i = 0; i < tableCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    // Offset diagonal
    const offsetX = row % 2 === 0 ? 0 : spacing / 2;

    tables.push({
      id: `table-${Date.now()}-${i}`,
      x: startX + col * spacing + offsetX,
      y: startY + row * (spacing * 0.866), // 0.866 = sqrt(3)/2 para hexágonos
      shape,
      diameter,
      seats: 8,
      name: `Mesa ${i + 1}`,
      number: i + 1,
    });
  }

  return tables;
}

/**
 * Genera mesas en herradura (U)
 */
export function generateHorseshoeLayout(config = {}) {
  const {
    tableCount = 15,
    spacing = 180,
    centerX = 900,
    centerY = 600,
    radiusX = 600,
    radiusY = 400,
    shape = 'circle',
    diameter = 120,
  } = config;

  const tables = [];
  
  // Herradura = 3/4 de círculo (270 grados)
  const startAngle = -135 * (Math.PI / 180); // -135 grados
  const endAngle = 135 * (Math.PI / 180);    // 135 grados
  const angleStep = (endAngle - startAngle) / (tableCount - 1);

  for (let i = 0; i < tableCount; i++) {
    const angle = startAngle + i * angleStep;
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);

    tables.push({
      id: `table-${Date.now()}-${i}`,
      x,
      y,
      shape,
      diameter,
      seats: i === 0 ? 12 : 8, // Mesa presidencial más grande
      name: i === 0 ? 'Mesa Presidencial' : `Mesa ${i}`,
      number: i + 1,
      vip: i === 0,
    });
  }

  return tables;
}

/**
 * Genera mesas en clusters (grupos)
 */
export function generateClustersLayout(config = {}) {
  const {
    clusterCount = 3,
    tablesPerCluster = 4,
    clusterSpacing = 400,
    tableSpacing = 150,
    startX = 300,
    startY = 300,
    shape = 'circle',
    diameter = 100,
  } = config;

  const tables = [];
  let tableNumber = 1;

  for (let c = 0; c < clusterCount; c++) {
    const clusterX = startX + (c % 2) * clusterSpacing;
    const clusterY = startY + Math.floor(c / 2) * clusterSpacing;

    // Mesas en el cluster formando un pequeño círculo
    for (let t = 0; t < tablesPerCluster; t++) {
      const angle = (t / tablesPerCluster) * 2 * Math.PI;
      const x = clusterX + tableSpacing * Math.cos(angle);
      const y = clusterY + tableSpacing * Math.sin(angle);

      tables.push({
        id: `table-${Date.now()}-${c}-${t}`,
        x,
        y,
        shape,
        diameter,
        seats: 6,
        name: `Mesa ${tableNumber}`,
        number: tableNumber,
        cluster: c + 1,
      });
      tableNumber++;
    }
  }

  return tables;
}

/**
 * Genera mesas dispersas (scattered)
 */
export function generateScatteredLayout(config = {}) {
  const {
    tableCount = 6,
    minSpacing = 250,
    hallWidth = 1800,
    hallHeight = 1200,
    margin = 200,
    shape = 'circle',
    diameter = 140,
  } = config;

  const tables = [];
  const maxAttempts = 100;

  for (let i = 0; i < tableCount; i++) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < maxAttempts) {
      const x = margin + Math.random() * (hallWidth - 2 * margin);
      const y = margin + Math.random() * (hallHeight - 2 * margin);

      // Verificar que no esté muy cerca de otras mesas
      const tooClose = tables.some(t => {
        const dx = t.x - x;
        const dy = t.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < minSpacing;
      });

      if (!tooClose) {
        tables.push({
          id: `table-${Date.now()}-${i}`,
          x,
          y,
          shape,
          diameter,
          seats: 10,
          name: `Mesa ${i + 1}`,
          number: i + 1,
        });
        placed = true;
      }

      attempts++;
    }
  }

  return tables;
}

/**
 * Genera mesas rectangulares en filas
 */
export function generateRowsLayout(config = {}) {
  const {
    rowCount = 5,
    tablesPerRow = 5,
    spacingX = 200,
    spacingY = 150,
    startX = 200,
    startY = 200,
    shape = 'rectangle',
    width = 180,
    height = 80,
  } = config;

  const tables = [];
  let tableNumber = 1;

  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < tablesPerRow; col++) {
      tables.push({
        id: `table-${Date.now()}-${tableNumber}`,
        x: startX + col * spacingX,
        y: startY + row * spacingY,
        shape,
        width,
        height,
        seats: 8,
        name: `Mesa ${tableNumber}`,
        number: tableNumber,
      });
      tableNumber++;
    }
  }

  return tables;
}

/**
 * Aplica template basado en ID
 */
export function applyTemplate(templateId, hallSize = {}, guestCount = 0) {
  const width = hallSize.width || 1800;
  const height = hallSize.height || 1200;
  
  // Calcular cantidad de mesas necesarias (estimación)
  const estimatedTables = Math.ceil(guestCount / 8) || 12;

  switch (templateId) {
    case 'classic-grid':
      return generateGridLayout({
        tableCount: estimatedTables,
        spacing: 200,
        startX: 200,
        startY: 200,
        cols: Math.ceil(Math.sqrt(estimatedTables)),
      });

    case 'elegant-diagonal':
      return generateDiagonalLayout({
        tableCount: estimatedTables,
        spacing: 220,
        startX: 300,
        startY: 200,
      });

    case 'imperial-horseshoe':
      return generateHorseshoeLayout({
        tableCount: estimatedTables,
        centerX: width / 2,
        centerY: height / 2,
        radiusX: Math.min(width, height) * 0.35,
        radiusY: Math.min(width, height) * 0.25,
      });

    case 'modern-clusters':
      return generateClustersLayout({
        clusterCount: Math.ceil(estimatedTables / 4),
        tablesPerCluster: 4,
        clusterSpacing: 400,
        startX: width * 0.2,
        startY: height * 0.2,
      });

    case 'intimate-small':
      return generateScatteredLayout({
        tableCount: Math.min(estimatedTables, 8),
        minSpacing: 250,
        hallWidth: width,
        hallHeight: height,
        diameter: 140,
      });

    case 'banquet-rows':
      const tablesPerRow = Math.ceil(Math.sqrt(estimatedTables));
      const rows = Math.ceil(estimatedTables / tablesPerRow);
      return generateRowsLayout({
        rowCount: rows,
        tablesPerRow,
        spacingX: 200,
        spacingY: 150,
        startX: 200,
        startY: 200,
      });

    default:
      return generateGridLayout({ tableCount: estimatedTables });
  }
}
