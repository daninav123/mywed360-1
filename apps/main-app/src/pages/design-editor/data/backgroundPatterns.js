/**
 * PATRONES DE FONDO
 * Texturas y fondos para diseños
 */

export const BACKGROUND_PATTERNS = {
  'Sólidos': [
    { id: 'white', name: 'Blanco', color: '#FFFFFF' },
    { id: 'ivory', name: 'Marfil', color: '#FFFFF0' },
    { id: 'cream', name: 'Crema', color: '#FFFDD0' },
    { id: 'champagne', name: 'Champagne', color: '#F7E7CE' },
    { id: 'blush', name: 'Rosa Claro', color: '#FFE4E1' },
    { id: 'sage', name: 'Verde Salvia', color: '#9CAF88' },
    { id: 'dusty-blue', name: 'Azul Empolvado', color: '#E0F4FF' },
    { id: 'lavender', name: 'Lavanda', color: '#E6E6FA' },
  ],

  'Gradientes': [
    {
      id: 'sunset',
      name: 'Atardecer',
      type: 'gradient',
      colors: ['#FF6B6B', '#FFE66D'],
      direction: 'diagonal',
    },
    {
      id: 'ocean',
      name: 'Océano',
      type: 'gradient',
      colors: ['#4A90E2', '#87CEEB'],
      direction: 'vertical',
    },
    {
      id: 'rose-gold',
      name: 'Oro Rosa',
      type: 'gradient',
      colors: ['#F7CCAC', '#E7B09C'],
      direction: 'diagonal',
    },
    {
      id: 'romantic',
      name: 'Romántico',
      type: 'gradient',
      colors: ['#FFE4E1', '#FFC0CB'],
      direction: 'vertical',
    },
    {
      id: 'elegant',
      name: 'Elegante',
      type: 'gradient',
      colors: ['#D4AF37', '#FFD700'],
      direction: 'diagonal',
    },
  ],

  'Texturas': [
    {
      id: 'paper',
      name: 'Papel',
      type: 'texture',
      color: '#FAF9F6',
      pattern: 'paper',
    },
    {
      id: 'linen',
      name: 'Lino',
      type: 'texture',
      color: '#F5F5DC',
      pattern: 'linen',
    },
    {
      id: 'marble',
      name: 'Mármol',
      type: 'texture',
      color: '#FFFFFF',
      pattern: 'marble',
    },
    {
      id: 'watercolor',
      name: 'Acuarela',
      type: 'texture',
      color: '#E8F5E9',
      pattern: 'watercolor',
    },
  ],

  'Patrones': [
    {
      id: 'dots',
      name: 'Lunares',
      type: 'pattern',
      base: '#FFE4E1',
      pattern: 'polka-dots',
      patternColor: '#FFFFFF',
    },
    {
      id: 'stripes',
      name: 'Rayas',
      type: 'pattern',
      base: '#F5F5F5',
      pattern: 'stripes',
      patternColor: '#FFFFFF',
    },
    {
      id: 'chevron',
      name: 'Chevron',
      type: 'pattern',
      base: '#E8F5E9',
      pattern: 'chevron',
      patternColor: '#C8E6C9',
    },
    {
      id: 'damask',
      name: 'Damasco',
      type: 'pattern',
      base: '#FFF8DC',
      pattern: 'damask',
      patternColor: '#F5DEB3',
    },
  ],
};

/**
 * Crear objeto de fondo para Fabric.js
 */
export function createBackground(pattern, canvasWidth, canvasHeight) {
  if (pattern.type === 'gradient') {
    return {
      type: 'gradient',
      gradient: {
        type: 'linear',
        coords: pattern.direction === 'vertical' 
          ? { x1: 0, y1: 0, x2: 0, y2: canvasHeight }
          : { x1: 0, y1: 0, x2: canvasWidth, y2: canvasHeight },
        colorStops: [
          { offset: 0, color: pattern.colors[0] },
          { offset: 1, color: pattern.colors[1] },
        ],
      },
    };
  }

  if (pattern.type === 'pattern') {
    return {
      type: 'pattern',
      baseColor: pattern.base,
      patternType: pattern.pattern,
      patternColor: pattern.patternColor,
    };
  }

  // Sólido o textura
  return {
    type: 'solid',
    color: pattern.color || pattern.base,
  };
}

export default BACKGROUND_PATTERNS;
