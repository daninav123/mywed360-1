import i18n from '../i18n';

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
    shape = 'circlei18n.t('common.diameter_120_config_const_tables_const')circlei18n.t('common.diameter_120_config_const_tables_herradura')Mesa Presidencial' : `Mesa ${i}`,
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
    shape = 'circlei18n.t('common.diameter_100_config_const_tables_let')circlei18n.t('common.diameter_140_config_const_tables_const')rectanglei18n.t('common.width_180_height_config_const_tables')classic-grid':
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
