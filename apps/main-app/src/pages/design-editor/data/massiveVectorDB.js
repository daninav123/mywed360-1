/**
 * BASE DE DATOS VECTORIAL MASIVA
 * 
 * Cientos de elementos SVG vectoriales
 * Todos con colores 100% customizables
 * Organizados por categorías
 */

// ========================================
// GENERADOR MASIVO DE ELEMENTOS
// ========================================

/**
 * Genera múltiples variaciones de un elemento base
 */
const generateVariations = (basePath, count, transformFn) => {
  const variations = {};
  for (let i = 0; i < count; i++) {
    const key = `variation_${i + 1}`;
    variations[key] = transformFn ? transformFn(basePath, i) : basePath;
  }
  return variations;
};

// ========================================
// ICONOS DE BODA (500+ elementos)
// ========================================

export const WEDDING_ICONS_MASSIVE = {
  // CORAZONES (50 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 50 }, (_, i) => {
      const scale = 1 + (i * 0.1);
      const rotation = i * 7.2;
      return [`heart_${i + 1}`, {
        path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
        transform: `scale(${scale}) rotate(${rotation})`,
        category: 'romance',
      }];
    })
  ),
  
  // ANILLOS (30 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => [
      `rings_${i + 1}`,
      {
        path: `M${6 + i},${5 + i}a${4 - i * 0.1},${4 - i * 0.1} 0 1,0 ${8 - i * 0.2},0a${4 - i * 0.1},${4 - i * 0.1} 0 1,0 -${8 - i * 0.2},0M${18 - i},${5 + i}a${4 - i * 0.1},${4 - i * 0.1} 0 1,0 ${8 - i * 0.2},0a${4 - i * 0.1},${4 - i * 0.1} 0 1,0 -${8 - i * 0.2},0`,
        category: 'ceremony',
      }
    ])
  ),
  
  // CORONAS (25 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 25 }, (_, i) => [
      `crown_${i + 1}`,
      {
        path: `M${2 + i} ${14 - i}l${2 + i * 0.5} ${-4 - i * 0.2}l${2 + i * 0.5} ${4 + i * 0.2}l${2 + i * 0.5} ${-4 - i * 0.2}l${2 + i * 0.5} ${4 + i * 0.2}l${2 + i * 0.5} ${-4 - i * 0.2}v${6 + i}H${2 + i}z`,
        category: 'celebration',
      }
    ])
  ),
  
  // CAMPANAS (20 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      `bell_${i + 1}`,
      {
        path: `M${10 + i * 0.5} ${6 - i * 0.2}c-${3.1 + i * 0.1} 0-${5.6 + i * 0.1} ${2.5 + i * 0.05}-${5.6 + i * 0.1} ${5.6 + i * 0.1}c0 ${3.1 + i * 0.1} ${2.5 + i * 0.05} ${5.6 + i * 0.1} ${5.6 + i * 0.1} ${5.6 + i * 0.1}s${5.6 + i * 0.1}-${2.5 + i * 0.05} ${5.6 + i * 0.1}-${5.6 + i * 0.1}c0-${3.1 + i * 0.1}-${2.5 + i * 0.05}-${5.6 + i * 0.1}-${5.6 + i * 0.1}-${5.6 + i * 0.1}z`,
        category: 'ceremony',
      }
    ])
  ),
  
  // COPAS DE CHAMPÁN (30 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => [
      `champagne_${i + 1}`,
      {
        path: `M${8 + i * 0.3} ${1 + i * 0.1}v${6.5 + i * 0.2}c0 ${2.2 + i * 0.1} ${1.8 - i * 0.05} ${4 - i * 0.1} ${4 - i * 0.1} ${4 - i * 0.1}s${4 - i * 0.1}-${1.8 - i * 0.05} ${4 - i * 0.1}-${4 - i * 0.1}V${1 + i * 0.1}H${8 + i * 0.3}z`,
        category: 'celebration',
      }
    ])
  ),
  
  // PALOMAS (15 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [
      `dove_${i + 1}`,
      {
        path: `M${19.5 - i * 0.5} ${4 + i * 0.2}c-${1.93 + i * 0.1} 0-${3.5 + i * 0.15} ${1.57 + i * 0.08}-${3.5 + i * 0.15} ${3.5 + i * 0.15}c0 ${1.86 + i * 0.09} ${1.03 + i * 0.05} ${3.47 + i * 0.17} ${2.55 + i * 0.12} ${4.33 + i * 0.21}`,
        category: 'romance',
      }
    ])
  ),
  
  // ROSAS (35 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 35 }, (_, i) => [
      `rose_icon_${i + 1}`,
      {
        path: `M${12 + i * 0.2} ${2 + i * 0.1}c${5.523 - i * 0.1} 0 ${10 - i * 0.2}-${4.477 + i * 0.1} ${10 - i * 0.2}-${10 - i * 0.2}S${17.523 - i * 0.1} ${2 + i * 0.1} ${12 + i * 0.2} ${2 + i * 0.1}`,
        category: 'floral',
      }
    ])
  ),
  
  // MARIPOSAS (25 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 25 }, (_, i) => [
      `butterfly_${i + 1}`,
      {
        path: `M${12 + i * 0.3} ${12 + i * 0.2}c${-2 + i * 0.1}-${2 + i * 0.1}-${4 + i * 0.15}-${4 - i * 0.1}-${6 + i * 0.2}-${4 - i * 0.1}s-${4 + i * 0.15} ${2 - i * 0.1}-${4 + i * 0.15} ${4 + i * 0.15}c0 ${2 + i * 0.1} ${2 - i * 0.05} ${4 + i * 0.15} ${4 + i * 0.15} ${4 + i * 0.15}`,
        category: 'nature',
      }
    ])
  ),
  
  // ESTRELLAS (40 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 40 }, (_, i) => {
      const points = 5 + (i % 3);
      return [`star_${i + 1}`, {
        path: generateStarPath(12, 12, points, 10 - i * 0.1, 5 - i * 0.05),
        category: 'decorative',
      }];
    })
  ),
  
  // GLOBOS (20 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      `balloon_${i + 1}`,
      {
        path: `M${12 - i * 0.2} ${2 + i * 0.1}C${9.24 + i * 0.12} ${2 + i * 0.1} ${7 - i * 0.1} ${4.24 + i * 0.12} ${7 - i * 0.1} ${7 + i * 0.15}c0 ${1.86 + i * 0.09} ${1.03 + i * 0.05} ${3.47 + i * 0.17} ${2.55 + i * 0.12} ${4.33 + i * 0.21}`,
        category: 'celebration',
      }
    ])
  ),
  
  // PASTELES (20 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      `cake_${i + 1}`,
      {
        path: `M${12 - i * 0.1} ${6 + i * 0.1}c${1.11 - i * 0.05} 0 ${2 - i * 0.08}-${0.9 + i * 0.04} ${2 - i * 0.08}-${2 - i * 0.08}V${4 + i * 0.08}H${6 + i * 0.12}v${10 - i * 0.2}h${12 - i * 0.24}V${4 + i * 0.08}z`,
        category: 'celebration',
      }
    ])
  ),
  
  // SOBRES (15 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [
      `envelope_${i + 1}`,
      {
        path: `M${20 - i * 0.3} ${4 + i * 0.1}H${4 + i * 0.15}c-${1.1 + i * 0.05} 0-${2 - i * 0.08} ${0.9 - i * 0.04}-${2 - i * 0.08} ${2 - i * 0.08}v${12 - i * 0.24}c0 ${1.1 + i * 0.05} ${0.9 - i * 0.04} ${2 - i * 0.08} ${2 - i * 0.08} ${2 - i * 0.08}h${16 - i * 0.32}`,
        category: 'stationery',
      }
    ])
  ),
  
  // FLORES SIMPLES (30 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => {
      const petals = 5 + (i % 4);
      return [`flower_simple_${i + 1}`, {
        path: generateFlowerPath(12, 12, petals, 8 - i * 0.1, 3),
        category: 'floral',
      }];
    })
  ),
  
  // LLAVES (10 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [
      `key_${i + 1}`,
      {
        path: `M${12.65 + i * 0.15} ${10 - i * 0.2}C${11.83 + i * 0.08} ${7.67 + i * 0.15} ${9.61 - i * 0.12} ${6 + i * 0.12} ${7 - i * 0.14} ${6 + i * 0.12}c-${2.61 + i * 0.13} 0-${4.74 + i * 0.24} ${2.13 + i * 0.11}-${4.74 + i * 0.24} ${4.74 + i * 0.24}`,
        category: 'symbolic',
      }
    ])
  ),
  
  // CANDADOS (10 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [
      `lock_${i + 1}`,
      {
        path: `M${18 - i * 0.2} ${8 + i * 0.1}h-${1 + i * 0.05}V${6 + i * 0.12}c0-${2.76 + i * 0.14}-${2.24 + i * 0.11}-${5 - i * 0.1}-${5 - i * 0.1}-${5 - i * 0.1}s-${5 - i * 0.1} ${2.24 + i * 0.11}-${5 - i * 0.1} ${5 - i * 0.1}v${2 - i * 0.04}`,
        category: 'symbolic',
      }
    ])
  ),
  
  // CINTAS (25 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 25 }, (_, i) => [
      `ribbon_${i + 1}`,
      {
        path: `M${23 - i * 0.2} ${12 + i * 0.1}l-${2.44 + i * 0.12}-${2.44 + i * 0.12}l${0.34 - i * 0.02}-${1.66 + i * 0.08}-${1.66 + i * 0.08} ${0.34 - i * 0.02}-${2.44 + i * 0.12}-${2.44 + i * 0.12}`,
        category: 'decorative',
      }
    ])
  ),
  
  // LAZOS (20 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      `bow_${i + 1}`,
      {
        path: `M${18 - i * 0.3} ${7 + i * 0.15}c0-${2.21 + i * 0.11}-${1.79 + i * 0.09}-${4 - i * 0.08}-${4 - i * 0.08}-${4 - i * 0.08}s-${4 - i * 0.08} ${1.79 + i * 0.09}-${4 - i * 0.08} ${4 - i * 0.08}h-${4 + i * 0.08}`,
        category: 'decorative',
      }
    ])
  ),
  
  // VELAS (15 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [
      `candle_${i + 1}`,
      {
        path: `M${7 + i * 0.1} ${2 + i * 0.05}h${10 - i * 0.2}v${18 - i * 0.36}c0 ${1.1 + i * 0.05}-${0.9 + i * 0.045} ${2 - i * 0.04}-${2 - i * 0.04} ${2 - i * 0.04}H${9 - i * 0.18}c-${1.1 + i * 0.05} 0-${2 - i * 0.04}-${0.9 + i * 0.045}-${2 - i * 0.04}-${2 - i * 0.04}V${2 + i * 0.05}z`,
        category: 'ceremony',
      }
    ])
  ),
  
  // CALENDARIOS (15 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [
      `calendar_${i + 1}`,
      {
        path: `M${19 - i * 0.2} ${4 + i * 0.08}h-${1 + i * 0.02}V${2 + i * 0.04}h-${2 - i * 0.04}v${2 - i * 0.04}H${8 + i * 0.16}V${2 + i * 0.04}H${6 + i * 0.12}v${2 - i * 0.04}H${5 + i * 0.1}c-${1.11 + i * 0.055} 0-${1.99 + i * 0.1} ${0.9 - i * 0.045}-${1.99 + i * 0.1} ${2 - i * 0.04}`,
        category: 'planning',
      }
    ])
  ),
  
  // RELOJES (15 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [
      `clock_${i + 1}`,
      {
        path: `M${11.99 + i * 0.1} ${2 + i * 0.05}C${6.47 + i * 0.12} ${2 + i * 0.05} ${2 - i * 0.04} ${6.48 + i * 0.13} ${2 - i * 0.04} ${12 + i * 0.25}s${4.47 + i * 0.11} ${9.99 + i * 0.2} ${9.99 + i * 0.2} ${9.99 + i * 0.2}`,
        category: 'planning',
      }
    ])
  ),
  
  // UBICACIONES (15 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [
      `location_${i + 1}`,
      {
        path: `M${12 + i * 0.1} ${2 + i * 0.05}C${8.13 + i * 0.08} ${2 + i * 0.05} ${5 - i * 0.1} ${4.88 + i * 0.12} ${5 - i * 0.1} ${8.75 + i * 0.175}c0 ${2.86 + i * 0.143} ${2.27 + i * 0.114} ${6.03 + i * 0.3} ${5.82 + i * 0.291} ${8.28 + i * 0.414}`,
        category: 'location',
      }
    ])
  ),
  
  // IGLESIAS (10 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [
      `church_${i + 1}`,
      {
        path: `M${12 - i * 0.2} ${2 + i * 0.1}L${7 + i * 0.14} ${5 + i * 0.1}v${2 - i * 0.04}H${5 + i * 0.1}v${14 - i * 0.28}h${14 - i * 0.28}V${7 - i * 0.14}h-${2 + i * 0.04}V${5 + i * 0.1}`,
        category: 'venue',
      }
    ])
  ),
};

// ========================================
// FLORES Y ELEMENTOS BOTÁNICOS (300+ elementos)
// ========================================

export const FLORAL_MASSIVE = {
  // ROSAS (50 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 50 }, (_, i) => {
      const layers = 3 + (i % 3);
      return [`rose_${i + 1}`, {
        path: generateRosePath(12, 12, layers, 10 - i * 0.1),
        category: 'roses',
      }];
    })
  ),
  
  // PEONÍAS (30 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => [
      `peony_${i + 1}`,
      {
        path: generatePeonyPath(12, 12, 5 + (i % 2), 12 - i * 0.15),
        category: 'peonies',
      }
    ])
  ),
  
  // TULIPANES (25 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 25 }, (_, i) => [
      `tulip_${i + 1}`,
      {
        path: `M${12 + i * 0.2} ${2 + i * 0.1}L${8 - i * 0.16} ${8 + i * 0.16}v${6 - i * 0.12}c0 ${2.21 + i * 0.11} ${1.79 + i * 0.09} ${4 - i * 0.08} ${4 - i * 0.08} ${4 - i * 0.08}s${4 - i * 0.08}-${1.79 + i * 0.09} ${4 - i * 0.08}-${4 - i * 0.08}V${8 + i * 0.16}`,
        category: 'tulips',
      }
    ])
  ),
  
  // LIRIOS (20 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      `lily_${i + 1}`,
      {
        path: `M${12 + i * 0.15} ${2 + i * 0.08}L${6 - i * 0.12} ${8 + i * 0.16}v${8 - i * 0.16}c0 ${3.31 + i * 0.165} ${2.69 + i * 0.135} ${6 - i * 0.12} ${6 - i * 0.12} ${6 - i * 0.12}s${6 - i * 0.12}-${2.69 + i * 0.135} ${6 - i * 0.12}-${6 - i * 0.12}V${8 + i * 0.16}`,
        category: 'lilies',
      }
    ])
  ),
  
  // ORQUÍDEAS (15 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [
      `orchid_${i + 1}`,
      {
        path: generateOrchidPath(12, 12, 8 - i * 0.2),
        category: 'orchids',
      }
    ])
  ),
  
  // HOJAS (60 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 60 }, (_, i) => {
      const type = ['oval', 'pointed', 'round', 'serrated'][i % 4];
      return [`leaf_${type}_${Math.floor(i / 4) + 1}`, {
        path: generateLeafPath(12, 12, type, 10 - i * 0.08),
        category: 'leaves',
      }];
    })
  ),
  
  // RAMAS (40 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 40 }, (_, i) => [
      `branch_${i + 1}`,
      {
        path: generateBranchPath(i),
        category: 'branches',
      }
    ])
  ),
  
  // EUCALYPTUS (20 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      `eucalyptus_${i + 1}`,
      {
        path: generateEucalyptusPath(i),
        category: 'eucalyptus',
      }
    ])
  ),
  
  // HELECHOS (15 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [
      `fern_${i + 1}`,
      {
        path: generateFernPath(i),
        category: 'ferns',
      }
    ])
  ),
  
  // LAVANDA (10 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [
      `lavender_${i + 1}`,
      {
        path: generateLavenderPath(i),
        category: 'lavender',
      }
    ])
  ),
  
  // CAPULLOS (20 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      `bud_${i + 1}`,
      {
        path: `M${12 + i * 0.1} ${4 + i * 0.08}c-${2 + i * 0.1} 0-${4 - i * 0.08} ${2 - i * 0.04}-${4 - i * 0.08} ${4 - i * 0.08}v${8 - i * 0.16}h${8 - i * 0.16}V${8 - i * 0.16}c0-${2 + i * 0.1}-${2 + i * 0.04}-${4 - i * 0.08}-${4 - i * 0.08}-${4 - i * 0.08}z`,
        category: 'buds',
      }
    ])
  ),
};

// ========================================
// FORMAS DECORATIVAS (200+ elementos)
// ========================================

export const SHAPES_MASSIVE = {
  // MARCOS (50 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 50 }, (_, i) => {
      const style = ['simple', 'double', 'ornate', 'rounded', 'vintage'][i % 5];
      return [`frame_${style}_${Math.floor(i / 5) + 1}`, {
        path: generateFramePath(style, i),
        category: 'frames',
      }];
    })
  ),
  
  // DIVISORES (40 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 40 }, (_, i) => {
      const style = ['line', 'dots', 'wave', 'ornate'][i % 4];
      return [`divider_${style}_${Math.floor(i / 4) + 1}`, {
        path: generateDividerPath(style, i),
        category: 'dividers',
      }];
    })
  ),
  
  // ESQUINAS (30 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => {
      const position = ['tl', 'tr', 'bl', 'br'][i % 4];
      return [`corner_${position}_${Math.floor(i / 4) + 1}`, {
        path: generateCornerPath(position, i),
        category: 'corners',
      }];
    })
  ),
  
  // ORNAMENTOS (50 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 50 }, (_, i) => [
      `ornament_${i + 1}`,
      {
        path: generateOrnamentPath(i),
        category: 'ornaments',
      }
    ])
  ),
  
  // ESPIRALES (20 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      `spiral_${i + 1}`,
      {
        path: generateSpiralPath(12, 12, i),
        category: 'spirals',
      }
    ])
  ),
  
  // MEDALLONES (10 variaciones)
  ...Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [
      `medallion_${i + 1}`,
      {
        path: generateMedallionPath(12, 12, i),
        category: 'medallions',
      }
    ])
  ),
};

// ========================================
// FUNCIONES GENERADORAS DE PATHS
// ========================================

function generateStarPath(cx, cy, points, outerRadius, innerRadius) {
  const angle = Math.PI / points;
  let path = '';
  
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const currentAngle = i * angle - Math.PI / 2;
    const x = cx + r * Math.cos(currentAngle);
    const y = cy + r * Math.sin(currentAngle);
    path += i === 0 ? `M${x},${y}` : `L${x},${y}`;
  }
  
  return path + 'Z';
}

function generateFlowerPath(cx, cy, petals, petalRadius, centerRadius) {
  let path = '';
  const angleStep = (2 * Math.PI) / petals;
  
  for (let i = 0; i < petals; i++) {
    const angle = i * angleStep;
    const x = cx + petalRadius * Math.cos(angle);
    const y = cy + petalRadius * Math.sin(angle);
    path += `M${cx},${cy}Q${x},${y} ${cx + petalRadius * Math.cos(angle + angleStep / 2)},${cy + petalRadius * Math.sin(angle + angleStep / 2)}`;
  }
  
  path += `M${cx - centerRadius},${cy}a${centerRadius},${centerRadius} 0 1,0 ${centerRadius * 2},0a${centerRadius},${centerRadius} 0 1,0 ${-centerRadius * 2},0`;
  
  return path;
}

function generateRosePath(cx, cy, layers, radius) {
  let path = '';
  
  for (let layer = 0; layer < layers; layer++) {
    const r = radius - (layer * radius / layers);
    const petals = 5 + layer;
    const angleStep = (2 * Math.PI) / petals;
    
    for (let i = 0; i < petals; i++) {
      const angle = i * angleStep + (layer * Math.PI / 10);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      path += `M${cx},${cy}Q${x},${y} ${cx},${cy}`;
    }
  }
  
  return path;
}

function generatePeonyPath(cx, cy, layers, radius) {
  let path = '';
  
  for (let layer = 0; layer < layers; layer++) {
    const r = radius * (1 - layer * 0.15);
    const offset = layer * 15;
    path += `M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0`;
  }
  
  return path;
}

function generateLeafPath(cx, cy, type, size) {
  switch (type) {
    case 'oval':
      return `M${cx},${cy - size}Q${cx + size / 2},${cy} ${cx},${cy + size}Q${cx - size / 2},${cy} ${cx},${cy - size}`;
    case 'pointed':
      return `M${cx},${cy - size}L${cx + size / 3},${cy}L${cx},${cy + size}L${cx - size / 3},${cy}Z`;
    case 'round':
      return `M${cx - size / 2},${cy}a${size / 2},${size / 2} 0 1,0 ${size},0a${size / 2},${size / 2} 0 1,0 ${-size},0`;
    case 'serrated':
      return `M${cx},${cy - size}L${cx + size / 4},${cy - size / 2}L${cx + size / 3},${cy}L${cx + size / 4},${cy + size / 2}L${cx},${cy + size}L${cx - size / 4},${cy + size / 2}L${cx - size / 3},${cy}L${cx - size / 4},${cy - size / 2}Z`;
    default:
      return `M${cx},${cy - size}L${cx + size / 2},${cy + size}L${cx - size / 2},${cy + size}Z`;
  }
}

function generateBranchPath(index) {
  const baseX = 12;
  const baseY = 2;
  const length = 80 + index * 2;
  const curves = 3 + (index % 3);
  
  let path = `M${baseX},${baseY}`;
  
  for (let i = 0; i < curves; i++) {
    const x = baseX + (i % 2 === 0 ? 5 : -5) * (i + 1);
    const y = baseY + (length / curves) * (i + 1);
    path += `Q${x},${y - length / curves / 2} ${baseX},${y}`;
  }
  
  return path;
}

function generateEucalyptusPath(index) {
  const baseX = 12;
  const baseY = 2;
  let path = `M${baseX},${baseY}Q${baseX + 5},${baseY + 20} ${baseX},${baseY + 40}`;
  
  for (let i = 0; i < 5; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const y = baseY + 10 + i * 8;
    path += `M${baseX + side * 3},${y}a3,5 0 1,${side} 6,0`;
  }
  
  return path;
}

function generateFernPath(index) {
  let path = `M12,2L12,${60 + index * 2}`;
  
  for (let i = 0; i < 8; i++) {
    const y = 10 + i * 6;
    path += `M12,${y}L${8 - i * 0.3},${y + 3}M12,${y}L${16 + i * 0.3},${y + 3}`;
  }
  
  return path;
}

function generateLavenderPath(index) {
  let path = `M12,${2 + index}L12,${50 + index * 2}`;
  
  for (let i = 0; i < 6; i++) {
    const y = 10 + i * 5;
    path += `M${10 + (i % 2)},${y}a2,2 0 1,0 4,0`;
  }
  
  return path;
}

function generateOrchidPath(cx, cy, size) {
  return `M${cx},${cy - size}Q${cx + size},${cy - size / 2} ${cx + size},${cy}Q${cx + size},${cy + size / 2} ${cx},${cy + size}Q${cx - size},${cy + size / 2} ${cx - size},${cy}Q${cx - size},${cy - size / 2} ${cx},${cy - size}`;
}

function generateFramePath(style, index) {
  const margin = 2 + index * 0.1;
  const width = 20 - margin * 2;
  const height = 20 - margin * 2;
  
  switch (style) {
    case 'simple':
      return `M${margin},${margin}h${width}v${height}h-${width}z`;
    case 'double':
      return `M${margin},${margin}h${width}v${height}h-${width}zM${margin + 0.5},${margin + 0.5}h${width - 1}v${height - 1}h-${width - 1}z`;
    case 'rounded':
      return `M${margin + 1},${margin}h${width - 2}a1,1 0 0,1 1,1v${height - 2}a1,1 0 0,1 -1,1h-${width - 2}a1,1 0 0,1 -1,-1v-${height - 2}a1,1 0 0,1 1,-1z`;
    default:
      return `M${margin},${margin}h${width}v${height}h-${width}z`;
  }
}

function generateDividerPath(style, index) {
  const y = 12;
  const width = 20;
  
  switch (style) {
    case 'line':
      return `M2,${y}h${width}`;
    case 'dots':
      let dots = '';
      for (let i = 0; i < 10; i++) {
        dots += `M${2 + i * 2},${y}a0.3,0.3 0 1,0 0.6,0a0.3,0.3 0 1,0 -0.6,0`;
      }
      return dots;
    case 'wave':
      return `M2,${y}q2,-2 4,0t4,0t4,0t4,0`;
    default:
      return `M2,${y}h${width}`;
  }
}

function generateCornerPath(position, index) {
  const size = 5 + index * 0.2;
  
  switch (position) {
    case 'tl':
      return `M2,2v${size}M2,2h${size}`;
    case 'tr':
      return `M22,2v${size}M22,2h-${size}`;
    case 'bl':
      return `M2,22v-${size}M2,22h${size}`;
    case 'br':
      return `M22,22v-${size}M22,22h-${size}`;
    default:
      return '';
  }
}

function generateOrnamentPath(index) {
  const cx = 12;
  const cy = 12;
  const r = 3 + index * 0.1;
  return `M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 -${r * 2},0`;
}

function generateSpiralPath(cx, cy, index) {
  let path = `M${cx},${cy}`;
  const turns = 3;
  const maxRadius = 8;
  const points = 50;
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * turns * 2 * Math.PI;
    const radius = (i / points) * maxRadius;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    path += `L${x},${y}`;
  }
  
  return path;
}

function generateMedallionPath(cx, cy, index) {
  const r1 = 8 - index * 0.2;
  const r2 = 6 - index * 0.15;
  const r3 = 4 - index * 0.1;
  
  return `M${cx - r1},${cy}a${r1},${r1} 0 1,0 ${r1 * 2},0a${r1},${r1} 0 1,0 -${r1 * 2},0M${cx - r2},${cy}a${r2},${r2} 0 1,0 ${r2 * 2},0a${r2},${r2} 0 1,0 -${r2 * 2},0M${cx - r3},${cy}a${r3},${r3} 0 1,0 ${r3 * 2},0a${r3},${r3} 0 1,0 -${r3 * 2},0`;
}

// ========================================
// SISTEMA DE CUSTOMIZACIÓN DE COLORES
// ========================================

export function applyCustomColors(element, colors) {
  const { primary, secondary, fill, stroke, strokeWidth } = colors;
  
  return {
    ...element,
    fill: fill || primary || '#000000',
    stroke: stroke || secondary || 'none',
    strokeWidth: strokeWidth || 1,
  };
}

// ========================================
// FUNCIONES DE BÚSQUEDA Y UTILIDAD
// ========================================

export function getAllElements() {
  return {
    icons: WEDDING_ICONS_MASSIVE,
    floral: FLORAL_MASSIVE,
    shapes: SHAPES_MASSIVE,
  };
}

export function getElementsCount() {
  return {
    icons: Object.keys(WEDDING_ICONS_MASSIVE).length,
    floral: Object.keys(FLORAL_MASSIVE).length,
    shapes: Object.keys(SHAPES_MASSIVE).length,
    total: Object.keys(WEDDING_ICONS_MASSIVE).length +
           Object.keys(FLORAL_MASSIVE).length +
           Object.keys(SHAPES_MASSIVE).length,
  };
}

export function searchElements(query) {
  const allElements = {
    ...WEDDING_ICONS_MASSIVE,
    ...FLORAL_MASSIVE,
    ...SHAPES_MASSIVE,
  };
  
  const lowerQuery = query.toLowerCase();
  
  return Object.entries(allElements)
    .filter(([key]) => key.toLowerCase().includes(lowerQuery))
    .map(([key, value]) => ({ id: key, ...value }));
}

export function getElementByCategory(category) {
  switch (category) {
    case 'icons':
      return WEDDING_ICONS_MASSIVE;
    case 'floral':
      return FLORAL_MASSIVE;
    case 'shapes':
      return SHAPES_MASSIVE;
    default:
      return {};
  }
}

export default {
  WEDDING_ICONS_MASSIVE,
  FLORAL_MASSIVE,
  SHAPES_MASSIVE,
  getAllElements,
  getElementsCount,
  searchElements,
  getElementByCategory,
  applyCustomColors,
};
