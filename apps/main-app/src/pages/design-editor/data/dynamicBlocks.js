/**
 * BLOQUES DINÁMICOS - Elementos que se llenan automáticamente con datos de InfoBoda
 * Similar al concepto de widgets en diseño web
 */

export const DYNAMIC_BLOCKS = [
  // BLOQUE 1: Nombres del Novio
  {
    id: 'block-groom-name',
    name: '👔 Nombre del Novio',
    category: 'names',
    icon: '👔',
    description: 'Nombre del novio desde InfoBoda',
    defaultStyle: 'elegant',
    generator: (weddingData) => ({
      type: 'i-text',
      text: weddingData?.groom || '[Novio]',
      fontSize: 100,
      fontFamily: 'Allura',
      fill: '#4A4A4A',
      left: 525,
      top: 300,
      originX: 'center',
      originY: 'center',
    }),
  },

  // BLOQUE 2: Nombres de la Novia
  {
    id: 'block-bride-name',
    name: '👰 Nombre de la Novia',
    category: 'names',
    icon: '👰',
    description: 'Nombre de la novia desde InfoBoda',
    defaultStyle: 'elegant',
    generator: (weddingData) => ({
      type: 'i-text',
      text: weddingData?.bride || '[Novia]',
      fontSize: 100,
      fontFamily: 'Allura',
      fill: '#4A4A4A',
      left: 525,
      top: 400,
      originX: 'center',
      originY: 'center',
    }),
  },

  // BLOQUE 3: Nombres de la Pareja
  {
    id: 'block-couple-names',
    name: '💑 Nombres de la Pareja',
    category: 'names',
    icon: '💑',
    description: 'Nombres completos de la pareja',
    defaultStyle: 'romantic',
    generator: (weddingData) => ({
      type: 'i-text',
      text: weddingData?.coupleName || '[Novia] & [Novio]',
      fontSize: 120,
      fontFamily: 'Allura',
      fill: '#6B5B4B',
      textAlign: 'center',
      left: 525,
      top: 400,
      originX: 'center',
      originY: 'center',
    }),
  },

  // BLOQUE 4: Fecha Completa
  {
    id: 'block-full-date',
    name: '📅 Fecha Completa',
    category: 'date',
    icon: '📅',
    description: 'Fecha completa de la boda',
    defaultStyle: 'formal',
    generator: (weddingData) => ({
      type: 'i-text',
      text: weddingData?.formattedDate || '[Fecha de la Boda]',
      fontSize: 48,
      fontFamily: 'Lato',
      fill: '#8B7355',
      left: 525,
      top: 700,
      originX: 'center',
      originY: 'center',
    }),
  },

  // BLOQUE 5: Día de la Semana
  {
    id: 'block-day-of-week',
    name: '📆 Día de la Semana',
    category: 'date',
    icon: '📆',
    description: 'Día de la semana (Sábado, Domingo, etc.)',
    defaultStyle: 'modern',
    generator: (weddingData) => {
      const dayOfWeek = weddingData?.weddingDate 
        ? ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'][new Date(weddingData.weddingDate).getDay()]
        : 'SÁBADO';
      
      return {
        type: 'i-text',
        text: dayOfWeek,
        fontSize: 52,
        fontFamily: 'Lato',
        fill: '#4A4A4A',
        letterSpacing: 80,
        fontWeight: '300',
        left: 525,
        top: 600,
        originX: 'center',
        originY: 'center',
      };
    },
  },

  // BLOQUE 6: Hora
  {
    id: 'block-time',
    name: '🕐 Hora de la Ceremonia',
    category: 'time',
    icon: '🕐',
    description: 'Hora de inicio de la ceremonia',
    defaultStyle: 'elegant',
    generator: (weddingData) => ({
      type: 'i-text',
      text: weddingData?.schedule || '[Hora]',
      fontSize: 56,
      fontFamily: 'Lato',
      fill: '#6B5B4B',
      fontWeight: 'bold',
      left: 525,
      top: 800,
      originX: 'center',
      originY: 'center',
    }),
  },

  // BLOQUE 7: Lugar de la Ceremonia
  {
    id: 'block-ceremony-venue',
    name: '⛪ Lugar de la Ceremonia',
    category: 'venue',
    icon: '⛪',
    description: 'Nombre del lugar de la ceremonia',
    defaultStyle: 'elegant',
    generator: (weddingData) => ({
      type: 'i-text',
      text: weddingData?.ceremonyPlace || '[Lugar de Ceremonia]',
      fontSize: 44,
      fontFamily: 'Lato',
      fill: '#8B7355',
      letterSpacing: 60,
      left: 525,
      top: 900,
      originX: 'center',
      originY: 'center',
    }),
  },

  // BLOQUE 8: Dirección de la Ceremonia
  {
    id: 'block-ceremony-address',
    name: '📍 Dirección de la Ceremonia',
    category: 'venue',
    icon: '📍',
    description: 'Dirección completa del lugar',
    defaultStyle: 'formal',
    generator: (weddingData) => ({
      type: 'i-text',
      text: weddingData?.ceremonyAddress || '[Dirección]',
      fontSize: 32,
      fontFamily: 'Lato',
      fill: '#A89584',
      textAlign: 'center',
      left: 525,
      top: 980,
      originX: 'center',
      originY: 'center',
    }),
  },

  // BLOQUE 9: Badge de Hora (circular)
  {
    id: 'block-time-badge',
    name: '⏰ Badge de Hora',
    category: 'time',
    icon: '⏰',
    description: 'Hora en badge circular decorativo',
    defaultStyle: 'elegant',
    generator: (weddingData) => [
      {
        type: 'circle',
        left: 525,
        top: 1050,
        radius: 90,
        fill: '#F5E6D3',
        stroke: '#D4AF37',
        strokeWidth: 4,
        originX: 'center',
        originY: 'center',
      },
      {
        type: 'i-text',
        text: weddingData?.schedule || '18:00',
        fontSize: 54,
        fontFamily: 'Lato',
        fill: '#6B5B4B',
        fontWeight: 'bold',
        left: 525,
        top: 1050,
        originX: 'center',
        originY: 'center',
      },
    ],
  },

  // BLOQUE 10: Encabezado "Nos Casamos"
  {
    id: 'block-header-married',
    name: '💍 Encabezado "Nos Casamos"',
    category: 'headers',
    icon: '💍',
    description: 'Título decorativo',
    defaultStyle: 'romantic',
    generator: () => ({
      type: 'i-text',
      text: 'NOS CASAMOS',
      fontSize: 48,
      fontFamily: 'Lato',
      fill: '#B08D6F',
      letterSpacing: 180,
      fontWeight: '300',
      left: 525,
      top: 150,
      originX: 'center',
      originY: 'center',
    }),
  },

  // BLOQUE 11: Mensaje de Invitación
  {
    id: 'block-invitation-message',
    name: '✉️ Mensaje de Invitación',
    category: 'messages',
    icon: '✉️',
    description: 'Mensaje estándar de invitación',
    defaultStyle: 'formal',
    generator: () => ({
      type: 'i-text',
      text: 'Con inmensa alegría invitamos a celebrar\nnuestro matrimonio',
      fontSize: 36,
      fontFamily: 'Lato',
      fill: '#A67982',
      textAlign: 'center',
      lineHeight: 1.7,
      fontStyle: 'italic',
      left: 525,
      top: 650,
      originX: 'center',
      originY: 'center',
    }),
  },

  // BLOQUE 12: Año Grande
  {
    id: 'block-year-large',
    name: '📅 Año Grande',
    category: 'date',
    icon: '📅',
    description: 'Año destacado en grande',
    defaultStyle: 'modern',
    generator: (weddingData) => ({
      type: 'i-text',
      text: weddingData?.year?.toString() || new Date().getFullYear().toString(),
      fontSize: 120,
      fontFamily: 'Cormorant Garamond',
      fill: '#B08D6F',
      fontWeight: 'bold',
      left: 525,
      top: 700,
      originX: 'center',
      originY: 'center',
    }),
  },

  // BLOQUE 13: Separador Dorado
  {
    id: 'block-divider-gold',
    name: '✨ Separador Dorado',
    category: 'decorative',
    icon: '✨',
    description: 'Línea decorativa dorada',
    defaultStyle: 'elegant',
    generator: () => ({
      type: 'rect',
      left: 350,
      top: 650,
      width: 350,
      height: 3,
      fill: '#D4AF37',
      stroke: null,
    }),
  },

  // BLOQUE 14: Marco Decorativo
  {
    id: 'block-frame-elegant',
    name: '🖼️ Marco Elegante',
    category: 'decorative',
    icon: '🖼️',
    description: 'Marco decorativo rectangular',
    defaultStyle: 'elegant',
    generator: () => ({
      type: 'rect',
      left: 175,
      top: 350,
      width: 700,
      height: 400,
      fill: 'transparent',
      stroke: '#E8C5A5',
      strokeWidth: 3,
    }),
  },
];

// Categorías de bloques
export const BLOCK_CATEGORIES = [
  { id: 'all', label: 'Todos', icon: '🎨' },
  { id: 'names', label: 'Nombres', icon: '💑' },
  { id: 'date', label: 'Fechas', icon: '📅' },
  { id: 'time', label: 'Horarios', icon: '🕐' },
  { id: 'venue', label: 'Lugares', icon: '⛪' },
  { id: 'headers', label: 'Encabezados', icon: '💍' },
  { id: 'messages', label: 'Mensajes', icon: '✉️' },
  { id: 'decorative', label: 'Decorativos', icon: '✨' },
];

export default DYNAMIC_BLOCKS;
