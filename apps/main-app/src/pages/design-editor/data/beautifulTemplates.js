/**
 * PLANTILLAS REALMENTE BONITAS - Diseño Profesional
 * 
 * Estas plantillas usan datos dinámicos de useWeddingData
 * Marcadores: {{coupleName}}, {{formattedDate}}, {{ceremonyPlace}}, etc.
 */

export const BEAUTIFUL_TEMPLATES = [
  // MINIMALISTAS ELEGANTES
  {
    id: 'minimal-elegant-white',
    name: 'Minimalista Blanco Elegante',
    category: 'invitation',
    style: 'minimal',
    thumbnail: '/templates/minimal-white.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFFFFF',
      objects: [
        // Líneas decorativas superiores
        { type: 'rect', width: 300, height: 1, fill: '#D4AF37', top: 80, left: 375, originX: 'center', originY: 'top' },
        
        // Nombres - tipografía grande y elegante
        { type: 'i-text', text: '{{bride}}', fontSize: 64, fontFamily: 'Cormorant', fill: '#2C2C2C', fontWeight: '300', top: 150, left: 525, originX: 'center', originY: 'top', letterSpacing: 50 },
        { type: 'i-text', text: '&', fontSize: 48, fontFamily: 'Cormorant', fill: '#D4AF37', fontStyle: 'italic', top: 235, left: 525, originX: 'center', originY: 'top' },
        { type: 'i-text', text: '{{groom}}', fontSize: 64, fontFamily: 'Cormorant', fill: '#2C2C2C', fontWeight: '300', top: 300, left: 525, originX: 'center', originY: 'top', letterSpacing: 50 },
        
        // Frase romántica
        { type: 'i-text', text: 'T E  E S P E R A M O S', fontSize: 18, fontFamily: 'Montserrat', fill: '#8B8B8B', top: 450, left: 525, originX: 'center', originY: 'center', letterSpacing: 200 },
        
        // Fecha - destacada
        { type: 'i-text', text: '{{formattedDate}}', fontSize: 32, fontFamily: 'Cormorant', fill: '#2C2C2C', top: 580, left: 525, originX: 'center', originY: 'center' },
        
        // Hora
        { type: 'i-text', text: '{{schedule}}', fontSize: 24, fontFamily: 'Montserrat', fill: '#D4AF37', fontWeight: '300', top: 650, left: 525, originX: 'center', originY: 'center' },
        
        // Lugar
        { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 28, fontFamily: 'Cormorant', fill: '#2C2C2C', top: 800, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 18, fontFamily: 'Montserrat', fill: '#8B8B8B', fontWeight: '300', top: 850, left: 525, originX: 'center', originY: 'center' },
        
        // Línea decorativa inferior
        { type: 'rect', width: 300, height: 1, fill: '#D4AF37', top: 950, left: 375, originX: 'center', originY: 'top' },
        
        // RSVP
        { type: 'i-text', text: 'R S V P', fontSize: 14, fontFamily: 'Montserrat', fill: '#8B8B8B', top: 1050, left: 525, originX: 'center', originY: 'center', letterSpacing: 300 },
      ],
    },
  },
  
  {
    id: 'minimal-sage-modern',
    name: 'Moderno Verde Salvia',
    category: 'invitation',
    style: 'minimal',
    thumbnail: '/templates/minimal-sage.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#F5F5F0',
      objects: [
        // Bloque de color superior
        { type: 'rect', width: 1050, height: 400, fill: '#9CAF88', top: 0, left: 0 },
        
        // Iniciales en círculo
        { type: 'circle', radius: 80, fill: '#FFFFFF', top: 320, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{brideInitial}} & {{groomInitial}}', fontSize: 42, fontFamily: 'Playfair Display', fill: '#9CAF88', fontWeight: 'bold', top: 320, left: 525, originX: 'center', originY: 'center' },
        
        // Nombres
        { type: 'i-text', text: '{{coupleName}}', fontSize: 48, fontFamily: 'Playfair Display', fill: '#2D3E2E', top: 520, left: 525, originX: 'center', originY: 'center' },
        
        // Subtítulo
        { type: 'i-text', text: 'Os invitan a celebrar su boda', fontSize: 16, fontFamily: 'Lato', fill: '#6B7B6B', top: 600, left: 525, originX: 'center', originY: 'center' },
        
        // Fecha grande
        { type: 'i-text', text: '{{day}}', fontSize: 72, fontFamily: 'Playfair Display', fill: '#9CAF88', fontWeight: 'bold', top: 720, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{monthYear}}', fontSize: 28, fontFamily: 'Lato', fill: '#2D3E2E', top: 810, left: 525, originX: 'center', originY: 'center' },
        
        // Detalles
        { type: 'i-text', text: '{{schedule}}', fontSize: 22, fontFamily: 'Lato', fill: '#6B7B6B', top: 920, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 24, fontFamily: 'Playfair Display', fill: '#2D3E2E', top: 1000, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 16, fontFamily: 'Lato', fill: '#6B7B6B', top: 1050, left: 525, originX: 'center', originY: 'center' },
        
        // Franja inferior
        { type: 'rect', width: 1050, height: 150, fill: '#9CAF88', top: 1335, left: 0 },
        { type: 'i-text', text: 'Confirma tu asistencia', fontSize: 14, fontFamily: 'Lato', fill: '#FFFFFF', top: 1410, left: 525, originX: 'center', originY: 'center' },
      ],
    },
  },
  
  {
    id: 'minimal-terracotta-boho',
    name: 'Boho Terracota Cálido',
    category: 'invitation',
    style: 'boho',
    thumbnail: '/templates/boho-terracotta.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFF8F0',
      objects: [
        // Arco decorativo
        { type: 'circle', radius: 200, fill: 'transparent', stroke: '#C97064', strokeWidth: 2, top: 100, left: 525, originX: 'center', originY: 'center', startAngle: 0, endAngle: 180 },
        
        // Nombres estilo script
        { type: 'i-text', text: '{{bride}}', fontSize: 58, fontFamily: 'Playfair Display', fill: '#C97064', fontStyle: 'italic', top: 280, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: 'y', fontSize: 32, fontFamily: 'Playfair Display', fill: '#8B6F47', fontStyle: 'italic', top: 355, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{groom}}', fontSize: 58, fontFamily: 'Playfair Display', fill: '#C97064', fontStyle: 'italic', top: 410, left: 525, originX: 'center', originY: 'center' },
        
        // Elementos decorativos (hojas)
        { type: 'i-text', text: '🌿', fontSize: 36, fontFamily: 'Arial', fill: '#8B6F47', top: 540, left: 300, originX: 'center', originY: 'center', angle: -25 },
        { type: 'i-text', text: '🌿', fontSize: 36, fontFamily: 'Arial', fill: '#8B6F47', top: 540, left: 750, originX: 'center', originY: 'center', angle: 25 },
        
        // Texto central
        { type: 'i-text', text: 'CELEBRAN SU UNIÓN', fontSize: 14, fontFamily: 'Montserrat', fill: '#8B6F47', letterSpacing: 200, top: 620, left: 525, originX: 'center', originY: 'center' },
        
        // Fecha
        { type: 'i-text', text: '{{formattedDate}}', fontSize: 28, fontFamily: 'Cormorant', fill: '#2C2416', top: 730, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: 'a las {{schedule}}', fontSize: 20, fontFamily: 'Montserrat', fill: '#8B6F47', fontWeight: '300', top: 780, left: 525, originX: 'center', originY: 'center' },
        
        // Lugar con marco
        { type: 'rect', width: 600, height: 180, fill: 'transparent', stroke: '#C97064', strokeWidth: 1, top: 900, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 26, fontFamily: 'Playfair Display', fill: '#C97064', top: 950, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 16, fontFamily: 'Montserrat', fill: '#8B6F47', top: 1000, left: 525, originX: 'center', originY: 'center' },
        
        // Nota inferior
        { type: 'i-text', text: 'Tu presencia es nuestro mejor regalo', fontSize: 14, fontFamily: 'Playfair Display', fill: '#8B6F47', fontStyle: 'italic', top: 1250, left: 525, originX: 'center', originY: 'center' },
      ],
    },
  },
  
  {
    id: 'elegant-navy-gold',
    name: 'Elegante Azul Marino y Oro',
    category: 'invitation',
    style: 'elegant',
    thumbnail: '/templates/navy-gold.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#1A2332',
      objects: [
        // Marco dorado
        { type: 'rect', width: 950, height: 1385, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 3, top: 50, left: 525, originX: 'center', originY: 'top' },
        { type: 'rect', width: 900, height: 1335, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 1, top: 75, left: 525, originX: 'center', originY: 'top' },
        
        // Ornamento superior
        { type: 'i-text', text: '◈', fontSize: 48, fontFamily: 'Arial', fill: '#D4AF37', top: 150, left: 525, originX: 'center', originY: 'center' },
        
        // Texto de boda
        { type: 'i-text', text: 'NUESTRA BODA', fontSize: 16, fontFamily: 'Montserrat', fill: '#D4AF37', letterSpacing: 300, top: 240, left: 525, originX: 'center', originY: 'center' },
        
        // Nombres
        { type: 'i-text', text: '{{bride}}', fontSize: 56, fontFamily: 'Playfair Display', fill: '#FFFFFF', top: 340, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '&', fontSize: 44, fontFamily: 'Playfair Display', fill: '#D4AF37', fontStyle: 'italic', top: 415, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{groom}}', fontSize: 56, fontFamily: 'Playfair Display', fill: '#FFFFFF', top: 480, left: 525, originX: 'center', originY: 'center' },
        
        // Línea decorativa
        { type: 'rect', width: 400, height: 2, fill: '#D4AF37', top: 600, left: 525, originX: 'center', originY: 'center' },
        
        // Texto de celebración
        { type: 'i-text', text: 'Tienen el honor de invitarle a', fontSize: 18, fontFamily: 'Cormorant', fill: '#E8E8E8', fontStyle: 'italic', top: 680, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: 'la celebración de su matrimonio', fontSize: 18, fontFamily: 'Cormorant', fill: '#E8E8E8', fontStyle: 'italic', top: 715, left: 525, originX: 'center', originY: 'center' },
        
        // Fecha
        { type: 'i-text', text: '{{formattedDate}}', fontSize: 32, fontFamily: 'Playfair Display', fill: '#D4AF37', top: 820, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{schedule}}', fontSize: 24, fontFamily: 'Montserrat', fill: '#FFFFFF', fontWeight: '300', top: 880, left: 525, originX: 'center', originY: 'center' },
        
        // Lugar
        { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 26, fontFamily: 'Playfair Display', fill: '#FFFFFF', top: 1000, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 18, fontFamily: 'Montserrat', fill: '#C0C0C0', fontWeight: '300', top: 1050, left: 525, originX: 'center', originY: 'center' },
        
        // Ornamento inferior
        { type: 'i-text', text: '◈', fontSize: 48, fontFamily: 'Arial', fill: '#D4AF37', top: 1250, left: 525, originX: 'center', originY: 'center' },
        
        // RSVP
        { type: 'i-text', text: 'Se ruega confirmación', fontSize: 14, fontFamily: 'Montserrat', fill: '#D4AF37', top: 1350, left: 525, originX: 'center', originY: 'center' },
      ],
    },
  },
  
  {
    id: 'romantic-blush-rose',
    name: 'Romántico Rosa Empolvado',
    category: 'invitation',
    style: 'romantic',
    thumbnail: '/templates/blush-rose.svg',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFF5F7',
      objects: [
        // Acuarela simulada (rectángulos con opacidad)
        { type: 'rect', width: 400, height: 300, fill: '#F4C2C2', opacity: 0.3, top: 50, left: 100, angle: -5 },
        { type: 'rect', width: 350, height: 280, fill: '#E8B4B8', opacity: 0.25, top: 1100, left: 600, angle: 5 },
        
        // Flores decorativas
        { type: 'i-text', text: '🌸', fontSize: 48, fontFamily: 'Arial', fill: '#D4A5A5', top: 100, left: 150, angle: -20 },
        { type: 'i-text', text: '🌸', fontSize: 42, fontFamily: 'Arial', fill: '#D4A5A5', top: 1200, left: 850, angle: 15 },
        
        // Iniciales entrelazadas
        { type: 'i-text', text: '{{brideInitial}}{{groomInitial}}', fontSize: 120, fontFamily: 'Playfair Display', fill: '#C89595', fontStyle: 'italic', opacity: 0.15, top: 600, left: 525, originX: 'center', originY: 'center' },
        
        // Nombres principales
        { type: 'i-text', text: '{{bride}}', fontSize: 52, fontFamily: 'Playfair Display', fill: '#8B6B6B', fontStyle: 'italic', top: 420, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{groom}}', fontSize: 52, fontFamily: 'Playfair Display', fill: '#8B6B6B', fontStyle: 'italic', top: 495, left: 525, originX: 'center', originY: 'center' },
        
        // Texto romántico
        { type: 'i-text', text: '~ Dos almas, un corazón ~', fontSize: 16, fontFamily: 'Cormorant', fill: '#A98585', fontStyle: 'italic', top: 600, left: 525, originX: 'center', originY: 'center' },
        
        // Fecha con marco suave
        { type: 'rect', width: 500, height: 100, fill: '#F4C2C2', opacity: 0.2, top: 720, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{formattedDate}}', fontSize: 30, fontFamily: 'Cormorant', fill: '#8B6B6B', top: 750, left: 525, originX: 'center', originY: 'center' },
        
        // Hora
        { type: 'i-text', text: '{{schedule}}', fontSize: 22, fontFamily: 'Lato', fill: '#A98585', top: 860, left: 525, originX: 'center', originY: 'center' },
        
        // Lugar
        { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 26, fontFamily: 'Playfair Display', fill: '#8B6B6B', top: 980, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 18, fontFamily: 'Lato', fill: '#A98585', top: 1030, left: 525, originX: 'center', originY: 'center' },
        
        // Mensaje final
        { type: 'i-text', text: 'Celebra con nosotros este día tan especial', fontSize: 16, fontFamily: 'Cormorant', fill: '#A98585', fontStyle: 'italic', top: 1200, left: 525, originX: 'center', originY: 'center' },
      ],
    },
  },
  
  // CLÁSICOS SOFISTICADOS
  {
    id: 'classic-burgundy-elegant',
    name: 'Clásico Borgoña Elegante',
    category: 'invitation',
    style: 'classic',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFF9F5',
      objects: [
        // Borde borgoña
        { type: 'rect', width: 1000, height: 1435, fill: 'transparent', stroke: '#85182A', strokeWidth: 2, top: 25, left: 525, originX: 'center', originY: 'top' },
        { type: 'rect', width: 960, height: 1395, fill: 'transparent', stroke: '#85182A', strokeWidth: 1, top: 45, left: 525, originX: 'center', originY: 'top' },
        
        // Monograma
        { type: 'circle', radius: 60, fill: '#85182A', top: 150, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{brideInitial}}&{{groomInitial}}', fontSize: 36, fontFamily: 'Playfair Display', fill: '#FFFFFF', fontWeight: 'bold', top: 150, left: 525, originX: 'center', originY: 'center' },
        
        // Nombres con estilo clásico
        { type: 'i-text', text: '{{bride}} y {{groom}}', fontSize: 44, fontFamily: 'Playfair Display', fill: '#85182A', top: 300, left: 525, originX: 'center', originY: 'center' },
        
        // Texto formal
        { type: 'i-text', text: 'Junto a sus familias', fontSize: 18, fontFamily: 'Cormorant', fill: '#5C5C5C', top: 380, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: 'tienen el honor de invitarle', fontSize: 18, fontFamily: 'Cormorant', fill: '#5C5C5C', top: 410, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: 'a la ceremonia de su enlace matrimonial', fontSize: 18, fontFamily: 'Cormorant', fill: '#5C5C5C', top: 440, left: 525, originX: 'center', originY: 'center' },
        
        // Detalles
        { type: 'rect', width: 600, height: 300, fill: '#F5E6E8', top: 570, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{formattedDate}}', fontSize: 32, fontFamily: 'Playfair Display', fill: '#85182A', top: 630, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{schedule}}', fontSize: 24, fontFamily: 'Cormorant', fill: '#5C5C5C', top: 690, left: 525, originX: 'center', originY: 'center' },
        { type: 'rect', width: 400, height: 1, fill: '#85182A', top: 750, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 26, fontFamily: 'Playfair Display', fill: '#85182A', top: 800, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 18, fontFamily: 'Cormorant', fill: '#5C5C5C', top: 850, left: 525, originX: 'center', originY: 'center' },
        
        // Código de vestimenta
        { type: 'i-text', text: 'ETIQUETA', fontSize: 14, fontFamily: 'Montserrat', fill: '#85182A', letterSpacing: 250, top: 1100, left: 525, originX: 'center', originY: 'center' },
        
        // RSVP formal
        { type: 'i-text', text: 'Se ruega confirmación de asistencia', fontSize: 14, fontFamily: 'Cormorant', fill: '#5C5C5C', top: 1250, left: 525, originX: 'center', originY: 'center' },
      ],
    },
  },
  
  {
    id: 'modern-geometric-black',
    name: 'Moderno Geométrico Negro',
    category: 'invitation',
    style: 'modern',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFFFFF',
      objects: [
        // Formas geométricas decorativas
        { type: 'rect', width: 200, height: 200, fill: '#000000', top: 0, left: 0, angle: 45 },
        { type: 'rect', width: 150, height: 150, fill: '#D4AF37', top: 1335, left: 900, angle: 45 },
        
        // Líneas decorativas
        { type: 'rect', width: 600, height: 3, fill: '#000000', top: 200, left: 225 },
        { type: 'rect', width: 600, height: 1, fill: '#D4AF37', top: 210, left: 225 },
        
        // Nombres modernos
        { type: 'i-text', text: '{{bride}}', fontSize: 62, fontFamily: 'Montserrat', fill: '#000000', fontWeight: '700', top: 300, left: 525, originX: 'center', originY: 'center', letterSpacing: 100 },
        { type: 'i-text', text: '+', fontSize: 48, fontFamily: 'Montserrat', fill: '#D4AF37', fontWeight: '300', top: 380, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{groom}}', fontSize: 62, fontFamily: 'Montserrat', fill: '#000000', fontWeight: '700', top: 450, left: 525, originX: 'center', originY: 'center', letterSpacing: 100 },
        
        // Año destacado
        { type: 'i-text', text: '{{year}}', fontSize: 120, fontFamily: 'Montserrat', fill: '#F5F5F5', fontWeight: '900', top: 600, left: 525, originX: 'center', originY: 'center' },
        
        // Detalles en caja
        { type: 'rect', width: 700, height: 250, fill: 'transparent', stroke: '#000000', strokeWidth: 2, top: 800, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{formattedDate}}', fontSize: 28, fontFamily: 'Montserrat', fill: '#000000', fontWeight: '500', top: 850, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{schedule}}', fontSize: 22, fontFamily: 'Montserrat', fill: '#D4AF37', fontWeight: '400', top: 900, left: 525, originX: 'center', originY: 'center' },
        { type: 'rect', width: 500, height: 1, fill: '#D4AF37', top: 950, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 24, fontFamily: 'Montserrat', fill: '#000000', fontWeight: '600', top: 990, left: 525, originX: 'center', originY: 'center' },
        
        // RSVP minimalista
        { type: 'i-text', text: 'RSVP', fontSize: 16, fontFamily: 'Montserrat', fill: '#000000', fontWeight: '700', letterSpacing: 400, top: 1200, left: 525, originX: 'center', originY: 'center' },
      ],
    },
  },
  
  {
    id: 'garden-floral-spring',
    name: 'Jardín Floral Primavera',
    category: 'invitation',
    style: 'floral',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FDFAF6',
      objects: [
        // Elementos florales
        { type: 'i-text', text: '🌺', fontSize: 56, fontFamily: 'Arial', fill: '#E89CAE', top: 80, left: 200, angle: -15 },
        { type: 'i-text', text: '🌸', fontSize: 48, fontFamily: 'Arial', fill: '#F4B4C4', top: 150, left: 850, angle: 10 },
        { type: 'i-text', text: '🌿', fontSize: 42, fontFamily: 'Arial', fill: '#8FAF7A', top: 120, left: 100, angle: -25 },
        { type: 'i-text', text: '🌿', fontSize: 42, fontFamily: 'Arial', fill: '#8FAF7A', top: 1300, left: 900, angle: 25 },
        { type: 'i-text', text: '🌺', fontSize: 52, fontFamily: 'Arial', fill: '#E89CAE', top: 1350, left: 120, angle: 20 },
        
        // Título decorativo
        { type: 'i-text', text: '~ Celebremos juntos ~', fontSize: 18, fontFamily: 'Cormorant', fill: '#8FAF7A', fontStyle: 'italic', top: 250, left: 525, originX: 'center', originY: 'center' },
        
        // Nombres con flores
        { type: 'i-text', text: '{{bride}}', fontSize: 54, fontFamily: 'Playfair Display', fill: '#5C5C5C', fontStyle: 'italic', top: 350, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '💐', fontSize: 32, fontFamily: 'Arial', fill: '#E89CAE', top: 425, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{groom}}', fontSize: 54, fontFamily: 'Playfair Display', fill: '#5C5C5C', fontStyle: 'italic', top: 490, left: 525, originX: 'center', originY: 'center' },
        
        // Marco floral para detalles
        { type: 'rect', width: 650, height: 280, fill: 'transparent', stroke: '#8FAF7A', strokeWidth: 1, strokeDashArray: [5, 5], top: 650, left: 525, originX: 'center', originY: 'center' },
        
        // Detalles
        { type: 'i-text', text: 'Nos casamos', fontSize: 20, fontFamily: 'Cormorant', fill: '#8FAF7A', top: 680, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{formattedDate}}', fontSize: 30, fontFamily: 'Playfair Display', fill: '#5C5C5C', top: 730, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: 'a las {{schedule}}', fontSize: 20, fontFamily: 'Cormorant', fill: '#8FAF7A', top: 780, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 24, fontFamily: 'Playfair Display', fill: '#5C5C5C', top: 840, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 16, fontFamily: 'Lato', fill: '#8FAF7A', top: 885, left: 525, originX: 'center', originY: 'center' },
        
        // Mensaje final
        { type: 'i-text', text: 'Será un día lleno de amor y alegría', fontSize: 16, fontFamily: 'Cormorant', fill: '#8FAF7A', fontStyle: 'italic', top: 1100, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: 'Tu presencia lo hará aún más especial', fontSize: 16, fontFamily: 'Cormorant', fill: '#8FAF7A', fontStyle: 'italic', top: 1135, left: 525, originX: 'center', originY: 'center' },
      ],
    },
  },
  
  {
    id: 'rustic-kraft-vintage',
    name: 'Rústico Kraft Vintage',
    category: 'invitation',
    style: 'rustic',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#D2B48C',
      objects: [
        // Textura simulada con rectángulos
        { type: 'rect', width: 1050, height: 200, fill: '#C19A6B', opacity: 0.3, top: 0, left: 0 },
        { type: 'rect', width: 1050, height: 180, fill: '#C19A6B', opacity: 0.25, top: 1305, left: 0 },
        
        // Cuerda decorativa
        { type: 'rect', width: 800, height: 3, fill: '#8B7355', top: 180, left: 525, originX: 'center', originY: 'center' },
        
        // Etiqueta vintage
        { type: 'rect', width: 700, height: 850, fill: '#F5F5DC', top: 280, left: 525, originX: 'center', originY: 'center' },
        { type: 'rect', width: 660, height: 810, fill: 'transparent', stroke: '#8B7355', strokeWidth: 2, strokeDashArray: [10, 5], top: 280, left: 525, originX: 'center', originY: 'center' },
        
        // Sello vintage
        { type: 'circle', radius: 50, fill: 'transparent', stroke: '#8B7355', strokeWidth: 3, top: 100, left: 850, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{year}}', fontSize: 20, fontFamily: 'Courier', fill: '#8B7355', fontWeight: 'bold', top: 100, left: 850, originX: 'center', originY: 'center' },
        
        // Nombres estilo vintage
        { type: 'i-text', text: '{{bride}} & {{groom}}', fontSize: 46, fontFamily: 'Playfair Display', fill: '#5C4033', top: 380, left: 525, originX: 'center', originY: 'center' },
        
        // Línea decorativa
        { type: 'i-text', text: '~~~~~~~~', fontSize: 24, fontFamily: 'Arial', fill: '#8B7355', top: 460, left: 525, originX: 'center', originY: 'center' },
        
        // Texto vintage
        { type: 'i-text', text: 'Os invitan a compartir', fontSize: 18, fontFamily: 'Cormorant', fill: '#5C4033', top: 540, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: 'la alegría de su boda', fontSize: 18, fontFamily: 'Cormorant', fill: '#5C4033', top: 570, left: 525, originX: 'center', originY: 'center' },
        
        // Fecha destacada
        { type: 'i-text', text: '{{formattedDate}}', fontSize: 28, fontFamily: 'Playfair Display', fill: '#8B7355', top: 670, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{schedule}}', fontSize: 22, fontFamily: 'Cormorant', fill: '#5C4033', top: 720, left: 525, originX: 'center', originY: 'center' },
        
        // Lugar
        { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 24, fontFamily: 'Playfair Display', fill: '#5C4033', top: 820, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 16, fontFamily: 'Cormorant', fill: '#8B7355', top: 865, left: 525, originX: 'center', originY: 'center' },
        
        // Decoración inferior
        { type: 'i-text', text: '~~~~~~~~', fontSize: 24, fontFamily: 'Arial', fill: '#8B7355', top: 970, left: 525, originX: 'center', originY: 'center' },
        
        // Nota final
        { type: 'i-text', text: 'Celebración y cena a continuación', fontSize: 14, fontFamily: 'Cormorant', fill: '#5C4033', top: 1050, left: 525, originX: 'center', originY: 'center' },
      ],
    },
  },
  
  {
    id: 'luxury-marble-gold',
    name: 'Lujo Mármol y Oro',
    category: 'invitation',
    style: 'luxury',
    canvas: {
      width: 1050,
      height: 1485,
      backgroundColor: '#F8F8F8',
      objects: [
        // Efecto mármol simulado
        { type: 'rect', width: 1050, height: 400, fill: '#E8E8E8', opacity: 0.5, top: 0, left: 0 },
        { type: 'rect', width: 900, height: 300, fill: '#D8D8D8', opacity: 0.3, top: 1185, left: 75 },
        
        // Marcos dorados
        { type: 'rect', width: 950, height: 1385, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 4, top: 50, left: 525, originX: 'center', originY: 'top' },
        { type: 'rect', width: 890, height: 1325, fill: 'transparent', stroke: '#D4AF37', strokeWidth: 1, top: 80, left: 525, originX: 'center', originY: 'top' },
        
        // Ornamento dorado superior
        { type: 'i-text', text: '◆', fontSize: 40, fontFamily: 'Arial', fill: '#D4AF37', top: 180, left: 525, originX: 'center', originY: 'center' },
        { type: 'rect', width: 250, height: 2, fill: '#D4AF37', top: 220, left: 350 },
        { type: 'rect', width: 250, height: 2, fill: '#D4AF37', top: 220, left: 550 },
        
        // Invitación
        { type: 'i-text', text: 'LE INVITAN A', fontSize: 16, fontFamily: 'Montserrat', fill: '#666666', letterSpacing: 300, top: 280, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: 'SU ENLACE NUPCIAL', fontSize: 16, fontFamily: 'Montserrat', fill: '#666666', letterSpacing: 250, top: 315, left: 525, originX: 'center', originY: 'center' },
        
        // Nombres luxury
        { type: 'i-text', text: '{{bride}}', fontSize: 58, fontFamily: 'Playfair Display', fill: '#1A1A1A', fontWeight: '400', top: 420, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '&', fontSize: 42, fontFamily: 'Playfair Display', fill: '#D4AF37', fontStyle: 'italic', top: 495, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{groom}}', fontSize: 58, fontFamily: 'Playfair Display', fill: '#1A1A1A', fontWeight: '400', top: 560, left: 525, originX: 'center', originY: 'center' },
        
        // Detalles con fondo dorado
        { type: 'rect', width: 700, height: 300, fill: '#D4AF37', opacity: 0.1, top: 750, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{formattedDate}}', fontSize: 34, fontFamily: 'Playfair Display', fill: '#1A1A1A', top: 800, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{schedule}}', fontSize: 26, fontFamily: 'Montserrat', fill: '#666666', fontWeight: '300', top: 860, left: 525, originX: 'center', originY: 'center' },
        { type: 'rect', width: 450, height: 2, fill: '#D4AF37', top: 920, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 28, fontFamily: 'Playfair Display', fill: '#1A1A1A', top: 970, left: 525, originX: 'center', originY: 'center' },
        { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 18, fontFamily: 'Montserrat', fill: '#666666', fontWeight: '300', top: 1020, left: 525, originX: 'center', originY: 'center' },
        
        // Ornamento inferior
        { type: 'rect', width: 250, height: 2, fill: '#D4AF37', top: 1250, left: 350 },
        { type: 'rect', width: 250, height: 2, fill: '#D4AF37', top: 1250, left: 550 },
        { type: 'i-text', text: '◆', fontSize: 40, fontFamily: 'Arial', fill: '#D4AF37', top: 1230, left: 525, originX: 'center', originY: 'center' },
        
        // RSVP elegante
        { type: 'i-text', text: 'SE RUEGA CONFIRMACIÓN', fontSize: 12, fontFamily: 'Montserrat', fill: '#666666', letterSpacing: 200, top: 1340, left: 525, originX: 'center', originY: 'center' },
      ],
    },
  },
];

// Función para procesar templates con datos reales
export const processTemplateWithData = (template, weddingData) => {
  if (!weddingData) return template;
  
  const processedTemplate = JSON.parse(JSON.stringify(template)); // Deep clone
  
  // Extraer iniciales
  const brideInitial = weddingData.bride?.charAt(0) || 'M';
  const groomInitial = weddingData.groom?.charAt(0) || 'J';
  
  // Extraer día y mes/año
  const day = weddingData.weddingDate ? new Date(weddingData.weddingDate).getDate() : '15';
  const monthYear = weddingData.formattedDate?.split(' de ')?.slice(1).join(' de ') || 'Junio 2024';
  
  // Reemplazos
  const replacements = {
    '{{coupleName}}': weddingData.coupleName,
    '{{bride}}': weddingData.bride,
    '{{groom}}': weddingData.groom,
    '{{brideInitial}}': brideInitial,
    '{{groomInitial}}': groomInitial,
    '{{formattedDate}}': weddingData.formattedDate,
    '{{day}}': day.toString(),
    '{{monthYear}}': monthYear,
    '{{schedule}}': weddingData.schedule,
    '{{year}}': weddingData.year.toString(),
    '{{ceremonyPlace}}': weddingData.ceremonyPlace,
    '{{ceremonyAddress}}': weddingData.ceremonyAddress,
    '{{banquetPlace}}': weddingData.banquetPlace,
    '{{hashtag}}': weddingData.hashtag,
  };
  
  // Aplicar reemplazos a todos los objetos de texto
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
