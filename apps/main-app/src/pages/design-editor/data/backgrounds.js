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
      url: '/assets/backgrounds/texture-paper.webp',
      category: 'textures',
      style: 'paper',
    },
    {
      id: 'texture-linen',
      name: 'Lino Natural',
      url: '/assets/backgrounds/texture-linen.webp',
      category: 'textures',
      style: 'fabric',
    },
    {
      id: 'texture-canvas',
      name: 'Lienzo',
      url: '/assets/backgrounds/texture-canvas.webp',
      category: 'textures',
      style: 'canvas',
    },
    {
      id: 'texture-kraft',
      name: 'Papel Kraft',
      url: '/assets/backgrounds/texture-kraft.webp',
      category: 'textures',
      style: 'kraft',
    },
  ],

  // ACUARELAS
  watercolors: [
    {
      id: 'watercolor-blush',
      name: 'Acuarela Rosa',
      url: '/assets/backgrounds/watercolor-blush.webp',
      category: 'watercolors',
      style: 'pink',
    },
    {
      id: 'watercolor-sage',
      name: 'Acuarela Verde',
      url: '/assets/backgrounds/watercolor-sage.webp',
      category: 'watercolors',
      style: 'green',
    },
    {
      id: 'watercolor-blue',
      name: 'Acuarela Azul',
      url: '/assets/backgrounds/watercolor-blue.webp',
      category: 'watercolors',
      style: 'blue',
    },
    {
      id: 'watercolor-neutral',
      name: 'Acuarela Neutra',
      url: '/assets/backgrounds/watercolor-blush.webp',
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
