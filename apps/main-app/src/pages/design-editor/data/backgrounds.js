/**
 * Fondos y Texturas para Invitaciones de Boda
 * Incluye texturas de papel, acuarelas, degradados
 */

export const BACKGROUNDS = {
  // COLORES SÓLIDOS ELEGANTES
  solids: [
    { id: 'white', name: 'Blanco Puro', color: '#FFFFFF', category: 'solids' },
    { id: 'ivory', name: 'Marfil', color: '#FFFFF0', category: 'solids' },
    { id: 'cream', name: 'Crema', color: '#FFF8F0', category: 'solids' },
    { id: 'beige', name: 'Beige', color: '#F5F2ED', category: 'solids' },
    { id: 'champagne', name: 'Champagne', color: '#F7E7CE', category: 'solids' },
    { id: 'blush', name: 'Rosa Suave', color: '#FFE4E1', category: 'solids' },
    { id: 'sage', name: 'Salvia', color: '#E8F0E3', category: 'solids' },
    { id: 'dusty-blue', name: 'Azul Polvoriento', color: '#E6EEF5', category: 'solids' },
  ],

  // DEGRADADOS SUAVES
  gradients: [
    {
      id: 'gradient-cream-gold',
      name: 'Crema a Dorado',
      gradient: 'linear-gradient(to bottom, #FFF8F0 0%, #F7E7CE 100%)',
      category: 'gradients',
    },
    {
      id: 'gradient-blush-ivory',
      name: 'Rosa a Marfil',
      gradient: 'linear-gradient(to bottom, #FFE4E1 0%, #FFFFF0 100%)',
      category: 'gradients',
    },
    {
      id: 'gradient-sage-cream',
      name: 'Salvia a Crema',
      gradient: 'linear-gradient(to bottom, #E8F0E3 0%, #FFF8F0 100%)',
      category: 'gradients',
    },
    {
      id: 'gradient-blue-white',
      name: 'Azul a Blanco',
      gradient: 'linear-gradient(to bottom, #E6EEF5 0%, #FFFFFF 100%)',
      category: 'gradients',
    },
    {
      id: 'gradient-radial-ivory',
      name: 'Marfil Radial',
      gradient: 'radial-gradient(circle at center, #FFFFF0 0%, #F5F2ED 100%)',
      category: 'gradients',
    },
  ],

  // TEXTURAS DE PAPEL
  textures: [
    {
      id: 'texture-paper',
      name: 'Papel Texturizado',
      url: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1200&auto=format&fit=crop&q=80',
      category: 'textures',
      style: 'paper',
    },
    {
      id: 'texture-linen',
      name: 'Lino Natural',
      url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop&q=80',
      category: 'textures',
      style: 'fabric',
    },
    {
      id: 'texture-canvas',
      name: 'Lienzo',
      url: 'https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=1200&auto=format&fit=crop&q=80',
      category: 'textures',
      style: 'canvas',
    },
    {
      id: 'texture-kraft',
      name: 'Papel Kraft',
      url: 'https://images.unsplash.com/photo-1606663725948-ec221b7bc1a0?w=1200&auto=format&fit=crop&q=80',
      category: 'textures',
      style: 'kraft',
    },
  ],

  // ACUARELAS
  watercolors: [
    {
      id: 'watercolor-blush',
      name: 'Acuarela Rosa',
      url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&auto=format&fit=crop&q=80',
      category: 'watercolors',
      style: 'pink',
    },
    {
      id: 'watercolor-sage',
      name: 'Acuarela Verde',
      url: 'https://images.unsplash.com/photo-1557672199-6a1c2b21c7dc?w=1200&auto=format&fit=crop&q=80',
      category: 'watercolors',
      style: 'green',
    },
    {
      id: 'watercolor-blue',
      name: 'Acuarela Azul',
      url: 'https://images.unsplash.com/photo-1557672184-1e36e9e1e0c7?w=1200&auto=format&fit=crop&q=80',
      category: 'watercolors',
      style: 'blue',
    },
    {
      id: 'watercolor-neutral',
      name: 'Acuarela Neutra',
      url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&auto=format&fit=crop&q=80',
      category: 'watercolors',
      style: 'neutral',
    },
  ],
};

export const BACKGROUND_CATEGORIES = [
  { id: 'all', label: 'Todos', icon: '🎨' },
  { id: 'solids', label: 'Sólidos', icon: '⬜' },
  { id: 'gradients', label: 'Degradados', icon: '🌅' },
  { id: 'textures', label: 'Texturas', icon: '📄' },
  { id: 'watercolors', label: 'Acuarelas', icon: '🎨' },
];

export const getAllBackgrounds = () => {
  return [
    ...BACKGROUNDS.solids,
    ...BACKGROUNDS.gradients,
    ...BACKGROUNDS.textures,
    ...BACKGROUNDS.watercolors,
  ];
};

export default BACKGROUNDS;
