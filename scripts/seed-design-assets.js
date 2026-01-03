import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!admin.apps.length) {
  const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'mywed360.appspot.com',
  });
}

const db = admin.firestore();

const designAssets = [
  {
    name: 'Rama Floral Esquina Izquierda',
    type: 'illustration',
    category: 'florals',
    tags: ['flower', 'branch', 'corner', 'left', 'decorative', 'romantic'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M10,190 Q30,180 50,170 Q70,160 80,140 Q85,130 90,120 L100,110 Q110,100 120,90" stroke="#8B7355" stroke-width="2" fill="none"/><circle cx="50" cy="170" r="8" fill="#E8DCC4"/><circle cx="80" cy="140" r="10" fill="#C19A6B"/><circle cx="100" cy="110" r="6" fill="#E8DCC4"/></svg>`,
    svgUrl: '',
    thumbnail: '',
    aiMetadata: {
      style: 'outlined',
      complexity: 'medium',
      dominantColors: ['#8B7355', '#E8DCC4', '#C19A6B'],
      mood: ['romantic', 'elegant', 'natural'],
      usageContext: ['invitation', 'menu'],
      aiCompatible: true,
    },
    dimensions: { width: 200, height: 200 },
    printQuality: 300,
    premium: false,
    featured: true,
    downloads: 0,
  },
  {
    name: 'Marco Geométrico Circular',
    type: 'frame',
    category: 'frames',
    tags: ['frame', 'circle', 'geometric', 'minimal', 'border'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="140" stroke="#8B7355" stroke-width="3" fill="none"/><circle cx="150" cy="150" r="120" stroke="#8B7355" stroke-width="1" fill="none"/></svg>`,
    svgUrl: '',
    thumbnail: '',
    aiMetadata: {
      style: 'outlined',
      complexity: 'simple',
      dominantColors: ['#8B7355'],
      mood: ['minimal', 'elegant', 'modern'],
      usageContext: ['invitation', 'logo', 'signage'],
      aiCompatible: true,
    },
    dimensions: { width: 300, height: 300 },
    printQuality: 300,
    premium: false,
    featured: true,
    downloads: 0,
  },
  {
    name: 'Corazón Minimalista',
    type: 'icon',
    category: 'icons',
    tags: ['heart', 'love', 'wedding', 'minimal', 'romantic'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,85 L20,55 Q10,45 10,30 Q10,15 25,15 Q35,15 45,25 L50,30 L55,25 Q65,15 75,15 Q90,15 90,30 Q90,45 80,55 Z" stroke="#C19A6B" stroke-width="2" fill="none"/></svg>`,
    svgUrl: '',
    thumbnail: '',
    aiMetadata: {
      style: 'outlined',
      complexity: 'simple',
      dominantColors: ['#C19A6B'],
      mood: ['romantic', 'love', 'minimal'],
      usageContext: ['invitation', 'menu', 'tag'],
      aiCompatible: true,
    },
    dimensions: { width: 100, height: 100 },
    printQuality: 300,
    premium: false,
    featured: true,
    downloads: 0,
  },
  {
    name: 'Divisor Ornamental',
    type: 'divider',
    category: 'ornaments',
    tags: ['divider', 'ornament', 'decorative', 'separator', 'elegant'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 50"><path d="M0,25 L150,25 M250,25 L400,25" stroke="#8B7355" stroke-width="1"/><circle cx="200" cy="25" r="10" stroke="#8B7355" stroke-width="1" fill="#E8DCC4"/><circle cx="180" cy="25" r="3" fill="#C19A6B"/><circle cx="220" cy="25" r="3" fill="#C19A6B"/></svg>`,
    svgUrl: '',
    thumbnail: '',
    aiMetadata: {
      style: 'outlined',
      complexity: 'simple',
      dominantColors: ['#8B7355', '#E8DCC4'],
      mood: ['elegant', 'decorative', 'classic'],
      usageContext: ['invitation', 'menu', 'program'],
      aiCompatible: true,
    },
    dimensions: { width: 400, height: 50 },
    printQuality: 300,
    premium: false,
    featured: true,
    downloads: 0,
  },
  {
    name: 'Anillos Entrelazados',
    type: 'icon',
    category: 'icons',
    tags: ['rings', 'wedding', 'marriage', 'union', 'symbol'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100"><circle cx="50" cy="50" r="30" stroke="#D4AF37" stroke-width="3" fill="none"/><circle cx="100" cy="50" r="30" stroke="#D4AF37" stroke-width="3" fill="none"/></svg>`,
    svgUrl: '',
    thumbnail: '',
    aiMetadata: {
      style: 'outlined',
      complexity: 'simple',
      dominantColors: ['#D4AF37'],
      mood: ['wedding', 'union', 'classic'],
      usageContext: ['invitation', 'program', 'signage'],
      aiCompatible: true,
    },
    dimensions: { width: 150, height: 100 },
    printQuality: 300,
    premium: false,
    featured: true,
    downloads: 0,
  },
  {
    name: 'Eucalipto Rama',
    type: 'illustration',
    category: 'florals',
    tags: ['eucalyptus', 'leaves', 'natural', 'branch', 'botanical'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 300"><path d="M50,10 L50,290" stroke="#7D8F69" stroke-width="2"/><ellipse cx="30" cy="50" rx="15" ry="8" fill="#A4B494" opacity="0.8"/><ellipse cx="70" cy="80" rx="15" ry="8" fill="#A4B494" opacity="0.8"/><ellipse cx="35" cy="120" rx="15" ry="8" fill="#A4B494" opacity="0.8"/><ellipse cx="65" cy="160" rx="15" ry="8" fill="#A4B494" opacity="0.8"/><ellipse cx="40" cy="200" rx="15" ry="8" fill="#A4B494" opacity="0.8"/><ellipse cx="60" cy="240" rx="15" ry="8" fill="#A4B494" opacity="0.8"/></svg>`,
    svgUrl: '',
    thumbnail: '',
    aiMetadata: {
      style: 'filled',
      complexity: 'medium',
      dominantColors: ['#7D8F69', '#A4B494'],
      mood: ['natural', 'botanical', 'rustic'],
      usageContext: ['invitation', 'menu', 'signage'],
      aiCompatible: true,
    },
    dimensions: { width: 100, height: 300 },
    printQuality: 300,
    premium: false,
    featured: true,
    downloads: 0,
  },
  {
    name: 'Ampersand Elegante',
    type: 'typography',
    category: 'ornaments',
    tags: ['ampersand', 'and', 'typography', 'decorative', 'elegant'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 200"><path d="M80,50 Q100,30 90,10 Q80,-5 60,10 Q50,20 50,40 Q50,60 70,70 L100,90 Q120,100 120,130 Q120,160 100,180 Q80,195 50,180 Q30,170 30,150" stroke="#8B7355" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
    svgUrl: '',
    thumbnail: '',
    aiMetadata: {
      style: 'outlined',
      complexity: 'medium',
      dominantColors: ['#8B7355'],
      mood: ['elegant', 'classic', 'romantic'],
      usageContext: ['invitation', 'signage'],
      aiCompatible: true,
    },
    dimensions: { width: 150, height: 200 },
    printQuality: 300,
    premium: false,
    featured: true,
    downloads: 0,
  },
  {
    name: 'Corona Floral',
    type: 'illustration',
    category: 'florals',
    tags: ['wreath', 'crown', 'flowers', 'circular', 'decorative'],
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="100" stroke="#7D8F69" stroke-width="2" fill="none" stroke-dasharray="10,5"/><circle cx="150" cy="50" r="12" fill="#FFB6C1"/><circle cx="250" cy="150" r="12" fill="#FFB6C1"/><circle cx="150" cy="250" r="12" fill="#FFB6C1"/><circle cx="50" cy="150" r="12" fill="#FFB6C1"/><circle cx="210" cy="90" r="8" fill="#E8DCC4"/><circle cx="210" cy="210" r="8" fill="#E8DCC4"/><circle cx="90" cy="210" r="8" fill="#E8DCC4"/><circle cx="90" cy="90" r="8" fill="#E8DCC4"/></svg>`,
    svgUrl: '',
    thumbnail: '',
    aiMetadata: {
      style: 'filled',
      complexity: 'medium',
      dominantColors: ['#7D8F69', '#FFB6C1', '#E8DCC4'],
      mood: ['romantic', 'natural', 'decorative'],
      usageContext: ['invitation', 'signage', 'program'],
      aiCompatible: true,
    },
    dimensions: { width: 300, height: 300 },
    printQuality: 300,
    premium: false,
    featured: true,
    downloads: 0,
  },
];

async function seedDesignAssets() {
  console.log('🌱 Iniciando seed de design assets...');

  const batch = db.batch();
  let count = 0;

  for (const asset of designAssets) {
    const assetId = `asset-${Date.now()}-${count}`;
    const assetRef = db.collection('designAssets').doc(assetId);

    batch.set(assetRef, {
      ...asset,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`  ✓ ${asset.name} (${asset.type})`);
    count++;
  }

  await batch.commit();

  console.log(`\n✅ ${count} assets creados exitosamente en Firestore`);
  console.log('\n📝 Próximos pasos:');
  console.log('  1. Los assets se han creado con SVG inline');
  console.log('  2. Para producción, sube SVGs a Storage y actualiza svgUrl');
  console.log('  3. Genera thumbnails para preview rápido');
  console.log('  4. Añade más assets según necesidades');
}

seedDesignAssets()
  .then(() => {
    console.log('\n🎉 Seed completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en seed:', error);
    process.exit(1);
  });
