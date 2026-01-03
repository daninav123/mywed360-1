/**
 * PLANTILLAS MODERNAS 2025 - Basadas en Tendencias Reales
 * 
 * NUEVO: Sistema de doble cara (anverso/reverso)
 * Cada plantilla tiene:
 * - front: Diseño principal de la invitación
 * - back: Reverso con detalles, mapa, RSVP, etc.
 */

export const MODERN_TEMPLATES_2025 = [
  // 1. NEUTRAL GREENERY - Minimalista con verde eucalipto
  {
    id: 'neutral-greenery-eucalyptus',
    name: 'Eucalipto Minimalista',
    category: 'invitation',
    style: 'minimal-greenery',
    thumbnail: '/templates/eucalyptus.svg',
    sides: {
      front: {
        width: 1050,
        height: 1485,
        backgroundColor: '#FDFDFB',
        objects: [
          // Marco fino superior e inferior
          { type: 'rect', width: 900, height: 1, fill: '#8B9B84', top: 100, left: 75 },
          { type: 'rect', width: 900, height: 1, fill: '#8B9B84', top: 1385, left: 75 },
          
          // Ramas de eucalipto - parte superior
          { type: 'path', path: 'M 200,150 Q 250,180 280,200 Q 310,220 320,250', stroke: '#8B9B84', strokeWidth: 2, fill: 'transparent' },
          { type: 'circle', radius: 8, fill: '#C4D5BD', top: 160, left: 220 },
          { type: 'circle', radius: 6, fill: '#C4D5BD', top: 190, left: 260 },
          { type: 'circle', radius: 7, fill: '#C4D5BD', top: 210, left: 290 },
          
          // Ramas de eucalipto - parte superior derecha
          { type: 'path', path: 'M 850,150 Q 800,180 770,200 Q 740,220 730,250', stroke: '#8B9B84', strokeWidth: 2, fill: 'transparent' },
          { type: 'circle', radius: 8, fill: '#C4D5BD', top: 160, left: 830 },
          { type: 'circle', radius: 6, fill: '#C4D5BD', top: 190, left: 790 },
          { type: 'circle', radius: 7, fill: '#C4D5BD', top: 210, left: 760 },
          
          // Texto principal - nombres
          { type: 'i-text', text: '{{bride}}', fontSize: 56, fontFamily: 'Cormorant', fill: '#3D4A3B', fontWeight: '300', top: 450, left: 525, originX: 'center', originY: 'center', letterSpacing: 50 },
          { type: 'i-text', text: '&', fontSize: 36, fontFamily: 'Cormorant', fill: '#8B9B84', fontStyle: 'italic', top: 520, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{groom}}', fontSize: 56, fontFamily: 'Cormorant', fill: '#3D4A3B', fontWeight: '300', top: 580, left: 525, originX: 'center', originY: 'center', letterSpacing: 50 },
          
          // Línea decorativa
          { type: 'rect', width: 200, height: 1, fill: '#C4D5BD', top: 680, left: 425 },
          
          // Invitación
          { type: 'i-text', text: 'Os invitan a celebrar su boda', fontSize: 16, fontFamily: 'Lato', fill: '#6B7B67', top: 750, left: 525, originX: 'center', originY: 'center' },
          
          // Fecha y hora
          { type: 'i-text', text: '{{formattedDate}}', fontSize: 28, fontFamily: 'Cormorant', fill: '#3D4A3B', top: 870, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{schedule}}', fontSize: 20, fontFamily: 'Lato', fill: '#8B9B84', fontWeight: '300', top: 920, left: 525, originX: 'center', originY: 'center' },
          
          // Lugar
          { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 22, fontFamily: 'Cormorant', fill: '#3D4A3B', top: 1020, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 16, fontFamily: 'Lato', fill: '#6B7B67', top: 1060, left: 525, originX: 'center', originY: 'center' },
          
          // Ramas inferiores
          { type: 'path', path: 'M 200,1300 Q 250,1270 280,1250', stroke: '#8B9B84', strokeWidth: 2, fill: 'transparent' },
          { type: 'circle', radius: 6, fill: '#C4D5BD', top: 1290, left: 220 },
          { type: 'circle', radius: 5, fill: '#C4D5BD', top: 1270, left: 250 },
        ],
      },
      back: {
        width: 1050,
        height: 1485,
        backgroundColor: '#F8FAF7',
        objects: [
          // Título
          { type: 'i-text', text: 'DETALLES DE LA CELEBRACIÓN', fontSize: 14, fontFamily: 'Montserrat', fill: '#8B9B84', letterSpacing: 150, top: 150, left: 525, originX: 'center', originY: 'center' },
          
          // Línea
          { type: 'rect', width: 600, height: 1, fill: '#C4D5BD', top: 200, left: 225 },
          
          // Cronograma
          { type: 'i-text', text: 'CRONOGRAMA', fontSize: 16, fontFamily: 'Cormorant', fill: '#3D4A3B', fontWeight: 'bold', top: 280, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{schedule}} - Ceremonia', fontSize: 16, fontFamily: 'Lato', fill: '#6B7B67', top: 340, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'A continuación - Cóctel', fontSize: 16, fontFamily: 'Lato', fill: '#6B7B67', top: 380, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Después - Banquete y fiesta', fontSize: 16, fontFamily: 'Lato', fill: '#6B7B67', top: 420, left: 525, originX: 'center', originY: 'center' },
          
          // Dress Code
          { type: 'i-text', text: 'DRESS CODE', fontSize: 16, fontFamily: 'Cormorant', fill: '#3D4A3B', fontWeight: 'bold', top: 540, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Formal / Etiqueta', fontSize: 16, fontFamily: 'Lato', fill: '#6B7B67', top: 590, left: 525, originX: 'center', originY: 'center' },
          
          // RSVP
          { type: 'i-text', text: 'CONFIRMA TU ASISTENCIA', fontSize: 16, fontFamily: 'Cormorant', fill: '#3D4A3B', fontWeight: 'bold', top: 710, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Antes del {{rsvpDate}}', fontSize: 16, fontFamily: 'Lato', fill: '#6B7B67', top: 760, left: 525, originX: 'center', originY: 'center' },
          
          // QR Code placeholder
          { type: 'rect', width: 150, height: 150, fill: '#E8EDE6', top: 850, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'QR', fontSize: 24, fontFamily: 'Montserrat', fill: '#8B9B84', top: 925, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Escanea para más información', fontSize: 12, fontFamily: 'Lato', fill: '#6B7B67', top: 1040, left: 525, originX: 'center', originY: 'center' },
          
          // Hashtag
          { type: 'i-text', text: '{{hashtag}}', fontSize: 18, fontFamily: 'Playfair Display', fill: '#8B9B84', fontStyle: 'italic', top: 1200, left: 525, originX: 'center', originY: 'center' },
          
          // Decoración inferior
          { type: 'circle', radius: 4, fill: '#C4D5BD', top: 1350, left: 500 },
          { type: 'circle', radius: 4, fill: '#C4D5BD', top: 1350, left: 525 },
          { type: 'circle', radius: 4, fill: '#C4D5BD', top: 1350, left: 550 },
        ],
      },
    },
  },
  
  // 2. DUTCH FLORALS - Florales dramáticos oscuros
  {
    id: 'dutch-dark-floral',
    name: 'Florales Holandeses Oscuros',
    category: 'invitation',
    style: 'dutch-floral',
    thumbnail: '/templates/dutch-floral.svg',
    sides: {
      front: {
        width: 1050,
        height: 1485,
        backgroundColor: '#1A1D24',
        objects: [
          // Fondo con degradado simulado
          { type: 'rect', width: 1050, height: 500, fill: '#0F1117', opacity: 0.6, top: 0, left: 0 },
          
          // Flores oscuras decorativas (simuladas con círculos y paths)
          // Rosa superior izquierda
          { type: 'circle', radius: 45, fill: '#8B4C5C', opacity: 0.8, top: 120, left: 150 },
          { type: 'circle', radius: 35, fill: '#A8667A', opacity: 0.7, top: 125, left: 155 },
          { type: 'circle', radius: 15, fill: '#D4A5B0', opacity: 0.9, top: 120, left: 150 },
          
          // Peonía derecha
          { type: 'circle', radius: 50, fill: '#6B4C7A', opacity: 0.7, top: 200, left: 900 },
          { type: 'circle', radius: 40, fill: '#8B669A', opacity: 0.6, top: 205, left: 905 },
          { type: 'circle', radius: 20, fill: '#C4A5D0', opacity: 0.8, top: 200, left: 900 },
          
          // Hojas oscuras
          { type: 'circle', radius: 25, fill: '#2C4A3E', opacity: 0.6, top: 180, left: 220 },
          { type: 'circle', radius: 20, fill: '#3D5A4E', opacity: 0.5, top: 250, left: 850 },
          
          // Marco dorado fino
          { type: 'rect', width: 850, height: 1285, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 1, top: 100, left: 525, originX: 'center', originY: 'top' },
          
          // Nombres en dorado
          { type: 'i-text', text: '{{bride}}', fontSize: 54, fontFamily: 'Playfair Display', fill: '#E8D7A5', fontWeight: '400', fontStyle: 'italic', top: 550, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '&', fontSize: 38, fontFamily: 'Playfair Display', fill: '#D4AF37', fontStyle: 'italic', top: 620, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{groom}}', fontSize: 54, fontFamily: 'Playfair Display', fill: '#E8D7A5', fontWeight: '400', fontStyle: 'italic', top: 680, left: 525, originX: 'center', originY: 'center' },
          
          // Ornamento
          { type: 'i-text', text: '❦', fontSize: 28, fontFamily: 'Arial', fill: '#D4AF37', top: 780, left: 525, originX: 'center', originY: 'center' },
          
          // Texto invitación
          { type: 'i-text', text: 'Tienen el placer de invitarle', fontSize: 16, fontFamily: 'Cormorant', fill: '#C8C8C8', fontStyle: 'italic', top: 870, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'a la celebración de su matrimonio', fontSize: 16, fontFamily: 'Cormorant', fill: '#C8C8C8', fontStyle: 'italic', top: 900, left: 525, originX: 'center', originY: 'center' },
          
          // Fecha
          { type: 'i-text', text: '{{formattedDate}}', fontSize: 26, fontFamily: 'Playfair Display', fill: '#E8D7A5', top: 1000, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{schedule}}', fontSize: 20, fontFamily: 'Cormorant', fill: '#D4AF37', top: 1050, left: 525, originX: 'center', originY: 'center' },
          
          // Lugar
          { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 22, fontFamily: 'Playfair Display', fill: '#E8D7A5', top: 1150, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 16, fontFamily: 'Cormorant', fill: '#A8A8A8', top: 1195, left: 525, originX: 'center', originY: 'center' },
          
          // Flores inferiores
          { type: 'circle', radius: 40, fill: '#8B4C5C', opacity: 0.7, top: 1350, left: 200 },
          { type: 'circle', radius: 35, fill: '#6B4C7A', opacity: 0.6, top: 1360, left: 850 },
        ],
      },
      back: {
        width: 1050,
        height: 1485,
        backgroundColor: '#1A1D24',
        objects: [
          // Marco
          { type: 'rect', width: 850, height: 1285, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 1, top: 100, left: 525, originX: 'center', originY: 'top' },
          
          // Flores decorativas sutiles
          { type: 'circle', radius: 30, fill: '#8B4C5C', opacity: 0.4, top: 150, left: 900 },
          { type: 'circle', radius: 25, fill: '#6B4C7A', opacity: 0.3, top: 1300, left: 150 },
          
          // Contenido
          { type: 'i-text', text: 'INFORMACIÓN', fontSize: 18, fontFamily: 'Montserrat', fill: '#D4AF37', letterSpacing: 200, top: 250, left: 525, originX: 'center', originY: 'center' },
          
          { type: 'rect', width: 500, height: 1, fill: '#D4AF37', opacity: 0.5, top: 300, left: 275 },
          
          // Secciones
          { type: 'i-text', text: 'Ceremonia', fontSize: 20, fontFamily: 'Playfair Display', fill: '#E8D7A5', fontStyle: 'italic', top: 380, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 16, fontFamily: 'Cormorant', fill: '#C8C8C8', top: 420, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{schedule}}', fontSize: 16, fontFamily: 'Cormorant', fill: '#A8A8A8', top: 450, left: 525, originX: 'center', originY: 'center' },
          
          { type: 'i-text', text: 'Banquete', fontSize: 20, fontFamily: 'Playfair Display', fill: '#E8D7A5', fontStyle: 'italic', top: 550, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{banquetPlace}}', fontSize: 16, fontFamily: 'Cormorant', fill: '#C8C8C8', top: 590, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'A continuación de la ceremonia', fontSize: 16, fontFamily: 'Cormorant', fill: '#A8A8A8', top: 620, left: 525, originX: 'center', originY: 'center' },
          
          // Dress code
          { type: 'i-text', text: 'Etiqueta', fontSize: 20, fontFamily: 'Playfair Display', fill: '#E8D7A5', fontStyle: 'italic', top: 720, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Formal / Black Tie', fontSize: 16, fontFamily: 'Cormorant', fill: '#C8C8C8', top: 760, left: 525, originX: 'center', originY: 'center' },
          
          // RSVP
          { type: 'i-text', text: 'Confirmación', fontSize: 20, fontFamily: 'Playfair Display', fill: '#E8D7A5', fontStyle: 'italic', top: 890, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Se ruega confirmar asistencia', fontSize: 16, fontFamily: 'Cormorant', fill: '#C8C8C8', top: 930, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'antes del {{rsvpDate}}', fontSize: 16, fontFamily: 'Cormorant', fill: '#A8A8A8', top: 960, left: 525, originX: 'center', originY: 'center' },
          
          // Ornamento final
          { type: 'i-text', text: '❦', fontSize: 24, fontFamily: 'Arial', fill: '#D4AF37', top: 1200, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{hashtag}}', fontSize: 16, fontFamily: 'Playfair Display', fill: '#D4AF37', fontStyle: 'italic', top: 1270, left: 525, originX: 'center', originY: 'center' },
        ],
      },
    },
  },
  
  // 3. BOWS & RIBBONS - Lazos románticos preppy
  {
    id: 'preppy-bows-blush',
    name: 'Lazos Rosa Preppy',
    category: 'invitation',
    style: 'romantic-bows',
    sides: {
      front: {
        width: 1050,
        height: 1485,
        backgroundColor: '#FFF7F8',
        objects: [
          // Lazo superior grande
          { type: 'rect', width: 180, height: 15, fill: '#E8B4C4', top: 120, left: 435 },
          { type: 'rect', width: 15, height: 180, fill: '#E8B4C4', top: 45, left: 517.5 },
          { type: 'circle', radius: 25, fill: '#E8B4C4', top: 120, left: 525, originX: 'center', originY: 'center' },
          { type: 'path', path: 'M 450,120 Q 420,80 390,100', fill: '#F4C2D0', stroke: '#E8B4C4', strokeWidth: 2 },
          { type: 'path', path: 'M 600,120 Q 630,80 660,100', fill: '#F4C2D0', stroke: '#E8B4C4', strokeWidth: 2 },
          
          // Monograma en círculo
          { type: 'circle', radius: 70, fill: '#FFFFFF', stroke: '#E8B4C4', strokeWidth: 2, top: 320, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{brideInitial}}&{{groomInitial}}', fontSize: 38, fontFamily: 'Playfair Display', fill: '#D49AAA', fontWeight: 'bold', fontStyle: 'italic', top: 320, left: 525, originX: 'center', originY: 'center' },
          
          // Nombres con estilo preppy
          { type: 'i-text', text: '{{bride}}', fontSize: 48, fontFamily: 'Playfair Display', fill: '#8B6B75', fontStyle: 'italic', top: 500, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'y', fontSize: 28, fontFamily: 'Playfair Display', fill: '#E8B4C4', fontStyle: 'italic', top: 565, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{groom}}', fontSize: 48, fontFamily: 'Playfair Display', fill: '#8B6B75', fontStyle: 'italic', top: 620, left: 525, originX: 'center', originY: 'center' },
          
          // Texto invitación
          { type: 'i-text', text: 'Os invitan a celebrar su matrimonio', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 750, left: 525, originX: 'center', originY: 'center' },
          
          // Fecha en marco
          { type: 'rect', width: 500, height: 120, fill: 'transparent', stroke: '#E8B4C4', strokeWidth: 1, top: 870, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{formattedDate}}', fontSize: 26, fontFamily: 'Cormorant', fill: '#8B6B75', top: 890, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{schedule}}', fontSize: 20, fontFamily: 'Lato', fill: '#E8B4C4', top: 935, left: 525, originX: 'center', originY: 'center' },
          
          // Lugar
          { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 22, fontFamily: 'Cormorant', fill: '#8B6B75', top: 1070, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 1115, left: 525, originX: 'center', originY: 'center' },
          
          // Lazos decorativos inferiores
          { type: 'circle', radius: 12, fill: '#E8B4C4', top: 1280, left: 450 },
          { type: 'circle', radius: 12, fill: '#E8B4C4', top: 1280, left: 600 },
          { type: 'rect', width: 140, height: 3, fill: '#F4C2D0', top: 1279, left: 455 },
        ],
      },
      back: {
        width: 1050,
        height: 1485,
        backgroundColor: '#FFF7F8',
        objects: [
          // Lazo superior pequeño
          { type: 'circle', radius: 15, fill: '#E8B4C4', top: 150, left: 525, originX: 'center', originY: 'center' },
          { type: 'rect', width: 100, height: 8, fill: '#E8B4C4', top: 147, left: 475 },
          
          { type: 'i-text', text: 'INFORMACIÓN', fontSize: 16, fontFamily: 'Montserrat', fill: '#E8B4C4', letterSpacing: 180, top: 220, left: 525, originX: 'center', originY: 'center' },
          
          // Cronograma
          { type: 'i-text', text: 'Orden del Día', fontSize: 20, fontFamily: 'Playfair Display', fill: '#8B6B75', fontStyle: 'italic', top: 320, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{schedule}} - Ceremonia', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 380, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Cóctel de bienvenida', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 415, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Banquete y celebración', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 450, left: 525, originX: 'center', originY: 'center' },
          
          // Dress Code
          { type: 'i-text', text: 'Vestimenta', fontSize: 20, fontFamily: 'Playfair Display', fill: '#8B6B75', fontStyle: 'italic', top: 570, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Formal / Cocktail', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 620, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Sugerimos tonos pastel', fontSize: 14, fontFamily: 'Lato', fill: '#E8B4C4', fontStyle: 'italic', top: 655, left: 525, originX: 'center', originY: 'center' },
          
          // RSVP
          { type: 'i-text', text: 'Confirmar Asistencia', fontSize: 20, fontFamily: 'Playfair Display', fill: '#8B6B75', fontStyle: 'italic', top: 780, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Antes del {{rsvpDate}}', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 830, left: 525, originX: 'center', originY: 'center' },
          
          // Nota especial
          { type: 'rect', width: 600, height: 150, fill: '#FFF0F3', top: 980, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Tu presencia es nuestro mejor regalo', fontSize: 18, fontFamily: 'Playfair Display', fill: '#8B6B75', fontStyle: 'italic', top: 1000, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Si deseas tener un detalle,', fontSize: 14, fontFamily: 'Lato', fill: '#A88595', top: 1045, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'agradeceríamos una contribución a nuestro viaje de novios', fontSize: 14, fontFamily: 'Lato', fill: '#A88595', top: 1075, left: 525, originX: 'center', originY: 'center' },
          
          // Hashtag
          { type: 'i-text', text: '{{hashtag}}', fontSize: 18, fontFamily: 'Playfair Display', fill: '#E8B4C4', fontStyle: 'italic', top: 1250, left: 525, originX: 'center', originY: 'center' },
        ],
      },
    },
  },
  
  // 4. OLD MONEY - Elegancia discreta con monograma
  {
    id: 'old-money-crest',
    name: 'Old Money con Escudo',
    category: 'invitation',
    style: 'old-money',
    sides: {
      front: {
        width: 1050,
        height: 1485,
        backgroundColor: '#F8F5F0',
        objects: [
          // Bordes clásicos
          { type: 'rect', width: 950, height: 1385, fill: 'transparent', stroke: '#2C4A3E', strokeWidth: 3, top: 50, left: 525, originX: 'center', originY: 'top' },
          { type: 'rect', width: 920, height: 1355, fill: 'transparent', stroke: '#8B9B84', strokeWidth: 1, top: 65, left: 525, originX: 'center', originY: 'top' },
          
          // Escudo/Crest superior
          { type: 'rect', width: 120, height: 140, fill: 'transparent', stroke: '#2C4A3E', strokeWidth: 2, top: 150, left: 525, originX: 'center', originY: 'top', rx: 5 },
          { type: 'rect', width: 110, height: 130, fill: '#E8E3D8', top: 155, left: 525, originX: 'center', originY: 'top', rx: 5 },
          { type: 'i-text', text: '{{brideInitial}}', fontSize: 44, fontFamily: 'Playfair Display', fill: '#2C4A3E', fontWeight: 'bold', top: 195, left: 495, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{groomInitial}}', fontSize: 44, fontFamily: 'Playfair Display', fill: '#2C4A3E', fontWeight: 'bold', top: 195, left: 555, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '&', fontSize: 24, fontFamily: 'Playfair Display', fill: '#8B9B84', top: 245, left: 525, originX: 'center', originY: 'center' },
          
          // Línea decorativa
          { type: 'rect', width: 300, height: 2, fill: '#2C4A3E', top: 330, left: 375 },
          
          // Texto formal
          { type: 'i-text', text: 'JUNTO A SUS FAMILIAS', fontSize: 12, fontFamily: 'Montserrat', fill: '#6B7B67', letterSpacing: 150, top: 380, left: 525, originX: 'center', originY: 'center' },
          
          // Nombres
          { type: 'i-text', text: '{{bride}}', fontSize: 42, fontFamily: 'Playfair Display', fill: '#2C4A3E', fontWeight: '400', top: 480, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'y', fontSize: 26, fontFamily: 'Playfair Display', fill: '#8B9B84', fontStyle: 'italic', top: 540, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{groom}}', fontSize: 42, fontFamily: 'Playfair Display', fill: '#2C4A3E', fontWeight: '400', top: 590, left: 525, originX: 'center', originY: 'center' },
          
          // Texto invitación formal
          { type: 'i-text', text: 'Tienen el honor de invitarle', fontSize: 16, fontFamily: 'Cormorant', fill: '#5C5C5C', top: 700, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'a la ceremonia de su enlace matrimonial', fontSize: 16, fontFamily: 'Cormorant', fill: '#5C5C5C', top: 730, left: 525, originX: 'center', originY: 'center' },
          
          // Fecha
          { type: 'i-text', text: '{{formattedDate}}', fontSize: 28, fontFamily: 'Playfair Display', fill: '#2C4A3E', top: 850, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{schedule}}', fontSize: 22, fontFamily: 'Cormorant', fill: '#6B7B67', top: 900, left: 525, originX: 'center', originY: 'center' },
          
          // Lugar
          { type: 'rect', width: 600, height: 150, fill: '#E8E3D8', top: 1000, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 24, fontFamily: 'Playfair Display', fill: '#2C4A3E', top: 1020, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 16, fontFamily: 'Cormorant', fill: '#6B7B67', top: 1065, left: 525, originX: 'center', originY: 'center' },
          
          // RSVP formal
          { type: 'i-text', text: 'SE RUEGA CONFIRMACIÓN DE ASISTENCIA', fontSize: 11, fontFamily: 'Montserrat', fill: '#6B7B67', letterSpacing: 100, top: 1250, left: 525, originX: 'center', originY: 'center' },
        ],
      },
      back: {
        width: 1050,
        height: 1485,
        backgroundColor: '#F8F5F0',
        objects: [
          // Bordes
          { type: 'rect', width: 950, height: 1385, fill: 'transparent', stroke: '#2C4A3E', strokeWidth: 3, top: 50, left: 525, originX: 'center', originY: 'top' },
          { type: 'rect', width: 920, height: 1355, fill: 'transparent', stroke: '#8B9B84', strokeWidth: 1, top: 65, left: 525, originX: 'center', originY: 'top' },
          
          // Contenido
          { type: 'i-text', text: 'DETALLES', fontSize: 14, fontFamily: 'Montserrat', fill: '#2C4A3E', letterSpacing: 200, top: 200, left: 525, originX: 'center', originY: 'center' },
          
          { type: 'rect', width: 400, height: 1, fill: '#8B9B84', top: 250, left: 325 },
          
          // Ceremonia
          { type: 'i-text', text: 'Ceremonia Religiosa', fontSize: 18, fontFamily: 'Playfair Display', fill: '#2C4A3E', top: 320, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 16, fontFamily: 'Cormorant', fill: '#5C5C5C', top: 360, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 14, fontFamily: 'Cormorant', fill: '#6B7B67', top: 390, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{schedule}}', fontSize: 14, fontFamily: 'Cormorant', fill: '#6B7B67', top: 415, left: 525, originX: 'center', originY: 'center' },
          
          // Recepción
          { type: 'i-text', text: 'Recepción', fontSize: 18, fontFamily: 'Playfair Display', fill: '#2C4A3E', top: 520, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{banquetPlace}}', fontSize: 16, fontFamily: 'Cormorant', fill: '#5C5C5C', top: 560, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Cocktail, banquete y baile', fontSize: 14, fontFamily: 'Cormorant', fill: '#6B7B67', top: 590, left: 525, originX: 'center', originY: 'center' },
          
          // Dress Code
          { type: 'i-text', text: 'Etiqueta', fontSize: 18, fontFamily: 'Playfair Display', fill: '#2C4A3E', top: 700, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Se requiere traje formal', fontSize: 14, fontFamily: 'Cormorant', fill: '#5C5C5C', top: 740, left: 525, originX: 'center', originY: 'center' },
          
          // Confirmación
          { type: 'i-text', text: 'Confirmación', fontSize: 18, fontFamily: 'Playfair Display', fill: '#2C4A3E', top: 850, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Agradeceremos confirmar su asistencia', fontSize: 14, fontFamily: 'Cormorant', fill: '#5C5C5C', top: 890, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'antes del {{rsvpDate}}', fontSize: 14, fontFamily: 'Cormorant', fill: '#6B7B67', top: 920, left: 525, originX: 'center', originY: 'center' },
          
          // Nota final
          { type: 'rect', width: 700, height: 100, fill: '#E8E3D8', top: 1080, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Su presencia es el mejor obsequio', fontSize: 16, fontFamily: 'Playfair Display', fill: '#2C4A3E', fontStyle: 'italic', top: 1100, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'que podríamos recibir', fontSize: 16, fontFamily: 'Playfair Display', fill: '#2C4A3E', fontStyle: 'italic', top: 1135, left: 525, originX: 'center', originY: 'center' },
        ],
      },
    },
  },
  
  // 5. BOLD COLORS - Colores vibrantes modernos
  {
    id: 'bold-sunset-modern',
    name: 'Sunset Vibrante',
    category: 'invitation',
    style: 'bold-modern',
    sides: {
      front: {
        width: 1050,
        height: 1485,
        backgroundColor: '#FFFFFF',
        objects: [
          // Bloques de color vibrantes
          { type: 'rect', width: 1050, height: 400, fill: '#FF6B9D', top: 0, left: 0 },
          { type: 'rect', width: 1050, height: 300, fill: '#FFB84D', top: 400, left: 0 },
          { type: 'rect', width: 1050, height: 300, fill: '#A78BFA', top: 700, left: 0 },
          { type: 'rect', width: 1050, height: 485, fill: '#60D9BE', top: 1000, left: 0 },
          
          // Círculo blanco central
          { type: 'circle', radius: 280, fill: '#FFFFFF', top: 742.5, left: 525, originX: 'center', originY: 'center' },
          
          // Contenido en círculo
          { type: 'i-text', text: 'CELEBRA CON', fontSize: 14, fontFamily: 'Montserrat', fill: '#A78BFA', fontWeight: '700', letterSpacing: 200, top: 550, left: 525, originX: 'center', originY: 'center' },
          
          { type: 'i-text', text: '{{bride}}', fontSize: 44, fontFamily: 'Montserrat', fill: '#2C2C2C', fontWeight: '700', top: 650, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '+', fontSize: 36, fontFamily: 'Montserrat', fill: '#FF6B9D', fontWeight: '300', top: 710, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{groom}}', fontSize: 44, fontFamily: 'Montserrat', fill: '#2C2C2C', fontWeight: '700', top: 770, left: 525, originX: 'center', originY: 'center' },
          
          { type: 'i-text', text: '{{formattedDate}}', fontSize: 18, fontFamily: 'Lato', fill: '#6B6B6B', top: 860, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{schedule}}', fontSize: 16, fontFamily: 'Lato', fill: '#FFB84D', fontWeight: '600', top: 895, left: 525, originX: 'center', originY: 'center' },
        ],
      },
      back: {
        width: 1050,
        height: 1485,
        backgroundColor: '#FFFFFF',
        objects: [
          // Franjas de color lateral
          { type: 'rect', width: 50, height: 1485, fill: '#FF6B9D', top: 0, left: 0 },
          { type: 'rect', width: 50, height: 1485, fill: '#A78BFA', top: 0, left: 1000 },
          
          // Contenido
          { type: 'i-text', text: 'DETALLES', fontSize: 18, fontFamily: 'Montserrat', fill: '#2C2C2C', fontWeight: '700', letterSpacing: 250, top: 200, left: 525, originX: 'center', originY: 'center' },
          
          // Ceremonia con acento de color
          { type: 'rect', width: 8, height: 100, fill: '#FFB84D', top: 320, left: 250 },
          { type: 'i-text', text: 'CEREMONIA', fontSize: 16, fontFamily: 'Montserrat', fill: '#FFB84D', fontWeight: '700', top: 320, left: 280, originX: 'left', originY: 'top' },
          { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 18, fontFamily: 'Lato', fill: '#2C2C2C', top: 355, left: 280, originX: 'left', originY: 'top' },
          { type: 'i-text', text: '{{schedule}}', fontSize: 14, fontFamily: 'Lato', fill: '#6B6B6B', top: 390, left: 280, originX: 'left', originY: 'top' },
          
          // Fiesta
          { type: 'rect', width: 8, height: 100, fill: '#A78BFA', top: 520, left: 250 },
          { type: 'i-text', text: 'FIESTA', fontSize: 16, fontFamily: 'Montserrat', fill: '#A78BFA', fontWeight: '700', top: 520, left: 280, originX: 'left', originY: 'top' },
          { type: 'i-text', text: '{{banquetPlace}}', fontSize: 18, fontFamily: 'Lato', fill: '#2C2C2C', top: 555, left: 280, originX: 'left', originY: 'top' },
          { type: 'i-text', text: '¡Cena, baile y diversión!', fontSize: 14, fontFamily: 'Lato', fill: '#6B6B6B', top: 590, left: 280, originX: 'left', originY: 'top' },
          
          // Dress Code
          { type: 'rect', width: 8, height: 80, fill: '#60D9BE', top: 720, left: 250 },
          { type: 'i-text', text: 'DRESS CODE', fontSize: 16, fontFamily: 'Montserrat', fill: '#60D9BE', fontWeight: '700', top: 720, left: 280, originX: 'left', originY: 'top' },
          { type: 'i-text', text: 'Formal y colorido', fontSize: 14, fontFamily: 'Lato', fill: '#2C2C2C', top: 755, left: 280, originX: 'left', originY: 'top' },
          
          // RSVP
          { type: 'rect', width: 500, height: 150, fill: '#FF6B9D', opacity: 0.1, top: 920, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'CONFIRMA', fontSize: 22, fontFamily: 'Montserrat', fill: '#FF6B9D', fontWeight: '700', top: 930, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Antes del {{rsvpDate}}', fontSize: 16, fontFamily: 'Lato', fill: '#2C2C2C', top: 975, left: 525, originX: 'center', originY: 'center' },
          
          // Hashtag con color
          { type: 'i-text', text: '{{hashtag}}', fontSize: 20, fontFamily: 'Montserrat', fill: '#A78BFA', fontWeight: '600', top: 1200, left: 525, originX: 'center', originY: 'center' },
        ],
      },
    },
  },
];

// Función para procesar templates con datos y extraer cara específica
export const processDoubleSidedTemplate = (template, weddingData, side = 'front') => {
  if (!template.sides || !template.sides[side]) return null;
  
  const sideData = template.sides[side];
  const processedTemplate = {
    ...template,
    canvas: JSON.parse(JSON.stringify(sideData)), // Deep clone
  };
  
  if (!weddingData) return processedTemplate;
  
  // Extraer datos
  const brideInitial = weddingData.bride?.charAt(0) || 'M';
  const groomInitial = weddingData.groom?.charAt(0) || 'J';
  const rsvpDate = weddingData.rsvpDeadline ? formatRSVPDate(weddingData.rsvpDeadline) : '[Fecha RSVP]';
  
  const replacements = {
    '{{coupleName}}': weddingData.coupleName,
    '{{bride}}': weddingData.bride,
    '{{groom}}': weddingData.groom,
    '{{brideInitial}}': brideInitial,
    '{{groomInitial}}': groomInitial,
    '{{formattedDate}}': weddingData.formattedDate,
    '{{schedule}}': weddingData.schedule,
    '{{ceremonyPlace}}': weddingData.ceremonyPlace,
    '{{ceremonyAddress}}': weddingData.ceremonyAddress,
    '{{banquetPlace}}': weddingData.banquetPlace,
    '{{hashtag}}': weddingData.hashtag,
    '{{rsvpDate}}': rsvpDate,
  };
  
  // Aplicar reemplazos
  processedTemplate.canvas.objects = processedTemplate.canvas.objects.map(obj => {
    if (obj.text) {
      let newText = obj.text;
      Object.keys(replacements).forEach(key => {
        newText = newText.replace(key, replacements[key]);
      });
      return { ...obj, text: newText };
    }
    return obj;
  });
  
  return processedTemplate;
};

const formatRSVPDate = (dateString) => {
  if (!dateString) return '[Fecha RSVP]';
  try {
    const date = new Date(dateString);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${date.getDate()} de ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return '[Fecha RSVP]';
  }
};
