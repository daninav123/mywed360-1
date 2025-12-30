/**
 * MARCOS DECORATIVOS
 * Bordes y frames para invitaciones
 */

export const DECORATIVE_FRAMES = [
  {
    id: 'classic-border',
    name: 'Borde Clásico',
    category: 'simple',
    description: 'Marco simple y elegante',
    create: (width, height, color = '#D4AF37') => ({
      type: 'group',
      objects: [
        // Borde exterior
        {
          type: 'rect',
          left: 50,
          top: 50,
          width: width - 100,
          height: height - 100,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 3,
        },
        // Borde interior
        {
          type: 'rect',
          left: 70,
          top: 70,
          width: width - 140,
          height: height - 140,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 1,
        },
      ],
    }),
  },

  {
    id: 'double-line',
    name: 'Línea Doble',
    category: 'simple',
    description: 'Marco de doble línea',
    create: (width, height, color = '#000000') => ({
      type: 'group',
      objects: [
        {
          type: 'rect',
          left: 40,
          top: 40,
          width: width - 80,
          height: height - 80,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 2,
        },
        {
          type: 'rect',
          left: 50,
          top: 50,
          width: width - 100,
          height: height - 100,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 2,
        },
      ],
    }),
  },

  {
    id: 'rounded-elegant',
    name: 'Elegante Redondeado',
    category: 'elegant',
    description: 'Marco con esquinas redondeadas',
    create: (width, height, color = '#8B7355') => ({
      type: 'group',
      objects: [
        {
          type: 'rect',
          left: 60,
          top: 60,
          width: width - 120,
          height: height - 120,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 4,
          rx: 20,
          ry: 20,
        },
      ],
    }),
  },

  {
    id: 'ornamental',
    name: 'Ornamental',
    category: 'decorative',
    description: 'Marco decorativo con esquinas',
    create: (width, height, color = '#D4AF37') => ({
      type: 'group',
      objects: [
        // Marco principal
        {
          type: 'rect',
          left: 80,
          top: 80,
          width: width - 160,
          height: height - 160,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 2,
        },
        // Esquina superior izquierda
        {
          type: 'rect',
          left: 60,
          top: 60,
          width: 40,
          height: 40,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 3,
        },
        // Esquina superior derecha
        {
          type: 'rect',
          left: width - 100,
          top: 60,
          width: 40,
          height: 40,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 3,
        },
        // Esquina inferior izquierda
        {
          type: 'rect',
          left: 60,
          top: height - 100,
          width: 40,
          height: 40,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 3,
        },
        // Esquina inferior derecha
        {
          type: 'rect',
          left: width - 100,
          top: height - 100,
          width: 40,
          height: 40,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 3,
        },
      ],
    }),
  },

  {
    id: 'vintage-corners',
    name: 'Esquinas Vintage',
    category: 'vintage',
    description: 'Decoración solo en esquinas',
    create: (width, height, color = '#6B5B4B') => ({
      type: 'group',
      objects: [
        // Línea superior izquierda horizontal
        {
          type: 'rect',
          left: 50,
          top: 50,
          width: 150,
          height: 3,
          fill: color,
        },
        // Línea superior izquierda vertical
        {
          type: 'rect',
          left: 50,
          top: 50,
          width: 3,
          height: 150,
          fill: color,
        },
        // Línea superior derecha horizontal
        {
          type: 'rect',
          left: width - 200,
          top: 50,
          width: 150,
          height: 3,
          fill: color,
        },
        // Línea superior derecha vertical
        {
          type: 'rect',
          left: width - 53,
          top: 50,
          width: 3,
          height: 150,
          fill: color,
        },
        // Línea inferior izquierda horizontal
        {
          type: 'rect',
          left: 50,
          top: height - 53,
          width: 150,
          height: 3,
          fill: color,
        },
        // Línea inferior izquierda vertical
        {
          type: 'rect',
          left: 50,
          top: height - 200,
          width: 3,
          height: 150,
          fill: color,
        },
        // Línea inferior derecha horizontal
        {
          type: 'rect',
          left: width - 200,
          top: height - 53,
          width: 150,
          height: 3,
          fill: color,
        },
        // Línea inferior derecha vertical
        {
          type: 'rect',
          left: width - 53,
          top: height - 200,
          width: 3,
          height: 150,
          fill: color,
        },
      ],
    }),
  },
];

export default DECORATIVE_FRAMES;
