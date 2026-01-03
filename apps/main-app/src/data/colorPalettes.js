/**
 * Color Palettes - Paletas de colores predefinidas por estilo
 * FASE 1.3 del WORKFLOW-USUARIO.md
 */

export const COLOR_PALETTES = {
  clasico: [
    {
      id: 'white-gold',
      name: 'Blanco y Dorado',
      colors: ['#FFFFFF', '#F5F5F5', '#D4AF37', '#C9A961', '#BFA255'],
      description: 'Elegancia atemporal con toques de oro',
      season: ['all'],
    },
    {
      id: 'ivory-champagne',
      name: 'Marfil y Champagne',
      colors: ['#FFFFF0', '#F3E5AB', '#D4C5A9', '#C9B992', '#B8A87A'],
      description: 'Suavidad y sofisticación',
      season: ['primavera', 'verano', 'otoño'],
    },
    {
      id: 'white-silver',
      name: 'Blanco y Plata',
      colors: ['#FFFFFF', '#F0F0F0', '#C0C0C0', '#A8A8A8', '#8C8C8C'],
      description: 'Modernidad clásica',
      season: ['invierno', 'all'],
    },
  ],

  rustico: [
    {
      id: 'earth-tones',
      name: 'Tonos Tierra',
      colors: ['#8B7355', '#A0826D', '#C8B299', '#E8DCC4', '#F5F0E8'],
      description: 'Calidez natural del campo',
      season: ['otoño', 'primavera'],
    },
    {
      id: 'forest-green',
      name: 'Verde Bosque',
      colors: ['#2F4F2F', '#556B2F', '#6B8E23', '#9ACD32', '#F5F5DC'],
      description: 'Frescura de la naturaleza',
      season: ['primavera', 'verano'],
    },
    {
      id: 'barn-wood',
      name: 'Madera de Granero',
      colors: ['#654321', '#8B6914', '#CD853F', '#DEB887', '#FAEBD7'],
      description: 'Rusticidad auténtica',
      season: ['otoño', 'invierno'],
    },
  ],

  bohemio: [
    {
      id: 'terracotta-sage',
      name: 'Terracota y Salvia',
      colors: ['#CC5500', '#E97451', '#8A9A5B', '#B2BEB5', '#F5E6D3'],
      description: 'Bohemio con alma',
      season: ['primavera', 'otoño'],
    },
    {
      id: 'desert-sunset',
      name: 'Atardecer del Desierto',
      colors: ['#FF6B35', '#F7931E', '#FDC830', '#F37735', '#FBF8BE'],
      description: 'Cálido y aventurero',
      season: ['verano', 'otoño'],
    },
    {
      id: 'boho-pastels',
      name: 'Pasteles Boho',
      colors: ['#E0BBE4', '#FFDFD3', '#FEC8D8', '#D4A5A5', '#FFFDD0'],
      description: 'Suavidad bohemia',
      season: ['primavera', 'verano'],
    },
  ],

  moderno: [
    {
      id: 'monochrome',
      name: 'Monocromático',
      colors: ['#000000', '#2C2C2C', '#5A5A5A', '#BEBEBE', '#FFFFFF'],
      description: 'Sofisticación minimalista',
      season: ['all'],
    },
    {
      id: 'bold-modern',
      name: 'Modernos Atrevidos',
      colors: ['#000000', '#FF6B6B', '#4ECDC4', '#FFD93D', '#FFFFFF'],
      description: 'Impacto visual contemporáneo',
      season: ['all'],
    },
    {
      id: 'metallics',
      name: 'Metálicos',
      colors: ['#B8860B', '#CD7F32', '#C0C0C0', '#E5E4E2', '#FFFFFF'],
      description: 'Brillo moderno',
      season: ['invierno', 'all'],
    },
  ],

  jardin: [
    {
      id: 'garden-romance',
      name: 'Romance de Jardín',
      colors: ['#FFB6C1', '#FFC0CB', '#DDA0DD', '#E6E6FA', '#F0FFF0'],
      description: 'Dulzura floral',
      season: ['primavera', 'verano'],
    },
    {
      id: 'lavender-green',
      name: 'Lavanda y Verde',
      colors: ['#967BB6', '#C8A2C8', '#90EE90', '#98FB98', '#F5FFFA'],
      description: 'Frescura primaveral',
      season: ['primavera'],
    },
    {
      id: 'botanical',
      name: 'Botánico',
      colors: ['#2E7D32', '#66BB6A', '#81C784', '#A5D6A7', '#F1F8E9'],
      description: 'Verde exuberante',
      season: ['primavera', 'verano'],
    },
  ],

  glamuroso: [
    {
      id: 'gold-burgundy',
      name: 'Oro y Borgoña',
      colors: ['#800020', '#8B0000', '#D4AF37', '#FFD700', '#FFFAF0'],
      description: 'Lujo dramático',
      season: ['otoño', 'invierno'],
    },
    {
      id: 'black-gold',
      name: 'Negro y Oro',
      colors: ['#000000', '#1C1C1C', '#D4AF37', '#FFD700', '#FFFFF0'],
      description: 'Glamour máximo',
      season: ['all'],
    },
    {
      id: 'jewel-tones',
      name: 'Tonos Joya',
      colors: ['#4B0082', '#0F52BA', '#50C878', '#E0115F', '#FFD700'],
      description: 'Riqueza de color',
      season: ['invierno', 'otoño'],
    },
  ],

  vintage: [
    {
      id: 'vintage-pastels',
      name: 'Pasteles Vintage',
      colors: ['#FFE5E5', '#FFDAB9', '#E6E6FA', '#B0E0E6', '#F0E68C'],
      description: 'Nostalgia suave',
      season: ['primavera', 'verano'],
    },
    {
      id: 'antique-rose',
      name: 'Rosa Antiguo',
      colors: ['#FADADD', '#FFB6C1', '#FFC0CB', '#E6E6FA', '#FFFAF0'],
      description: 'Romance atemporal',
      season: ['primavera', 'verano'],
    },
    {
      id: 'sepia-tones',
      name: 'Tonos Sepia',
      colors: ['#704214', '#8B7355', '#C8B299', '#E8DCC4', '#FFF8DC'],
      description: 'Elegancia de época',
      season: ['otoño', 'invierno'],
    },
  ],

  tropical: [
    {
      id: 'tropical-vibes',
      name: 'Vibras Tropicales',
      colors: ['#FF6B6B', '#FF8E53', '#FEA47F', '#1DD1A1', '#00D2FF'],
      description: 'Energía playera',
      season: ['verano'],
    },
    {
      id: 'coral-turquoise',
      name: 'Coral y Turquesa',
      colors: ['#FF7F50', '#FF6347', '#40E0D0', '#48D1CC', '#F0FFFF'],
      description: 'Frescura marina',
      season: ['verano'],
    },
    {
      id: 'sunset-paradise',
      name: 'Paraíso del Atardecer',
      colors: ['#FF6B35', '#F7931E', '#FDC830', '#FF6B9D', '#C9FFBF'],
      description: 'Calidez tropical',
      season: ['verano'],
    },
  ],

  campestre: [
    {
      id: 'meadow',
      name: 'Pradera',
      colors: ['#90EE90', '#98FB98', '#FFFFE0', '#FFF8DC', '#FFFACD'],
      description: 'Suavidad campestre',
      season: ['primavera', 'verano'],
    },
    {
      id: 'lavender-fields',
      name: 'Campos de Lavanda',
      colors: ['#967BB6', '#C8A2C8', '#E6E6FA', '#F0E68C', '#FFFACD'],
      description: 'Tranquilidad rural',
      season: ['primavera', 'verano'],
    },
    {
      id: 'farmhouse',
      name: 'Casa de Campo',
      colors: ['#8B4513', '#A0826D', '#D2B48C', '#F5DEB3', '#FFFFF0'],
      description: 'Acogedor y natural',
      season: ['otoño', 'invierno'],
    },
  ],

  industrial: [
    {
      id: 'urban-steel',
      name: 'Acero Urbano',
      colors: ['#2F4F4F', '#696969', '#A9A9A9', '#C0C0C0', '#F5F5F5'],
      description: 'Frialdad industrial',
      season: ['all'],
    },
    {
      id: 'brick-copper',
      name: 'Ladrillo y Cobre',
      colors: ['#8B4513', '#A0522D', '#B87333', '#CD853F', '#F5DEB3'],
      description: 'Calidez industrial',
      season: ['otoño', 'invierno'],
    },
    {
      id: 'concrete-green',
      name: 'Concreto y Verde',
      colors: ['#708090', '#778899', '#2E8B57', '#3CB371', '#F5F5F5'],
      description: 'Industrial con vida',
      season: ['primavera', 'verano'],
    },
  ],
};

export const SEASONAL_PALETTES = {
  primavera: [
    {
      id: 'spring-pastels',
      name: 'Pasteles Primaverales',
      colors: ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA'],
      description: 'Frescura de primavera',
    },
    {
      id: 'cherry-blossom',
      name: 'Flor de Cerezo',
      colors: ['#FFB7C5', '#FFC0CB', '#FFE4E1', '#FFF0F5', '#FFFAFA'],
      description: 'Delicadeza floral',
    },
  ],

  verano: [
    {
      id: 'summer-bright',
      name: 'Verano Brillante',
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#FDFD96'],
      description: 'Energía veraniega',
    },
    {
      id: 'seaside',
      name: 'Costa Marina',
      colors: ['#0077BE', '#40E0D0', '#87CEEB', '#F0F8FF', '#FFFAF0'],
      description: 'Frescura playera',
    },
  ],

  otoño: [
    {
      id: 'autumn-harvest',
      name: 'Cosecha de Otoño',
      colors: ['#D2691E', '#CD853F', '#DEB887', '#F4A460', '#FFDAB9'],
      description: 'Calidez otoñal',
    },
    {
      id: 'fall-foliage',
      name: 'Follaje Otoñal',
      colors: ['#8B4513', '#A0522D', '#CD853F', '#DAA520', '#FFD700'],
      description: 'Colores de hojas',
    },
  ],

  invierno: [
    {
      id: 'winter-wonderland',
      name: 'Maravilla Invernal',
      colors: ['#4682B4', '#5F9EA0', '#ADD8E6', '#E0FFFF', '#FFFAFA'],
      description: 'Elegancia helada',
    },
    {
      id: 'holiday-glam',
      name: 'Glamour Festivo',
      colors: ['#8B0000', '#006400', '#FFD700', '#FFFFF0', '#F8F8FF'],
      description: 'Lujo invernal',
    },
  ],
};

export const getPalettesByStyle = (styleId) => {
  return COLOR_PALETTES[styleId] || [];
};

export const getPalettesBySeason = (season) => {
  return SEASONAL_PALETTES[season] || [];
};

export const getAllPalettes = () => {
  const all = [];
  Object.entries(COLOR_PALETTES).forEach(([style, palettes]) => {
    palettes.forEach(palette => {
      all.push({ ...palette, style });
    });
  });
  return all;
};

export const getRecommendedPalettes = (styleId, season) => {
  const stylePalettes = getPalettesByStyle(styleId);
  
  if (!season) return stylePalettes;
  
  return stylePalettes.filter(palette => 
    palette.season.includes(season) || palette.season.includes('all')
  );
};

export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const getContrastColor = (hexColor) => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#000000';
  
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

export default {
  COLOR_PALETTES,
  SEASONAL_PALETTES,
  getPalettesByStyle,
  getPalettesBySeason,
  getAllPalettes,
  getRecommendedPalettes,
  hexToRgb,
  getContrastColor,
};
