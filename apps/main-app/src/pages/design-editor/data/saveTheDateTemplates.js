/**
 * PLANTILLAS PROFESIONALES DE SAVE THE DATE
 */

export const SAVE_THE_DATE_TEMPLATES = [
  // SAVE THE DATE 1: Postal Romántica
  {
    id: 'std-romantic-postcard',
    name: '💌 Postal Romántica',
    category: 'savethedate',
    style: 'romantic',
    description: 'Diseño postal con corazones',
    thumbnail: '/templates/std-romantic.jpg',
    canvas: {
      width: 744,
      height: 1050,
      backgroundColor: '#FFE4E1',
      objects: [
        // Corazón decorativo
        {
          type: 'i-text',
          text: '♥',
          fontSize: 120,
          fontFamily: 'Arial',
          fill: '#FFB6C1',
          opacity: 0.3,
          left: 372,
          top: 150,
          originX: 'center',
          originY: 'center',
        },
        
        // Texto principal
        {
          type: 'i-text',
          text: 'Save the Date',
          fontSize: 52,
          fontFamily: 'Allura',
          fill: '#C77B85',
          left: 372,
          top: 80,
          originX: 'center',
        },
        
        // Nombres
        {
          type: 'i-text',
          text: 'María & Juan',
          fontSize: 72,
          fontFamily: 'Great Vibes',
          fill: '#8B5A5F',
          left: 372,
          top: 350,
          originX: 'center',
          originY: 'center',
        },
        
        // Fecha grande
        {
          type: 'i-text',
          text: '15',
          fontSize: 140,
          fontFamily: 'Playfair Display',
          fill: '#C77B85',
          fontWeight: 'bold',
          left: 372,
          top: 480,
          originX: 'center',
          originY: 'center',
        },
        
        // Mes y año
        {
          type: 'i-text',
          text: 'JUNIO • 2025',
          fontSize: 32,
          fontFamily: 'Montserrat',
          fill: '#8B5A5F',
          letterSpacing: 100,
          left: 372,
          top: 620,
          originX: 'center',
        },
        
        // Ubicación
        {
          type: 'i-text',
          text: '📍 Barcelona, España',
          fontSize: 24,
          fontFamily: 'Lato',
          fill: '#A89584',
          left: 372,
          top: 720,
          originX: 'center',
        },
        
        // Invitación formal
        {
          type: 'i-text',
          text: 'Invitación formal a seguir',
          fontSize: 18,
          fontFamily: 'Lato',
          fill: '#A89584',
          fontStyle: 'italic',
          left: 372,
          top: 900,
          originX: 'center',
        },
      ],
    },
  },

  // SAVE THE DATE 2: Minimalista Moderno
  {
    id: 'std-minimal-modern',
    name: '✨ Minimalista',
    category: 'savethedate',
    style: 'modern',
    description: 'Diseño limpio y moderno',
    thumbnail: '/templates/std-minimal.jpg',
    canvas: {
      width: 744,
      height: 1050,
      backgroundColor: '#FFFFFF',
      objects: [
        // Borde superior
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 744,
          height: 10,
          fill: '#000000',
        },
        
        // SAVE THE DATE vertical
        {
          type: 'i-text',
          text: 'S\nA\nV\nE\n\nT\nH\nE\n\nD\nA\nT\nE',
          fontSize: 28,
          fontFamily: 'Montserrat',
          fill: '#CCCCCC',
          fontWeight: 'bold',
          letterSpacing: 20,
          left: 50,
          top: 150,
          lineHeight: 1.2,
        },
        
        // Nombres grandes
        {
          type: 'i-text',
          text: 'MARÍA\n&\nJUAN',
          fontSize: 62,
          fontFamily: 'Cinzel',
          fill: '#000000',
          fontWeight: 'bold',
          left: 200,
          top: 300,
          lineHeight: 1.3,
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '15.06.2025',
          fontSize: 48,
          fontFamily: 'Lato',
          fill: '#666666',
          left: 200,
          top: 600,
        },
        
        // Ubicación
        {
          type: 'i-text',
          text: 'BARCELONA',
          fontSize: 24,
          fontFamily: 'Montserrat',
          fill: '#999999',
          letterSpacing: 150,
          left: 200,
          top: 700,
        },
      ],
    },
  },

  // SAVE THE DATE 3: Floral Garden
  {
    id: 'std-floral-garden',
    name: '🌸 Jardín Floral',
    category: 'savethedate',
    style: 'romantic',
    description: 'Diseño con flores y naturaleza',
    thumbnail: '/templates/std-floral.jpg',
    canvas: {
      width: 744,
      height: 1050,
      backgroundColor: '#F5F5DC',
      objects: [
        // Marco floral superior
        {
          type: 'i-text',
          text: '🌸 🌿 🌸',
          fontSize: 40,
          left: 372,
          top: 50,
          originX: 'center',
        },
        
        // Título
        {
          type: 'i-text',
          text: '~ Save the Date ~',
          fontSize: 42,
          fontFamily: 'Dancing Script',
          fill: '#6B8E23',
          left: 372,
          top: 150,
          originX: 'center',
        },
        
        // Nombres con decoración
        {
          type: 'i-text',
          text: 'María',
          fontSize: 68,
          fontFamily: 'Parisienne',
          fill: '#8B7355',
          left: 372,
          top: 300,
          originX: 'center',
        },
        {
          type: 'i-text',
          text: '&',
          fontSize: 48,
          fontFamily: 'Dancing Script',
          fill: '#6B8E23',
          left: 372,
          top: 390,
          originX: 'center',
        },
        {
          type: 'i-text',
          text: 'Juan',
          fontSize: 68,
          fontFamily: 'Parisienne',
          fill: '#8B7355',
          left: 372,
          top: 460,
          originX: 'center',
        },
        
        // Línea decorativa
        {
          type: 'rect',
          left: 222,
          top: 560,
          width: 300,
          height: 1,
          fill: '#6B8E23',
        },
        
        // Fecha
        {
          type: 'i-text',
          text: '15 de Junio de 2025',
          fontSize: 36,
          fontFamily: 'Lato',
          fill: '#5D4E37',
          left: 372,
          top: 600,
          originX: 'center',
        },
        
        // Lugar
        {
          type: 'i-text',
          text: 'Barcelona, España',
          fontSize: 28,
          fontFamily: 'Lato',
          fill: '#8B7355',
          left: 372,
          top: 680,
          originX: 'center',
        },
        
        // Marco floral inferior
        {
          type: 'i-text',
          text: '🌿 🌸 🌿',
          fontSize: 40,
          left: 372,
          top: 900,
          originX: 'center',
        },
      ],
    },
  },
];

/**
 * Procesar plantilla de Save the Date con datos de la boda
 */
export function processSaveTheDateTemplate(template, weddingData) {
  if (!weddingData) return template;
  
  const processedTemplate = JSON.parse(JSON.stringify(template));
  
  const replacements = {
    'María & Juan': weddingData.coupleName || 'María & Juan',
    'MARÍA': weddingData.bride?.toUpperCase() || 'MARÍA',
    'JUAN': weddingData.groom?.toUpperCase() || 'JUAN',
    'María': weddingData.bride || 'María',
    'Juan': weddingData.groom || 'Juan',
    '15': weddingData.weddingDate ? new Date(weddingData.weddingDate).getDate().toString() : '15',
    'JUNIO • 2025': weddingData.formattedDate?.split(' ').slice(2).join(' • ').toUpperCase() || 'JUNIO • 2025',
    '15.06.2025': weddingData.weddingDate ? 
      new Date(weddingData.weddingDate).toLocaleDateString('es-ES').replace(/\//g, '.') : 
      '15.06.2025',
    '15 de Junio de 2025': weddingData.formattedDate || '15 de Junio de 2025',
    'Barcelona, España': weddingData.ceremonyAddress || 'Barcelona, España',
    'BARCELONA': weddingData.ceremonyPlace?.toUpperCase() || 'BARCELONA',
    '📍 Barcelona, España': `📍 ${weddingData.ceremonyAddress || 'Barcelona, España'}`,
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

export default SAVE_THE_DATE_TEMPLATES;
