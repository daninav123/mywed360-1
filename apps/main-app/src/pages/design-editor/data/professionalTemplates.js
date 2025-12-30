/**
 * PLANTILLAS PROFESIONALES - Diseños Elegantes y Atractivos
 * Inspiradas en invitaciones de boda reales de alta gama
 */

export const PROFESSIONAL_TEMPLATES = [
  // TEMPLATE 1: Elegancia Floral Clásica
  {
    id: 'elegant-floral-classic',
    name: '🌸 Elegancia Floral',
    category: 'invitation',
    style: 'elegant',
    thumbnail: '/templates/elegant-floral.jpg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFFCF7',
      objects: [
        // Marco decorativo superior - más grande
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1050,
          height: 420,
          fill: '#F5E6D3',
          stroke: null,
        },
        
        // Línea dorada superior
        {
          type: 'rect',
          left: 80,
          top: 380,
          width: 890,
          height: 4,
          fill: '#D4AF37',
          stroke: null,
        },
        
        // "SE CASAN" - más grande
        {
          type: 'i-text',
          text: 'SE CASAN',
          fontSize: 56,
          fontFamily: 'Lato',
          fill: '#8B7355',
          letterSpacing: 200,
          fontWeight: 'bold',
          top: 220,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Nombres grandes y elegantes - MUCHO más grandes
        {
          type: 'i-text',
          text: 'María & Juan',
          fontSize: 180,
          fontFamily: 'Allura',
          fill: '#6B5B4B',
          textAlign: 'center',
          top: 600,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Divisor decorativo - más ancho
        {
          type: 'rect',
          left: 350,
          top: 780,
          width: 350,
          height: 3,
          fill: '#D4AF37',
          stroke: null,
        },
        
        // Fecha principal - más grande
        {
          type: 'i-text',
          text: '15 • JUNIO • 2025',
          fontSize: 66,
          fontFamily: 'Lato',
          fill: '#8B7355',
          letterSpacing: 80,
          fontWeight: 'normal',
          top: 900,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Lugar - más grande
        {
          type: 'i-text',
          text: 'HACIENDA LOS ROBLES',
          fontSize: 48,
          fontFamily: 'Lato',
          fill: '#8B7355',
          letterSpacing: 60,
          top: 1020,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: 'Barcelona, España',
          fontSize: 40,
          fontFamily: 'Lato',
          fill: '#A89584',
          textAlign: 'center',
          top: 1100,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Hora en badge circular - más grande
        {
          type: 'circle',
          left: 525,
          top: 1250,
          radius: 100,
          fill: '#F5E6D3',
          stroke: '#D4AF37',
          strokeWidth: 4,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: '18:00',
          fontSize: 60,
          fontFamily: 'Lato',
          fill: '#6B5B4B',
          fontWeight: 'bold',
          top: 1250,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Mensaje inferior - más grande
        {
          type: 'i-text',
          text: 'ACOMPÁÑANOS A CELEBRAR\nNUESTRO GRAN DÍA',
          fontSize: 36,
          fontFamily: 'Lato',
          fill: '#8B7355',
          textAlign: 'center',
          letterSpacing: 40,
          lineHeight: 1.8,
          top: 1400,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // TEMPLATE 2: Minimalista Moderna
  {
    id: 'modern-minimalist',
    name: '✨ Minimalista Moderna',
    category: 'invitation',
    style: 'modern',
    thumbnail: '/templates/modern-minimal.jpg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFFFFF',
      objects: [
        // Bandas laterales decorativas - más anchas
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 20,
          height: 1485,
          fill: '#E8C5A5',
          stroke: null,
        },
        
        {
          type: 'rect',
          left: 1030,
          top: 0,
          width: 20,
          height: 1485,
          fill: '#E8C5A5',
          stroke: null,
        },
        
        // Encabezado elegante - más grande
        {
          type: 'i-text',
          text: 'NOS CASAMOS',
          fontSize: 52,
          fontFamily: 'Lato',
          fill: '#B08D6F',
          letterSpacing: 180,
          fontWeight: '300',
          top: 150,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Marco fino alrededor de nombres - más grande
        {
          type: 'rect',
          left: 125,
          top: 280,
          width: 800,
          height: 500,
          fill: 'transparent',
          stroke: '#E8C5A5',
          strokeWidth: 3,
        },
        
        // Nombres principales - MUCHO más grandes
        {
          type: 'i-text',
          text: 'SOFÍA',
          fontSize: 140,
          fontFamily: 'Cormorant Garamond',
          fill: '#4A4A4A',
          fontWeight: 'bold',
          top: 400,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: '&',
          fontSize: 100,
          fontFamily: 'Allura',
          fill: '#B08D6F',
          top: 530,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: 'DAVID',
          fontSize: 140,
          fontFamily: 'Cormorant Garamond',
          fill: '#4A4A4A',
          fontWeight: 'bold',
          top: 660,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Información de evento - más grande
        {
          type: 'i-text',
          text: 'SÁBADO',
          fontSize: 58,
          fontFamily: 'Lato',
          fill: '#4A4A4A',
          letterSpacing: 80,
          fontWeight: '300',
          top: 900,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: '20',
          fontSize: 160,
          fontFamily: 'Cormorant Garamond',
          fill: '#B08D6F',
          fontWeight: 'bold',
          top: 1020,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: 'JULIO 2025',
          fontSize: 58,
          fontFamily: 'Lato',
          fill: '#4A4A4A',
          letterSpacing: 80,
          fontWeight: '300',
          top: 1180,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Separador - más ancho
        {
          type: 'rect',
          left: 325,
          top: 1260,
          width: 400,
          height: 2,
          fill: '#E8C5A5',
          stroke: null,
        },
        
        // Hora y lugar - más grande
        {
          type: 'i-text',
          text: '7:00 PM',
          fontSize: 54,
          fontFamily: 'Lato',
          fill: '#B08D6F',
          fontWeight: '300',
          top: 1330,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: 'Jardín Botánico\nMadrid, España',
          fontSize: 40,
          fontFamily: 'Lato',
          fill: '#7A7A7A',
          textAlign: 'center',
          lineHeight: 1.6,
          top: 1420,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // TEMPLATE 3: Romántica con Acuarela
  {
    id: 'romantic-watercolor',
    name: '💐 Romántica Acuarela',
    category: 'invitation',
    style: 'romantic',
    thumbnail: '/templates/romantic-watercolor.jpg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFF5F7',
      objects: [
        // Fondo acuarela superior más grande
        {
          type: 'rect',
          left: -100,
          top: 50,
          width: 700,
          height: 700,
          fill: '#FFE0E6',
          opacity: 0.3,
          angle: -15,
        },
        
        // Fondo acuarela inferior más grande
        {
          type: 'rect',
          left: 450,
          top: 900,
          width: 700,
          height: 700,
          fill: '#E8D5D8',
          opacity: 0.25,
          angle: 20,
        },
        
        // Encabezado delicado - más grande
        {
          type: 'i-text',
          text: 'Nuestra Boda',
          fontSize: 90,
          fontFamily: 'Allura',
          fill: '#C77B85',
          top: 120,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Nombres románticos - MUCHO más grandes
        {
          type: 'i-text',
          text: 'Isabella',
          fontSize: 160,
          fontFamily: 'Allura',
          fill: '#8B5A5F',
          top: 320,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: '❤',
          fontSize: 80,
          fontFamily: 'Arial',
          fill: '#E8A0A7',
          top: 480,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: 'Alejandro',
          fontSize: 160,
          fontFamily: 'Allura',
          fill: '#8B5A5F',
          top: 620,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Mensaje principal - más grande y más abajo
        {
          type: 'i-text',
          text: 'Con inmensa alegría invitamos a celebrar\nnuestro matrimonio',
          fontSize: 38,
          fontFamily: 'Lato',
          fill: '#A67982',
          textAlign: 'center',
          lineHeight: 1.8,
          fontStyle: 'italic',
          top: 800,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Marco decorativo para fecha - más grande
        {
          type: 'rect',
          left: 200,
          top: 920,
          width: 650,
          height: 250,
          fill: 'transparent',
          stroke: '#E8A0A7',
          strokeWidth: 3,
          rx: 15,
          ry: 15,
        },
        
        // Fecha destacada - textos más grandes
        {
          type: 'i-text',
          text: 'VIERNES',
          fontSize: 48,
          fontFamily: 'Lato',
          fill: '#8B5A5F',
          letterSpacing: 120,
          top: 960,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: '10 DE AGOSTO',
          fontSize: 72,
          fontFamily: 'Cormorant Garamond',
          fill: '#C77B85',
          fontWeight: 'bold',
          top: 1040,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: '2025  •  19:00 hrs',
          fontSize: 52,
          fontFamily: 'Lato',
          fill: '#8B5A5F',
          letterSpacing: 60,
          top: 1130,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Ubicación - más grande y más separado
        {
          type: 'i-text',
          text: 'Finca Villa Rosa',
          fontSize: 66,
          fontFamily: 'Allura',
          fill: '#C77B85',
          top: 1260,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: 'Carretera de las Flores, Km 12\nValencia, España',
          fontSize: 36,
          fontFamily: 'Lato',
          fill: '#A67982',
          textAlign: 'center',
          lineHeight: 1.6,
          top: 1360,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },

  // TEMPLATE 4: Geométrica Moderna
  {
    id: 'geometric-modern',
    name: '⬡ Geométrica Moderna',
    category: 'invitation',
    style: 'modern',
    thumbnail: '/templates/geometric-modern.jpg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#2C3E50',
      objects: [
        // Marco dorado exterior
        {
          type: 'rect',
          left: 80,
          top: 80,
          width: 890,
          height: 1325,
          fill: 'transparent',
          stroke: '#D4AF37',
          strokeWidth: 4,
        },
        
        // Marco dorado interior
        {
          type: 'rect',
          left: 120,
          top: 120,
          width: 810,
          height: 1245,
          fill: 'transparent',
          stroke: '#D4AF37',
          strokeWidth: 2,
        },
        
        // Encabezado
        {
          type: 'i-text',
          text: 'CELEBREMOS JUNTOS',
          fontSize: 36,
          fontFamily: 'Lato',
          fill: '#D4AF37',
          letterSpacing: 120,
          fontWeight: '300',
          top: 240,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Línea decorativa superior
        {
          type: 'rect',
          left: 375,
          top: 310,
          width: 300,
          height: 2,
          fill: '#D4AF37',
          stroke: null,
        },
        
        // Nombres
        {
          type: 'i-text',
          text: 'LAURA',
          fontSize: 100,
          fontFamily: 'Cormorant Garamond',
          fill: '#FFFFFF',
          fontWeight: 'bold',
          letterSpacing: 40,
          top: 450,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: '&',
          fontSize: 70,
          fontFamily: 'Allura',
          fill: '#D4AF37',
          top: 560,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: 'MARCOS',
          fontSize: 100,
          fontFamily: 'Cormorant Garamond',
          fill: '#FFFFFF',
          fontWeight: 'bold',
          letterSpacing: 40,
          top: 660,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Línea decorativa inferior
        {
          type: 'rect',
          left: 375,
          top: 770,
          width: 300,
          height: 2,
          fill: '#D4AF37',
          stroke: null,
        },
        
        // Hexágono decorativo (simulado)
        {
          type: 'rect',
          left: 450,
          top: 840,
          width: 150,
          height: 150,
          fill: 'transparent',
          stroke: '#D4AF37',
          strokeWidth: 2,
          angle: 45,
        },
        
        // Información de la boda
        {
          type: 'i-text',
          text: 'LA BODA',
          fontSize: 42,
          fontFamily: 'Lato',
          fill: '#FFFFFF',
          letterSpacing: 100,
          fontWeight: '300',
          top: 1020,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: '03 . 09 . 2025',
          fontSize: 58,
          fontFamily: 'Cormorant Garamond',
          fill: '#D4AF37',
          fontWeight: 'bold',
          letterSpacing: 40,
          top: 1100,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: '6:30 PM',
          fontSize: 48,
          fontFamily: 'Lato',
          fill: '#FFFFFF',
          fontWeight: '300',
          top: 1180,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        // Ubicación
        {
          type: 'i-text',
          text: 'PALACIO DE CONGRESOS',
          fontSize: 36,
          fontFamily: 'Lato',
          fill: '#D4AF37',
          letterSpacing: 80,
          fontWeight: '300',
          top: 1270,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
        
        {
          type: 'i-text',
          text: 'Sevilla, España',
          fontSize: 32,
          fontFamily: 'Lato',
          fill: '#AAAAAA',
          top: 1330,
          left: 525,
          originX: 'center',
          originY: 'center',
        },
      ],
    },
  },
];

export function processProfessionalTemplate(template, weddingData) {
  if (!weddingData) {
    console.log('⚠️ processProfessionalTemplate: No hay weddingData');
    return template;
  }
  
  console.log('🎨 processProfessionalTemplate: Procesando con datos:', {
    bride: weddingData.bride,
    groom: weddingData.groom,
    coupleName: weddingData.coupleName,
    formattedDate: weddingData.formattedDate,
    schedule: weddingData.schedule,
    ceremonyPlace: weddingData.ceremonyPlace,
  });
  
  const processedTemplate = JSON.parse(JSON.stringify(template));
  
  // Reemplazos basados en datos reales de InfoBoda
  const replacements = {
    // Nombres individuales
    'María': weddingData.bride || 'María',
    'Juan': weddingData.groom || 'Juan',
    'Sofía': weddingData.bride || 'Sofía',
    'SOFÍA': weddingData.bride?.toUpperCase() || 'SOFÍA',
    'David': weddingData.groom || 'David',
    'DAVID': weddingData.groom?.toUpperCase() || 'DAVID',
    'Isabella': weddingData.bride || 'Isabella',
    'Alejandro': weddingData.groom || 'Alejandro',
    'Laura': weddingData.bride || 'Laura',
    'LAURA': weddingData.bride?.toUpperCase() || 'LAURA',
    'Marcos': weddingData.groom || 'Marcos',
    'MARCOS': weddingData.groom?.toUpperCase() || 'MARCOS',
    
    // Nombres combinados
    'María & Juan': weddingData.coupleName || `${weddingData.bride} & ${weddingData.groom}`,
    
    // Fechas
    '15 de Junio 2025': weddingData.formattedDate || '15 de Junio 2025',
    '15 • JUNIO • 2425': weddingData.formattedDate?.replace(/ de /g, ' • ').toUpperCase() || '15 • JUNIO • 2025',
    '15 • JUNIO • 2025': weddingData.formattedDate?.replace(/ de /g, ' • ').toUpperCase() || '15 • JUNIO • 2025',
    '20 DE JULIO 2025': weddingData.formattedDate?.toUpperCase() || '20 DE JULIO 2025',
    'JULIO 2025': weddingData.formattedDate?.split(' ').slice(2).join(' ').toUpperCase() || 'JULIO 2025',
    '10 DE AGOSTO': weddingData.formattedDate?.split(' ').slice(0, 3).join(' ').toUpperCase() || '10 DE AGOSTO',
    '2025': weddingData.year?.toString() || '2025',
    '03 . 09 . 2025': formatDateDots(weddingData.weddingDate) || '03 . 09 . 2025',
    
    // Días de la semana
    '20': getDayOfMonth(weddingData.weddingDate) || '20',
    'SÁBADO': getDayOfWeek(weddingData.weddingDate) || 'SÁBADO',
    'VIERNES': getDayOfWeek(weddingData.weddingDate) || 'VIERNES',
    
    // Horas
    '18:00': weddingData.schedule || '18:00',
    '7:00 PM': weddingData.schedule || '7:00 PM',
    '19:00 hrs': weddingData.schedule ? `${weddingData.schedule} hrs` : '19:00 hrs',
    '6:30 PM': weddingData.schedule || '6:30 PM',
    '4:00\nP.M.': weddingData.schedule ? weddingData.schedule.replace(':', ':\n') : '4:00\nP.M.',
    
    // Lugares
    'HACIENDA LOS ROBLES': weddingData.ceremonyPlace?.toUpperCase() || 'HACIENDA LOS ROBLES',
    'Barcelona, España': weddingData.ceremonyAddress || 'Barcelona, España',
    'Jardín Botánico': weddingData.ceremonyPlace || 'Jardín Botánico',
    'Madrid, España': weddingData.ceremonyAddress || 'Madrid, España',
    'Finca Villa Rosa': weddingData.ceremonyPlace || 'Finca Villa Rosa',
    'Valencia, España': weddingData.ceremonyAddress || 'Valencia, España',
    'Carretera de las Flores, Km 12': weddingData.ceremonyAddress || 'Carretera de las Flores, Km 12',
    'PALACIO DE CONGRESOS': weddingData.ceremonyPlace?.toUpperCase() || 'PALACIO DE CONGRESOS',
    'Sevilla, España': weddingData.ceremonyAddress || 'Sevilla, España',
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

// Formatear fecha en formato DD . MM . YYYY
function formatDateDots(dateString) {
  if (!dateString) return null;
  try {
    // Si viene en formato DD/MM/YYYY, convertir a formato ISO
    let dateToUse = dateString;
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      dateToUse = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    const date = new Date(dateToUse);
    if (isNaN(date.getTime())) return null;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day} . ${month} . ${year}`;
  } catch {
    return null;
  }
}

// Obtener día del mes
function getDayOfMonth(dateString) {
  if (!dateString) return null;
  try {
    // Si viene en formato DD/MM/YYYY, convertir a formato ISO
    let dateToUse = dateString;
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      dateToUse = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    const date = new Date(dateToUse);
    if (isNaN(date.getTime())) return null;
    return String(date.getDate());
  } catch {
    return null;
  }
}

// Obtener día de la semana
function getDayOfWeek(dateString) {
  if (!dateString) return null;
  try {
    // Si viene en formato DD/MM/YYYY, convertir a formato ISO
    let dateToUse = dateString;
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      dateToUse = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    const date = new Date(dateToUse);
    if (isNaN(date.getTime())) return null;
    
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    return days[date.getDay()];
  } catch {
    return null;
  }
}

export default PROFESSIONAL_TEMPLATES;
