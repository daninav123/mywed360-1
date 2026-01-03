// 80+ elementos SVG adicionales organizados por categoría
const encodeSVG = (svg) => {
  if (typeof window !== 'undefined' && window.btoa) {
    return 'data:image/svg+xml;base64,' + window.btoa(svg);
  }
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};

// Genera variaciones de elementos con diferentes colores y tamaños
const colors = ['#8B7355', '#C19A6B', '#E8DCC4', '#D4AF37', '#7D8F69', '#A4B494', '#FFB6C1', '#5C4033', '#3D2817', '#A67C52'];

const generateLeafAssets = () => {
  const leaves = [];
  for (let i = 0; i < 15; i++) {
    const color = colors[i % colors.length];
    leaves.push({
      id: `leaf-${i}`,
      name: `Hoja ${i + 1}`,
      type: 'illustration',
      category: 'florals',
      tags: ['leaf', 'nature', 'botanical'],
      svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150"><ellipse cx="50" cy="75" rx="${20 + i * 2}" ry="${40 + i * 3}" fill="${color}" opacity="0.8"/><path d="M50,10 L50,140" stroke="${color}" stroke-width="2"/></svg>`,
      thumbnail: encodeSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150"><ellipse cx="50" cy="75" rx="25" ry="45" fill="${color}"/></svg>`),
    });
  }
  return leaves;
};

const generateFlowerAssets = () => {
  const flowers = [];
  for (let i = 0; i < 20; i++) {
    const color = colors[i % colors.length];
    const petals = 5 + (i % 3);
    flowers.push({
      id: `flower-${i}`,
      name: `Flor ${i + 1}`,
      type: 'illustration',
      category: 'florals',
      tags: ['flower', 'bloom', 'decorative'],
      svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="${8 + i % 5}" fill="#FFD700"/>${Array(petals).fill(0).map((_, p) => {
        const angle = (p / petals) * Math.PI * 2;
        const x = 50 + Math.cos(angle) * 20;
        const y = 50 + Math.sin(angle) * 20;
        return `<circle cx="${x}" cy="${y}" r="${10 + i % 4}" fill="${color}" opacity="0.8"/>`;
      }).join('')}</svg>`,
      thumbnail: encodeSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="8" fill="#FFD700"/><circle cx="50" cy="30" r="12" fill="${color}"/></svg>`),
    });
  }
  return flowers;
};

const generateBorderAssets = () => {
  const borders = [];
  for (let i = 0; i < 15; i++) {
    const color = colors[i % colors.length];
    borders.push({
      id: `border-${i}`,
      name: `Borde ${i + 1}`,
      type: 'frame',
      category: 'frames',
      tags: ['border', 'frame', 'decorative'],
      svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect x="${10 + i}" y="${10 + i}" width="${380 - i * 2}" height="${380 - i * 2}" stroke="${color}" stroke-width="${2 + i % 3}" fill="none" rx="${i * 3}"/></svg>`,
      thumbnail: encodeSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect x="10" y="10" width="380" height="380" stroke="${color}" stroke-width="2" fill="none"/></svg>`),
    });
  }
  return borders;
};

const generateOrnamentAssets = () => {
  const ornaments = [];
  const shapes = [
    { path: 'M200,50 L250,100 L200,150 L150,100 Z', name: 'Diamante' },
    { path: 'M150,100 L250,100 M200,50 L200,150', name: 'Cruz' },
    { path: 'M200,50 L220,110 L280,110 L230,150 L250,210 L200,170 L150,210 L170,150 L120,110 L180,110 Z', name: 'Estrella' },
  ];
  
  shapes.forEach((shape, i) => {
    colors.slice(0, 5).forEach((color, j) => {
      ornaments.push({
        id: `ornament-${i}-${j}`,
        name: `${shape.name} ${j + 1}`,
        type: 'ornament',
        category: 'ornaments',
        tags: ['decorative', 'ornament', shape.name.toLowerCase()],
        svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><path d="${shape.path}" stroke="${color}" stroke-width="${2 + j}" fill="none"/></svg>`,
        thumbnail: encodeSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><path d="${shape.path}" stroke="${color}" stroke-width="2" fill="none"/></svg>`),
      });
    });
  });
  
  return ornaments;
};

const generateArrowAssets = () => {
  const arrows = [];
  for (let i = 0; i < 10; i++) {
    const color = colors[i % colors.length];
    arrows.push({
      id: `arrow-${i}`,
      name: `Flecha ${i + 1}`,
      type: 'icon',
      category: 'icons',
      tags: ['arrow', 'direction', 'pointer'],
      svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M20,50 L160,50 M140,30 L160,50 L140,70" stroke="${color}" stroke-width="${2 + i % 3}" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      thumbnail: encodeSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M20,50 L160,50 M140,30 L160,50 L140,70" stroke="${color}" stroke-width="2" fill="none"/></svg>`),
    });
  }
  return arrows;
};

const generateBannerAssets = () => {
  const banners = [];
  for (let i = 0; i < 8; i++) {
    const color = colors[i % colors.length];
    banners.push({
      id: `banner-${i}`,
      name: `Banner ${i + 1}`,
      type: 'frame',
      category: 'frames',
      tags: ['banner', 'ribbon', 'label'],
      svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100"><path d="M50,30 L350,30 L360,50 L350,70 L50,70 L40,50 Z" fill="${color}" opacity="0.8"/><path d="M50,30 L350,30 L360,50 L350,70 L50,70 L40,50 Z" stroke="${colors[(i + 1) % colors.length]}" stroke-width="2" fill="none"/></svg>`,
      thumbnail: encodeSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100"><path d="M50,30 L350,30 L360,50 L350,70 L50,70 L40,50 Z" fill="${color}"/></svg>`),
    });
  }
  return banners;
};

export const EXPANDED_ASSETS = [
  ...generateLeafAssets(),
  ...generateFlowerAssets(),
  ...generateBorderAssets(),
  ...generateOrnamentAssets(),
  ...generateArrowAssets(),
  ...generateBannerAssets(),
];

export default EXPANDED_ASSETS;
