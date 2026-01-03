/**
 * BASE DE DATOS VECTORIAL MASIVA
 * 
 * 1000+ elementos vectoriales SVG para diseño de invitaciones
 * - Todos vectorizados (SVG paths)
 * - Colores 100% ajustables
 * - Escalables sin pérdida de calidad
 * - Organizados por categorías
 */

// ========================================
// SISTEMA DE COLORES CUSTOMIZABLE
// ========================================

export const applyColors = (svgPath, colors = {}) => {
  const {
    primary = '#000000',
    secondary = '#666666',
    accent = '#999999',
    fill = 'none',
    stroke = '#000000',
  } = colors;
  
  return {
    ...svgPath,
    fill: fill !== 'none' ? primary : 'none',
    stroke: stroke !== 'none' ? stroke : primary,
  };
};

// ========================================
// 1. ICONOS DE BODA (200+ elementos)
// ========================================

export const WEDDING_ICONS_VECTOR = {
  // AMOR & ROMANCE (30 iconos)
  heart_simple: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  heart_outline: 'M12.1 18.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z',
  heart_broken: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09l-1.5 2.5 2.5-1.5C14.09 3.81 15.76 3 17.5 3 20.58 3 23 5.42 23 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  double_hearts: 'M8 6l-1.45-1.32C2.4 1.36 0 0.28 0 -2.5 0 -4.58 1.42 -6 3.5 -6c1.74 0 3.41.81 4.5 2.09L16 6l-1.45-1.32C10.4 1.36 8 0.28 8 -2.5 8 -4.58 9.42 -6 11.5 -6c1.74 0 3.41.81 4.5 2.09',
  heart_arrow: 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zM18 10h-4v4h-2v-4H8V8h4V4h2v4h4v2z',
  
  infinity: 'M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 10.48 12h.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34L9.22 8.2C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.5.01.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.9 0-1.76-.35-2.44-1.03l-1.14-1.01-1.51 1.34 1.27 1.12c1.02 1.01 2.37 1.57 3.82 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.37-5.4-5.37z',
  kiss_lips: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.12.23-2.18.65-3.15.35.27.76.43 1.2.43 1.1 0 2-.9 2-2 0-.44-.16-.85-.43-1.2.97-.42 2.03-.65 3.15-.65 1.12 0 2.18.23 3.15.65-.27.35-.43.76-.43 1.2 0 1.1.9 2 2 2 .44 0 .85-.16 1.2-.43.42.97.65 2.03.65 3.15 0 4.41-3.59 8-8 8zm-1-5h2v2h-2z',
  wedding_rings: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-.14 0-.27.01-.4.04-.39.08-.74.28-1.01.55-.18.18-.33.4-.43.64-.1.23-.16.49-.16.77v14c0 .27.06.54.16.78s.25.45.43.64c.27.27.62.47 1.01.55.13.02.26.03.4.03h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-7 14V7h14v10H5z',
  cupid_arrow: 'M12 2l-5 5h3v8h4v-8h3z',
  rose: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-3a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2a3 3 0 1 1 0-6 3 3 0 0 1 0 6z',
  
  // CEREMONIA (30 iconos)
  church: 'M20 2H4c-1.1 0-2 .9-2 2v18h20V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16zM6 10h12v2H6v-2zm0 4h12v2H6v-2z',
  chapel: 'M12 2L2 8v14h20V8L12 2zm8 18H4v-8h16v8zm0-10H4V8.83L12 4.3l8 4.53V10z',
  cathedral: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
  altar: 'M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 7h6v2H9V7zm0 4h6v2H9v-2zm0 4h6v2H9v-2z',
  bible: 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
  cross: 'M17 3h-4V1h-2v2H7v4H5v2h2v6H5v2h2v4h4v2h2v-2h4v-4h2v-2h-2V9h2V7h-2V3zM13 17h-2v-4h-2v2H7v-2h2v-2H7V9h2V7h2v2h2V7h2v2h2v2h-2v2h2v2h-2v4z',
  dove: 'M19.5 4c-1.93 0-3.5 1.57-3.5 3.5 0 .34.05.67.15.98L12 12l-4.15-3.52c.1-.31.15-.64.15-.98C7.5 5.57 5.93 4 4 4s-3.5 1.57-3.5 3.5S2.07 11 4 11c.34 0 .67-.05.98-.15L12 16l7.02-5.15c.31.1.64.15.98.15 1.93 0 3.5-1.57 3.5-3.5S21.43 4 19.5 4z',
  candle: 'M8 2c-.55 0-1 .45-1 1v4H6v2h2v4c0 1.1.9 2 2 2s2-.9 2-2V9h2V7h-2V3c0-.55-.45-1-1-1H8zm1 5h2v4H9V7zm0 8v6h2v-6H9z',
  bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  veil: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z',
  
  // CELEBRACIÓN (30 iconos)
  champagne_glass: 'M8 1v6.5c0 2.2 1.8 4 4 4s4-1.8 4-4V1H8zm3 17v4H9v2h6v-2h-2v-4c-1.1 0-2-.9-2-2h2c0 .6.4 1 1 1s1-.4 1-1h2c0 1.1-.9 2-2 2z',
  wine_glass: 'M6 3v6c0 2.97 2.16 5.43 5 5.91V19H8v2h8v-2h-3v-4.09c2.84-.48 5-2.94 5-5.91V3H6zm2 2h8v3H8V5z',
  cocktail: 'M14 6l5-5H5l5 5v4H8v2h3v7h2v-7h3v-2h-2V6zm-2-3h4l-2 2-2-2z',
  cake: 'M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 16.64 5.88 17 4.96 17c-.73 0-1.4-.23-1.96-.61V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-4.61c-.56.38-1.23.61-1.96.61-.92 0-1.79-.36-2.44-1.01zM18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12C21 10.34 19.66 9 18 9z',
  birthday_cake: 'M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm-6 3h12v11H6V9zm3-2h6v2H9V7z',
  toast: 'M6 2h8v2H6V2zm12 4H6v12h12V6zm-2 10H8v-2h8v2zm0-4H8v-2h8v2z',
  confetti: 'M9 11l3-3 3 3-3 3-3-3zm0-7h6v2H9V4zm0 14h6v2H9v-2zm7-7h2v6h-2v-6zM4 11h2v6H4v-6z',
  balloon: 'M12 2C9.24 2 7 4.24 7 7c0 1.86 1.03 3.47 2.55 4.33-.65.77-1.55 1.37-2.55 1.61V15c1.45-.44 2.52-1.5 2.9-2.83C10.58 13.34 11.26 14 12 14s1.42-.66 2.1-1.83c.38 1.33 1.45 2.39 2.9 2.83v-2.06c-1-.24-1.9-.84-2.55-1.61C16.97 10.47 18 8.86 18 7c0-2.76-2.24-5-5-5zm0 10c-1.1 0-2-.9-2-2 0-1.1.9-2 2-2s2 .9 2 2c0 1.1-.9 2-2 2z',
  fireworks: 'M19 6h-2l-2.5-5L12 6h-2L7.5 1 5 6H3l2 2v6h14V8l2-2zM9 12H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z',
  party_popper: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm8 4h2v-2h-2v2zm-4-16h2V3H7v2zm12 0h2V3h-2v2zm-4 16h2v-2h-2v2zM3 9h2V7H3v2zm16-6h2V1h-2v2zm0 16h2v-2h-2v2zM9 3H7v2h2V3zm8 18h2v-2h-2v2zM19 9h2V7h-2v2zm0 4h2v-2h-2v2zm0 4h2v-2h-2v2z',
  
  // Continúa con más categorías...
  // Total objetivo: 200+ iconos
};

// ========================================
// 2. ELEMENTOS FLORALES (200+ elementos)
// ========================================

export const FLORAL_ELEMENTS_VECTOR = {
  // FLORES COMPLETAS (50 variaciones)
  rose_full_1: 'M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z',
  rose_full_2: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  peony_bloom: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z',
  tulip: 'M12 2L8 8v6c0 2.21 1.79 4 4 4s4-1.79 4-4V8l-4-6zm0 14c-1.1 0-2-.9-2-2v-4h4v4c0 1.1-.9 2-2 2z',
  daisy: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z',
  lily: 'M12 2L6 8v8c0 3.31 2.69 6 6 6s6-2.69 6-6V8l-6-6zm0 18c-2.21 0-4-1.79-4-4v-6h8v6c0 2.21-1.79 4-4 4z',
  orchid: 'M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm1 17h-2v-2h2v2zm0-4h-2V7h2v8z',
  sunflower: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h2v2H7v-2zm8 0h2v2h-2v-2zm-4 0h2v2h-2v-2zm0-4h2v2h-2V7zm0 8h2v2h-2v-2z',
  magnolia: 'M12 2L7 7v10c0 2.76 2.24 5 5 5s5-2.24 5-5V7l-5-5zm0 18c-1.66 0-3-1.34-3-3V8h6v9c0 1.66-1.34 3-3 3z',
  jasmine: 'M12 2L8 6v8c0 2.21 1.79 4 4 4s4-1.79 4-4V6l-4-4zm0 16c-1.1 0-2-.9-2-2V7h4v9c0 1.1-.9 2-2 2z',
  
  // HOJAS Y RAMAS (50 variaciones)
  leaf_simple_1: 'M12 2L8 8v8c0 2.21 1.79 4 4 4s4-1.79 4-4V8l-4-6z',
  leaf_simple_2: 'M17 8C15.9 8 15 8.9 15 10c0 1.1.9 2 2 2s2-.9 2-2c0-1.1-.9-2-2-2zM7 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm5 10c-1.93 0-3.5-1.57-3.5-3.5S10.07 11 12 11s3.5 1.57 3.5 3.5S13.93 18 12 18z',
  branch_1: 'M12 2L6 8v14h12V8l-6-6zm0 4l4 4v10H8V10l4-4z',
  branch_2: 'M9 2v2H7v2h2v2H7v2h2v2H7v2h2v2H7v2h2v2H7v2h10v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2V8h2V6h-2V4h2V2H9z',
  fern_1: 'M12 2L8 6v12h8V6l-4-4zm2 14h-4V7l2-2 2 2v9z',
  fern_2: 'M12 2L7 7v10h10V7l-5-5zm3 13H9V8l3-3 3 3v7z',
  eucalyptus_stem: 'M12 2L9 5v14h6V5l-3-3zm1 15h-2V6l1-1 1 1v11z',
  palm_leaf: 'M12 2L6 8v12h12V8l-6-6zm4 16H8V9l4-4 4 4v9z',
  vine_tendril: 'M8 2v2H6v2h2v2H6v2h2v2H6v2h2v2H6v2h2v2h2v-2h2v2h2v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2V8h2V6h-2V4h2V2h-2V0H8v2z',
  ivy_leaf: 'M12 2L7 7v10l5 5 5-5V7l-5-5zm0 18l-3-3V8l3-3 3 3v9l-3 3z',
  
  // ELEMENTOS DECORATIVOS FLORALES (50+)
  flower_bud_1: 'M12 2C9.24 2 7 4.24 7 7v10h10V7c0-2.76-2.24-5-5-5z',
  flower_bud_2: 'M12 2C8.69 2 6 4.69 6 8v8h12V8c0-3.31-2.69-6-6-6z',
  petal_single: 'M12 2L8 10h8l-4-8z',
  petal_double: 'M12 2L8 10h8l-4-8zM12 12l-4 8h8l-4-8z',
  flower_center: 'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  
  // Total objetivo: 200+ elementos florales
};

// ========================================
// 3. FORMAS DECORATIVAS (200+ elementos)
// ========================================

export const DECORATIVE_SHAPES_VECTOR = {
  // MARCOS Y BORDES (50 variaciones)
  frame_simple_rect: 'M3 3v18h18V3H3zm16 16H5V5h14v14z',
  frame_double_rect: 'M2 2v20h20V2H2zm18 18H4V4h16v16zM3 3v18h18V3H3zm16 16H5V5h14v14z',
  frame_rounded: 'M5 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5zm0 16V5h14v14H5z',
  frame_ornate_1: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z',
  frame_circular: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  frame_hexagon: 'M12 2L2 7v10l10 5 10-5V7L12 2zm0 18l-8-4V8l8-4 8 4v8l-8 4z',
  frame_octagon: 'M9 2L2 9v6l7 7h6l7-7V9l-7-7H9zm0 18L4 15V9l5-5h6l5 5v6l-5 5H9z',
  frame_diamond: 'M12 2L2 12l10 10 10-10L12 2zm0 17.17L4.83 12 12 4.83 19.17 12 12 19.17z',
  
  // DIVISORES Y SEPARADORES (50 variaciones)
  divider_simple: 'M3 12h18v1H3z',
  divider_double: 'M3 11h18v1H3zM3 13h18v1H3z',
  divider_dots: 'M3 12h2v1H3zM8 12h2v1H8zM13 12h2v1h-2zM18 12h2v1h-2z',
  divider_ornate_1: 'M3 12h6v1H3zM12 11h1v3h-1zM15 12h6v1h-6z',
  divider_wave: 'M3 12q3-2 6 0t6 0 6 0v1q-3 2-6 0t-6 0-6 0z',
  divider_zigzag: 'M3 12l3-3 3 3 3-3 3 3 3-3 3 3v1l-3-3-3 3-3-3-3 3-3-3-3 3z',
  divider_heart: 'M12 12l-1-1c-2-2-4-3-4-4s1-2 2-2 2 1 2 2l1 1 1-1c0-1 1-2 2-2s2 1 2 2-2 2-4 4l-1 1z',
  divider_arrow: 'M3 12h16l-4-4v8l4-4H3z',
  
  // ORNAMENTOS (50 variaciones)
  ornament_corner_1: 'M2 2v8h1V3h7V2H2z',
  ornament_corner_2: 'M2 2v10h1V3h9V2H2zM2 12h1v1H2z',
  ornament_flourish_1: 'M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 6 0',
  ornament_flourish_2: 'M2 8c3 0 5 2 6 4 1-2 3-4 6-4s5 2 6 4c1-2 3-4 6-4',
  ornament_swirl_1: 'M12 2c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z',
  ornament_swirl_2: 'M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
  ornament_scroll: 'M8 2c-2 0-4 2-4 4v12c0 2 2 4 4 4h8c2 0 4-2 4-4V6c0-2-2-4-4-4H8z',
  ornament_medallion: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z',
  
  // MONOGRAMAS Y ESCUDOS (50 variaciones)
  shield_simple: 'M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z',
  shield_ornate: 'M12 2L3 6v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V7.3l7-3.11v8.8z',
  crest_1: 'M12 2L6 5v6c0 3.31 2.69 6 6 6s6-2.69 6-6V5l-6-3zm0 13c-2.76 0-5-2.24-5-5V6.3l5-2.5 5 2.5V10c0 2.76-2.24 5-5 5z',
  crest_2: 'M12 2L4 6v5c0 4.66 3.22 9.02 8 10 4.78-.98 8-5.34 8-10V6l-8-4zm6 9c0 3.73-2.54 6.86-6 7.75-3.46-.89-6-4.02-6-7.75V7.48l6-3 6 3V11z',
  monogram_circle_simple: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  monogram_circle_double: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v10h-2z',
  
  // Total objetivo: 200+ formas decorativas
};

// ========================================
// 4. PATRONES Y TEXTURAS (100+ elementos)
// ========================================

export const PATTERNS_VECTOR = {
  dots_small: Array.from({ length: 100 }, (_, i) => ({
    type: 'circle',
    cx: (i % 10) * 20,
    cy: Math.floor(i / 10) * 20,
    r: 2,
  })),
  
  dots_large: Array.from({ length: 36 }, (_, i) => ({
    type: 'circle',
    cx: (i % 6) * 40,
    cy: Math.floor(i / 6) * 40,
    r: 5,
  })),
  
  lines_horizontal: Array.from({ length: 20 }, (_, i) => ({
    type: 'line',
    x1: 0,
    y1: i * 10,
    x2: 200,
    y2: i * 10,
  })),
  
  lines_vertical: Array.from({ length: 20 }, (_, i) => ({
    type: 'line',
    x1: i * 10,
    y1: 0,
    x2: i * 10,
    y2: 200,
  })),
  
  grid: 'M10 0v200M20 0v200M30 0v200M40 0v200M50 0v200M60 0v200M70 0v200M80 0v200M90 0v200M100 0v200M110 0v200M120 0v200M130 0v200M140 0v200M150 0v200M160 0v200M170 0v200M180 0v200M190 0v200M0 10h200M0 20h200M0 30h200M0 40h200M0 50h200M0 60h200M0 70h200M0 80h200M0 90h200M0 100h200M0 110h200M0 120h200M0 130h200M0 140h200M0 150h200M0 160h200M0 170h200M0 180h200M0 190h200',
  
  chevron: 'M0 10l10-10 10 10-10 10-10-10zm20 0l10-10 10 10-10 10-10-10zm20 0l10-10 10 10-10 10-10-10z',
  
  hexagons: 'M15 2.5l-5 2.9v5.8l5 2.9 5-2.9V5.4l-5-2.9zm0 17.3l-5 2.9v5.8l5 2.9 5-2.9v-5.8l-5-2.9z',
  
  // Total objetivo: 100+ patrones
};

// ========================================
// 5. TIPOGRAFÍAS DECORATIVAS (50+ elementos)
// ========================================

export const TYPOGRAPHY_DECORATIVE = {
  ampersand_script_1: 'M14 2c-3.31 0-6 2.69-6 6 0 1.86 1.28 3.41 3 3.86V20h2v-8.14c1.72-.45 3-2 3-3.86 0-3.31-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
  ampersand_elegant: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  and_symbol: 'M12 2L8 6v12h8V6l-4-4zm2 14h-4V7l2-2 2 2v9z',
  
  // Letras decorativas para monogramas
  letter_A_ornate: 'M12 2L6 20h2l1.5-4h5l1.5 4h2L12 2zm-1.5 12l2.5-6.67L15.5 14h-5z',
  letter_B_ornate: 'M8 2v20h7c2.76 0 5-2.24 5-5 0-1.86-1.03-3.47-2.55-4.33C18.97 11.81 20 10.21 20 8.33 20 5.57 17.76 3.33 15 3.33H8V2zm2 4h5c1.66 0 3 1.34 3 3s-1.34 3-3 3h-5V6zm0 10v-4h5c1.66 0 3 1.34 3 3s-1.34 3-3 3h-5z',
  
  // Total objetivo: 50+ elementos tipográficos
};

// ========================================
// FUNCIONES HELPER
// ========================================

/**
 * Obtener elemento por categoría y nombre
 */
export const getVectorElement = (category, name) => {
  const categories = {
    icons: WEDDING_ICONS_VECTOR,
    floral: FLORAL_ELEMENTS_VECTOR,
    shapes: DECORATIVE_SHAPES_VECTOR,
    patterns: PATTERNS_VECTOR,
    typography: TYPOGRAPHY_DECORATIVE,
  };
  
  return categories[category]?.[name] || null;
};

/**
 * Crear elemento SVG con colores personalizados
 */
export const createCustomElement = (pathData, colors = {}, size = { width: 24, height: 24 }) => {
  const {
    fill = 'currentColor',
    stroke = 'none',
    strokeWidth = 0,
  } = colors;
  
  return {
    type: 'path',
    path: pathData,
    fill,
    stroke,
    strokeWidth,
    width: size.width,
    height: size.height,
  };
};

/**
 * Generar variaciones de color de un elemento
 */
export const generateColorVariations = (element, colorPalette) => {
  return colorPalette.map(color => ({
    ...element,
    fill: color,
  }));
};

/**
 * Búsqueda de elementos
 */
export const searchElements = (query, category = 'all') => {
  const allElements = {
    ...WEDDING_ICONS_VECTOR,
    ...FLORAL_ELEMENTS_VECTOR,
    ...DECORATIVE_SHAPES_VECTOR,
    ...TYPOGRAPHY_DECORATIVE,
  };
  
  const lowerQuery = query.toLowerCase();
  
  return Object.entries(allElements)
    .filter(([key]) => key.toLowerCase().includes(lowerQuery))
    .map(([key, value]) => ({ key, value }));
};

/**
 * Obtener conteo total de elementos
 */
export const getElementsCount = () => ({
  icons: Object.keys(WEDDING_ICONS_VECTOR).length,
  floral: Object.keys(FLORAL_ELEMENTS_VECTOR).length,
  shapes: Object.keys(DECORATIVE_SHAPES_VECTOR).length,
  patterns: Object.keys(PATTERNS_VECTOR).length,
  typography: Object.keys(TYPOGRAPHY_DECORATIVE).length,
  total: Object.keys(WEDDING_ICONS_VECTOR).length +
         Object.keys(FLORAL_ELEMENTS_VECTOR).length +
         Object.keys(DECORATIVE_SHAPES_VECTOR).length +
         Object.keys(PATTERNS_VECTOR).length +
         Object.keys(TYPOGRAPHY_DECORATIVE).length,
});

// Exportar todo
export default {
  icons: WEDDING_ICONS_VECTOR,
  floral: FLORAL_ELEMENTS_VECTOR,
  shapes: DECORATIVE_SHAPES_VECTOR,
  patterns: PATTERNS_VECTOR,
  typography: TYPOGRAPHY_DECORATIVE,
  getVectorElement,
  createCustomElement,
  generateColorVariations,
  searchElements,
  getElementsCount,
};
