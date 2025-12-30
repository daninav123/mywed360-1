/**
 * FUENTES PROFESIONALES PARA BODAS
 * Organizadas por estilo y uso
 */

export const WEDDING_FONTS = {
  'Caligráficas': [
    { name: 'Allura', family: 'Allura', weight: 400, style: 'cursive' },
    { name: 'Great Vibes', family: 'Great Vibes', weight: 400, style: 'cursive' },
    { name: 'Parisienne', family: 'Parisienne', weight: 400, style: 'cursive' },
    { name: 'Dancing Script', family: 'Dancing Script', weight: 400, style: 'cursive' },
    { name: 'Alex Brush', family: 'Alex Brush', weight: 400, style: 'cursive' },
    { name: 'Sacramento', family: 'Sacramento', weight: 400, style: 'cursive' },
  ],
  
  'Elegantes Serif': [
    { name: 'Playfair Display', family: 'Playfair Display', weight: 400, style: 'serif' },
    { name: 'Cormorant Garamond', family: 'Cormorant Garamond', weight: 400, style: 'serif' },
    { name: 'Cinzel', family: 'Cinzel', weight: 400, style: 'serif' },
    { name: 'Libre Baskerville', family: 'Libre Baskerville', weight: 400, style: 'serif' },
    { name: 'Crimson Text', family: 'Crimson Text', weight: 400, style: 'serif' },
    { name: 'EB Garamond', family: 'EB Garamond', weight: 400, style: 'serif' },
  ],
  
  'Modernas Sans': [
    { name: 'Montserrat', family: 'Montserrat', weight: 400, style: 'sans-serif' },
    { name: 'Lato', family: 'Lato', weight: 400, style: 'sans-serif' },
    { name: 'Raleway', family: 'Raleway', weight: 400, style: 'sans-serif' },
    { name: 'Josefin Sans', family: 'Josefin Sans', weight: 400, style: 'sans-serif' },
    { name: 'Poppins', family: 'Poppins', weight: 400, style: 'sans-serif' },
    { name: 'Quicksand', family: 'Quicksand', weight: 400, style: 'sans-serif' },
  ],
  
  'Decorativas': [
    { name: 'Abril Fatface', family: 'Abril Fatface', weight: 400, style: 'display' },
    { name: 'Bodoni Moda', family: 'Bodoni Moda', weight: 400, style: 'serif' },
    { name: 'Yeseva One', family: 'Yeseva One', weight: 400, style: 'display' },
    { name: 'Tangerine', family: 'Tangerine', weight: 700, style: 'cursive' },
  ],
};

/**
 * URL de Google Fonts para cargar todas las fuentes
 */
export const GOOGLE_FONTS_URL = 
  'https://fonts.googleapis.com/css2?' +
  'family=Allura&' +
  'family=Great+Vibes&' +
  'family=Parisienne&' +
  'family=Dancing+Script&' +
  'family=Alex+Brush&' +
  'family=Sacramento&' +
  'family=Playfair+Display:wght@400;700&' +
  'family=Cormorant+Garamond:wght@400;700&' +
  'family=Cinzel:wght@400;700&' +
  'family=Libre+Baskerville:wght@400;700&' +
  'family=Crimson+Text:wght@400;700&' +
  'family=EB+Garamond:wght@400;700&' +
  'family=Montserrat:wght@400;700&' +
  'family=Lato:wght@400;700&' +
  'family=Raleway:wght@400;700&' +
  'family=Josefin+Sans:wght@400;700&' +
  'family=Poppins:wght@400;700&' +
  'family=Quicksand:wght@400;700&' +
  'family=Abril+Fatface&' +
  'family=Bodoni+Moda:wght@400;700&' +
  'family=Yeseva+One&' +
  'family=Tangerine:wght@700&' +
  'display=swap';

/**
 * Obtener lista plana de todas las fuentes
 */
export function getAllFonts() {
  const allFonts = [];
  Object.values(WEDDING_FONTS).forEach(category => {
    allFonts.push(...category);
  });
  return allFonts;
}

/**
 * Cargar fuentes de Google Fonts en el documento
 */
export function loadWeddingFonts() {
  if (typeof document === 'undefined') return;
  
  // Verificar si ya está cargado
  const existingLink = document.querySelector('link[data-wedding-fonts]');
  if (existingLink) return;
  
  // Crear y añadir link
  const link = document.createElement('link');
  link.setAttribute('data-wedding-fonts', 'true');
  link.href = GOOGLE_FONTS_URL;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  
  console.log('✅ Fuentes de boda cargadas desde Google Fonts');
}
