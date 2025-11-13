/**
 * ExportStyles.js
 * Estilos predefinidos para exportación de planos de mesas
 */

export const EXPORT_STYLES = {
  minimalist: {
    id: 'minimalist',
    name: 'Minimalista',
    description: 'Diseño limpio y moderno',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      background: '#FFFFFF',
      accent: '#F3F4F6',
      text: '#111827',
    },
    fonts: {
      primary: 'Inter',
      secondary: 'Inter',
      size: 12,
    },
    borders: {
      width: 1,
      radius: 4,
      style: 'solid',
    },
    shadows: false,
  },

  elegant: {
    id: 'elegant',
    name: 'Elegante',
    description: 'Estilo clásico con serifas',
    colors: {
      primary: '#1F2937',
      secondary: '#D4AF37',
      background: '#FFF8F0',
      accent: '#F7F4ED',
      text: '#1F2937',
    },
    fonts: {
      primary: 'Playfair Display',
      secondary: 'Georgia',
      size: 14,
    },
    borders: {
      width: 2,
      radius: 0,
      style: 'solid',
    },
    shadows: true,
  },

  colorful: {
    id: 'colorful',
    name: 'Colorido',
    description: 'Vibrante y alegre',
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      background: '#FFFFFF',
      accent: '#FEF3C7',
      text: '#1F2937',
    },
    fonts: {
      primary: 'Poppins',
      secondary: 'Roboto',
      size: 13,
    },
    borders: {
      width: 2,
      radius: 8,
      style: 'solid',
    },
    shadows: true,
  },

  dark: {
    id: 'dark',
    name: 'Oscuro',
    description: 'Modo oscuro moderno',
    colors: {
      primary: '#F9FAFB',
      secondary: '#9CA3AF',
      background: '#111827',
      accent: '#1F2937',
      text: '#F9FAFB',
    },
    fonts: {
      primary: 'Inter',
      secondary: 'Roboto',
      size: 12,
    },
    borders: {
      width: 1,
      radius: 6,
      style: 'solid',
    },
    shadows: false,
  },

  romantic: {
    id: 'romantic',
    name: 'Romántico',
    description: 'Tonos suaves y delicados',
    colors: {
      primary: '#DB2777',
      secondary: '#F472B6',
      background: '#FDF2F8',
      accent: '#FCE7F3',
      text: '#831843',
    },
    fonts: {
      primary: 'Merriweather',
      secondary: 'Georgia',
      size: 13,
    },
    borders: {
      width: 1.5,
      radius: 12,
      style: 'solid',
    },
    shadows: true,
  },

  rustic: {
    id: 'rustic',
    name: 'Rústico',
    description: 'Natural y cálido',
    colors: {
      primary: '#78350F',
      secondary: '#92400E',
      background: '#FEF3C7',
      accent: '#FDE68A',
      text: '#78350F',
    },
    fonts: {
      primary: 'Montserrat',
      secondary: 'Lato',
      size: 13,
    },
    borders: {
      width: 2,
      radius: 4,
      style: 'solid',
    },
    shadows: true,
  },

  modern: {
    id: 'modern',
    name: 'Moderno',
    description: 'Diseño actual y limpio',
    colors: {
      primary: '#6366F1',
      secondary: '#818CF8',
      background: '#FFFFFF',
      accent: '#EEF2FF',
      text: '#1E293B',
    },
    fonts: {
      primary: 'Inter',
      secondary: 'Roboto',
      size: 12,
    },
    borders: {
      width: 2,
      radius: 8,
      style: 'solid',
    },
    shadows: true,
  },

  vintage: {
    id: 'vintage',
    name: 'Vintage',
    description: 'Estilo retro elegante',
    colors: {
      primary: '#7C2D12',
      secondary: '#C2410C',
      background: '#FFFBEB',
      accent: '#FEF3C7',
      text: '#7C2D12',
    },
    fonts: {
      primary: 'Playfair Display',
      secondary: 'Merriweather',
      size: 14,
    },
    borders: {
      width: 2,
      radius: 0,
      style: 'double',
    },
    shadows: false,
  },
};

export const EXPORT_SIZES = {
  // PDF Sizes
  a4: { width: 210, height: 297, unit: 'mm', name: 'A4' },
  a3: { width: 297, height: 420, unit: 'mm', name: 'A3' },
  a2: { width: 420, height: 594, unit: 'mm', name: 'A2' },
  letter: { width: 215.9, height: 279.4, unit: 'mm', name: 'Letter' },
  legal: { width: 215.9, height: 355.6, unit: 'mm', name: 'Legal' },
  tabloid: { width: 279.4, height: 431.8, unit: 'mm', name: 'Tabloid' },

  // PNG Resolutions
  sd: { width: 1280, height: 720, unit: 'px', name: 'SD (720p)' },
  hd: { width: 1920, height: 1080, unit: 'px', name: 'HD (1080p)' },
  '2k': { width: 2560, height: 1440, unit: 'px', name: '2K' },
  '4k': { width: 3840, height: 2160, unit: 'px', name: '4K' },
  '8k': { width: 7680, height: 4320, unit: 'px', name: '8K' },
};

export const EXPORT_ORIENTATIONS = {
  portrait: { name: 'Vertical', icon: '📱' },
  landscape: { name: 'Horizontal', icon: '🖥️' },
};

export const EXPORT_CONTENT_OPTIONS = {
  title: { label: 'Título principal', default: true },
  subtitle: { label: 'Subtítulo/Fecha', default: true },
  tableNumbers: { label: 'Números de mesa', default: true },
  guestNames: { label: 'Nombres de invitados', default: true },
  grid: { label: 'Grid de fondo', default: false },
  legend: { label: 'Leyenda', default: true },
  stats: { label: 'Estadísticas', default: true },
  watermark: { label: 'Marca de agua', default: false },
  logo: { label: 'Logo personalizado', default: false },
};

/**
 * Aplicar estilo a elementos del canvas
 */
export function applyStyleToCanvas(canvasElement, style) {
  if (!canvasElement || !style) return;

  // Aplicar colores
  canvasElement.style.setProperty('--primary-color', style.colors.primary);
  canvasElement.style.setProperty('--secondary-color', style.colors.secondary);
  canvasElement.style.setProperty('--background-color', style.colors.background);
  canvasElement.style.setProperty('--accent-color', style.colors.accent);
  canvasElement.style.setProperty('--text-color', style.colors.text);

  // Aplicar fuentes
  canvasElement.style.setProperty('--primary-font', style.fonts.primary);
  canvasElement.style.setProperty('--secondary-font', style.fonts.secondary);
  canvasElement.style.setProperty('--font-size', `${style.fonts.size}px`);

  // Aplicar bordes
  canvasElement.style.setProperty('--border-width', `${style.borders.width}px`);
  canvasElement.style.setProperty('--border-radius', `${style.borders.radius}px`);
  canvasElement.style.setProperty('--border-style', style.borders.style);

  // Aplicar sombras
  if (style.shadows) {
    canvasElement.style.setProperty('--box-shadow', '0 4px 6px rgba(0,0,0,0.1)');
  } else {
    canvasElement.style.setProperty('--box-shadow', 'none');
  }
}

/**
 * Generar CSS para exportación
 */
export function generateExportCSS(style) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=${style.fonts.primary.replace(' ', '+')}:wght@400;600;700&family=${style.fonts.secondary.replace(' ', '+')}:wght@400;600&display=swap');
    
    body {
      font-family: '${style.fonts.primary}', sans-serif;
      background-color: ${style.colors.background};
      color: ${style.colors.text};
      font-size: ${style.fonts.size}px;
    }
    
    .table {
      border: ${style.borders.width}px ${style.borders.style} ${style.colors.primary};
      border-radius: ${style.borders.radius}px;
      ${style.shadows ? 'box-shadow: 0 4px 6px rgba(0,0,0,0.1);' : ''}
    }
    
    .table-number {
      color: ${style.colors.primary};
      font-weight: 600;
      font-family: '${style.fonts.primary}', sans-serif;
    }
    
    .guest-name {
      color: ${style.colors.text};
      font-family: '${style.fonts.secondary}', sans-serif;
      font-size: ${style.fonts.size * 0.85}px;
    }
    
    .accent {
      background-color: ${style.colors.accent};
      color: ${style.colors.primary};
    }
  `;
}
