/**
 * Plantillas Modernas con Elementos SVG Editables
 * Usan los 840 elementos florales vectoriales generados
 */

export const SVG_TEMPLATES = [
  // TEMPLATE 1: Jardín Romántico con Rosas
  {
    id: 'svg-garden-roses',
    name: '🌹 Jardín de Rosas',
    category: 'invitation',
    style: 'romantic',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFF8F5',
      objects: [
        // Rosas esquinas superiores
        {
          type: 'svg',
          url: '/assets/florals/rose-var1.svg',
          left: 80,
          top: 80,
          scaleX: 1.2,
          scaleY: 1.2,
        },
        {
          type: 'svg',
          url: '/assets/florals/rose-var2.svg',
          left: 970,
          top: 80,
          scaleX: 1.2,
          scaleY: 1.2,
          angle: -15,
        },
        
        // Marco geométrico hexagonal
        {
          type: 'svg',
          url: '/assets/florals/geometric-hexagon-1.svg',
          left: 525,
          top: 450,
          scaleX: 2.5,
          scaleY: 2.5,
        },
        
        // Texto: ¡Nos Casamos!
        {
          type: 'i-text',
          text: '¡NOS CASAMOS!',
          fontSize: 48,
          fontFamily: 'Lato',
          fill: '#8B6F5C',
          letterSpacing: 150,
          top: 280,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Nombres
        {
          type: 'i-text',
          text: 'Ana\n&\nCarlos',
          fontSize: 100,
          fontFamily: 'Allura',
          fill: '#6B4E3D',
          textAlign: 'center',
          lineHeight: 1.0,
          top: 450,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Divisor decorativo
        {
          type: 'svg',
          url: '/assets/florals/decorative-line-elegant-1.svg',
          left: 525,
          top: 650,
          scaleX: 1.5,
          scaleY: 1.5,
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '15 de Junio 2025',
          fontSize: 38,
          fontFamily: 'Lato',
          fill: '#8B6F5C',
          top: 720,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Rosas inferiores
        {
          type: 'svg',
          url: '/assets/florals/rose-var3.svg',
          left: 150,
          top: 1300,
          scaleX: 1.0,
          scaleY: 1.0,
        },
        {
          type: 'svg',
          url: '/assets/florals/rose-var4.svg',
          left: 900,
          top: 1300,
          scaleX: 1.0,
          scaleY: 1.0,
          angle: 15,
        },
      ],
    },
  },

  // TEMPLATE 2: Eucalipto Minimalista
  {
    id: 'svg-eucalyptus-minimal',
    name: '🌿 Eucalipto Elegante',
    category: 'invitation',
    style: 'minimalist',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FAFAF8',
      objects: [
        // Rama eucalipto superior izquierda
        {
          type: 'svg',
          url: '/assets/florals/eucalyptus-var1.svg',
          left: 60,
          top: 60,
          scaleX: 1.5,
          scaleY: 1.5,
        },
        
        // Rama eucalipto superior derecha
        {
          type: 'svg',
          url: '/assets/florals/eucalyptus-var2.svg',
          left: 990,
          top: 60,
          scaleX: 1.5,
          scaleY: 1.5,
          angle: -20,
        },
        
        // Marco circular
        {
          type: 'svg',
          url: '/assets/florals/geometric-circle-1.svg',
          left: 525,
          top: 742,
          scaleX: 3.0,
          scaleY: 3.0,
        },
        
        // Nombres
        {
          type: 'i-text',
          text: 'Laura\n&\nDavid',
          fontSize: 68,
          fontFamily: 'Cormorant',
          fill: '#3C5A4A',
          textAlign: 'center',
          lineHeight: 1.1,
          top: 600,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '20 de Julio 2025',
          fontSize: 18,
          fontFamily: 'Lato',
          fill: '#5A7C6A',
          top: 780,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Lugar
        {
          type: 'i-text',
          text: 'Jardín Botánico',
          fontSize: 20,
          fontFamily: 'Lato',
          fill: '#3C5A4A',
          fontWeight: '300',
          top: 850,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Eucalipto inferior
        {
          type: 'svg',
          url: '/assets/florals/eucalyptus-var3.svg',
          left: 525,
          top: 1350,
          scaleX: 1.2,
          scaleY: 1.2,
        },
      ],
    },
  },

  // TEMPLATE 3: Flores Provence Lavanda
  {
    id: 'svg-provence-lavender',
    name: '💜 Campos de Lavanda',
    category: 'invitation',
    style: 'provence',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#F5F0FA',
      objects: [
        // Lavanda esquinas
        {
          type: 'svg',
          url: '/assets/florals/provence-lavender-field-1.svg',
          left: 70,
          top: 70,
          scaleX: 1.3,
          scaleY: 1.3,
        },
        {
          type: 'svg',
          url: '/assets/florals/provence-lavender-field-2.svg',
          left: 980,
          top: 70,
          scaleX: 1.3,
          scaleY: 1.3,
          angle: -10,
        },
        
        // Marco diamante
        {
          type: 'svg',
          url: '/assets/florals/geometric-diamond-1.svg',
          left: 525,
          top: 500,
          scaleX: 2.8,
          scaleY: 2.8,
        },
        
        // Título
        {
          type: 'i-text',
          text: 'Celebra con Nosotros',
          fontSize: 16,
          fontFamily: 'Lato',
          fill: '#6B4E91',
          letterSpacing: 120,
          top: 320,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Nombres
        {
          type: 'i-text',
          text: 'María\n&\nJavier',
          fontSize: 66,
          fontFamily: 'Allura',
          fill: '#4A2E6B',
          textAlign: 'center',
          lineHeight: 1.05,
          top: 500,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Flores silvestres laterales
        {
          type: 'svg',
          url: '/assets/florals/provence-wildflower-mix-1.svg',
          left: 100,
          top: 600,
          scaleX: 0.9,
          scaleY: 0.9,
        },
        {
          type: 'svg',
          url: '/assets/florals/provence-wildflower-mix-2.svg',
          left: 950,
          top: 600,
          scaleX: 0.9,
          scaleY: 0.9,
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '3 de Agosto 2025',
          fontSize: 22,
          fontFamily: 'Lato',
          fill: '#6B4E91',
          top: 720,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Lavanda inferior
        {
          type: 'svg',
          url: '/assets/florals/provence-lavender-field-3.svg',
          left: 525,
          top: 1320,
          scaleX: 1.1,
          scaleY: 1.1,
        },
      ],
    },
  },

  // TEMPLATE 4: Tropical Vibrante
  {
    id: 'svg-tropical-vibrant',
    name: '🌺 Paraíso Tropical',
    category: 'invitation',
    style: 'tropical',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFF9F0',
      objects: [
        // Palmas esquinas
        {
          type: 'svg',
          url: '/assets/florals/palm-var1.svg',
          left: 50,
          top: 50,
          scaleX: 1.4,
          scaleY: 1.4,
        },
        {
          type: 'svg',
          url: '/assets/florals/palm-var2.svg',
          left: 1000,
          top: 50,
          scaleX: 1.4,
          scaleY: 1.4,
          angle: 20,
        },
        
        // Monstera hojas laterales
        {
          type: 'svg',
          url: '/assets/florals/monstera-var1.svg',
          left: 80,
          top: 400,
          scaleX: 1.1,
          scaleY: 1.1,
        },
        {
          type: 'svg',
          url: '/assets/florals/monstera-var2.svg',
          left: 970,
          top: 400,
          scaleX: 1.1,
          scaleY: 1.1,
          angle: -15,
        },
        
        // Título
        {
          type: 'i-text',
          text: '¡VAMOS A CASARNOS!',
          fontSize: 16,
          fontFamily: 'Lato',
          fill: '#D4682A',
          letterSpacing: 100,
          fontWeight: 'bold',
          top: 250,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Nombres
        {
          type: 'i-text',
          text: 'Sofia\n&\nMarco',
          fontSize: 76,
          fontFamily: 'Allura',
          fill: '#C44E2A',
          textAlign: 'center',
          lineHeight: 1.0,
          top: 550,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Flores tropicales
        {
          type: 'svg',
          url: '/assets/florals/hibiscus.svg',
          left: 200,
          top: 800,
          scaleX: 1.2,
          scaleY: 1.2,
        },
        {
          type: 'svg',
          url: '/assets/florals/sunflower-vibrant1.svg',
          left: 850,
          top: 800,
          scaleX: 1.0,
          scaleY: 1.0,
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '12 de Septiembre 2025',
          fontSize: 24,
          fontFamily: 'Lato',
          fill: '#D4682A',
          top: 950,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Lugar
        {
          type: 'i-text',
          text: 'Playa Paraíso',
          fontSize: 26,
          fontFamily: 'Lato',
          fill: '#C44E2A',
          fontWeight: '300',
          top: 1020,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // TEMPLATE 5: Geométrico Moderno
  {
    id: 'svg-geometric-modern',
    name: '⬡ Geométrico Dorado',
    category: 'invitation',
    style: 'modern',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFFFFF',
      objects: [
        // Marco hexagonal grande
        {
          type: 'svg',
          url: '/assets/florals/geometric-hexagon-2.svg',
          left: 525,
          top: 742,
          scaleX: 4.0,
          scaleY: 4.0,
        },
        
        // Marco hexagonal mediano interior
        {
          type: 'svg',
          url: '/assets/florals/geometric-hexagon-3.svg',
          left: 525,
          top: 742,
          scaleX: 2.5,
          scaleY: 2.5,
        },
        
        // Hojas minimalistas esquinas superiores
        {
          type: 'svg',
          url: '/assets/florals/eucalyptus-var4.svg',
          left: 140,
          top: 140,
          scaleX: 0.8,
          scaleY: 0.8,
        },
        {
          type: 'svg',
          url: '/assets/florals/eucalyptus-var5.svg',
          left: 910,
          top: 140,
          scaleX: 0.8,
          scaleY: 0.8,
          angle: -25,
        },
        
        // Nombres
        {
          type: 'i-text',
          text: 'Elena\n&\nPablo',
          fontSize: 70,
          fontFamily: 'Cormorant',
          fill: '#2C3E50',
          textAlign: 'center',
          lineHeight: 1.1,
          top: 600,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Divisor superior
        {
          type: 'svg',
          url: '/assets/florals/decorative-line-simple-1.svg',
          left: 525,
          top: 500,
          scaleX: 0.8,
          scaleY: 0.8,
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '25 de Mayo 2025',
          fontSize: 20,
          fontFamily: 'Lato',
          fill: '#C9A959',
          letterSpacing: 50,
          top: 820,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Divisor inferior
        {
          type: 'svg',
          url: '/assets/florals/decorative-line-simple-2.svg',
          left: 525,
          top: 920,
          scaleX: 0.8,
          scaleY: 0.8,
        },
        
        // Triangulos decorativos inferiores
        {
          type: 'svg',
          url: '/assets/florals/geometric-triangle-1.svg',
          left: 300,
          top: 1300,
          scaleX: 0.6,
          scaleY: 0.6,
        },
        {
          type: 'svg',
          url: '/assets/florals/geometric-triangle-2.svg',
          left: 750,
          top: 1300,
          scaleX: 0.6,
          scaleY: 0.6,
          angle: 180,
        },
      ],
    },
  },

  // TEMPLATE 6: Peonías Vintage
  {
    id: 'svg-vintage-peonies',
    name: '🌸 Peonías Vintage',
    category: 'invitation',
    style: 'vintage',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FDF8F3',
      objects: [
        // Peonías esquinas superiores
        {
          type: 'svg',
          url: '/assets/florals/peony-var1.svg',
          left: 90,
          top: 90,
          scaleX: 1.3,
          scaleY: 1.3,
        },
        {
          type: 'svg',
          url: '/assets/florals/peony-var2.svg',
          left: 960,
          top: 90,
          scaleX: 1.3,
          scaleY: 1.3,
          angle: -20,
        },
        
        // Marco decorativo vintage
        {
          type: 'svg',
          url: '/assets/florals/decorative-flourish-swirl-1.svg',
          left: 525,
          top: 350,
          scaleX: 2.0,
          scaleY: 2.0,
        },
        
        // Nombres
        {
          type: 'i-text',
          text: 'Isabella\n&\nSebastián',
          fontSize: 70,
          fontFamily: 'Allura',
          fill: '#8B6F5C',
          textAlign: 'center',
          lineHeight: 1.05,
          top: 500,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Divisor ornamental
        {
          type: 'svg',
          url: '/assets/florals/decorative-corner-elegant-1.svg',
          left: 525,
          top: 700,
          scaleX: 1.8,
          scaleY: 1.8,
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '18 de Octubre 2025',
          fontSize: 22,
          fontFamily: 'Lato',
          fill: '#8B6F5C',
          top: 800,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Peonías inferiores
        {
          type: 'svg',
          url: '/assets/florals/peony-var3.svg',
          left: 200,
          top: 1280,
          scaleX: 1.1,
          scaleY: 1.1,
        },
        {
          type: 'svg',
          url: '/assets/florals/peony-var4.svg',
          left: 850,
          top: 1280,
          scaleX: 1.1,
          scaleY: 1.1,
          angle: 15,
        },
      ],
    },
  },

  // TEMPLATE 7: Dahlia Colorida
  {
    id: 'svg-vibrant-dahlia',
    name: '🌼 Dahlia Vibrante',
    category: 'invitation',
    style: 'colorful',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFF5E6',
      objects: [
        // Dahlias laterales
        {
          type: 'svg',
          url: '/assets/florals/dahlia-var1.svg',
          left: 120,
          top: 300,
          scaleX: 1.2,
          scaleY: 1.2,
        },
        {
          type: 'svg',
          url: '/assets/florals/dahlia-var2.svg',
          left: 930,
          top: 300,
          scaleX: 1.2,
          scaleY: 1.2,
          angle: -25,
        },
        
        // Marco círculo doble
        {
          type: 'svg',
          url: '/assets/florals/geometric-circle-2.svg',
          left: 525,
          top: 600,
          scaleX: 3.5,
          scaleY: 3.5,
        },
        {
          type: 'svg',
          url: '/assets/florals/geometric-circle-3.svg',
          left: 525,
          top: 600,
          scaleX: 2.2,
          scaleY: 2.2,
        },
        
        // Título
        {
          type: 'i-text',
          text: 'NUESTRA BODA',
          fontSize: 14,
          fontFamily: 'Lato',
          fill: '#D97941',
          letterSpacing: 150,
          fontWeight: 'bold',
          top: 450,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Nombres
        {
          type: 'i-text',
          text: 'Valentina\n&\nDiego',
          fontSize: 68,
          fontFamily: 'Allura',
          fill: '#C44E2A',
          textAlign: 'center',
          lineHeight: 1.0,
          top: 600,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '5 de Noviembre 2025',
          fontSize: 20,
          fontFamily: 'Lato',
          fill: '#D97941',
          top: 750,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Dahlias inferiores
        {
          type: 'svg',
          url: '/assets/florals/dahlia-var3.svg',
          left: 180,
          top: 1200,
          scaleX: 1.0,
          scaleY: 1.0,
        },
        {
          type: 'svg',
          url: '/assets/florals/dahlia-var4.svg',
          left: 870,
          top: 1200,
          scaleX: 1.0,
          scaleY: 1.0,
        },
      ],
    },
  },

  // TEMPLATE 8: Olivo Mediterráneo
  {
    id: 'svg-mediterranean-olive',
    name: '🫒 Olivo Mediterráneo',
    category: 'invitation',
    style: 'mediterranean',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#F9F7F4',
      objects: [
        // Ramas de olivo superiores
        {
          type: 'svg',
          url: '/assets/florals/olive-var1.svg',
          left: 70,
          top: 100,
          scaleX: 1.6,
          scaleY: 1.6,
        },
        {
          type: 'svg',
          url: '/assets/florals/olive-var2.svg',
          left: 980,
          top: 100,
          scaleX: 1.6,
          scaleY: 1.6,
          angle: -30,
        },
        
        // Marco rectangular simple
        {
          type: 'svg',
          url: '/assets/florals/geometric-diamond-2.svg',
          left: 525,
          top: 550,
          scaleX: 3.0,
          scaleY: 3.5,
        },
        
        // Nombres
        {
          type: 'i-text',
          text: 'Claudia\n&\nAlejandro',
          fontSize: 72,
          fontFamily: 'Cormorant',
          fill: '#5A7C6A',
          textAlign: 'center',
          lineHeight: 1.1,
          top: 500,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Divisor simple
        {
          type: 'svg',
          url: '/assets/florals/decorative-line-dots-1.svg',
          left: 525,
          top: 680,
          scaleX: 1.2,
          scaleY: 1.2,
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '22 de Junio 2025',
          fontSize: 24,
          fontFamily: 'Lato',
          fill: '#5A7C6A',
          top: 760,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Olivo inferior central
        {
          type: 'svg',
          url: '/assets/florals/olive-var3.svg',
          left: 525,
          top: 1300,
          scaleX: 1.4,
          scaleY: 1.4,
        },
      ],
    },
  },

  // TEMPLATE 9: Wildflowers Bohemio
  {
    id: 'svg-bohemian-wildflowers',
    name: '🌾 Campo Bohemio',
    category: 'invitation',
    style: 'bohemian',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FEF9F3',
      objects: [
        // Flores silvestres laterales
        {
          type: 'svg',
          url: '/assets/florals/provence-wildflower-mix-3.svg',
          left: 80,
          top: 200,
          scaleX: 1.3,
          scaleY: 1.3,
        },
        {
          type: 'svg',
          url: '/assets/florals/provence-wildflower-mix-4.svg',
          left: 970,
          top: 200,
          scaleX: 1.3,
          scaleY: 1.3,
          angle: 20,
        },
        
        // Marco hexagonal
        {
          type: 'svg',
          url: '/assets/florals/geometric-hexagon-4.svg',
          left: 525,
          top: 650,
          scaleX: 2.8,
          scaleY: 2.8,
        },
        
        // Título
        {
          type: 'i-text',
          text: 'Celebremos Juntos',
          fontSize: 18,
          fontFamily: 'Lato',
          fill: '#8B7355',
          letterSpacing: 100,
          top: 450,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Nombres
        {
          type: 'i-text',
          text: 'Natalia\n&\nTomás',
          fontSize: 74,
          fontFamily: 'Allura',
          fill: '#6B5440',
          textAlign: 'center',
          lineHeight: 1.0,
          top: 650,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Trigo decorativo
        {
          type: 'svg',
          url: '/assets/florals/wheat-var1.svg',
          left: 250,
          top: 900,
          scaleX: 1.1,
          scaleY: 1.1,
        },
        {
          type: 'svg',
          url: '/assets/florals/wheat-var2.svg',
          left: 800,
          top: 900,
          scaleX: 1.1,
          scaleY: 1.1,
          angle: -10,
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '14 de Septiembre 2025',
          fontSize: 22,
          fontFamily: 'Lato',
          fill: '#8B7355',
          top: 1050,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // TEMPLATE 10: Iris Elegante
  {
    id: 'svg-elegant-iris',
    name: '🌺 Iris Elegante',
    category: 'invitation',
    style: 'elegant',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#F8F5FF',
      objects: [
        // Iris esquinas
        {
          type: 'svg',
          url: '/assets/florals/iris-var1.svg',
          left: 100,
          top: 120,
          scaleX: 1.2,
          scaleY: 1.2,
        },
        {
          type: 'svg',
          url: '/assets/florals/iris-var2.svg',
          left: 950,
          top: 120,
          scaleX: 1.2,
          scaleY: 1.2,
          angle: -15,
        },
        
        // Marco triple circular
        {
          type: 'svg',
          url: '/assets/florals/geometric-circle-4.svg',
          left: 525,
          top: 700,
          scaleX: 4.0,
          scaleY: 4.0,
        },
        {
          type: 'svg',
          url: '/assets/florals/geometric-circle-5.svg',
          left: 525,
          top: 700,
          scaleX: 2.8,
          scaleY: 2.8,
        },
        
        // Nombres
        {
          type: 'i-text',
          text: 'Gabriela\n&\nRafael',
          fontSize: 76,
          fontFamily: 'Cormorant',
          fill: '#6B5B95',
          textAlign: 'center',
          lineHeight: 1.05,
          top: 600,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Divisor elegante
        {
          type: 'svg',
          url: '/assets/florals/decorative-flourish-delicate-1.svg',
          left: 525,
          top: 800,
          scaleX: 1.5,
          scaleY: 1.5,
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '30 de Abril 2025',
          fontSize: 26,
          fontFamily: 'Lato',
          fill: '#6B5B95',
          fontWeight: '300',
          top: 900,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Iris inferiores
        {
          type: 'svg',
          url: '/assets/florals/iris-var3.svg',
          left: 220,
          top: 1250,
          scaleX: 1.0,
          scaleY: 1.0,
        },
        {
          type: 'svg',
          url: '/assets/florals/iris-var4.svg',
          left: 830,
          top: 1250,
          scaleX: 1.0,
          scaleY: 1.0,
          angle: 10,
        },
      ],
    },
  },
];

// Función para procesar con datos reales
export const processSvgTemplate = (template, weddingData) => {
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

        // Reemplazar nombres
        if (newText.includes('\n&\n')) {
          const names = weddingData.coupleName.split('&').map(n => n.trim());
          if (names.length === 2) {
            newText = `${names[0]}\n&\n${names[1]}`;
          } else {
            newText = weddingData.coupleName;
          }
        }
        
        // Reemplazar fechas
        else if (newText.match(/\d{1,2}\s+de\s+\w+\s+\d{4}/i)) {
          newText = weddingData.formattedDate || newText;
        }
        
        // Reemplazar lugares
        else if (newText.match(/(Jardín|Playa|Iglesia|Hacienda|Hotel)/i)) {
          newText = weddingData.ceremonyPlace || weddingData.banquetPlace || newText;
        }

        return {
          ...obj,
          text: newText,
        };
      }),
    },
  };

  return processedTemplate;
};

export default SVG_TEMPLATES;
