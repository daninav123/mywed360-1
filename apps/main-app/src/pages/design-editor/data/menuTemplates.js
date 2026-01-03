/**
 * PLANTILLAS PROFESIONALES DE MENÚS
 */

export const MENU_TEMPLATES = [
  // MENÚ 1: Elegante Clásico
  {
    id: 'menu-elegant-classic',
    name: '🍽️ Menú Elegante',
    category: 'menu',
    style: 'elegant',
    description: 'Menú clásico con tipografía serif',
    thumbnail: '/templates/menu-elegant.jpg',
    canvas: {
      width: 1485,
      height: 2100,
      backgroundColor: '#FFFFFF',
      objects: [
        // Título principal
        {
          type: 'i-text',
          text: 'MENÚ',
          fontSize: 80,
          fontFamily: 'Playfair Display',
          fill: '#6B5B4B',
          fontWeight: 'bold',
          left: 742,
          top: 150,
          originX: 'center',
          originY: 'top',
        },
        
        // Nombres de la pareja
        {
          type: 'i-text',
          text: 'María & Juan',
          fontSize: 48,
          fontFamily: 'Allura',
          fill: '#D4AF37',
          left: 742,
          top: 260,
          originX: 'center',
          originY: 'top',
        },
        
        // Línea decorativa
        {
          type: 'rect',
          left: 542,
          top: 350,
          width: 400,
          height: 2,
          fill: '#D4AF37',
        },
        
        // ENTRANTES
        {
          type: 'i-text',
          text: 'ENTRANTES',
          fontSize: 36,
          fontFamily: 'Cormorant Garamond',
          fill: '#6B5B4B',
          fontWeight: 'bold',
          left: 200,
          top: 450,
        },
        {
          type: 'i-text',
          text: '~ Ensalada de rúcula con queso de cabra ~\n~ Carpaccio de ternera con parmesano ~',
          fontSize: 24,
          fontFamily: 'Lato',
          fill: '#8B7355',
          left: 200,
          top: 510,
          lineHeight: 1.6,
        },
        
        // PRINCIPAL
        {
          type: 'i-text',
          text: 'PLATO PRINCIPAL',
          fontSize: 36,
          fontFamily: 'Cormorant Garamond',
          fill: '#6B5B4B',
          fontWeight: 'bold',
          left: 200,
          top: 700,
        },
        {
          type: 'i-text',
          text: '~ Solomillo de ternera con salsa de vino tinto ~\n~ Lubina al horno con verduras mediterráneas ~',
          fontSize: 24,
          fontFamily: 'Lato',
          fill: '#8B7355',
          left: 200,
          top: 760,
          lineHeight: 1.6,
        },
        
        // POSTRE
        {
          type: 'i-text',
          text: 'POSTRE',
          fontSize: 36,
          fontFamily: 'Cormorant Garamond',
          fill: '#6B5B4B',
          fontWeight: 'bold',
          left: 200,
          top: 950,
        },
        {
          type: 'i-text',
          text: '~ Tarta nupcial ~\n~ Mousse de chocolate ~',
          fontSize: 24,
          fontFamily: 'Lato',
          fill: '#8B7355',
          left: 200,
          top: 1010,
          lineHeight: 1.6,
        },
        
        // Nota al pie
        {
          type: 'i-text',
          text: 'Vinos seleccionados y bebidas incluidas',
          fontSize: 20,
          fontFamily: 'Lato',
          fill: '#A89584',
          fontStyle: 'italic',
          left: 742,
          top: 1900,
          originX: 'center',
        },
      ],
    },
  },

  // MENÚ 2: Moderno Minimalista
  {
    id: 'menu-modern-minimal',
    name: '✨ Menú Moderno',
    category: 'menu',
    style: 'modern',
    description: 'Diseño minimalista con líneas limpias',
    thumbnail: '/templates/menu-modern.jpg',
    canvas: {
      width: 1485,
      height: 2100,
      backgroundColor: '#F8F8F8',
      objects: [
        // Barra lateral
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 15,
          height: 2100,
          fill: '#000000',
        },
        
        // Título
        {
          type: 'i-text',
          text: 'MENÚ',
          fontSize: 120,
          fontFamily: 'Montserrat',
          fill: '#000000',
          fontWeight: 'bold',
          left: 100,
          top: 100,
          letterSpacing: 200,
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '15 • JUNIO • 2025',
          fontSize: 24,
          fontFamily: 'Lato',
          fill: '#666666',
          left: 100,
          top: 250,
          letterSpacing: 80,
        },
        
        // Contenido
        {
          type: 'i-text',
          text: 'ENTRANTES\n\nEnsalada César\nCarpaccio de salmón\n\n\nPRINCIPAL\n\nFilete de res\nBacalao confitado\n\n\nPOSTRE\n\nTarta nupcial\nPannacotta de vainilla',
          fontSize: 28,
          fontFamily: 'Raleway',
          fill: '#333333',
          left: 100,
          top: 400,
          lineHeight: 1.8,
        },
      ],
    },
  },

  // MENÚ 3: Rústico Campestre
  {
    id: 'menu-rustic-countryside',
    name: '🌾 Menú Rústico',
    category: 'menu',
    style: 'rustic',
    description: 'Estilo campestre con toques naturales',
    thumbnail: '/templates/menu-rustic.jpg',
    canvas: {
      width: 1485,
      height: 2100,
      backgroundColor: '#FFF8F0',
      objects: [
        // Marco rústico
        {
          type: 'rect',
          left: 100,
          top: 100,
          width: 1285,
          height: 1900,
          fill: 'transparent',
          stroke: '#8B6F47',
          strokeWidth: 3,
        },
        
        // Título
        {
          type: 'i-text',
          text: 'MENÚ',
          fontSize: 90,
          fontFamily: 'Abril Fatface',
          fill: '#5D4E37',
          left: 742,
          top: 200,
          originX: 'center',
        },
        
        // Ornamento
        {
          type: 'i-text',
          text: '🌿',
          fontSize: 60,
          left: 712,
          top: 320,
        },
        
        // Secciones
        {
          type: 'i-text',
          text: 'Para empezar',
          fontSize: 40,
          fontFamily: 'Dancing Script',
          fill: '#8B6F47',
          left: 742,
          top: 450,
          originX: 'center',
        },
        {
          type: 'i-text',
          text: 'Tabla de quesos artesanales\nVerduras asadas del huerto',
          fontSize: 26,
          fontFamily: 'Quicksand',
          fill: '#5D4E37',
          left: 742,
          top: 520,
          originX: 'center',
          textAlign: 'center',
          lineHeight: 1.6,
        },
        
        {
          type: 'i-text',
          text: 'Plato fuerte',
          fontSize: 40,
          fontFamily: 'Dancing Script',
          fill: '#8B6F47',
          left: 742,
          top: 720,
          originX: 'center',
        },
        {
          type: 'i-text',
          text: 'Cordero asado con hierbas\nPaella de mariscos',
          fontSize: 26,
          fontFamily: 'Quicksand',
          fill: '#5D4E37',
          left: 742,
          top: 790,
          originX: 'center',
          textAlign: 'center',
          lineHeight: 1.6,
        },
        
        {
          type: 'i-text',
          text: 'Dulce final',
          fontSize: 40,
          fontFamily: 'Dancing Script',
          fill: '#8B6F47',
          left: 742,
          top: 990,
          originX: 'center',
        },
        {
          type: 'i-text',
          text: 'Tarta de frutas del bosque\nHelado casero',
          fontSize: 26,
          fontFamily: 'Quicksand',
          fill: '#5D4E37',
          left: 742,
          top: 1060,
          originX: 'center',
          textAlign: 'center',
          lineHeight: 1.6,
        },
        
        // Pie
        {
          type: 'i-text',
          text: 'Con cariño, [Nombres]',
          fontSize: 28,
          fontFamily: 'Dancing Script',
          fill: '#8B6F47',
          left: 742,
          top: 1800,
          originX: 'center',
        },
      ],
    },
  },
];

/**
 * Procesar plantilla de menú con datos de la boda
 */
export function processMenuTemplate(template, weddingData) {
  if (!weddingData) return template;
  
  const processedTemplate = JSON.parse(JSON.stringify(template));
  
  const replacements = {
    'María & Juan': weddingData.coupleName || 'María & Juan',
    '[Nombres]': weddingData.coupleName || '[Nombres]',
    '15 • JUNIO • 2025': weddingData.formattedDate?.replace(/ de /g, ' • ').toUpperCase() || '15 • JUNIO • 2025',
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

export default MENU_TEMPLATES;
