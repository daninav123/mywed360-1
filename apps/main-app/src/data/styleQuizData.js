/**
 * Style Quiz Data - Quiz visual para determinar estilo de boda
 * FASE 1.3 del WORKFLOW-USUARIO.md
 */

export const STYLE_QUIZ_QUESTIONS = [
  {
    id: 'ambiance',
    question: '¿Qué ambiente prefieres?',
    options: [
      { 
        id: 'formal', 
        label: 'Elegante y formal', 
        image: '🏛️',
        styles: ['clasico', 'glamuroso'],
        points: { clasico: 3, glamuroso: 2 }
      },
      { 
        id: 'relaxed', 
        label: 'Relajado y natural', 
        image: '🌿',
        styles: ['rustico', 'bohemio', 'campestre'],
        points: { rustico: 2, bohemio: 3, campestre: 2 }
      },
      { 
        id: 'modern', 
        label: 'Moderno y minimalista', 
        image: '🏙️',
        styles: ['moderno', 'industrial'],
        points: { moderno: 3, industrial: 2 }
      },
      { 
        id: 'romantic', 
        label: 'Romántico y tradicional', 
        image: '💕',
        styles: ['clasico', 'vintage', 'jardin'],
        points: { clasico: 2, vintage: 2, jardin: 3 }
      },
    ],
  },
  
  {
    id: 'venue',
    question: '¿Dónde te imaginas celebrándolo?',
    options: [
      { 
        id: 'palace', 
        label: 'Palacio o castillo', 
        image: '🏰',
        styles: ['clasico', 'glamuroso'],
        points: { clasico: 3, glamuroso: 2 }
      },
      { 
        id: 'barn', 
        label: 'Granero o finca rústica', 
        image: '🌾',
        styles: ['rustico', 'campestre'],
        points: { rustico: 3, campestre: 2 }
      },
      { 
        id: 'beach', 
        label: 'Playa o costa', 
        image: '🏖️',
        styles: ['bohemio', 'playero', 'tropical'],
        points: { bohemio: 3, playero: 3, tropical: 2 }
      },
      { 
        id: 'garden', 
        label: 'Jardín o bosque', 
        image: '🌳',
        styles: ['jardin', 'bohemio', 'campestre'],
        points: { jardin: 3, bohemio: 2, campestre: 2 }
      },
      { 
        id: 'loft', 
        label: 'Loft o espacio urbano', 
        image: '🏢',
        styles: ['moderno', 'industrial'],
        points: { moderno: 3, industrial: 3 }
      },
      { 
        id: 'vineyard', 
        label: 'Viñedo', 
        image: '🍇',
        styles: ['rustico', 'campestre', 'elegante-casual'],
        points: { rustico: 2, campestre: 3, 'elegante-casual': 2 }
      },
    ],
  },

  {
    id: 'decor',
    question: '¿Qué tipo de decoración te atrae?',
    options: [
      { 
        id: 'crystal', 
        label: 'Candelabros y cristal', 
        image: '💎',
        styles: ['clasico', 'glamuroso'],
        points: { clasico: 3, glamuroso: 3 }
      },
      { 
        id: 'wood', 
        label: 'Madera y elementos naturales', 
        image: '🪵',
        styles: ['rustico', 'campestre', 'bohemio'],
        points: { rustico: 3, campestre: 2, bohemio: 2 }
      },
      { 
        id: 'minimal', 
        label: 'Limpio y minimalista', 
        image: '⚪',
        styles: ['moderno', 'minimalista'],
        points: { moderno: 3, minimalista: 3 }
      },
      { 
        id: 'flowers', 
        label: 'Muchas flores', 
        image: '🌸',
        styles: ['jardin', 'romantico', 'vintage'],
        points: { jardin: 3, romantico: 2, vintage: 2 }
      },
      { 
        id: 'boho', 
        label: 'Macramé y textiles', 
        image: '🧶',
        styles: ['bohemio', 'etnico'],
        points: { bohemio: 3, etnico: 2 }
      },
    ],
  },

  {
    id: 'colors',
    question: '¿Qué paleta te gusta más?',
    options: [
      { 
        id: 'classic', 
        label: 'Blanco y dorado', 
        image: '🤍',
        styles: ['clasico', 'glamuroso'],
        points: { clasico: 3, glamuroso: 2 }
      },
      { 
        id: 'earth', 
        label: 'Tonos tierra y verde', 
        image: '🟤',
        styles: ['rustico', 'bohemio', 'campestre'],
        points: { rustico: 2, bohemio: 3, campestre: 2 }
      },
      { 
        id: 'monochrome', 
        label: 'Blanco y negro', 
        image: '⚫',
        styles: ['moderno', 'minimalista'],
        points: { moderno: 3, minimalista: 2 }
      },
      { 
        id: 'pastels', 
        label: 'Pasteles suaves', 
        image: '🌸',
        styles: ['romantico', 'vintage', 'jardin'],
        points: { romantico: 3, vintage: 2, jardin: 2 }
      },
      { 
        id: 'vibrant', 
        label: 'Colores vibrantes', 
        image: '🌈',
        styles: ['tropical', 'bohemio', 'etnico'],
        points: { tropical: 3, bohemio: 2, etnico: 2 }
      },
    ],
  },

  {
    id: 'flowers',
    question: '¿Qué tipo de flores prefieres?',
    options: [
      { 
        id: 'roses', 
        label: 'Rosas clásicas', 
        image: '🌹',
        styles: ['clasico', 'romantico'],
        points: { clasico: 2, romantico: 3 }
      },
      { 
        id: 'wildflowers', 
        label: 'Flores silvestres', 
        image: '🌼',
        styles: ['rustico', 'bohemio', 'campestre'],
        points: { rustico: 3, bohemio: 2, campestre: 3 }
      },
      { 
        id: 'tropical', 
        label: 'Tropicales exóticas', 
        image: '🌺',
        styles: ['tropical', 'bohemio'],
        points: { tropical: 3, bohemio: 2 }
      },
      { 
        id: 'minimal', 
        label: 'Arreglos minimalistas', 
        image: '🥀',
        styles: ['moderno', 'minimalista'],
        points: { moderno: 3, minimalista: 2 }
      },
      { 
        id: 'lush', 
        label: 'Arreglos frondosos', 
        image: '💐',
        styles: ['jardin', 'glamuroso'],
        points: { jardin: 3, glamuroso: 2 }
      },
    ],
  },

  {
    id: 'lighting',
    question: '¿Qué iluminación prefieres?',
    options: [
      { 
        id: 'chandeliers', 
        label: 'Arañas de luces', 
        image: '💡',
        styles: ['clasico', 'glamuroso'],
        points: { clasico: 3, glamuroso: 3 }
      },
      { 
        id: 'string', 
        label: 'Guirnaldas de luces', 
        image: '✨',
        styles: ['rustico', 'bohemio', 'jardin'],
        points: { rustico: 2, bohemio: 3, jardin: 2 }
      },
      { 
        id: 'candles', 
        label: 'Velas por todas partes', 
        image: '🕯️',
        styles: ['romantico', 'vintage', 'bohemio'],
        points: { romantico: 3, vintage: 2, bohemio: 2 }
      },
      { 
        id: 'spotlights', 
        label: 'Iluminación arquitectónica', 
        image: '💫',
        styles: ['moderno', 'industrial'],
        points: { moderno: 3, industrial: 2 }
      },
    ],
  },

  {
    id: 'details',
    question: '¿Qué detalles te gustan más?',
    options: [
      { 
        id: 'gold', 
        label: 'Detalles dorados', 
        image: '✨',
        styles: ['clasico', 'glamuroso'],
        points: { clasico: 2, glamuroso: 3 }
      },
      { 
        id: 'lace', 
        label: 'Encaje y puntillas', 
        image: '🎀',
        styles: ['vintage', 'romantico'],
        points: { vintage: 3, romantico: 2 }
      },
      { 
        id: 'burlap', 
        label: 'Arpillera y yute', 
        image: '🧺',
        styles: ['rustico', 'campestre'],
        points: { rustico: 3, campestre: 2 }
      },
      { 
        id: 'geometric', 
        label: 'Formas geométricas', 
        image: '📐',
        styles: ['moderno', 'minimalista'],
        points: { moderno: 3, minimalista: 2 }
      },
      { 
        id: 'macrame', 
        label: 'Macramé y tejidos', 
        image: '🧶',
        styles: ['bohemio', 'etnico'],
        points: { bohemio: 3, etnico: 2 }
      },
    ],
  },

  {
    id: 'vibe',
    question: '¿Cómo quieres que se sienta el día?',
    options: [
      { 
        id: 'elegant', 
        label: 'Elegante y sofisticado', 
        image: '👑',
        styles: ['clasico', 'glamuroso'],
        points: { clasico: 3, glamuroso: 3 }
      },
      { 
        id: 'relaxed', 
        label: 'Relajado y sin pretensiones', 
        image: '🌊',
        styles: ['bohemio', 'playero', 'campestre'],
        points: { bohemio: 3, playero: 2, campestre: 2 }
      },
      { 
        id: 'intimate', 
        label: 'Íntimo y acogedor', 
        image: '🏡',
        styles: ['rustico', 'jardin', 'vintage'],
        points: { rustico: 2, jardin: 2, vintage: 3 }
      },
      { 
        id: 'chic', 
        label: 'Chic y contemporáneo', 
        image: '🎨',
        styles: ['moderno', 'industrial'],
        points: { moderno: 3, industrial: 2 }
      },
      { 
        id: 'joyful', 
        label: 'Alegre y festivo', 
        image: '🎉',
        styles: ['tropical', 'etnico', 'jardin'],
        points: { tropical: 2, etnico: 2, jardin: 3 }
      },
    ],
  },

  {
    id: 'dress',
    question: '¿Qué estilo de vestido imaginas?',
    options: [
      { 
        id: 'ball-gown', 
        label: 'Princesa clásica', 
        image: '👗',
        styles: ['clasico', 'glamuroso'],
        points: { clasico: 3, glamuroso: 2 }
      },
      { 
        id: 'boho', 
        label: 'Boho fluido', 
        image: '🌸',
        styles: ['bohemio', 'hippie'],
        points: { bohemio: 3, hippie: 2 }
      },
      { 
        id: 'simple', 
        label: 'Líneas simples', 
        image: '⚪',
        styles: ['moderno', 'minimalista'],
        points: { moderno: 3, minimalista: 3 }
      },
      { 
        id: 'vintage', 
        label: 'Vintage o retro', 
        image: '🎭',
        styles: ['vintage', 'art-deco'],
        points: { vintage: 3, 'art-deco': 2 }
      },
      { 
        id: 'romantic', 
        label: 'Romántico con encaje', 
        image: '💝',
        styles: ['romantico', 'jardin'],
        points: { romantico: 3, jardin: 2 }
      },
    ],
  },

  {
    id: 'food',
    question: '¿Qué tipo de comida prefieres?',
    options: [
      { 
        id: 'formal-dinner', 
        label: 'Cena formal sentados', 
        image: '🍽️',
        styles: ['clasico', 'glamuroso'],
        points: { clasico: 3, glamuroso: 2 }
      },
      { 
        id: 'bbq', 
        label: 'BBQ o comida casual', 
        image: '🍖',
        styles: ['rustico', 'campestre'],
        points: { rustico: 3, campestre: 3 }
      },
      { 
        id: 'food-trucks', 
        label: 'Food trucks', 
        image: '🚚',
        styles: ['moderno', 'industrial', 'urbano'],
        points: { moderno: 2, industrial: 3, urbano: 2 }
      },
      { 
        id: 'buffet', 
        label: 'Buffet variado', 
        image: '🥗',
        styles: ['bohemio', 'eclectic'],
        points: { bohemio: 2, eclectic: 2 }
      },
    ],
  },
];

export const STYLE_PROFILES = {
  clasico: {
    name: 'Clásico Elegante',
    description: 'Tradicional, sofisticado y atemporal',
    keywords: ['elegante', 'formal', 'tradicional', 'atemporal'],
    venues: ['Hotel elegante', 'Palacio', 'Salón de banquetes'],
    colors: ['Blanco', 'Marfil', 'Dorado', 'Plata', 'Champagne'],
    flowers: ['Rosas', 'Peonías', 'Orquídeas', 'Lirios'],
    decor: ['Candelabros', 'Manteles de lino', 'Vajilla fina', 'Cristalería'],
  },
  
  rustico: {
    name: 'Rústico Campestre',
    description: 'Natural, acogedor y con encanto rural',
    keywords: ['natural', 'campestre', 'acogedor', 'informal'],
    venues: ['Granero', 'Finca rústica', 'Masía', 'Viñedo'],
    colors: ['Tierra', 'Verde', 'Blanco roto', 'Marrón'],
    flowers: ['Flores silvestres', 'Girasoles', 'Lavanda', 'Ramas'],
    decor: ['Madera', 'Arpillera', 'Mason jars', 'Guirnaldas de luces'],
  },

  bohemio: {
    name: 'Bohemio Libre',
    description: 'Relajado, artístico y sin pretensiones',
    keywords: ['libre', 'artístico', 'relajado', 'creativo'],
    venues: ['Playa', 'Jardín', 'Bosque', 'Espacio abierto'],
    colors: ['Terracota', 'Mostaza', 'Verde salvia', 'Rosa suave'],
    flowers: ['Flores mixtas', 'Pampas', 'Proteas', 'Eucalipto'],
    decor: ['Macramé', 'Alfombras', 'Cojines', 'Dreamcatchers'],
  },

  moderno: {
    name: 'Moderno Minimalista',
    description: 'Contemporáneo, limpio y chic',
    keywords: ['contemporáneo', 'minimalista', 'chic', 'urbano'],
    venues: ['Loft', 'Galería de arte', 'Azotea', 'Espacio industrial'],
    colors: ['Blanco y negro', 'Gris', 'Metálicos', 'Colores bold'],
    flowers: ['Arreglos arquitectónicos', 'Monobotánicos', 'Suculentas'],
    decor: ['Líneas limpias', 'Acrílico', 'Neón', 'Geometría'],
  },

  jardin: {
    name: 'Jardín Romántico',
    description: 'Floral, fresco y encantador',
    keywords: ['floral', 'fresco', 'romántico', 'natural'],
    venues: ['Jardín botánico', 'Invernadero', 'Patio', 'Terraza'],
    colors: ['Verde', 'Rosa', 'Lavanda', 'Blanco'],
    flowers: ['Rosas de jardín', 'Hortensias', 'Ranúnculos', 'Lilas'],
    decor: ['Arcos florales', 'Pérgolas', 'Jardines verticales'],
  },

  glamuroso: {
    name: 'Glamuroso Lujoso',
    description: 'Opulento, brillante y espectacular',
    keywords: ['lujoso', 'glamuroso', 'opulento', 'brillante'],
    venues: ['Hotel de lujo', 'Palacio', 'Mansión', 'Salón elegante'],
    colors: ['Dorado', 'Plata', 'Negro', 'Blanco puro', 'Borgoña'],
    flowers: ['Orquídeas', 'Rosas premium', 'Callas', 'Amarilis'],
    decor: ['Cristal', 'Terciopelo', 'Lentejuelas', 'Iluminación dramática'],
  },

  vintage: {
    name: 'Vintage Retro',
    description: 'Nostálgico, encantador y con historia',
    keywords: ['nostálgico', 'retro', 'antiguo', 'encantador'],
    venues: ['Hacienda antigua', 'Mansión', 'Salón histórico'],
    colors: ['Sepia', 'Marfil', 'Durazno', 'Menta', 'Azul pálido'],
    flowers: ['Rosas antiguas', 'Peonías', 'Dalias', 'Hortensias'],
    decor: ['Encaje', 'Vajilla vintage', 'Libros antiguos', 'Maletas'],
  },

  tropical: {
    name: 'Tropical Exótico',
    description: 'Vibrante, exótico y festivo',
    keywords: ['vibrante', 'exótico', 'tropical', 'colorido'],
    venues: ['Resort', 'Playa', 'Jardín tropical', 'Villa'],
    colors: ['Coral', 'Turquesa', 'Verde lima', 'Fucsia', 'Amarillo'],
    flowers: ['Orquídeas tropicales', 'Hibisco', 'Ave del paraíso', 'Anturios'],
    decor: ['Hojas de palma', 'Piñas', 'Frutas tropicales', 'Tiki'],
  },

  campestre: {
    name: 'Campestre Bucólico',
    description: 'Pastoral, tranquilo y natural',
    keywords: ['pastoral', 'tranquilo', 'bucólico', 'campo'],
    venues: ['Granja', 'Prado', 'Hacienda', 'Bodega'],
    colors: ['Verde', 'Crema', 'Lavanda', 'Amarillo suave'],
    flowers: ['Lavanda', 'Margaritas', 'Tulipanes', 'Flores de campo'],
    decor: ['Madera clara', 'Lino', 'Cestas', 'Carretillas'],
  },

  industrial: {
    name: 'Industrial Urbano',
    description: 'Urbano, moderno y con carácter',
    keywords: ['urbano', 'industrial', 'moderno', 'edgy'],
    venues: ['Warehouse', 'Fábrica', 'Loft', 'Espacio industrial'],
    colors: ['Gris', 'Negro', 'Cobre', 'Blanco', 'Ladrillo'],
    flowers: ['Arreglos modernos', 'Verdes', 'Secos', 'Minimalistas'],
    decor: ['Metal', 'Ladrillo expuesto', 'Edison bulbs', 'Acero'],
  },
};

export const calculateStyleScore = (answers) => {
  const scores = {};
  
  answers.forEach((answer) => {
    const question = STYLE_QUIZ_QUESTIONS.find(q => q.id === answer.questionId);
    const option = question?.options.find(o => o.id === answer.optionId);
    
    if (option && option.points) {
      Object.entries(option.points).forEach(([style, points]) => {
        scores[style] = (scores[style] || 0) + points;
      });
    }
  });

  const sortedStyles = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([style, score]) => ({ style, score }));

  return sortedStyles;
};

export const getTopStyles = (answers, count = 3) => {
  const scores = calculateStyleScore(answers);
  return scores.slice(0, count).map(({ style }) => ({
    id: style,
    ...STYLE_PROFILES[style],
  }));
};

export default {
  STYLE_QUIZ_QUESTIONS,
  STYLE_PROFILES,
  calculateStyleScore,
  getTopStyles,
};
