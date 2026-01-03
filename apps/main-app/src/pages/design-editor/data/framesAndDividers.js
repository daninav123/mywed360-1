/**
 * Marcos y Divisores Decorativos para Invitaciones
 * SVG paths optimizados para invitaciones elegantes
 */

export const FRAMES = {
  // MARCOS RECTANGULARES COMPLETOS
  classic: [
    {
      id: 'frame-classic-1',
      name: 'Marco Clásico Simple',
      path: 'M50 50h900v1385H50V50zm20 20v1345h860V70H70z',
      category: 'classic',
      style: 'simple',
    },
    {
      id: 'frame-classic-double',
      name: 'Marco Doble',
      path: 'M40 40h920v1405H40V40zm15 15v1375h890V55H55zM60 60h880v1365H60V60zm10 10v1345h860V70H70z',
      category: 'classic',
      style: 'double',
    },
    {
      id: 'frame-elegant-corners',
      name: 'Marco con Esquinas Elegantes',
      path: 'M50 50h900v1385H50V50zm20 20v1345h860V70H70zM70 70l30-30M940 70l30 30M70 1425l30 30M940 1425l30-30',
      category: 'classic',
      style: 'corners',
    },
  ],

  // MARCOS ORNAMENTADOS
  ornate: [
    {
      id: 'frame-ornate-1',
      name: 'Marco Ornamentado Dorado',
      path: 'M50 50c0-10 10-20 20-20h860c10 0 20 10 20 20v1385c0 10-10 20-20 20H70c-10 0-20-10-20-20V50z',
      category: 'ornate',
      style: 'gold',
    },
    {
      id: 'frame-filigree',
      name: 'Marco Filigrana',
      path: 'M60 60q-10 0-10 10v1345q0 10 10 10h880q10 0 10-10V70q0-10-10-10H60z',
      category: 'ornate',
      style: 'filigree',
    },
  ],

  // MARCOS FLORALES
  floral: [
    {
      id: 'frame-floral-wreath',
      name: 'Marco Corona Floral',
      path: 'M500 100c-220 0-400 180-400 400v485c0 220 180 400 400 400s400-180 400-400V500c0-220-180-400-400-400z',
      category: 'floral',
      style: 'wreath',
    },
  ],
};

export const DIVIDERS = {
  // DIVISORES HORIZONTALES
  lines: [
    {
      id: 'divider-simple-line',
      name: 'Línea Simple',
      path: 'M100 0h800v2H100z',
      category: 'lines',
      style: 'simple',
    },
    {
      id: 'divider-double-line',
      name: 'Línea Doble',
      path: 'M100 0h800v1H100zM100 5h800v1H100z',
      category: 'lines',
      style: 'double',
    },
    {
      id: 'divider-dotted',
      name: 'Línea Punteada',
      path: 'M100 0h20v2h-20zM140 0h20v2h-20zM180 0h20v2h-20zM220 0h20v2h-20zM260 0h20v2h-20zM300 0h20v2h-20zM340 0h20v2h-20zM380 0h20v2h-20zM420 0h20v2h-20zM460 0h20v2h-20z',
      category: 'lines',
      style: 'dotted',
    },
  ],

  // DIVISORES DECORATIVOS
  ornamental: [
    {
      id: 'divider-scroll-1',
      name: 'Scroll Decorativo',
      path: 'M100 10c20-10 40-10 60 0s40 10 60 0 40-10 60 0 40 10 60 0 40-10 60 0 40 10 60 0 40-10 60 0 40 10 60 0 40-10 60 0',
      category: 'ornamental',
      style: 'scroll',
    },
    {
      id: 'divider-flourish',
      name: 'Flourish Central',
      path: 'M400 10c10-5 20-5 30 0l20 5c10 5 20 5 30 0s20-5 30 0l20 5c10 5 20 5 30 0M250 10h150M650 10h150',
      category: 'ornamental',
      style: 'flourish',
    },
    {
      id: 'divider-hearts',
      name: 'Corazones Decorativos',
      path: 'M300 10l5-5c5-5 10-5 15 0s10 5 15 0l5 5-5 5c-5 5-10 5-15 0s-10-5-15 0l-5-5zM500 10l5-5c5-5 10-5 15 0s10 5 15 0l5 5-5 5c-5 5-10 5-15 0s-10-5-15 0l-5-5zM700 10l5-5c5-5 10-5 15 0s10 5 15 0l5 5-5 5c-5 5-10 5-15 0s-10-5-15 0l-5-5z',
      category: 'ornamental',
      style: 'hearts',
    },
    {
      id: 'divider-leaves',
      name: 'Hojas Decorativas',
      path: 'M400 5l10 5-10 5M450 10l10-5-10 5 10 5M500 5l10 5-10 5M550 10l10-5-10 5 10 5M600 5l10 5-10 5',
      category: 'ornamental',
      style: 'leaves',
    },
  ],

  // DIVISORES GEOMÉTRICOS
  geometric: [
    {
      id: 'divider-diamonds',
      name: 'Diamantes',
      path: 'M300 10l10-10 10 10-10 10zM500 10l10-10 10 10-10 10zM700 10l10-10 10 10-10 10z',
      category: 'geometric',
      style: 'diamonds',
    },
    {
      id: 'divider-triangles',
      name: 'Triángulos',
      path: 'M300 0l10 20h-20zM500 0l10 20h-20zM700 0l10 20h-20z',
      category: 'geometric',
      style: 'triangles',
    },
  ],
};

export const CORNER_ORNAMENTS = {
  // ELEMENTOS PARA ESQUINAS
  floral: [
    {
      id: 'corner-floral-1',
      name: 'Esquina Floral Simple',
      path: 'M0 0c10 0 20 5 25 10s10 15 10 25c0-10 5-20 10-25s15-10 25-10',
      category: 'floral',
      position: 'top-left',
    },
    {
      id: 'corner-leaves',
      name: 'Esquina Hojas',
      path: 'M0 0q10 5 15 15t5 20q5-15 15-20t20-15',
      category: 'floral',
      position: 'top-left',
    },
  ],

  geometric: [
    {
      id: 'corner-art-deco',
      name: 'Esquina Art Deco',
      path: 'M0 0h40v5H5v35H0zM0 0l40 40M10 0l30 30M20 0l20 20M30 0l10 10',
      category: 'geometric',
      position: 'top-left',
    },
    {
      id: 'corner-elegant',
      name: 'Esquina Elegante',
      path: 'M0 0h30l-5 5h-20v20l-5 5z',
      category: 'geometric',
      position: 'top-left',
    },
  ],
};

// Helper para obtener todos los marcos
export const getAllFrames = () => {
  return Object.values(FRAMES).flat();
};

// Helper para obtener todos los divisores
export const getAllDividers = () => {
  return Object.values(DIVIDERS).flat();
};

// Helper para obtener todos los ornamentos de esquina
export const getAllCornerOrnaments = () => {
  return Object.values(CORNER_ORNAMENTS).flat();
};

// Categorías para filtrado
export const FRAME_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'classic', label: 'Clásicos' },
  { id: 'ornate', label: 'Ornamentados' },
  { id: 'floral', label: 'Florales' },
];

export const DIVIDER_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'lines', label: 'Líneas' },
  { id: 'ornamental', label: 'Ornamentales' },
  { id: 'geometric', label: 'Geométricos' },
];

export default { FRAMES, DIVIDERS, CORNER_ORNAMENTS };
