const encodeSVG = (svg) => {
  if (typeof window !== 'undefined' && window.btoa) {
    return 'data:image/svg+xml;base64,' + window.btoa(svg);
  }
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};

export const MOCK_DESIGN_ASSETS = [
  {
    id: 'floral-corner-left',
    name: 'Rama Floral Esquina Izquierda',
    type: 'illustration',
    category: 'florals',
    tags: ['flower', 'branch', 'corner', 'left', 'decorative', 'romantic'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M10,190 Q30,180 50,170 Q70,160 80,140 Q85,130 90,120 L100,110 Q110,100 120,90" stroke="#8B7355" stroke-width="2" fill="none"/><circle cx="50" cy="170" r="8" fill="#E8DCC4"/><circle cx="80" cy="140" r="10" fill="#C19A6B"/><circle cx="100" cy="110" r="6" fill="#E8DCC4"/></svg>`,
    thumbnail: encodeSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M10,190 Q30,180 50,170 Q70,160 80,140 Q85,130 90,120 L100,110 Q110,100 120,90" stroke="#8B7355" stroke-width="2" fill="none"/><circle cx="50" cy="170" r="8" fill="#E8DCC4"/></svg>`),
  },
  {
    id: 'frame-circle',
    name: 'Marco Geométrico Circular',
    type: 'frame',
    category: 'frames',
    tags: ['frame', 'circle', 'geometric', 'minimal', 'border'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="140" stroke="#8B7355" stroke-width="3" fill="none"/><circle cx="150" cy="150" r="120" stroke="#8B7355" stroke-width="1" fill="none"/></svg>`,
    thumbnail: encodeSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="140" stroke="#8B7355" stroke-width="3" fill="none"/></svg>`),
  },
  {
    id: 'heart-minimal',
    name: 'Corazón Minimalista',
    type: 'icon',
    category: 'icons',
    tags: ['heart', 'love', 'wedding', 'minimal', 'romantic'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,85 L20,55 Q10,45 10,30 Q10,15 25,15 Q35,15 45,25 L50,30 L55,25 Q65,15 75,15 Q90,15 90,30 Q90,45 80,55 Z" stroke="#C19A6B" stroke-width="2" fill="none"/></svg>`,
    thumbnail: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,85 L20,55 Q10,45 10,30 Q10,15 25,15 Q35,15 45,25 L50,30 L55,25 Q65,15 75,15 Q90,15 90,30 Q90,45 80,55 Z" stroke="#C19A6B" stroke-width="2" fill="none"/></svg>`),
  },
  {
    id: 'divider-ornamental',
    name: 'Divisor Ornamental',
    type: 'divider',
    category: 'ornaments',
    tags: ['divider', 'ornament', 'decorative', 'separator', 'elegant'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 50"><path d="M0,25 L150,25 M250,25 L400,25" stroke="#8B7355" stroke-width="1"/><circle cx="200" cy="25" r="10" stroke="#8B7355" stroke-width="1" fill="#E8DCC4"/><circle cx="180" cy="25" r="3" fill="#C19A6B"/><circle cx="220" cy="25" r="3" fill="#C19A6B"/></svg>`,
    thumbnail: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 50"><path d="M0,25 L150,25 M250,25 L400,25" stroke="#8B7355" stroke-width="1"/><circle cx="200" cy="25" r="10" stroke="#8B7355" stroke-width="1" fill="#E8DCC4"/></svg>`),
  },
  {
    id: 'rings-wedding',
    name: 'Anillos Entrelazados',
    type: 'icon',
    category: 'icons',
    tags: ['rings', 'wedding', 'marriage', 'union', 'symbol'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100"><circle cx="50" cy="50" r="30" stroke="#D4AF37" stroke-width="3" fill="none"/><circle cx="100" cy="50" r="30" stroke="#D4AF37" stroke-width="3" fill="none"/></svg>`,
    thumbnail: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100"><circle cx="50" cy="50" r="30" stroke="#D4AF37" stroke-width="3" fill="none"/></svg>`),
  },
  {
    id: 'eucalyptus-branch',
    name: 'Eucalipto Rama',
    type: 'illustration',
    category: 'florals',
    tags: ['eucalyptus', 'leaves', 'natural', 'branch', 'botanical'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 300"><path d="M50,10 L50,290" stroke="#7D8F69" stroke-width="2"/><ellipse cx="30" cy="50" rx="15" ry="8" fill="#A4B494" opacity="0.8"/><ellipse cx="70" cy="80" rx="15" ry="8" fill="#A4B494" opacity="0.8"/><ellipse cx="35" cy="120" rx="15" ry="8" fill="#A4B494" opacity="0.8"/><ellipse cx="65" cy="160" rx="15" ry="8" fill="#A4B494" opacity="0.8"/><ellipse cx="40" cy="200" rx="15" ry="8" fill="#A4B494" opacity="0.8"/><ellipse cx="60" cy="240" rx="15" ry="8" fill="#A4B494" opacity="0.8"/></svg>`,
    thumbnail: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 300"><path d="M50,10 L50,290" stroke="#7D8F69" stroke-width="2"/><ellipse cx="30" cy="50" rx="15" ry="8" fill="#A4B494" opacity="0.8"/></svg>`),
  },
  {
    id: 'ampersand-elegant',
    name: 'Ampersand Elegante',
    type: 'typography',
    category: 'ornaments',
    tags: ['ampersand', 'and', 'typography', 'decorative', 'elegant'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 200"><path d="M80,50 Q100,30 90,10 Q80,-5 60,10 Q50,20 50,40 Q50,60 70,70 L100,90 Q120,100 120,130 Q120,160 100,180 Q80,195 50,180 Q30,170 30,150" stroke="#8B7355" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
    thumbnail: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 200"><path d="M80,50 Q100,30 90,10 Q80,-5 60,10 Q50,20 50,40 Q50,60 70,70 L100,90 Q120,100 120,130 Q120,160 100,180 Q80,195 50,180 Q30,170 30,150" stroke="#8B7355" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`),
  },
  {
    id: 'floral-wreath',
    name: 'Corona Floral',
    type: 'illustration',
    category: 'florals',
    tags: ['wreath', 'crown', 'flowers', 'circular', 'decorative'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="100" stroke="#7D8F69" stroke-width="2" fill="none" stroke-dasharray="10,5"/><circle cx="150" cy="50" r="12" fill="#FFB6C1"/><circle cx="250" cy="150" r="12" fill="#FFB6C1"/><circle cx="150" cy="250" r="12" fill="#FFB6C1"/><circle cx="50" cy="150" r="12" fill="#FFB6C1"/></svg>`,
    thumbnail: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="100" stroke="#7D8F69" stroke-width="2" fill="none" stroke-dasharray="10,5"/><circle cx="150" cy="50" r="12" fill="#FFB6C1"/></svg>`),
  },
];

// Generar más assets variando los existentes
const generateMoreAssets = () => {
  const additionalAssets = [];
  const colors = ['#8B7355', '#C19A6B', '#E8DCC4', '#D4AF37', '#7D8F69', '#A4B494', '#FFB6C1'];
  
  // Más marcos
  for (let i = 0; i < 10; i++) {
    const color = colors[i % colors.length];
    additionalAssets.push({
      id: `frame-rect-${i}`,
      name: `Marco Rectangular ${i + 1}`,
      type: 'frame',
      category: 'frames',
      tags: ['frame', 'rectangle', 'border', 'decorative'],
      svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect x="10" y="10" width="380" height="280" stroke="${color}" stroke-width="${2 + i % 3}" fill="none" rx="${5 + i * 3}"/></svg>`,
      thumbnail: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect x="10" y="10" width="380" height="280" stroke="${color}" stroke-width="2" fill="none"/></svg>`),
    });
  }
  
  // Más iconos
  const icons = [
    { path: 'M50,30 L70,50 L50,70 L30,50 Z', name: 'Diamante' },
    { path: 'M30,50 L70,50 M50,30 L50,70', name: 'Cruz' },
    { path: 'M30,50 L50,30 L70,50 L50,70 Z', name: 'Estrella Simple' },
  ];
  
  icons.forEach((icon, i) => {
    const color = colors[(i + 2) % colors.length];
    additionalAssets.push({
      id: `icon-${i + 10}`,
      name: icon.name,
      type: 'icon',
      category: 'icons',
      tags: ['icon', 'simple', 'geometric'],
      svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${icon.path}" stroke="${color}" stroke-width="3" fill="none"/></svg>`,
      thumbnail: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${icon.path}" stroke="${color}" stroke-width="3" fill="none"/></svg>`),
    });
  });
  
  // Más divisores
  for (let i = 0; i < 5; i++) {
    const color = colors[i % colors.length];
    additionalAssets.push({
      id: `divider-${i + 5}`,
      name: `Divisor ${i + 1}`,
      type: 'divider',
      category: 'ornaments',
      tags: ['divider', 'separator', 'line'],
      svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 20"><line x1="0" y1="10" x2="400" y2="10" stroke="${color}" stroke-width="${1 + i % 3}" stroke-dasharray="${i * 5},${i * 2}"/></svg>`,
      thumbnail: encodeSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 20"><line x1="0" y1="10" x2="400" y2="10" stroke="${color}" stroke-width="2"/></svg>`),
    });
  }
  
  return additionalAssets;
};

const GENERATED_ASSETS = generateMoreAssets();

export const ALL_DESIGN_ASSETS = [...MOCK_DESIGN_ASSETS, ...GENERATED_ASSETS];

export const loadExpandedAssets = async () => {
  try {
    const { EXPANDED_ASSETS } = await import('./expandedAssets');
    return [...ALL_DESIGN_ASSETS, ...EXPANDED_ASSETS];
  } catch (error) {
    console.warn('Expanded assets not loaded:', error);
    return ALL_DESIGN_ASSETS;
  }
};

export default ALL_DESIGN_ASSETS;
