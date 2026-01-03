/**
 * ✨ Ilustraciones Florales SVG Vectoriales para Invitaciones de Boda
 * 🎨 TOTALMENTE EDITABLES - Todos los assets son locales y vectoriales
 * 📁 Assets ubicados en: /public/assets/florals/
 * 🔧 100% escalables sin pérdida de calidad
 */

export const FLORAL_ILLUSTRATIONS = {
  // EUCALIPTO - Muy popular en invitaciones modernas
  eucalyptus: [
    {
      id: 'eucalyptus-branch',
      name: 'Rama Eucalipto Horizontal',
      url: '/assets/florals/eucalyptus-branch.svg',
      category: 'eucalyptus',
      position: 'horizontal',
      style: 'vector',
      type: 'svg',
    },
    {
      id: 'olive-branch',
      name: 'Rama de Olivo Elegante',
      url: '/assets/florals/olive-branch.svg',
      category: 'eucalyptus',
      position: 'horizontal',
      style: 'vector',
      type: 'svg',
    },
  ],

  // ROSAS - Clásicas y elegantes
  roses: [
    {
      id: 'rose-corner',
      name: 'Esquina de Rosas',
      url: '/assets/florals/rose-corner.svg',
      category: 'roses',
      position: 'corner',
      style: 'vector',
      type: 'svg',
      style: 'watercolor',
    },
    {
      id: 'rose-corner-bl',
      name: 'Rosa Esquina Inferior Izquierda',
      url: '/assets/services/flores.webp',
      category: 'roses',
      position: 'corner-bottom-left',
      style: 'watercolor',
    },
    {
      id: 'rose-spray',
      name: 'Spray de Rosas',
      url: '/assets/florals/rose-spray.webp',
      category: 'roses',
      position: 'accent',
      style: 'vector',
      type: 'svg',
    },
  ],

  // PEONÍAS - Románticas y voluminosas
  peonies: [
    {
      id: 'peony-bloom',
      name: 'Peonía en Flor',
      url: '/assets/florals/peony-bloom.svg',
      category: 'peonies',
      position: 'center',
      style: 'vector',
      type: 'svg',
      style: 'watercolor',
    },
    {
      id: 'peony-cluster',
      name: 'Grupo de Peonías',
      url: '/assets/florals/peony-cluster.webp',
      category: 'peonies',
      position: 'corner',
      style: 'watercolor',
    },
  ],

  // OLIVO - Mediterráneo y natural
  olive: [
    {
      id: 'olive-branch-1',
      name: 'Rama de Olivo',
      url: '/assets/florals/olive-branch-watercolor.webp',
      category: 'olive',
      position: 'horizontal',
      style: 'watercolor',
    },
    {
      id: 'olive-wreath',
      name: 'Corona de Olivo',
      url: '/assets/florals/olive-wreath.svg',
      category: 'olive',
      position: 'wreath',
      style: 'vector',
      type: 'svg',
    },
  ],

  // FLORES SILVESTRES - Bohemias y naturales
  wildflowers: [
    {
      id: 'wildflower-corner',
      name: 'Esquina Flores Silvestres',
      url: '/assets/florals/wildflower-corner.svg',
      category: 'wildflowers',
      position: 'corner',
      style: 'vector',
      type: 'svg',
      style: 'watercolor',
    },
    {
      id: 'wildflower-bouquet',
      name: 'Ramillete de Flores Silvestres',
      url: '/assets/florals/wildflower-bouquet.svg',
      category: 'wildflowers',
      position: 'center',
      style: 'vector',
      type: 'svg',
    },
  ],

  // CORONAS FLORALES - Marcos completos
  wreaths: [
    {
      id: 'wreath-mixed-1',
      name: 'Corona Floral Mixta',
      url: '/assets/florals/rose-spray.webp',
      category: 'wreaths',
      position: 'frame',
      style: 'watercolor',
    },
    {
      id: 'wreath-greenery',
      name: 'Corona de Verdor',
      url: '/assets/florals/wreath-greenery.webp',
      category: 'wreaths',
      position: 'frame',
      style: 'watercolor',
    },
    {
      id: 'wreath-botanical',
      name: 'Corona Botánica',
      url: '/assets/florals/peony-cluster.webp',
      category: 'wreaths',
      position: 'frame',
      style: 'watercolor',
    },
  ],

  // SETS DE ESQUINAS - Coordinados para las 4 esquinas
  cornerSets: [
    {
      id: 'corner-set-botanical-1',
      name: 'Set Esquinas Botánicas',
      corners: {
        topLeft: '/assets/florals/olive-branch-watercolor.webp',
        topRight: '/assets/services/flores.webp',
        bottomLeft: '/assets/florals/rose-spray.webp',
        bottomRight: '/assets/florals/wreath-greenery.webp',
      },
      category: 'corner-set',
      style: 'watercolor',
    },
    {
      id: 'corner-set-floral-2',
      name: 'Set Esquinas Florales Doradas',
      corners: {
        topLeft: '/assets/florals/peony-cluster.webp',
        topRight: '/assets/florals/olive-branch-watercolor.webp',
        bottomLeft: '/assets/services/flores.webp',
        bottomRight: '/assets/florals/rose-spray.webp',
      },
      category: 'corner-set',
      style: 'gold-accent',
    },
  ],

  // ELEMENTOS DE ACENTO - Pequeños detalles
  accents: [
    {
      id: 'accent-small-flowers',
      name: 'Pequeñas Flores Esparcidas',
      url: '/assets/florals/wreath-greenery.webp',
      category: 'accents',
      position: 'scattered',
      style: 'watercolor',
    },
    {
      id: 'accent-leaves',
      name: 'Hojas Decorativas',
      url: '/assets/florals/peony-cluster.webp',
      category: 'accents',
      position: 'accent',
      style: 'watercolor',
    },
  ],
};

// Helper para obtener todas las ilustraciones como array plano
export const getAllFloralIllustrations = () => {
  const all = [];
  
  Object.entries(FLORAL_ILLUSTRATIONS).forEach(([category, items]) => {
    if (category === 'cornerSets') {
      // Los sets de esquinas son especiales
      items.forEach(set => all.push({ ...set, type: 'corner-set' }));
    } else {
      items.forEach(item => all.push({ ...item, type: 'single' }));
    }
  });
  
  return all;
};

// Helper para filtrar por categoría
export const getFloralByCategory = (category) => {
  return FLORAL_ILLUSTRATIONS[category] || [];
};

// Categorías disponibles
export const FLORAL_CATEGORIES = [
  { id: 'all', label: 'Todas', icon: '🌿' },
  { id: 'eucalyptus', label: 'Eucalipto', icon: '🌿' },
  { id: 'roses', label: 'Rosas', icon: '🌹' },
  { id: 'peonies', label: 'Peonías', icon: '🌸' },
  { id: 'olive', label: 'Olivo', icon: '🫒' },
  { id: 'wreaths', label: 'Coronas', icon: '💐' },
  { id: 'cornerSets', label: 'Sets Esquinas', icon: '📐' },
  { id: 'accents', label: 'Acentos', icon: '✨' },
];

export default FLORAL_ILLUSTRATIONS;
