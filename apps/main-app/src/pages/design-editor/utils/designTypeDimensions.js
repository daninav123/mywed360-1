/**
 * Dimensiones recomendadas para cada tipo de diseño
 */

export const DESIGN_TYPE_DIMENSIONS = {
  invitation: {
    name: 'Invitación',
    sizes: [
      { id: 'a5', label: 'A5 (148 x 210 mm)', width: 1050, height: 1485 },
      { id: 'a6', label: 'A6 (105 x 148 mm)', width: 744, height: 1050 },
      { id: '5x7', label: '5" x 7"', width: 1050, height: 1470 },
      { id: '4x6', label: '4" x 6"', width: 840, height: 1260 },
      { id: 'square', label: 'Cuadrada (148 x 148 mm)', width: 1050, height: 1050 },
    ],
    defaultSize: { width: 1050, height: 1485 },
    supportsDoubleSided: true,
  },
  
  logo: {
    name: 'Logo',
    sizes: [
      { id: 'square-500', label: '500 x 500 px', width: 500, height: 500 },
      { id: 'square-800', label: '800 x 800 px', width: 800, height: 800 },
      { id: 'square-1000', label: '1000 x 1000 px', width: 1000, height: 1000 },
      { id: 'wide', label: 'Panorámico (1200 x 600)', width: 1200, height: 600 },
    ],
    defaultSize: { width: 500, height: 500 },
    supportsDoubleSided: false,
  },
  
  menu: {
    name: 'Menú',
    sizes: [
      { id: 'a4', label: 'A4 (210 x 297 mm)', width: 1485, height: 2100 },
      { id: 'a5', label: 'A5 (148 x 210 mm)', width: 1050, height: 1485 },
      { id: 'letter', label: 'Carta (216 x 279 mm)', width: 1530, height: 1980 },
      { id: 'square', label: 'Cuadrado (210 x 210 mm)', width: 1485, height: 1485 },
    ],
    defaultSize: { width: 1485, height: 2100 },
    supportsDoubleSided: true,
  },
  
  savethedate: {
    name: 'Save the Date',
    sizes: [
      { id: 'postcard', label: 'Postal (105 x 148 mm)', width: 744, height: 1050 },
      { id: 'a6', label: 'A6 (105 x 148 mm)', width: 744, height: 1050 },
      { id: '4x6', label: '4" x 6"', width: 840, height: 1260 },
      { id: 'square', label: 'Cuadrada (148 x 148 mm)', width: 1050, height: 1050 },
    ],
    defaultSize: { width: 744, height: 1050 },
    supportsDoubleSided: true,
  },
  
  program: {
    name: 'Programa',
    sizes: [
      { id: 'a5', label: 'A5 (148 x 210 mm)', width: 1050, height: 1485 },
      { id: 'a6', label: 'A6 (105 x 148 mm)', width: 744, height: 1050 },
      { id: 'letter-half', label: 'Media carta', width: 1080, height: 1400 },
    ],
    defaultSize: { width: 1050, height: 1485 },
    supportsDoubleSided: true,
  },
  
  signage: {
    name: 'Señalética',
    sizes: [
      { id: 'a3', label: 'A3 (297 x 420 mm)', width: 2100, height: 2970 },
      { id: 'a4', label: 'A4 (210 x 297 mm)', width: 1485, height: 2100 },
      { id: 'poster-small', label: 'Cartel pequeño (500 x 700)', width: 1400, height: 2000 },
      { id: 'banner', label: 'Banner (800 x 300)', width: 2400, height: 900 },
    ],
    defaultSize: { width: 1485, height: 2100 },
    supportsDoubleSided: false,
  },
  
  thankyou: {
    name: 'Agradecimiento',
    sizes: [
      { id: 'postcard', label: 'Postal (105 x 148 mm)', width: 744, height: 1050 },
      { id: 'a6', label: 'A6 (105 x 148 mm)', width: 744, height: 1050 },
      { id: 'square', label: 'Cuadrada (105 x 105 mm)', width: 744, height: 744 },
    ],
    defaultSize: { width: 744, height: 1050 },
    supportsDoubleSided: true,
  },
  
  other: {
    name: 'Personalizado',
    sizes: [
      { id: 'a4', label: 'A4', width: 1485, height: 2100 },
      { id: 'a5', label: 'A5', width: 1050, height: 1485 },
      { id: 'square', label: 'Cuadrado', width: 1050, height: 1050 },
      { id: 'custom', label: 'Personalizado', width: 1050, height: 1485 },
    ],
    defaultSize: { width: 1050, height: 1485 },
    supportsDoubleSided: true,
  },
};

/**
 * Obtener dimensiones para un tipo de diseño
 */
export function getDimensionsForType(designType) {
  return DESIGN_TYPE_DIMENSIONS[designType] || DESIGN_TYPE_DIMENSIONS.other;
}

/**
 * Verificar si un tipo soporta doble cara
 */
export function supportsDoubleSided(designType) {
  const dims = DESIGN_TYPE_DIMENSIONS[designType];
  return dims ? dims.supportsDoubleSided : false;
}
