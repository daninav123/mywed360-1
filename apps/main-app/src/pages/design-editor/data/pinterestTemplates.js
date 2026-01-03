/**
 * Templates Profesionales Estilo Pinterest
 * Inspirados en las referencias de invitaciones elegantes
 */

export const PINTEREST_TEMPLATES = [
  // TEMPLATE 0: Flores Colgantes Premium (como la referencia)
  {
    id: 'pinterest-hanging-flowers',
    name: '🌸 Flores Colgantes',
    category: 'invitation',
    style: 'floral-premium',
    thumbnail: '/templates/pinterest-hanging.svg',
    isPremium: true,
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFFFFF',
      objects: [
        // NOTA: Añade flores desde el panel "Florales" → Arrastra al canvas
        // Flores recomendadas: Eucalipto horizontal en la parte superior
        
        // "¡NOS CASAMOS!"
        {
          type: 'i-text',
          text: '¡NOS CASAMOS!',
          fontSize: 48,
          fontFamily: 'Lato',
          fill: '#4A4A4A',
          letterSpacing: 180,
          fontWeight: 'normal',
          top: 250,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Nombres en caligráfica grande
        {
          type: 'i-text',
          text: 'Juliana\ny\nCamilo',
          fontSize: 90,
          fontFamily: 'Allura',
          fill: '#4A4A4A',
          textAlign: 'center',
          lineHeight: 1.05,
          top: 460,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Texto superior de invitación
        {
          type: 'i-text',
          text: 'QUEREMOS COMPARTIR CONTIGO\nLA FELICIDAD DE NUESTRA UNIÓN',
          fontSize: 28,
          fontFamily: 'Lato',
          fill: '#4A4A4A',
          textAlign: 'center',
          letterSpacing: 80,
          lineHeight: 1.5,
          top: 640,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // === SECCIÓN 3 COLUMNAS ===
        
        // Columna 1: DÍA - Título
        {
          type: 'i-text',
          text: 'Día',
          fontSize: 50,
          fontFamily: 'Allura',
          fill: '#4A4A4A',
          top: 740,
          left: 200,
          originX: 'center',
          originY: 'center',
        },
        // Columna 1: DÍA - Info
        {
          type: 'i-text',
          text: '24 DE\nJUNIO',
          fontSize: 32,
          fontFamily: 'Lato',
          fill: '#4A4A4A',
          textAlign: 'center',
          letterSpacing: 40,
          lineHeight: 1.3,
          top: 795,
          left: 200,
          originX: 'center',
          originY: 'center',
        },
        
        // Columna 2: LUGAR - Título
        {
          type: 'i-text',
          text: 'Lugar',
          fontSize: 50,
          fontFamily: 'Allura',
          fill: '#4A4A4A',
          top: 740,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Columna 2: LUGAR - Info
        {
          type: 'i-text',
          text: 'CALLE CUALQUIERA 123,\nCUALQUIER LUGAR',
          fontSize: 28,
          fontFamily: 'Lato',
          fill: '#4A4A4A',
          textAlign: 'center',
          letterSpacing: 40,
          lineHeight: 1.4,
          top: 795,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Columna 3: HORA - Título
        {
          type: 'i-text',
          text: 'Hora',
          fontSize: 50,
          fontFamily: 'Allura',
          fill: '#4A4A4A',
          top: 740,
          left: 850,
          originX: 'center',
          originY: 'center',
        },
        // Columna 3: HORA - Info
        {
          type: 'i-text',
          text: '4:00\nP.M.',
          fontSize: 32,
          fontFamily: 'Lato',
          fill: '#4A4A4A',
          textAlign: 'center',
          letterSpacing: 40,
          lineHeight: 1.3,
          top: 795,
          left: 850,
          originX: 'center',
          originY: 'center',
        },
        
        // "Lluvia de sobres"
        {
          type: 'i-text',
          text: 'Lluvia de sobres',
          fontSize: 26,
          fontFamily: 'Allura',
          fill: '#4A4A4A',
          top: 920,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Confirmación asistencia
        {
          type: 'i-text',
          text: 'CONFIRMAR ASISTENCIA: (2) PERSONAS',
          fontSize: 9,
          fontFamily: 'Lato',
          fill: '#4A4A4A',
          textAlign: 'center',
          letterSpacing: 80,
          top: 1000,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // TEMPLATE 1: Minimalista Eucalipto
  {
    id: 'pinterest-eucalyptus-minimal',
    name: 'Eucalipto Minimalista',
    category: 'minimal',
    style: 'eucalyptus',
    thumbnail: '/templates/pinterest-eucalyptus.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFFFF0',
      objects: [
        // Nombres principales (Great Vibes)
        {
          type: 'i-text',
          text: 'Ana & Carlos',
          fontSize: 72,
          fontFamily: 'Great Vibes',
          fill: '#7D8F69',
          top: 650,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Fecha (Lato)
        {
          type: 'i-text',
          text: '15 DE JUNIO, 2025',
          fontSize: 16,
          fontFamily: 'Lato',
          fill: '#8B7355',
          letterSpacing: 200,
          top: 800,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Línea divisoria
        {
          type: 'rect',
          width: 200,
          height: 1,
          fill: '#C19A6B',
          top: 770,
          left: 425,
        },
        // Ubicación
        {
          type: 'i-text',
          text: 'Finca El Olivo',
          fontSize: 20,
          fontFamily: 'Cormorant',
          fill: '#8B7355',
          top: 850,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // TEMPLATE 2: Floral Romántico
  {
    id: 'pinterest-floral-romantic',
    name: 'Floral Romántico',
    category: 'floral',
    style: 'romantic',
    thumbnail: '/templates/pinterest-floral.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFF8F0',
      objects: [
        // Marco decorativo superior
        {
          type: 'rect',
          width: 600,
          height: 2,
          fill: '#D4AF37',
          top: 400,
          left: 225,
        },
        // Título pequeño
        {
          type: 'i-text',
          text: 'Nuestra Boda',
          fontSize: 24,
          fontFamily: 'Lato',
          fill: '#C19A6B',
          letterSpacing: 150,
          top: 450,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Nombres grandes
        {
          type: 'i-text',
          text: 'María & Juan',
          fontSize: 68,
          fontFamily: 'Playfair Display',
          fill: '#8B7355',
          fontWeight: 'bold',
          top: 600,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Fecha con estilo
        {
          type: 'i-text',
          text: '20 • 07 • 2025',
          fontSize: 32,
          fontFamily: 'Cormorant',
          fill: '#D4AF37',
          top: 720,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Ubicación
        {
          type: 'i-text',
          text: 'Hacienda Vista Hermosa',
          fontSize: 18,
          fontFamily: 'Lato',
          fill: '#7D8F69',
          top: 800,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Ciudad
        {
          type: 'i-text',
          text: 'Marbella, España',
          fontSize: 16,
          fontFamily: 'Lato',
          fill: '#A8B99C',
          top: 830,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Marco decorativo inferior
        {
          type: 'rect',
          width: 600,
          height: 2,
          fill: '#D4AF37',
          top: 900,
          left: 225,
        },
      ],
    },
  },

  // TEMPLATE 3: Script Elegante
  {
    id: 'pinterest-script-elegant',
    name: 'Script Elegante',
    category: 'elegant',
    style: 'script',
    thumbnail: '/templates/pinterest-script.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFFFFF',
      objects: [
        // Título decorativo
        {
          type: 'i-text',
          text: 'Te invitamos a celebrar',
          fontSize: 20,
          fontFamily: 'Lato',
          fill: '#C19A6B',
          top: 500,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Nombres en caligráfica
        {
          type: 'i-text',
          text: 'Laura & Diego',
          fontSize: 80,
          fontFamily: 'Allura',
          fill: '#8B7355',
          top: 650,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Línea separadora
        {
          type: 'rect',
          width: 150,
          height: 1,
          fill: '#D4AF37',
          top: 760,
          left: 450,
        },
        // Fecha
        {
          type: 'i-text',
          text: '28 de Agosto, 2025',
          fontSize: 28,
          fontFamily: 'Cormorant',
          fill: '#7D8F69',
          top: 800,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Hora
        {
          type: 'i-text',
          text: '18:00 horas',
          fontSize: 18,
          fontFamily: 'Lato',
          fill: '#A8B99C',
          top: 850,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Ubicación
        {
          type: 'i-text',
          text: 'Cortijo Los Almendros',
          fontSize: 22,
          fontFamily: 'Playfair Display',
          fill: '#8B7355',
          top: 920,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // TEMPLATE 4: Moderno Geométrico
  {
    id: 'pinterest-modern-geometric',
    name: 'Moderno Geométrico',
    category: 'modern',
    style: 'geometric',
    thumbnail: '/templates/pinterest-modern.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#F5F2ED',
      objects: [
        // Marco geométrico superior
        {
          type: 'rect',
          width: 400,
          height: 400,
          fill: 'transparent',
          stroke: '#D4AF37',
          strokeWidth: 2,
          top: 350,
          left: 325,
          angle: 45,
        },
        // Nombres
        {
          type: 'i-text',
          text: 'SOFÍA & MARCOS',
          fontSize: 42,
          fontFamily: 'Montserrat',
          fill: '#8B7355',
          fontWeight: 'bold',
          letterSpacing: 100,
          top: 600,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Línea
        {
          type: 'rect',
          width: 80,
          height: 2,
          fill: '#D4AF37',
          top: 670,
          left: 485,
        },
        // Fecha
        {
          type: 'i-text',
          text: '12.09.2025',
          fontSize: 32,
          fontFamily: 'Lato',
          fill: '#C19A6B',
          top: 710,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Ubicación
        {
          type: 'i-text',
          text: 'BARCELONA',
          fontSize: 16,
          fontFamily: 'Montserrat',
          fill: '#7D8F69',
          letterSpacing: 200,
          top: 780,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // TEMPLATE 5: Rústico Natural
  {
    id: 'pinterest-rustic-natural',
    name: 'Rústico Natural',
    category: 'rustic',
    style: 'natural',
    thumbnail: '/templates/pinterest-rustic.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#F7E7CE',
      objects: [
        // Título
        {
          type: 'i-text',
          text: 'Celebramos nuestro amor',
          fontSize: 18,
          fontFamily: 'Lato',
          fill: '#6B4423',
          top: 550,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Nombres en script
        {
          type: 'i-text',
          text: 'Emma & Lucas',
          fontSize: 76,
          fontFamily: 'Sacramento',
          fill: '#7D8F69',
          top: 680,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Fecha
        {
          type: 'i-text',
          text: 'Sábado, 5 de Julio del 2025',
          fontSize: 20,
          fontFamily: 'Cormorant',
          fill: '#8B7355',
          top: 820,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Ubicación
        {
          type: 'i-text',
          text: 'Masía Cal Reiet',
          fontSize: 24,
          fontFamily: 'Playfair Display',
          fill: '#6B4423',
          fontStyle: 'italic',
          top: 900,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Provincia
        {
          type: 'i-text',
          text: 'Tarragona',
          fontSize: 16,
          fontFamily: 'Lato',
          fill: '#A8B99C',
          top: 940,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // TEMPLATE 6: Vintage Clásico
  {
    id: 'pinterest-vintage-classic',
    name: 'Vintage Clásico',
    category: 'vintage',
    style: 'classic',
    thumbnail: '/templates/pinterest-vintage.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFFFF0',
      objects: [
        // Marco vintage
        {
          type: 'rect',
          width: 800,
          height: 1100,
          fill: 'transparent',
          stroke: '#8B7355',
          strokeWidth: 3,
          top: 200,
          left: 125,
        },
        // Marco interior
        {
          type: 'rect',
          width: 760,
          height: 1060,
          fill: 'transparent',
          stroke: '#D4AF37',
          strokeWidth: 1,
          top: 220,
          left: 145,
        },
        // Título pequeño
        {
          type: 'i-text',
          text: 'Se casan',
          fontSize: 20,
          fontFamily: 'Lato',
          fill: '#C19A6B',
          top: 500,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Nombres
        {
          type: 'i-text',
          text: 'Isabel & Fernando',
          fontSize: 62,
          fontFamily: 'Playfair Display',
          fill: '#8B7355',
          fontWeight: 'bold',
          top: 650,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Ampersand decorativo
        {
          type: 'i-text',
          text: '&',
          fontSize: 80,
          fontFamily: 'Great Vibes',
          fill: '#D4AF37',
          top: 750,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Fecha
        {
          type: 'i-text',
          text: 'Viernes, 25 de Octubre',
          fontSize: 22,
          fontFamily: 'Cormorant',
          fill: '#7D8F69',
          top: 880,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Año
        {
          type: 'i-text',
          text: '2025',
          fontSize: 32,
          fontFamily: 'Playfair Display',
          fill: '#C19A6B',
          top: 920,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Ubicación
        {
          type: 'i-text',
          text: 'Palacio de la Magdalena',
          fontSize: 18,
          fontFamily: 'Lato',
          fill: '#8B7355',
          top: 1000,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // TEMPLATE 7: Botánico Verde
  {
    id: 'pinterest-botanical-green',
    name: 'Botánico Verde',
    category: 'botanical',
    style: 'green',
    thumbnail: '/templates/pinterest-botanical.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#E8F0E3',
      objects: [
        // Título
        {
          type: 'i-text',
          text: 'JUNTOS PARA SIEMPRE',
          fontSize: 14,
          fontFamily: 'Lato',
          fill: '#5B7553',
          letterSpacing: 150,
          top: 520,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Nombres
        {
          type: 'i-text',
          text: 'Claudia & Javier',
          fontSize: 70,
          fontFamily: 'Dancing Script',
          fill: '#7D8F69',
          fontWeight: 'bold',
          top: 670,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Línea divisoria orgánica
        {
          type: 'rect',
          width: 300,
          height: 2,
          fill: '#A8B99C',
          top: 780,
          left: 375,
        },
        // Fecha
        {
          type: 'i-text',
          text: '16 DE MAYO DE 2025',
          fontSize: 18,
          fontFamily: 'Montserrat',
          fill: '#5B7553',
          letterSpacing: 100,
          top: 830,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Ubicación
        {
          type: 'i-text',
          text: 'Jardín Botánico El Edén',
          fontSize: 24,
          fontFamily: 'Cormorant',
          fill: '#7D8F69',
          fontStyle: 'italic',
          top: 900,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // TEMPLATE 8: Dorado Lujo
  {
    id: 'pinterest-gold-luxury',
    name: 'Dorado Lujo',
    category: 'luxury',
    style: 'gold',
    thumbnail: '/templates/pinterest-gold.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFFFFF',
      objects: [
        // Marco dorado superior
        {
          type: 'rect',
          width: 700,
          height: 3,
          fill: '#D4AF37',
          top: 450,
          left: 175,
        },
        // Nombres en caligráfica
        {
          type: 'i-text',
          text: 'Valentina & Alejandro',
          fontSize: 72,
          fontFamily: 'Pinyon Script',
          fill: '#8B7355',
          top: 650,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Texto decorativo
        {
          type: 'i-text',
          text: '~ Se casan ~',
          fontSize: 22,
          fontFamily: 'Cormorant',
          fill: '#D4AF37',
          fontStyle: 'italic',
          top: 780,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Fecha
        {
          type: 'i-text',
          text: 'SÁBADO 18 DE SEPTIEMBRE',
          fontSize: 16,
          fontFamily: 'Lato',
          fill: '#8B7355',
          letterSpacing: 150,
          top: 860,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Año grande
        {
          type: 'i-text',
          text: '2025',
          fontSize: 42,
          fontFamily: 'Playfair Display',
          fill: '#C19A6B',
          fontWeight: 'bold',
          top: 900,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Ubicación
        {
          type: 'i-text',
          text: 'Hotel Ritz Barcelona',
          fontSize: 20,
          fontFamily: 'Lato',
          fill: '#7D8F69',
          top: 980,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Marco dorado inferior
        {
          type: 'rect',
          width: 700,
          height: 3,
          fill: '#D4AF37',
          top: 1050,
          left: 175,
        },
      ],
    },
  },

  // TEMPLATE 9: Minimalista Moderno
  {
    id: 'pinterest-minimal-modern',
    name: 'Minimalista Moderno',
    category: 'minimal',
    style: 'modern',
    thumbnail: '/templates/pinterest-minimal.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FAFAFA',
      objects: [
        // Línea vertical izquierda
        {
          type: 'rect',
          width: 2,
          height: 600,
          fill: '#8B7355',
          top: 450,
          left: 300,
        },
        // Nombres alineados a izquierda
        {
          type: 'i-text',
          text: 'PAULA\n&\nANDRÉS',
          fontSize: 52,
          fontFamily: 'Montserrat',
          fill: '#8B7355',
          fontWeight: 'bold',
          lineHeight: 1.3,
          top: 550,
          left: 350,
        },
        // Fecha
        {
          type: 'i-text',
          text: '03 | 11 | 25',
          fontSize: 28,
          fontFamily: 'Lato',
          fill: '#C19A6B',
          top: 800,
          left: 350,
        },
        // Ubicación
        {
          type: 'i-text',
          text: 'VALENCIA',
          fontSize: 16,
          fontFamily: 'Montserrat',
          fill: '#A8B99C',
          letterSpacing: 200,
          top: 860,
          left: 350,
        },
      ],
    },
  },

  // TEMPLATE 10: Acuarela Romántica
  {
    id: 'pinterest-watercolor-romantic',
    name: 'Acuarela Romántica',
    category: 'watercolor',
    style: 'romantic',
    thumbnail: '/templates/pinterest-watercolor.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFE4E1',
      objects: [
        // Título delicado
        {
          type: 'i-text',
          text: 'Con alegría invitamos a',
          fontSize: 18,
          fontFamily: 'Lato',
          fill: '#B89B8F',
          top: 480,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Nombres en script
        {
          type: 'i-text',
          text: 'Natalia & Sebastián',
          fontSize: 74,
          fontFamily: 'Great Vibes',
          fill: '#8B7355',
          top: 630,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Texto romántico
        {
          type: 'i-text',
          text: 'a celebrar nuestra boda',
          fontSize: 20,
          fontFamily: 'Cormorant',
          fill: '#C19A6B',
          fontStyle: 'italic',
          top: 760,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Fecha
        {
          type: 'i-text',
          text: 'Domingo, 22 de Junio',
          fontSize: 24,
          fontFamily: 'Playfair Display',
          fill: '#7D8F69',
          top: 850,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Año
        {
          type: 'i-text',
          text: '2025',
          fontSize: 28,
          fontFamily: 'Lato',
          fill: '#D4AF37',
          top: 890,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        // Ubicación
        {
          type: 'i-text',
          text: 'Pazo de la Marquesa • Pontevedra',
          fontSize: 16,
          fontFamily: 'Lato',
          fill: '#A8B99C',
          top: 960,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },
];

// Función para procesar templates Pinterest con datos reales de la boda
export const processPinterestTemplate = (template, weddingData) => {
  if (!weddingData || !template?.canvas?.objects) {
    return template;
  }

  const processedTemplate = {
    ...template,
    canvas: {
      ...template.canvas,
      objects: template.canvas.objects.map(obj => {
        if (obj.type !== 'i-text') return obj;

        let newText = obj.text;
        const originalText = obj.text;

        // Detectar y reemplazar por tipo de contenido (no por valor exacto)
        
        // 1. NOMBRES DE PAREJA (detectar por &, \n&\n, \ny\n, o formato multi-línea con 2 nombres)
        if (newText.includes(' & ') || newText.includes('\n&\n') || newText.includes('\ny\n')) {
          // Si tiene formato multi-línea (Paula\n&\nAndrés o Juliana\ny\nCamilo)
          if (newText.includes('\n&\n') || newText.includes('\ny\n')) {
            const names = weddingData.coupleName.split('&').map(n => n.trim());
            if (names.length === 2) {
              // Mantener el formato de la plantilla original
              if (newText.includes('\ny\n')) {
                newText = `${names[0]}\ny\n${names[1]}`;
              } else {
                newText = `${names[0]}\n&\n${names[1]}`;
              }
            } else {
              newText = weddingData.coupleName;
            }
          } else {
            // Formato normal (Ana & Carlos)
            newText = weddingData.coupleName;
          }
        }
        // Detectar nombres en líneas separadas (sin & explícito)
        else if (newText.split('\n').length === 3 && newText.split('\n')[1].length <= 3) {
          // Formato: Nombre1\ny\nNombre2 o similar
          const names = weddingData.coupleName.split('&').map(n => n.trim());
          if (names.length === 2) {
            const separator = newText.split('\n')[1]; // Preservar el separador original
            newText = `${names[0]}\n${separator}\n${names[1]}`;
          }
        }
        
        // 2. FECHAS (varios formatos)
        else if (
          newText.match(/\d{1,2}\s+de\s+\w+,?\s*\d{4}/i) || // "15 de Junio, 2025"
          newText.match(/\d{1,2}\s+DE\s+\w+,?\s*\d{4}/) || // "15 DE JUNIO, 2025"
          newText.match(/\d{1,2}\s*[•·]\s*\d{1,2}\s*[•·]\s*\d{2,4}/) || // "20 • 07 • 2025"
          newText.match(/\d{1,2}\.\d{1,2}\.\d{2,4}/) || // "12.09.2025"
          newText.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/) || // "03-11-25" o "03/11/25"
          newText.match(/\w+,\s+\d{1,2}\s+de\s+\w+/i) // "Sábado, 5 de Julio"
        ) {
          newText = weddingData.formattedDate || weddingData.weddingDate || originalText;
        }
        
        // 3. AÑO solo (2025)
        else if (newText.match(/^202\d$/)) {
          newText = weddingData.year?.toString() || originalText;
        }
        
        // 4. HORA (18:00 horas)
        else if (newText.match(/\d{1,2}:\d{2}\s*horas?/i)) {
          newText = weddingData.schedule || originalText;
        }
        
        // 5. LUGARES/VENUES (palabras clave + nombre propio)
        else if (
          newText.match(/^(Finca|Hacienda|Cortijo|Masía|Palacio|Jardín|Hotel|Pazo|Bodega)\s+/i)
        ) {
          newText = weddingData.ceremonyPlace || weddingData.banquetPlace || originalText;
        }
        
        // 5b. DIRECCIONES de venue (CALLE X, LUGAR Y) - formato específico
        else if (
          newText.match(/CALLE\s+\w+\s+\d+,/i) || 
          newText.includes('CUALQUIERA') ||
          (newText.includes(',') && newText.includes('\n') && !newText.includes('&'))
        ) {
          const venue = weddingData.ceremonyPlace || '';
          const address = weddingData.ceremonyAddress || '';
          if (address) {
            // Formato en dos líneas
            newText = address.toUpperCase();
          } else if (venue) {
            newText = venue.toUpperCase();
          } else {
            newText = originalText;
          }
        }
        
        // 6. CIUDADES/PROVINCIAS (todo mayúsculas o nombres conocidos)
        else if (
          newText.match(/^[A-Z\s]+$/) && newText.length > 3 && newText.length < 30 ||
          newText.match(/Marbella|Barcelona|Tarragona|Valencia|Pontevedra|Madrid|Sevilla|Granada/i)
        ) {
          // Si es todo mayúsculas, mantener formato
          const city = weddingData.ceremonyAddress?.split(',').pop()?.trim() || '';
          newText = newText === newText.toUpperCase() && city ? city.toUpperCase() : (city || originalText);
        }
        
        // 7. DIRECCIONES completas (con coma)
        else if (newText.includes(',') && !newText.includes('&') && !newText.match(/\d{4}/)) {
          const venue = weddingData.ceremonyPlace || '';
          const city = weddingData.ceremonyAddress?.split(',').pop()?.trim() || '';
          if (venue && city) {
            newText = `${venue} • ${city}`;
          } else if (venue) {
            newText = venue;
          } else {
            newText = originalText;
          }
        }
        
        // 8. TEXTOS DECORATIVOS (mantener si no coinciden con ningún patrón)
        // "Nuestra Boda", "Se casan", "Te invitamos a celebrar", etc. - NO cambiar

        return {
          ...obj,
          text: newText,
        };
      }),
    },
  };

  return processedTemplate;
};

export default PINTEREST_TEMPLATES;
