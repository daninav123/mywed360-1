/**
 * BIBLIOTECA DE ASSETS PROFESIONALES PARA DISEÑOS
 * 
 * Sistema completo de elementos reutilizables:
 * - SVGs decorativos
 * - Ornamentos florales
 * - Marcos y bordes
 * - Iconos temáticos
 * - Divisores y separadores
 */

// 🌸 ELEMENTOS FLORALES
export const FLORAL_ELEMENTS = {
  // Ramas y hojas
  eucalyptusLeft: {
    type: 'group',
    objects: [
      { type: 'path', path: 'M 0,0 Q 15,20 25,45 Q 35,70 40,100', stroke: '#7A9B76', strokeWidth: 2, fill: 'transparent' },
      { type: 'ellipse', rx: 8, ry: 12, fill: '#A5C9A1', opacity: 0.8, top: 10, left: 8, angle: -20 },
      { type: 'ellipse', rx: 7, ry: 11, fill: '#A5C9A1', opacity: 0.8, top: 30, left: 18, angle: 15 },
      { type: 'ellipse', rx: 9, ry: 13, fill: '#A5C9A1', opacity: 0.8, top: 50, left: 25, angle: -10 },
      { type: 'ellipse', rx: 8, ry: 12, fill: '#A5C9A1', opacity: 0.8, top: 72, left: 32, angle: 20 },
      { type: 'ellipse', rx: 7, ry: 10, fill: '#A5C9A1', opacity: 0.8, top: 90, left: 38, angle: -15 },
    ],
  },
  
  eucalyptusRight: {
    type: 'group',
    objects: [
      { type: 'path', path: 'M 0,0 Q -15,20 -25,45 Q -35,70 -40,100', stroke: '#7A9B76', strokeWidth: 2, fill: 'transparent' },
      { type: 'ellipse', rx: 8, ry: 12, fill: '#A5C9A1', opacity: 0.8, top: 10, left: -8, angle: 20 },
      { type: 'ellipse', rx: 7, ry: 11, fill: '#A5C9A1', opacity: 0.8, top: 30, left: -18, angle: -15 },
      { type: 'ellipse', rx: 9, ry: 13, fill: '#A5C9A1', opacity: 0.8, top: 50, left: -25, angle: 10 },
      { type: 'ellipse', rx: 8, ry: 12, fill: '#A5C9A1', opacity: 0.8, top: 72, left: -32, angle: -20 },
      { type: 'ellipse', rx: 7, ry: 10, fill: '#A5C9A1', opacity: 0.8, top: 90, left: -38, angle: 15 },
    ],
  },
  
  // Flores decorativas
  roseBloom: {
    type: 'group',
    objects: [
      { type: 'circle', radius: 20, fill: '#E8B4C4', opacity: 0.3, top: 0, left: 0 },
      { type: 'circle', radius: 16, fill: '#E8B4C4', opacity: 0.5, top: 4, left: 4 },
      { type: 'circle', radius: 12, fill: '#E8B4C4', opacity: 0.7, top: 8, left: 8 },
      { type: 'circle', radius: 8, fill: '#F4C2D0', opacity: 0.9, top: 12, left: 12 },
      { type: 'circle', radius: 4, fill: '#FFD1DC', top: 16, left: 16 },
    ],
  },
  
  peonyFull: {
    type: 'group',
    objects: [
      // Pétalos externos
      { type: 'circle', radius: 25, fill: '#D4A5B0', opacity: 0.4, top: 0, left: 0 },
      { type: 'circle', radius: 25, fill: '#D4A5B0', opacity: 0.4, top: 8, left: 8 },
      { type: 'circle', radius: 25, fill: '#D4A5B0', opacity: 0.4, top: -8, left: 8 },
      { type: 'circle', radius: 25, fill: '#D4A5B0', opacity: 0.4, top: 8, left: -8 },
      // Centro
      { type: 'circle', radius: 18, fill: '#E8B4C4', opacity: 0.7, top: 7, left: 7 },
      { type: 'circle', radius: 10, fill: '#F4C2D0', opacity: 0.9, top: 15, left: 15 },
      { type: 'circle', radius: 5, fill: '#FFD1DC', top: 20, left: 20 },
    ],
  },
  
  lavenderSprig: {
    type: 'group',
    objects: [
      { type: 'path', path: 'M 0,0 L 0,60', stroke: '#8B9B84', strokeWidth: 1.5, fill: 'transparent' },
      { type: 'circle', radius: 3, fill: '#A78BFA', top: 5, left: 0 },
      { type: 'circle', radius: 3, fill: '#A78BFA', top: 12, left: -2 },
      { type: 'circle', radius: 3, fill: '#A78BFA', top: 12, left: 2 },
      { type: 'circle', radius: 3, fill: '#A78BFA', top: 19, left: 0 },
      { type: 'circle', radius: 3, fill: '#A78BFA', top: 26, left: -2 },
      { type: 'circle', radius: 3, fill: '#A78BFA', top: 26, left: 2 },
      { type: 'circle', radius: 3, fill: '#A78BFA', top: 33, left: 0 },
    ],
  },
};

// 🎨 ORNAMENTOS Y DECORACIONES
export const ORNAMENTS = {
  // Divisores
  doubleLine: {
    type: 'group',
    objects: [
      { type: 'rect', width: 200, height: 1, fill: '#D4AF37', top: 0, left: 0 },
      { type: 'rect', width: 200, height: 1, fill: '#D4AF37', top: 8, left: 0 },
    ],
  },
  
  ornateCenter: {
    type: 'group',
    objects: [
      { type: 'rect', width: 80, height: 1, fill: '#8B9B84', top: 10, left: 0 },
      { type: 'circle', radius: 8, fill: 'transparent', stroke: '#8B9B84', strokeWidth: 1, top: 10, left: 100, originX: 'center', originY: 'center' },
      { type: 'circle', radius: 3, fill: '#8B9B84', top: 10, left: 100, originX: 'center', originY: 'center' },
      { type: 'rect', width: 80, height: 1, fill: '#8B9B84', top: 10, left: 120 },
    ],
  },
  
  flourishLeft: {
    type: 'group',
    objects: [
      { type: 'path', path: 'M 0,10 Q 20,0 40,10 Q 60,20 80,10', stroke: '#D4AF37', strokeWidth: 1.5, fill: 'transparent' },
      { type: 'path', path: 'M 0,10 Q 20,20 40,10 Q 60,0 80,10', stroke: '#D4AF37', strokeWidth: 1.5, fill: 'transparent', opacity: 0.6 },
    ],
  },
  
  // Esquinas decorativas
  cornerTopLeft: {
    type: 'group',
    objects: [
      { type: 'rect', width: 60, height: 2, fill: '#8B9B84', top: 0, left: 0 },
      { type: 'rect', width: 2, height: 60, fill: '#8B9B84', top: 0, left: 0 },
      { type: 'circle', radius: 4, fill: '#8B9B84', top: 0, left: 60 },
      { type: 'circle', radius: 4, fill: '#8B9B84', top: 60, left: 0 },
    ],
  },
  
  cornerTopRight: {
    type: 'group',
    objects: [
      { type: 'rect', width: 60, height: 2, fill: '#8B9B84', top: 0, left: 0 },
      { type: 'rect', width: 2, height: 60, fill: '#8B9B84', top: 0, left: 60 },
      { type: 'circle', radius: 4, fill: '#8B9B84', top: 0, left: 0 },
      { type: 'circle', radius: 4, fill: '#8B9B84', top: 60, left: 60 },
    ],
  },
};

// 💍 ICONOS TEMÁTICOS DE BODA
export const WEDDING_ICONS = {
  rings: {
    type: 'group',
    objects: [
      { type: 'circle', radius: 15, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 2, top: 15, left: 10, originX: 'center', originY: 'center' },
      { type: 'circle', radius: 15, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 2, top: 15, left: 30, originX: 'center', originY: 'center' },
      { type: 'circle', radius: 3, fill: '#FFD700', top: 5, left: 10, originX: 'center', originY: 'center' },
    ],
  },
  
  heart: {
    type: 'group',
    objects: [
      { type: 'path', path: 'M 20,10 Q 20,0 30,0 Q 40,0 40,10 Q 40,20 20,40 Q 0,20 0,10 Q 0,0 10,0 Q 20,0 20,10', fill: '#E8B4C4', stroke: '#D49AAA', strokeWidth: 1 },
    ],
  },
  
  location: {
    type: 'group',
    objects: [
      { type: 'path', path: 'M 15,0 Q 25,0 30,10 Q 30,20 15,40 Q 0,20 0,10 Q 0,0 15,0', fill: 'transparent', stroke: '#8B9B84', strokeWidth: 2 },
      { type: 'circle', radius: 5, fill: '#8B9B84', top: 10, left: 15, originX: 'center', originY: 'center' },
    ],
  },
  
  calendar: {
    type: 'group',
    objects: [
      { type: 'rect', width: 40, height: 35, fill: 'transparent', stroke: '#6B7B67', strokeWidth: 2, rx: 3, top: 5, left: 0 },
      { type: 'rect', width: 40, height: 10, fill: '#8B9B84', rx: 3, top: 5, left: 0 },
      { type: 'rect', width: 2, height: 8, fill: '#6B7B67', top: 0, left: 8 },
      { type: 'rect', width: 2, height: 8, fill: '#6B7B67', top: 0, left: 30 },
      { type: 'i-text', text: '15', fontSize: 14, fill: '#6B7B67', fontFamily: 'Arial', fontWeight: 'bold', top: 22, left: 20, originX: 'center', originY: 'center' },
    ],
  },
  
  clock: {
    type: 'group',
    objects: [
      { type: 'circle', radius: 18, fill: 'transparent', stroke: '#6B7B67', strokeWidth: 2, top: 18, left: 18, originX: 'center', originY: 'center' },
      { type: 'rect', width: 2, height: 10, fill: '#6B7B67', top: 8, left: 17 },
      { type: 'rect', width: 8, height: 2, fill: '#6B7B67', top: 17, left: 18 },
      { type: 'circle', radius: 2, fill: '#8B9B84', top: 18, left: 18, originX: 'center', originY: 'center' },
    ],
  },
  
  champagne: {
    type: 'group',
    objects: [
      { type: 'path', path: 'M 10,30 L 8,10 Q 8,5 10,5 L 15,5 Q 17,5 17,10 L 15,30 Q 14,35 12.5,35 Q 11,35 10,30', fill: 'transparent', stroke: '#D4AF37', strokeWidth: 2 },
      { type: 'rect', width: 12, height: 2, fill: '#D4AF37', top: 5, left: 6.5 },
      { type: 'circle', radius: 2, fill: '#FFD700', opacity: 0.6, top: 8, left: 10 },
      { type: 'circle', radius: 1.5, fill: '#FFD700', opacity: 0.6, top: 12, left: 13 },
      { type: 'circle', radius: 1, fill: '#FFD700', opacity: 0.6, top: 15, left: 11 },
    ],
  },
  
  envelope: {
    type: 'group',
    objects: [
      { type: 'rect', width: 50, height: 35, fill: '#FFFFFF', stroke: '#D4AF37', strokeWidth: 2, top: 0, left: 0 },
      { type: 'path', path: 'M 0,0 L 25,20 L 50,0', stroke: '#D4AF37', strokeWidth: 2, fill: 'transparent' },
      { type: 'path', path: 'M 0,0 L 25,20 L 50,0', fill: '#FFF9E6', opacity: 0.5 },
    ],
  },
};

// 🎀 ELEMENTOS DECORATIVOS ESPECIALES
export const SPECIAL_DECORATIONS = {
  bow: {
    type: 'group',
    objects: [
      // Centro del lazo
      { type: 'circle', radius: 8, fill: '#E8B4C4', top: 15, left: 25, originX: 'center', originY: 'center' },
      // Lazo izquierdo
      { type: 'path', path: 'M 25,15 Q 10,5 5,15 Q 10,25 25,15', fill: '#F4C2D0', stroke: '#E8B4C4', strokeWidth: 1.5 },
      // Lazo derecho
      { type: 'path', path: 'M 25,15 Q 40,5 45,15 Q 40,25 25,15', fill: '#F4C2D0', stroke: '#E8B4C4', strokeWidth: 1.5 },
      // Cintas colgantes
      { type: 'path', path: 'M 20,20 L 18,40 L 22,35', fill: '#F4C2D0', stroke: '#E8B4C4', strokeWidth: 1 },
      { type: 'path', path: 'M 30,20 L 32,40 L 28,35', fill: '#F4C2D0', stroke: '#E8B4C4', strokeWidth: 1 },
    ],
  },
  
  ribbon: {
    type: 'group',
    objects: [
      { type: 'rect', width: 200, height: 30, fill: '#E8B4C4', top: 0, left: 0 },
      { type: 'rect', width: 200, height: 3, fill: '#D49AAA', top: 0, left: 0 },
      { type: 'rect', width: 200, height: 3, fill: '#D49AAA', top: 27, left: 0 },
    ],
  },
  
  waxSeal: {
    type: 'group',
    objects: [
      { type: 'circle', radius: 25, fill: '#8B4C5C', top: 25, left: 25, originX: 'center', originY: 'center' },
      { type: 'circle', radius: 22, fill: '#A8667A', opacity: 0.8, top: 25, left: 25, originX: 'center', originY: 'center' },
      { type: 'i-text', text: '❦', fontSize: 20, fill: '#F4C2D0', top: 25, left: 25, originX: 'center', originY: 'center' },
    ],
  },
  
  monogramCircle: {
    type: 'group',
    objects: [
      { type: 'circle', radius: 50, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 2, top: 50, left: 50, originX: 'center', originY: 'center' },
      { type: 'circle', radius: 45, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 1, top: 50, left: 50, originX: 'center', originY: 'center' },
    ],
  },
  
  laurelLeft: {
    type: 'group',
    objects: [
      { type: 'path', path: 'M 0,0 Q 10,20 15,40 Q 18,60 20,80', stroke: '#7A9B76', strokeWidth: 2, fill: 'transparent' },
      { type: 'ellipse', rx: 6, ry: 10, fill: '#8B9B84', opacity: 0.7, top: 10, left: 8, angle: -30 },
      { type: 'ellipse', rx: 6, ry: 10, fill: '#8B9B84', opacity: 0.7, top: 25, left: 11, angle: -20 },
      { type: 'ellipse', rx: 6, ry: 10, fill: '#8B9B84', opacity: 0.7, top: 40, left: 13, angle: -15 },
      { type: 'ellipse', rx: 6, ry: 10, fill: '#8B9B84', opacity: 0.7, top: 55, left: 16, angle: -10 },
      { type: 'ellipse', rx: 6, ry: 10, fill: '#8B9B84', opacity: 0.7, top: 70, left: 18, angle: -5 },
    ],
  },
  
  laurelRight: {
    type: 'group',
    objects: [
      { type: 'path', path: 'M 0,0 Q -10,20 -15,40 Q -18,60 -20,80', stroke: '#7A9B76', strokeWidth: 2, fill: 'transparent' },
      { type: 'ellipse', rx: 6, ry: 10, fill: '#8B9B84', opacity: 0.7, top: 10, left: -8, angle: 30 },
      { type: 'ellipse', rx: 6, ry: 10, fill: '#8B9B84', opacity: 0.7, top: 25, left: -11, angle: 20 },
      { type: 'ellipse', rx: 6, ry: 10, fill: '#8B9B84', opacity: 0.7, top: 40, left: -13, angle: 15 },
      { type: 'ellipse', rx: 6, ry: 10, fill: '#8B9B84', opacity: 0.7, top: 55, left: -16, angle: 10 },
      { type: 'ellipse', rx: 6, ry: 10, fill: '#8B9B84', opacity: 0.7, top: 70, left: -18, angle: 5 },
    ],
  },
};

// 📐 MARCOS Y BORDES
export const FRAMES = {
  simpleDouble: {
    type: 'group',
    objects: [
      { type: 'rect', width: 1000, height: 1400, fill: 'transparent', stroke: '#2C4A3E', strokeWidth: 3, rx: 0, top: 0, left: 0 },
      { type: 'rect', width: 970, height: 1370, fill: 'transparent', stroke: '#8B9B84', strokeWidth: 1, rx: 0, top: 15, left: 15 },
    ],
  },
  
  ornateGold: {
    type: 'group',
    objects: [
      { type: 'rect', width: 1000, height: 1400, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 2, rx: 5, top: 0, left: 0 },
      { type: 'rect', width: 980, height: 1380, fill: 'transparent', stroke: '#B8941F', strokeWidth: 1, rx: 5, top: 10, left: 10 },
      { type: 'circle', radius: 5, fill: '#FFD700', top: 0, left: 0 },
      { type: 'circle', radius: 5, fill: '#FFD700', top: 0, left: 1000 },
      { type: 'circle', radius: 5, fill: '#FFD700', top: 1400, left: 0 },
      { type: 'circle', radius: 5, fill: '#FFD700', top: 1400, left: 1000 },
    ],
  },
  
  vintageFiligree: {
    type: 'group',
    objects: [
      { type: 'rect', width: 1000, height: 1400, fill: 'transparent', stroke: '#8B6B75', strokeWidth: 2, rx: 10, top: 0, left: 0 },
      // Decoraciones de esquina (simplificadas)
      { type: 'path', path: 'M 20,20 Q 40,20 40,40', stroke: '#8B6B75', strokeWidth: 1.5, fill: 'transparent' },
      { type: 'path', path: 'M 980,20 Q 960,20 960,40', stroke: '#8B6B75', strokeWidth: 1.5, fill: 'transparent' },
      { type: 'path', path: 'M 20,1380 Q 40,1380 40,1360', stroke: '#8B6B75', strokeWidth: 1.5, fill: 'transparent' },
      { type: 'path', path: 'M 980,1380 Q 960,1380 960,1360', stroke: '#8B6B75', strokeWidth: 1.5, fill: 'transparent' },
    ],
  },
};

// 🎨 PATRONES Y TEXTURAS (simulados con elementos repetidos)
export const PATTERNS = {
  dotsPattern: {
    type: 'group',
    description: 'Patrón de puntos decorativos',
    objects: Array.from({ length: 20 }, (_, i) => ({
      type: 'circle',
      radius: 2,
      fill: '#E8E3D8',
      opacity: 0.3,
      top: (i % 4) * 30,
      left: Math.floor(i / 4) * 30,
    })),
  },
  
  confettiLight: {
    type: 'group',
    description: 'Confeti ligero para fondos',
    objects: [
      { type: 'circle', radius: 3, fill: '#FFD1DC', opacity: 0.4, top: 20, left: 50 },
      { type: 'circle', radius: 2, fill: '#E8B4C4', opacity: 0.4, top: 80, left: 150 },
      { type: 'circle', radius: 4, fill: '#A78BFA', opacity: 0.3, top: 120, left: 80 },
      { type: 'circle', radius: 2, fill: '#60D9BE', opacity: 0.3, top: 180, left: 200 },
      { type: 'circle', radius: 3, fill: '#FFB84D', opacity: 0.4, top: 40, left: 180 },
    ],
  },
};

// 📦 FUNCIONES HELPER
export const getAssetByName = (category, name) => {
  const categories = {
    floral: FLORAL_ELEMENTS,
    ornament: ORNAMENTS,
    icon: WEDDING_ICONS,
    decoration: SPECIAL_DECORATIONS,
    frame: FRAMES,
    pattern: PATTERNS,
  };
  
  return categories[category]?.[name] || null;
};

export const getAllAssets = () => ({
  floral: FLORAL_ELEMENTS,
  ornaments: ORNAMENTS,
  icons: WEDDING_ICONS,
  decorations: SPECIAL_DECORATIONS,
  frames: FRAMES,
  patterns: PATTERNS,
});

// Función para insertar asset en posición específica
export const placeAsset = (asset, position = { top: 0, left: 0 }, scale = 1) => {
  if (!asset) return null;
  
  const placedAsset = JSON.parse(JSON.stringify(asset)); // Deep clone
  
  // Aplicar posición
  if (placedAsset.type === 'group') {
    placedAsset.top = position.top;
    placedAsset.left = position.left;
    placedAsset.scaleX = scale;
    placedAsset.scaleY = scale;
  } else {
    placedAsset.top = position.top;
    placedAsset.left = position.left;
  }
  
  return placedAsset;
};
