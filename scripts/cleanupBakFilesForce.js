/**
 * Script para eliminar TODOS los archivos .bak* (tracked o no por Git)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const isDryRun = process.argv.includes('--dry-run');

console.log('\n🧹 Limpieza Forzada de Archivos .bak\n');
console.log('=========================================\n');

if (isDryRun) {
  console.log('🔍 Modo DRY-RUN (no se eliminarán archivos)\n');
}

const bakFiles = [];
let totalSize = 0;

function scanDirectory(dir, depth = 0) {
  if (depth > 10) return;

  const skip = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next'];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      if (skip.includes(item)) continue;

      const fullPath = path.join(dir, item);

      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath, depth + 1);
        } else if (item.includes('.bak') || item.includes('.old')) {
          const relativePath = path.relative(ROOT, fullPath);
          const sizeKB = (stat.size / 1024).toFixed(2);

          bakFiles.push({
            path: relativePath,
            fullPath,
            size: stat.size,
            sizeKB,
          });

          totalSize += stat.size;
        }
      } catch (err) {
        // Ignorar errores de permisos
      }
    }
  } catch (err) {
    // Ignorar errores
  }
}

console.log('📂 Escaneando directorios...\n');
scanDirectory(ROOT);

if (bakFiles.length === 0) {
  console.log('✅ No se encontraron archivos .bak\n');
  process.exit(0);
}

console.log(`📦 Encontrados: ${bakFiles.length} archivos\n`);
console.log(`💾 Tamaño total: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

// Agrupar por categoría
const byCategory = {};
bakFiles.forEach((f) => {
  let category = 'Otros';
  if (f.path.includes('i18n')) category = 'i18n/locales';
  else if (f.path.includes('backend')) category = 'backend';
  else if (f.path.includes('src')) category = 'src';
  else if (f.path.includes('docs')) category = 'docs';
  else if (f.path.startsWith('.env')) category = 'config';
  else if (f.path.startsWith('roadmap')) category = 'roadmap';

  if (!byCategory[category]) byCategory[category] = [];
  byCategory[category].push(f);
});

// Mostrar resumen
console.log('📊 Resumen por categoría:\n');
Object.entries(byCategory).forEach(([cat, files]) => {
  const catSize = files.reduce((sum, f) => sum + f.size, 0);
  const catSizeMB = (catSize / 1024 / 1024).toFixed(2);

  console.log(`  ${cat}: ${files.length} archivos (${catSizeMB} MB)`);

  files.slice(0, 3).forEach((f) => {
    console.log(`    - ${f.path} (${f.sizeKB} KB)`);
  });

  if (files.length > 3) {
    console.log(`    ... y ${files.length - 3} más`);
  }
  console.log();
});

if (isDryRun) {
  console.log('🔍 DRY-RUN: Archivos NO eliminados.\n');
  console.log('Para eliminar, ejecuta:');
  console.log('  node scripts/cleanupBakFilesForce.js\n');
  process.exit(0);
}

// Eliminar archivos
console.log('🗑️  Eliminando archivos...\n');

let deleted = 0;
let errors = 0;

bakFiles.forEach((f) => {
  try {
    fs.unlinkSync(f.fullPath);
    deleted++;
    if (deleted <= 10) {
      console.log(`  ✅ ${f.path}`);
    }
  } catch (err) {
    errors++;
    console.log(`  ❌ Error: ${f.path} - ${err.message}`);
  }
});

if (deleted > 10) {
  console.log(`  ... y ${deleted - 10} más eliminados`);
}

console.log();
console.log(`✅ Eliminados: ${deleted}/${bakFiles.length} archivos`);
console.log(`💾 Espacio liberado: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

if (errors > 0) {
  console.log(`⚠️  Errores: ${errors}`);
}

console.log('\n=========================================\n');
