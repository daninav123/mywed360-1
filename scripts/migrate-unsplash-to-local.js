#!/usr/bin/env node

/**
 * Script para migrar referencias de Unsplash a imágenes locales generadas por IA
 * 
 * Uso:
 *   node scripts/migrate-unsplash-to-local.js
 * 
 * Este script reemplaza todas las URLs de Unsplash en el código con rutas a assets locales
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Mapeo de URLs de Unsplash a rutas locales
const IMAGE_MAPPINGS = {
  // SERVICIOS
  'photo-1537633552985-df8429e8048b': '/assets/services/fotografia.webp',
  'photo-1492691527719-9d1e07e534b4': '/assets/services/video.webp',
  'photo-1530023367847-a683933f4177': '/assets/services/catering.webp',
  'photo-1490750967868-88aa4486c946': '/assets/services/flores.webp',
  'photo-1519225421980-715cb0215aed': '/assets/services/decoracion.webp',
  'photo-1520854221050-0f4caff449fb': '/assets/services/planner.webp',
  'photo-1470229722913-7c0e2dbbafd3': '/assets/services/musica.webp',
  'photo-1464349095431-e9a21285b5f3': '/assets/services/pastel.webp',
  'photo-1487412947147-5cebf100ffc2': '/assets/services/maquillaje.webp',
  'photo-1560066984-138dadb4c035': '/assets/services/peluqueria.webp',
  'photo-1530103043960-ef38714abb15': '/assets/services/invitaciones.webp',
  'photo-1470225620780-dba8ba36b745': '/assets/services/iluminacion.webp',
  'photo-1496417263034-38ec4f0b665a': '/assets/services/mobiliario.webp',
  'photo-1493238792000-8113da705763': '/assets/services/transporte.webp',
  'photo-1496619684348-0c258b6e7278': '/assets/services/viajes.webp',
  'photo-1522312346375-d1a52e2b99b3': '/assets/services/joyeria.webp',
  'photo-1519741497674-611481863552': '/assets/services/default.webp',

  // ILUSTRACIONES FLORALES
  'photo-1455659817273-f96807779a8a': '/assets/florals/rose-spray.png',
  'photo-1452827073306-6e6e661baf57': '/assets/florals/peony-cluster.png',
  'photo-1518709268805-4e9042af9f23': '/assets/florals/olive-branch-watercolor.png',
  'photo-1478145046317-39f10e56b5e9': '/assets/florals/wreath-greenery.png',

  // FONDOS Y TEXTURAS
  'photo-1557821552-17105176677c': '/assets/backgrounds/texture-paper.webp',
  'photo-1509042239860-f550ce710b93': '/assets/backgrounds/texture-linen.webp',
  'photo-1579541814924-49fef17c5be5': '/assets/backgrounds/texture-canvas.webp',
  'photo-1606663725948-ec221b7bc1a0': '/assets/backgrounds/texture-kraft.webp',
  'photo-1557672172-298e090bd0f1': '/assets/backgrounds/watercolor-blush.webp',
  'photo-1557672199-6a1c2b21c7dc': '/assets/backgrounds/watercolor-sage.webp',
  'photo-1557672184-1e36e9e1e0c7': '/assets/backgrounds/watercolor-blue.webp',

  // LANDING PAGES
  'photo-1465495976277-4387d4b0b4c6': '/assets/landing/couple-planning.webp',
  'photo-1529634896862-08db0e0ea1cf': '/assets/landing/demo-decoration.webp',
  'photo-1499955085172-a104c9463ece': '/assets/landing/demo-ceremony.webp',
  'photo-1502920917128-1aa500764b1c': '/assets/landing/demo-flowers.webp',
  
  // MAPEOS ADICIONALES ENCONTRADOS EN I18N
  'photo-1508435234994-67cfd7690508': '/assets/services/fotografia.webp',
  'photo-1555244162-803834f70033': '/assets/services/catering.webp',
  'photo-1429962714451-bb934ecdc4ec': '/assets/services/musica.webp',
  'photo-1526047932273-341f2a7631f9': '/assets/services/flores.webp',
};

// Archivos a procesar
const FILES_TO_PROCESS = [
  'apps/main-app/src/utils/providerImages.js',
  'apps/admin-app/src/utils/providerImages.js',
  'apps/suppliers-app/src/utils/providerImages.js',
  'apps/main-app/src/pages/design-editor/data/floralIllustrations.js',
  'apps/main-app/src/pages/design-editor/data/backgrounds.js',
  'apps/main-app/src/pages/Landing2.jsx',
  'apps/main-app/src/pages/ProveedoresNuevo.backup.jsx',
  'apps/admin-app/src/services/wallService.js',
  'apps/main-app/src/services/wallService.js',
  'apps/suppliers-app/src/services/wallService.js',
  'apps/admin-app/src/services/inspirationService.js',
  'apps/main-app/src/services/inspirationService.js',
  'apps/suppliers-app/src/services/inspirationService.js',
  // Archivos i18n
  'apps/admin-app/src/i18n/locales/en/common.json',
  'apps/admin-app/src/i18n/locales/es/common.json',
  'apps/admin-app/src/i18n/locales/es-AR/common.json',
  'apps/admin-app/src/i18n/locales/es-MX/common.json',
  'apps/admin-app/src/i18n/locales/fr/common.json',
  'apps/main-app/src/i18n/locales/en/common.json',
  'apps/main-app/src/i18n/locales/es/common.json',
  'apps/main-app/src/i18n/locales/es-AR/common.json',
  'apps/main-app/src/i18n/locales/es-MX/common.json',
  'apps/main-app/src/i18n/locales/fr/common.json',
  'apps/suppliers-app/src/i18n/locales/en/common.json',
  'apps/suppliers-app/src/i18n/locales/es/common.json',
  'apps/suppliers-app/src/i18n/locales/es-AR/common.json',
  'apps/suppliers-app/src/i18n/locales/es-MX/common.json',
  'apps/suppliers-app/src/i18n/locales/fr/common.json',
];

let totalReplacements = 0;
let filesModified = 0;

function replaceUnsplashUrls(content) {
  let modified = content;
  let replacements = 0;

  // Iterar sobre cada mapeo
  for (const [unsplashId, localPath] of Object.entries(IMAGE_MAPPINGS)) {
    // Crear regex para encontrar todas las variantes de la URL
    const patterns = [
      // Con parámetros de query
      new RegExp(`https://images\\.unsplash\\.com/${unsplashId}[^'"\\s]*`, 'g'),
      // Sin scheme
      new RegExp(`images\\.unsplash\\.com/${unsplashId}[^'"\\s]*`, 'g'),
    ];

    patterns.forEach(pattern => {
      const matches = modified.match(pattern);
      if (matches) {
        replacements += matches.length;
        modified = modified.replace(pattern, localPath);
      }
    });
  }

  return { content: modified, replacements };
}

function processFile(filePath) {
  const fullPath = path.join(rootDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const { content: newContent, replacements } = replaceUnsplashUrls(content);

  if (replacements > 0) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ ${filePath}: ${replacements} reemplazos`);
    filesModified++;
    totalReplacements += replacements;
  } else {
    console.log(`⏭️  ${filePath}: sin cambios`);
  }
}

console.log('\n🎨 Iniciando migración de Unsplash a imágenes locales...\n');

FILES_TO_PROCESS.forEach(processFile);

console.log('\n📊 Resumen:');
console.log(`   Archivos modificados: ${filesModified}`);
console.log(`   Total reemplazos: ${totalReplacements}`);
console.log('\n✨ Migración completada!\n');
console.log('⚠️  IMPORTANTE: Asegúrate de generar las imágenes con IA según el catálogo en docs/AI_IMAGES_CATALOG.md\n');
