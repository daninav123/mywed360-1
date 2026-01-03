/**
 * PLANTILLAS PREMIUM - DISEÑOS PROFESIONALES DE ALTA CALIDAD
 * 
 * Usando la biblioteca completa de assets decorativos
 * Inspiradas en diseños de invitaciones reales de $200+
 */

import { FLORAL_ELEMENTS, ORNAMENTS, WEDDING_ICONS, SPECIAL_DECORATIONS, FRAMES } from './designAssets';

export const PREMIUM_TEMPLATES = [
  // 1. BOTANICAL GARDEN - Jardín Botánico Elegante
  {
    id: 'botanical-garden-luxury',
    name: 'Jardín Botánico de Lujo',
    category: 'invitation',
    style: 'botanical-luxury',
    description: 'Diseño elegante con elementos botánicos detallados',
    sides: {
      front: {
        width: 1050,
        height: 1485,
        backgroundColor: '#FDFDFB',
        objects: [
          // Marco doble elegante
          { type: 'rect', width: 980, height: 1415, fill: 'transparent', stroke: '#7A9B76', strokeWidth: 2, top: 35, left: 35, rx: 3 },
          { type: 'rect', width: 940, height: 1375, fill: 'transparent', stroke: '#A5C9A1', strokeWidth: 1, top: 55, left: 55, rx: 3 },
          
          // Eucalyptus superior izquierdo
          { type: 'path', path: 'M 100,80 Q 120,110 135,145 Q 150,180 160,220', stroke: '#7A9B76', strokeWidth: 2.5, fill: 'transparent' },
          { type: 'ellipse', rx: 9, ry: 14, fill: '#A5C9A1', opacity: 0.85, top: 90, left: 108, angle: -25 },
          { type: 'ellipse', rx: 8, ry: 13, fill: '#A5C9A1', opacity: 0.85, top: 115, left: 122, angle: 15 },
          { type: 'ellipse', rx: 10, ry: 15, fill: '#A5C9A1', opacity: 0.85, top: 140, left: 133, angle: -10 },
          { type: 'ellipse', rx: 9, ry: 14, fill: '#A5C9A1', opacity: 0.85, top: 170, left: 146, angle: 20 },
          { type: 'ellipse', rx: 8, ry: 12, fill: '#A5C9A1', opacity: 0.85, top: 195, left: 156, angle: -15 },
          { type: 'ellipse', rx: 7, ry: 11, fill: '#A5C9A1', opacity: 0.85, top: 215, left: 159, angle: 10 },
          
          // Eucalyptus superior derecho (espejo)
          { type: 'path', path: 'M 950,80 Q 930,110 915,145 Q 900,180 890,220', stroke: '#7A9B76', strokeWidth: 2.5, fill: 'transparent' },
          { type: 'ellipse', rx: 9, ry: 14, fill: '#A5C9A1', opacity: 0.85, top: 90, left: 942, angle: 25 },
          { type: 'ellipse', rx: 8, ry: 13, fill: '#A5C9A1', opacity: 0.85, top: 115, left: 928, angle: -15 },
          { type: 'ellipse', rx: 10, ry: 15, fill: '#A5C9A1', opacity: 0.85, top: 140, left: 917, angle: 10 },
          { type: 'ellipse', rx: 9, ry: 14, fill: '#A5C9A1', opacity: 0.85, top: 170, left: 904, angle: -20 },
          { type: 'ellipse', rx: 8, ry: 12, fill: '#A5C9A1', opacity: 0.85, top: 195, left: 894, angle: 15 },
          { type: 'ellipse', rx: 7, ry: 11, fill: '#A5C9A1', opacity: 0.85, top: 215, left: 891, angle: -10 },
          
          // Flores decorativas pequeñas
          { type: 'circle', radius: 12, fill: '#E8E3D8', opacity: 0.6, top: 120, left: 180 },
          { type: 'circle', radius: 8, fill: '#D4D0C5', opacity: 0.7, top: 122, left: 182 },
          { type: 'circle', radius: 4, fill: '#B8B4A9', top: 124, left: 184 },
          
          { type: 'circle', radius: 12, fill: '#E8E3D8', opacity: 0.6, top: 120, left: 870 },
          { type: 'circle', radius: 8, fill: '#D4D0C5', opacity: 0.7, top: 122, left: 868 },
          { type: 'circle', radius: 4, fill: '#B8B4A9', top: 124, left: 866 },
          
          // Monograma en círculo superior
          { type: 'circle', radius: 65, fill: '#FFFFFF', stroke: '#7A9B76', strokeWidth: 2, top: 320, left: 525, originX: 'center', originY: 'center' },
          { type: 'circle', radius: 60, fill: 'transparent', stroke: '#A5C9A1', strokeWidth: 1, top: 320, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{brideInitial}}', fontSize: 40, fontFamily: 'Playfair Display', fill: '#7A9B76', fontWeight: '600', top: 320, left: 505, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '&', fontSize: 24, fontFamily: 'Playfair Display', fill: '#A5C9A1', fontStyle: 'italic', top: 320, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{groomInitial}}', fontSize: 40, fontFamily: 'Playfair Display', fill: '#7A9B76', fontWeight: '600', top: 320, left: 545, originX: 'center', originY: 'center' },
          
          // Texto: "Invitan a celebrar su boda"
          { type: 'i-text', text: 'INVITAN A CELEBRAR SU BODA', fontSize: 11, fontFamily: 'Montserrat', fill: '#8B9B84', letterSpacing: 180, fontWeight: '500', top: 450, left: 525, originX: 'center', originY: 'center' },
          
          // Nombres principales
          { type: 'i-text', text: '{{bride}}', fontSize: 52, fontFamily: 'Cormorant Garamond', fill: '#3D4A3B', fontWeight: '300', letterSpacing: 30, top: 560, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '&', fontSize: 32, fontFamily: 'Cormorant Garamond', fill: '#7A9B76', fontStyle: 'italic', top: 630, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{groom}}', fontSize: 52, fontFamily: 'Cormorant Garamond', fill: '#3D4A3B', fontWeight: '300', letterSpacing: 30, top: 690, left: 525, originX: 'center', originY: 'center' },
          
          // Divisor ornamental
          { type: 'rect', width: 60, height: 1, fill: '#A5C9A1', top: 790, left: 425 },
          { type: 'circle', radius: 6, fill: 'transparent', stroke: '#7A9B76', strokeWidth: 1, top: 790, left: 525, originX: 'center', originY: 'center' },
          { type: 'circle', radius: 2, fill: '#7A9B76', top: 790, left: 525, originX: 'center', originY: 'center' },
          { type: 'rect', width: 60, height: 1, fill: '#A5C9A1', top: 790, left: 565 },
          
          // Fecha
          { type: 'i-text', text: '{{formattedDate}}', fontSize: 30, fontFamily: 'Cormorant Garamond', fill: '#3D4A3B', fontWeight: '400', top: 900, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{schedule}}', fontSize: 22, fontFamily: 'Lato', fill: '#7A9B76', fontWeight: '300', top: 955, left: 525, originX: 'center', originY: 'center' },
          
          // Lugar
          { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 24, fontFamily: 'Cormorant Garamond', fill: '#3D4A3B', fontWeight: '400', top: 1070, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 16, fontFamily: 'Lato', fill: '#6B7B67', fontWeight: '300', top: 1115, left: 525, originX: 'center', originY: 'center' },
          
          // Eucalyptus inferior
          { type: 'path', path: 'M 160,1280 Q 180,1310 195,1345 Q 210,1380 220,1420', stroke: '#7A9B76', strokeWidth: 2, fill: 'transparent' },
          { type: 'ellipse', rx: 8, ry: 12, fill: '#A5C9A1', opacity: 0.8, top: 1290, left: 168, angle: -20 },
          { type: 'ellipse', rx: 7, ry: 11, fill: '#A5C9A1', opacity: 0.8, top: 1315, left: 182, angle: 15 },
          { type: 'ellipse', rx: 9, ry: 13, fill: '#A5C9A1', opacity: 0.8, top: 1340, left: 193, angle: -10 },
          
          { type: 'path', path: 'M 890,1280 Q 870,1310 855,1345 Q 840,1380 830,1420', stroke: '#7A9B76', strokeWidth: 2, fill: 'transparent' },
          { type: 'ellipse', rx: 8, ry: 12, fill: '#A5C9A1', opacity: 0.8, top: 1290, left: 882, angle: 20 },
          { type: 'ellipse', rx: 7, ry: 11, fill: '#A5C9A1', opacity: 0.8, top: 1315, left: 868, angle: -15 },
          { type: 'ellipse', rx: 9, ry: 13, fill: '#A5C9A1', opacity: 0.8, top: 1340, left: 857, angle: 10 },
        ],
      },
      back: {
        width: 1050,
        height: 1485,
        backgroundColor: '#F8FAF7',
        objects: [
          // Marco
          { type: 'rect', width: 980, height: 1415, fill: 'transparent', stroke: '#7A9B76', strokeWidth: 2, top: 35, left: 35, rx: 3 },
          
          // Título
          { type: 'i-text', text: 'DETALLES DE LA CELEBRACIÓN', fontSize: 13, fontFamily: 'Montserrat', fill: '#7A9B76', letterSpacing: 160, fontWeight: '500', top: 180, left: 525, originX: 'center', originY: 'center' },
          
          { type: 'rect', width: 500, height: 1, fill: '#A5C9A1', top: 230, left: 275 },
          
          // Iconos y detalles
          // Ceremonia
          { type: 'circle', radius: 20, fill: '#E8E3D8', top: 320, left: 200, originX: 'center', originY: 'center' },
          { type: 'path', path: 'M 200,310 Q 205,310 210,320 Q 210,325 200,335 Q 190,325 190,320 Q 190,310 200,310', fill: 'transparent', stroke: '#7A9B76', strokeWidth: 2, top: 0, left: 0 },
          { type: 'circle', radius: 4, fill: '#7A9B76', top: 320, left: 200, originX: 'center', originY: 'center' },
          
          { type: 'i-text', text: 'CEREMONIA', fontSize: 15, fontFamily: 'Montserrat', fill: '#7A9B76', fontWeight: '600', top: 310, left: 250, originX: 'left', originY: 'center' },
          { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 18, fontFamily: 'Cormorant Garamond', fill: '#3D4A3B', top: 355, left: 250, originX: 'left', originY: 'top' },
          { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 14, fontFamily: 'Lato', fill: '#6B7B67', top: 385, left: 250, originX: 'left', originY: 'top' },
          { type: 'i-text', text: '{{schedule}}', fontSize: 14, fontFamily: 'Lato', fill: '#8B9B84', top: 410, left: 250, originX: 'left', originY: 'top' },
          
          // Banquete
          { type: 'circle', radius: 20, fill: '#E8E3D8', top: 520, left: 200, originX: 'center', originY: 'center' },
          { type: 'path', path: 'M 190,525 L 192,515 Q 192,512 194,512 L 206,512 Q 208,512 208,515 L 210,525 Q 209,528 205,528 L 195,528 Q 191,528 190,525', fill: 'transparent', stroke: '#7A9B76', strokeWidth: 2, top: 0, left: 0 },
          { type: 'circle', radius: 1.5, fill: '#A5C9A1', opacity: 0.6, top: 516, left: 198, originX: 'center', originY: 'center' },
          
          { type: 'i-text', text: 'BANQUETE', fontSize: 15, fontFamily: 'Montserrat', fill: '#7A9B76', fontWeight: '600', top: 510, left: 250, originX: 'left', originY: 'center' },
          { type: 'i-text', text: '{{banquetPlace}}', fontSize: 18, fontFamily: 'Cormorant Garamond', fill: '#3D4A3B', top: 555, left: 250, originX: 'left', originY: 'top' },
          { type: 'i-text', text: 'A continuación de la ceremonia', fontSize: 14, fontFamily: 'Lato', fill: '#6B7B67', top: 585, left: 250, originX: 'left', originY: 'top' },
          
          // Dress Code
          { type: 'circle', radius: 20, fill: '#E8E3D8', top: 720, left: 200, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '👔', fontSize: 20, fill: '#7A9B76', top: 720, left: 200, originX: 'center', originY: 'center' },
          
          { type: 'i-text', text: 'VESTIMENTA', fontSize: 15, fontFamily: 'Montserrat', fill: '#7A9B76', fontWeight: '600', top: 710, left: 250, originX: 'left', originY: 'center' },
          { type: 'i-text', text: 'Formal / Etiqueta', fontSize: 16, fontFamily: 'Cormorant Garamond', fill: '#3D4A3B', top: 745, left: 250, originX: 'left', originY: 'top' },
          
          // RSVP
          { type: 'rect', width: 650, height: 180, fill: '#FFFFFF', stroke: '#A5C9A1', strokeWidth: 1, top: 920, left: 525, originX: 'center', originY: 'center', rx: 5 },
          { type: 'i-text', text: 'CONFIRMA TU ASISTENCIA', fontSize: 16, fontFamily: 'Montserrat', fill: '#7A9B76', fontWeight: '600', letterSpacing: 120, top: 945, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Antes del {{rsvpDate}}', fontSize: 18, fontFamily: 'Cormorant Garamond', fill: '#3D4A3B', top: 985, left: 525, originX: 'center', originY: 'center' },
          
          // QR placeholder
          { type: 'rect', width: 100, height: 100, fill: '#E8E3D8', top: 1035, left: 525, originX: 'center', originY: 'center', rx: 3 },
          { type: 'i-text', text: 'QR', fontSize: 18, fontFamily: 'Montserrat', fill: '#7A9B76', top: 1035, left: 525, originX: 'center', originY: 'center' },
          
          // Hashtag
          { type: 'i-text', text: '{{hashtag}}', fontSize: 20, fontFamily: 'Cormorant Garamond', fill: '#7A9B76', fontStyle: 'italic', top: 1250, left: 525, originX: 'center', originY: 'center' },
          
          // Pequeños detalles florales
          { type: 'circle', radius: 3, fill: '#A5C9A1', opacity: 0.4, top: 1350, left: 500 },
          { type: 'circle', radius: 3, fill: '#A5C9A1', opacity: 0.4, top: 1350, left: 525 },
          { type: 'circle', radius: 3, fill: '#A5C9A1', opacity: 0.4, top: 1350, left: 550 },
        ],
      },
    },
  },
  
  // 2. ROSE GOLD ROMANCE - Rosa Dorado Romántico
  {
    id: 'rose-gold-romance',
    name: 'Romance Rosa Dorado',
    category: 'invitation',
    style: 'rose-gold-elegant',
    description: 'Diseño romántico con acentos en rosa dorado',
    sides: {
      front: {
        width: 1050,
        height: 1485,
        backgroundColor: '#FFF9F5',
        objects: [
          // Fondo superior con degradado simulado
          { type: 'rect', width: 1050, height: 400, fill: '#FFF0F0', opacity: 0.3, top: 0, left: 0 },
          
          // Marco principal
          { type: 'rect', width: 920, height: 1355, fill: 'transparent', stroke: '#D4A5A5', strokeWidth: 2, top: 65, left: 65, rx: 8 },
          { type: 'rect', width: 900, height: 1335, fill: 'transparent', stroke: '#E8B4C4', strokeWidth: 1, top: 75, left: 75, rx: 8 },
          
          // Decoración superior - Lazo elegante
          { type: 'circle', radius: 18, fill: '#E8B4C4', top: 140, left: 525, originX: 'center', originY: 'center' },
          { type: 'path', path: 'M 525,140 Q 495,120 485,140 Q 495,160 525,140', fill: '#F4C2D0', stroke: '#E8B4C4', strokeWidth: 1.5, top: 0, left: 0 },
          { type: 'path', path: 'M 525,140 Q 555,120 565,140 Q 555,160 525,140', fill: '#F4C2D0', stroke: '#E8B4C4', strokeWidth: 1.5, top: 0, left: 0 },
          
          // Cintas colgantes del lazo
          { type: 'path', path: 'M 515,150 L 510,200 L 520,185', fill: '#F4C2D0', stroke: '#E8B4C4', strokeWidth: 1, top: 0, left: 0 },
          { type: 'path', path: 'M 535,150 L 540,200 L 530,185', fill: '#F4C2D0', stroke: '#E8B4C4', strokeWidth: 1, top: 0, left: 0 },
          
          // Flores rosas decorativas
          // Esquina superior izquierda
          { type: 'circle', radius: 22, fill: '#E8B4C4', opacity: 0.35, top: 200, left: 150 },
          { type: 'circle', radius: 18, fill: '#E8B4C4', opacity: 0.5, top: 204, left: 154 },
          { type: 'circle', radius: 14, fill: '#E8B4C4', opacity: 0.7, top: 208, left: 158 },
          { type: 'circle', radius: 10, fill: '#F4C2D0', opacity: 0.9, top: 212, left: 162 },
          { type: 'circle', radius: 5, fill: '#FFD1DC', top: 217, left: 167 },
          
          // Esquina superior derecha
          { type: 'circle', radius: 22, fill: '#E8B4C4', opacity: 0.35, top: 200, left: 900 },
          { type: 'circle', radius: 18, fill: '#E8B4C4', opacity: 0.5, top: 204, left: 896 },
          { type: 'circle', radius: 14, fill: '#E8B4C4', opacity: 0.7, top: 208, left: 892 },
          { type: 'circle', radius: 10, fill: '#F4C2D0', opacity: 0.9, top: 212, left: 888 },
          { type: 'circle', radius: 5, fill: '#FFD1DC', top: 217, left: 883 },
          
          // Marco para iniciales
          { type: 'rect', width: 140, height: 140, fill: '#FFFFFF', stroke: '#D4A5A5', strokeWidth: 2, top: 340, left: 525, originX: 'center', originY: 'center', rx: 70 },
          { type: 'circle', radius: 65, fill: 'transparent', stroke: '#E8B4C4', strokeWidth: 1, top: 340, left: 525, originX: 'center', originY: 'center' },
          
          // Iniciales entrelazadas
          { type: 'i-text', text: '{{brideInitial}}', fontSize: 48, fontFamily: 'Great Vibes', fill: '#D4A5A5', top: 340, left: 505, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{groomInitial}}', fontSize: 48, fontFamily: 'Great Vibes', fill: '#D4A5A5', top: 340, left: 545, originX: 'center', originY: 'center' },
          { type: 'path', path: 'M 510,355 Q 525,350 540,355', stroke: '#E8B4C4', strokeWidth: 1, fill: 'transparent', top: 0, left: 0 },
          
          // Texto invitación
          { type: 'i-text', text: 'tienen el placer de invitarle', fontSize: 14, fontFamily: 'Lato', fill: '#A88595', fontStyle: 'italic', top: 500, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'a la celebración de su matrimonio', fontSize: 14, fontFamily: 'Lato', fill: '#A88595', fontStyle: 'italic', top: 530, left: 525, originX: 'center', originY: 'center' },
          
          // Nombres
          { type: 'i-text', text: '{{bride}}', fontSize: 50, fontFamily: 'Great Vibes', fill: '#8B6B75', top: 650, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '&', fontSize: 32, fontFamily: 'Playfair Display', fill: '#E8B4C4', fontStyle: 'italic', top: 720, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{groom}}', fontSize: 50, fontFamily: 'Great Vibes', fill: '#8B6B75', top: 780, left: 525, originX: 'center', originY: 'center' },
          
          // Ornamento divisor
          { type: 'path', path: 'M 400,900 Q 450,890 500,900 Q 550,910 600,900', stroke: '#E8B4C4', strokeWidth: 1.5, fill: 'transparent', top: 0, left: 25 },
          { type: 'path', path: 'M 400,900 Q 450,910 500,900 Q 550,890 600,900', stroke: '#F4C2D0', strokeWidth: 1, fill: 'transparent', opacity: 0.6, top: 0, left: 25 },
          
          // Fecha
          { type: 'i-text', text: '{{formattedDate}}', fontSize: 28, fontFamily: 'Cormorant Garamond', fill: '#8B6B75', fontWeight: '400', top: 1020, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{schedule}}', fontSize: 20, fontFamily: 'Lato', fill: '#E8B4C4', fontWeight: '300', top: 1070, left: 525, originX: 'center', originY: 'center' },
          
          // Lugar
          { type: 'i-text', text: '{{ceremonyPlace}}', fontSize: 22, fontFamily: 'Cormorant Garamond', fill: '#8B6B75', fontWeight: '400', top: 1170, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: '{{ceremonyAddress}}', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 1210, left: 525, originX: 'center', originY: 'center' },
          
          // Flores inferiores
          { type: 'circle', radius: 18, fill: '#E8B4C4', opacity: 0.4, top: 1340, left: 200 },
          { type: 'circle', radius: 14, fill: '#F4C2D0', opacity: 0.6, top: 1344, left: 204 },
          
          { type: 'circle', radius: 18, fill: '#E8B4C4', opacity: 0.4, top: 1340, left: 850 },
          { type: 'circle', radius: 14, fill: '#F4C2D0', opacity: 0.6, top: 1344, left: 846 },
        ],
      },
      back: {
        width: 1050,
        height: 1485,
        backgroundColor: '#FFF9F5',
        objects: [
          // Marco
          { type: 'rect', width: 920, height: 1355, fill: 'transparent', stroke: '#D4A5A5', strokeWidth: 2, top: 65, left: 65, rx: 8 },
          
          // Patrón sutil de puntos
          ...Array.from({ length: 15 }, (_, i) => ({
            type: 'circle',
            radius: 2,
            fill: '#F4C2D0',
            opacity: 0.2,
            top: 100 + (i % 5) * 60,
            left: 100 + Math.floor(i / 5) * 200,
          })),
          
          // Contenido
          { type: 'i-text', text: 'INFORMACIÓN', fontSize: 15, fontFamily: 'Montserrat', fill: '#E8B4C4', letterSpacing: 200, fontWeight: '500', top: 200, left: 525, originX: 'center', originY: 'center' },
          
          // Divisor
          { type: 'path', path: 'M 325,250 Q 425,245 525,250 Q 625,255 725,250', stroke: '#E8B4C4', strokeWidth: 1, fill: 'transparent', top: 0, left: 0 },
          
          // Orden del día
          { type: 'i-text', text: 'Orden del Día', fontSize: 22, fontFamily: 'Great Vibes', fill: '#8B6B75', top: 320, left: 525, originX: 'center', originY: 'center' },
          
          { type: 'i-text', text: '{{schedule}} - Ceremonia', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 385, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Cóctel de bienvenida', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 420, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Banquete', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 455, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Baile y celebración', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 490, left: 525, originX: 'center', originY: 'center' },
          
          // Vestimenta
          { type: 'i-text', text: 'Vestimenta', fontSize: 22, fontFamily: 'Great Vibes', fill: '#8B6B75', top: 600, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Formal / Cocktail', fontSize: 18, fontFamily: 'Cormorant Garamond', fill: '#A88595', top: 655, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Sugerimos tonos pastel', fontSize: 14, fontFamily: 'Lato', fill: '#E8B4C4', fontStyle: 'italic', top: 690, left: 525, originX: 'center', originY: 'center' },
          
          // Confirmación
          { type: 'rect', width: 600, height: 160, fill: '#FFF0F0', opacity: 0.5, stroke: '#E8B4C4', strokeWidth: 1, top: 830, left: 525, originX: 'center', originY: 'center', rx: 5 },
          { type: 'i-text', text: 'Confirmar Asistencia', fontSize: 20, fontFamily: 'Great Vibes', fill: '#8B6B75', top: 850, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Antes del {{rsvpDate}}', fontSize: 16, fontFamily: 'Lato', fill: '#A88595', top: 895, left: 525, originX: 'center', originY: 'center' },
          
          // Mensaje especial
          { type: 'i-text', text: 'Tu presencia es nuestro mejor regalo', fontSize: 18, fontFamily: 'Great Vibes', fill: '#E8B4C4', top: 1080, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'Si deseas tener un detalle,', fontSize: 14, fontFamily: 'Lato', fill: '#A88595', top: 1125, left: 525, originX: 'center', originY: 'center' },
          { type: 'i-text', text: 'agradeceríamos una contribución para nuestro viaje de novios', fontSize: 14, fontFamily: 'Lato', fill: '#A88595', top: 1155, left: 525, originX: 'center', originY: 'center' },
          
          // Hashtag
          { type: 'i-text', text: '{{hashtag}}', fontSize: 20, fontFamily: 'Great Vibes', fill: '#E8B4C4', top: 1300, left: 525, originX: 'center', originY: 'center' },
          
          // Corazoncito
          { type: 'i-text', text: '♥', fontSize: 16, fill: '#E8B4C4', top: 1360, left: 525, originX: 'center', originY: 'center' },
        ],
      },
    },
  },
];

// Función de procesamiento igual que modernTemplates
export const processPremiumTemplate = (template, weddingData, side = 'front') => {
  if (!template.sides || !template.sides[side]) return null;
  
  const sideData = template.sides[side];
  const processedTemplate = {
    ...template,
    canvas: JSON.parse(JSON.stringify(sideData)),
  };
  
  if (!weddingData) return processedTemplate;
  
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
