/**
 * PLANTILLAS DE LOGOS DE BODA
 * Diseños personalizables con iniciales y nombres de la pareja
 */

export const LOGO_TEMPLATES = [
  // LOGO 1: Monograma Clásico Circular
  {
    id: 'logo-monogram-circle',
    name: '⭕ Monograma Circular',
    category: 'logo',
    style: 'elegant',
    description: 'Iniciales dentro de círculo decorativo',
    thumbnail: '/templates/logo-monogram-circle.svg',
    canvas: {
      width: 500,
      height: 500,
      backgroundColor: 'transparent',
      objects: [
        // Círculo exterior
        {
          type: 'circle',
          left: 250,
          top: 250,
          radius: 200,
          fill: 'transparent',
          stroke: '#D4AF37',
          strokeWidth: 3,
          originX: 'center',
          originY: 'center',
        },
        
        // Círculo interior
        {
          type: 'circle',
          left: 250,
          top: 250,
          radius: 180,
          fill: 'transparent',
          stroke: '#D4AF37',
          strokeWidth: 1,
          originX: 'center',
          originY: 'center',
        },
        
        // Iniciales - Primera letra novia
        {
          type: 'i-text',
          text: 'M',
          fontSize: 100,
          fontFamily: 'Allura',
          fill: '#6B5B4B',
          left: 200,
          top: 250,
          originX: 'center',
          originY: 'center',
        },
        
        // &
        {
          type: 'i-text',
          text: '&',
          fontSize: 60,
          fontFamily: 'Allura',
          fill: '#D4AF37',
          left: 250,
          top: 250,
          originX: 'center',
          originY: 'center',
        },
        
        // Iniciales - Primera letra novio
        {
          type: 'i-text',
          text: 'J',
          fontSize: 100,
          fontFamily: 'Allura',
          fill: '#6B5B4B',
          left: 300,
          top: 250,
          originX: 'center',
          originY: 'center',
        },
        
        // Fecha abajo
        {
          type: 'i-text',
          text: '2025',
          fontSize: 24,
          fontFamily: 'Lato',
          fill: '#8B7355',
          letterSpacing: 100,
          left: 250,
          top: 400,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // LOGO 2: Nombres Entrelazados
  {
    id: 'logo-names-intertwined',
    name: '🔗 Nombres Entrelazados',
    category: 'logo',
    style: 'romantic',
    description: 'Nombres de la pareja en diseño caligráfico',
    thumbnail: '/templates/logo-names-intertwined.svg',
    canvas: {
      width: 600,
      height: 300,
      backgroundColor: 'transparent',
      objects: [
        // Nombre novia
        {
          type: 'i-text',
          text: 'María',
          fontSize: 80,
          fontFamily: 'Allura',
          fill: '#C77B85',
          left: 300,
          top: 100,
          originX: 'center',
          originY: 'center',
        },
        
        // Línea decorativa
        {
          type: 'rect',
          left: 200,
          top: 150,
          width: 200,
          height: 1,
          fill: '#E8A0A7',
        },
        
        // Nombre novio
        {
          type: 'i-text',
          text: 'Juan',
          fontSize: 80,
          fontFamily: 'Allura',
          fill: '#8B5A5F',
          left: 300,
          top: 200,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // LOGO 3: Iniciales Grandes
  {
    id: 'logo-initials-large',
    name: '📐 Iniciales Grandes',
    category: 'logo',
    style: 'modern',
    description: 'Iniciales en tipografía bold moderna',
    thumbnail: '/templates/logo-initials-large.svg',
    canvas: {
      width: 400,
      height: 400,
      backgroundColor: 'transparent',
      objects: [
        // Marco cuadrado
        {
          type: 'rect',
          left: 50,
          top: 50,
          width: 300,
          height: 300,
          fill: 'transparent',
          stroke: '#4A4A4A',
          strokeWidth: 2,
        },
        
        // Inicial combinada
        {
          type: 'i-text',
          text: 'M&J',
          fontSize: 120,
          fontFamily: 'Cormorant Garamond',
          fill: '#4A4A4A',
          fontWeight: 'bold',
          left: 200,
          top: 200,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // LOGO 4: Monograma con Corona
  {
    id: 'logo-monogram-crown',
    name: '👑 Monograma Real',
    category: 'logo',
    style: 'elegant',
    description: 'Iniciales con corona decorativa',
    thumbnail: '/templates/logo-monogram-crown.svg',
    canvas: {
      width: 400,
      height: 500,
      backgroundColor: 'transparent',
      objects: [
        // Corona simple (simulada con texto)
        {
          type: 'i-text',
          text: '♔',
          fontSize: 60,
          fontFamily: 'Arial',
          fill: '#D4AF37',
          left: 200,
          top: 80,
          originX: 'center',
          originY: 'center',
        },
        
        // Iniciales grandes
        {
          type: 'i-text',
          text: 'M & J',
          fontSize: 100,
          fontFamily: 'Cormorant Garamond',
          fill: '#6B5B4B',
          fontWeight: 'bold',
          left: 200,
          top: 250,
          originX: 'center',
          originY: 'center',
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '15.06.2025',
          fontSize: 28,
          fontFamily: 'Lato',
          fill: '#8B7355',
          letterSpacing: 40,
          left: 200,
          top: 380,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // LOGO 5: Corazón con Iniciales
  {
    id: 'logo-heart-initials',
    name: '❤️ Corazón Romántico',
    category: 'logo',
    style: 'romantic',
    description: 'Iniciales dentro de corazón',
    thumbnail: '/templates/logo-heart-initials.svg',
    canvas: {
      width: 500,
      height: 500,
      backgroundColor: 'transparent',
      objects: [
        // Corazón (simulado con texto emoji)
        {
          type: 'i-text',
          text: '♥',
          fontSize: 200,
          fontFamily: 'Arial',
          fill: '#E8A0A7',
          opacity: 0.3,
          left: 250,
          top: 250,
          originX: 'center',
          originY: 'center',
        },
        
        // Iniciales sobre el corazón
        {
          type: 'i-text',
          text: 'M♡J',
          fontSize: 80,
          fontFamily: 'Allura',
          fill: '#C77B85',
          left: 250,
          top: 250,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // LOGO 6: Hexágono Geométrico
  {
    id: 'logo-hexagon-geometric',
    name: '⬡ Hexágono Moderno',
    category: 'logo',
    style: 'modern',
    description: 'Diseño geométrico con iniciales',
    thumbnail: '/templates/logo-hexagon-geometric.svg',
    canvas: {
      width: 500,
      height: 500,
      backgroundColor: 'transparent',
      objects: [
        // Hexágono (simulado con rectángulo rotado)
        {
          type: 'rect',
          left: 250,
          top: 250,
          width: 250,
          height: 250,
          fill: 'transparent',
          stroke: '#B08D6F',
          strokeWidth: 3,
          angle: 45,
          originX: 'center',
          originY: 'center',
        },
        
        // Iniciales
        {
          type: 'i-text',
          text: 'M\n&\nJ',
          fontSize: 60,
          fontFamily: 'Lato',
          fill: '#4A4A4A',
          textAlign: 'center',
          lineHeight: 1.2,
          left: 250,
          top: 250,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // LOGO 7: Floral Frame
  {
    id: 'logo-floral-frame',
    name: '🌸 Marco Floral',
    category: 'logo',
    style: 'romantic',
    description: 'Iniciales con marco floral',
    thumbnail: '/templates/logo-floral-frame.svg',
    canvas: {
      width: 500,
      height: 500,
      backgroundColor: 'transparent',
      objects: [
        // Marco decorativo circular
        {
          type: 'circle',
          left: 250,
          top: 250,
          radius: 190,
          fill: 'transparent',
          stroke: '#E8C5A5',
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
        },
        
        // Flores esquinas (simuladas con emoji)
        {
          type: 'i-text',
          text: '🌸',
          fontSize: 40,
          left: 100,
          top: 100,
        },
        {
          type: 'i-text',
          text: '🌸',
          fontSize: 40,
          left: 360,
          top: 100,
        },
        {
          type: 'i-text',
          text: '🌸',
          fontSize: 40,
          left: 100,
          top: 360,
        },
        {
          type: 'i-text',
          text: '🌸',
          fontSize: 40,
          left: 360,
          top: 360,
        },
        
        // Iniciales centrales
        {
          type: 'i-text',
          text: 'M&J',
          fontSize: 90,
          fontFamily: 'Allura',
          fill: '#C77B85',
          left: 250,
          top: 250,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },
];

/**
 * Procesar plantilla de logo con datos de la boda
 */
export function processLogoTemplate(template, weddingData) {
  if (!weddingData) return template;
  
  const processedTemplate = JSON.parse(JSON.stringify(template));
  
  // Extraer iniciales
  const brideInitial = weddingData.bride?.[0]?.toUpperCase() || 'M';
  const groomInitial = weddingData.groom?.[0]?.toUpperCase() || 'J';
  
  // Formatear fecha para logo
  let logoDate = '2025';
  if (weddingData.weddingDate) {
    const date = new Date(weddingData.weddingDate);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      logoDate = `${day}.${month}.${year}`;
    }
  }
  
  // Reemplazos
  const replacements = {
    'M': brideInitial,
    'J': groomInitial,
    'M&J': `${brideInitial}&${groomInitial}`,
    'M♡J': `${brideInitial}♡${groomInitial}`,
    'M\n&\nJ': `${brideInitial}\n&\n${groomInitial}`,
    'María': weddingData.bride || 'María',
    'Juan': weddingData.groom || 'Juan',
    '2025': weddingData.year?.toString() || '2025',
    '15.06.2025': logoDate,
  };
  
  processedTemplate.canvas.objects = processedTemplate.canvas.objects.map(obj => {
    if (obj.text) {
      let newText = obj.text;
      Object.keys(replacements).forEach(key => {
        newText = newText.replace(new RegExp(key, 'g'), replacements[key]);
      });
      obj.text = newText;
    }
    return obj;
  });
  
  return processedTemplate;
}

export default LOGO_TEMPLATES;
